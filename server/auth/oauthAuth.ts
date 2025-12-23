import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as TwitterStrategy } from "passport-twitter";
import session from "express-session";
import type { Express, RequestHandler, Request, Response } from "express";
import connectPg from "connect-pg-simple";
import { authStorage } from "../replit_integrations/auth/storage";
import { storage } from "../storage";
import * as jose from "jose";

// OAuth provider configuration types
interface OAuthConfig {
  google?: {
    clientId: string;
    clientSecret: string;
  };
  facebook?: {
    appId: string;
    appSecret: string;
  };
  twitter?: {
    consumerKey: string;
    consumerSecret: string;
  };
}

// Session user type
interface SessionUser {
  id: string;
  provider: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

declare global {
  namespace Express {
    interface User extends SessionUser {}
  }
}

// Get OAuth configuration from environment
function getOAuthConfig(): OAuthConfig {
  const config: OAuthConfig = {};

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    config.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  }

  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    config.facebook = {
      appId: process.env.FACEBOOK_APP_ID,
      appSecret: process.env.FACEBOOK_APP_SECRET,
    };
  }

  if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
    config.twitter = {
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    };
  }

  return config;
}

// Create session middleware
export function getSession() {
  const sessionTtl = 30 * 24 * 60 * 60 * 1000; // 30 days
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET || "vitalpath-secret-key",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
      sameSite: "lax",
    },
  });
}

// Create or update user profile on first login
async function ensureUserProfile(userId: string, profileData: {
  firstName?: string | null;
  lastName?: string | null;
}): Promise<void> {
  try {
    const existingProfile = await storage.getProfile(userId);
    if (!existingProfile) {
      await storage.createProfile({
        userId: userId,
        firstName: profileData.firstName || undefined,
        lastName: profileData.lastName || undefined,
        onboardingCompleted: false,
      });
    }
  } catch (error) {
    console.error("Error creating user profile on login:", error);
  }
}

// Apple token verification
async function verifyAppleToken(identityToken: string): Promise<{ sub: string; email?: string }> {
  const JWKS = jose.createRemoteJWKSet(
    new URL("https://appleid.apple.com/auth/keys")
  );

  const { payload } = await jose.jwtVerify(identityToken, JWKS, {
    issuer: "https://appleid.apple.com",
    audience: "com.vitalpath.app",
  });

  return {
    sub: payload.sub as string,
    email: payload.email as string | undefined,
  };
}

