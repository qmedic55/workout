import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateMentorResponse, calculateTargets, parseNaturalLanguageInput, openai } from "./openai";
import { generateInsights, generateDayOneInsight, generateFirstWeekReport } from "./insights";
import { evaluatePhaseTransition, executePhaseTransition } from "./phaseTransition";
import { searchUSDAFoods } from "./foodApi";
import { analyzeProfileForRecommendations, getQuickWorkoutRecommendation } from "./aiRecommendations";
import { parseAIResponseForActions, prepareProfileUpdates, formatChangeNotification } from "./aiActionParser";
import { sendProactiveNotifications, getDailyProgressSummary, generateAfternoonReminders } from "./proactiveNotifications";
import { generateDailyGuidance, generateDailyGuidanceWithAssistant } from "./dailyGuidance";
import { format, subDays, parseISO } from "date-fns";
import {
  getTodayInTimezone,
  getYesterdayInTimezone,
  getDaysAgoInTimezone,
  getCurrentHourInTimezone,
  getSafeTimezone,
  DEFAULT_TIMEZONE,
} from "./timezone";
import {
  insertUserProfileSchema,
  insertDailyLogSchema,
  insertFoodEntrySchema,
  insertChatMessageSchema,
  insertExerciseLogSchema,
} from "@shared/schema";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { authStorage } from "./replit_integrations/auth/storage";
import * as jose from "jose";

// Simple in-memory rate limiter for AI endpoints
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 AI requests per minute per user

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new entry
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  userLimit.count++;
  return { allowed: true };
}

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  rateLimitStore.forEach((value, key) => {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  });
}, 5 * 60 * 1000);

// Helper to get user ID from authenticated request
function getUserId(req: Request): string {
  return (req.user as any)?.claims?.sub || "";
}

// Phase-specific workout guidance messages
function getPhaseWorkoutMessage(phase: string): string {
  switch (phase) {
    case "recovery":
      return "During your metabolic recovery phase, focus on mobility work and light resistance training (RIR 4+). " +
        "Prioritize recovery-type workouts and low-impact cardio. Avoid HIIT and intense training to allow your metabolism to restore.";
    case "recomp":
      return "In the recomposition phase, balance strength training with moderate cardio. " +
        "Focus on progressive overload (RIR 2-3) to build muscle while in a slight deficit. " +
        "3-4 strength sessions per week is ideal.";
    case "cutting":
      return "During fat loss, prioritize maintaining your strength with heavy compound lifts (lower volume, higher intensity). " +
        "Add metabolic finishers and HIIT for extra calorie burn. " +
        "Keep strength training to preserve muscle mass.";
    default:
      return "Complete your assessment to get personalized workout recommendations based on your goals and metabolic state.";
  }
}

// Helper to check and create streak milestones
async function checkStreakMilestones(userId: string): Promise<void> {
  try {
    const profile = await storage.getProfile(userId);
    if (!profile) return;

    // Get logs for last 7 days
    const today = new Date();
    const logs: { date: string; hasActivity: boolean }[] = [];

    for (let i = 0; i < 7; i++) {
      const date = format(subDays(today, i), "yyyy-MM-dd");
      const dailyLog = await storage.getDailyLog(userId, date);
      const foodEntries = await storage.getFoodEntries(userId, date);
      const exerciseLogs = await storage.getExerciseLogs(userId, date);

      const hasActivity = !!dailyLog || foodEntries.length > 0 || exerciseLogs.length > 0;
      logs.push({ date, hasActivity });
    }

    // Check consecutive days from today
    let streak = 0;
    for (const log of logs) {
      if (log.hasActivity) {
        streak++;
      } else {
        break;
      }
    }

    // Day 2 streak milestone
    if (streak >= 2) {
      const existingDay2 = await storage.getUserMilestone(userId, "day_2_streak");
      if (!existingDay2) {
        await storage.createUserMilestone({
          userId,
          milestoneKey: "day_2_streak",
          data: { streak: 2 },
        });
      }
    }

    // Day 3 milestone
    if (streak >= 3) {
      const existingDay3 = await storage.getUserMilestone(userId, "day_3");
      if (!existingDay3) {
        await storage.createUserMilestone({
          userId,
          milestoneKey: "day_3",
          data: { streak: 3 },
        });
      }
    }

    // First week milestone (7 days)
    if (streak >= 7) {
      const existingFirstWeek = await storage.getUserMilestone(userId, "first_week");
      if (!existingFirstWeek) {
        await storage.createUserMilestone({
          userId,
          milestoneKey: "first_week",
          data: { streak: 7 },
        });
      }
    }
  } catch (error) {
    console.error("Error checking streak milestones:", error);
  }
}

// Validation schemas
const onboardingSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
  age: z.number().int().min(18).max(120).optional(),
  sex: z.enum(["male", "female"]).optional(),
  heightCm: z.number().min(100).max(250).optional(),
  currentWeightKg: z.number().min(30).max(300).optional(),
  targetWeightKg: z.number().min(30).max(300).optional(),
  waistCircumferenceCm: z.number().optional(),
  
  hasBeenDietingRecently: z.boolean().optional(),
  dietingDurationMonths: z.number().optional(),
  previousLowestCalories: z.number().optional(),
  typicalDailyEating: z.string().optional(),
  biggestHurdles: z.string().optional(),
  relationshipWithFood: z.string().optional(),
  
  doesResistanceTraining: z.boolean().optional(),
  resistanceTrainingFrequency: z.number().optional(),
  resistanceTrainingType: z.string().optional(),
  doesCardio: z.boolean().optional(),
  averageDailySteps: z.number().optional(),
  physicalLimitations: z.string().optional(),
  knowsRIR: z.boolean().optional(),
  
  occupation: z.string().optional(),
  activityLevel: z.enum(["sedentary", "lightly_active", "moderately_active", "very_active"]).optional(),
  averageSleepHours: z.number().optional(),
  sleepQuality: z.number().int().min(1).max(10).optional(),
  stressLevel: z.number().int().min(1).max(10).optional(),
  stressSources: z.string().optional(),
  
  energyLevelMorning: z.number().int().min(1).max(10).optional(),
  energyLevelAfternoon: z.number().int().min(1).max(10).optional(),
  digestionQuality: z.string().optional(),
  moodGeneral: z.number().int().min(1).max(10).optional(),
  menstrualStatus: z.string().optional(),
  
  usesWearable: z.boolean().optional(),
  wearableType: z.string().optional(),
  
  coachingTone: z.enum(["empathetic", "scientific", "casual", "tough_love"]).optional(),
  hasHealthConditions: z.boolean().optional(),
  healthConditionsNotes: z.string().optional(),
});

const chatMessageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
});

const dailyLogInputSchema = z.object({
  logDate: z.string(),
  weightKg: z.number().optional(),
  waistCm: z.number().optional(),
  hipsCm: z.number().optional(),
  chestCm: z.number().optional(),
  caloriesConsumed: z.number().optional(),
  proteinGrams: z.number().optional(),
  carbsGrams: z.number().optional(),
  fatGrams: z.number().optional(),
  waterLiters: z.number().optional(),
  steps: z.number().optional(),
  activeMinutes: z.number().optional(),
  workoutCompleted: z.boolean().optional(),
  workoutType: z.string().optional(),
  workoutDurationMinutes: z.number().optional(),
  sleepHours: z.number().optional(),
  sleepQuality: z.number().int().min(1).max(10).optional(),
  energyLevel: z.number().int().min(1).max(10).optional(),
  stressLevel: z.number().int().min(1).max(10).optional(),
  moodRating: z.number().int().min(1).max(10).optional(),
  digestionNotes: z.string().optional(),
  avgHeartRate: z.number().optional(),
  hrv: z.number().optional(),
  notes: z.string().optional(),
  dataSource: z.string().optional(),
});

