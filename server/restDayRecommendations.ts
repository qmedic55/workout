import type { DailyLog, ExerciseLog, UserProfile } from "@shared/schema";

export interface RestDayRecommendation {
  shouldRest: boolean;
  confidence: "high" | "medium" | "low";
  reasons: string[];
  suggestedRestType: "complete" | "active_recovery" | "deload" | "normal_training";
  alternativeActivity: string | null;
  todaysPlan: string;
  metrics: {
    consecutiveWorkoutDays: number;
    recoveryScore: number;
    avgEnergyLast3Days: number | null;
    avgSleepQualityLast3Days: number | null;
    avgStressLast3Days: number | null;
    weeklyVolumeVsBaseline: number | null;
  };
}

interface RecoveryFactors {
  consecutiveWorkouts: number;
  recoveryScore: number;
  energyTrend: "declining" | "stable" | "improving";
  sleepTrend: "declining" | "stable" | "improving";
  stressTrend: "high" | "moderate" | "low";
  volumeRatio: number | null;
}

// Calculate trend from array of values (most recent first)
function calculateTrend(values: (number | null)[]): "declining" | "stable" | "improving" {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length < 2) return "stable";

  // Compare recent (first half) vs older (second half)
  const midpoint = Math.floor(valid.length / 2);
  const recentAvg = valid.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint;
  const olderAvg = valid.slice(midpoint).reduce((a, b) => a + b, 0) / (valid.length - midpoint);

  const diff = recentAvg - olderAvg;
  if (diff < -1) return "declining";
  if (diff > 1) return "improving";
  return "stable";
}

