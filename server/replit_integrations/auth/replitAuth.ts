import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";
import { storage } from "../../storage";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

// Singleton session store to prevent multiple connections
let sessionMiddleware: ReturnType<typeof session> | null = null;

export function getSession() {
  if (sessionMiddleware) {
    return sessionMiddleware;
  }

  const sessionTtl = 30 * 24 * 60 * 60 * 1000; // 30 days (extended from 1 week)
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true, // Auto-create sessions table if it doesn't exist
    ttl: sessionTtl,
    tableName: "sessions",
    pruneSessionInterval: 60 * 15, // Prune expired sessions every 15 minutes
  });

  sessionMiddleware = session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset cookie expiration on each request (keeps active users logged in)
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax", // Helps with cross-site requests
      maxAge: sessionTtl,
    },
  });

  return sessionMiddleware;
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  const userId = claims["sub"];

  // Upsert user in users table
  await authStorage.upsertUser({
    id: userId,
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });

  // Check if profile exists, create basic one if not
  try {
    const existingProfile = await storage.getProfile(userId);
    if (!existingProfile) {
      await storage.createProfile({
        userId: userId,
        firstName: claims["first_name"],
        lastName: claims["last_name"],
        onboardingCompleted: false,
      });
    }
  } catch (error) {
    console.error("Error creating user profile on login:", error);
    // Don't throw - we don't want to block login if profile creation fails
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      // Destroy the session completely
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
        }

        // Clear the session cookie
        res.clearCookie("connect.sid", {
          path: "/",
          httpOnly: true,
          secure: true,
        });

        // Redirect to Replit end session URL
        try {
          const endSessionUrl = client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `https://${req.hostname}`,
          });
          res.redirect(endSessionUrl.href);
        } catch (error) {
          // If end session URL fails, just redirect to home
          console.error("Error building end session URL:", error);
          res.redirect("/");
        }
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // If no expires_at, allow the request (session-based auth)
  if (!user.expires_at) {
    return next();
  }

  const now = Math.floor(Date.now() / 1000);

  // Add 5 minute buffer before expiration to proactively refresh
  const bufferSeconds = 5 * 60;
  if (now <= user.expires_at - bufferSeconds) {
    return next();
  }

  // Token expired or about to expire, try to refresh
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    // No refresh token, but session might still be valid
    // Allow request to continue if session exists
    console.log("[Auth] No refresh token, but session exists - allowing request");
    return next();
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    console.log("[Auth] Successfully refreshed token");
    return next();
  } catch (error) {
    // Token refresh failed, but don't immediately kick user out
    // Allow the request if session is still valid
    console.error("[Auth] Token refresh failed:", error);
    // Let the request proceed - the session might still be valid
    return next();
  }
};
