import OpenAI from "openai";
import type { UserProfile, OnboardingAssessment } from "@shared/schema";
import { buildMentorSystemPrompt, type MentorPromptContext } from "./prompts/mentor-system-prompt";

// Singleton OpenAI client - reused across all requests for better performance
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Re-export the context type for use in routes
export type { MentorPromptContext as ChatContext };

export async function generateMentorResponse(
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  context: MentorPromptContext
): Promise<string> {
  try {
    const systemPrompt = buildMentorSystemPrompt(context);

    // Log conversation history lengths for debugging long response issues
    const historyStats = conversationHistory.slice(-10).map((msg) => ({
      role: msg.role,
      length: msg.content.length,
      preview: msg.content.slice(0, 50) + (msg.content.length > 50 ? "..." : "")
    }));
    console.log("[AI Debug] User:", context.profile?.firstName, "Message:", userMessage.slice(0, 100));
    console.log("[AI Debug] History:", JSON.stringify(historyStats));

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10).map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: userMessage },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-2024-11-20",
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const responseText = response.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";
    console.log("[AI Debug] Response length:", responseText.length);

    return responseText;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate AI response");
  }
}

export function calculateTargets(profile: Partial<UserProfile & OnboardingAssessment> & { forcePhase?: string }): {
  maintenanceCalories: number;
  targetCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  recommendedPhase: string;
} {
  // Provide safe defaults for all values that might be null
  const safeAge = profile.age ?? 45;
  const safeSex = profile.sex ?? "male";
  const safeHeightCm = profile.heightCm ?? 170;
  const safeCurrentWeightKg = profile.currentWeightKg ?? 80;
  const safeActivityLevel = profile.activityLevel ?? "sedentary";
  const hasBeenDietingRecently = profile.hasBeenDietingRecently;
  const dietingDurationMonths = profile.dietingDurationMonths;
  const previousLowestCalories = profile.previousLowestCalories;
  const doesResistanceTraining = profile.doesResistanceTraining;

  // Calculate BMR using Mifflin-St Jeor equation
  let bmr: number;
  if (safeSex === "male") {
    bmr = 10 * safeCurrentWeightKg + 6.25 * safeHeightCm - 5 * safeAge + 5;
  } else {
    bmr = 10 * safeCurrentWeightKg + 6.25 * safeHeightCm - 5 * safeAge - 161;
  }

  // Activity multiplier
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
  };

  const multiplier = activityMultipliers[safeActivityLevel] || 1.2;
  const maintenanceCalories = Math.round(bmr * multiplier);

  // Determine recommended phase based on dieting history or forced phase
  let recommendedPhase = profile.forcePhase || "recomp";
  let calorieAdjustment = 0;

  // Only auto-determine phase if not forced
  if (!profile.forcePhase) {
    if (hasBeenDietingRecently && dietingDurationMonths && dietingDurationMonths > 3) {
      if (previousLowestCalories && previousLowestCalories < bmr) {
        recommendedPhase = "recovery";
        calorieAdjustment = 100; // Start reverse diet
      }
    } else if (!doesResistanceTraining) {
      recommendedPhase = "recomp"; // Build muscle while learning
    }
  }

  // Calculate target calories
  let targetCalories: number;
  switch (recommendedPhase) {
    case "recovery":
      targetCalories = profile.forcePhase
        ? maintenanceCalories // Use maintenance for manual transitions
        : (previousLowestCalories || bmr) + calorieAdjustment;
      break;
    case "cutting":
      targetCalories = Math.round(maintenanceCalories * 0.85); // 15% deficit
      break;
    case "recomp":
    default:
      targetCalories = Math.round(maintenanceCalories * 0.95); // Small deficit for recomp
  }

  // Ensure minimum calories
  targetCalories = Math.max(targetCalories, Math.round(bmr * 0.85));

  // Calculate macros
  const proteinGrams = Math.round(safeCurrentWeightKg * 1.8); // 1.8g/kg for active 40+ adults
  const proteinCalories = proteinGrams * 4;
  
  const fatGrams = Math.round(safeCurrentWeightKg * 0.8); // 0.8g/kg
  const fatCalories = fatGrams * 9;
  
  const remainingCalories = targetCalories - proteinCalories - fatCalories;
  const carbsGrams = Math.round(remainingCalories / 4);

  return {
    maintenanceCalories,
    targetCalories,
    proteinGrams,
    carbsGrams: Math.max(carbsGrams, 100), // Minimum 100g carbs
    fatGrams,
    recommendedPhase,
  };
}

// Parsed food entry
export interface ParsedFood {
  foodName: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  servingSize: string;
  servingQuantity: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
}

// Parsed exercise entry
export interface ParsedExercise {
  exerciseName: string;
  sets?: number;
  reps?: string; // "10" or "10-12" or "30 sec"
  weightKg?: number;
  durationMinutes?: number;
  notes?: string;
}

