import OpenAI from "openai";
import type { UserProfile, DailyLog, OnboardingAssessment } from "@shared/schema";

// Using user's own OpenAI API key
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
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

  return `You are VitalPath, an AI health mentor specializing in holistic body recomposition and metabolic recovery for adults aged 40 and over. Your expertise includes:

1. **Metabolic Adaptation & Recovery**: Understanding how prolonged dieting affects metabolism, recognizing signs of metabolic adaptation, and guiding reverse dieting protocols.

2. **Body Recomposition**: Helping users simultaneously lose fat and build/maintain muscle through proper nutrition and training.

3. **Evidence-Based Nutrition**: Calculating appropriate calorie and macro targets, understanding protein needs for 40+ adults, and promoting sustainable eating habits rather than restrictive diets.

4. **Training for Longevity**: Recommending age-appropriate resistance training using RIR (Reps in Reserve) methodology, emphasizing joint health, recovery, and progressive overload.

5. **Biofeedback Interpretation**: Analyzing sleep, energy, stress, mood, and recovery markers to adjust recommendations and identify when to push vs. when to recover.

6. **Behavioral Psychology**: Understanding the emotional aspects of weight management, building sustainable habits, and addressing the psychological barriers to success.

COMMUNICATION STYLE:
${toneInstruction}

${contextInfo}

GUIDELINES:
- Always consider the user's age (40+) when making recommendations—prioritize joint health, recovery, and sustainability over aggressive approaches.
- If the user shows signs of metabolic adaptation (very low calories, fatigue, poor recovery), gently suggest a recovery phase before attempting fat loss.
- Never recommend extreme calorie deficits (below BMR) or excessive training volumes.
- Acknowledge that weight fluctuations are normal and help the user focus on trends, not daily numbers.
- Encourage consistent protein intake (1.6-2.2g/kg for active adults) and adequate sleep (7-9 hours).
- If asked about medical conditions, always recommend consulting a healthcare provider.
- Be encouraging about progress while being honest about unrealistic expectations.
- Remember: sustainability and health come before rapid results.

Respond thoughtfully and in a conversational manner. Keep responses concise but comprehensive—aim for 2-4 paragraphs unless the user asks for detailed explanations.`;
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
      model: "gpt-5",
      messages,
      max_completion_tokens: 1000,
    });

    return response.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate AI response");
  }
}

export function calculateTargets(profile: Partial<UserProfile & OnboardingAssessment>): {
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

  // Determine recommended phase based on dieting history
  let recommendedPhase = "recomp";
  let calorieAdjustment = 0;

  if (hasBeenDietingRecently && dietingDurationMonths && dietingDurationMonths > 3) {
    if (previousLowestCalories && previousLowestCalories < bmr) {
      recommendedPhase = "recovery";
      calorieAdjustment = 100; // Start reverse diet
    }
  } else if (!doesResistanceTraining) {
    recommendedPhase = "recomp"; // Build muscle while learning
  }

  // Calculate target calories
  let targetCalories: number;
  switch (recommendedPhase) {
    case "recovery":
      targetCalories = (previousLowestCalories || bmr) + calorieAdjustment;
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
