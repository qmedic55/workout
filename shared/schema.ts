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
  profileImageUrl: text("profile_image_url"),
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
  enableNotifications: boolean("enable_notifications").default(true), // Daily reminders, insights, check-ins

  // User timezone (IANA format, e.g., "America/New_York")
  timezone: text("timezone").default("America/New_York"),

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

  // Source of the food entry (manual, barcode, photo_ai, voice)
  source: text("source").default("manual"),
  // Track which AI model was used for photo/voice analysis
  aiModel: text("ai_model"), // e.g., "gpt-5.2", "gpt-4o"

  createdAt: timestamp("created_at").defaultNow(),
});

// Exercise logs - individual exercise performance tracking
export const exerciseLogs = pgTable("exercise_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  dailyLogId: varchar("daily_log_id").references(() => dailyLogs.id),
  workoutTemplateId: varchar("workout_template_id").references(() => workoutTemplates.id),
  logDate: date("log_date").notNull(),

  // Exercise details (copied from template for historical accuracy)
  exerciseName: text("exercise_name").notNull(),
  exerciseOrder: integer("exercise_order").notNull(), // Position in workout

  // Prescribed values (from template)
  prescribedSets: integer("prescribed_sets"),
  prescribedReps: text("prescribed_reps"), // e.g., "10-12" or "30 sec"
  prescribedRir: integer("prescribed_rir"),

  // Actual performance (user input)
  completedSets: integer("completed_sets"),
  // Store each set's performance as JSON: [{reps: 12, weightKg: 50}, {reps: 10, weightKg: 50}, ...]
  setDetails: jsonb("set_details").$type<{ reps: number; weightKg?: number; rir?: number }[]>(),

  notes: text("notes"),
  skipped: boolean("skipped").default(false),

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

  // Track which AI model was used for this response
  aiModel: text("ai_model"), // e.g., "gpt-5.2", "gpt-4o"

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

// Body measurements - comprehensive body part tracking
export const bodyMeasurements = pgTable("body_measurements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  measurementDate: date("measurement_date").notNull(),

  // Core measurements (cm)
  chestCm: real("chest_cm"),
  waistCm: real("waist_cm"),
  hipsCm: real("hips_cm"),

  // Arms (cm)
  leftBicepCm: real("left_bicep_cm"),
  rightBicepCm: real("right_bicep_cm"),
  leftForearmCm: real("left_forearm_cm"),
  rightForearmCm: real("right_forearm_cm"),

  // Legs (cm)
  leftThighCm: real("left_thigh_cm"),
  rightThighCm: real("right_thigh_cm"),
  leftCalfCm: real("left_calf_cm"),
  rightCalfCm: real("right_calf_cm"),

  // Other (cm)
  neckCm: real("neck_cm"),
  shouldersCm: real("shoulders_cm"), // shoulder width

  // Body composition estimates (optional)
  bodyFatPercentage: real("body_fat_percentage"),

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),
});

// Meal templates - user-saved meal presets for quick logging
export const mealTemplates = pgTable("meal_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),

  name: text("name").notNull(), // "Morning Protein Shake", "Work Lunch"
  mealType: text("meal_type"), // breakfast, lunch, dinner, snack (optional default)

  // Aggregated nutrition
  totalCalories: integer("total_calories"),
  totalProtein: real("total_protein"),
  totalCarbs: real("total_carbs"),
  totalFat: real("total_fat"),

  // Individual food items stored as JSON
  items: jsonb("items").notNull(), // [{foodName, servingSize, quantity, calories, protein, carbs, fat}]

  usageCount: integer("usage_count").default(0), // For sorting by popularity
  lastUsedAt: timestamp("last_used_at"),

  createdAt: timestamp("created_at").defaultNow(),
});

