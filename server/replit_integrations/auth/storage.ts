import { users, oauthAccounts, type User, type UpsertUser, type OAuthAccount, type InsertOAuthAccount } from "@shared/models/auth";
import { db } from "../../db";
import { eq, and } from "drizzle-orm";

// Interface for auth storage operations
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // OAuth account methods
  getOAuthAccount(provider: string, providerAccountId: string): Promise<OAuthAccount | undefined>;
  getOAuthAccountsByUser(userId: string): Promise<OAuthAccount[]>;
  createOAuthAccount(account: InsertOAuthAccount): Promise<OAuthAccount>;
  updateOAuthAccountTokens(id: string, accessToken: string, refreshToken?: string, expiresAt?: Date): Promise<void>;
  deleteOAuthAccount(id: string): Promise<void>;

  // Find or create user by OAuth
  findOrCreateUserByOAuth(
    provider: string,
    providerAccountId: string,
    profileData: {
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      profileImageUrl?: string | null;
    }
  ): Promise<{ user: User; isNewUser: boolean }>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getOAuthAccount(provider: string, providerAccountId: string): Promise<OAuthAccount | undefined> {
    const [account] = await db
      .select()
      .from(oauthAccounts)
      .where(
        and(
          eq(oauthAccounts.provider, provider),
          eq(oauthAccounts.providerAccountId, providerAccountId)
        )
      );
    return account;
  }

  async getOAuthAccountsByUser(userId: string): Promise<OAuthAccount[]> {
    return db
      .select()
      .from(oauthAccounts)
      .where(eq(oauthAccounts.userId, userId));
  }

  async createOAuthAccount(account: InsertOAuthAccount): Promise<OAuthAccount> {
    const [created] = await db
      .insert(oauthAccounts)
      .values(account)
      .returning();
    return created;
  }

  async updateOAuthAccountTokens(
    id: string,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: Date
  ): Promise<void> {
    await db
      .update(oauthAccounts)
      .set({
        accessToken,
        refreshToken: refreshToken ?? undefined,
        tokenExpiresAt: expiresAt ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(oauthAccounts.id, id));
  }

  async deleteOAuthAccount(id: string): Promise<void> {
    await db.delete(oauthAccounts).where(eq(oauthAccounts.id, id));
  }

  async findOrCreateUserByOAuth(
    provider: string,
    providerAccountId: string,
    profileData: {
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      profileImageUrl?: string | null;
    }
  ): Promise<{ user: User; isNewUser: boolean }> {
    // Check if OAuth account already exists
    const existingOAuth = await this.getOAuthAccount(provider, providerAccountId);

    if (existingOAuth) {
      // User already linked this OAuth account
      const user = await this.getUser(existingOAuth.userId);
      if (!user) {
        throw new Error("OAuth account exists but user not found");
      }
      return { user, isNewUser: false };
    }

    // Check if user with this email already exists (for account linking)
    let user: User | undefined;
    let isNewUser = false;

    if (profileData.email) {
      user = await this.getUserByEmail(profileData.email);
    }

    if (!user) {
      // Create new user
      user = await this.upsertUser({
        email: profileData.email ?? undefined,
        firstName: profileData.firstName ?? undefined,
        lastName: profileData.lastName ?? undefined,
        profileImageUrl: profileData.profileImageUrl ?? undefined,
      });
      isNewUser = true;
    }

    // Link OAuth account to user
    await this.createOAuthAccount({
      userId: user.id,
      provider,
      providerAccountId,
      providerEmail: profileData.email ?? undefined,
      providerName: profileData.firstName
        ? `${profileData.firstName}${profileData.lastName ? ' ' + profileData.lastName : ''}`
        : undefined,
      providerAvatar: profileData.profileImageUrl ?? undefined,
    });

    return { user, isNewUser };
  }
}

export const authStorage = new AuthStorage();
