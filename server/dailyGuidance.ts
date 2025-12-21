/**
 * AI Daily Guidance Generator
 *
 * Generates personalized daily instructions for the user based on their
 * profile, targets, recent activity, and historical patterns.
 */

import OpenAI from "openai";
import type { UserProfile, DailyLog, FoodEntry, ExerciseLog, OnboardingAssessment, HealthNote } from "@shared/schema";
import { format, subDays } from "date-fns";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface DailyGuidance {
  greeting: string;
  todaysPlan: {
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      message: string;
    };
    workout: {
      recommended: boolean;
      type: string | null;
      message: string;
    };
    steps: {
      target: number;
      message: string;
    };
    focus: string;
  };
  checkIns: Array<{
    type: "warning" | "reminder" | "celebration" | "question";
    message: string;
    priority: number;
  }>;
  motivationalMessage: string;
  generatedAt: string;
}

interface GuidanceContext {
  profile: UserProfile;
  assessment: OnboardingAssessment | undefined;
  todayLog: DailyLog | undefined;
  yesterdayLog: DailyLog | undefined;
  recentLogs: DailyLog[];
  todayFoodEntries: FoodEntry[];
  yesterdayFoodEntries: FoodEntry[];
  recentExerciseLogs: ExerciseLog[];
  healthNotes: HealthNote[];
  currentHour: number;
}

