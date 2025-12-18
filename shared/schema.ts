import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp, jsonb, date, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// Import users from auth for relations
import { users } from "./models/auth";

// User profile - detailed health and fitness profile
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // Basic info
  firstName: text("first_name"),
  lastName: text("last_name"),
  age: integer("age"),
  sex: text("sex"), // male, female
  heightCm: real("height_cm"),
  currentWeightKg: real("current_weight_kg"),
  targetWeightKg: real("target_weight_kg"),
  bodyFatPercentage: real("body_fat_percentage"),
  waistCircumferenceCm: real("waist_circumference_cm"),
  
  // Current phase: recovery, recomp, cutting
  currentPhase: text("current_phase").default("assessment"),
  phaseStartDate: date("phase_start_date"),
  
  // Calculated targets
  maintenanceCalories: integer("maintenance_calories"),
  targetCalories: integer("target_calories"),
  proteinGrams: integer("protein_grams"),
  carbsGrams: integer("carbs_grams"),
  fatGrams: integer("fat_grams"),
  dailyStepsTarget: integer("daily_steps_target").default(8000),
  
  // Coaching preferences
  coachingTone: text("coaching_tone").default("empathetic"), // scientific, casual, motivational, tough_love
  
  // Health conditions (for safety disclaimers)
  hasHealthConditions: boolean("has_health_conditions").default(false),
  healthConditionsNotes: text("health_conditions_notes"),
  
  onboardingCompleted: boolean("onboarding_completed").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Onboarding assessment data