// Calculate recovery score (similar to existing endpoint but encapsulated)
function calculateRecoveryScore(
  recentLogs: DailyLog[],
  consecutiveWorkoutDays: number
): number {
  const today = recentLogs[0];
  const yesterday = recentLogs[1];

  const sleepScore = yesterday?.sleepHours
    ? Math.min(100, (yesterday.sleepHours / 8) * 100)
    : 70;
  const sleepQualityScore = yesterday?.sleepQuality
    ? yesterday.sleepQuality * 10
    : 60;
  const energyScore = today?.energyLevel
    ? today.energyLevel * 10
    : 60;
  const stressScore = today?.stressLevel
    ? (11 - today.stressLevel) * 10
    : 60;

  const workoutFatigue = Math.max(0, (consecutiveWorkoutDays - 1) * 10);

  const rawScore = (
    sleepScore * 0.3 +
    sleepQualityScore * 0.2 +
    energyScore * 0.25 +
    stressScore * 0.25
  ) - workoutFatigue;

  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

// Calculate weekly volume ratio compared to baseline
function calculateVolumeRatio(
  exerciseLogs: ExerciseLog[]
): number | null {
  if (exerciseLogs.length < 14) return null; // Need at least 2 weeks of data

  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const fourWeeksAgo = new Date(now);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  // This week's logs
  const thisWeekLogs = exerciseLogs.filter(log => {
    const logDate = new Date(log.logDate);
    return logDate >= oneWeekAgo;
  });

  // Baseline (2-4 weeks ago)
  const baselineLogs = exerciseLogs.filter(log => {
    const logDate = new Date(log.logDate);
    return logDate >= fourWeeksAgo && logDate < twoWeeksAgo;
  });

  if (baselineLogs.length === 0) return null;

  // Calculate volume (sets × estimated reps)
  const calculateVolume = (logs: ExerciseLog[]) => {
    return logs.reduce((total, log) => {
      const sets = log.completedSets || 0;
      const reps = parseInt(String(log.prescribedReps || "10").split("-")[0]) || 10;
      return total + (sets * reps);
    }, 0);
  };

  const thisWeekVolume = calculateVolume(thisWeekLogs);
  const baselineVolume = calculateVolume(baselineLogs) / 2; // Divide by 2 since it's 2 weeks

  if (baselineVolume === 0) return null;

  return thisWeekVolume / baselineVolume;
}

// Get consecutive workout days
function getConsecutiveWorkoutDays(dailyLogs: DailyLog[]): number {
  if (dailyLogs.length === 0) return 0;

  // Sort by date descending (most recent first)
  const sorted = [...dailyLogs].sort(
    (a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime()
  );

  let consecutive = 0;
  let lastDate: Date | null = null;

  for (const log of sorted) {
    if (!log.workoutCompleted) continue;

    const logDate = new Date(log.logDate);
    logDate.setHours(0, 0, 0, 0);

    if (lastDate === null) {
      // First workout found
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffFromToday = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

      // Only count if the workout was today or yesterday (streak is current)
      if (diffFromToday <= 1) {
        consecutive = 1;
        lastDate = logDate;
      } else {
        break;
      }
    } else {
      const diff = Math.floor((lastDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        consecutive++;
        lastDate = logDate;
      } else {
        break;
      }
    }
  }

  return consecutive;
}

// Calculate average of last N days for a metric
function getAverage(logs: DailyLog[], field: keyof DailyLog, days: number): number | null {
  const recent = logs.slice(0, days);
  const values = recent.map(log => log[field] as number | null).filter((v): v is number => v !== null);
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Determine stress level category
function getStressTrend(logs: DailyLog[]): "high" | "moderate" | "low" {
  const recent3 = logs.slice(0, 3);
  const stressValues = recent3
    .map(log => log.stressLevel)
    .filter((v): v is number => v !== null);

  if (stressValues.length === 0) return "moderate";

  const avgStress = stressValues.reduce((a, b) => a + b, 0) / stressValues.length;

  if (avgStress >= 7) return "high";
  if (avgStress >= 4) return "moderate";
  return "low";
}

// Alternative activities based on rest type
const alternativeActivities: Record<string, string> = {
  complete: "Complete rest - focus on sleep, hydration, and nutrition",
  active_recovery: "Light stretching, yoga, or a 20-minute walk",
  deload: "Reduce weights by 40-50% and focus on form and movement quality",
  normal_training: null as any,
};

// Generate personalized plan message
function generateTodaysPlan(
  shouldRest: boolean,
  restType: string,
  reasons: string[],
  profile?: UserProfile
): string {
  if (!shouldRest) {
    const phase = profile?.currentPhase || "recovery";
    switch (phase) {
      case "cutting":
        return "You're recovered and ready for training. Focus on maintaining strength during your cut.";
      case "recomp":
        return "Good recovery status! Push your workout today to build muscle and burn fat.";
      default:
        return "You're ready for a productive workout today. Focus on progressive overload within your capacity.";
    }
  }

  switch (restType) {
    case "complete":
      return "Your body needs complete rest today. Muscles grow during recovery, not during training. Take the day off!";
    case "active_recovery":
      return "Light movement will help you recover faster. Skip the weights and focus on mobility work.";
    case "deload":
      return "Time for a deload session. Reduce intensity to let your nervous system recover while maintaining movement patterns.";
    default:
      return "Consider taking it easy today based on your recovery metrics.";
  }
}

export function calculateRestDayRecommendation(
  recentLogs: DailyLog[],
  exerciseLogs: ExerciseLog[],
  profile?: UserProfile
): RestDayRecommendation {
  const reasons: string[] = [];
  let shouldRest = false;
  let restType: "complete" | "active_recovery" | "deload" | "normal_training" = "normal_training";
  let confidence: "high" | "medium" | "low" = "low";

  // Calculate all factors
  const consecutiveWorkoutDays = getConsecutiveWorkoutDays(recentLogs);
  const recoveryScore = calculateRecoveryScore(recentLogs, consecutiveWorkoutDays);

  const energyValues = recentLogs.slice(0, 5).map(l => l.energyLevel);
  const sleepQualityValues = recentLogs.slice(0, 5).map(l => l.sleepQuality);
  const energyTrend = calculateTrend(energyValues);
  const sleepTrend = calculateTrend(sleepQualityValues);
  const stressTrend = getStressTrend(recentLogs);
  const volumeRatio = calculateVolumeRatio(exerciseLogs);

  // Decision logic based on the plan

  // Rule 1: 5+ consecutive workout days → Complete rest (HIGH confidence)
  if (consecutiveWorkoutDays >= 5) {
    shouldRest = true;
    restType = "complete";
    confidence = "high";
    reasons.push(`You've worked out ${consecutiveWorkoutDays} consecutive days - your body needs full rest`);
  }
  // Rule 2: Recovery score < 40 → Active recovery (HIGH confidence)
  else if (recoveryScore < 40) {
    shouldRest = true;
    restType = "active_recovery";
    confidence = "high";
    reasons.push(`Your recovery score is low (${recoveryScore}/100)`);
  }
  // Rule 3: Energy AND sleep declining for 3+ days → Active recovery (MEDIUM confidence)
  else if (energyTrend === "declining" && sleepTrend === "declining") {
    shouldRest = true;
    restType = "active_recovery";
    confidence = "medium";
    reasons.push("Both energy and sleep quality have been declining");
  }
  // Rule 4: Weekly volume > 120% of baseline → Deload (MEDIUM confidence)
  else if (volumeRatio !== null && volumeRatio > 1.2) {
    shouldRest = true;
    restType = "deload";
    confidence = "medium";
    reasons.push(`Training volume is ${Math.round(volumeRatio * 100)}% of your baseline - time to deload`);
  }
  // Rule 5: High stress for 2+ days → Active recovery (MEDIUM confidence)
  else if (stressTrend === "high") {
    shouldRest = true;
    restType = "active_recovery";
    confidence = "medium";
    reasons.push("Elevated stress levels detected over the past few days");
  }
  // Rule 6: 4 consecutive workout days → Consider rest (LOW confidence)
  else if (consecutiveWorkoutDays >= 4) {
    shouldRest = true;
    restType = "active_recovery";
    confidence = "low";
    reasons.push(`You've worked out ${consecutiveWorkoutDays} days in a row - consider active recovery`);
  }
  // Rule 7: Recovery score 40-60 → Suggestion only (LOW confidence)
  else if (recoveryScore < 60) {
    shouldRest = false;
    confidence = "low";
    reasons.push(`Recovery score is moderate (${recoveryScore}/100) - listen to your body`);
  }

  // Add supporting reasons
  if (shouldRest && recoveryScore < 60 && !reasons.some(r => r.includes("recovery score"))) {
    reasons.push(`Recovery score is ${recoveryScore}/100`);
  }
  if (shouldRest && energyTrend === "declining" && !reasons.some(r => r.includes("energy"))) {
    reasons.push("Energy levels have been declining");
  }
  if (shouldRest && sleepTrend === "declining" && !reasons.some(r => r.includes("sleep"))) {
    reasons.push("Sleep quality has been declining");
  }

  // Calculate metrics for display
  const avgEnergyLast3Days = getAverage(recentLogs, "energyLevel", 3);
  const avgSleepQualityLast3Days = getAverage(recentLogs, "sleepQuality", 3);
  const avgStressLast3Days = getAverage(recentLogs, "stressLevel", 3);

  return {
    shouldRest,
    confidence,
    reasons,
    suggestedRestType: restType,
    alternativeActivity: shouldRest ? alternativeActivities[restType] : null,
    todaysPlan: generateTodaysPlan(shouldRest, restType, reasons, profile),
    metrics: {
      consecutiveWorkoutDays,
      recoveryScore,
      avgEnergyLast3Days: avgEnergyLast3Days !== null ? Math.round(avgEnergyLast3Days * 10) / 10 : null,
      avgSleepQualityLast3Days: avgSleepQualityLast3Days !== null ? Math.round(avgSleepQualityLast3Days * 10) / 10 : null,
      avgStressLast3Days: avgStressLast3Days !== null ? Math.round(avgStressLast3Days * 10) / 10 : null,
      weeklyVolumeVsBaseline: volumeRatio !== null ? Math.round(volumeRatio * 100) / 100 : null,
    },
  };
}
