import { storage } from "./storage";
import type { DailyLog, UserProfile } from "@shared/schema";

export interface HealthInsight {
  id: string;
  type: "warning" | "positive" | "suggestion";
  category: "sleep" | "nutrition" | "stress" | "training" | "hydration" | "phase" | "weight";
  title: string;
  message: string;
  actionUrl?: string;
  priority: number; // 1-5, higher = more important
}

interface InsightContext {
  logs: DailyLog[];
  profile: UserProfile;
  today: DailyLog | undefined;
  averages: {
    sleepHours: number;
    sleepQuality: number;
    energyLevel: number;
    stressLevel: number;
    calories: number;
    protein: number;
    steps: number;
    waterLiters: number;
  };
}

function calculateAverages(logs: DailyLog[]): InsightContext["averages"] {
  const validLogs = logs.filter((log) => log.sleepHours || log.caloriesConsumed);
  const count = validLogs.length || 1;

  return {
    sleepHours: validLogs.reduce((sum, log) => sum + (log.sleepHours || 0), 0) / count,
    sleepQuality: validLogs.reduce((sum, log) => sum + (log.sleepQuality || 0), 0) / count,
    energyLevel: validLogs.reduce((sum, log) => sum + (log.energyLevel || 0), 0) / count,
    stressLevel: validLogs.reduce((sum, log) => sum + (log.stressLevel || 0), 0) / count,
    calories: validLogs.reduce((sum, log) => sum + (log.caloriesConsumed || 0), 0) / count,
    protein: validLogs.reduce((sum, log) => sum + (log.proteinGrams || 0), 0) / count,
    steps: validLogs.reduce((sum, log) => sum + (log.steps || 0), 0) / count,
    waterLiters: validLogs.reduce((sum, log) => sum + (log.waterLiters || 0), 0) / count,
  };
}

function generateId(): string {
  return `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Insight generators
function checkSleepPerformance(ctx: InsightContext): HealthInsight | null {
  const { logs, today } = ctx;

  // Check yesterday's sleep vs today's energy
  if (logs.length < 2) return null;

  const yesterday = logs[1];
  const todayEnergy = today?.energyLevel;
  const yesterdaySleep = yesterday?.sleepHours;

  if (!yesterdaySleep || !todayEnergy) return null;

  if (yesterdaySleep < 6 && todayEnergy <= 5) {
    return {
      id: generateId(),
      type: "warning",
      category: "sleep",
      title: "Sleep Affecting Energy",
      message: `Your energy dipped to ${todayEnergy}/10 after only ${yesterdaySleep.toFixed(1)} hours of sleep. Aim for 7+ hours tonight for better recovery.`,
      actionUrl: "/daily-log",
      priority: 4,
    };
  }

  if (yesterdaySleep >= 7 && todayEnergy >= 7) {
    return {
      id: generateId(),
      type: "positive",
      category: "sleep",
      title: "Great Sleep-Energy Connection",
      message: `${yesterdaySleep.toFixed(1)} hours of sleep led to solid energy levels today. Keep up the consistent sleep schedule!`,
      priority: 2,
    };
  }

  return null;
}

function checkNutritionRecovery(ctx: InsightContext): HealthInsight | null {
  const { logs, profile, today } = ctx;

  if (!today?.proteinGrams || !today?.sleepHours) return null;

  const targetProtein = profile.proteinGrams || 120;
  const proteinPercentage = (today.proteinGrams / targetProtein) * 100;

  if (proteinPercentage >= 90 && today.sleepHours >= 7) {
    return {
      id: generateId(),
      type: "positive",
      category: "nutrition",
      title: "Optimal Recovery Conditions",
      message: `Great protein intake (${Math.round(today.proteinGrams)}g) combined with ${today.sleepHours.toFixed(1)} hours sleep - optimal for muscle recovery!`,
      priority: 2,
    };
  }

  if (proteinPercentage < 70 && today.workoutCompleted) {
    return {
      id: generateId(),
      type: "suggestion",
      category: "nutrition",
      title: "Boost Protein for Recovery",
      message: `You worked out today but protein is at ${Math.round(today.proteinGrams)}g (${Math.round(proteinPercentage)}% of target). Consider a protein-rich snack to support recovery.`,
      actionUrl: "/nutrition",
      priority: 3,
    };
  }

  return null;
}

function checkStressLevels(ctx: InsightContext): HealthInsight | null {
  const { logs } = ctx;

  // Check for 3+ consecutive days of high stress
  const recentLogs = logs.slice(0, 5).filter((log) => log.stressLevel);
  const highStressDays = recentLogs.filter((log) => (log.stressLevel || 0) >= 7).length;

  if (highStressDays >= 3) {
    return {
      id: generateId(),
      type: "warning",
      category: "stress",
      title: "Elevated Stress Pattern",
      message: `Elevated stress for ${highStressDays} days can raise cortisol levels, affecting recovery and fat storage. Consider a recovery day, meditation, or reducing workout intensity.`,
      actionUrl: "/chat",
      priority: 5,
    };
  }

  // Improving stress trend
  if (recentLogs.length >= 3) {
    const recent = recentLogs.slice(0, 2).reduce((sum, log) => sum + (log.stressLevel || 0), 0) / 2;
    const older = recentLogs.slice(2, 4).reduce((sum, log) => sum + (log.stressLevel || 0), 0) / Math.min(2, recentLogs.length - 2);

    if (recent < older - 2 && recent <= 4) {
      return {
        id: generateId(),
        type: "positive",
        category: "stress",
        title: "Stress Levels Improving",
        message: "Your stress levels have been trending down. Whatever you're doing for stress management is working!",
        priority: 2,
      };
    }
  }

  return null;
}

function checkCalorieDeficit(ctx: InsightContext): HealthInsight | null {
  const { logs, profile } = ctx;

  const targetCalories = profile.targetCalories;
  if (!targetCalories) return null;

  const recentLogs = logs.slice(0, 7).filter((log) => log.caloriesConsumed);
  const deficitDays = recentLogs.filter((log) => (log.caloriesConsumed || 0) < targetCalories * 0.8).length;

  if (deficitDays >= 5) {
    return {
      id: generateId(),
      type: "warning",
      category: "nutrition",
      title: "Extended Calorie Deficit",
      message: `You've been under your calorie target for ${deficitDays} days. Extended deficits can slow metabolism and increase cortisol. Consider a maintenance or refeed day.`,
      actionUrl: "/nutrition",
      priority: 4,
    };
  }

  return null;
}

