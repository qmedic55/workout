import { storage } from "./storage";
import { calculateTargets } from "./openai";
import { notificationTemplates } from "./notificationService";
import type { UserProfile, DailyLog, OnboardingAssessment } from "@shared/schema";
import { format } from "date-fns";

export interface PhaseEvaluation {
  currentPhase: string;
  weeksInPhase: number;
  readyForTransition: boolean;
  suggestedPhase: string | null;
  reason: string;
  biofeedbackScore: number;
  metrics: {
    averageEnergy: number;
    averageSleep: number;
    averageStress: number;
    averageMood: number;
    weightTrend: "gaining" | "losing" | "stable";
    calorieAdherence: number;
  };
}

function calculateWeeksInPhase(phaseStartDate: string | null): number {
  if (!phaseStartDate) return 0;
  const start = new Date(phaseStartDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7);
}

function calculateBiofeedbackScore(logs: DailyLog[]): number {
  const validLogs = logs.filter(
    (log) => log.energyLevel || log.sleepQuality || log.moodRating
  );
  if (validLogs.length === 0) return 5;

  let totalScore = 0;
  let count = 0;

  for (const log of validLogs) {
    if (log.energyLevel) {
      totalScore += log.energyLevel;
      count++;
    }
    if (log.sleepQuality) {
      totalScore += log.sleepQuality;
      count++;
    }
    if (log.moodRating) {
      totalScore += log.moodRating;
      count++;
    }
    // Stress is inverted (lower is better)
    if (log.stressLevel) {
      totalScore += 11 - log.stressLevel;
      count++;
    }
  }

  return count > 0 ? totalScore / count : 5;
}

function calculateWeightTrend(logs: DailyLog[]): "gaining" | "losing" | "stable" {
  const logsWithWeight = logs.filter((log) => log.weightKg).slice(0, 14);
  if (logsWithWeight.length < 3) return "stable";

  const recentAvg =
    logsWithWeight.slice(0, 3).reduce((sum, log) => sum + log.weightKg!, 0) / 3;
  const olderAvg =
    logsWithWeight
      .slice(-3)
      .reduce((sum, log) => sum + log.weightKg!, 0) /
    Math.min(3, logsWithWeight.length);

  const diff = recentAvg - olderAvg;

  if (diff > 0.3) return "gaining";
  if (diff < -0.3) return "losing";
  return "stable";
}

function calculateCalorieAdherence(
  logs: DailyLog[],
  targetCalories: number
): number {
  const logsWithCalories = logs.filter((log) => log.caloriesConsumed);
  if (logsWithCalories.length === 0) return 0;

  const withinRange = logsWithCalories.filter((log) => {
    const diff = Math.abs((log.caloriesConsumed || 0) - targetCalories);
    return diff <= targetCalories * 0.1; // Within 10%
  });

  return (withinRange.length / logsWithCalories.length) * 100;
}

