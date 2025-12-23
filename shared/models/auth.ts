import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // OpenAI Assistant Thread ID for persistent AI memory per user
  assistantThreadId: varchar("assistant_thread_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// OAuth accounts table - links OAuth provider accounts to users
export const oauthAccounts = pgTable("oauth_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // OAuth provider info
  provider: varchar("provider", { length: 50 }).notNull(), // google, apple, facebook, twitter
  providerAccountId: varchar("provider_account_id").notNull(), // The user's ID from the provider

  // Optional tokens (for providers that need refresh)
  accessToken: varchar("access_token"),
  refreshToken: varchar("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),

  // Profile data from provider
  providerEmail: varchar("provider_email"),
  providerName: varchar("provider_name"),
  providerAvatar: varchar("provider_avatar"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Ensure a provider account can only be linked to one user
  index("idx_oauth_provider_account").on(table.provider, table.providerAccountId),
  // Quick lookup by user
  index("idx_oauth_user").on(table.userId),
]);

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type OAuthAccount = typeof oauthAccounts.$inferSelect;
export type InsertOAuthAccount = typeof oauthAccounts.$inferInsert;
