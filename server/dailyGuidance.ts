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
      targetCalories: number;
      targetProtein: number;
      targetCarbs: number;
      targetFat: number;
      consumedCalories: number;
      consumedProtein: number;
      consumedCarbs: number;
      consumedFat: number;
      message: string;
    };
    workout: {
      recommended: boolean;
      type: string | null;
      message: string;
      // New: specific workout details from AI
      specificPlan: {
        title: string;
        duration: string;
        exercises: Array<{
          name: string;
          sets?: number;
          reps?: string;
          duration?: string;
          notes?: string;
        }>;
        timing?: string; // e.g., "Best done in the morning" or "Avoid within 3 hours of bedtime"
        recovery?: string; // Recovery notes
      } | null;
    };
    steps: {
      target: number;
      current: number;
      message: string;
    };
    focus: string;
  };
  checkIns: Array<{
    type: "warning" | "reminder" | "celebration" | "question";
    message: string;
    priority: number;
  }>;
  proactiveInsights: Array<{
    category: "sleep" | "nutrition" | "workout" | "recovery" | "lifestyle";
    insight: string;
    actionable: string;
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

  const systemPrompt = `You are an expert health coach AI generating a HIGHLY PERSONALIZED daily briefing for a user.
Based on ALL their data, create a structured JSON response with their specific plan for today.

User's coaching tone preference: ${profile.coachingTone || "empathetic"}
${profile.coachingTone === "tough_love" ? "Be direct and challenging, but still supportive." : ""}
${profile.coachingTone === "scientific" ? "Include brief scientific reasoning for recommendations." : ""}
${profile.coachingTone === "casual" ? "Be friendly and use casual language." : ""}

CRITICAL RULES FOR PERSONALIZATION:
1. BE EXTREMELY SPECIFIC - Don't say "do some cardio", say "30 minutes of brisk walking" or "20 minutes on the treadmill at 3.5mph"
2. Reference their ACTUAL data (e.g., "You've logged ${todayNutrition.calories} of ${profile.targetCalories} calories")
3. Generate a COMPLETE workout plan with specific exercises, sets, reps, and timing
4. Consider their sleep, stress, recovery, and schedule when recommending workout timing
5. If they had poor sleep, recommend lighter training or morning cardio for better sleep tonight
6. If stress is high, suggest stress-reducing activities like walking or yoga
7. ALWAYS include timing advice (e.g., "Do cardio in the morning for better sleep" or "Avoid intense training within 3 hours of bedtime")

PAY CLOSE ATTENTION to healthNotes - these are things the user told you directly:
- If they mentioned an injury, adjust workout recommendations accordingly
- If they mentioned overeating/party, acknowledge it without judgment and suggest getting back on track
- If they mentioned sleep issues, prioritize recovery recommendations
- If they mentioned stress, be more supportive and suggest stress-reducing activities
- Reference their notes specifically to show you're listening

Current date and time: Today is ${dayNames[now.getDay()]}, ${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()} at ${currentHour}:00 (${currentHour < 12 ? "morning" : currentHour < 17 ? "afternoon" : "evening"})

If the user has already logged food today, acknowledge what they've eaten specifically.

Return a valid JSON object with this EXACT structure:
{
  "greeting": "Personalized greeting based on time of day and their name",
  "todaysPlan": {
    "nutrition": {
      "targetCalories": ${profile.targetCalories || 2000},
      "targetProtein": ${profile.proteinGrams || 150},
      "targetCarbs": ${profile.carbsGrams || 200},
      "targetFat": ${profile.fatGrams || 65},
      "consumedCalories": ${todayNutrition.calories},
      "consumedProtein": ${todayNutrition.protein},
      "consumedCarbs": ${todayNutrition.carbs},
      "consumedFat": ${todayNutrition.fat},
      "message": "Brief nutrition guidance for today based on their current logged intake"
    },
    "workout": {
      "recommended": <true/false if they should workout today>,
      "type": "<workout type if recommended: 'Strength Training', 'Cardio', 'Active Recovery', 'Rest Day', etc.>",
      "message": "Why this workout and what to focus on",
      "specificPlan": {
        "title": "Today's Workout: <specific name like 'Upper Body Strength' or 'Morning Cardio + Evening Strength'>",
        "duration": "<total duration like '45 minutes' or '30 min AM + 40 min PM'>",
        "exercises": [
          {
            "name": "Exercise name",
            "sets": 3,
            "reps": "8-12",
            "notes": "Form tips or alternatives"
          }
        ],
        "timing": "Specific timing advice like 'Do this workout before 6pm' or 'Morning cardio recommended for better sleep'",
        "recovery": "Post-workout recovery notes"
      }
    },
    "steps": {
      "target": ${profile.dailyStepsTarget || 8000},
      "current": ${todayLog?.steps || 0},
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
  "proactiveInsights": [
    {
      "category": "sleep|nutrition|workout|recovery|lifestyle",
      "insight": "Observation based on their data patterns",
      "actionable": "Specific action they can take"
    }
  ],
  "motivationalMessage": "Brief motivational closing message"
}

WORKOUT PLAN REQUIREMENTS:
- If recommending strength training, include 4-6 exercises with sets/reps
- If recommending cardio, specify type, duration, and intensity
- If rest day, still include light activity suggestions
- Consider their phase: ${profile.currentPhase || "assessment"}
  - Recovery phase: Focus on lighter loads, mobility, building base
  - Recomp phase: Mix of strength and moderate cardio
  - Cutting phase: Maintain strength, strategic cardio
- If they worked out yesterday (${workedOutYesterday ? "YES" : "NO"}), consider recovery
- Include timing advice based on their sleep patterns (avg ${avgSleep?.toFixed(1) || "unknown"} hours)

PROACTIVE INSIGHTS (include 1-3):
- Sleep optimization tips based on their patterns
- Nutrition timing recommendations
- Recovery advice based on recent activity
- Lifestyle tips (stress management, hydration, etc.)`;

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
          targetCalories: profile.targetCalories || 2000,
          targetProtein: profile.proteinGrams || 150,
          targetCarbs: profile.carbsGrams || 200,
          targetFat: profile.fatGrams || 65,
          consumedCalories: todayNutrition.calories,
          consumedProtein: todayNutrition.protein,
          consumedCarbs: todayNutrition.carbs,
          consumedFat: todayNutrition.fat,
          message: "Focus on hitting your nutrition targets today.",
        },
        workout: {
          recommended: true,
          type: profile.currentPhase === "recovery" ? "Active Recovery" : "Strength Training",
          message: "Check the workouts section for today's recommendation.",
          specificPlan: {
            title: profile.currentPhase === "recovery" ? "Active Recovery Day" : "Full Body Strength",
            duration: "40-50 minutes",
            exercises: profile.currentPhase === "recovery" ? [
              { name: "Walking", duration: "20 minutes", notes: "Light pace, outdoors if possible" },
              { name: "Stretching", duration: "10 minutes", notes: "Focus on tight areas" },
              { name: "Foam Rolling", duration: "10 minutes", notes: "Legs and back" },
            ] : [
              { name: "Goblet Squat", sets: 3, reps: "10-12", notes: "Keep chest up" },
              { name: "Push-ups", sets: 3, reps: "8-12", notes: "Modify on knees if needed" },
              { name: "Dumbbell Rows", sets: 3, reps: "10-12", notes: "Each arm" },
              { name: "Lunges", sets: 3, reps: "10 each leg", notes: "Bodyweight or weighted" },
              { name: "Plank", sets: 3, reps: "30-45 seconds", notes: "Keep core tight" },
            ],
            timing: "Best done in the morning or early afternoon",
            recovery: "Stretch for 5-10 minutes after and stay hydrated",
          },
        },
        steps: {
          target: profile.dailyStepsTarget || 8000,
          current: todayLog?.steps || 0,
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
      proactiveInsights: [
        {
          category: "lifestyle",
          insight: "Consistent logging helps track progress",
          actionable: "Try to log meals right after eating",
        },
      ],
      motivationalMessage: "Every small step counts toward your goals. You've got this!",
      generatedAt: new Date().toISOString(),
    };
  }
}