export const onboardingAssessments = pgTable("onboarding_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // Diet history
  hasBeenDietingRecently: boolean("has_been_dieting_recently"),
  dietingDurationMonths: integer("dieting_duration_months"),
  previousLowestCalories: integer("previous_lowest_calories"),
  typicalDailyEating: text("typical_daily_eating"),
  biggestHurdles: text("biggest_hurdles"),
  relationshipWithFood: text("relationship_with_food"), // healthy, restrictive, emotional, disordered
  
  // Exercise background
  doesResistanceTraining: boolean("does_resistance_training"),
  resistanceTrainingFrequency: integer("resistance_training_frequency"), // days per week
  resistanceTrainingType: text("resistance_training_type"),
  doesCardio: boolean("does_cardio"),
  averageDailySteps: integer("average_daily_steps"),
  physicalLimitations: text("physical_limitations"),
  knowsRIR: boolean("knows_rir"), // Reps in Reserve familiarity
  
  // Lifestyle & stress
  occupation: text("occupation"),
  activityLevel: text("activity_level"), // sedentary, lightly_active, moderately_active, very_active
  averageSleepHours: real("average_sleep_hours"),
  sleepQuality: integer("sleep_quality"), // 1-10
  stressLevel: integer("stress_level"), // 1-10
  stressSources: text("stress_sources"),
  
  // Biofeedback baseline
  energyLevelMorning: integer("energy_level_morning"), // 1-10
  energyLevelAfternoon: integer("energy_level_afternoon"), // 1-10
  digestionQuality: text("digestion_quality"), // good, bloating, constipation, other
  moodGeneral: integer("mood_general"), // 1-10
  
  // Women-specific
  menstrualStatus: text("menstrual_status"), // premenopausal, perimenopausal, postmenopausal, not_applicable
  
  // Wearable data
  usesWearable: boolean("uses_wearable"),
  wearableType: text("wearable_type"),
  averageHRV: real("average_hrv"),
  restingHeartRate: integer("resting_heart_rate"),
  
  // Classification results
  metabolicState: text("metabolic_state"), // adapted, healthy, unknown
  recommendedStartPhase: text("recommended_start_phase"), // recovery, recomp, cutting
  psychologicalReadiness: text("psychological_readiness"), // ready, needs_support, high_anxiety
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily logs - tracking daily metrics
export const dailyLogs = pgTable("daily_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  logDate: date("log_date").notNull(),
  
  // Weight & measurements
  weightKg: real("weight_kg"),
  waistCm: real("waist_cm"),
  hipsCm: real("hips_cm"),
  chestCm: real("chest_cm"),
  
  // Nutrition
  caloriesConsumed: integer("calories_consumed"),
  proteinGrams: real("protein_grams"),
  carbsGrams: real("carbs_grams"),
  fatGrams: real("fat_grams"),
  waterLiters: real("water_liters"),
  
  // Activity
  steps: integer("steps"),
  activeMinutes: integer("active_minutes"),
  workoutCompleted: boolean("workout_completed").default(false),
  workoutType: text("workout_type"),
  workoutDurationMinutes: integer("workout_duration_minutes"),
  
  // Biofeedback
  sleepHours: real("sleep_hours"),
  sleepQuality: integer("sleep_quality"), // 1-10
  energyLevel: integer("energy_level"), // 1-10
  stressLevel: integer("stress_level"), // 1-10
  moodRating: integer("mood_rating"), // 1-10
  digestionNotes: text("digestion_notes"),
  
  // Wearable synced data
  avgHeartRate: integer("avg_heart_rate"),
  hrv: real("hrv"),
  
  // Notes
  notes: text("notes"),
  
  // Data source
  dataSource: text("data_source").default("manual"), // manual, apple_health, fitbit, garmin, oura
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Food entries - individual food items logged
export const foodEntries = pgTable("food_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  dailyLogId: varchar("daily_log_id").references(() => dailyLogs.id),
  logDate: date("log_date").notNull(),
  
  mealType: text("meal_type").notNull(), // breakfast, lunch, dinner, snack
  foodName: text("food_name").notNull(),
  servingSize: text("serving_size"),
  servingQuantity: real("serving_quantity").default(1),
  
  calories: integer("calories"),
  proteinGrams: real("protein_grams"),
  carbsGrams: real("carbs_grams"),
  fatGrams: real("fat_grams"),
  fiberGrams: real("fiber_grams"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat messages - AI mentor conversations
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  role: text("role").notNull(), // user, assistant
  content: text("content").notNull(),
  
  // Context for AI
  contextType: text("context_type"), // onboarding, check_in, question, coaching, phase_transition
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Workout templates
export const workoutTemplates = pgTable("workout_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // strength, cardio, flexibility, recovery
  difficulty: text("difficulty").notNull(), // beginner, intermediate, advanced
  durationMinutes: integer("duration_minutes"),
  targetAgeGroup: text("target_age_group").default("40+"),

  // Phase recommendations: which phases this workout is appropriate for
  // recovery = focus on mobility, low intensity
  // recomp = balanced strength + moderate cardio
  // cutting = maintain strength, higher cardio
  phases: jsonb("phases").$type<string[]>().default(["recovery", "recomp", "cutting"]),

  // Priority within phase (higher = recommended more often)
  phasePriority: integer("phase_priority").default(5),

  exercises: jsonb("exercises"), // Array of exercises with sets, reps, RIR

  createdAt: timestamp("created_at").defaultNow(),
});

// Wearable connections
export const wearableConnections = pgTable("wearable_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  provider: text("provider").notNull(), // apple_health, fitbit, garmin, oura
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  
  isConnected: boolean("is_connected").default(false),
  lastSyncAt: timestamp("last_sync_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Educational content
export const educationalContent = pgTable("educational_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(), // metabolic_adaptation, reverse_dieting, rir, body_recomposition, cortisol, nutrition, training
  content: text("content").notNull(),
  readTimeMinutes: integer("read_time_minutes"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Food database for quick lookup
export const foodDatabase = pgTable("food_database", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  name: text("name").notNull(),
  servingSize: text("serving_size"),
  calories: integer("calories"),
  proteinGrams: real("protein_grams"),
  carbsGrams: real("carbs_grams"),
  fatGrams: real("fat_grams"),
  fiberGrams: real("fiber_grams"),
  category: text("category"), // protein, carbs, fats, vegetables

  createdAt: timestamp("created_at").defaultNow(),
});

// User notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),

  type: text("type").notNull(), // reminder, insight, phase_change, achievement
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  actionUrl: text("action_url"),

  createdAt: timestamp("created_at").defaultNow(),
});

// Profile changes history - tracks all AI-initiated and manual changes
export const profileChanges = pgTable("profile_changes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),

  // Link to the chat message that triggered this change (null for manual changes)
  chatMessageId: varchar("chat_message_id").references(() => chatMessages.id),

  // What category of change was made
  changeCategory: text("change_category").notNull(), // nutrition, training, sleep, phase, goals

  // Specific field that was changed
  fieldName: text("field_name").notNull(), // e.g., "targetCalories", "proteinGrams", "currentPhase"

  // Human-readable description of the change
  changeDescription: text("change_description").notNull(),

  // Previous and new values (stored as strings for flexibility)
  previousValue: text("previous_value"),
  newValue: text("new_value"),

  // AI reasoning for why this change was made
  reasoning: text("reasoning"),

  // Source of the change
  source: text("source").notNull().default("ai_chat"), // ai_chat, manual, phase_transition, onboarding

  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  assessment: one(onboardingAssessments, {
    fields: [users.id],
    references: [onboardingAssessments.userId],
  }),
  dailyLogs: many(dailyLogs),
  foodEntries: many(foodEntries),
  chatMessages: many(chatMessages),
  wearableConnections: many(wearableConnections),
  notifications: many(notifications),
  profileChanges: many(profileChanges),
}));

export const profileChangesRelations = relations(profileChanges, ({ one }) => ({
  user: one(users, {
    fields: [profileChanges.userId],
    references: [users.id],
  }),
  chatMessage: one(chatMessages, {
    fields: [profileChanges.chatMessageId],
    references: [chatMessages.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const dailyLogsRelations = relations(dailyLogs, ({ one, many }) => ({
  user: one(users, {
    fields: [dailyLogs.userId],
    references: [users.id],
  }),
  foodEntries: many(foodEntries),
}));

export const foodEntriesRelations = relations(foodEntries, ({ one }) => ({
  user: one(users, {
    fields: [foodEntries.userId],
    references: [users.id],
  }),
  dailyLog: one(dailyLogs, {
    fields: [foodEntries.dailyLogId],
    references: [dailyLogs.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

export const wearableConnectionsRelations = relations(wearableConnections, ({ one }) => ({
  user: one(users, {
    fields: [wearableConnections.userId],
    references: [users.id],
  }),
}));

// Insert schemas

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  updatedAt: true,
});

export const insertOnboardingAssessmentSchema = createInsertSchema(onboardingAssessments).omit({
  id: true,
  createdAt: true,
});

export const insertDailyLogSchema = createInsertSchema(dailyLogs).omit({
  id: true,
  createdAt: true,
});

export const insertFoodEntrySchema = createInsertSchema(foodEntries).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertWearableConnectionSchema = createInsertSchema(wearableConnections).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertProfileChangeSchema = createInsertSchema(profileChanges).omit({
  id: true,
  createdAt: true,
});

// Types (User and UpsertUser are exported from ./models/auth)

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;

export type InsertOnboardingAssessment = z.infer<typeof insertOnboardingAssessmentSchema>;
export type OnboardingAssessment = typeof onboardingAssessments.$inferSelect;

export type InsertDailyLog = z.infer<typeof insertDailyLogSchema>;
export type DailyLog = typeof dailyLogs.$inferSelect;

export type InsertFoodEntry = z.infer<typeof insertFoodEntrySchema>;
export type FoodEntry = typeof foodEntries.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type InsertWearableConnection = z.infer<typeof insertWearableConnectionSchema>;
export type WearableConnection = typeof wearableConnections.$inferSelect;

export type WorkoutTemplate = typeof workoutTemplates.$inferSelect;
export type EducationalContent = typeof educationalContent.$inferSelect;
export type FoodDatabaseItem = typeof foodDatabase.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertProfileChange = z.infer<typeof insertProfileChangeSchema>;
export type ProfileChange = typeof profileChanges.$inferSelect;
