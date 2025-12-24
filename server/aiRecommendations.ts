/**
 * AI-Powered Recommendation Service
 *
 * This service uses OpenAI to analyze user profiles and provide
 * personalized recommendations for workouts, nutrition, sleep, and more.
 */

import OpenAI from "openai";
import type { UserProfile, DailyLog, OnboardingAssessment, WorkoutTemplate } from "@shared/schema";
import { AI_MODEL_PRIMARY } from "./aiModels";

// Lazy-initialized OpenAI client
let openaiInstance: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
}

const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAI() as any)[prop];
  }
});

export interface AIRecommendation {
  category: "workout" | "nutrition" | "sleep" | "recovery" | "mindset" | "phase";
  priority: "high" | "medium" | "low";
  title: string;
  recommendation: string;
  reasoning: string;
  actionItems: string[];
}

export interface ProfileAnalysis {
  overallAssessment: string;
  recommendations: AIRecommendation[];
  suggestedWorkoutTypes: string[];
  nutritionAdjustments: {
    calories: "increase" | "decrease" | "maintain";
    protein: "increase" | "decrease" | "maintain";
    carbs: "increase" | "decrease" | "maintain";
    fat: "increase" | "decrease" | "maintain";
    reasoning: string;
  };
  trainingAdjustments: {
    volume: "increase" | "decrease" | "maintain";
    intensity: "increase" | "decrease" | "maintain";
    cardio: "add" | "remove" | "maintain" | "reduce";
    recoveryDays: "increase" | "decrease" | "maintain";
    reasoning: string;
  };
  phaseRecommendation: {
    currentPhase: string;
    shouldTransition: boolean;
    suggestedPhase: string | null;
    reasoning: string;
  };
}

interface AnalysisContext {
  profile: UserProfile;
  assessment?: OnboardingAssessment | null;
  recentLogs?: DailyLog[];
  availableWorkouts?: WorkoutTemplate[];
}

function buildAnalysisPrompt(context: AnalysisContext): string {
  const { profile, assessment, recentLogs } = context;

  let prompt = `Analyze this user's health data and provide personalized recommendations.

USER PROFILE:
- Age: ${profile.age || "Unknown"}
- Sex: ${profile.sex || "Unknown"}
- Height: ${profile.heightCm ? `${profile.heightCm} cm` : "Unknown"}
- Current Weight: ${profile.currentWeightKg ? `${profile.currentWeightKg} kg` : "Unknown"}
- Target Weight: ${profile.targetWeightKg ? `${profile.targetWeightKg} kg` : "Not set"}
- Current Phase: ${profile.currentPhase || "assessment"}
- Phase Start Date: ${profile.phaseStartDate || "Not started"}
- Target Calories: ${profile.targetCalories || "Not calculated"}
- Protein Target: ${profile.proteinGrams ? `${profile.proteinGrams}g` : "Not set"}
- Carbs Target: ${profile.carbsGrams ? `${profile.carbsGrams}g` : "Not set"}
- Fat Target: ${profile.fatGrams ? `${profile.fatGrams}g` : "Not set"}
- Daily Steps Target: ${profile.dailyStepsTarget || 8000}
`;

  if (assessment) {
    prompt += `
ASSESSMENT DATA:
- Has been dieting recently: ${assessment.hasBeenDietingRecently ? "Yes" : "No"}
- Dieting duration: ${assessment.dietingDurationMonths ? `${assessment.dietingDurationMonths} months` : "N/A"}
- Previous lowest calories: ${assessment.previousLowestCalories || "Unknown"}
- Does resistance training: ${assessment.doesResistanceTraining ? "Yes" : "No"}
- Training frequency: ${assessment.resistanceTrainingFrequency ? `${assessment.resistanceTrainingFrequency} days/week` : "N/A"}
- Activity level: ${assessment.activityLevel || "Unknown"}
- Average sleep: ${assessment.averageSleepHours ? `${assessment.averageSleepHours} hours` : "Unknown"}
- Sleep quality: ${assessment.sleepQuality || "Unknown"}/10
- Stress level: ${assessment.stressLevel || "Unknown"}/10
- Metabolic state: ${assessment.metabolicState || "Unknown"}
- Knows RIR: ${assessment.knowsRIR ? "Yes" : "No"}
`;
  }

  if (recentLogs && recentLogs.length > 0) {
    prompt += `
RECENT 7-DAY LOGS:
`;
    recentLogs.slice(0, 7).forEach((log) => {
      prompt += `
${log.logDate}:
- Weight: ${log.weightKg ? `${log.weightKg} kg` : "Not logged"}
- Calories: ${log.caloriesConsumed || "Not logged"}
- Protein: ${log.proteinGrams || "Not logged"}g
- Steps: ${log.steps || "Not logged"}
- Sleep: ${log.sleepHours ? `${log.sleepHours} hrs` : "Not logged"} (Quality: ${log.sleepQuality || "N/A"}/10)
- Energy: ${log.energyLevel || "N/A"}/10
- Stress: ${log.stressLevel || "N/A"}/10
- Mood: ${log.moodRating || "N/A"}/10
- Workout: ${log.workoutCompleted ? `Yes (${log.workoutType || "unspecified"})` : "No"}
`;
    });
  }

  prompt += `
IMPORTANT CONTEXT:
- This user is 40+ years old, so prioritize joint health, recovery, and sustainable approaches
- Avoid recommending aggressive deficits or extreme training volumes
- Consider metabolic adaptation if they've been dieting long-term
- Sleep and stress management are critical for this demographic

Based on all this data, provide your analysis as a JSON object with the following structure:
{
  "overallAssessment": "2-3 sentence summary of the user's current state and progress",
  "recommendations": [
    {
      "category": "workout|nutrition|sleep|recovery|mindset|phase",
      "priority": "high|medium|low",
      "title": "Short title",
      "recommendation": "Specific actionable recommendation",
      "reasoning": "Why this matters for this user",
      "actionItems": ["Specific action 1", "Specific action 2"]
    }
  ],
  "suggestedWorkoutTypes": ["List of workout types appropriate for current phase"],
  "nutritionAdjustments": {
    "calories": "increase|decrease|maintain",
    "protein": "increase|decrease|maintain",
    "carbs": "increase|decrease|maintain",
    "fat": "increase|decrease|maintain",
    "reasoning": "Why these adjustments"
  },
  "trainingAdjustments": {
    "volume": "increase|decrease|maintain",
    "intensity": "increase|decrease|maintain",
    "cardio": "add|remove|maintain|reduce",
    "recoveryDays": "increase|decrease|maintain",
    "reasoning": "Why these adjustments"
  },
  "phaseRecommendation": {
    "currentPhase": "current phase name",
    "shouldTransition": true/false,
    "suggestedPhase": "suggested phase or null",
    "reasoning": "Why stay or transition"
  }
}

Provide 3-5 prioritized recommendations. Return ONLY the JSON object, no other text.`;

  return prompt;
}