export async function generateDailyGuidance(context: GuidanceContext): Promise<DailyGuidance> {
  const {
    profile,
    assessment,
    todayLog,
    yesterdayLog,
    recentLogs,
    todayFoodEntries,
    yesterdayFoodEntries,
    recentExerciseLogs,
    healthNotes,
    currentHour,
  } = context;

  // Calculate today's logged nutrition from food entries
  const todayNutrition = {
    calories: todayFoodEntries.reduce((sum, e) => sum + (e.calories || 0), 0),
    protein: todayFoodEntries.reduce((sum, e) => sum + (e.proteinGrams || 0), 0),
    carbs: todayFoodEntries.reduce((sum, e) => sum + (e.carbsGrams || 0), 0),
    fat: todayFoodEntries.reduce((sum, e) => sum + (e.fatGrams || 0), 0),
  };

  // Calculate yesterday's logged nutrition
  const yesterdayNutrition = {
    calories: yesterdayFoodEntries.reduce((sum, e) => sum + (e.calories || 0), 0),
    protein: yesterdayFoodEntries.reduce((sum, e) => sum + (e.proteinGrams || 0), 0),
    carbs: yesterdayFoodEntries.reduce((sum, e) => sum + (e.carbsGrams || 0), 0),
    fat: yesterdayFoodEntries.reduce((sum, e) => sum + (e.fatGrams || 0), 0),
  };

  // Find workout days in the last 7 days
  const workoutDaysLast7 = recentExerciseLogs.filter((log, index, self) =>
    self.findIndex(l => l.logDate === log.logDate) === index
  ).length;

  // Check if user worked out yesterday
  const yesterdayDate = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const workedOutYesterday = recentExerciseLogs.some(log => log.logDate === yesterdayDate);

  // Check if user worked out today
  const todayDate = format(new Date(), "yyyy-MM-dd");
  const workedOutToday = recentExerciseLogs.some(log => log.logDate === todayDate);

  // Get average sleep from recent logs
  const logsWithSleep = recentLogs.filter(l => l.sleepHours);
  const avgSleep = logsWithSleep.length > 0
    ? logsWithSleep.reduce((sum, l) => sum + (l.sleepHours || 0), 0) / logsWithSleep.length
    : null;

  // Get current date info
  const now = new Date();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Build context for AI
  const contextData = {
    user: {
      firstName: profile.firstName || "there",
      currentPhase: profile.currentPhase || "assessment",
      targetCalories: profile.targetCalories,
      targetProtein: profile.proteinGrams,
      targetCarbs: profile.carbsGrams,
      targetFat: profile.fatGrams,
      dailyStepsTarget: profile.dailyStepsTarget || 8000,
      coachingTone: profile.coachingTone || "empathetic",
    },
    today: {
      date: format(now, "yyyy-MM-dd"),
      dayOfWeek: dayNames[now.getDay()],
      formattedDate: `${dayNames[now.getDay()]}, ${monthNames[now.getMonth()]} ${now.getDate()}`,
      currentHour,
      isWeekend: [0, 6].includes(now.getDay()),
      loggedCalories: todayNutrition.calories,
      loggedProtein: todayNutrition.protein,
      loggedCarbs: todayNutrition.carbs,
      loggedFat: todayNutrition.fat,
      loggedSteps: todayLog?.steps || 0,
      workedOut: workedOutToday,
      sleepLastNight: todayLog?.sleepHours || null,
      energyLevel: todayLog?.energyLevel || null,
      stressLevel: todayLog?.stressLevel || null,
      mealCount: todayFoodEntries.length,
      // Include the actual food items logged today so AI knows what was eaten
      foodItemsLogged: todayFoodEntries.map(e => ({
        name: e.foodName,
        mealType: e.mealType,
        calories: e.calories,
        protein: e.proteinGrams,
      })),
    },
    yesterday: {
      loggedCalories: yesterdayNutrition.calories,
      loggedProtein: yesterdayNutrition.protein,
      workedOut: workedOutYesterday,
      sleepHours: yesterdayLog?.sleepHours || null,
      hadAlcohol: yesterdayFoodEntries.some(e =>
        e.foodName.toLowerCase().includes("wine") ||
        e.foodName.toLowerCase().includes("beer") ||
        e.foodName.toLowerCase().includes("alcohol") ||
        e.foodName.toLowerCase().includes("cocktail") ||
        e.foodName.toLowerCase().includes("whiskey") ||
        e.foodName.toLowerCase().includes("vodka")
      ),
      foodItems: yesterdayFoodEntries.map(e => e.foodName).slice(0, 10),
    },
    recentTrends: {
      workoutDaysLast7,
      avgSleepLast7Days: avgSleep?.toFixed(1) || null,
      avgCaloriesLast7Days: recentLogs.length > 0
        ? Math.round(recentLogs.reduce((sum, l) => sum + (l.caloriesConsumed || 0), 0) / recentLogs.length)
        : null,
    },
    // User-submitted health notes - important context about injuries, lifestyle, etc.
    healthNotes: healthNotes.map(note => ({
      content: note.content,
      category: note.category,
      createdAt: note.createdAt?.toISOString?.() || note.createdAt,
    })),
  };

  const systemPrompt = `You are a health coach AI generating a personalized daily briefing for a user.
Based on their data, create a structured JSON response with their plan for today.

User's coaching tone preference: ${profile.coachingTone || "empathetic"}
${profile.coachingTone === "tough_love" ? "Be direct and challenging, but still supportive." : ""}
${profile.coachingTone === "scientific" ? "Include brief scientific reasoning for recommendations." : ""}
${profile.coachingTone === "casual" ? "Be friendly and use casual language." : ""}

IMPORTANT RULES:
1. Be specific and actionable - tell them exactly what to do
2. Reference their actual data (e.g., "You've logged X calories so far")
3. If it's late in the day and they haven't logged food, ask about it
4. If they had alcohol yesterday, gently ask if they had any today they forgot to log
5. Celebrate wins (hit protein target, completed workout, good sleep)
6. Point out concerning patterns (missed workouts, low protein, poor sleep)
7. Make the guidance feel personal, not generic
8. PAY CLOSE ATTENTION to healthNotes - these are things the user told you directly:
   - If they mentioned an injury, adjust workout recommendations accordingly
   - If they mentioned overeating/party, acknowledge it without judgment and suggest getting back on track
   - If they mentioned sleep issues, prioritize recovery recommendations
   - If they mentioned stress, be more supportive and suggest stress-reducing activities
   - Reference their notes specifically to show you're listening (e.g., "Since you mentioned your shoulder is hurting...")

Current date and time: Today is ${dayNames[now.getDay()]}, ${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()} at ${currentHour}:00 (${currentHour < 12 ? "morning" : currentHour < 17 ? "afternoon" : "evening"})

9. If the user has already logged food today (see today.foodItemsLogged), acknowledge what they've eaten and reference it specifically in your guidance. For example, "I see you had eggs for breakfast - great protein start!"

Return a valid JSON object with this exact structure:
{
  "greeting": "Personalized greeting based on time of day and their name",
  "todaysPlan": {
    "nutrition": {
      "calories": <their target calories number>,
      "protein": <their target protein number>,
      "carbs": <their target carbs number>,
      "fat": <their target fat number>,
      "message": "Brief nutrition guidance for today based on their current logged intake"
    },
    "workout": {
      "recommended": <true/false if they should workout today>,
      "type": "<workout type if recommended, null otherwise>",
      "message": "Workout guidance based on their recent activity and phase"
    },
    "steps": {
      "target": <their daily steps target>,
      "message": "Steps guidance"
    },
    "focus": "One key thing to focus on today (1 sentence)"
  },
  "checkIns": [
    {
      "type": "warning|reminder|celebration|question",
      "message": "Proactive check-in message",
      "priority": 1-3 (1 is highest)
    }
  ],
  "motivationalMessage": "Brief motivational closing message"
}

Include 1-4 checkIns based on their data. Examples:
- If afternoon and no food logged: ask about logging meals
- If yesterday had alcohol: ask if they had any today
- If they hit protein target yesterday: celebrate
- If they've worked out 3+ times this week: acknowledge effort
- If poor sleep pattern: reminder about sleep importance`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate daily guidance for this user:\n${JSON.stringify(contextData, null, 2)}` },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    const guidance = JSON.parse(content) as Omit<DailyGuidance, "generatedAt">;

    return {
      ...guidance,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error generating daily guidance:", error);

    // Return fallback guidance if AI fails
    return {
      greeting: `Good ${currentHour < 12 ? "morning" : currentHour < 17 ? "afternoon" : "evening"}, ${profile.firstName || "there"}!`,
      todaysPlan: {
        nutrition: {
          calories: profile.targetCalories || 2000,
          protein: profile.proteinGrams || 150,
          carbs: profile.carbsGrams || 200,
          fat: profile.fatGrams || 65,
          message: "Focus on hitting your nutrition targets today.",
        },
        workout: {
          recommended: true,
          type: profile.currentPhase === "recovery" ? "Light mobility" : "Strength training",
          message: "Check the workouts section for today's recommendation.",
        },
        steps: {
          target: profile.dailyStepsTarget || 8000,
          message: `Aim for ${profile.dailyStepsTarget || 8000} steps today.`,
        },
        focus: "Stay consistent with your logging today.",
      },
      checkIns: [
        {
          type: "reminder",
          message: "Remember to log your meals and activity!",
          priority: 2,
        },
      ],
      motivationalMessage: "Every small step counts toward your goals. You've got this!",
      generatedAt: new Date().toISOString(),
    };
  }
}
