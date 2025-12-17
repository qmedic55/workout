import { eq, and, desc, gte, lte } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  userProfiles,
  onboardingAssessments,
  dailyLogs,
  foodEntries,
  chatMessages,
  wearableConnections,
  workoutTemplates,
  educationalContent,
  type User,
  type InsertUser,
  type UserProfile,
  type InsertUserProfile,
  type OnboardingAssessment,
  type InsertOnboardingAssessment,
  type DailyLog,
  type InsertDailyLog,
  type FoodEntry,
  type InsertFoodEntry,
  type ChatMessage,
  type InsertChatMessage,
  type WearableConnection,
  type InsertWearableConnection,
  type WorkoutTemplate,
  type EducationalContent,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // User Profiles
  getProfile(userId: string): Promise<UserProfile | undefined>;
  createProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateProfile(userId: string, updates: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;

  // Onboarding
  getOnboardingAssessment(userId: string): Promise<OnboardingAssessment | undefined>;
  createOnboardingAssessment(assessment: InsertOnboardingAssessment): Promise<OnboardingAssessment>;

  // Daily Logs
  getDailyLog(userId: string, date: string): Promise<DailyLog | undefined>;
  getDailyLogs(userId: string, startDate?: string, endDate?: string): Promise<DailyLog[]>;
  createOrUpdateDailyLog(log: InsertDailyLog): Promise<DailyLog>;

  // Food Entries
  getFoodEntries(userId: string, date: string): Promise<FoodEntry[]>;
  createFoodEntry(entry: InsertFoodEntry): Promise<FoodEntry>;
  deleteFoodEntry(id: string, userId: string): Promise<boolean>;

  // Chat Messages
  getChatMessages(userId: string, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // Wearable Connections
  getWearableConnections(userId: string): Promise<WearableConnection[]>;
  getWearableConnection(userId: string, provider: string): Promise<WearableConnection | undefined>;
  createOrUpdateWearableConnection(connection: InsertWearableConnection): Promise<WearableConnection>;
  deleteWearableConnection(userId: string, provider: string): Promise<boolean>;

  // Workout Templates
  getWorkoutTemplates(): Promise<WorkoutTemplate[]>;

  // Educational Content
  getEducationalContent(): Promise<EducationalContent[]>;
  getEducationalContentBySlug(slug: string): Promise<EducationalContent | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // User Profiles
  async getProfile(userId: string): Promise<UserProfile | undefined> {
    const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return result[0];
  }

  async createProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const result = await db.insert(userProfiles).values(profile).returning();
    return result[0];
  }

  async updateProfile(userId: string, updates: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const result = await db
      .update(userProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return result[0];
  }

  // Onboarding
  async getOnboardingAssessment(userId: string): Promise<OnboardingAssessment | undefined> {
    const result = await db.select().from(onboardingAssessments).where(eq(onboardingAssessments.userId, userId));
    return result[0];
  }

  async createOnboardingAssessment(assessment: InsertOnboardingAssessment): Promise<OnboardingAssessment> {
    const result = await db.insert(onboardingAssessments).values(assessment).returning();
    return result[0];
  }

  // Daily Logs
  async getDailyLog(userId: string, date: string): Promise<DailyLog | undefined> {
    const result = await db
      .select()
      .from(dailyLogs)
      .where(and(eq(dailyLogs.userId, userId), eq(dailyLogs.logDate, date)));
    return result[0];
  }

  async getDailyLogs(userId: string, startDate?: string, endDate?: string): Promise<DailyLog[]> {
    // Build conditions array for proper filtering
    const conditions = [eq(dailyLogs.userId, userId)];
    
    if (startDate) {
      conditions.push(gte(dailyLogs.logDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(dailyLogs.logDate, endDate));
    }

    const result = await db
      .select()
      .from(dailyLogs)
      .where(and(...conditions))
      .orderBy(desc(dailyLogs.logDate));
    
    return result;
  }

  async createOrUpdateDailyLog(log: InsertDailyLog): Promise<DailyLog> {
    const existing = await this.getDailyLog(log.userId, log.logDate);
    
    if (existing) {
      const result = await db
        .update(dailyLogs)
        .set(log)
        .where(eq(dailyLogs.id, existing.id))
        .returning();
      return result[0];
    }
    
    const result = await db.insert(dailyLogs).values(log).returning();
    return result[0];
  }

  // Food Entries
  async getFoodEntries(userId: string, date: string): Promise<FoodEntry[]> {
    return db
      .select()
      .from(foodEntries)
      .where(and(eq(foodEntries.userId, userId), eq(foodEntries.logDate, date)))
      .orderBy(foodEntries.createdAt);
  }

  async createFoodEntry(entry: InsertFoodEntry): Promise<FoodEntry> {
    const result = await db.insert(foodEntries).values(entry).returning();
    return result[0];
  }

  async deleteFoodEntry(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(foodEntries)
      .where(and(eq(foodEntries.id, id), eq(foodEntries.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Chat Messages
  async getChatMessages(userId: string, limit: number = 50): Promise<ChatMessage[]> {
    return db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(chatMessages.createdAt)
      .limit(limit);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const result = await db.insert(chatMessages).values(message).returning();
    return result[0];
  }

  // Wearable Connections
  async getWearableConnections(userId: string): Promise<WearableConnection[]> {
    return db.select().from(wearableConnections).where(eq(wearableConnections.userId, userId));
  }

  async getWearableConnection(userId: string, provider: string): Promise<WearableConnection | undefined> {
    const result = await db
      .select()
      .from(wearableConnections)
      .where(and(eq(wearableConnections.userId, userId), eq(wearableConnections.provider, provider)));
    return result[0];
  }

  async createOrUpdateWearableConnection(connection: InsertWearableConnection): Promise<WearableConnection> {
    const existing = await this.getWearableConnection(connection.userId, connection.provider);
    
    if (existing) {
      const result = await db
        .update(wearableConnections)
        .set(connection)
        .where(eq(wearableConnections.id, existing.id))
        .returning();
      return result[0];
    }
    
    const result = await db.insert(wearableConnections).values(connection).returning();
    return result[0];
  }

  async deleteWearableConnection(userId: string, provider: string): Promise<boolean> {
    const result = await db
      .delete(wearableConnections)
      .where(and(eq(wearableConnections.userId, userId), eq(wearableConnections.provider, provider)))
      .returning();
    return result.length > 0;
  }

  // Workout Templates
  async getWorkoutTemplates(): Promise<WorkoutTemplate[]> {
    return db.select().from(workoutTemplates);
  }

  // Educational Content
  async getEducationalContent(): Promise<EducationalContent[]> {
    return db.select().from(educationalContent);
  }

  async getEducationalContentBySlug(slug: string): Promise<EducationalContent | undefined> {
    const result = await db.select().from(educationalContent).where(eq(educationalContent.slug, slug));
    return result[0];
  }
}

export const storage = new DatabaseStorage();