function checkHydration(ctx: InsightContext): HealthInsight | null {
  const { today } = ctx;

  if (!today?.waterLiters) return null;

  const steps = today.steps || 0;
  const water = today.waterLiters;

  // High activity + low water
  if (steps > 10000 && water < 2) {
    return {
      id: generateId(),
      type: "suggestion",
      category: "hydration",
      title: "Hydration Check",
      message: `You walked ${steps.toLocaleString()} steps but only logged ${water.toFixed(1)}L of water. Hydration affects recovery and energy levels!`,
      actionUrl: "/daily-log",
      priority: 3,
    };
  }

  // Good hydration
  if (water >= 2.5) {
    return {
      id: generateId(),
      type: "positive",
      category: "hydration",
      title: "Great Hydration",
      message: `${water.toFixed(1)}L of water today - excellent! Proper hydration supports metabolism and recovery.`,
      priority: 1,
    };
  }

  return null;
}

function checkTrainingRecovery(ctx: InsightContext): HealthInsight | null {
  const { logs } = ctx;

  if (logs.length < 2) return null;

  const yesterday = logs[1];
  const today = logs[0];

  // Workout yesterday + poor sleep last night
  if (yesterday?.workoutCompleted && today?.sleepHours && today.sleepHours < 6) {
    return {
      id: generateId(),
      type: "warning",
      category: "training",
      title: "Recovery Sleep Needed",
      message: `After yesterday's workout, you only got ${today.sleepHours.toFixed(1)} hours sleep. Rest is when muscles repair - prioritize sleep tonight!`,
      priority: 4,
    };
  }

  // Multiple consecutive workout days
  const consecutiveWorkouts = logs.slice(0, 4).filter((log) => log.workoutCompleted).length;
  if (consecutiveWorkouts >= 4) {
    return {
      id: generateId(),
      type: "suggestion",
      category: "training",
      title: "Consider Rest Day",
      message: "You've worked out 4+ days in a row. Recovery days are essential for muscle growth and preventing overtraining.",
      priority: 3,
    };
  }

  return null;
}

