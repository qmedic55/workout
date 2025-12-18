import OpenAI from "openai";
import type { UserProfile, DailyLog, OnboardingAssessment } from "@shared/schema";

// Using user's own OpenAI API key
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface ChatContext {
  profile?: UserProfile;
  recentLogs?: DailyLog[];
  assessment?: OnboardingAssessment;
}

function buildSystemPrompt(context: ChatContext): string {
  const { profile, recentLogs, assessment } = context;
  
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
    const lastLog = recentLogs[0];
    contextInfo += `
RECENT LOG (${lastLog.logDate}):
- Weight: ${lastLog.weightKg ? `${lastLog.weightKg} kg` : "Not recorded"}
- Calories: ${lastLog.caloriesConsumed || 0} kcal
- Protein: ${lastLog.proteinGrams || 0}g
- Steps: ${lastLog.steps || 0}
- Sleep: ${lastLog.sleepHours ? `${lastLog.sleepHours} hours` : "Not recorded"}
- Energy: ${lastLog.energyLevel || "N/A"}/10
- Stress: ${lastLog.stressLevel || "N/A"}/10
- Mood: ${lastLog.moodRating || "N/A"}/10
`;
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

  return `You are VitalPath, an AI health mentor specializing in holistic body recomposition and metabolic recovery for adults aged 40 and over. You act like a real human coach - proactive, attentive, and making adjustments to your client's plan as needed.

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

Respond thoughtfully and conversationally. Keep responses concise but comprehensive—aim for 2-4 paragraphs unless detailed explanations are needed.`;
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
