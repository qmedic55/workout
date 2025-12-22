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
  mealTemplates,
  goals,
  milestones,
  publicProfiles,
  shareEvents,
  userMilestones,
  progressivePrompts,
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
  type MealTemplate,
  type InsertMealTemplate,
  type Goal,
  type InsertGoal,
  type Milestone,
  type InsertMilestone,
  type PublicProfile,
  type InsertPublicProfile,
  type ShareEvent,
  type InsertShareEvent,
  type UserMilestone,
  type InsertUserMilestone,
  type ProgressivePrompt,
  type InsertProgressivePrompt,
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
  createOrUpdateDailyLog(log: InsertDailyLog, options?: { accumulate?: boolean }): Promise<DailyLog>;

  // Food Entries
  getFoodEntries(userId: string, date: string): Promise<FoodEntry[]>;
  getFoodEntriesRange(userId: string, startDate: string, endDate: string): Promise<FoodEntry[]>;
  createFoodEntry(entry: InsertFoodEntry): Promise<FoodEntry>;
  deleteFoodEntry(id: string, userId: string): Promise<boolean>;

  // Exercise Logs
  getExerciseLogs(userId: string, date: string): Promise<ExerciseLog[]>;
  getExerciseLogsRange(userId: string, startDate: string, endDate: string): Promise<ExerciseLog[]>;
  getExerciseLogsByWorkout(userId: string, date: string, workoutTemplateId: string): Promise<ExerciseLog[]>;
  getExerciseLogsAll(userId: string): Promise<ExerciseLog[]>;
  getAllDailyLogs(userId: string): Promise<DailyLog[]>;
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

  // Meal Templates
  getMealTemplates(userId: string): Promise<MealTemplate[]>;
  getMealTemplate(id: string, userId: string): Promise<MealTemplate | undefined>;
  createMealTemplate(template: InsertMealTemplate): Promise<MealTemplate>;
  updateMealTemplate(id: string, userId: string, updates: Partial<InsertMealTemplate>): Promise<MealTemplate | undefined>;
  deleteMealTemplate(id: string, userId: string): Promise<boolean>;
  incrementMealTemplateUsage(id: string, userId: string): Promise<void>;

  // Goals
  getGoals(userId: string, status?: string): Promise<Goal[]>;
  getGoal(id: string, userId: string): Promise<Goal | undefined>;
  getActiveGoals(userId: string, category?: string): Promise<Goal[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: string, userId: string, updates: Partial<InsertGoal>): Promise<Goal | undefined>;
  deleteGoal(id: string, userId: string): Promise<boolean>;
  completeGoal(id: string, userId: string): Promise<Goal | undefined>;
  abandonGoal(id: string, userId: string): Promise<Goal | undefined>;

  // Milestones
  getMilestones(goalId: string, userId: string): Promise<Milestone[]>;
  getMilestone(id: string, userId: string): Promise<Milestone | undefined>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestone(id: string, userId: string, updates: Partial<InsertMilestone>): Promise<Milestone | undefined>;
  deleteMilestone(id: string, userId: string): Promise<boolean>;
  completeMilestone(id: string, userId: string): Promise<Milestone | undefined>;

  // Public Profiles
  getPublicProfile(userId: string): Promise<PublicProfile | undefined>;
  getPublicProfileByUsername(username: string): Promise<PublicProfile | undefined>;
  createPublicProfile(profile: InsertPublicProfile): Promise<PublicProfile>;
  updatePublicProfile(userId: string, updates: Partial<InsertPublicProfile>): Promise<PublicProfile | undefined>;
  isUsernameAvailable(username: string): Promise<boolean>;

  // Share Events
  createShareEvent(event: InsertShareEvent): Promise<ShareEvent>;
  getShareEvents(userId: string, limit?: number): Promise<ShareEvent[]>;

  // User Milestones (first-week engagement tracking)
  getUserMilestones(userId: string): Promise<UserMilestone[]>;
  getUserMilestone(userId: string, milestoneKey: string): Promise<UserMilestone | undefined>;
  createUserMilestone(milestone: InsertUserMilestone): Promise<UserMilestone>;
  markMilestoneSeen(userId: string, milestoneKey: string): Promise<UserMilestone | undefined>;
  getUnseenMilestones(userId: string): Promise<UserMilestone[]>;

  // Progressive Prompts (collect data over first week)
  getProgressivePrompts(userId: string): Promise<ProgressivePrompt[]>;
  getProgressivePrompt(userId: string, promptKey: string): Promise<ProgressivePrompt | undefined>;
  createProgressivePrompt(prompt: InsertProgressivePrompt): Promise<ProgressivePrompt>;
  getNextProgressivePrompt(userId: string): Promise<{ promptKey: string; question: string; options: { value: string; label: string }[]; skipLabel: string } | null>;
  getAnsweredPromptKeys(userId: string): Promise<string[]>;
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

  async createOrUpdateDailyLog(log: InsertDailyLog, options?: { accumulate?: boolean }): Promise<DailyLog> {
    const existing = await this.getDailyLog(log.userId, log.logDate);

    if (existing) {
      // Only update fields that are explicitly provided (not undefined)
      // This preserves existing values for fields not being updated
      const updates: Record<string, any> = {};

      // Fields that should ACCUMULATE when options.accumulate is true
      // (e.g., steps: 7500 + 1000 = 8500)
      const accumulativeFields = ['steps', 'waterLiters'] as const;

      // Fields that should REPLACE (not accumulate)
      const replaceFields = [
        'weightKg', 'caloriesConsumed', 'proteinGrams', 'carbsGrams', 'fatGrams',
        'sleepHours', 'sleepQuality', 'energyLevel', 'stressLevel',
        'moodRating', 'workoutCompleted', 'workoutType', 'notes'
      ] as const;

      // Handle accumulative fields - ADD to existing value if accumulate option is set
      for (const field of accumulativeFields) {
        const newValue = log[field as keyof InsertDailyLog];
        if (newValue !== undefined && typeof newValue === 'number') {
          const existingValue = existing[field as keyof DailyLog];
          if (options?.accumulate && typeof existingValue === 'number') {
            // Accumulate: add new value to existing
            updates[field] = existingValue + newValue;
          } else {
            // Replace: use new value directly
            updates[field] = newValue;
          }
        }
      }

      // Handle replace fields - always replace existing value
      for (const field of replaceFields) {
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

  async getExerciseLogsAll(userId: string): Promise<ExerciseLog[]> {
    return db
      .select()
      .from(exerciseLogs)
      .where(eq(exerciseLogs.userId, userId))
      .orderBy(desc(exerciseLogs.logDate), exerciseLogs.exerciseOrder);
  }

  async getAllDailyLogs(userId: string): Promise<DailyLog[]> {
    return db
      .select()
      .from(dailyLogs)
      .where(eq(dailyLogs.userId, userId))
      .orderBy(desc(dailyLogs.logDate));
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

  // Meal Templates
  async getMealTemplates(userId: string): Promise<MealTemplate[]> {
    return db
      .select()
      .from(mealTemplates)
      .where(eq(mealTemplates.userId, userId))
      .orderBy(desc(mealTemplates.usageCount), desc(mealTemplates.lastUsedAt));
  }

  async getMealTemplate(id: string, userId: string): Promise<MealTemplate | undefined> {
    const result = await db
      .select()
      .from(mealTemplates)
      .where(and(eq(mealTemplates.id, id), eq(mealTemplates.userId, userId)));
    return result[0];
  }

  async createMealTemplate(template: InsertMealTemplate): Promise<MealTemplate> {
    const result = await db.insert(mealTemplates).values(template).returning();
    return result[0];
  }

  async updateMealTemplate(id: string, userId: string, updates: Partial<InsertMealTemplate>): Promise<MealTemplate | undefined> {
    const result = await db
      .update(mealTemplates)
      .set(updates)
      .where(and(eq(mealTemplates.id, id), eq(mealTemplates.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteMealTemplate(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(mealTemplates)
      .where(and(eq(mealTemplates.id, id), eq(mealTemplates.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async incrementMealTemplateUsage(id: string, userId: string): Promise<void> {
    const template = await this.getMealTemplate(id, userId);
    if (template) {
      await db
        .update(mealTemplates)
        .set({
          usageCount: (template.usageCount || 0) + 1,
          lastUsedAt: new Date(),
        })
        .where(eq(mealTemplates.id, id));
    }
  }

  // Goals
  async getGoals(userId: string, status?: string): Promise<Goal[]> {
    const conditions = [eq(goals.userId, userId)];
    if (status) {
      conditions.push(eq(goals.status, status));
    }
    return db
      .select()
      .from(goals)
      .where(and(...conditions))
      .orderBy(desc(goals.createdAt));
  }

  async getGoal(id: string, userId: string): Promise<Goal | undefined> {
    const result = await db
      .select()
      .from(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)));
    return result[0];
  }

  async getActiveGoals(userId: string, category?: string): Promise<Goal[]> {
    const conditions = [eq(goals.userId, userId), eq(goals.status, "active")];
    if (category) {
      conditions.push(eq(goals.category, category));
    }
    return db
      .select()
      .from(goals)
      .where(and(...conditions))
      .orderBy(desc(goals.createdAt));
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const result = await db.insert(goals).values(goal).returning();
    return result[0];
  }

  async updateGoal(id: string, userId: string, updates: Partial<InsertGoal>): Promise<Goal | undefined> {
    const result = await db
      .update(goals)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteGoal(id: string, userId: string): Promise<boolean> {
    // Milestones will be deleted automatically due to CASCADE
    const result = await db
      .delete(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async completeGoal(id: string, userId: string): Promise<Goal | undefined> {
    const result = await db
      .update(goals)
      .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))
      .returning();
    return result[0];
  }

  async abandonGoal(id: string, userId: string): Promise<Goal | undefined> {
    const result = await db
      .update(goals)
      .set({ status: "abandoned", updatedAt: new Date() })
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))
      .returning();
    return result[0];
  }

  // Milestones
  async getMilestones(goalId: string, userId: string): Promise<Milestone[]> {
    return db
      .select()
      .from(milestones)
      .where(and(eq(milestones.goalId, goalId), eq(milestones.userId, userId)))
      .orderBy(milestones.order);
  }

  async getMilestone(id: string, userId: string): Promise<Milestone | undefined> {
    const result = await db
      .select()
      .from(milestones)
      .where(and(eq(milestones.id, id), eq(milestones.userId, userId)));
    return result[0];
  }

  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    const result = await db.insert(milestones).values(milestone).returning();
    return result[0];
  }

  async updateMilestone(id: string, userId: string, updates: Partial<InsertMilestone>): Promise<Milestone | undefined> {
    const result = await db
      .update(milestones)
      .set(updates)
      .where(and(eq(milestones.id, id), eq(milestones.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteMilestone(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(milestones)
      .where(and(eq(milestones.id, id), eq(milestones.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async completeMilestone(id: string, userId: string): Promise<Milestone | undefined> {
    const result = await db
      .update(milestones)
      .set({ isCompleted: true, completedAt: new Date() })
      .where(and(eq(milestones.id, id), eq(milestones.userId, userId)))
      .returning();
    return result[0];
  }

  // Public Profiles
  async getPublicProfile(userId: string): Promise<PublicProfile | undefined> {
    const result = await db
      .select()
      .from(publicProfiles)
      .where(eq(publicProfiles.userId, userId));
    return result[0];
  }

  async getPublicProfileByUsername(username: string): Promise<PublicProfile | undefined> {
    const result = await db
      .select()
      .from(publicProfiles)
      .where(eq(publicProfiles.username, username.toLowerCase()));
    return result[0];
  }

  async createPublicProfile(profile: InsertPublicProfile): Promise<PublicProfile> {
    // Ensure username is lowercase
    const normalizedProfile = {
      ...profile,
      username: profile.username?.toLowerCase(),
    };
    const result = await db.insert(publicProfiles).values(normalizedProfile).returning();
    return result[0];
  }

  async updatePublicProfile(userId: string, updates: Partial<InsertPublicProfile>): Promise<PublicProfile | undefined> {
    // Ensure username is lowercase if provided
    const normalizedUpdates = {
      ...updates,
      username: updates.username?.toLowerCase(),
      updatedAt: new Date(),
    };
    const result = await db
      .update(publicProfiles)
      .set(normalizedUpdates)
      .where(eq(publicProfiles.userId, userId))
      .returning();
    return result[0];
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    const normalized = username.toLowerCase();

    // Reserved usernames
    const reserved = [
      'admin', 'vitalpath', 'api', 'app', 'www', 'help', 'support',
      'settings', 'profile', 'login', 'logout', 'signup', 'register',
      'dashboard', 'home', 'about', 'contact', 'terms', 'privacy',
      'user', 'users', 'public', 'share', 'workout', 'workouts',
      'nutrition', 'progress', 'goals', 'chat', 'devices', 'learn'
    ];

    if (reserved.includes(normalized)) {
      return false;
    }

    const existing = await this.getPublicProfileByUsername(normalized);
    return !existing;
  }

  // Share Events
  async createShareEvent(event: InsertShareEvent): Promise<ShareEvent> {
    const result = await db.insert(shareEvents).values(event).returning();
    return result[0];
  }

  async getShareEvents(userId: string, limit: number = 50): Promise<ShareEvent[]> {
    return db
      .select()
      .from(shareEvents)
      .where(eq(shareEvents.userId, userId))
      .orderBy(desc(shareEvents.createdAt))
      .limit(limit);
  }

  // User Milestones (first-week engagement tracking)
  async getUserMilestones(userId: string): Promise<UserMilestone[]> {
    return db
      .select()
      .from(userMilestones)
      .where(eq(userMilestones.userId, userId))
      .orderBy(desc(userMilestones.achievedAt));
  }

  async getUserMilestone(userId: string, milestoneKey: string): Promise<UserMilestone | undefined> {
    const result = await db
      .select()
      .from(userMilestones)
      .where(and(eq(userMilestones.userId, userId), eq(userMilestones.milestoneKey, milestoneKey)));
    return result[0];
  }

  async createUserMilestone(milestone: InsertUserMilestone): Promise<UserMilestone> {
    const result = await db.insert(userMilestones).values(milestone).returning();
    return result[0];
  }

  async markMilestoneSeen(userId: string, milestoneKey: string): Promise<UserMilestone | undefined> {
    const result = await db
      .update(userMilestones)
      .set({ seenAt: new Date() })
      .where(and(eq(userMilestones.userId, userId), eq(userMilestones.milestoneKey, milestoneKey)))
      .returning();
    return result[0];
  }

  async getUnseenMilestones(userId: string): Promise<UserMilestone[]> {
    const allMilestones = await this.getUserMilestones(userId);
    return allMilestones.filter(m => !m.seenAt);
  }

  // Progressive Prompts (collect data over first week)
  async getProgressivePrompts(userId: string): Promise<ProgressivePrompt[]> {
    return db
      .select()
      .from(progressivePrompts)
      .where(eq(progressivePrompts.userId, userId))
      .orderBy(desc(progressivePrompts.answeredAt));
  }

  async getProgressivePrompt(userId: string, promptKey: string): Promise<ProgressivePrompt | undefined> {
    const result = await db
      .select()
      .from(progressivePrompts)
      .where(and(eq(progressivePrompts.userId, userId), eq(progressivePrompts.promptKey, promptKey)));
    return result[0];
  }

  async createProgressivePrompt(prompt: InsertProgressivePrompt): Promise<ProgressivePrompt> {
    const result = await db.insert(progressivePrompts).values(prompt).returning();
    return result[0];
  }

  async getAnsweredPromptKeys(userId: string): Promise<string[]> {
    const prompts = await this.getProgressivePrompts(userId);
    return prompts.map(p => p.promptKey);
  }

  /**
   * Returns the next progressive prompt that hasn't been answered yet.
   * Prompts are shown based on day since signup and context.
   */
  async getNextProgressivePrompt(userId: string): Promise<{ promptKey: string; question: string; options: { value: string; label: string }[]; skipLabel: string } | null> {
    const answeredKeys = await this.getAnsweredPromptKeys(userId);

    // Get onboarding assessment to check signup date
    const assessment = await this.getOnboardingAssessment(userId);
    if (!assessment) return null;

    // Calculate days since onboarding completion
    const createdAt = assessment.createdAt ? new Date(assessment.createdAt) : new Date();
    const daysSinceSignup = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    // Progressive prompts ordered by day they should appear
    const allPrompts = [
      {
        day: 1,
        promptKey: "workout_focus",
        question: "What's your main workout focus?",
        options: [
          { value: "resistance", label: "Resistance/strength training" },
          { value: "cardio", label: "Cardio/endurance" },
          { value: "flexibility", label: "Flexibility/mobility" },
          { value: "mixed", label: "A mix of everything" },
        ],
        skipLabel: "I'll answer later",
      },
      {
        day: 2,
        promptKey: "energy_levels",
        question: "How's your energy in the mornings usually?",
        options: [
          { value: "low", label: "Low - hard to get going" },
          { value: "moderate", label: "Moderate - takes a while to warm up" },
          { value: "high", label: "High - I'm a morning person" },
          { value: "varies", label: "Varies day to day" },
        ],
        skipLabel: "Skip for now",
      },
      {
        day: 3,
        promptKey: "dietary_restrictions",
        question: "Any dietary restrictions we should know about?",
        options: [
          { value: "none", label: "No restrictions" },
          { value: "vegetarian", label: "Vegetarian" },
          { value: "vegan", label: "Vegan" },
          { value: "gluten_free", label: "Gluten-free" },
          { value: "dairy_free", label: "Dairy-free" },
          { value: "other", label: "Other (will specify)" },
        ],
        skipLabel: "I'll add this later",
      },
      {
        day: 4,
        promptKey: "health_conditions",
        question: "Any health conditions that affect your fitness?",
        options: [
          { value: "none", label: "None that affect fitness" },
          { value: "joint_issues", label: "Joint issues (knees, hips, etc.)" },
          { value: "back_issues", label: "Back problems" },
          { value: "heart_condition", label: "Heart condition" },
          { value: "diabetes", label: "Diabetes" },
          { value: "other", label: "Other (will specify)" },
        ],
        skipLabel: "Prefer not to say",
      },
      {
        day: 5,
        promptKey: "body_measurements",
        question: "Want to track body measurements for progress?",
        options: [
          { value: "yes_full", label: "Yes, all measurements" },
          { value: "yes_basic", label: "Just waist and hips" },
          { value: "weight_only", label: "Weight only is fine" },
          { value: "no", label: "Not right now" },
        ],
        skipLabel: "Decide later",
      },
      {
        day: 6,
        promptKey: "digestion_quality",
        question: "How's your digestion generally?",
        options: [
          { value: "great", label: "Great - no issues" },
          { value: "good", label: "Good - occasional issues" },
          { value: "fair", label: "Fair - frequent discomfort" },
          { value: "poor", label: "Poor - regular problems" },
        ],
        skipLabel: "Skip this one",
      },
    ];

    // Find the next unanswered prompt that's available based on day
    for (const prompt of allPrompts) {
      if (daysSinceSignup >= prompt.day && !answeredKeys.includes(prompt.promptKey)) {
        return {
          promptKey: prompt.promptKey,
          question: prompt.question,
          options: prompt.options,
          skipLabel: prompt.skipLabel,
        };
      }
    }

    return null;
  }
}

export const storage = new DatabaseStorage();