export async function evaluatePhaseTransition(
  userId: string
): Promise<PhaseEvaluation> {
  const profile = await storage.getProfile(userId);
  if (!profile) {
    throw new Error("Profile not found");
  }

  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const logs = await storage.getDailyLogs(userId, startDate, endDate);

  const weeksInPhase = calculateWeeksInPhase(profile.phaseStartDate);
  const biofeedbackScore = calculateBiofeedbackScore(logs);
  const weightTrend = calculateWeightTrend(logs);
  const calorieAdherence = calculateCalorieAdherence(
    logs,
    profile.targetCalories || 2000
  );

  // Calculate averages
  const validLogs = logs.filter(
    (log) => log.energyLevel || log.sleepQuality || log.stressLevel || log.moodRating
  );
  const averageEnergy =
    validLogs.reduce((sum, log) => sum + (log.energyLevel || 0), 0) /
    (validLogs.filter((l) => l.energyLevel).length || 1);
  const averageSleep =
    validLogs.reduce((sum, log) => sum + (log.sleepQuality || 0), 0) /
    (validLogs.filter((l) => l.sleepQuality).length || 1);
  const averageStress =
    validLogs.reduce((sum, log) => sum + (log.stressLevel || 0), 0) /
    (validLogs.filter((l) => l.stressLevel).length || 1);
  const averageMood =
    validLogs.reduce((sum, log) => sum + (log.moodRating || 0), 0) /
    (validLogs.filter((l) => l.moodRating).length || 1);

  const metrics = {
    averageEnergy,
    averageSleep,
    averageStress,
    averageMood,
    weightTrend,
    calorieAdherence,
  };

  let readyForTransition = false;
  let suggestedPhase: string | null = null;
  let reason = "";

  const currentPhase = profile.currentPhase || "assessment";

  // Phase transition logic
  switch (currentPhase) {
    case "assessment":
      // Always ready to transition from assessment
      readyForTransition = true;
      suggestedPhase = "recovery";
      reason =
        "Complete your assessment to begin your journey with a metabolic recovery phase.";
      break;

    case "recovery":
      // Recovery → Recomp: After 8+ weeks with good biofeedback
      if (weeksInPhase >= 8 && biofeedbackScore >= 6.5) {
        readyForTransition = true;
        suggestedPhase = "recomp";
        reason = `After ${weeksInPhase} weeks in recovery with strong biofeedback (${biofeedbackScore.toFixed(1)}/10), you're metabolically healthy and ready for body recomposition.`;
      } else if (weeksInPhase >= 12) {
        readyForTransition = true;
        suggestedPhase = "recomp";
        reason = `You've been in recovery for ${weeksInPhase} weeks. Even with moderate biofeedback scores, it's time to try the next phase.`;
      } else if (weeksInPhase < 8) {
        reason = `Continue recovery for ${8 - weeksInPhase} more weeks to allow full metabolic adaptation.`;
      } else {
        reason = `Biofeedback score (${biofeedbackScore.toFixed(1)}/10) suggests continued recovery. Focus on sleep, stress management, and energy.`;
      }
      break;

    case "recomp":
      // Recomp → Cutting: After 12+ weeks if weight is above target
      if (
        weeksInPhase >= 12 &&
        profile.currentWeightKg &&
        profile.targetWeightKg &&
        profile.currentWeightKg > profile.targetWeightKg + 2
      ) {
        readyForTransition = true;
        suggestedPhase = "cutting";
        reason = `After ${weeksInPhase} weeks of recomposition, you may benefit from a focused fat loss phase to reach your target weight.`;
      } else if (weeksInPhase >= 16 && biofeedbackScore >= 7) {
        readyForTransition = true;
        suggestedPhase = "cutting";
        reason = `Strong biofeedback and ${weeksInPhase} weeks of recomp indicate readiness for a fat loss phase.`;
      } else if (weeksInPhase < 12) {
        reason = `Continue recomposition for ${12 - weeksInPhase} more weeks to build muscle and optimize metabolism.`;
      } else {
        reason =
          "Continue recomposition to build more metabolic capacity before entering a deficit.";
      }
      break;

    case "cutting":
      // Cutting → Recovery: After 8+ weeks or if biofeedback drops
      if (weeksInPhase >= 8 && biofeedbackScore < 5) {
        readyForTransition = true;
        suggestedPhase = "recovery";
        reason = `Biofeedback (${biofeedbackScore.toFixed(1)}/10) indicates fatigue after ${weeksInPhase} weeks of cutting. Time for a recovery phase.`;
      } else if (weeksInPhase >= 12) {
        readyForTransition = true;
        suggestedPhase = "recovery";
        reason = `${weeksInPhase} weeks is a good cutting duration. A recovery phase will help maintain progress and restore metabolic rate.`;
      } else if (averageStress > 7 && averageEnergy < 5) {
        readyForTransition = true;
        suggestedPhase = "recovery";
        reason =
          "High stress and low energy suggest metabolic adaptation. Consider transitioning to recovery.";
      } else {
        reason = `Continue your fat loss phase. ${Math.max(0, 8 - weeksInPhase)} to ${Math.max(0, 12 - weeksInPhase)} weeks remaining recommended.`;
      }
      break;
  }

  return {
    currentPhase,
    weeksInPhase,
    readyForTransition,
    suggestedPhase,
    reason,
    biofeedbackScore,
    metrics,
  };
}

export async function executePhaseTransition(
  userId: string,
  newPhase: string
): Promise<UserProfile> {
  const profile = await storage.getProfile(userId);
  if (!profile) {
    throw new Error("Profile not found");
  }

  const assessment = await storage.getOnboardingAssessment(userId);

  // Recalculate targets for new phase
  const targets = calculateTargets({
    age: profile.age || undefined,
    sex: profile.sex || undefined,
    heightCm: profile.heightCm || undefined,
    currentWeightKg: profile.currentWeightKg || undefined,
    activityLevel: assessment?.activityLevel || undefined,
    hasBeenDietingRecently: assessment?.hasBeenDietingRecently || undefined,
    dietingDurationMonths: assessment?.dietingDurationMonths || undefined,
    previousLowestCalories: assessment?.previousLowestCalories || undefined,
    doesResistanceTraining: assessment?.doesResistanceTraining || undefined,
    forcePhase: newPhase,
  });

  // Update profile with new phase and targets
  const updatedProfile = await storage.updateProfile(userId, {
    currentPhase: newPhase,
    phaseStartDate: format(new Date(), "yyyy-MM-dd"),
    targetCalories: targets.targetCalories,
    proteinGrams: targets.proteinGrams,
    carbsGrams: targets.carbsGrams,
    fatGrams: targets.fatGrams,
  });

  if (!updatedProfile) {
    throw new Error("Failed to update profile");
  }

  // Send notification about phase change
  const phaseNames: Record<string, string> = {
    recovery: "Metabolic Recovery",
    recomp: "Body Recomposition",
    cutting: "Fat Loss",
  };

  await notificationTemplates.phaseTransitionComplete(
    userId,
    phaseNames[newPhase] || newPhase
  );

  return updatedProfile;
}
