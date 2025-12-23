import OpenAI from "openai";
import type { UserProfile, DailyLog, OnboardingAssessment, FoodEntry, ExerciseLog, HealthNote } from "@shared/schema";

// Singleton OpenAI client - reused across all requests for better performance
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface ChatContext {
  profile?: UserProfile;
  recentLogs?: DailyLog[];
  assessment?: OnboardingAssessment;
  foodEntries?: FoodEntry[];
  exerciseLogs?: ExerciseLog[];
  healthNotes?: HealthNote[];
  dailyProgressSummary?: string;
}

function buildSystemPrompt(context: ChatContext): string {
  const { profile, recentLogs, assessment, foodEntries, exerciseLogs, healthNotes, dailyProgressSummary } = context;
  
  let toneInstruction = "";
  switch (profile?.coachingTone) {
    case "scientific":
      toneInstruction = "Be data-driven and provide detailed scientific explanations. Reference research when applicable.";
      break;
    case "casual":
      toneInstruction = "Be friendly, upbeat, and use simple everyday language. Keep things light but informative.";
      break;
    case "tough_love":
      toneInstruction = "Be direct, challenging, and motivating. Don't sugarcoat things but remain supportive.";
      break;
    case "empathetic":
    default:
      toneInstruction = "Be warm, understanding, and supportive. Acknowledge struggles and celebrate wins.";
  }

  let contextInfo = "";
  
  if (profile) {
    contextInfo += `
USER PROFILE:
- Name: ${profile.firstName || "User"}
- Age: ${profile.age || "Unknown"}
- Sex: ${profile.sex || "Unknown"}
- Current Weight: ${profile.currentWeightKg ? `${profile.currentWeightKg} kg` : "Not recorded"}
- Target Weight: ${profile.targetWeightKg ? `${profile.targetWeightKg} kg` : "Not set"}
- Current Phase: ${profile.currentPhase || "assessment"}
- Target Calories: ${profile.targetCalories || "Not calculated"}
- Protein Target: ${profile.proteinGrams ? `${profile.proteinGrams}g` : "Not set"}
- Daily Steps Target: ${profile.dailyStepsTarget || 8000}
`;
  }

  // Add real-time daily progress at the top (most important for immediate coaching)
  if (dailyProgressSummary) {
    contextInfo += dailyProgressSummary;
  }

  if (assessment) {
    contextInfo += `
ASSESSMENT DATA:
- Has been dieting: ${assessment.hasBeenDietingRecently ? "Yes" : "No"}
- Dieting duration: ${assessment.dietingDurationMonths ? `${assessment.dietingDurationMonths} months` : "N/A"}
- Previous lowest calories: ${assessment.previousLowestCalories || "Unknown"}
- Does resistance training: ${assessment.doesResistanceTraining ? "Yes" : "No"}
- Training frequency: ${assessment.resistanceTrainingFrequency ? `${assessment.resistanceTrainingFrequency} days/week` : "N/A"}
- Average sleep: ${assessment.averageSleepHours ? `${assessment.averageSleepHours} hours` : "Unknown"}
- Sleep quality: ${assessment.sleepQuality || "Unknown"}/10
- Stress level: ${assessment.stressLevel || "Unknown"}/10
- Activity level: ${assessment.activityLevel || "Unknown"}
- Metabolic state: ${assessment.metabolicState || "Unknown"}
- Recommended phase: ${assessment.recommendedStartPhase || "Unknown"}
`;
  }

  if (recentLogs && recentLogs.length > 0) {
    // Calculate averages for trends
    const logsWithWeight = recentLogs.filter(l => l.weightKg);
    const logsWithCalories = recentLogs.filter(l => l.caloriesConsumed);
    const logsWithProtein = recentLogs.filter(l => l.proteinGrams);
    const logsWithSteps = recentLogs.filter(l => l.steps);
    const logsWithSleep = recentLogs.filter(l => l.sleepHours);
    const logsWithEnergy = recentLogs.filter(l => l.energyLevel);
    const logsWithStress = recentLogs.filter(l => l.stressLevel);

    const avgCalories = logsWithCalories.length > 0
      ? Math.round(logsWithCalories.reduce((sum, l) => sum + (l.caloriesConsumed || 0), 0) / logsWithCalories.length)
      : null;
    const avgProtein = logsWithProtein.length > 0
      ? Math.round(logsWithProtein.reduce((sum, l) => sum + (l.proteinGrams || 0), 0) / logsWithProtein.length)
      : null;
    const avgSteps = logsWithSteps.length > 0
      ? Math.round(logsWithSteps.reduce((sum, l) => sum + (l.steps || 0), 0) / logsWithSteps.length)
      : null;
    const avgSleep = logsWithSleep.length > 0
      ? (logsWithSleep.reduce((sum, l) => sum + (l.sleepHours || 0), 0) / logsWithSleep.length).toFixed(1)
      : null;
    const avgEnergy = logsWithEnergy.length > 0
      ? (logsWithEnergy.reduce((sum, l) => sum + (l.energyLevel || 0), 0) / logsWithEnergy.length).toFixed(1)
      : null;
    const avgStress = logsWithStress.length > 0
      ? (logsWithStress.reduce((sum, l) => sum + (l.stressLevel || 0), 0) / logsWithStress.length).toFixed(1)
      : null;

    // Weight trend
    let weightTrend = "";
    if (logsWithWeight.length >= 2) {
      const firstWeight = logsWithWeight[logsWithWeight.length - 1].weightKg!;
      const lastWeight = logsWithWeight[0].weightKg!;
      const diff = lastWeight - firstWeight;
      weightTrend = diff > 0 ? `+${diff.toFixed(1)} kg` : `${diff.toFixed(1)} kg`;
    }

    contextInfo += `
TRACKING SUMMARY (Last ${recentLogs.length} days):
- Days logged: ${recentLogs.length}
- Weight trend: ${weightTrend || "Not enough data"}
- Avg daily calories: ${avgCalories ? `${avgCalories} kcal` : "Not tracked"}${profile?.targetCalories ? ` (target: ${profile.targetCalories})` : ""}
- Avg daily protein: ${avgProtein ? `${avgProtein}g` : "Not tracked"}${profile?.proteinGrams ? ` (target: ${profile.proteinGrams}g)` : ""}
- Avg daily steps: ${avgSteps ? avgSteps.toLocaleString() : "Not tracked"}${profile?.dailyStepsTarget ? ` (target: ${profile.dailyStepsTarget.toLocaleString()})` : ""}
- Avg sleep: ${avgSleep ? `${avgSleep} hours` : "Not tracked"}
- Avg energy: ${avgEnergy ? `${avgEnergy}/10` : "Not tracked"}
- Avg stress: ${avgStress ? `${avgStress}/10` : "Not tracked"}

DAILY LOG HISTORY (most recent first):
`;
    // Show each day's data
    for (const log of recentLogs.slice(0, 14)) {
      contextInfo += `
[${log.logDate}]${log.weightKg ? ` Weight: ${log.weightKg}kg` : ""}${log.caloriesConsumed ? ` | Cal: ${log.caloriesConsumed}` : ""}${log.proteinGrams ? ` | Pro: ${log.proteinGrams}g` : ""}${log.steps ? ` | Steps: ${log.steps.toLocaleString()}` : ""}${log.sleepHours ? ` | Sleep: ${log.sleepHours}h` : ""}${log.energyLevel ? ` | Energy: ${log.energyLevel}/10` : ""}${log.stressLevel ? ` | Stress: ${log.stressLevel}/10` : ""}${log.moodRating ? ` | Mood: ${log.moodRating}/10` : ""}${log.workoutCompleted ? ` | ✓ Workout` : ""}${log.notes ? ` | Notes: "${log.notes}"` : ""}`;
    }
  }

  // Food entries section
  if (foodEntries && foodEntries.length > 0) {
    // Group food entries by date
    const entriesByDate = new Map<string, FoodEntry[]>();
    for (const entry of foodEntries) {
      const dateKey = entry.logDate;
      if (!entriesByDate.has(dateKey)) {
        entriesByDate.set(dateKey, []);
      }
      entriesByDate.get(dateKey)!.push(entry);
    }

    contextInfo += `

FOOD LOG (recent meals):`;
    // Show food for last 3 days with entries
    const sortedDates = Array.from(entriesByDate.keys()).sort().reverse().slice(0, 3);
    for (const date of sortedDates) {
      const dayEntries = entriesByDate.get(date)!;
      const totalCal = dayEntries.reduce((sum, e) => sum + (e.calories || 0), 0);
      const totalPro = dayEntries.reduce((sum, e) => sum + (e.proteinGrams || 0), 0);

      contextInfo += `
[${date}] Total: ${totalCal} cal, ${Math.round(totalPro)}g protein`;

      // Group by meal type
      const byMeal = new Map<string, FoodEntry[]>();
      for (const e of dayEntries) {
        const meal = e.mealType || "other";
        if (!byMeal.has(meal)) byMeal.set(meal, []);
        byMeal.get(meal)!.push(e);
      }

      byMeal.forEach((items, meal) => {
        const mealItems = items.map((i: FoodEntry) => `${i.foodName}${i.calories ? ` (${i.calories} cal)` : ""}`).join(", ");
        contextInfo += `
  ${meal.charAt(0).toUpperCase() + meal.slice(1)}: ${mealItems}`;
      });
    }
  }

  // Exercise logs section
  if (exerciseLogs && exerciseLogs.length > 0) {
    // Group exercise logs by date
    const exercisesByDate = new Map<string, ExerciseLog[]>();
    for (const log of exerciseLogs) {
      const dateKey = log.logDate;
      if (!exercisesByDate.has(dateKey)) {
        exercisesByDate.set(dateKey, []);
      }
      exercisesByDate.get(dateKey)!.push(log);
    }

    contextInfo += `

WORKOUT LOG (recent workouts):`;
    const sortedExDates = Array.from(exercisesByDate.keys()).sort().reverse().slice(0, 5);
    for (const date of sortedExDates) {
      const dayExercises = exercisesByDate.get(date)!.filter(e => !e.skipped);
      if (dayExercises.length === 0) continue;

      contextInfo += `
[${date}] Exercises completed:`;
      for (const ex of dayExercises) {
        const setDetails = ex.setDetails as { reps: number; weightKg?: number }[] | null;
        let setsInfo = "";
        if (setDetails && setDetails.length > 0) {
          const completedSets = setDetails.filter(s => s.reps > 0);
          if (completedSets.length > 0) {
            const weights = completedSets.filter(s => s.weightKg).map(s => s.weightKg);
            const maxWeight = weights.length > 0 ? Math.max(...weights as number[]) : null;
            setsInfo = ` - ${completedSets.length} sets${maxWeight ? `, up to ${maxWeight}kg` : ""}`;
          }
        }
        contextInfo += `
  • ${ex.exerciseName}${setsInfo}`;
      }
    }
  }

  // Health notes section - important user-provided context
  if (healthNotes && healthNotes.length > 0) {
    contextInfo += `

USER NOTES (important context the user shared with you):`;
    for (const note of healthNotes) {
      const dateStr = note.createdAt ? new Date(note.createdAt).toLocaleDateString() : "";
      contextInfo += `
• [${note.category || "general"}${dateStr ? `, ${dateStr}` : ""}] "${note.content}"`;
    }
    contextInfo += `

⚠️ IMPORTANT: Pay close attention to these notes! They contain crucial context like injuries, lifestyle events, sleep issues, or dietary concerns. Adjust your recommendations accordingly. For example:
- If user mentioned an injury → avoid exercises that could aggravate it
- If user mentioned overeating at an event → be supportive, not judgmental; help them get back on track
- If user mentioned stress or sleep issues → prioritize recovery and stress management
- Reference these notes directly to show you're listening (e.g., "Since you mentioned...")`;
  }

  // Add phase-specific workout guidance
  let phaseGuidance = "";
  const currentPhase = profile?.currentPhase || "assessment";

  switch (currentPhase) {
    case "recovery":
      phaseGuidance = `
CURRENT PHASE: METABOLIC RECOVERY
- Focus on mobility work and light resistance training (RIR 4+)
- Prioritize recovery-type workouts: yoga, stretching, light circuits
- Avoid HIIT and intense cardio - use low impact options only
- Goal is to restore metabolic rate while maintaining muscle
- Gradually increase calories (reverse diet approach)
- Sleep and stress management are CRITICAL in this phase`;
      break;
    case "recomp":
      phaseGuidance = `
CURRENT PHASE: BODY RECOMPOSITION
- Balance strength training (3-4 sessions/week) with moderate cardio
- Train with progressive overload at RIR 2-3
- Recommended workouts: Full Body Strength, Recomp Power Build, Upper/Lower splits
- Small calorie deficit (5-10% below maintenance) or at maintenance
- High protein essential (1.8-2.2g/kg) to support muscle growth
- Can include 1-2 HIIT sessions per week if recovery is good`;
      break;
    case "cutting":
      phaseGuidance = `
CURRENT PHASE: FAT LOSS (CUTTING)
- Prioritize maintaining strength with heavy compound lifts (lower volume)
- Recommended workouts: Cutting Strength Maintenance, Fat Loss Finishers
- Can add HIIT and metabolic conditioning for extra calorie burn
- Keep strength training intensity HIGH but volume MODERATE
- 15-20% calorie deficit from maintenance
- Watch for signs of fatigue - transition to recovery if needed`;
      break;
    default:
      phaseGuidance = `
CURRENT PHASE: ASSESSMENT
- User is still in assessment - help them complete onboarding
- Gather information about their history, goals, and current state
- Be ready to recommend the appropriate starting phase`;
  }

  return `You are VitalPath, an AI health mentor specializing in holistic body recomposition and metabolic recovery for adults aged 40 and over.

##############################################
# FIRST: DETERMINE THE TYPE OF USER MESSAGE #
##############################################

Before responding, CLASSIFY the user's message into one of these categories:

**TYPE A: SIMPLE LOGGING REQUEST** (respond in 2-4 sentences MAX)
- "Add [food]", "Log [food]", "Had [food] for lunch"
- "Add a meal called...", "Just ate..."
- "Weight today is...", "Slept X hours", "Did X steps"
- Any request to record/log data

For TYPE A: ONLY provide a brief confirmation with nutritional breakdown.
DO NOT add coaching, advice, emotional support, or reference other data.
Example response: "✓ Logged 'My Lunch': Chicken 180g (330 cal, 39g protein), Salad with tahini (~220 cal, 6g protein). Total: 550 cal, 45g protein."
STOP THERE. Do not add anything else.

**TYPE B: QUESTION OR DISCUSSION** (provide full response)
- Questions about nutrition, training, progress
- Asking for advice or recommendations
- Discussing their plan or goals

**TYPE C: EMOTIONAL/CONCERN SHARING** (provide supportive full response)
- Sharing struggles, frustrations, concerns
- Talking about how they feel
- Expressing worry about progress

For TYPE B and C: Provide thoughtful, comprehensive coaching responses.

##############################################

You act like a real human coach - proactive, attentive, and making adjustments to your client's plan as needed.

YOUR EXPERTISE:

1. **Metabolic Adaptation & Recovery**: Understanding how prolonged dieting affects metabolism, recognizing signs of metabolic adaptation, and guiding reverse dieting protocols.

2. **Body Recomposition**: Helping users simultaneously lose fat and build/maintain muscle through proper nutrition and training.

3. **Evidence-Based Nutrition**: Calculating appropriate calorie and macro targets, understanding protein needs for 40+ adults, and promoting sustainable eating habits rather than restrictive diets.

4. **Training for Longevity**: Recommending age-appropriate resistance training using RIR (Reps in Reserve) methodology, emphasizing joint health, recovery, and progressive overload.

5. **Biofeedback Interpretation**: Analyzing sleep, energy, stress, mood, and recovery markers to adjust recommendations and identify when to push vs. when to recover.

6. **Behavioral Psychology**: Understanding the emotional aspects of weight management, building sustainable habits, and addressing the psychological barriers to success.

COMMUNICATION STYLE:
${toneInstruction}

${contextInfo}
${phaseGuidance}

**CRITICAL: AUTO-APPLYING CHANGES**
You have the ability to DIRECTLY UPDATE the user's plan. When you determine a change is needed, you must:

1. **Be definitive** - Don't say "you might want to consider" or "you could try". Instead say "I'm adjusting your calories to X" or "Let's increase your protein to Y grams".

2. **State the change clearly** - Use specific language that indicates you're making a change:
   - "I'm adjusting your target calories from X to Y"
   - "I'm increasing your protein target to X grams"
   - "Based on your progress, I'm transitioning your phase to [recovery/recomp/cutting]"
   - "Let's set your daily steps target to X"

3. **Explain your reasoning** - Always explain WHY you're making the change.

4. **Be proactive** - Don't wait for the user to ask. If you see something that needs adjustment, make it!

**WHEN TO MAKE CHANGES:**

**NUTRITION** (targetCalories, proteinGrams, carbsGrams, fatGrams):
- User isn't hitting protein targets consistently → Adjust to more realistic target
- User is in too deep a deficit → Increase calories
- User's energy/recovery is poor → Adjust macros
- User requests a change → Honor it with appropriate adjustments

**TRAINING** (dailyStepsTarget):
- User consistently exceeds or misses step target → Adjust accordingly
- User's activity level changes → Update targets

**PHASE** (currentPhase: recovery, recomp, or cutting):
- User shows signs of metabolic adaptation → Transition to recovery
- User's biofeedback improves significantly → Transition to next phase
- User requests a phase change → Execute it with appropriate adjustments

**PROACTIVE COACHING - ACT LIKE A REAL COACH:**

Don't just answer questions - proactively:
- Review their recent data and comment on trends
- Notice patterns (sleep affecting energy, stress affecting recovery)
- Suggest workout types appropriate for their current phase
- Recommend recovery days when biofeedback suggests it
- Celebrate wins and acknowledge struggles
- Check in on how they're feeling about their progress
- Anticipate needs before they ask

**EXAMPLE PROACTIVE MESSAGES:**
- "I noticed your sleep has been under 6 hours for the past few days. This will impact your recovery. Let's prioritize getting to bed earlier this week."
- "Your protein has been consistently 30g below target. I'm adjusting your target from 180g to 160g - a more realistic goal we can build from."
- "Great job hitting your step target 5 days in a row! Your consistency is really paying off."
- "Based on your energy levels improving and stress coming down, I'm transitioning you from recovery phase to recomp. I'm also adjusting your calories accordingly."

GUIDELINES:
- Always consider the user's age (40+)—prioritize joint health, recovery, and sustainability
- If the user shows signs of metabolic adaptation (very low calories, fatigue, poor recovery), suggest recovery phase
- Never recommend extreme calorie deficits (below BMR) or excessive training volumes
- Acknowledge that weight fluctuations are normal—focus on trends, not daily numbers
- Encourage consistent protein intake (1.6-2.2g/kg) and adequate sleep (7-9 hours)
- If asked about medical conditions, recommend consulting a healthcare provider
- Be encouraging but honest about unrealistic expectations
- Remember: sustainability and health come before rapid results
- PROACTIVELY suggest workout and nutrition changes based on their data
- When you make a change, TELL THEM you're making it - be clear and direct

**REMINDER: For simple logging requests (TYPE A from above), keep response to 2-4 sentences. Just confirm the data was logged with nutritional breakdown. No coaching or extra commentary.**`;
}

export async function generateMentorResponse(
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  context: ChatContext
): Promise<string> {
  try {
    const systemPrompt = buildSystemPrompt(context);

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

    return response.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";
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