const foodEntryInputSchema = z.object({
  logDate: z.string(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  foodName: z.string().min(1),
  servingSize: z.string().optional(),
  servingQuantity: z.number().optional(),
  calories: z.number().optional(),
  proteinGrams: z.number().optional(),
  carbsGrams: z.number().optional(),
  fatGrams: z.number().optional(),
  fiberGrams: z.number().optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Set up Replit Auth (must be before other routes)
  await setupAuth(app);
  registerAuthRoutes(app);

  // ==================== Apple Sign In Routes ====================

  // Apple's public keys for JWT verification
  const APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys";

  async function verifyAppleToken(identityToken: string): Promise<{ sub: string; email?: string }> {
    // Fetch Apple's public keys
    const JWKS = jose.createRemoteJWKSet(new URL(APPLE_KEYS_URL));

    // Verify the token
    const { payload } = await jose.jwtVerify(identityToken, JWKS, {
      issuer: "https://appleid.apple.com",
      audience: "com.vitalpath.app",
    });

    return {
      sub: payload.sub as string,
      email: payload.email as string | undefined,
    };
  }

  app.post("/api/auth/apple", async (req: Request, res: Response) => {
    try {
      const { identityToken, email, givenName, familyName, user } = req.body;

      if (!identityToken) {
        res.status(400).json({ error: "Identity token is required" });
        return;
      }

      // Verify the Apple identity token
      const verifiedPayload = await verifyAppleToken(identityToken);
      const appleUserId = `apple_${verifiedPayload.sub}`;

      // Check if user exists, if not create them
      let dbUser = await authStorage.getUser(appleUserId);

      if (!dbUser) {
        // Create new user
        dbUser = await authStorage.upsertUser({
          id: appleUserId,
          email: email || verifiedPayload.email || null,
          firstName: givenName || null,
          lastName: familyName || null,
          profileImageUrl: null,
        });

        // Create initial profile
        await storage.createProfile({
          userId: appleUserId,
          firstName: givenName || undefined,
          lastName: familyName || undefined,
          onboardingCompleted: false,
        });
      }

      // Set session cookie
      const sessionToken = Buffer.from(JSON.stringify({
        sub: appleUserId,
        email: email || verifiedPayload.email,
        firstName: givenName,
        lastName: familyName,
        iat: Date.now(),
      })).toString("base64");

      res.cookie("__session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.json({
        success: true,
        user: {
          id: appleUserId,
          email: email || verifiedPayload.email,
          firstName: givenName,
          lastName: familyName,
        },
      });
    } catch (error: any) {
      console.error("Apple auth error:", error);

      if (error.code === "ERR_JWT_EXPIRED") {
        res.status(401).json({ error: "Token expired" });
        return;
      }

      res.status(401).json({ error: "Invalid Apple token" });
    }
  });

  // ==================== Profile Routes ====================

  app.get("/api/profile", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const profile = await storage.getProfile(getUserId(req));
      if (!profile) {
        res.json(null);
        return;
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.patch("/api/profile", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const existingProfile = await storage.getProfile(getUserId(req));
      
      if (!existingProfile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      const updatedProfile = await storage.updateProfile(getUserId(req), req.body);
      res.json(updatedProfile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // ==================== Onboarding Routes ====================

  app.post("/api/onboarding", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Validate input
      const parseResult = onboardingSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: "Invalid onboarding data", details: parseResult.error.flatten() });
        return;
      }
      const data = parseResult.data;
      
      // Calculate targets based on assessment data
      const targets = calculateTargets({
        age: data.age,
        sex: data.sex,
        heightCm: data.heightCm,
        currentWeightKg: data.currentWeightKg,
        activityLevel: data.activityLevel,
        hasBeenDietingRecently: data.hasBeenDietingRecently,
        dietingDurationMonths: data.dietingDurationMonths,
        previousLowestCalories: data.previousLowestCalories,
        doesResistanceTraining: data.doesResistanceTraining,
      });

      // Create or update user profile
      let profile = await storage.getProfile(getUserId(req));
      
      const profileData = {
        userId: getUserId(req),
        firstName: data.firstName,
        lastName: data.lastName,
        age: data.age,
        sex: data.sex,
        heightCm: data.heightCm,
        currentWeightKg: data.currentWeightKg,
        targetWeightKg: data.targetWeightKg,
        waistCircumferenceCm: data.waistCircumferenceCm,
        currentPhase: targets.recommendedPhase,
        phaseStartDate: format(new Date(), "yyyy-MM-dd"),
        maintenanceCalories: targets.maintenanceCalories,
        targetCalories: targets.targetCalories,
        proteinGrams: targets.proteinGrams,
        carbsGrams: targets.carbsGrams,
        fatGrams: targets.fatGrams,
        dailyStepsTarget: data.averageDailySteps || 8000,
        coachingTone: data.coachingTone,
        hasHealthConditions: data.hasHealthConditions,
        healthConditionsNotes: data.healthConditionsNotes,
        onboardingCompleted: true,
      };

      if (profile) {
        profile = await storage.updateProfile(getUserId(req), profileData);
      } else {
        profile = await storage.createProfile(profileData);
      }

      // Store assessment data
      await storage.createOnboardingAssessment({
        userId: getUserId(req),
        hasBeenDietingRecently: data.hasBeenDietingRecently,
        dietingDurationMonths: data.dietingDurationMonths,
        previousLowestCalories: data.previousLowestCalories,
        typicalDailyEating: data.typicalDailyEating,
        biggestHurdles: data.biggestHurdles,
        relationshipWithFood: data.relationshipWithFood,
        doesResistanceTraining: data.doesResistanceTraining,
        resistanceTrainingFrequency: data.resistanceTrainingFrequency,
        resistanceTrainingType: data.resistanceTrainingType,
        doesCardio: data.doesCardio,
        averageDailySteps: data.averageDailySteps,
        physicalLimitations: data.physicalLimitations,
        knowsRIR: data.knowsRIR,
        occupation: data.occupation,
        activityLevel: data.activityLevel,
        averageSleepHours: data.averageSleepHours,
        sleepQuality: data.sleepQuality,
        stressLevel: data.stressLevel,
        stressSources: data.stressSources,
        energyLevelMorning: data.energyLevelMorning,
        energyLevelAfternoon: data.energyLevelAfternoon,
        digestionQuality: data.digestionQuality,
        moodGeneral: data.moodGeneral,
        menstrualStatus: data.menstrualStatus,
        usesWearable: data.usesWearable,
        wearableType: data.wearableType,
        metabolicState: targets.recommendedPhase === "recovery" ? "adapted" : "healthy",
        recommendedStartPhase: targets.recommendedPhase,
      });

      // Send welcome message from AI mentor
      const welcomeMessage = `Welcome to VitalPath, ${data.firstName}! I'm your AI health mentor, and I'm here to guide you on your body recomposition journey.

Based on your assessment, I've created a personalized plan for you. Your recommended starting phase is **${targets.recommendedPhase === "recovery" ? "Metabolic Recovery" : targets.recommendedPhase === "cutting" ? "Fat Loss" : "Body Recomposition"}**.

Here are your daily targets:
- **Calories**: ${targets.targetCalories} kcal
- **Protein**: ${targets.proteinGrams}g
- **Carbs**: ${targets.carbsGrams}g
- **Fat**: ${targets.fatGrams}g

Feel free to ask me any questions about your plan, nutrition, training, or anything else related to your health journey. I'm here to help! 💪`;

      await storage.createChatMessage({
        userId: getUserId(req),
        role: "assistant",
        content: welcomeMessage,
        contextType: "onboarding",
      });

      res.json({ profile, targets });
    } catch (error) {
      console.error("Error processing onboarding:", error);
      res.status(500).json({ error: "Failed to process onboarding" });
    }
  });

  // ==================== User Milestones Routes ====================

  // Get all milestones for the user
  app.get("/api/milestones", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const milestones = await storage.getUserMilestones(getUserId(req));
      const unseenMilestones = milestones.filter(m => !m.seenAt);

      // Define all possible milestone keys with their requirements
      const allMilestoneKeys = [
        { key: "first_food_log", requiredAction: "Log your first food entry" },
        { key: "first_workout", requiredAction: "Complete your first workout" },
        { key: "day_2_streak", requiredAction: "Log for 2 consecutive days" },
        { key: "day_3", requiredAction: "Log for 3 consecutive days" },
        { key: "first_week", requiredAction: "Complete your first week" },
      ];

      // Build milestone status list
      const milestoneStatus = allMilestoneKeys.map(mk => {
        const achieved = milestones.find(m => m.milestoneKey === mk.key);
        return {
          key: mk.key,
          achieved: !!achieved,
          achievedAt: achieved?.achievedAt || null,
          seen: achieved?.seenAt ? true : false,
          data: achieved?.data || null,
        };
      });

      // Find next unachieved milestone
      const nextMilestone = allMilestoneKeys.find(mk =>
        !milestones.some(m => m.milestoneKey === mk.key)
      ) || null;

      res.json({
        milestones: milestoneStatus,
        unseenCount: unseenMilestones.length,
        nextMilestone,
      });
    } catch (error) {
      console.error("Error fetching milestones:", error);
      res.status(500).json({ error: "Failed to fetch milestones" });
    }
  });

  // Mark a milestone as seen
  app.post("/api/milestones/:key/seen", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const milestone = await storage.markMilestoneSeen(getUserId(req), key);

      if (!milestone) {
        res.status(404).json({ error: "Milestone not found" });
        return;
      }

      res.json({ success: true, milestone });
    } catch (error) {
      console.error("Error marking milestone as seen:", error);
      res.status(500).json({ error: "Failed to update milestone" });
    }
  });

  // ==================== Progressive Prompts Routes ====================

  // Get the next progressive prompt to show the user
  app.get("/api/onboarding/next-prompt", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const nextPrompt = await storage.getNextProgressivePrompt(getUserId(req));
      res.json(nextPrompt);
    } catch (error) {
      console.error("Error fetching next prompt:", error);
      res.status(500).json({ error: "Failed to fetch next prompt" });
    }
  });

  // Save a progressive prompt answer
  app.post("/api/onboarding/progressive", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { promptKey, value, skipped } = req.body;

      if (!promptKey) {
        res.status(400).json({ error: "promptKey is required" });
        return;
      }

      // Check if already answered
      const existing = await storage.getProgressivePrompt(getUserId(req), promptKey);
      if (existing) {
        res.status(400).json({ error: "Prompt already answered" });
        return;
      }

      // Save the prompt response
      await storage.createProgressivePrompt({
        userId: getUserId(req),
        promptKey,
        value: skipped ? null : value,
        skipped: skipped || false,
      });

      // Get the next prompt to return
      const nextPrompt = await storage.getNextProgressivePrompt(getUserId(req));

      res.json({ success: true, nextPrompt });
    } catch (error) {
      console.error("Error saving progressive prompt:", error);
      res.status(500).json({ error: "Failed to save prompt response" });
    }
  });

  // Get all answered progressive prompts
  app.get("/api/onboarding/progressive", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const prompts = await storage.getProgressivePrompts(getUserId(req));
      res.json(prompts);
    } catch (error) {
      console.error("Error fetching progressive prompts:", error);
      res.status(500).json({ error: "Failed to fetch prompts" });
    }
  });

  // ==================== First-Week Magic Routes ====================

  // Get Day 1 insight based on assessment data (no logs required)
  app.get("/api/insights/day-one", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const insight = await generateDayOneInsight(getUserId(req));
      res.json({ insight });
    } catch (error) {
      console.error("Error generating day one insight:", error);
      res.status(500).json({ error: "Failed to generate insight" });
    }
  });

  // Get first week report (for day 7 milestone)
  app.get("/api/first-week-report", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const report = await generateFirstWeekReport(getUserId(req));
      if (!report) {
        res.status(404).json({ error: "Could not generate report" });
        return;
      }
      res.json(report);
    } catch (error) {
      console.error("Error generating first week report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  // ==================== Daily Log Routes ====================

  app.get("/api/daily-logs/today", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getProfile(userId);
      const userTimezone = getSafeTimezone(profile?.timezone);
      const today = getTodayInTimezone(userTimezone);
      const log = await storage.getDailyLog(userId, today);
      res.json(log || null);
    } catch (error) {
      console.error("Error fetching today's log:", error);
      res.status(500).json({ error: "Failed to fetch log" });
    }
  });

  app.get("/api/daily-logs/:date", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { date } = req.params;
      const log = await storage.getDailyLog(getUserId(req), date);
      res.json(log || null);
    } catch (error) {
      console.error("Error fetching log:", error);
      res.status(500).json({ error: "Failed to fetch log" });
    }
  });

  app.get("/api/daily-logs/range/:timeRange", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getProfile(userId);
      const userTimezone = getSafeTimezone(profile?.timezone);

      const { timeRange } = req.params;
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      const startDate = getDaysAgoInTimezone(userTimezone, days);
      const endDate = getTodayInTimezone(userTimezone);

      const logs = await storage.getDailyLogs(userId, startDate, endDate);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  app.post("/api/daily-logs", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Validate input
      const parseResult = dailyLogInputSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: "Invalid daily log data", details: parseResult.error.flatten() });
        return;
      }
      
      const data = {
        ...parseResult.data,
        userId: getUserId(req),
      };
      
      const log = await storage.createOrUpdateDailyLog(data);
      res.json(log);
    } catch (error) {
      console.error("Error saving log:", error);
      res.status(500).json({ error: "Failed to save log" });
    }
  });

  // ==================== Food Entry Routes ====================

  app.get("/api/food-entries/:date", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { date } = req.params;
      const entries = await storage.getFoodEntries(getUserId(req), date);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching food entries:", error);
      res.status(500).json({ error: "Failed to fetch food entries" });
    }
  });

  app.post("/api/food-entries", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Validate input
      const parseResult = foodEntryInputSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: "Invalid food entry data", details: parseResult.error.flatten() });
        return;
      }

      const userId = getUserId(req);
      const data = {
        ...parseResult.data,
        userId,
      };

      const entry = await storage.createFoodEntry(data);

      // Check and trigger first_food_log milestone (don't block on errors)
      try {
        console.log(`[MILESTONE] Checking first_food_log for user ${userId}`);
        const existingMilestone = await storage.getUserMilestone(userId, "first_food_log");
        console.log(`[MILESTONE] Existing milestone:`, existingMilestone);
        if (!existingMilestone) {
          console.log(`[MILESTONE] Creating first_food_log milestone...`);
          const newMilestone = await storage.createUserMilestone({
            userId,
            milestoneKey: "first_food_log",
            data: { foodName: entry.foodName, calories: entry.calories },
          });
          console.log(`[MILESTONE] Created first_food_log milestone:`, newMilestone);
        } else {
          console.log(`[MILESTONE] Milestone already exists, skipping creation`);
        }
      } catch (milestoneError) {
        console.error("[MILESTONE] Error creating first_food_log milestone:", milestoneError);
      }

      // Check for streak milestones (don't block on errors)
      try {
        await checkStreakMilestones(userId);
      } catch (streakError) {
        console.error("Error checking streak milestones:", streakError);
      }

      res.json(entry);
    } catch (error) {
      console.error("Error creating food entry:", error);
      res.status(500).json({ error: "Failed to create food entry" });
    }
  });

  app.delete("/api/food-entries/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteFoodEntry(id, getUserId(req));

      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Food entry not found" });
      }
    } catch (error) {
      console.error("Error deleting food entry:", error);
      res.status(500).json({ error: "Failed to delete food entry" });
    }
  });

  // Update a food entry (e.g., change meal type for drag-and-drop)
  app.patch("/api/food-entries/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      const updates = req.body;

      // Validate mealType if provided
      if (updates.mealType && !["breakfast", "lunch", "dinner", "snack"].includes(updates.mealType)) {
        res.status(400).json({ error: "Invalid meal type" });
        return;
      }

      const updatedEntry = await storage.updateFoodEntry(id, userId, updates);

      if (updatedEntry) {
        res.json(updatedEntry);
      } else {
        res.status(404).json({ error: "Food entry not found" });
      }
    } catch (error) {
      console.error("Error updating food entry:", error);
      res.status(500).json({ error: "Failed to update food entry" });
    }
  });

  // ==================== Exercise Log Routes ====================

  // Get exercise logs for a date
  app.get("/api/exercise-logs/:date", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { date } = req.params;
      const logs = await storage.getExerciseLogs(getUserId(req), date);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching exercise logs:", error);
      res.status(500).json({ error: "Failed to fetch exercise logs" });
    }
  });

  // Create a new exercise log
  app.post("/api/exercise-logs", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Validate input
      const parseResult = insertExerciseLogSchema.omit({ userId: true }).safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: "Invalid exercise log data", details: parseResult.error.flatten() });
        return;
      }

      const userId = getUserId(req);
      const log = await storage.createExerciseLog({
        ...parseResult.data,
        userId,
      });

      // Check and trigger first_workout milestone
      const existingMilestone = await storage.getUserMilestone(userId, "first_workout");
      if (!existingMilestone) {
        await storage.createUserMilestone({
          userId,
          milestoneKey: "first_workout",
          data: { exerciseName: log.exerciseName },
        });
      }

      // Check for streak milestones
      await checkStreakMilestones(userId);

      res.json(log);
    } catch (error) {
      console.error("Error creating exercise log:", error);
      res.status(500).json({ error: "Failed to create exercise log" });
    }
  });

  // Bulk create exercise logs (for loading a workout template)
  app.post("/api/exercise-logs/bulk", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { exercises, workoutTemplateId, logDate } = req.body;
      const userId = getUserId(req);

      // Delete existing logs for this date first (to allow re-selecting workout)
      await storage.deleteExerciseLogsByDate(userId, logDate);

      // Create new logs for each exercise
      const logs = [];
      for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i];
        const log = await storage.createExerciseLog({
          userId,
          workoutTemplateId,
          logDate,
          exerciseName: exercise.name,
          exerciseOrder: i,
          prescribedSets: exercise.sets,
          prescribedReps: exercise.reps,
          prescribedRir: exercise.rir ?? null,
          completedSets: null,
          setDetails: null,
          notes: exercise.notes ?? null,
          skipped: false,
        });
        logs.push(log);
      }

      res.json(logs);
    } catch (error) {
      console.error("Error bulk creating exercise logs:", error);
      res.status(500).json({ error: "Failed to create exercise logs" });
    }
  });

  // Update an exercise log (for logging weights/reps)
  app.patch("/api/exercise-logs/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const log = await storage.updateExerciseLog(id, getUserId(req), req.body);

      if (log) {
        res.json(log);
      } else {
        res.status(404).json({ error: "Exercise log not found" });
      }
    } catch (error) {
      console.error("Error updating exercise log:", error);
      res.status(500).json({ error: "Failed to update exercise log" });
    }
  });

  // Delete an exercise log
  app.delete("/api/exercise-logs/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteExerciseLog(id, getUserId(req));

      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Exercise log not found" });
      }
    } catch (error) {
      console.error("Error deleting exercise log:", error);
      res.status(500).json({ error: "Failed to delete exercise log" });
    }
  });

  // ==================== Chat Routes ====================

  app.get("/api/chat/messages", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const messages = await storage.getChatMessages(getUserId(req));
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/chat/send", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);

      // Rate limit check for AI endpoints
      const rateCheck = checkRateLimit(userId);
      if (!rateCheck.allowed) {
        res.status(429).json({
          error: "Too many requests",
          message: "Please wait before sending more messages",
          retryAfter: rateCheck.retryAfter,
        });
        return;
      }

      // Validate input
      const parseResult = chatMessageSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: "Invalid message data", details: parseResult.error.flatten() });
        return;
      }
      const { content } = parseResult.data;

      // Get user profile for timezone
      const profile = await storage.getProfile(userId);
      const userTimezone = getSafeTimezone(profile?.timezone);
      const today = getTodayInTimezone(userTimezone);

      // ========== PARSE USER MESSAGE FOR TRACKABLE DATA ==========
      // This ensures chat and QuickNote have identical behavior
      const nlpResult = await parseNaturalLanguageInput(content, userTimezone);

      // Track what was logged
      const loggedData: {
        foodEntries: any[];
        exerciseLogs: any[];
        dailyLogChanges: string[];
        dailyLogUpdated: boolean;
        workoutCompleted: boolean;
        workoutType?: string;
      } = {
        foodEntries: [],
        exerciseLogs: [],
        dailyLogChanges: [],
        dailyLogUpdated: false,
        workoutCompleted: false,
      };

      // 1. Create food entries
      if (nlpResult.foods.length > 0) {
        for (const food of nlpResult.foods) {
          try {
            const entry = await storage.createFoodEntry({
              userId,
              logDate: today,
              mealType: food.mealType,
              foodName: food.foodName,
              servingSize: food.servingSize,
              servingQuantity: food.servingQuantity,
              calories: food.calories,
              proteinGrams: food.proteinGrams,
              carbsGrams: food.carbsGrams,
              fatGrams: food.fatGrams,
              fiberGrams: food.fiberGrams,
            });
            loggedData.foodEntries.push(entry);
          } catch (err) {
            console.error("Error creating food entry from chat:", err);
          }
        }
      }

      // 2. Create exercise logs
      if (nlpResult.exercises.length > 0) {
        for (let i = 0; i < nlpResult.exercises.length; i++) {
          const exercise = nlpResult.exercises[i];
          try {
            let setDetails: { reps: number; weightKg?: number }[] | undefined;
            if (exercise.sets && exercise.reps) {
              const repsNum = parseInt(exercise.reps) || 10;
              setDetails = Array(exercise.sets).fill(null).map(() => ({
                reps: repsNum,
                weightKg: exercise.weightKg,
              }));
            }

            const exerciseLog = await storage.createExerciseLog({
              userId,
              logDate: today,
              exerciseName: exercise.exerciseName,
              exerciseOrder: i + 1,
              prescribedSets: exercise.sets,
              prescribedReps: exercise.reps,
              completedSets: exercise.sets,
              setDetails,
              notes: exercise.notes || (exercise.durationMinutes ? `${exercise.durationMinutes} minutes` : undefined),
            });
            loggedData.exerciseLogs.push(exerciseLog);
          } catch (err) {
            console.error("Error creating exercise log from chat:", err);
          }
        }
      }

      // 3. Update daily log with biofeedback data
      const updates = nlpResult.dailyLogUpdates;
      const hasUpdates = Object.values(updates).some(v => v !== undefined);

      if (hasUpdates || nlpResult.workoutCompleted) {
        try {
          const logUpdates: Record<string, any> = {};
          const existingLog = await storage.getDailyLog(userId, today);

          if (updates.sleepHours !== undefined) {
            logUpdates.sleepHours = updates.sleepHours;
            loggedData.dailyLogChanges.push(`Sleep: ${updates.sleepHours}h`);
          }
          if (updates.sleepQuality !== undefined) {
            logUpdates.sleepQuality = updates.sleepQuality;
            loggedData.dailyLogChanges.push(`Sleep quality: ${updates.sleepQuality}/10`);
          }
          if (updates.steps !== undefined) {
            logUpdates.steps = updates.steps;
            const existingSteps = existingLog?.steps || 0;
            const newTotal = existingSteps + updates.steps;
            if (existingSteps > 0) {
              loggedData.dailyLogChanges.push(`Steps: +${updates.steps.toLocaleString()} (${newTotal.toLocaleString()} total)`);
            } else {
              loggedData.dailyLogChanges.push(`Steps: ${updates.steps.toLocaleString()}`);
            }
          }
          if (updates.energyLevel !== undefined) {
            logUpdates.energyLevel = updates.energyLevel;
            loggedData.dailyLogChanges.push(`Energy: ${updates.energyLevel}/10`);
          }
          if (updates.stressLevel !== undefined) {
            logUpdates.stressLevel = updates.stressLevel;
            loggedData.dailyLogChanges.push(`Stress: ${updates.stressLevel}/10`);
          }
          if (updates.moodRating !== undefined) {
            logUpdates.moodRating = updates.moodRating;
            loggedData.dailyLogChanges.push(`Mood: ${updates.moodRating}/10`);
          }
          if (updates.weightKg !== undefined) {
            logUpdates.weightKg = updates.weightKg;
            loggedData.dailyLogChanges.push(`Weight: ${updates.weightKg}kg`);
          }
          if (updates.waterLiters !== undefined) {
            logUpdates.waterLiters = updates.waterLiters;
            const existingWater = existingLog?.waterLiters || 0;
            const newTotal = existingWater + updates.waterLiters;
            if (existingWater > 0) {
              loggedData.dailyLogChanges.push(`Water: +${updates.waterLiters}L (${newTotal}L total)`);
            } else {
              loggedData.dailyLogChanges.push(`Water: ${updates.waterLiters}L`);
            }
          }
          if (nlpResult.workoutCompleted) {
            logUpdates.workoutCompleted = true;
            if (nlpResult.workoutType) {
              logUpdates.workoutType = nlpResult.workoutType;
            }
            loggedData.dailyLogChanges.push(`Workout: ${nlpResult.workoutType || "completed"}`);
            loggedData.workoutCompleted = true;
            loggedData.workoutType = nlpResult.workoutType;
          }

          if (Object.keys(logUpdates).length > 0) {
            await storage.createOrUpdateDailyLog({
              userId,
              logDate: today,
              ...logUpdates,
            }, { accumulate: true });
            loggedData.dailyLogUpdated = true;
          }
        } catch (err) {
          console.error("Error updating daily log from chat:", err);
        }
      }

      // 4. Save as health note if it contains contextual info
      if (nlpResult.isHealthNote) {
        try {
          await storage.createHealthNote({
            userId,
            content: content.trim(),
            category: "general",
            isActive: true,
          });
        } catch (err) {
          console.error("Error creating health note from chat:", err);
        }
      }

      // 5. Create meal template if user is describing a recurring meal
      let createdMealTemplate: { id: string; name: string } | undefined;
      if (nlpResult.mealTemplateIntent?.shouldCreateTemplate && nlpResult.foods.length > 0) {
        try {
          // Check if a similar template already exists
          const foodNames = nlpResult.foods.map(f => f.foodName);
          const existingTemplate = await storage.findSimilarMealTemplate(
            userId,
            foodNames,
            nlpResult.mealTemplateIntent.mealType
          );

          if (!existingTemplate) {
            // Calculate totals from foods
            const totalCalories = nlpResult.foods.reduce((sum, f) => sum + f.calories, 0);
            const totalProtein = nlpResult.foods.reduce((sum, f) => sum + f.proteinGrams, 0);
            const totalCarbs = nlpResult.foods.reduce((sum, f) => sum + f.carbsGrams, 0);
            const totalFat = nlpResult.foods.reduce((sum, f) => sum + f.fatGrams, 0);

            // Create the template
            const templateName = nlpResult.mealTemplateIntent.templateName ||
              `My ${nlpResult.mealTemplateIntent.mealType || "meal"}`;

            const template = await storage.createMealTemplate({
              userId,
              name: templateName,
              mealType: nlpResult.mealTemplateIntent.mealType,
              totalCalories,
              totalProtein,
              totalCarbs,
              totalFat,
              items: nlpResult.foods.map(f => ({
                foodName: f.foodName,
                servingSize: f.servingSize,
                quantity: f.servingQuantity,
                calories: f.calories,
                protein: f.proteinGrams,
                carbs: f.carbsGrams,
                fat: f.fatGrams,
              })),
            });

            createdMealTemplate = { id: template.id, name: template.name };
            console.log(`[Chat] Created meal template "${template.name}" for user ${userId}`);
          } else {
            console.log(`[Chat] Similar template "${existingTemplate.name}" already exists, skipping creation`);
          }
        } catch (err) {
          console.error("Error creating meal template from chat:", err);
        }
      }

      // 6. Auto-detect repeated meals and suggest/create templates
      // Only trigger if we just logged foods AND no template was explicitly created
      let autoDetectedTemplate: { id: string; name: string; isNew: boolean } | undefined;
      if (nlpResult.foods.length > 0 && !createdMealTemplate) {
        try {
          // Get recent food entries for this user to detect patterns
          const recentFoodStart = format(subDays(new Date(), 7), "yyyy-MM-dd");
          const recentFoods = await storage.getFoodEntriesRange(userId, recentFoodStart, today);

          // Group foods by meal (same date + same meal type within 5 min window)
          const mealGroups: Map<string, { foods: string[]; count: number; mealType: string }> = new Map();

          // Group current logged foods
          const currentFoodNames = nlpResult.foods.map(f => f.foodName.toLowerCase().trim()).sort();
          const currentMealKey = currentFoodNames.join("|");
          const currentMealType = nlpResult.foods[0]?.mealType || "snack";

          // Find similar meals in recent history
          for (const entry of recentFoods) {
            // Skip today's entries (we just added them)
            if (entry.logDate === today) continue;

            const entryKey = `${entry.logDate}|${entry.mealType}`;
            if (!mealGroups.has(entryKey)) {
              mealGroups.set(entryKey, { foods: [], count: 0, mealType: entry.mealType || "snack" });
            }
            const group = mealGroups.get(entryKey)!;
            group.foods.push(entry.foodName?.toLowerCase().trim() || "");
          }

          // Check if current meal matches any historical meals 3+ times
          let matchCount = 0;
          mealGroups.forEach((group, key) => {
            const historicalFoods = group.foods.sort();

            // Check similarity (at least 70% match)
            const matchingFoods = currentFoodNames.filter((name: string) =>
              historicalFoods.some((hf: string) => hf.includes(name) || name.includes(hf))
            );
            const similarity = matchingFoods.length / Math.max(currentFoodNames.length, historicalFoods.length);

            if (similarity >= 0.7) {
              matchCount++;
            }
          });

          // If this meal appears 3+ times in history, auto-create a template
          if (matchCount >= 2) { // 2 historical + 1 current = 3 total occurrences
            // Check if template already exists
            const existingTemplate = await storage.findSimilarMealTemplate(
              userId,
              nlpResult.foods.map(f => f.foodName),
              currentMealType
            );

            if (!existingTemplate) {
              // Calculate totals
              const totalCalories = nlpResult.foods.reduce((sum, f) => sum + f.calories, 0);
              const totalProtein = nlpResult.foods.reduce((sum, f) => sum + f.proteinGrams, 0);
              const totalCarbs = nlpResult.foods.reduce((sum, f) => sum + f.carbsGrams, 0);
              const totalFat = nlpResult.foods.reduce((sum, f) => sum + f.fatGrams, 0);

              // Generate a template name
              const templateName = `Frequent ${currentMealType.charAt(0).toUpperCase() + currentMealType.slice(1)}`;

              const template = await storage.createMealTemplate({
                userId,
                name: templateName,
                mealType: currentMealType,
                totalCalories,
                totalProtein,
                totalCarbs,
                totalFat,
                items: nlpResult.foods.map(f => ({
                  foodName: f.foodName,
                  servingSize: f.servingSize,
                  quantity: f.servingQuantity,
                  calories: f.calories,
                  protein: f.proteinGrams,
                  carbs: f.carbsGrams,
                  fat: f.fatGrams,
                })),
              });

              autoDetectedTemplate = { id: template.id, name: template.name, isNew: true };
              console.log(`[Chat] Auto-created meal template "${template.name}" for user ${userId} (detected ${matchCount + 1} occurrences)`);
            }
          }
        } catch (err) {
          console.error("Error in auto-detect meal template:", err);
        }
      }
      // ========== END PARSING ==========

      // Save user message
      await storage.createChatMessage({
        userId,
        role: "user",
        content,
        contextType: "question",
      });

      // Get context for AI - fetch ALL user data for comprehensive awareness
      const assessment = await storage.getOnboardingAssessment(userId);

      // Get last 14 days of logs for trend analysis
      const endDate = format(new Date(), "yyyy-MM-dd");
      const startDate = format(subDays(new Date(), 14), "yyyy-MM-dd");
      const recentLogs = await storage.getDailyLogs(userId, startDate, endDate);

      // Get food entries for last 7 days (single query)
      const foodStartDate = format(subDays(new Date(), 7), "yyyy-MM-dd");
      const allFoodEntries = await storage.getFoodEntriesRange(userId, foodStartDate, endDate);

      // Get exercise logs for last 14 days (single query)
      const allExerciseLogs = await storage.getExerciseLogsRange(userId, startDate, endDate);

      // Get user's health notes for context
      const healthNotes = await storage.getRecentHealthNotes(userId, 14);

      const messageHistory = await storage.getChatMessages(userId, 20);

      // Get real-time daily progress summary for the AI
      const dailyProgressSummary = await getDailyProgressSummary(userId);

      // Generate AI response with full context
      const aiResponse = await generateMentorResponse(
        content,
        messageHistory.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        {
          profile,
          recentLogs,
          assessment,
          foodEntries: allFoodEntries,
          exerciseLogs: allExerciseLogs,
          healthNotes,
          dailyProgressSummary,
        }
      );

      // Save AI response
      const assistantMessage = await storage.createChatMessage({
        userId: getUserId(req),
        role: "assistant",
        content: aiResponse,
        contextType: "coaching",
      });

      // Parse AI response for actionable changes and auto-apply them
      let appliedChanges: string[] = [];
      if (profile) {
        try {
          console.log("[AI Parser] Parsing AI response for actions...");
          const parsedActions = await parseAIResponseForActions(aiResponse, profile);
          console.log("[AI Parser] Parse result:", JSON.stringify(parsedActions, null, 2));

          if (parsedActions.hasChanges && parsedActions.changes.length > 0) {
            // Prepare and apply profile updates
            const { profileUpdates, changeRecords } = prepareProfileUpdates(
              parsedActions.changes,
              profile,
              assistantMessage.id
            );
            console.log("[AI Parser] Profile updates to apply:", JSON.stringify(profileUpdates, null, 2));

            // Apply updates to profile
            if (Object.keys(profileUpdates).length > 0) {
              const updatedProfile = await storage.updateProfile(getUserId(req), profileUpdates);
              console.log("[AI Parser] Profile updated successfully. New targetCalories:", updatedProfile?.targetCalories);

              // Log all changes to history
              for (const change of changeRecords) {
                await storage.createProfileChange(change);
                appliedChanges.push(change.changeDescription);
              }

              // Create a notification about the changes
              await storage.createNotification({
                userId: getUserId(req),
                type: "insight",
                title: "Your plan has been updated",
                message: `Based on your conversation: ${appliedChanges.join(", ")}`,
                actionUrl: "/settings",
              });
            }
          }
        } catch (parseError) {
          console.error("Error parsing AI actions (non-fatal):", parseError);
          // Continue - don't fail the chat just because parsing failed
        }
      }

      // Return response with metadata about changes AND logged data
      res.json({
        ...assistantMessage,
        appliedChanges: appliedChanges.length > 0 ? appliedChanges : undefined,
        // Include logged data so client can invalidate correct queries
        loggedData: {
          foodsLogged: loggedData.foodEntries.length,
          foodEntries: loggedData.foodEntries,
          exercisesLogged: loggedData.exerciseLogs.length,
          exerciseLogs: loggedData.exerciseLogs,
          dailyLogUpdated: loggedData.dailyLogUpdated,
          dailyLogChanges: loggedData.dailyLogChanges,
          workoutCompleted: loggedData.workoutCompleted,
          workoutType: loggedData.workoutType,
          mealTemplateCreated: createdMealTemplate,
          autoDetectedMealTemplate: autoDetectedTemplate,
        },
      });
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  // ==================== Wearable Routes ====================

  app.get("/api/wearables", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const connections = await storage.getWearableConnections(getUserId(req));
      res.json(connections);
    } catch (error) {
      console.error("Error fetching wearables:", error);
      res.status(500).json({ error: "Failed to fetch wearables" });
    }
  });

  app.post("/api/wearables/connect", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { provider } = req.body;
      
      // In a real app, this would initiate OAuth flow
      // For now, we'll just create a pending connection
      const connection = await storage.createOrUpdateWearableConnection({
        userId: getUserId(req),
        provider,
        isConnected: false,
      });

      // Return a mock auth URL (in production, this would be the real OAuth URL)
      res.json({
        connection,
        authUrl: `https://api.${provider}.com/oauth/authorize?client_id=demo`,
      });
    } catch (error) {
      console.error("Error connecting wearable:", error);
      res.status(500).json({ error: "Failed to connect wearable" });
    }
  });

  app.post("/api/wearables/disconnect", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { provider } = req.body;
      const success = await storage.deleteWearableConnection(getUserId(req), provider);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Connection not found" });
      }
    } catch (error) {
      console.error("Error disconnecting wearable:", error);
      res.status(500).json({ error: "Failed to disconnect wearable" });
    }
  });

  // ==================== Workout Routes ====================

  // Get workouts, optionally filtered by user's current phase
  app.get("/api/workouts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { phase, type } = req.query;
      const templates = await storage.getWorkoutTemplates();

      // Get user's current phase if not specified
      let filterPhase = phase as string | undefined;
      if (!filterPhase) {
        const profile = await storage.getProfile(getUserId(req));
        filterPhase = profile?.currentPhase || undefined;
      }

      // Filter and sort by phase relevance
      let filtered = templates;

      if (filterPhase && filterPhase !== "assessment") {
        filtered = templates.filter((workout) => {
          const phases = workout.phases as string[] | null;
          return phases ? phases.includes(filterPhase!) : true;
        });

        // Sort by phasePriority (higher = more recommended)
        filtered.sort((a, b) => (b.phasePriority || 5) - (a.phasePriority || 5));
      }

      // Additionally filter by type if specified
      if (type && typeof type === "string") {
        filtered = filtered.filter((workout) => workout.type === type);
      }

      res.json(filtered);
    } catch (error) {
      console.error("Error fetching workouts:", error);
      res.status(500).json({ error: "Failed to fetch workouts" });
    }
  });

  // Get recommended workouts for the user's current phase
  app.get("/api/workouts/recommended", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const profile = await storage.getProfile(getUserId(req));
      const currentPhase = profile?.currentPhase || "recomp";

      const templates = await storage.getWorkoutTemplates();

      // Filter to workouts for this phase, sorted by priority
      const recommended = templates
        .filter((workout) => {
          const phases = workout.phases as string[] | null;
          return phases ? phases.includes(currentPhase) : true;
        })
        .sort((a, b) => (b.phasePriority || 5) - (a.phasePriority || 5))
        .slice(0, 5); // Top 5 recommendations

      res.json({
        phase: currentPhase,
        workouts: recommended,
        message: getPhaseWorkoutMessage(currentPhase),
      });
    } catch (error) {
      console.error("Error fetching recommended workouts:", error);
      res.status(500).json({ error: "Failed to fetch recommended workouts" });
    }
  });

  // ==================== Educational Content Routes ====================
  
  app.get("/api/educational-content", async (req: Request, res: Response) => {
    try {
      const content = await storage.getEducationalContent();
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  app.get("/api/educational-content/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const content = await storage.getEducationalContentBySlug(slug);
      
      if (content) {
        res.json(content);
      } else {
        res.status(404).json({ error: "Content not found" });
      }
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  // ==================== Food Database Routes ====================

  app.get("/api/foods", async (req: Request, res: Response) => {
    try {
      const { q, source } = req.query;

      if (!q || typeof q !== "string" || q.length < 2) {
        // Return local foods if no query
        const foods = await storage.getAllFoods();
        res.json(foods.map(f => ({ ...f, source: "local" })));
        return;
      }

      // Search USDA API first (primary source with 300K+ foods)
      if (source !== "local") {
        const usdaFoods = await searchUSDAFoods(q, 25);
        if (usdaFoods.length > 0) {
          res.json(usdaFoods);
          return;
        }
      }

      // Fallback to local database
      const localFoods = await storage.searchFoods(q);
      res.json(localFoods.map(f => ({ ...f, source: "local" })));
    } catch (error) {
      console.error("Error fetching foods:", error);
      res.status(500).json({ error: "Failed to fetch foods" });
    }
  });

  // ==================== Health Insights Routes ====================

  app.get("/api/insights", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const insights = await generateInsights(getUserId(req));
      res.json(insights);
    } catch (error) {
      console.error("Error generating insights:", error);
      res.status(500).json({ error: "Failed to generate insights" });
    }
  });

  // ==================== Daily Guidance Route ====================

  // Get AI-generated daily guidance - what the user should do today
  app.get("/api/daily-guidance", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);

      // Rate limit check for AI endpoints
      const rateCheck = checkRateLimit(userId);
      if (!rateCheck.allowed) {
        res.status(429).json({
          error: "Too many requests",
          message: "Please wait before refreshing guidance",
          retryAfter: rateCheck.retryAfter,
        });
        return;
      }

      const profile = await storage.getProfile(userId);

      if (!profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      if (!profile.onboardingCompleted) {
        res.status(400).json({ error: "Please complete onboarding first" });
        return;
      }

      // Gather all context data for the AI
      const assessment = await storage.getOnboardingAssessment(userId);

      // Use user's timezone for all date calculations
      const userTimezone = getSafeTimezone(profile.timezone);
      const today = getTodayInTimezone(userTimezone);
      const yesterday = getYesterdayInTimezone(userTimezone);
      const weekAgo = getDaysAgoInTimezone(userTimezone, 7);
      const yearAgo = getDaysAgoInTimezone(userTimezone, 365);

      // Get today's log
      const todayLog = await storage.getDailyLog(userId, today);
      const yesterdayLog = await storage.getDailyLog(userId, yesterday);

      // Get recent logs for trend analysis
      const recentLogs = await storage.getDailyLogs(userId, weekAgo, today);

      // Get food entries for today and yesterday
      const todayFoodEntries = await storage.getFoodEntries(userId, today);
      const yesterdayFoodEntries = await storage.getFoodEntries(userId, yesterday);

      // Get exercise logs for the last 7 days
      const recentExerciseLogs = await storage.getExerciseLogsRange(userId, weekAgo, today);

      // Get active health notes for context
      const healthNotes = await storage.getRecentHealthNotes(userId, 14);

      // Check if we should use the persistent thread-based assistant
      const useAssistant = process.env.USE_ASSISTANT_API === "true";

      let guidance;

      if (useAssistant) {
        // Use OpenAI Assistants API with persistent threads
        // Only fetch yearly data on first call (thread initialization)
        const yearlyDailyLogs = await storage.getDailyLogs(userId, yearAgo, today);
        const yearlyExerciseLogs = await storage.getExerciseLogsRange(userId, yearAgo, today);
        const yearlyFoodEntries = await storage.getFoodEntriesRange(userId, yearAgo, today);
        const goals = await storage.getGoals(userId);

        guidance = await generateDailyGuidanceWithAssistant({
          userId,
          profile,
          assessment,
          todayLog,
          yesterdayLog,
          recentLogs,
          todayFoodEntries,
          yesterdayFoodEntries,
          recentExerciseLogs,
          healthNotes,
          currentHour: getCurrentHourInTimezone(userTimezone),
          yearlyDailyLogs,
          yearlyExerciseLogs,
          yearlyFoodEntries,
          goals,
        });
      } else {
        // Use one-shot completion (legacy mode)
        const yearlyDailyLogs = await storage.getDailyLogs(userId, yearAgo, today);
        const yearlyExerciseLogs = await storage.getExerciseLogsRange(userId, yearAgo, today);
        const yearlyFoodEntries = await storage.getFoodEntriesRange(userId, yearAgo, today);

        guidance = await generateDailyGuidance({
          profile,
          assessment,
          todayLog,
          yesterdayLog,
          recentLogs,
          todayFoodEntries,
          yesterdayFoodEntries,
          recentExerciseLogs,
          healthNotes,
          currentHour: getCurrentHourInTimezone(userTimezone),
          yearlyDailyLogs,
          yearlyExerciseLogs,
          yearlyFoodEntries,
        });
      }

      res.json(guidance);
    } catch (error) {
      console.error("Error generating daily guidance:", error);
      res.status(500).json({ error: "Failed to generate daily guidance" });
    }
  });

  // ==================== AI Recommendations Routes ====================

  // Get comprehensive AI-powered recommendations based on profile and recent data
  app.get("/api/ai-recommendations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);

      // Rate limit check for AI endpoints
      const rateCheck = checkRateLimit(userId);
      if (!rateCheck.allowed) {
        res.status(429).json({
          error: "Too many requests",
          message: "Please wait before requesting recommendations",
          retryAfter: rateCheck.retryAfter,
        });
        return;
      }

      const profile = await storage.getProfile(userId);

      if (!profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      const assessment = await storage.getOnboardingAssessment(userId);

      // Get recent logs (last 14 days)
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      const recentLogs = await storage.getDailyLogs(userId, startDate, endDate);

      // Get available workouts
      const workouts = await storage.getWorkoutTemplates();

      // Generate AI analysis
      const analysis = await analyzeProfileForRecommendations({
        profile,
        assessment,
        recentLogs,
        availableWorkouts: workouts,
      });

      res.json(analysis);
    } catch (error) {
      console.error("Error generating AI recommendations:", error);
      res.status(500).json({ error: "Failed to generate AI recommendations" });
    }
  });

  // Get quick workout recommendation for today
  app.get("/api/ai-recommendations/workout", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);

      // Rate limit check for AI endpoints
      const rateCheck = checkRateLimit(userId);
      if (!rateCheck.allowed) {
        res.status(429).json({
          error: "Too many requests",
          message: "Please wait before requesting workout recommendations",
          retryAfter: rateCheck.retryAfter,
        });
        return;
      }

      const profile = await storage.getProfile(userId);

      if (!profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      // Get recent logs (last 7 days)
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      const recentLogs = await storage.getDailyLogs(userId, startDate, endDate);

      // Get available workouts for current phase
      const workouts = await storage.getWorkoutTemplates();
      const phaseWorkouts = workouts.filter((w) => {
        const phases = w.phases as string[] | null;
        return phases ? phases.includes(profile.currentPhase || "recomp") : true;
      });

      const recommendation = await getQuickWorkoutRecommendation(
        profile,
        recentLogs,
        phaseWorkouts
      );

      if (recommendation) {
        res.json(recommendation);
      } else {
        res.json({
          workoutName: "Full Body Strength A",
          reasoning: "Start with a foundational full-body workout to build consistency.",
        });
      }
    } catch (error) {
      console.error("Error getting workout recommendation:", error);
      res.status(500).json({ error: "Failed to get workout recommendation" });
    }
  });

  // ==================== Notification Routes ====================

  app.get("/api/notifications", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const notifications = await storage.getNotifications(getUserId(req));
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const count = await storage.getUnreadNotificationCount(getUserId(req));
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  app.post("/api/notifications/:id/read", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.markNotificationAsRead(id, getUserId(req));

      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Notification not found" });
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/read-all", isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.markAllNotificationsAsRead(getUserId(req));
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // Trigger proactive check-in notifications based on time of day
  app.post("/api/notifications/check-in", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { timeOfDay } = req.body;
      if (!timeOfDay || !["morning", "afternoon", "evening"].includes(timeOfDay)) {
        res.status(400).json({ error: "Invalid timeOfDay. Must be: morning, afternoon, or evening" });
        return;
      }

      await sendProactiveNotifications(getUserId(req), timeOfDay);
      res.json({ success: true, message: `${timeOfDay} check-in notifications sent` });
    } catch (error) {
      console.error("Error sending check-in notifications:", error);
      res.status(500).json({ error: "Failed to send check-in notifications" });
    }
  });

  // Get real-time daily progress reminders (for display without storing)
  app.get("/api/notifications/reminders", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const reminders = await generateAfternoonReminders(getUserId(req));
      res.json(reminders);
    } catch (error) {
      console.error("Error generating reminders:", error);
      res.status(500).json({ error: "Failed to generate reminders" });
    }
  });

  // ==================== Phase Transition Routes ====================

  app.get("/api/phase-evaluation", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const evaluation = await evaluatePhaseTransition(getUserId(req));
      res.json(evaluation);
    } catch (error) {
      console.error("Error evaluating phase:", error);
      res.status(500).json({ error: "Failed to evaluate phase transition" });
    }
  });

  app.post("/api/phase-transition", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { newPhase } = req.body;

      if (!newPhase || !["recovery", "recomp", "cutting"].includes(newPhase)) {
        res.status(400).json({ error: "Invalid phase specified" });
        return;
      }

      const updatedProfile = await executePhaseTransition(getUserId(req), newPhase);
      res.json(updatedProfile);
    } catch (error) {
      console.error("Error transitioning phase:", error);
      res.status(500).json({ error: "Failed to transition phase" });
    }
  });

  // ==================== Profile Changes History Routes ====================

  // Get all profile changes (history)
  app.get("/api/profile-changes", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { limit, category } = req.query;
      const limitNum = limit ? parseInt(limit as string, 10) : 50;

      let changes;
      if (category && typeof category === "string") {
        changes = await storage.getProfileChangesByCategory(getUserId(req), category);
      } else {
        changes = await storage.getProfileChanges(getUserId(req), limitNum);
      }

      res.json(changes);
    } catch (error) {
      console.error("Error fetching profile changes:", error);
      res.status(500).json({ error: "Failed to fetch profile changes" });
    }
  });

  // Get recent changes summary (for dashboard/settings)
  app.get("/api/profile-changes/summary", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { days } = req.query;
      const daysNum = days ? parseInt(days as string, 10) : 30;

      const changes = await storage.getRecentChangeSummary(getUserId(req), daysNum);

      // Group changes by category for summary
      const summary: Record<string, { count: number; latestChange: string; changes: typeof changes }> = {};

      for (const change of changes) {
        if (!summary[change.changeCategory]) {
          summary[change.changeCategory] = {
            count: 0,
            latestChange: change.createdAt?.toISOString() || "",
            changes: [],
          };
        }
        summary[change.changeCategory].count++;
        summary[change.changeCategory].changes.push(change);
      }

      res.json({
        totalChanges: changes.length,
        periodDays: daysNum,
        byCategory: summary,
        recentChanges: changes.slice(0, 10), // Last 10 changes
      });
    } catch (error) {
      console.error("Error fetching profile changes summary:", error);
      res.status(500).json({ error: "Failed to fetch profile changes summary" });
    }
  });

  // Get changes linked to a specific chat message
  app.get("/api/profile-changes/chat/:chatMessageId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { chatMessageId } = req.params;
      const userId = getUserId(req);
      const changes = await storage.getProfileChangesByChatMessage(chatMessageId, userId);
      res.json(changes);
    } catch (error) {
      console.error("Error fetching chat-linked changes:", error);
      res.status(500).json({ error: "Failed to fetch chat-linked changes" });
    }
  });

  // ==================== AI Sync/Refresh Routes ====================

  // Trigger AI to analyze all user data and apply any needed updates
  app.post("/api/sync", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);

      // Rate limit check for AI endpoints
      const rateCheck = checkRateLimit(userId);
      if (!rateCheck.allowed) {
        res.status(429).json({
          error: "Too many requests",
          message: "Please wait before syncing again",
          retryAfter: rateCheck.retryAfter,
        });
        return;
      }

      const profile = await storage.getProfile(userId);

      if (!profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      // Gather all user data
      const assessment = await storage.getOnboardingAssessment(userId);
      const endDate = format(new Date(), "yyyy-MM-dd");
      const startDate = format(subDays(new Date(), 14), "yyyy-MM-dd");
      const recentLogs = await storage.getDailyLogs(userId, startDate, endDate);

      // Get food entries for last 7 days (single query)
      const foodStartDate = format(subDays(new Date(), 7), "yyyy-MM-dd");
      const allFoodEntries = await storage.getFoodEntriesRange(userId, foodStartDate, endDate);

      // Get exercise logs for last 14 days (single query)
      const allExerciseLogs = await storage.getExerciseLogsRange(userId, startDate, endDate);

      // Get daily progress summary
      const dailyProgressSummary = await getDailyProgressSummary(userId);

      // Generate AI analysis with a specific sync prompt
      const syncPrompt = `Please review my current data and let me know if any adjustments are needed to my targets or plan. Look at my recent logs, food entries, and exercise data to see if anything should be updated.`;

      const aiResponse = await generateMentorResponse(
        syncPrompt,
        [], // No conversation history for sync
        {
          profile,
          recentLogs,
          assessment,
          foodEntries: allFoodEntries,
          exerciseLogs: allExerciseLogs,
          dailyProgressSummary,
        }
      );

      // Save the sync message
      const assistantMessage = await storage.createChatMessage({
        userId,
        role: "assistant",
        content: aiResponse,
        contextType: "sync",
      });

      // Parse and apply any changes
      let appliedChanges: string[] = [];
      console.log("[AI Sync] Parsing sync response for actions...");
      const parsedActions = await parseAIResponseForActions(aiResponse, profile);
      console.log("[AI Sync] Parse result:", JSON.stringify(parsedActions, null, 2));

      if (parsedActions.hasChanges && parsedActions.changes.length > 0) {
        const { profileUpdates, changeRecords } = prepareProfileUpdates(
          parsedActions.changes,
          profile,
          assistantMessage.id
        );
        console.log("[AI Sync] Profile updates to apply:", JSON.stringify(profileUpdates, null, 2));

        if (Object.keys(profileUpdates).length > 0) {
          const updatedProfile = await storage.updateProfile(userId, profileUpdates);
          console.log("[AI Sync] Profile updated successfully. New targetCalories:", updatedProfile?.targetCalories);

          for (const change of changeRecords) {
            await storage.createProfileChange(change);
            appliedChanges.push(change.changeDescription);
          }

          // Create notification about the sync updates
          await storage.createNotification({
            userId,
            type: "insight",
            title: "Plan updated after sync",
            message: `Your AI mentor reviewed your data and made adjustments: ${appliedChanges.join(", ")}`,
            actionUrl: "/settings",
          });
        }
      }

      // Also evaluate phase transition as part of sync
      let phaseEvaluation = null;
      let phaseTransitioned = false;
      try {
        phaseEvaluation = await evaluatePhaseTransition(userId);

        // If ready for transition and we have a suggested phase, auto-transition
        if (phaseEvaluation.readyForTransition && phaseEvaluation.suggestedPhase) {
          const updatedProfile = await executePhaseTransition(userId, phaseEvaluation.suggestedPhase);
          phaseTransitioned = true;
          appliedChanges.push(`Phase changed to ${phaseEvaluation.suggestedPhase}`);

          // Create notification about phase transition
          const phaseNames: Record<string, string> = {
            recovery: "Metabolic Recovery",
            recomp: "Body Recomposition",
            cutting: "Fat Loss",
          };
          await storage.createNotification({
            userId,
            type: "celebration",
            title: `Welcome to ${phaseNames[phaseEvaluation.suggestedPhase] || phaseEvaluation.suggestedPhase}!`,
            message: phaseEvaluation.reason,
            actionUrl: "/",
          });
        }
      } catch (phaseError) {
        console.error("Error evaluating phase transition:", phaseError);
      }

      res.json({
        success: true,
        message: aiResponse,
        appliedChanges: appliedChanges.length > 0 ? appliedChanges : undefined,
        summary: parsedActions.messageSummary,
        phaseEvaluation: phaseEvaluation ? {
          currentPhase: phaseEvaluation.currentPhase,
          weeksInPhase: phaseEvaluation.weeksInPhase,
          readyForTransition: phaseEvaluation.readyForTransition,
          suggestedPhase: phaseEvaluation.suggestedPhase,
          reason: phaseEvaluation.reason,
          transitioned: phaseTransitioned,
        } : undefined,
      });
    } catch (error) {
      console.error("Error during AI sync:", error);
      res.status(500).json({ error: "Failed to sync with AI" });
    }
  });

  // ==================== Health Notes Routes ====================

  // Get user's health notes
  app.get("/api/health-notes", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { active } = req.query;
      const activeOnly = active !== "false";
      const notes = await storage.getHealthNotes(userId, activeOnly);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching health notes:", error);
      res.status(500).json({ error: "Failed to fetch health notes" });
    }
  });

  // Create a new health note (with comprehensive AI parsing for food, workouts, sleep, etc.)
  app.post("/api/health-notes", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { content, category, expiresInDays } = req.body;

      if (!content || typeof content !== "string" || content.trim().length === 0) {
        res.status(400).json({ error: "Note content is required" });
        return;
      }

      const trimmedContent = content.trim();

      // Get user's timezone for intelligent meal type detection
      const profile = await storage.getProfile(userId);
      const userTimezone = getSafeTimezone(profile?.timezone);
      const today = getTodayInTimezone(userTimezone);

      // Use AI to parse all trackable data from natural language
      const parseResult = await parseNaturalLanguageInput(trimmedContent, userTimezone);

      // Track what was created for the response
      const createdFoodEntries: any[] = [];
      const createdExerciseLogs: any[] = [];
      let dailyLogUpdated = false;
      const dailyLogChanges: string[] = [];

      // 1. Create food entries
      if (parseResult.foods.length > 0) {
        for (const food of parseResult.foods) {
          try {
            const entry = await storage.createFoodEntry({
              userId,
              logDate: today,
              mealType: food.mealType,
              foodName: food.foodName,
              servingSize: food.servingSize,
              servingQuantity: food.servingQuantity,
              calories: food.calories,
              proteinGrams: food.proteinGrams,
              carbsGrams: food.carbsGrams,
              fatGrams: food.fatGrams,
              fiberGrams: food.fiberGrams,
            });
            createdFoodEntries.push(entry);
          } catch (err) {
            console.error("Error creating food entry from note:", err);
          }
        }
      }

      // 2. Create exercise logs
      if (parseResult.exercises.length > 0) {
        for (let i = 0; i < parseResult.exercises.length; i++) {
          const exercise = parseResult.exercises[i];
          try {
            // Build set details if sets/reps/weight provided
            let setDetails: { reps: number; weightKg?: number }[] | undefined;
            if (exercise.sets && exercise.reps) {
              const repsNum = parseInt(exercise.reps) || 10;
              setDetails = Array(exercise.sets).fill(null).map(() => ({
                reps: repsNum,
                weightKg: exercise.weightKg,
              }));
            }

            const exerciseLog = await storage.createExerciseLog({
              userId,
              logDate: today,
              exerciseName: exercise.exerciseName,
              exerciseOrder: i + 1,
              prescribedSets: exercise.sets,
              prescribedReps: exercise.reps,
              completedSets: exercise.sets,
              setDetails,
              notes: exercise.notes || (exercise.durationMinutes ? `${exercise.durationMinutes} minutes` : undefined),
            });
            createdExerciseLogs.push(exerciseLog);
          } catch (err) {
            console.error("Error creating exercise log from note:", err);
          }
        }
      }

      // 3. Update daily log with any biofeedback data
      const updates = parseResult.dailyLogUpdates;
      const hasUpdates = Object.values(updates).some(v => v !== undefined);

      if (hasUpdates || parseResult.workoutCompleted) {
        try {
          const logUpdates: Record<string, any> = {};

          // Get existing log to calculate accumulated totals for display
          const existingLog = await storage.getDailyLog(userId, today);

          if (updates.sleepHours !== undefined) {
            logUpdates.sleepHours = updates.sleepHours;
            dailyLogChanges.push(`Sleep: ${updates.sleepHours}h`);
          }
          if (updates.sleepQuality !== undefined) {
            logUpdates.sleepQuality = updates.sleepQuality;
            dailyLogChanges.push(`Sleep quality: ${updates.sleepQuality}/10`);
          }
          if (updates.steps !== undefined) {
            logUpdates.steps = updates.steps;
            // Show the total after accumulation
            const existingSteps = existingLog?.steps || 0;
            const newTotal = existingSteps + updates.steps;
            if (existingSteps > 0) {
              dailyLogChanges.push(`Steps: +${updates.steps.toLocaleString()} (${newTotal.toLocaleString()} total)`);
            } else {
              dailyLogChanges.push(`Steps: ${updates.steps.toLocaleString()}`);
            }
          }
          if (updates.energyLevel !== undefined) {
            logUpdates.energyLevel = updates.energyLevel;
            dailyLogChanges.push(`Energy: ${updates.energyLevel}/10`);
          }
          if (updates.stressLevel !== undefined) {
            logUpdates.stressLevel = updates.stressLevel;
            dailyLogChanges.push(`Stress: ${updates.stressLevel}/10`);
          }
          if (updates.moodRating !== undefined) {
            logUpdates.moodRating = updates.moodRating;
            dailyLogChanges.push(`Mood: ${updates.moodRating}/10`);
          }
          if (updates.weightKg !== undefined) {
            logUpdates.weightKg = updates.weightKg;
            dailyLogChanges.push(`Weight: ${updates.weightKg}kg`);
          }
          if (updates.waterLiters !== undefined) {
            logUpdates.waterLiters = updates.waterLiters;
            // Show the total after accumulation
            const existingWater = existingLog?.waterLiters || 0;
            const newTotal = existingWater + updates.waterLiters;
            if (existingWater > 0) {
              dailyLogChanges.push(`Water: +${updates.waterLiters}L (${newTotal}L total)`);
            } else {
              dailyLogChanges.push(`Water: ${updates.waterLiters}L`);
            }
          }
          if (parseResult.workoutCompleted) {
            logUpdates.workoutCompleted = true;
            if (parseResult.workoutType) {
              logUpdates.workoutType = parseResult.workoutType;
            }
            dailyLogChanges.push(`Workout: ${parseResult.workoutType || "completed"}`);
          }

          if (Object.keys(logUpdates).length > 0) {
            // Use createOrUpdateDailyLog which handles both create and update
            // Pass accumulate: true so that steps and water ADD to existing values
            // instead of replacing them (e.g., 7500 steps + 1000 more = 8500 total)
            await storage.createOrUpdateDailyLog({
              userId,
              logDate: today,
              ...logUpdates,
            }, { accumulate: true });
            dailyLogUpdated = true;
          }
        } catch (err) {
          console.error("Error updating daily log from note:", err);
        }
      }

      // 4. Only save as health note if it contains contextual info worth remembering
      let note = null;
      if (parseResult.isHealthNote) {
        let expiresAt: Date | undefined;
        if (expiresInDays && typeof expiresInDays === "number" && expiresInDays > 0) {
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        }

        note = await storage.createHealthNote({
          userId,
          content: trimmedContent,
          category: category || "general",
          isActive: true,
          expiresAt,
        });
      }

      // Return comprehensive response
      res.json({
        note,
        foodEntries: createdFoodEntries,
        foodsLogged: createdFoodEntries.length,
        exerciseLogs: createdExerciseLogs,
        exercisesLogged: createdExerciseLogs.length,
        dailyLogUpdated,
        dailyLogChanges,
        workoutCompleted: parseResult.workoutCompleted,
        workoutType: parseResult.workoutType,
      });
    } catch (error) {
      console.error("Error creating health note:", error);
      res.status(500).json({ error: "Failed to create health note" });
    }
  });

  // Update a health note (e.g., mark as inactive)
  app.patch("/api/health-notes/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      const { isActive, category } = req.body;

      const updates: Record<string, any> = {};
      if (typeof isActive === "boolean") updates.isActive = isActive;
      if (category) updates.category = category;

      const note = await storage.updateHealthNote(id, userId, updates);

      if (!note) {
        res.status(404).json({ error: "Note not found" });
        return;
      }

      res.json(note);
    } catch (error) {
      console.error("Error updating health note:", error);
      res.status(500).json({ error: "Failed to update health note" });
    }
  });

  // Delete a health note
  app.delete("/api/health-notes/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      const deleted = await storage.deleteHealthNote(id, userId);

      if (!deleted) {
        res.status(404).json({ error: "Note not found" });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting health note:", error);
      res.status(500).json({ error: "Failed to delete health note" });
    }
  });

  // ==================== Body Measurements Routes ====================

  // Get all body measurements for user (most recent first)
  app.get("/api/body-measurements", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { limit, startDate, endDate } = req.query;

      let measurements;
      if (startDate && endDate) {
        measurements = await storage.getBodyMeasurementsRange(
          userId,
          startDate as string,
          endDate as string
        );
      } else {
        measurements = await storage.getBodyMeasurements(
          userId,
          limit ? parseInt(limit as string) : 50
        );
      }

      res.json(measurements);
    } catch (error) {
      console.error("Error fetching body measurements:", error);
      res.status(500).json({ error: "Failed to fetch body measurements" });
    }
  });

  // Get body measurement for specific date
  app.get("/api/body-measurements/:date", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { date } = req.params;
      const measurement = await storage.getBodyMeasurement(userId, date);

      if (!measurement) {
        res.status(404).json({ error: "No measurement found for this date" });
        return;
      }

      res.json(measurement);
    } catch (error) {
      console.error("Error fetching body measurement:", error);
      res.status(500).json({ error: "Failed to fetch body measurement" });
    }
  });

  // Create or update body measurement
  app.post("/api/body-measurements", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const {
        measurementDate,
        chestCm,
        waistCm,
        hipsCm,
        leftBicepCm,
        rightBicepCm,
        leftForearmCm,
        rightForearmCm,
        leftThighCm,
        rightThighCm,
        leftCalfCm,
        rightCalfCm,
        neckCm,
        shouldersCm,
        bodyFatPercentage,
        notes,
      } = req.body;

      const date = measurementDate || format(new Date(), "yyyy-MM-dd");

      const measurement = await storage.createOrUpdateBodyMeasurement({
        userId,
        measurementDate: date,
        chestCm,
        waistCm,
        hipsCm,
        leftBicepCm,
        rightBicepCm,
        leftForearmCm,
        rightForearmCm,
        leftThighCm,
        rightThighCm,
        leftCalfCm,
        rightCalfCm,
        neckCm,
        shouldersCm,
        bodyFatPercentage,
        notes,
      });

      res.json(measurement);
    } catch (error) {
      console.error("Error saving body measurement:", error);
      res.status(500).json({ error: "Failed to save body measurement" });
    }
  });

  // Delete body measurement
  app.delete("/api/body-measurements/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      const deleted = await storage.deleteBodyMeasurement(id, userId);

      if (!deleted) {
        res.status(404).json({ error: "Measurement not found" });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting body measurement:", error);
      res.status(500).json({ error: "Failed to delete body measurement" });
    }
  });

  // Get measurement trends/progress with AI analysis
  app.get("/api/body-measurements/analysis", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getProfile(userId);

      if (!profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      // Get last 12 weeks of measurements
      const endDate = format(new Date(), "yyyy-MM-dd");
      const startDate = format(subDays(new Date(), 84), "yyyy-MM-dd");
      const measurements = await storage.getBodyMeasurementsRange(userId, startDate, endDate);

      if (measurements.length < 2) {
        res.json({
          hasEnoughData: false,
          message: "Need at least 2 measurements to show progress. Keep tracking!",
          measurements,
        });
        return;
      }

      // Calculate changes between first and last measurement
      const latest = measurements[0];
      const oldest = measurements[measurements.length - 1];

      const calculateChange = (current: number | null, previous: number | null) => {
        if (current === null || previous === null) return null;
        return {
          change: +(current - previous).toFixed(1),
          percentChange: +((current - previous) / previous * 100).toFixed(1),
        };
      };

      const progress = {
        chest: calculateChange(latest.chestCm, oldest.chestCm),
        waist: calculateChange(latest.waistCm, oldest.waistCm),
        hips: calculateChange(latest.hipsCm, oldest.hipsCm),
        leftBicep: calculateChange(latest.leftBicepCm, oldest.leftBicepCm),
        rightBicep: calculateChange(latest.rightBicepCm, oldest.rightBicepCm),
        leftForearm: calculateChange(latest.leftForearmCm, oldest.leftForearmCm),
        rightForearm: calculateChange(latest.rightForearmCm, oldest.rightForearmCm),
        leftThigh: calculateChange(latest.leftThighCm, oldest.leftThighCm),
        rightThigh: calculateChange(latest.rightThighCm, oldest.rightThighCm),
        leftCalf: calculateChange(latest.leftCalfCm, oldest.leftCalfCm),
        rightCalf: calculateChange(latest.rightCalfCm, oldest.rightCalfCm),
        neck: calculateChange(latest.neckCm, oldest.neckCm),
        shoulders: calculateChange(latest.shouldersCm, oldest.shouldersCm),
        bodyFat: calculateChange(latest.bodyFatPercentage, oldest.bodyFatPercentage),
      };

      // Determine if user is gaining muscle, losing fat, or both
      const phase = profile.currentPhase || "recomp";
      let interpretation = "";

      const waistChange = progress.waist?.change || 0;
      const bicepChange = ((progress.leftBicep?.change || 0) + (progress.rightBicep?.change || 0)) / 2;
      const shoulderChange = progress.shoulders?.change || 0;

      if (phase === "cutting" || phase === "recomp") {
        if (waistChange < -1 && bicepChange >= 0) {
          interpretation = "Excellent progress! You're losing inches around your waist while maintaining or growing muscle. This is the ideal body recomposition pattern.";
        } else if (waistChange < 0) {
          interpretation = "You're losing inches around your waist - fat loss is happening. Keep up the deficit and protein intake.";
        } else if (bicepChange > 0.5 && shoulderChange > 0.5) {
          interpretation = "Muscle growth detected in your upper body! Make sure you're in a slight surplus to maximize gains.";
        }
      } else if (phase === "recovery") {
        if (bicepChange > 0 || shoulderChange > 0) {
          interpretation = "Muscle measurements are improving during recovery - your metabolism is responding well!";
        }
      }

      res.json({
        hasEnoughData: true,
        measurementCount: measurements.length,
        periodDays: Math.ceil((new Date(latest.measurementDate).getTime() - new Date(oldest.measurementDate).getTime()) / (1000 * 60 * 60 * 24)),
        latestMeasurement: latest,
        oldestMeasurement: oldest,
        progress,
        interpretation,
        measurements,
      });
    } catch (error) {
      console.error("Error analyzing body measurements:", error);
      res.status(500).json({ error: "Failed to analyze body measurements" });
    }
  });

  // ==================== Data Export Routes ====================

  app.get("/api/export/json", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getProfile(userId);
      const assessment = await storage.getOnboardingAssessment(userId);
      const dailyLogs = await storage.getDailyLogs(userId);
      const chatMessages = await storage.getChatMessages(userId, 1000);

      // Get food entries for all dates
      const foodEntriesMap: Record<string, any[]> = {};
      for (const log of dailyLogs) {
        const entries = await storage.getFoodEntries(userId, log.logDate);
        if (entries.length > 0) {
          foodEntriesMap[log.logDate] = entries;
        }
      }

      const exportData = {
        exportedAt: new Date().toISOString(),
        profile,
        assessment,
        dailyLogs,
        foodEntries: foodEntriesMap,
        chatMessages,
      };

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="vitalpath-export-${format(new Date(), "yyyy-MM-dd")}.json"`);
      res.json(exportData);
    } catch (error) {
      console.error("Error exporting JSON:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  app.get("/api/export/csv", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const dailyLogs = await storage.getDailyLogs(userId);

      // Generate CSV
      const headers = [
        "Date",
        "Weight (kg)",
        "Calories",
        "Protein (g)",
        "Carbs (g)",
        "Fat (g)",
        "Water (L)",
        "Steps",
        "Sleep (hrs)",
        "Sleep Quality",
        "Energy",
        "Stress",
        "Mood",
        "Workout",
        "Notes",
      ];

      const rows = dailyLogs.map((log) => [
        log.logDate,
        log.weightKg?.toString() || "",
        log.caloriesConsumed?.toString() || "",
        log.proteinGrams?.toString() || "",
        log.carbsGrams?.toString() || "",
        log.fatGrams?.toString() || "",
        log.waterLiters?.toString() || "",
        log.steps?.toString() || "",
        log.sleepHours?.toString() || "",
        log.sleepQuality?.toString() || "",
        log.energyLevel?.toString() || "",
        log.stressLevel?.toString() || "",
        log.moodRating?.toString() || "",
        log.workoutCompleted ? "Yes" : "No",
        (log.notes || "").replace(/"/g, '""'),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="vitalpath-logs-${format(new Date(), "yyyy-MM-dd")}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // ==================== Meal Templates Routes ====================

  // Get all meal templates for user (sorted by usage)
  app.get("/api/meal-templates", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const templates = await storage.getMealTemplates(userId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching meal templates:", error);
      res.status(500).json({ error: "Failed to fetch meal templates" });
    }
  });

  // Get a specific meal template
  app.get("/api/meal-templates/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      const template = await storage.getMealTemplate(id, userId);

      if (!template) {
        res.status(404).json({ error: "Meal template not found" });
        return;
      }

      res.json(template);
    } catch (error) {
      console.error("Error fetching meal template:", error);
      res.status(500).json({ error: "Failed to fetch meal template" });
    }
  });

  // Create a new meal template
  app.post("/api/meal-templates", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { name, mealType, items } = req.body;

      if (!name || typeof name !== "string" || name.trim().length === 0) {
        res.status(400).json({ error: "Template name is required" });
        return;
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: "At least one food item is required" });
        return;
      }

      // Calculate totals from items
      const totalCalories = items.reduce((sum: number, item: any) => sum + (item.calories || 0), 0);
      const totalProtein = items.reduce((sum: number, item: any) => sum + (item.proteinGrams || 0), 0);
      const totalCarbs = items.reduce((sum: number, item: any) => sum + (item.carbsGrams || 0), 0);
      const totalFat = items.reduce((sum: number, item: any) => sum + (item.fatGrams || 0), 0);

      const template = await storage.createMealTemplate({
        userId,
        name: name.trim(),
        mealType: mealType || null,
        items,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
      });

      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating meal template:", error);
      res.status(500).json({ error: "Failed to create meal template" });
    }
  });

  // Update a meal template
  app.patch("/api/meal-templates/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      const { name, mealType, items } = req.body;

      const updates: any = {};
      if (name !== undefined) updates.name = name.trim();
      if (mealType !== undefined) updates.mealType = mealType;
      if (items !== undefined) {
        updates.items = items;
        // Recalculate totals
        updates.totalCalories = items.reduce((sum: number, item: any) => sum + (item.calories || 0), 0);
        updates.totalProtein = items.reduce((sum: number, item: any) => sum + (item.proteinGrams || 0), 0);
        updates.totalCarbs = items.reduce((sum: number, item: any) => sum + (item.carbsGrams || 0), 0);
        updates.totalFat = items.reduce((sum: number, item: any) => sum + (item.fatGrams || 0), 0);
      }

      const template = await storage.updateMealTemplate(id, userId, updates);

      if (!template) {
        res.status(404).json({ error: "Meal template not found" });
        return;
      }

      res.json(template);
    } catch (error) {
      console.error("Error updating meal template:", error);
      res.status(500).json({ error: "Failed to update meal template" });
    }
  });

  // Delete a meal template
  app.delete("/api/meal-templates/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      const deleted = await storage.deleteMealTemplate(id, userId);

      if (!deleted) {
        res.status(404).json({ error: "Meal template not found" });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting meal template:", error);
      res.status(500).json({ error: "Failed to delete meal template" });
    }
  });

  // Log a meal template (create food entries from template)
  app.post("/api/meal-templates/:id/log", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      const { date, mealType: overrideMealType } = req.body;

      const template = await storage.getMealTemplate(id, userId);

      if (!template) {
        res.status(404).json({ error: "Meal template not found" });
        return;
      }

      const logDate = date || format(new Date(), "yyyy-MM-dd");
      const mealType = overrideMealType || template.mealType || "snack";

      // Create food entries for each item in the template
      const items = template.items as any[];
      const createdEntries = [];

      for (const item of items) {
        const entry = await storage.createFoodEntry({
          userId,
          logDate,
          mealType,
          foodName: item.foodName,
          servingSize: item.servingSize,
          servingQuantity: item.quantity || 1,
          calories: item.calories,
          proteinGrams: item.proteinGrams,
          carbsGrams: item.carbsGrams,
          fatGrams: item.fatGrams,
        });
        createdEntries.push(entry);
      }

      // Increment usage count
      await storage.incrementMealTemplateUsage(id, userId);

      res.json({
        success: true,
        entriesCreated: createdEntries.length,
        entries: createdEntries,
      });
    } catch (error) {
      console.error("Error logging meal template:", error);
      res.status(500).json({ error: "Failed to log meal template" });
    }
  });

  // ==================== Weekly Progress Report ====================

  app.get("/api/weekly-report", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getProfile(userId);

      if (!profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      // Get last 7 days of data
      const endDate = format(new Date(), "yyyy-MM-dd");
      const startDate = format(subDays(new Date(), 7), "yyyy-MM-dd");
      const prevWeekStart = format(subDays(new Date(), 14), "yyyy-MM-dd");

      const thisWeekLogs = await storage.getDailyLogs(userId, startDate, endDate);
      const prevWeekLogs = await storage.getDailyLogs(userId, prevWeekStart, startDate);
      const thisWeekFood = await storage.getFoodEntriesRange(userId, startDate, endDate);
      const thisWeekExercise = await storage.getExerciseLogsRange(userId, startDate, endDate);
      const assessment = await storage.getOnboardingAssessment(userId);

      // Calculate weekly stats
      const avgCalories = thisWeekLogs.length > 0
        ? Math.round(thisWeekLogs.reduce((sum, l) => sum + (l.caloriesConsumed || 0), 0) / thisWeekLogs.length)
        : 0;
      const avgProtein = thisWeekLogs.length > 0
        ? Math.round(thisWeekLogs.reduce((sum, l) => sum + (l.proteinGrams || 0), 0) / thisWeekLogs.length)
        : 0;
      const avgSteps = thisWeekLogs.length > 0
        ? Math.round(thisWeekLogs.reduce((sum, l) => sum + (l.steps || 0), 0) / thisWeekLogs.length)
        : 0;
      const avgSleep = thisWeekLogs.filter(l => l.sleepHours).length > 0
        ? (thisWeekLogs.reduce((sum, l) => sum + (l.sleepHours || 0), 0) / thisWeekLogs.filter(l => l.sleepHours).length).toFixed(1)
        : 0;
      const avgEnergy = thisWeekLogs.filter(l => l.energyLevel).length > 0
        ? (thisWeekLogs.reduce((sum, l) => sum + (l.energyLevel || 0), 0) / thisWeekLogs.filter(l => l.energyLevel).length).toFixed(1)
        : 0;

      const workoutDays = new Set(thisWeekExercise.map(e => e.logDate)).size;
      const logsWithWeight = thisWeekLogs.filter(l => l.weightKg);
      const weekStartWeight = logsWithWeight.length > 0 ? logsWithWeight[logsWithWeight.length - 1]?.weightKg : null;
      const weekEndWeight = logsWithWeight.length > 0 ? logsWithWeight[0]?.weightKg : null;
      const weightChange = weekStartWeight && weekEndWeight ? (weekEndWeight - weekStartWeight).toFixed(1) : null;

      // Previous week comparison
      const prevAvgCalories = prevWeekLogs.length > 0
        ? Math.round(prevWeekLogs.reduce((sum, l) => sum + (l.caloriesConsumed || 0), 0) / prevWeekLogs.length)
        : 0;

      const weekData = {
        period: `${startDate} to ${endDate}`,
        daysLogged: thisWeekLogs.length,
        nutrition: {
          avgCalories,
          avgProtein,
          targetCalories: profile.targetCalories,
          targetProtein: profile.proteinGrams,
          calorieAdherence: profile.targetCalories ? Math.round((avgCalories / profile.targetCalories) * 100) : 0,
          proteinAdherence: profile.proteinGrams ? Math.round((avgProtein / profile.proteinGrams) * 100) : 0,
          vsLastWeek: prevAvgCalories ? avgCalories - prevAvgCalories : 0,
        },
        activity: {
          avgSteps,
          targetSteps: profile.dailyStepsTarget || 8000,
          workoutDays,
        },
        biofeedback: {
          avgSleep,
          avgEnergy,
        },
        weight: {
          start: weekStartWeight,
          end: weekEndWeight,
          change: weightChange,
        },
        phase: profile.currentPhase,
      };

      // Generate AI weekly summary (using shared singleton client)
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a health coach generating a weekly progress report. Be encouraging but honest.

User's coaching tone: ${profile.coachingTone || "empathetic"}
Current phase: ${profile.currentPhase || "assessment"}

Return a JSON object with:
{
  "headline": "Brief 5-8 word summary of the week (e.g., 'Strong Week with Room for Protein')",
  "wins": ["Array of 2-3 specific wins from this week"],
  "improvements": ["Array of 1-2 areas to focus on next week"],
  "recommendation": "One specific action for next week",
  "motivationalNote": "Brief encouraging message for the week ahead"
}`
          },
          {
            role: "user",
            content: `Generate a weekly report for this data:\n${JSON.stringify(weekData, null, 2)}`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const aiSummary = JSON.parse(aiResponse.choices[0]?.message?.content || "{}");

      res.json({
        ...weekData,
        aiSummary,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error generating weekly report:", error);
      res.status(500).json({ error: "Failed to generate weekly report" });
    }
  });

  // ==================== AI Workout Plan Generation ====================

  app.get("/api/workout-plan", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getProfile(userId);

      if (!profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      const assessment = await storage.getOnboardingAssessment(userId);
      const endDate = format(new Date(), "yyyy-MM-dd");
      const startDate = format(subDays(new Date(), 14), "yyyy-MM-dd");
      const recentExercise = await storage.getExerciseLogsRange(userId, startDate, endDate);
      const recentLogs = await storage.getDailyLogs(userId, startDate, endDate);
      const healthNotes = await storage.getRecentHealthNotes(userId, 14);

      // Calculate recovery metrics
      const avgSleep = recentLogs.filter(l => l.sleepHours).length > 0
        ? recentLogs.reduce((sum, l) => sum + (l.sleepHours || 0), 0) / recentLogs.filter(l => l.sleepHours).length
        : 7;
      const avgEnergy = recentLogs.filter(l => l.energyLevel).length > 0
        ? recentLogs.reduce((sum, l) => sum + (l.energyLevel || 0), 0) / recentLogs.filter(l => l.energyLevel).length
        : 6;
      const avgStress = recentLogs.filter(l => l.stressLevel).length > 0
        ? recentLogs.reduce((sum, l) => sum + (l.stressLevel || 0), 0) / recentLogs.filter(l => l.stressLevel).length
        : 5;

      const workoutContext = {
        phase: profile.currentPhase || "recomp",
        age: profile.age,
        sex: profile.sex,
        experienceLevel: assessment?.resistanceTrainingFrequency || 0,
        currentWeightKg: profile.currentWeightKg,
        recentWorkouts: recentExercise.map(e => ({
          date: e.logDate,
          exercise: e.exerciseName,
          sets: e.completedSets,
        })),
        workoutDaysLast14: new Set(recentExercise.map(e => e.logDate)).size,
        biofeedback: { avgSleep, avgEnergy, avgStress },
        healthNotes: healthNotes.map(n => n.content),
        targetWorkoutsPerWeek: assessment?.resistanceTrainingFrequency || 4,
      };

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert strength and conditioning coach creating a personalized weekly workout plan.

Current phase: ${profile.currentPhase}
Phase guidelines:
- Recovery: Focus on mobility, light resistance (RIR 4+), low-impact cardio. 2-3 sessions max.
- Recomp: 3-4 strength sessions, RIR 2-3, moderate cardio, optional HIIT. Build muscle while maintaining.
- Cutting: Heavy compounds (lower volume), metabolic finishers, HIIT, maintain strength. Don't overtrain.

IMPORTANT: Check health notes for any injuries or limitations and adjust accordingly.

Return a JSON object with this exact structure:
{
  "weeklyPlan": [
    {
      "day": "Monday",
      "type": "strength" | "cardio" | "recovery" | "rest",
      "focus": "e.g., Upper Body Push",
      "duration": 45,
      "exercises": [
        {
          "name": "Bench Press",
          "sets": 4,
          "reps": "8-10",
          "rir": 2,
          "notes": "Focus on controlled eccentric"
        }
      ],
      "warmup": "5 min light cardio + dynamic stretches",
      "cooldown": "5 min stretching"
    }
  ],
  "weeklyVolume": {
    "strengthSessions": 4,
    "cardioSessions": 2,
    "totalMinutes": 270
  },
  "phaseNotes": "Brief explanation of why this plan fits the current phase",
  "recoveryTips": ["Array of 2-3 recovery tips based on biofeedback"]
}`
          },
          {
            role: "user",
            content: `Create a weekly workout plan for this user:\n${JSON.stringify(workoutContext, null, 2)}`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const workoutPlan = JSON.parse(aiResponse.choices[0]?.message?.content || "{}");

      res.json({
        ...workoutPlan,
        generatedFor: profile.firstName || "User",
        phase: profile.currentPhase,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error generating workout plan:", error);
      res.status(500).json({ error: "Failed to generate workout plan" });
    }
  });

  // ==================== Recovery Score ====================

  app.get("/api/recovery-score", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const today = format(new Date(), "yyyy-MM-dd");
      const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

      const todayLog = await storage.getDailyLog(userId, today);
      const yesterdayLog = await storage.getDailyLog(userId, yesterday);
      const profile = await storage.getProfile(userId);
      const recentLogs = await storage.getDailyLogs(userId, format(subDays(new Date(), 7), "yyyy-MM-dd"), today);

      // Use yesterday's data for today's recovery score (sleep affects next day)
      const sleepScore = yesterdayLog?.sleepHours
        ? Math.min(100, (yesterdayLog.sleepHours / 8) * 100)
        : 70;
      const sleepQualityScore = yesterdayLog?.sleepQuality
        ? yesterdayLog.sleepQuality * 10
        : 60;
      const energyScore = todayLog?.energyLevel
        ? todayLog.energyLevel * 10
        : 60;
      const stressScore = todayLog?.stressLevel
        ? (11 - todayLog.stressLevel) * 10 // Invert: low stress = high score
        : 60;

      // Check for consecutive workout days (affects recovery)
      const recentExercise = await storage.getExerciseLogsRange(
        userId,
        format(subDays(new Date(), 3), "yyyy-MM-dd"),
        today
      );
      const consecutiveWorkoutDays = new Set(recentExercise.map(e => e.logDate)).size;
      const workoutFatigue = Math.max(0, (consecutiveWorkoutDays - 1) * 10);

      // Calculate weighted recovery score
      const rawScore = (
        sleepScore * 0.3 +
        sleepQualityScore * 0.2 +
        energyScore * 0.25 +
        stressScore * 0.25
      ) - workoutFatigue;

      const recoveryScore = Math.max(0, Math.min(100, Math.round(rawScore)));

      // Determine recovery status
      let status: "optimal" | "good" | "moderate" | "low";
      let recommendation: string;

      if (recoveryScore >= 80) {
        status = "optimal";
        recommendation = "Great recovery! You're ready for an intense workout today.";
      } else if (recoveryScore >= 60) {
        status = "good";
        recommendation = "Good recovery. Normal training is fine, listen to your body.";
      } else if (recoveryScore >= 40) {
        status = "moderate";
        recommendation = "Recovery is moderate. Consider lighter intensity or focus on technique.";
      } else {
        status = "low";
        recommendation = "Low recovery detected. Prioritize rest, mobility work, or light cardio.";
      }

      res.json({
        score: recoveryScore,
        status,
        recommendation,
        factors: {
          sleepHours: yesterdayLog?.sleepHours || null,
          sleepQuality: yesterdayLog?.sleepQuality || null,
          energyLevel: todayLog?.energyLevel || null,
          stressLevel: todayLog?.stressLevel || null,
          consecutiveWorkoutDays,
        },
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error calculating recovery score:", error);
      res.status(500).json({ error: "Failed to calculate recovery score" });
    }
  });

  // ==================== Workout Analytics ====================

  app.get("/api/workout-analytics", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);

      // Fetch all workout data for analytics
      const [dailyLogs, exerciseLogs] = await Promise.all([
        storage.getAllDailyLogs(userId),
        storage.getExerciseLogsAll(userId),
      ]);

      // Generate analytics using the workout analytics module
      const { generateWorkoutAnalytics } = await import("./workoutAnalytics");
      const analytics = generateWorkoutAnalytics(dailyLogs, exerciseLogs);

      res.json(analytics);
    } catch (error) {
      console.error("Error generating workout analytics:", error);
      res.status(500).json({ error: "Failed to generate workout analytics" });
    }
  });

  // ==================== Rest Day Recommendations ====================

  app.get("/api/rest-day-recommendation", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);

      // Calculate date range for last 14 days
      const startDate = format(subDays(new Date(), 14), "yyyy-MM-dd");
      const endDate = format(new Date(), "yyyy-MM-dd");

      // Fetch recent logs and profile for analysis
      const [profile, dailyLogs, exerciseLogs] = await Promise.all([
        storage.getProfile(userId),
        storage.getDailyLogs(userId, startDate, endDate),
        storage.getExerciseLogsAll(userId),
      ]);

      // Sort daily logs by date descending (most recent first)
      const sortedLogs = [...dailyLogs].sort(
        (a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime()
      );

      // Generate rest day recommendation
      const { calculateRestDayRecommendation } = await import("./restDayRecommendations");
      const recommendation = calculateRestDayRecommendation(
        sortedLogs,
        exerciseLogs,
        profile || undefined
      );

      res.json(recommendation);
    } catch (error) {
      console.error("Error generating rest day recommendation:", error);
      res.status(500).json({ error: "Failed to generate rest day recommendation" });
    }
  });

  // ==================== Additional Workout Recommendations ====================

  app.post("/api/workout-recommendation/additional", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { completedWorkout, completedExercises, durationMinutes, totalVolume } = req.body;

      // Get user profile and recent activity data
      const profile = await storage.getProfile(userId);
      const today = format(new Date(), "yyyy-MM-dd");
      const startDate = format(subDays(new Date(), 7), "yyyy-MM-dd");

      const [dailyLogs, todayLog] = await Promise.all([
        storage.getDailyLogs(userId, startDate, today),
        storage.getDailyLog(userId, today),
      ]);

      // Calculate recent workout frequency and recovery metrics
      const recentWorkouts = dailyLogs.filter(log => log.workoutCompleted).length;
      const avgSleep = dailyLogs.length > 0
        ? dailyLogs.reduce((sum, log) => sum + (log.sleepHours || 0), 0) / dailyLogs.length
        : 7;
      const avgEnergy = dailyLogs.length > 0
        ? dailyLogs.reduce((sum, log) => sum + (log.energyLevel || 5), 0) / dailyLogs.length
        : 5;

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a fitness coach helping someone who just completed a workout decide if additional activity would be beneficial or not.

Consider these factors:
- User's age: ${profile?.age || "unknown"}
- Current phase: ${profile?.currentPhase || "recomp"}
- Recent workout frequency (last 7 days): ${recentWorkouts} workouts
- Average sleep: ${avgSleep.toFixed(1)} hours
- Average energy: ${avgEnergy.toFixed(1)}/10
- Today's completed workout: ${completedWorkout}
- Duration: ${durationMinutes} minutes
- Total volume lifted: ${totalVolume} lbs

Return a JSON object with this exact structure:
{
  "recommended": boolean (true if additional activity would benefit them, false if they should rest),
  "message": "A personalized message explaining why (1-2 sentences)",
  "suggestions": [
    {
      "type": "cardio|mobility|active_recovery",
      "name": "Activity name",
      "duration": "10-15 min",
      "description": "Brief description of why this would help"
    }
  ]
}

If recommended is false, suggestions should be an empty array.
If recommended is true, provide 2-3 light complementary activities (never more intense weightlifting).

Be conservative - prioritize recovery for people 40+. Only suggest additional work if:
- The completed workout was relatively short (<45 min)
- They've had adequate rest recently
- Energy levels are good
- The suggestions are light (walking, stretching, light cardio)`
          },
          {
            role: "user",
            content: `I just completed: ${completedWorkout}
Exercises: ${completedExercises?.join(", ") || "various exercises"}
Duration: ${durationMinutes} minutes
Volume: ${totalVolume} lbs

Should I do any additional activity today, or should I focus on recovery?`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const result = JSON.parse(aiResponse.choices[0].message.content || "{}");

      res.json({
        recommended: result.recommended || false,
        message: result.message || "Great workout! Focus on recovery and nutrition now.",
        suggestions: result.suggestions || [],
      });
    } catch (error) {
      console.error("Error generating additional workout recommendation:", error);
      res.status(500).json({
        recommended: false,
        message: "Great workout! Take some time to recover.",
        suggestions: []
      });
    }
  });

  // ==================== AI Meal Suggestions ====================

  app.get("/api/meal-suggestions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getProfile(userId);
      const today = format(new Date(), "yyyy-MM-dd");
      const todayFood = await storage.getFoodEntries(userId, today);

      if (!profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      // Calculate remaining macros
      const consumed = {
        calories: todayFood.reduce((sum, f) => sum + (f.calories || 0), 0),
        protein: todayFood.reduce((sum, f) => sum + (f.proteinGrams || 0), 0),
        carbs: todayFood.reduce((sum, f) => sum + (f.carbsGrams || 0), 0),
        fat: todayFood.reduce((sum, f) => sum + (f.fatGrams || 0), 0),
      };

      const remaining = {
        calories: (profile.targetCalories || 2000) - consumed.calories,
        protein: (profile.proteinGrams || 150) - consumed.protein,
        carbs: (profile.carbsGrams || 200) - consumed.carbs,
        fat: (profile.fatGrams || 65) - consumed.fat,
      };

      const mealsLogged = todayFood.map(f => f.mealType);
      const currentHour = new Date().getHours();

      // Determine next meal type
      let suggestedMealType = "snack";
      if (currentHour < 10 && !mealsLogged.includes("breakfast")) {
        suggestedMealType = "breakfast";
      } else if (currentHour >= 10 && currentHour < 14 && !mealsLogged.includes("lunch")) {
        suggestedMealType = "lunch";
      } else if (currentHour >= 17 && !mealsLogged.includes("dinner")) {
        suggestedMealType = "dinner";
      }

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a nutrition coach suggesting meal ideas to help hit macro targets.

Current phase: ${profile.currentPhase}
Meal type needed: ${suggestedMealType}

Return a JSON object:
{
  "suggestions": [
    {
      "name": "Meal name",
      "description": "Brief description",
      "estimatedMacros": {
        "calories": 400,
        "protein": 35,
        "carbs": 30,
        "fat": 15
      },
      "ingredients": ["ingredient 1", "ingredient 2"],
      "prepTime": "10 min",
      "proteinFocused": true
    }
  ],
  "tip": "Quick tip about hitting remaining macros"
}

Prioritize high-protein options if protein remaining is significant.
Suggest 3 options ranging from quick/easy to more elaborate.`
          },
          {
            role: "user",
            content: `Suggest ${suggestedMealType} options.

Remaining macros needed today:
- Calories: ${remaining.calories}
- Protein: ${remaining.protein}g
- Carbs: ${remaining.carbs}g
- Fat: ${remaining.fat}g

Already eaten today: ${todayFood.map(f => f.foodName).join(", ") || "Nothing logged yet"}`
          }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" },
      });

      const suggestions = JSON.parse(aiResponse.choices[0]?.message?.content || "{}");

      res.json({
        mealType: suggestedMealType,
        remaining,
        consumed,
        targets: {
          calories: profile.targetCalories,
          protein: profile.proteinGrams,
          carbs: profile.carbsGrams,
          fat: profile.fatGrams,
        },
        ...suggestions,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error generating meal suggestions:", error);
      res.status(500).json({ error: "Failed to generate meal suggestions" });
    }
  });

  // ==================== Streak/Consistency Tracking ====================

  app.get("/api/streaks", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const endDate = format(new Date(), "yyyy-MM-dd");
      const startDate = format(subDays(new Date(), 60), "yyyy-MM-dd"); // Last 60 days

      const logs = await storage.getDailyLogs(userId, startDate, endDate);
      const foodEntries = await storage.getFoodEntriesRange(userId, startDate, endDate);
      const exerciseLogs = await storage.getExerciseLogsRange(userId, startDate, endDate);

      // Calculate streaks
      const loggingDates = new Set(logs.map(l => l.logDate));
      const workoutDates = new Set(exerciseLogs.map(e => e.logDate));
      const foodDates = new Set(foodEntries.map(f => f.logDate));

      const calculateStreak = (dates: Set<string>): { current: number; longest: number } => {
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        const today = format(new Date(), "yyyy-MM-dd");
        const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

        // Check if streak is active (logged today or yesterday)
        const streakActive = dates.has(today) || dates.has(yesterday);

        for (let i = 0; i < 60; i++) {
          const checkDate = format(subDays(new Date(), i), "yyyy-MM-dd");
          if (dates.has(checkDate)) {
            tempStreak++;
            if (streakActive && i === 0 || (streakActive && i > 0 && dates.has(format(subDays(new Date(), i - 1), "yyyy-MM-dd")))) {
              currentStreak = tempStreak;
            }
            longestStreak = Math.max(longestStreak, tempStreak);
          } else {
            tempStreak = 0;
          }
        }

        return { current: currentStreak, longest: longestStreak };
      };

      const loggingStreak = calculateStreak(loggingDates);
      const workoutStreak = calculateStreak(workoutDates);
      const nutritionStreak = calculateStreak(foodDates);

      // Calculate consistency percentages
      const daysInPeriod = 30;
      const loggingConsistency = Math.round((loggingDates.size / daysInPeriod) * 100);
      const workoutConsistency = Math.round((workoutDates.size / daysInPeriod) * 100);

      res.json({
        logging: {
          currentStreak: loggingStreak.current,
          longestStreak: loggingStreak.longest,
          last30DaysConsistency: loggingConsistency,
        },
        workouts: {
          currentStreak: workoutStreak.current,
          longestStreak: workoutStreak.longest,
          last30DaysConsistency: workoutConsistency,
          totalWorkoutsLast30: workoutDates.size,
        },
        nutrition: {
          currentStreak: nutritionStreak.current,
          longestStreak: nutritionStreak.longest,
          daysLoggedLast30: foodDates.size,
        },
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error calculating streaks:", error);
      res.status(500).json({ error: "Failed to calculate streaks" });
    }
  });

  // ==================== Goals & Milestones ====================

  // Get all goals (with optional status filter)
  app.get("/api/goals", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const status = req.query.status as string | undefined;
      const goalsData = await storage.getGoals(userId, status);

      // Fetch milestones for each goal
      const goalsWithMilestones = await Promise.all(
        goalsData.map(async (goal) => {
          const milestones = await storage.getMilestones(goal.id, userId);
          return { ...goal, milestones };
        })
      );

      res.json(goalsWithMilestones);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  // Get a single goal with milestones
  app.get("/api/goals/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;

      const goal = await storage.getGoal(id, userId);
      if (!goal) {
        res.status(404).json({ error: "Goal not found" });
        return;
      }

      const milestones = await storage.getMilestones(id, userId);
      res.json({ ...goal, milestones });
    } catch (error) {
      console.error("Error fetching goal:", error);
      res.status(500).json({ error: "Failed to fetch goal" });
    }
  });

  // Create a new goal (with optional milestones)
  app.post("/api/goals", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { milestones: milestonesData, ...goalData } = req.body;

      // Create the goal
      const goal = await storage.createGoal({
        ...goalData,
        userId,
        startDate: goalData.startDate || format(new Date(), "yyyy-MM-dd"),
      });

      // Create milestones if provided
      const createdMilestones = [];
      if (milestonesData && Array.isArray(milestonesData)) {
        for (let i = 0; i < milestonesData.length; i++) {
          const milestone = await storage.createMilestone({
            ...milestonesData[i],
            goalId: goal.id,
            userId,
            order: i,
          });
          createdMilestones.push(milestone);
        }
      }

      res.status(201).json({ ...goal, milestones: createdMilestones });
    } catch (error) {
      console.error("Error creating goal:", error);
      res.status(500).json({ error: "Failed to create goal" });
    }
  });

  // Update a goal
  app.patch("/api/goals/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      const updates = req.body;

      const goal = await storage.updateGoal(id, userId, updates);
      if (!goal) {
        res.status(404).json({ error: "Goal not found" });
        return;
      }

      const milestones = await storage.getMilestones(id, userId);
      res.json({ ...goal, milestones });
    } catch (error) {
      console.error("Error updating goal:", error);
      res.status(500).json({ error: "Failed to update goal" });
    }
  });

  // Delete a goal (milestones cascade delete)
  app.delete("/api/goals/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;

      const deleted = await storage.deleteGoal(id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Goal not found" });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting goal:", error);
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });

  // Mark goal as completed
  app.post("/api/goals/:id/complete", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;

      const goal = await storage.completeGoal(id, userId);
      if (!goal) {
        res.status(404).json({ error: "Goal not found" });
        return;
      }

      // Create achievement notification
      await storage.createNotification({
        userId,
        type: "achievement",
        title: "Goal Achieved!",
        message: `Congratulations! You've completed your goal: ${goal.title}`,
        actionUrl: "/goals",
      });

      res.json(goal);
    } catch (error) {
      console.error("Error completing goal:", error);
      res.status(500).json({ error: "Failed to complete goal" });
    }
  });

  // Mark goal as abandoned
  app.post("/api/goals/:id/abandon", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;

      const goal = await storage.abandonGoal(id, userId);
      if (!goal) {
        res.status(404).json({ error: "Goal not found" });
        return;
      }

      res.json(goal);
    } catch (error) {
      console.error("Error abandoning goal:", error);
      res.status(500).json({ error: "Failed to abandon goal" });
    }
  });

  // Add milestone to goal
  app.post("/api/goals/:goalId/milestones", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { goalId } = req.params;

      // Verify goal exists
      const goal = await storage.getGoal(goalId, userId);
      if (!goal) {
        res.status(404).json({ error: "Goal not found" });
        return;
      }

      // Get highest order
      const existingMilestones = await storage.getMilestones(goalId, userId);
      const order = existingMilestones.length;

      const milestone = await storage.createMilestone({
        ...req.body,
        goalId,
        userId,
        order,
      });

      res.status(201).json(milestone);
    } catch (error) {
      console.error("Error creating milestone:", error);
      res.status(500).json({ error: "Failed to create milestone" });
    }
  });

  // Complete a milestone
  app.post("/api/goals/:goalId/milestones/:milestoneId/complete", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { goalId, milestoneId } = req.params;

      // Verify goal exists
      const goal = await storage.getGoal(goalId, userId);
      if (!goal) {
        res.status(404).json({ error: "Goal not found" });
        return;
      }

      const milestone = await storage.completeMilestone(milestoneId, userId);
      if (!milestone) {
        res.status(404).json({ error: "Milestone not found" });
        return;
      }

      // Create milestone notification
      await storage.createNotification({
        userId,
        type: "achievement",
        title: "Milestone Reached!",
        message: `You've achieved: ${milestone.title}`,
        actionUrl: `/goals`,
      });

      res.json(milestone);
    } catch (error) {
      console.error("Error completing milestone:", error);
      res.status(500).json({ error: "Failed to complete milestone" });
    }
  });

  // Delete a milestone
  app.delete("/api/goals/:goalId/milestones/:milestoneId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { goalId, milestoneId } = req.params;

      // Verify goal exists
      const goal = await storage.getGoal(goalId, userId);
      if (!goal) {
        res.status(404).json({ error: "Goal not found" });
        return;
      }

      const deleted = await storage.deleteMilestone(milestoneId, userId);
      if (!deleted) {
        res.status(404).json({ error: "Milestone not found" });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting milestone:", error);
      res.status(500).json({ error: "Failed to delete milestone" });
    }
  });

  // ==================== Barcode Scanner ====================

  // Lookup barcode using Open Food Facts API
  app.post("/api/barcode/lookup", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { barcode } = req.body;

      if (!barcode || typeof barcode !== "string") {
        res.status(400).json({ error: "Barcode is required" });
        return;
      }

      // Clean the barcode (remove any non-numeric characters)
      const cleanBarcode = barcode.replace(/\D/g, "");

      if (cleanBarcode.length < 8) {
        res.status(400).json({ error: "Invalid barcode format" });
        return;
      }

      // Query Open Food Facts API
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${cleanBarcode}.json`
      );

      if (!response.ok) {
        res.status(502).json({ error: "Failed to reach food database" });
        return;
      }

      const data = await response.json();

      if (data.status !== 1 || !data.product) {
        res.json({
          found: false,
          barcode: cleanBarcode,
          message: "Product not found in database",
        });
        return;
      }

      const product = data.product;
      const nutriments = product.nutriments || {};

      // Extract nutrition info (per 100g or per serving)
      const servingSize = product.serving_size || "100g";
      const useServing = product.serving_size && nutriments["energy-kcal_serving"];

      const result = {
        found: true,
        barcode: cleanBarcode,
        product: {
          name: product.product_name || product.generic_name || "Unknown Product",
          brand: product.brands || null,
          servingSize,
          // Use serving values if available, otherwise per 100g
          calories: useServing
            ? Math.round(nutriments["energy-kcal_serving"] || 0)
            : Math.round(nutriments["energy-kcal_100g"] || 0),
          protein: useServing
            ? Math.round((nutriments["proteins_serving"] || 0) * 10) / 10
            : Math.round((nutriments["proteins_100g"] || 0) * 10) / 10,
          carbs: useServing
            ? Math.round((nutriments["carbohydrates_serving"] || 0) * 10) / 10
            : Math.round((nutriments["carbohydrates_100g"] || 0) * 10) / 10,
          fat: useServing
            ? Math.round((nutriments["fat_serving"] || 0) * 10) / 10
            : Math.round((nutriments["fat_100g"] || 0) * 10) / 10,
          fiber: useServing
            ? Math.round((nutriments["fiber_serving"] || 0) * 10) / 10
            : Math.round((nutriments["fiber_100g"] || 0) * 10) / 10,
          imageUrl: product.image_front_small_url || product.image_url || null,
          categories: product.categories || null,
          isPer100g: !useServing,
        },
      };

      res.json(result);
    } catch (error) {
      console.error("Error looking up barcode:", error);
      res.status(500).json({ error: "Failed to lookup barcode" });
    }
  });

  // ==================== Public Profiles & Sharing ====================

  // Get current user's public profile settings
  app.get("/api/public-profile", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const publicProfile = await storage.getPublicProfile(userId);
      res.json(publicProfile || null);
    } catch (error) {
      console.error("Error fetching public profile:", error);
      res.status(500).json({ error: "Failed to fetch public profile" });
    }
  });

  // Create or update public profile settings
  app.post("/api/public-profile", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const {
        username,
        displayName,
        bio,
        showWeight,
        showGoals,
        showStreaks,
        showWorkoutStats,
        showProgress,
        showMilestones,
        isPublic,
      } = req.body;

      // Validate username if provided
      if (username) {
        // Check format: 3-30 chars, alphanumeric and underscores only
        const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
        if (!usernameRegex.test(username)) {
          res.status(400).json({
            error: "Username must be 3-30 characters, letters, numbers, and underscores only",
          });
          return;
        }

        // Check availability
        const isAvailable = await storage.isUsernameAvailable(username);
        const existing = await storage.getPublicProfile(userId);

        // Allow if it's the user's own current username
        if (!isAvailable && existing?.username?.toLowerCase() !== username.toLowerCase()) {
          res.status(400).json({ error: "Username is already taken" });
          return;
        }
      }

      // Check if profile exists
      const existingProfile = await storage.getPublicProfile(userId);

      let profile;
      if (existingProfile) {
        // Update existing profile
        profile = await storage.updatePublicProfile(userId, {
          username,
          displayName,
          bio,
          showWeight,
          showGoals,
          showStreaks,
          showWorkoutStats,
          showProgress,
          showMilestones,
          isPublic,
        });
      } else {
        // Create new profile
        profile = await storage.createPublicProfile({
          userId,
          username,
          displayName,
          bio,
          showWeight: showWeight ?? false,
          showGoals: showGoals ?? true,
          showStreaks: showStreaks ?? true,
          showWorkoutStats: showWorkoutStats ?? true,
          showProgress: showProgress ?? false,
          showMilestones: showMilestones ?? true,
          isPublic: isPublic ?? false,
        });
      }

      res.json(profile);
    } catch (error) {
      console.error("Error saving public profile:", error);
      res.status(500).json({ error: "Failed to save public profile" });
    }
  });

  // Check username availability
  app.get("/api/public-profile/check/:username", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      const userId = getUserId(req);

      // Check format
      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
      if (!usernameRegex.test(username)) {
        res.json({ available: false, reason: "Invalid format" });
        return;
      }

      const isAvailable = await storage.isUsernameAvailable(username);

      // Check if it's the user's own current username
      const existing = await storage.getPublicProfile(userId);
      const isOwnUsername = existing?.username?.toLowerCase() === username.toLowerCase();

      res.json({
        available: isAvailable || isOwnUsername,
        reason: isAvailable || isOwnUsername ? null : "Username is taken",
      });
    } catch (error) {
      console.error("Error checking username:", error);
      res.status(500).json({ error: "Failed to check username" });
    }
  });

  // Get public profile by username (unauthenticated - for public viewing)
  app.get("/api/u/:username", async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      const publicProfile = await storage.getPublicProfileByUsername(username);

      if (!publicProfile || !publicProfile.isPublic) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      // Fetch public data based on privacy settings
      const userId = publicProfile.userId;
      const profile = await storage.getProfile(userId);

      // Build response based on privacy settings
      const publicData: any = {
        username: publicProfile.username,
        displayName: publicProfile.displayName || profile?.firstName || "Anonymous",
        bio: publicProfile.bio,
      };

      if (publicProfile.showWeight && profile) {
        publicData.currentWeight = profile.currentWeightKg;
        publicData.targetWeight = profile.targetWeightKg;
      }

      if (publicProfile.showStreaks) {
        // Calculate current streak
        const endDate = format(new Date(), "yyyy-MM-dd");
        const startDate = format(subDays(new Date(), 60), "yyyy-MM-dd");
        const logs = await storage.getDailyLogs(userId, startDate, endDate);

        let currentStreak = 0;
        const loggingDates = new Set(logs.map(l => l.logDate));
        for (let i = 0; i < 60; i++) {
          const checkDate = format(subDays(new Date(), i), "yyyy-MM-dd");
          if (loggingDates.has(checkDate)) {
            currentStreak++;
          } else if (i > 0) {
            break;
          }
        }
        publicData.currentStreak = currentStreak;
      }

      if (publicProfile.showWorkoutStats) {
        // Get workout stats
        const endDate = format(new Date(), "yyyy-MM-dd");
        const startDate = format(subDays(new Date(), 30), "yyyy-MM-dd");
        const exerciseLogs = await storage.getExerciseLogsRange(userId, startDate, endDate);
        const workoutDays = new Set(exerciseLogs.map(e => e.logDate)).size;
        publicData.workoutsLast30Days = workoutDays;
      }

      if (publicProfile.showGoals) {
        // Get active goals count
        const goals = await storage.getActiveGoals(userId);
        publicData.activeGoals = goals.length;
        publicData.completedGoals = (await storage.getGoals(userId, "completed")).length;
      }

      if (publicProfile.showMilestones) {
        // Get recent milestone completions
        const goals = await storage.getGoals(userId);
        let completedMilestones = 0;
        for (const goal of goals) {
          const milestones = await storage.getMilestones(goal.id, userId);
          completedMilestones += milestones.filter(m => m.isCompleted).length;
        }
        publicData.completedMilestones = completedMilestones;
      }

      if (publicProfile.showProgress && profile) {
        // Show weight change over last 30 days
        const endDate = format(new Date(), "yyyy-MM-dd");
        const startDate = format(subDays(new Date(), 30), "yyyy-MM-dd");
        const logs = await storage.getDailyLogs(userId, startDate, endDate);
        const logsWithWeight = logs.filter(l => l.weightKg);

        if (logsWithWeight.length >= 2) {
          const oldest = logsWithWeight[logsWithWeight.length - 1];
          const newest = logsWithWeight[0];
          publicData.weightChange30Days = newest.weightKg! - oldest.weightKg!;
        }
      }

      res.json(publicData);
    } catch (error) {
      console.error("Error fetching public profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Log share event (for analytics)
  app.post("/api/share/log", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { cardType, platform } = req.body;

      if (!cardType) {
        res.status(400).json({ error: "Card type is required" });
        return;
      }

      const event = await storage.createShareEvent({
        userId,
        cardType,
        platform: platform || "unknown",
      });

      res.json({ success: true, eventId: event.id });
    } catch (error) {
      console.error("Error logging share event:", error);
      res.status(500).json({ error: "Failed to log share event" });
    }
  });

  // Get share events for current user (analytics)
  app.get("/api/share/events", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const events = await storage.getShareEvents(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching share events:", error);
      res.status(500).json({ error: "Failed to fetch share events" });
    }
  });

  return httpServer;
}
