import { eq, and, desc, gte, lte, ilike } from "drizzle-orm";
import { db } from "./db";
import {
  userProfiles,
  onboardingAssessments,
  dailyLogs,
  foodEntries,
  exerciseLogs,
  chatMessages,
  wearableConnections,
  workoutTemplates,
  educationalContent,
  foodDatabase,
  notifications,
  profileChanges,
  healthNotes,
  bodyMeasurements,
  type UserProfile,
  type InsertUserProfile,
  type OnboardingAssessment,
  type InsertOnboardingAssessment,
  type DailyLog,
  type InsertDailyLog,
  type FoodEntry,
  type InsertFoodEntry,
  type ExerciseLog,
  type InsertExerciseLog,
  type ChatMessage,
  type InsertChatMessage,
  type WearableConnection,
  type InsertWearableConnection,
  type WorkoutTemplate,
  type EducationalContent,
  type FoodDatabaseItem,
  type Notification,
  type InsertNotification,
  type ProfileChange,
  type InsertProfileChange,
  type HealthNote,
  type InsertHealthNote,
  type BodyMeasurement,
  type InsertBodyMeasurement,
} from "@shared/schema";

export interface IStorage {
  // User Profiles (User operations handled by auth module)
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
  getFoodEntriesRange(userId: string, startDate: string, endDate: string): Promise<FoodEntry[]>;
  createFoodEntry(entry: InsertFoodEntry): Promise<FoodEntry>;
  deleteFoodEntry(id: string, userId: string): Promise<boolean>;

  // Exercise Logs
  getExerciseLogs(userId: string, date: string): Promise<ExerciseLog[]>;
  getExerciseLogsRange(userId: string, startDate: string, endDate: string): Promise<ExerciseLog[]>;
  getExerciseLogsByWorkout(userId: string, date: string, workoutTemplateId: string): Promise<ExerciseLog[]>;
  createExerciseLog(log: InsertExerciseLog): Promise<ExerciseLog>;
  updateExerciseLog(id: string, userId: string, updates: Partial<InsertExerciseLog>): Promise<ExerciseLog | undefined>;
  deleteExerciseLog(id: string, userId: string): Promise<boolean>;
  deleteExerciseLogsByDate(userId: string, date: string): Promise<void>;

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

  // Food Database
  searchFoods(query: string): Promise<FoodDatabaseItem[]>;
  getAllFoods(): Promise<FoodDatabaseItem[]>;

  // Notifications
  getNotifications(userId: string, limit?: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string, userId: string): Promise<boolean>;
  markAllNotificationsAsRead(userId: string): Promise<void>;

  // Profile Changes History
  getProfileChanges(userId: string, limit?: number): Promise<ProfileChange[]>;
  getProfileChangesByCategory(userId: string, category: string): Promise<ProfileChange[]>;
  getProfileChangesByChatMessage(chatMessageId: string, userId: string): Promise<ProfileChange[]>;
  createProfileChange(change: InsertProfileChange): Promise<ProfileChange>;
  getRecentChangeSummary(userId: string, days?: number): Promise<ProfileChange[]>;

  // Health Notes
  getHealthNotes(userId: string, activeOnly?: boolean): Promise<HealthNote[]>;
  getRecentHealthNotes(userId: string, days?: number): Promise<HealthNote[]>;
  createHealthNote(note: InsertHealthNote): Promise<HealthNote>;
  updateHealthNote(id: string, userId: string, updates: Partial<InsertHealthNote>): Promise<HealthNote | undefined>;
  deleteHealthNote(id: string, userId: string): Promise<boolean>;