// Goals - user-defined fitness and health goals
export const goals = pgTable("goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),

  // Goal definition
  title: text("title").notNull(), // "Reach 180 lbs"
  description: text("description"),
  category: text("category").notNull(), // weight, strength, nutrition, activity, body_comp

  // Target
  targetType: text("target_type").notNull(), // reach_value, maintain_streak, complete_count
  targetValue: real("target_value"), // 180 (lbs), 100 (protein g), etc.
  targetUnit: text("target_unit"), // lbs, kg, g, reps, days

  // Tracking
  startValue: real("start_value"), // Starting point
  currentValue: real("current_value"), // Auto-updated

  // Timeline
  targetDate: date("target_date"), // Optional deadline
  startDate: date("start_date").defaultNow(),
  completedAt: timestamp("completed_at"),

  // Status
  status: text("status").notNull().default("active"), // active, completed, abandoned

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Milestones - intermediate checkpoints for goals
export const milestones = pgTable("milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  goalId: varchar("goal_id").notNull().references(() => goals.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),

  title: text("title").notNull(), // "Lose first 5 lbs"
  targetValue: real("target_value"),

  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),

  order: integer("order").default(0), // For sorting

  createdAt: timestamp("created_at").defaultNow(),
});

// Public profiles - for social sharing and public profile URLs
export const publicProfiles = pgTable("public_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id),

  // Public URL: vitalpath.app/u/{username}
  username: varchar("username", { length: 30 }).unique(),
  displayName: varchar("display_name", { length: 50 }),
  bio: text("bio"),

  // Privacy controls - what to show publicly
  showWeight: boolean("show_weight").default(false),
  showGoals: boolean("show_goals").default(true),
  showStreaks: boolean("show_streaks").default(true),
  showWorkoutStats: boolean("show_workout_stats").default(true),
  showProgress: boolean("show_progress").default(false),
  showMilestones: boolean("show_milestones").default(true),

  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Share events - analytics for social sharing
export const shareEvents = pgTable("share_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  cardType: text("card_type").notNull(), // progress, goal, streak, milestone, workout
  platform: text("platform"), // native, twitter, download, copy
  createdAt: timestamp("created_at").defaultNow(),
});

// User milestones - tracking first-week achievements and engagement milestones
export const userMilestones = pgTable("user_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),

  // Milestone identifier: first_food_log, first_workout, day_2_streak, day_3, first_week, etc.
  milestoneKey: text("milestone_key").notNull(),

  // When the milestone was achieved
  achievedAt: timestamp("achieved_at").defaultNow(),

  // Optional data associated with the milestone (e.g., stats at time of achievement)
  data: jsonb("data").$type<Record<string, unknown>>(),

  // When user dismissed/acknowledged the celebration
  seenAt: timestamp("seen_at"),

  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserMilestone: index("idx_user_milestones_unique").on(table.userId, table.milestoneKey),
}));

// Progressive onboarding prompts - tracks which follow-up questions have been shown/answered
export const progressivePrompts = pgTable("progressive_prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),

  // Prompt identifier: energy_levels, dietary_restrictions, health_conditions, etc.
  promptKey: text("prompt_key").notNull(),

  // The value collected (stored as JSON for flexibility)
  value: jsonb("value"),

  // Whether user skipped this prompt
  skipped: boolean("skipped").default(false),

  // When user answered or skipped
  answeredAt: timestamp("answered_at").defaultNow(),

  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserPrompt: index("idx_progressive_prompts_unique").on(table.userId, table.promptKey),
}));

