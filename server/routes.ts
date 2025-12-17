import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateMentorResponse, calculateTargets } from "./openai";
import { generateInsights } from "./insights";
import { evaluatePhaseTransition, executePhaseTransition } from "./phaseTransition";
import { format, subDays, parseISO } from "date-fns";
import {
  insertUserProfileSchema,
  insertDailyLogSchema,
  insertFoodEntrySchema,
  insertChatMessageSchema,
} from "@shared/schema";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

// Helper to get user ID from authenticated request
function getUserId(req: Request): string {
  return (req.user as any)?.claims?.sub || "";
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
      // Validate input
      const parseResult = chatMessageSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: "Invalid message data", details: parseResult.error.flatten() });
        return;
      }
      const { content } = parseResult.data;

      // Save user message
      await storage.createChatMessage({
        userId: getUserId(req),
        role: "user",
        content,
        contextType: "question",
      });

      // Get context for AI
      const profile = await storage.getProfile(getUserId(req));
      const assessment = await storage.getOnboardingAssessment(getUserId(req));
      const today = format(new Date(), "yyyy-MM-dd");
      const recentLogs = await storage.getDailyLogs(getUserId(req));
      const messageHistory = await storage.getChatMessages(getUserId(req), 20);

      // Generate AI response
      const aiResponse = await generateMentorResponse(
        content,
        messageHistory.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        { profile, recentLogs: recentLogs.slice(0, 7), assessment }
      );

      // Save AI response
      const assistantMessage = await storage.createChatMessage({
        userId: getUserId(req),
        role: "assistant",
        content: aiResponse,
        contextType: "coaching",
      });

      res.json(assistantMessage);
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
  
  app.get("/api/workouts", async (req: Request, res: Response) => {
    try {
      const templates = await storage.getWorkoutTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching workouts:", error);
      res.status(500).json({ error: "Failed to fetch workouts" });
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
      const { q } = req.query;

      if (q && typeof q === "string") {
        const foods = await storage.searchFoods(q);
        res.json(foods);
      } else {
        const foods = await storage.getAllFoods();
        res.json(foods);
      }
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
