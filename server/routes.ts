import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateMentorResponse, calculateTargets, parseNaturalLanguageInput } from "./openai";
import { generateInsights } from "./insights";
import { evaluatePhaseTransition, executePhaseTransition } from "./phaseTransition";
import { searchUSDAFoods } from "./foodApi";
import { analyzeProfileForRecommendations, getQuickWorkoutRecommendation } from "./aiRecommendations";
import { parseAIResponseForActions, prepareProfileUpdates, formatChangeNotification } from "./aiActionParser";
import { sendProactiveNotifications, getDailyProgressSummary, generateAfternoonReminders } from "./proactiveNotifications";
import { generateDailyGuidance } from "./dailyGuidance";
import { format, subDays, parseISO } from "date-fns";
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

  // ==================== Daily Log Routes ====================

  app.get("/api/daily-logs/today", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const log = await storage.getDailyLog(getUserId(req), today);
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
      const { timeRange } = req.params;
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      const startDate = format(subDays(new Date(), days), "yyyy-MM-dd");
      const endDate = format(new Date(), "yyyy-MM-dd");
      
      const logs = await storage.getDailyLogs(getUserId(req), startDate, endDate);
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
      
      const data = {
        ...parseResult.data,
        userId: getUserId(req),
      };
      
      const entry = await storage.createFoodEntry(data);
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

      const log = await storage.createExerciseLog({
        ...parseResult.data,
        userId: getUserId(req),
      });
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

      // Save user message
      await storage.createChatMessage({
        userId,
        role: "user",
        content,
        contextType: "question",
      });

      // Get context for AI - fetch ALL user data for comprehensive awareness
      const profile = await storage.getProfile(userId);
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

      // Return response with metadata about changes
      res.json({
        ...assistantMessage,
        appliedChanges: appliedChanges.length > 0 ? appliedChanges : undefined,
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
      const today = format(new Date(), "yyyy-MM-dd");
      const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
      const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");

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

      // Generate AI guidance
      const guidance = await generateDailyGuidance({
        profile,
        assessment,
        todayLog,
        yesterdayLog,
        recentLogs,
        todayFoodEntries,
        yesterdayFoodEntries,
        recentExerciseLogs,
        healthNotes,
        currentHour: new Date().getHours(),
      });

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

      res.json({
        success: true,
        message: aiResponse,
        appliedChanges: appliedChanges.length > 0 ? appliedChanges : undefined,
        summary: parsedActions.messageSummary,
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
      const today = format(new Date(), "yyyy-MM-dd");

      // Use AI to parse all trackable data from natural language
      const parseResult = await parseNaturalLanguageInput(trimmedContent);

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
            dailyLogChanges.push(`Steps: ${updates.steps.toLocaleString()}`);
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
            dailyLogChanges.push(`Water: ${updates.waterLiters}L`);
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
            await storage.createOrUpdateDailyLog({
              userId,
              logDate: today,
              ...logUpdates,
            });
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

  return httpServer;
}