// Setup OAuth authentication
export async function setupOAuth(app: Express) {
  const config = getOAuthConfig();
  const baseUrl = process.env.PUBLIC_URL || `https://${process.env.REPL_SLUG}--${process.env.REPL_OWNER}.replit.app`;

  // Setup session and passport
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize/deserialize user
  passport.serializeUser((user: Express.User, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: Express.User, done) => {
    done(null, user);
  });

  // Google OAuth Strategy
  if (config.google) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: config.google.clientId,
          clientSecret: config.google.clientSecret,
          callbackURL: `${baseUrl}/api/auth/google/callback`,
          scope: ["profile", "email"],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            const { user, isNewUser } = await authStorage.findOrCreateUserByOAuth(
              "google",
              profile.id,
              {
                email,
                firstName: profile.name?.givenName,
                lastName: profile.name?.familyName,
                profileImageUrl: profile.photos?.[0]?.value,
              }
            );

            if (isNewUser) {
              await ensureUserProfile(user.id, {
                firstName: profile.name?.givenName,
                lastName: profile.name?.familyName,
              });
            }

            const sessionUser: SessionUser = {
              id: user.id,
              provider: "google",
              email: user.email || undefined,
              firstName: user.firstName || undefined,
              lastName: user.lastName || undefined,
              profileImageUrl: user.profileImageUrl || undefined,
            };

            done(null, sessionUser);
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );

    // Google routes
    app.get("/api/auth/google", passport.authenticate("google"));
    app.get(
      "/api/auth/google/callback",
      passport.authenticate("google", {
        successRedirect: "/",
        failureRedirect: "/login?error=google_auth_failed",
      })
    );
  }

  // Facebook OAuth Strategy
  if (config.facebook) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: config.facebook.appId,
          clientSecret: config.facebook.appSecret,
          callbackURL: `${baseUrl}/api/auth/facebook/callback`,
          profileFields: ["id", "emails", "name", "picture.type(large)"],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            const { user, isNewUser } = await authStorage.findOrCreateUserByOAuth(
              "facebook",
              profile.id,
              {
                email,
                firstName: profile.name?.givenName,
                lastName: profile.name?.familyName,
                profileImageUrl: profile.photos?.[0]?.value,
              }
            );

            if (isNewUser) {
              await ensureUserProfile(user.id, {
                firstName: profile.name?.givenName,
                lastName: profile.name?.familyName,
              });
            }

            const sessionUser: SessionUser = {
              id: user.id,
              provider: "facebook",
              email: user.email || undefined,
              firstName: user.firstName || undefined,
              lastName: user.lastName || undefined,
              profileImageUrl: user.profileImageUrl || undefined,
            };

            done(null, sessionUser);
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );

    // Facebook routes
    app.get("/api/auth/facebook", passport.authenticate("facebook", { scope: ["email"] }));
    app.get(
      "/api/auth/facebook/callback",
      passport.authenticate("facebook", {
        successRedirect: "/",
        failureRedirect: "/login?error=facebook_auth_failed",
      })
    );
  }

  // Twitter/X OAuth Strategy
  if (config.twitter) {
    passport.use(
      new TwitterStrategy(
        {
          consumerKey: config.twitter.consumerKey,
          consumerSecret: config.twitter.consumerSecret,
          callbackURL: `${baseUrl}/api/auth/twitter/callback`,
          includeEmail: true,
        },
        async (token, tokenSecret, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            const nameParts = profile.displayName?.split(" ") || [];
            const { user, isNewUser } = await authStorage.findOrCreateUserByOAuth(
              "twitter",
              profile.id,
              {
                email,
                firstName: nameParts[0],
                lastName: nameParts.slice(1).join(" ") || undefined,
                profileImageUrl: profile.photos?.[0]?.value?.replace("_normal", ""),
              }
            );

            if (isNewUser) {
              await ensureUserProfile(user.id, {
                firstName: nameParts[0],
                lastName: nameParts.slice(1).join(" "),
              });
            }

            const sessionUser: SessionUser = {
              id: user.id,
              provider: "twitter",
              email: user.email || undefined,
              firstName: user.firstName || undefined,
              lastName: user.lastName || undefined,
              profileImageUrl: user.profileImageUrl || undefined,
            };

            done(null, sessionUser);
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );

    // Twitter routes
    app.get("/api/auth/twitter", passport.authenticate("twitter"));
    app.get(
      "/api/auth/twitter/callback",
      passport.authenticate("twitter", {
        successRedirect: "/",
        failureRedirect: "/login?error=twitter_auth_failed",
      })
    );
  }

  // Apple Sign In (handled via POST from iOS native)
  app.post("/api/auth/apple", async (req: Request, res: Response) => {
    try {
      const { identityToken, email, givenName, familyName } = req.body;

      if (!identityToken) {
        res.status(400).json({ error: "Identity token is required" });
        return;
      }

      // Verify the Apple identity token
      const verifiedPayload = await verifyAppleToken(identityToken);

      const { user, isNewUser } = await authStorage.findOrCreateUserByOAuth(
        "apple",
        verifiedPayload.sub,
        {
          email: email || verifiedPayload.email,
          firstName: givenName,
          lastName: familyName,
          profileImageUrl: null,
        }
      );

      if (isNewUser) {
        await ensureUserProfile(user.id, {
          firstName: givenName,
          lastName: familyName,
        });
      }

      // Login the user via passport session
      const sessionUser: SessionUser = {
        id: user.id,
        provider: "apple",
        email: user.email || undefined,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        profileImageUrl: user.profileImageUrl || undefined,
      };

      req.login(sessionUser, (err) => {
        if (err) {
          console.error("Apple login error:", err);
          res.status(500).json({ error: "Authentication failed" });
          return;
        }
        res.json({ success: true, user: sessionUser });
      });
    } catch (error) {
      console.error("Apple auth error:", error);
      res.status(401).json({ error: "Invalid identity token" });
    }
  });

  // Logout route
  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
        }
        res.redirect("/");
      });
    });
  });

  // Get current user route
  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated() && req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  // Get available auth providers
  app.get("/api/auth/providers", (req, res) => {
    const providers = [];
    if (config.google) providers.push("google");
    if (config.facebook) providers.push("facebook");
    if (config.twitter) providers.push("twitter");
    providers.push("apple"); // Apple is always available for iOS native
    res.json({ providers });
  });

  // Get linked accounts for current user
  app.get("/api/auth/accounts", isAuthenticated, async (req, res) => {
    try {
      const accounts = await authStorage.getOAuthAccountsByUser(req.user!.id);
      res.json({
        accounts: accounts.map((a) => ({
          id: a.id,
          provider: a.provider,
          providerEmail: a.providerEmail,
          providerName: a.providerName,
          createdAt: a.createdAt,
        })),
      });
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ error: "Failed to fetch accounts" });
    }
  });

  // Unlink an OAuth account
  app.delete("/api/auth/accounts/:id", isAuthenticated, async (req, res) => {
    try {
      const accounts = await authStorage.getOAuthAccountsByUser(req.user!.id);

      // Don't allow unlinking the last account
      if (accounts.length <= 1) {
        res.status(400).json({ error: "Cannot unlink your only authentication method" });
        return;
      }

      const accountToDelete = accounts.find((a) => a.id === req.params.id);
      if (!accountToDelete) {
        res.status(404).json({ error: "Account not found" });
        return;
      }

      await authStorage.deleteOAuthAccount(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unlinking account:", error);
      res.status(500).json({ error: "Failed to unlink account" });
    }
  });
}

// Authentication middleware
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
};