  // Body Measurements
  getBodyMeasurement(userId: string, date: string): Promise<BodyMeasurement | undefined>;
  getBodyMeasurements(userId: string, limit?: number): Promise<BodyMeasurement[]>;
  getBodyMeasurementsRange(userId: string, startDate: string, endDate: string): Promise<BodyMeasurement[]>;
  createOrUpdateBodyMeasurement(measurement: InsertBodyMeasurement): Promise<BodyMeasurement>;
  deleteBodyMeasurement(id: string, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User Profiles (User operations handled by auth module)
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
      // Only update fields that are explicitly provided (not undefined)
      // This preserves existing values for fields not being updated
      const updates: Record<string, any> = {};

      // List all possible fields and only include non-undefined ones
      const fields = [
        'weightKg', 'caloriesConsumed', 'proteinGrams', 'carbsGrams', 'fatGrams',
        'steps', 'sleepHours', 'sleepQuality', 'energyLevel', 'stressLevel',
        'moodRating', 'workoutCompleted', 'workoutType', 'notes', 'waterLiters'
      ] as const;

      for (const field of fields) {
        if (log[field as keyof InsertDailyLog] !== undefined) {
          updates[field] = log[field as keyof InsertDailyLog];
        }
      }

      if (Object.keys(updates).length > 0) {
        const result = await db
          .update(dailyLogs)
          .set(updates)
          .where(eq(dailyLogs.id, existing.id))
          .returning();
        return result[0];
      }

      return existing;
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

  async getFoodEntriesRange(userId: string, startDate: string, endDate: string): Promise<FoodEntry[]> {
    return db
      .select()
      .from(foodEntries)
      .where(
        and(
          eq(foodEntries.userId, userId),
          gte(foodEntries.logDate, startDate),
          lte(foodEntries.logDate, endDate)
        )
      )
      .orderBy(desc(foodEntries.logDate), foodEntries.createdAt);
  }

  async createFoodEntry(entry: InsertFoodEntry): Promise<FoodEntry> {
    const result = await db.insert(foodEntries).values(entry).returning();
    // Sync nutrition totals to daily_logs
    await this.syncDailyNutrition(entry.userId, entry.logDate);
    return result[0];
  }

  async deleteFoodEntry(id: string, userId: string): Promise<boolean> {
    // Get the entry first to know which date to sync
    const entries = await db
      .select()
      .from(foodEntries)
      .where(and(eq(foodEntries.id, id), eq(foodEntries.userId, userId)));

    if (entries.length === 0) return false;

    const entry = entries[0];
    const result = await db
      .delete(foodEntries)
      .where(and(eq(foodEntries.id, id), eq(foodEntries.userId, userId)))
      .returning();

    if (result.length > 0) {
      // Sync nutrition totals to daily_logs after deletion
      await this.syncDailyNutrition(userId, entry.logDate);
    }

    return result.length > 0;
  }

  /**
   * Recalculates nutrition totals from food_entries and updates daily_logs
   * This ensures the dashboard displays accurate calorie/macro data
   * Preserves other daily log fields like steps, sleep, weight, etc.
   */
  async syncDailyNutrition(userId: string, date: string): Promise<void> {
    // Get all food entries for this date
    const entries = await this.getFoodEntries(userId, date);

    // Calculate totals
    const totals = entries.reduce(
      (acc, entry) => ({
        calories: acc.calories + (entry.calories || 0),
        protein: acc.protein + (entry.proteinGrams || 0),
        carbs: acc.carbs + (entry.carbsGrams || 0),
        fat: acc.fat + (entry.fatGrams || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    // Get existing daily log to preserve other fields
    const existing = await this.getDailyLog(userId, date);

    if (existing) {
      // Update only nutrition fields, preserve everything else
      await db
        .update(dailyLogs)
        .set({
          caloriesConsumed: totals.calories,
          proteinGrams: totals.protein,
          carbsGrams: totals.carbs,
          fatGrams: totals.fat,
        })
        .where(eq(dailyLogs.id, existing.id));
    } else {
      // Create new daily log with just nutrition data
      await db.insert(dailyLogs).values({
        userId,
        logDate: date,
        caloriesConsumed: totals.calories,
        proteinGrams: totals.protein,
        carbsGrams: totals.carbs,
        fatGrams: totals.fat,
      });
    }
  }

  // Exercise Logs
  async getExerciseLogs(userId: string, date: string): Promise<ExerciseLog[]> {
    return db
      .select()
      .from(exerciseLogs)
      .where(and(eq(exerciseLogs.userId, userId), eq(exerciseLogs.logDate, date)))
      .orderBy(exerciseLogs.exerciseOrder);
  }

  async getExerciseLogsRange(userId: string, startDate: string, endDate: string): Promise<ExerciseLog[]> {
    return db
      .select()
      .from(exerciseLogs)
      .where(
        and(
          eq(exerciseLogs.userId, userId),
          gte(exerciseLogs.logDate, startDate),
          lte(exerciseLogs.logDate, endDate)
        )
      )
      .orderBy(desc(exerciseLogs.logDate), exerciseLogs.exerciseOrder);
  }

  async getExerciseLogsByWorkout(userId: string, date: string, workoutTemplateId: string): Promise<ExerciseLog[]> {
    return db
      .select()
      .from(exerciseLogs)
      .where(
        and(
          eq(exerciseLogs.userId, userId),
          eq(exerciseLogs.logDate, date),
          eq(exerciseLogs.workoutTemplateId, workoutTemplateId)
        )
      )
      .orderBy(exerciseLogs.exerciseOrder);
  }

  async createExerciseLog(log: InsertExerciseLog): Promise<ExerciseLog> {
    const result = await db.insert(exerciseLogs).values(log).returning();
    return result[0];
  }

  async updateExerciseLog(id: string, userId: string, updates: Partial<InsertExerciseLog>): Promise<ExerciseLog | undefined> {
    const result = await db
      .update(exerciseLogs)
      .set(updates)
      .where(and(eq(exerciseLogs.id, id), eq(exerciseLogs.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteExerciseLog(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(exerciseLogs)
      .where(and(eq(exerciseLogs.id, id), eq(exerciseLogs.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async deleteExerciseLogsByDate(userId: string, date: string): Promise<void> {
    await db
      .delete(exerciseLogs)
      .where(and(eq(exerciseLogs.userId, userId), eq(exerciseLogs.logDate, date)));
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

  // Food Database
  async searchFoods(query: string): Promise<FoodDatabaseItem[]> {
    return db
      .select()
      .from(foodDatabase)
      .where(ilike(foodDatabase.name, `%${query}%`))
      .limit(20);
  }

  async getAllFoods(): Promise<FoodDatabaseItem[]> {
    return db.select().from(foodDatabase);
  }

  // Notifications
  async getNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result.length;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async markNotificationAsRead(id: string, userId: string): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  // Profile Changes History
  async getProfileChanges(userId: string, limit: number = 50): Promise<ProfileChange[]> {
    return db
      .select()
      .from(profileChanges)
      .where(eq(profileChanges.userId, userId))
      .orderBy(desc(profileChanges.createdAt))
      .limit(limit);
  }

  async getProfileChangesByCategory(userId: string, category: string): Promise<ProfileChange[]> {
    return db
      .select()
      .from(profileChanges)
      .where(and(eq(profileChanges.userId, userId), eq(profileChanges.changeCategory, category)))
      .orderBy(desc(profileChanges.createdAt));
  }

  async getProfileChangesByChatMessage(chatMessageId: string, userId: string): Promise<ProfileChange[]> {
    return db
      .select()
      .from(profileChanges)
      .where(and(eq(profileChanges.chatMessageId, chatMessageId), eq(profileChanges.userId, userId)))
      .orderBy(desc(profileChanges.createdAt));
  }

  async createProfileChange(change: InsertProfileChange): Promise<ProfileChange> {
    const result = await db.insert(profileChanges).values(change).returning();
    return result[0];
  }

  async getRecentChangeSummary(userId: string, days: number = 30): Promise<ProfileChange[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return db
      .select()
      .from(profileChanges)
      .where(
        and(
          eq(profileChanges.userId, userId),
          gte(profileChanges.createdAt, startDate)
        )
      )
      .orderBy(desc(profileChanges.createdAt));
  }

  // Health Notes
  async getHealthNotes(userId: string, activeOnly: boolean = true): Promise<HealthNote[]> {
    const now = new Date();

    if (activeOnly) {
      // Get active notes that haven't expired
      const result = await db
        .select()
        .from(healthNotes)
        .where(eq(healthNotes.userId, userId))
        .orderBy(desc(healthNotes.createdAt));

      // Filter out expired notes in JS since Drizzle OR conditions are complex
      return result.filter(note =>
        note.isActive && (!note.expiresAt || new Date(note.expiresAt) > now)
      );
    }

    return db
      .select()
      .from(healthNotes)
      .where(eq(healthNotes.userId, userId))
      .orderBy(desc(healthNotes.createdAt));
  }

  async getRecentHealthNotes(userId: string, days: number = 14): Promise<HealthNote[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await db
      .select()
      .from(healthNotes)
      .where(
        and(
          eq(healthNotes.userId, userId),
          gte(healthNotes.createdAt, startDate)
        )
      )
      .orderBy(desc(healthNotes.createdAt));

    // Filter out expired notes
    const now = new Date();
    return result.filter(note =>
      note.isActive && (!note.expiresAt || new Date(note.expiresAt) > now)
    );
  }

  async createHealthNote(note: InsertHealthNote): Promise<HealthNote> {
    const result = await db.insert(healthNotes).values(note).returning();
    return result[0];
  }

  async updateHealthNote(id: string, userId: string, updates: Partial<InsertHealthNote>): Promise<HealthNote | undefined> {
    const result = await db
      .update(healthNotes)
      .set(updates)
      .where(and(eq(healthNotes.id, id), eq(healthNotes.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteHealthNote(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(healthNotes)
      .where(and(eq(healthNotes.id, id), eq(healthNotes.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Body Measurements
  async getBodyMeasurement(userId: string, date: string): Promise<BodyMeasurement | undefined> {
    const result = await db
      .select()
      .from(bodyMeasurements)
      .where(and(eq(bodyMeasurements.userId, userId), eq(bodyMeasurements.measurementDate, date)));
    return result[0];
  }

  async getBodyMeasurements(userId: string, limit: number = 50): Promise<BodyMeasurement[]> {
    return db
      .select()
      .from(bodyMeasurements)
      .where(eq(bodyMeasurements.userId, userId))
      .orderBy(desc(bodyMeasurements.measurementDate))
      .limit(limit);
  }

  async getBodyMeasurementsRange(userId: string, startDate: string, endDate: string): Promise<BodyMeasurement[]> {
    return db
      .select()
      .from(bodyMeasurements)
      .where(
        and(
          eq(bodyMeasurements.userId, userId),
          gte(bodyMeasurements.measurementDate, startDate),
          lte(bodyMeasurements.measurementDate, endDate)
        )
      )
      .orderBy(desc(bodyMeasurements.measurementDate));
  }

  async createOrUpdateBodyMeasurement(measurement: InsertBodyMeasurement): Promise<BodyMeasurement> {
    const existing = await this.getBodyMeasurement(measurement.userId, measurement.measurementDate);

    if (existing) {
      // Update only provided fields
      const updates: Record<string, any> = {};
      const fields = [
        'chestCm', 'waistCm', 'hipsCm',
        'leftBicepCm', 'rightBicepCm', 'leftForearmCm', 'rightForearmCm',
        'leftThighCm', 'rightThighCm', 'leftCalfCm', 'rightCalfCm',
        'neckCm', 'shouldersCm', 'bodyFatPercentage', 'notes'
      ] as const;

      for (const field of fields) {
        if (measurement[field as keyof InsertBodyMeasurement] !== undefined) {
          updates[field] = measurement[field as keyof InsertBodyMeasurement];
        }
      }

      if (Object.keys(updates).length > 0) {
        const result = await db
          .update(bodyMeasurements)
          .set(updates)
          .where(eq(bodyMeasurements.id, existing.id))
          .returning();
        return result[0];
      }

      return existing;
    }

    const result = await db.insert(bodyMeasurements).values(measurement).returning();
    return result[0];
  }

  async deleteBodyMeasurement(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(bodyMeasurements)
      .where(and(eq(bodyMeasurements.id, id), eq(bodyMeasurements.userId, userId)))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