function checkWeightTrends(ctx: InsightContext): HealthInsight | null {
  const { logs, profile } = ctx;

  const logsWithWeight = logs.filter((log) => log.weightKg).slice(0, 7);
  if (logsWithWeight.length < 3) return null;

  const recentWeight = logsWithWeight[0].weightKg!;
  const olderWeight = logsWithWeight[logsWithWeight.length - 1].weightKg!;
  const weightChange = recentWeight - olderWeight;

  const targetCalories = profile.targetCalories;
  const maintenanceCalories = profile.maintenanceCalories;
  const isInDeficit = targetCalories && maintenanceCalories && targetCalories < maintenanceCalories;

  // Weight up despite deficit
  if (isInDeficit && weightChange > 0.5) {
    return {
      id: generateId(),
      type: "suggestion",
      category: "weight",
      title: "Weight Fluctuation",
      message: `Weight up ${weightChange.toFixed(1)}kg despite calorie deficit - likely water retention. Check sodium intake, stress levels, and sleep quality. This is normal and temporary.`,
      priority: 3,
    };
  }

  // Good progress
  if (profile.currentPhase === "cutting" && weightChange < -0.3) {
    return {
      id: generateId(),
      type: "positive",
      category: "weight",
      title: "On Track",
      message: `Down ${Math.abs(weightChange).toFixed(1)}kg this week - sustainable fat loss pace! Keep up the consistency.`,
      priority: 2,
    };
  }

  return null;
}

function checkPhaseProgress(ctx: InsightContext): HealthInsight | null {
  const { logs, profile, averages } = ctx;

  const phase = profile.currentPhase;

  // Recovery phase: Check if ready to progress
  if (phase === "recovery") {
    const goodEnergy = averages.energyLevel >= 6;
    const goodSleep = averages.sleepQuality >= 6;
    const lowStress = averages.stressLevel <= 5;

    if (goodEnergy && goodSleep && lowStress) {
      return {
        id: generateId(),
        type: "positive",
        category: "phase",
        title: "Recovery Going Well",
        message: "Energy, sleep, and stress metrics are all trending positively! You may be approaching readiness for the next phase.",
        actionUrl: "/chat",
        priority: 3,
      };
    }
  }

  // Check biofeedback decline during cutting
  if (phase === "cutting") {
    const lowEnergy = averages.energyLevel < 5;
    const poorSleep = averages.sleepQuality < 5;
    const highStress = averages.stressLevel > 7;

    if ((lowEnergy && poorSleep) || (lowEnergy && highStress)) {
      return {
        id: generateId(),
        type: "warning",
        category: "phase",
        title: "Biofeedback Alert",
        message: "Energy and sleep/stress metrics are declining. Consider a diet break or transitioning to maintenance to prevent metabolic adaptation.",
        actionUrl: "/chat",
        priority: 5,
      };
    }
  }

  return null;
}

export async function generateInsights(userId: string): Promise<HealthInsight[]> {
  // Get user profile
  const profile = await storage.getProfile(userId);
  if (!profile) {
    return [];
  }

  // Get last 14 days of logs
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const logs = await storage.getDailyLogs(userId, startDate, endDate);

  if (logs.length === 0) {
    return [
      {
        id: generateId(),
        type: "suggestion",
        category: "nutrition",
        title: "Start Logging",
        message: "Start logging your daily data to receive personalized health insights based on your patterns.",
        actionUrl: "/daily-log",
        priority: 5,
      },
    ];
  }

  const today = logs[0];
  const averages = calculateAverages(logs);

  const ctx: InsightContext = {
    logs,
    profile,
    today,
    averages,
  };

  // Run all insight generators
  const generators = [
    checkSleepPerformance,
    checkNutritionRecovery,
    checkStressLevels,
    checkCalorieDeficit,
    checkHydration,
    checkTrainingRecovery,
    checkWeightTrends,
    checkPhaseProgress,
  ];

  const insights: HealthInsight[] = [];

  for (const generator of generators) {
    const insight = generator(ctx);
    if (insight) {
      insights.push(insight);
    }
  }

  // Sort by priority (highest first) and return top 5
  return insights.sort((a, b) => b.priority - a.priority).slice(0, 5);
}