// Parsed daily log updates
export interface ParsedDailyLogUpdates {
  sleepHours?: number;
  sleepQuality?: number; // 1-10
  steps?: number;
  energyLevel?: number; // 1-10
  stressLevel?: number; // 1-10
  moodRating?: number; // 1-10
  weightKg?: number;
  waterLiters?: number;
}

// Comprehensive parse result
export interface NaturalLanguageParseResult {
  foods: ParsedFood[];
  exercises: ParsedExercise[];
  dailyLogUpdates: ParsedDailyLogUpdates;
  isHealthNote: boolean; // true if note should also be saved as health note for AI context
  workoutType?: string; // e.g., "upper body", "leg day", "cardio"
  workoutCompleted?: boolean;
}

/**
 * Parse natural language text to extract all trackable health data.
 * Handles food, workouts, sleep, steps, biofeedback, and more.
 * @param text - The natural language input to parse
 * @param timezone - Optional timezone for time-based meal detection (e.g., "America/New_York")
 */
export async function parseNaturalLanguageInput(text: string, timezone?: string): Promise<NaturalLanguageParseResult> {
  try {
    // Get current hour in user's timezone for intelligent meal type detection
    const now = new Date();
    let currentHour = now.getHours();
    if (timezone) {
      try {
        const hourStr = now.toLocaleString("en-US", { timeZone: timezone, hour: "numeric", hour12: false });
        currentHour = parseInt(hourStr, 10);
      } catch (e) {
        // fallback to server time if timezone is invalid
      }
    }

    // Determine default meal type based on time
    let defaultMealType: string;
    if (currentHour >= 5 && currentHour < 11) {
      defaultMealType = "breakfast";
    } else if (currentHour >= 11 && currentHour < 15) {
      defaultMealType = "lunch";
    } else if (currentHour >= 17 && currentHour < 21) {
      defaultMealType = "dinner";
    } else {
      defaultMealType = "snack";
    }

    const systemPrompt = `You are a health data extraction assistant. Analyze the text and extract any trackable health data the user is reporting.

CURRENT TIME CONTEXT: It's ${currentHour}:00 in the user's timezone. If they don't specify a meal type, use context clues or default to "${defaultMealType}" based on the time.

EXTRACT THE FOLLOWING WHEN PRESENT:

1. **FOOD** (things they ATE, not planning to eat):
   - Each food item with nutritional estimates
   - Meal type (breakfast/lunch/dinner/snack) - infer from food type and time if not stated:
     * "eggs and coffee" in the morning = breakfast
     * "sandwich" at noon = lunch
     * "steak and veggies" in evening = dinner
     * Protein shakes, fruit, snacks between meals = snack
   - Use reasonable estimates for common foods

2. **EXERCISES** (workouts they DID, not planning):
   - Exercise name
   - Sets, reps, weight if mentioned
   - Duration if cardio
   - Include specific exercises like "bench press 3x10 at 185lbs" or general like "did leg day"

3. **DAILY LOG UPDATES**:
   - sleepHours: if they mention sleep duration ("slept 7 hours", "got 6 hours of sleep")
   - sleepQuality: 1-10 if they describe quality ("slept great" = 8-9, "slept terribly" = 2-3)
   - steps: if they mention step count
   - energyLevel: 1-10 based on descriptions ("feeling energetic" = 8, "exhausted" = 2)
   - stressLevel: 1-10 based on descriptions ("stressed out" = 8, "feeling calm" = 3)
   - moodRating: 1-10 based on descriptions
   - weightKg: if they mention weight (convert lbs to kg if needed)
   - waterLiters: if they mention water intake

4. **WORKOUT INFO**:
   - workoutType: category like "upper body", "lower body", "full body", "cardio", "HIIT", "yoga"
   - workoutCompleted: true if they completed a workout

5. **isHealthNote**: Set to true if the text contains:
   - Injuries, pain, or physical issues
   - Emotional context (stress, anxiety, excitement about progress)
   - Lifestyle factors worth remembering (busy week, traveling, etc.)
   - General context that's useful but not directly trackable

EXAMPLES:

Input: "I had eggs and toast for breakfast, then hit the gym and did bench press 4x8 at 185lbs and some tricep work"
Output: {
  "foods": [{"foodName": "Eggs", "mealType": "breakfast", "servingSize": "2 large", "servingQuantity": 2, "calories": 180, "proteinGrams": 12, "carbsGrams": 1, "fatGrams": 13, "fiberGrams": 0}, {"foodName": "Toast", "mealType": "breakfast", "servingSize": "2 slices", "servingQuantity": 2, "calories": 158, "proteinGrams": 6, "carbsGrams": 26, "fatGrams": 2, "fiberGrams": 2}],
  "exercises": [{"exerciseName": "Bench Press", "sets": 4, "reps": "8", "weightKg": 84}, {"exerciseName": "Tricep work", "notes": "unspecified tricep exercises"}],
  "dailyLogUpdates": {},
  "isHealthNote": false,
  "workoutType": "upper body",
  "workoutCompleted": true
}

Input: "Slept about 6 hours, feeling pretty tired. Had a protein shake after my run. Did 3 miles in 25 minutes."
Output: {
  "foods": [{"foodName": "Protein shake", "mealType": "snack", "servingSize": "1 scoop", "servingQuantity": 1, "calories": 120, "proteinGrams": 25, "carbsGrams": 3, "fatGrams": 1, "fiberGrams": 0}],
  "exercises": [{"exerciseName": "Running", "durationMinutes": 25, "notes": "3 miles"}],
  "dailyLogUpdates": {"sleepHours": 6, "sleepQuality": 4, "energyLevel": 4},
  "isHealthNote": false,
  "workoutType": "cardio",
  "workoutCompleted": true
}

Input: "My shoulder is really bothering me today, going to skip upper body"
Output: {
  "foods": [],
  "exercises": [],
  "dailyLogUpdates": {},
  "isHealthNote": true,
  "workoutType": null,
  "workoutCompleted": false
}

Input: "Walked 12000 steps today, feeling great! Had salmon and veggies for dinner."
Output: {
  "foods": [{"foodName": "Salmon", "mealType": "dinner", "servingSize": "6 oz", "servingQuantity": 1, "calories": 350, "proteinGrams": 40, "carbsGrams": 0, "fatGrams": 20, "fiberGrams": 0}, {"foodName": "Mixed vegetables", "mealType": "dinner", "servingSize": "1 cup", "servingQuantity": 1, "calories": 50, "proteinGrams": 2, "carbsGrams": 10, "fatGrams": 0, "fiberGrams": 4}],
  "exercises": [],
  "dailyLogUpdates": {"steps": 12000, "energyLevel": 8, "moodRating": 8},
  "isHealthNote": false
}

Input: "Didn't sleep well, maybe 5 hours. Stressed about work. Just had coffee."
Output: {
  "foods": [{"foodName": "Coffee", "mealType": "snack", "servingSize": "1 cup", "servingQuantity": 1, "calories": 5, "proteinGrams": 0, "carbsGrams": 0, "fatGrams": 0, "fiberGrams": 0}],
  "exercises": [],
  "dailyLogUpdates": {"sleepHours": 5, "sleepQuality": 3, "stressLevel": 7, "energyLevel": 4},
  "isHealthNote": true
}

Respond ONLY with valid JSON. Use null for missing optional fields.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    const result = JSON.parse(content);

    // Validate and provide defaults
    return {
      foods: (result.foods || []).map((food: any) => ({
        foodName: food.foodName || "Unknown food",
        mealType: food.mealType || "snack",
        servingSize: food.servingSize || "1 serving",
        servingQuantity: food.servingQuantity || 1,
        calories: Math.round(food.calories || 0),
        proteinGrams: Math.round(food.proteinGrams || 0),
        carbsGrams: Math.round(food.carbsGrams || 0),
        fatGrams: Math.round(food.fatGrams || 0),
        fiberGrams: Math.round(food.fiberGrams || 0),
      })),
      exercises: (result.exercises || []).map((ex: any) => ({
        exerciseName: ex.exerciseName || "Exercise",
        sets: ex.sets || undefined,
        reps: ex.reps || undefined,
        weightKg: ex.weightKg || undefined,
        durationMinutes: ex.durationMinutes || undefined,
        notes: ex.notes || undefined,
      })),
      dailyLogUpdates: {
        sleepHours: result.dailyLogUpdates?.sleepHours || undefined,
        sleepQuality: result.dailyLogUpdates?.sleepQuality || undefined,
        steps: result.dailyLogUpdates?.steps || undefined,
        energyLevel: result.dailyLogUpdates?.energyLevel || undefined,
        stressLevel: result.dailyLogUpdates?.stressLevel || undefined,
        moodRating: result.dailyLogUpdates?.moodRating || undefined,
        weightKg: result.dailyLogUpdates?.weightKg || undefined,
        waterLiters: result.dailyLogUpdates?.waterLiters || undefined,
      },
      isHealthNote: result.isHealthNote ?? false,
      workoutType: result.workoutType || undefined,
      workoutCompleted: result.workoutCompleted ?? false,
    };
  } catch (error) {
    console.error("Error parsing natural language input:", error);
    // On error, treat as health note only
    return {
      foods: [],
      exercises: [],
      dailyLogUpdates: {},
      isHealthNote: true,
    };
  }
}

// Legacy function for backwards compatibility
export async function parseFoodFromText(text: string, timezone?: string): Promise<{ containsFood: boolean; foods: ParsedFood[]; isHealthNote: boolean }> {
  const result = await parseNaturalLanguageInput(text, timezone);
  return {
    containsFood: result.foods.length > 0,
    foods: result.foods,
    isHealthNote: result.isHealthNote,
  };
}
