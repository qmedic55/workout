import type { DailyLog, ExerciseLog } from "@shared/schema";

// Muscle group mapping for exercises
const muscleGroupMap: Record<string, string[]> = {
  // Push movements
  "Bench Press": ["chest", "triceps", "shoulders"],
  "Dumbbell Bench Press": ["chest", "triceps", "shoulders"],
  "Incline Press": ["chest", "triceps", "shoulders"],
  "Overhead Press": ["shoulders", "triceps"],
  "Dumbbell Press": ["chest", "triceps"],
  "Push-ups": ["chest", "triceps"],
  "Dips": ["chest", "triceps"],
  "Tricep Extensions": ["triceps"],
  "Lateral Raises": ["shoulders"],

  // Pull movements
  "Rows": ["back", "biceps"],
  "Bent Over Rows": ["back", "biceps"],
  "Cable Rows": ["back", "biceps"],
  "Pull-ups": ["back", "biceps"],
  "Chin-ups": ["back", "biceps"],
  "Lat Pulldown": ["back", "biceps"],
  "Face Pulls": ["shoulders", "back"],
  "Bicep Curls": ["biceps"],

  // Legs
  "Squats": ["quads", "glutes"],
  "Goblet Squats": ["quads", "glutes"],
  "Leg Press": ["quads", "glutes"],
  "Deadlifts": ["hamstrings", "glutes", "back"],
  "Romanian Deadlifts": ["hamstrings", "glutes"],
  "RDLs": ["hamstrings", "glutes"],
  "Lunges": ["quads", "glutes"],
  "Split Squats": ["quads", "glutes"],
  "Leg Curls": ["hamstrings"],
  "Leg Extensions": ["quads"],
  "Calf Raises": ["calves"],
  "Hip Thrusts": ["glutes"],

  // Core
  "Planks": ["core"],
  "Dead Bug": ["core"],
  "Bird Dogs": ["core"],
  "Ab Wheel": ["core"],
  "Crunches": ["core"],
  "Russian Twists": ["core"],
  "Pallof Press": ["core"],

  // Compound / Full Body
  "Thrusters": ["quads", "shoulders", "core"],
  "Burpees": ["full body"],
  "Kettlebell Swings": ["hamstrings", "glutes", "back"],
};

// Get muscle groups for an exercise (fuzzy match)
function getMuscleGroups(exerciseName: string): string[] {
  // Direct match first
  if (muscleGroupMap[exerciseName]) {
    return muscleGroupMap[exerciseName];
  }

  // Fuzzy match - check if exercise name contains a known exercise
  const lowerName = exerciseName.toLowerCase();
  for (const [exercise, muscles] of Object.entries(muscleGroupMap)) {
    if (lowerName.includes(exercise.toLowerCase()) ||
        exercise.toLowerCase().includes(lowerName)) {
      return muscles;
    }
  }

  // Default to "other" if no match
  return ["other"];
}

// Parse weight from set details
function parseWeight(setDetails: any): number {
  if (!setDetails || !Array.isArray(setDetails)) return 0;

  let maxWeight = 0;
  for (const set of setDetails) {
    const weight = set.weightKg || set.weight || 0;
    if (weight > maxWeight) maxWeight = weight;
  }
  return maxWeight;
}

// Calculate total volume from a single exercise log
function calculateExerciseVolume(log: ExerciseLog): number {
  if (!log.setDetails || !Array.isArray(log.setDetails)) {
    // Estimate from prescribed if no actual data
    const reps = parseInt(String(log.prescribedReps || "10").split("-")[0]) || 10;
    return (log.completedSets || 0) * reps;
  }

  let volume = 0;
  for (const set of log.setDetails as any[]) {
    const reps = set.reps || 0;
    const weight = set.weightKg || set.weight || 1; // Default to 1 for bodyweight
    volume += reps * weight;
  }
  return volume;
}

export interface WorkoutSummary {
  totalWorkouts: number;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  averageWorkoutsPerWeek: number;
  favoriteWorkoutType: string;
  totalVolumeKg: number;
}

export interface WeeklyTrend {
  week: string;
  weekLabel: string;
  workoutCount: number;
  totalVolume: number;
  avgDuration: number;
}

export interface MuscleGroupData {
  muscleGroup: string;
  workouts: number;
  lastTrained: string | null;
  daysSinceLastTrained: number | null;
}

export interface ExerciseProgressData {
  exerciseName: string;
  bestWeight: number;
  bestReps: number;
  totalSets: number;
  recentPerformance: {
    date: string;
    weight: number;
    reps: number;
  }[];
  trend: "improving" | "maintaining" | "declining";
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
}

export interface WorkoutAnalytics {
  summary: WorkoutSummary;
  weeklyTrends: WeeklyTrend[];
  muscleGroupFrequency: MuscleGroupData[];
  exerciseProgress: ExerciseProgressData[];
  streaks: StreakData;
}

// Get ISO week string (e.g., "2025-W51")
function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