// User points - gamification points tracking
export const userPoints = pgTable("user_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id),

  // Lifetime points (never reset)
  lifetimePoints: integer("lifetime_points").notNull().default(0),

  // Spendable currency (can be deducted when store is added)
  spendablePoints: integer("spendable_points").notNull().default(0),

  // Rolling period points (for leaderboards)
  dailyPoints: integer("daily_points").notNull().default(0),
  weeklyPoints: integer("weekly_points").notNull().default(0),
  monthlyPoints: integer("monthly_points").notNull().default(0),

  // Streak tracking for multipliers
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActivityDate: date("last_activity_date"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Point transactions - audit log of all points earned
export const pointTransactions = pgTable("point_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),

  // Transaction details
  actionType: text("action_type").notNull(), // food_log, workout, biofeedback, milestone, streak_bonus
  basePoints: integer("base_points").notNull(),
  multiplier: real("multiplier").notNull().default(1),
  bonusPoints: integer("bonus_points").default(0),
  totalPoints: integer("total_points").notNull(),

  // Human-readable description
  description: text("description").notNull(),

  // Reference to the source action (food entry, workout, etc.)
  referenceId: varchar("reference_id"),
  referenceType: text("reference_type"), // food_entry, exercise_log, daily_log

  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_point_transactions_user").on(table.userId),
  createdAtIdx: index("idx_point_transactions_created").on(table.createdAt),
}));

// Health notes - user-submitted context notes for AI coaching
export const healthNotes = pgTable("health_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),

  // The note content
  content: text("content").notNull(),

  // AI-categorized type (processed by AI when saved)
  category: text("category"), // injury, nutrition, sleep, stress, lifestyle, general

  // Whether this note is still relevant (old injuries might heal, etc.)
  isActive: boolean("is_active").default(true),

  // Optional expiry - some notes like "ate too much at a party" are short-term
  expiresAt: timestamp("expires_at"),

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
  exerciseLogs: many(exerciseLogs),
  chatMessages: many(chatMessages),
  wearableConnections: many(wearableConnections),
  notifications: many(notifications),
  profileChanges: many(profileChanges),
  healthNotes: many(healthNotes),
  bodyMeasurements: many(bodyMeasurements),
  mealTemplates: many(mealTemplates),
  goals: many(goals),
  milestones: many(milestones),
  publicProfile: one(publicProfiles, {
    fields: [users.id],
    references: [publicProfiles.userId],
  }),
  shareEvents: many(shareEvents),
  userMilestones: many(userMilestones),
  progressivePrompts: many(progressivePrompts),
  userPoints: one(userPoints, {
    fields: [users.id],
    references: [userPoints.userId],
  }),
  pointTransactions: many(pointTransactions),
}));

export const mealTemplatesRelations = relations(mealTemplates, ({ one }) => ({
  user: one(users, {
    fields: [mealTemplates.userId],
    references: [users.id],
  }),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
  milestones: many(milestones),
}));

export const milestonesRelations = relations(milestones, ({ one }) => ({
  goal: one(goals, {
    fields: [milestones.goalId],
    references: [goals.id],
  }),
  user: one(users, {
    fields: [milestones.userId],
    references: [users.id],
  }),
}));

export const healthNotesRelations = relations(healthNotes, ({ one }) => ({
  user: one(users, {
    fields: [healthNotes.userId],
    references: [users.id],
  }),
}));

export const publicProfilesRelations = relations(publicProfiles, ({ one }) => ({
  user: one(users, {
    fields: [publicProfiles.userId],
    references: [users.id],
  }),
}));

export const shareEventsRelations = relations(shareEvents, ({ one }) => ({
  user: one(users, {
    fields: [shareEvents.userId],
    references: [users.id],
  }),
}));

export const userMilestonesRelations = relations(userMilestones, ({ one }) => ({
  user: one(users, {
    fields: [userMilestones.userId],
    references: [users.id],
  }),
}));

export const progressivePromptsRelations = relations(progressivePrompts, ({ one }) => ({
  user: one(users, {
    fields: [progressivePrompts.userId],
    references: [users.id],
  }),
}));

export const userPointsRelations = relations(userPoints, ({ one }) => ({
  user: one(users, {
    fields: [userPoints.userId],
    references: [users.id],
  }),
}));

export const pointTransactionsRelations = relations(pointTransactions, ({ one }) => ({
  user: one(users, {
    fields: [pointTransactions.userId],
    references: [users.id],
  }),
}));