export async function analyzeProfileForRecommendations(
  context: AnalysisContext
): Promise<ProfileAnalysis> {
  try {
    const prompt = buildAnalysisPrompt(context);

    const response = await openai.chat.completions.create({
      model: AI_MODEL_PRIMARY,
      messages: [
        {
          role: "system",
          content: `You are VitalPath's AI recommendation engine. You analyze user health data and provide personalized, evidence-based recommendations for adults 40+.

Your expertise includes:
- Metabolic adaptation and recovery
- Body recomposition strategies
- Age-appropriate training (RIR methodology)
- Nutrition for 40+ adults (higher protein needs)
- Sleep and stress optimization
- Sustainable, long-term approaches

Always return valid JSON. Prioritize health and sustainability over rapid results.`,
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || "{}";

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    const analysis: ProfileAnalysis = JSON.parse(jsonMatch[0]);
    return analysis;
  } catch (error) {
    console.error("Error analyzing profile:", error);

    // Return default recommendations on error
    return {
      overallAssessment: "Unable to generate AI analysis. Please try again later.",
      recommendations: [
        {
          category: "workout",
          priority: "medium",
          title: "Start with the basics",
          recommendation: "Focus on 3 full-body strength sessions per week with compound movements.",
          reasoning: "Building a consistent routine is the foundation of progress.",
          actionItems: ["Schedule 3 workout sessions this week", "Focus on form over weight"],
        },
      ],
      suggestedWorkoutTypes: ["strength", "recovery"],
      nutritionAdjustments: {
        calories: "maintain",
        protein: "maintain",
        carbs: "maintain",
        fat: "maintain",
        reasoning: "Maintain current targets until more data is available.",
      },
      trainingAdjustments: {
        volume: "maintain",
        intensity: "maintain",
        cardio: "maintain",
        recoveryDays: "maintain",
        reasoning: "Maintain current training approach until more data is available.",
      },
      phaseRecommendation: {
        currentPhase: context.profile.currentPhase || "assessment",
        shouldTransition: false,
        suggestedPhase: null,
        reasoning: "Continue current phase and log more data for accurate assessment.",
      },
    };
  }
}

/**
 * Quick workout recommendation based on current phase and recent activity
 */
export async function getQuickWorkoutRecommendation(
  profile: UserProfile,
  recentLogs?: DailyLog[],
  availableWorkouts?: WorkoutTemplate[]
): Promise<{ workoutName: string; reasoning: string } | null> {
  if (!availableWorkouts || availableWorkouts.length === 0) {
    return null;
  }

  const currentPhase = profile.currentPhase || "recomp";

  // Filter workouts for current phase
  const phaseWorkouts = availableWorkouts.filter((w) => {
    const phases = w.phases as string[] | null;
    return phases ? phases.includes(currentPhase) : true;
  });

  if (phaseWorkouts.length === 0) {
    return null;
  }

  // Analyze recent workout history
  const recentWorkouts = recentLogs
    ?.filter((log) => log.workoutCompleted && log.workoutType)
    .slice(0, 7)
    .map((log) => log.workoutType) || [];

  // Simple recommendation logic - can be enhanced with AI
  let recommendation: WorkoutTemplate;

  if (recentWorkouts.length === 0) {
    // No recent workouts - recommend beginner strength
    recommendation = phaseWorkouts.find((w) => w.type === "strength" && w.difficulty === "beginner") ||
      phaseWorkouts[0];
  } else {
    // Check if recovery is needed
    const consecutiveStrengthDays = recentWorkouts.filter((w) => w?.includes("strength")).length;

    if (consecutiveStrengthDays >= 3) {
      // Recommend recovery
      recommendation = phaseWorkouts.find((w) => w.type === "recovery") || phaseWorkouts[0];
    } else {
      // Vary the workout type
      const lastType = recentWorkouts[0];
      recommendation = phaseWorkouts.find((w) => w.type !== lastType) || phaseWorkouts[0];
    }
  }

  return {
    workoutName: recommendation.name,
    reasoning: `Based on your ${currentPhase} phase and recent activity, "${recommendation.name}" is recommended. ${recommendation.description}`,
  };
}