// Get human-readable week label
function getWeekLabel(weekStr: string): string {
  const [year, weekPart] = weekStr.split("-W");
  const weekNum = parseInt(weekPart);
  return `Week ${weekNum}`;
}

export function calculateWorkoutSummary(
  dailyLogs: DailyLog[],
  exerciseLogs: ExerciseLog[]
): WorkoutSummary {
  const workoutDays = dailyLogs.filter(log => log.workoutCompleted);
  const totalWorkouts = workoutDays.length;

  // Calculate weeks for average
  if (dailyLogs.length === 0) {
    return {
      totalWorkouts: 0,
      workoutsThisWeek: 0,
      workoutsThisMonth: 0,
      averageWorkoutsPerWeek: 0,
      favoriteWorkoutType: "none",
      totalVolumeKg: 0,
    };
  }

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const workoutsThisWeek = workoutDays.filter(log => {
    const logDate = new Date(log.logDate);
    return logDate >= weekStart;
  }).length;

  const workoutsThisMonth = workoutDays.filter(log => {
    const logDate = new Date(log.logDate);
    return logDate >= monthStart;
  }).length;

  // Calculate weeks span
  const dates = dailyLogs.map(l => new Date(l.logDate).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const weeksSpan = Math.max(1, Math.ceil((maxDate - minDate) / (7 * 24 * 60 * 60 * 1000)));
  const averageWorkoutsPerWeek = Math.round((totalWorkouts / weeksSpan) * 10) / 10;

  // Find favorite workout type
  const typeCounts: Record<string, number> = {};
  for (const log of workoutDays) {
    const type = log.workoutType || "strength";
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }
  const favoriteWorkoutType = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || "none";

  // Calculate total volume
  let totalVolumeKg = 0;
  for (const log of exerciseLogs) {
    totalVolumeKg += calculateExerciseVolume(log);
  }

  return {
    totalWorkouts,
    workoutsThisWeek,
    workoutsThisMonth,
    averageWorkoutsPerWeek,
    favoriteWorkoutType,
    totalVolumeKg: Math.round(totalVolumeKg),
  };
}

export function calculateWeeklyTrends(
  dailyLogs: DailyLog[],
  exerciseLogs: ExerciseLog[],
  weeks: number = 8
): WeeklyTrend[] {
  const now = new Date();
  const trends: Map<string, WeeklyTrend> = new Map();

  // Initialize last N weeks
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - (i * 7));
    const weekStr = getISOWeek(d);
    trends.set(weekStr, {
      week: weekStr,
      weekLabel: getWeekLabel(weekStr),
      workoutCount: 0,
      totalVolume: 0,
      avgDuration: 0,
    });
  }

  // Group exercise logs by week
  const exercisesByWeek: Map<string, ExerciseLog[]> = new Map();
  for (const log of exerciseLogs) {
    const weekStr = getISOWeek(new Date(log.logDate));
    if (!exercisesByWeek.has(weekStr)) {
      exercisesByWeek.set(weekStr, []);
    }
    exercisesByWeek.get(weekStr)!.push(log);
  }

  // Count workouts and volume per week
  const workoutDays = dailyLogs.filter(log => log.workoutCompleted);
  const durationsByWeek: Map<string, number[]> = new Map();

  for (const log of workoutDays) {
    const weekStr = getISOWeek(new Date(log.logDate));
    if (trends.has(weekStr)) {
      const trend = trends.get(weekStr)!;
      trend.workoutCount++;

      if (log.workoutDurationMinutes) {
        if (!durationsByWeek.has(weekStr)) {
          durationsByWeek.set(weekStr, []);
        }
        durationsByWeek.get(weekStr)!.push(log.workoutDurationMinutes);
      }
    }
  }

  // Calculate volume per week
  exercisesByWeek.forEach((logs, weekStr) => {
    if (trends.has(weekStr)) {
      const trend = trends.get(weekStr)!;
      trend.totalVolume = logs.reduce((sum: number, log: ExerciseLog) => sum + calculateExerciseVolume(log), 0);
    }
  });

  // Calculate average durations
  durationsByWeek.forEach((durations, weekStr) => {
    if (trends.has(weekStr) && durations.length > 0) {
      trends.get(weekStr)!.avgDuration = Math.round(
        durations.reduce((a: number, b: number) => a + b, 0) / durations.length
      );
    }
  });

  return Array.from(trends.values());
}