export const bodyMeasurementsRelations = relations(bodyMeasurements, ({ one }) => ({
  user: one(users, {
    fields: [bodyMeasurements.userId],
    references: [users.id],
  }),
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
  exerciseLogs: many(exerciseLogs),
}));

export const exerciseLogsRelations = relations(exerciseLogs, ({ one }) => ({
  user: one(users, {
    fields: [exerciseLogs.userId],
    references: [users.id],
  }),
  dailyLog: one(dailyLogs, {
    fields: [exerciseLogs.dailyLogId],
    references: [dailyLogs.id],
  }),
  workoutTemplate: one(workoutTemplates, {
    fields: [exerciseLogs.workoutTemplateId],
    references: [workoutTemplates.id],
  }),
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

export const insertExerciseLogSchema = createInsertSchema(exerciseLogs, {
  setDetails: z.array(z.object({
    reps: z.number(),
    weightKg: z.number().optional(),
    rir: z.number().optional(),
  })).nullable().optional(),
}).omit({
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

export const insertHealthNoteSchema = createInsertSchema(healthNotes).omit({
  id: true,
  createdAt: true,
});

export const insertBodyMeasurementSchema = createInsertSchema(bodyMeasurements).omit({
  id: true,
  createdAt: true,
});

export const insertMealTemplateSchema = createInsertSchema(mealTemplates, {
  items: z.array(z.object({
    foodName: z.string(),
    servingSize: z.string().optional(),
    quantity: z.number().optional(),
    calories: z.number().optional(),
    proteinGrams: z.number().optional(),
    carbsGrams: z.number().optional(),
    fatGrams: z.number().optional(),
  })),
}).omit({
  id: true,
  createdAt: true,
  usageCount: true,
  lastUsedAt: true,
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export const insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertPublicProfileSchema = createInsertSchema(publicProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShareEventSchema = createInsertSchema(shareEvents).omit({
  id: true,
  createdAt: true,
});

export const insertUserMilestoneSchema = createInsertSchema(userMilestones, {
  data: z.record(z.unknown()).optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertProgressivePromptSchema = createInsertSchema(progressivePrompts, {
  value: z.unknown().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertUserPointsSchema = createInsertSchema(userPoints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPointTransactionSchema = createInsertSchema(pointTransactions).omit({
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

export type InsertExerciseLog = z.infer<typeof insertExerciseLogSchema>;
export type ExerciseLog = typeof exerciseLogs.$inferSelect;

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

export type InsertHealthNote = z.infer<typeof insertHealthNoteSchema>;
export type HealthNote = typeof healthNotes.$inferSelect;

export type InsertBodyMeasurement = z.infer<typeof insertBodyMeasurementSchema>;
export type BodyMeasurement = typeof bodyMeasurements.$inferSelect;

export type InsertMealTemplate = z.infer<typeof insertMealTemplateSchema>;
export type MealTemplate = typeof mealTemplates.$inferSelect;

export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;

export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type Milestone = typeof milestones.$inferSelect;

export type InsertPublicProfile = z.infer<typeof insertPublicProfileSchema>;
export type PublicProfile = typeof publicProfiles.$inferSelect;

export type InsertShareEvent = z.infer<typeof insertShareEventSchema>;
export type ShareEvent = typeof shareEvents.$inferSelect;

export type InsertUserMilestone = z.infer<typeof insertUserMilestoneSchema>;
export type UserMilestone = typeof userMilestones.$inferSelect;

export type InsertProgressivePrompt = z.infer<typeof insertProgressivePromptSchema>;
export type ProgressivePrompt = typeof progressivePrompts.$inferSelect;

export type InsertUserPoints = z.infer<typeof insertUserPointsSchema>;
export type UserPoints = typeof userPoints.$inferSelect;

export type InsertPointTransaction = z.infer<typeof insertPointTransactionSchema>;
export type PointTransaction = typeof pointTransactions.$inferSelect;