export function calculateMuscleGroupFrequency(
  exerciseLogs: ExerciseLog[]
): MuscleGroupData[] {
  const muscleData: Map<string, { count: number; lastDate: Date | null }> = new Map();
  const now = new Date();

  for (const log of exerciseLogs) {
    const muscles = getMuscleGroups(log.exerciseName);
    const logDate = new Date(log.logDate);

    for (const muscle of muscles) {
      const existing = muscleData.get(muscle);
      if (!existing) {
        muscleData.set(muscle, { count: 1, lastDate: logDate });
      } else {
        existing.count++;
        if (!existing.lastDate || logDate > existing.lastDate) {
          existing.lastDate = logDate;
        }
      }
    }
  }

  return Array.from(muscleData.entries())
    .map(([muscleGroup, data]) => ({
      muscleGroup,
      workouts: data.count,
      lastTrained: data.lastDate?.toISOString().split("T")[0] || null,
      daysSinceLastTrained: data.lastDate
        ? Math.floor((now.getTime() - data.lastDate.getTime()) / (1000 * 60 * 60 * 24))
        : null,
    }))
    .sort((a, b) => b.workouts - a.workouts);
}

export function calculateExerciseProgress(
  exerciseLogs: ExerciseLog[]
): ExerciseProgressData[] {
  // Group by exercise name
  const byExercise: Map<string, ExerciseLog[]> = new Map();

  for (const log of exerciseLogs) {
    if (!byExercise.has(log.exerciseName)) {
      byExercise.set(log.exerciseName, []);
    }
    byExercise.get(log.exerciseName)!.push(log);
  }

  const progressData: ExerciseProgressData[] = [];

  byExercise.forEach((logs, exerciseName) => {
    // Sort by date
    logs.sort((a: ExerciseLog, b: ExerciseLog) => new Date(a.logDate).getTime() - new Date(b.logDate).getTime());

    let bestWeight = 0;
    let bestReps = 0;
    let totalSets = 0;
    const performances: { date: string; weight: number; reps: number }[] = [];

    for (const log of logs) {
      totalSets += log.completedSets || 0;

      if (log.setDetails && Array.isArray(log.setDetails)) {
        for (const set of log.setDetails as any[]) {
          const weight = set.weightKg || set.weight || 0;
          const reps = set.reps || 0;

          if (weight > bestWeight) bestWeight = weight;
          if (reps > bestReps) bestReps = reps;
        }

        // Get best set for this workout
        const bestSet = (log.setDetails as any[]).reduce((best, set) => {
          const weight = set.weightKg || set.weight || 0;
          return weight > (best?.weightKg || best?.weight || 0) ? set : best;
        }, null);

        if (bestSet) {
          performances.push({
            date: log.logDate,
            weight: bestSet.weightKg || bestSet.weight || 0,
            reps: bestSet.reps || 0,
          });
        }
      }
    }

    // Determine trend (compare last 3 vs previous 3)
    let trend: "improving" | "maintaining" | "declining" = "maintaining";
    if (performances.length >= 6) {
      const recent3 = performances.slice(-3);
      const previous3 = performances.slice(-6, -3);

      const recentAvgWeight = recent3.reduce((s, p) => s + p.weight, 0) / 3;
      const previousAvgWeight = previous3.reduce((s, p) => s + p.weight, 0) / 3;

      const diff = (recentAvgWeight - previousAvgWeight) / previousAvgWeight;
      if (diff > 0.05) trend = "improving";
      else if (diff < -0.05) trend = "declining";
    }

    // Only include exercises with at least 2 logged sessions
    if (logs.length >= 2) {
      progressData.push({
        exerciseName,
        bestWeight: Math.round(bestWeight * 10) / 10,
        bestReps,
        totalSets,
        recentPerformance: performances.slice(-5), // Last 5 performances
        trend,
      });
    }
  });

  // Sort by total sets (most trained exercises first)
  return progressData.sort((a, b) => b.totalSets - a.totalSets).slice(0, 10);
}

export function calculateStreaks(dailyLogs: DailyLog[]): StreakData {
  if (dailyLogs.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null };
  }

  // Sort by date descending
  const sorted = [...dailyLogs]
    .filter(log => log.workoutCompleted)
    .sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime());

  if (sorted.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null };
  }

  const lastWorkoutDate = sorted[0].logDate;

  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let checkDate = new Date(today);
  for (const log of sorted) {
    const logDate = new Date(log.logDate);
    logDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((checkDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      currentStreak++;
      checkDate = logDate;
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  // Sort ascending for longest streak calculation
  const ascending = [...sorted].reverse();

  for (const log of ascending) {
    const logDate = new Date(log.logDate);
    logDate.setHours(0, 0, 0, 0);

    if (prevDate === null) {
      tempStreak = 1;
    } else {
      const diffDays = Math.floor((logDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    prevDate = logDate;
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return {
    currentStreak,
    longestStreak,
    lastWorkoutDate,
  };
}

export function generateWorkoutAnalytics(
  dailyLogs: DailyLog[],
  exerciseLogs: ExerciseLog[]
): WorkoutAnalytics {
  return {
    summary: calculateWorkoutSummary(dailyLogs, exerciseLogs),
    weeklyTrends: calculateWeeklyTrends(dailyLogs, exerciseLogs),
    muscleGroupFrequency: calculateMuscleGroupFrequency(exerciseLogs),
    exerciseProgress: calculateExerciseProgress(exerciseLogs),
    streaks: calculateStreaks(dailyLogs),
  };
}
