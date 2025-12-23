/**
 * Points Service - Gamification point calculation and awarding logic
 *
 * Point values and streak multipliers for the VitalPath gamification system.
 */

import { storage } from "./storage";
import type { UserPoints, InsertPointTransaction } from "@shared/schema";

// Point values for different actions
export const POINT_VALUES = {
  // Food logging - base points per food entry
  FOOD_LOG: 10,

  // Workout points
  WORKOUT_BASE: 50,
  WORKOUT_PER_MINUTE: 1, // Extra per minute over 15 min
  WORKOUT_MAX_DURATION_BONUS: 30, // Cap at 30 extra points

  // Biofeedback logging
  BIOFEEDBACK_SLEEP: 15,
  BIOFEEDBACK_ENERGY: 10,
  BIOFEEDBACK_STRESS: 10,
  BIOFEEDBACK_MOOD: 10,
  BIOFEEDBACK_WEIGHT: 20,

  // Steps milestones
  STEPS_2K: 10,
  STEPS_5K: 20,
  STEPS_8K: 35,
  STEPS_10K: 50,

  // Milestone achievements
  MILESTONE_FIRST_FOOD: 50,
  MILESTONE_FIRST_WORKOUT: 100,
  MILESTONE_STREAK_3: 100,
  MILESTONE_STREAK_7: 200,
  MILESTONE_STREAK_14: 300,
  MILESTONE_STREAK_30: 500,
  MILESTONE_FIRST_WEEK: 250,
};

/**
 * Get streak multiplier based on current streak days
 * Day 1-2: 1x
 * Day 3-6: 2x
 * Day 7-13: 3x
 * Day 14+: 4x
 */
export function getStreakMultiplier(streak: number): number {
  if (streak >= 14) return 4.0;
  if (streak >= 7) return 3.0;
  if (streak >= 3) return 2.0;
  return 1.0;
}

/**
 * Get the next streak multiplier tier and days until it
 */
export function getNextMultiplierInfo(streak: number): { nextMultiplier: number; daysUntil: number } | null {
  if (streak >= 14) return null; // Already at max
  if (streak >= 7) return { nextMultiplier: 4.0, daysUntil: 14 - streak };
  if (streak >= 3) return { nextMultiplier: 3.0, daysUntil: 7 - streak };
  return { nextMultiplier: 2.0, daysUntil: 3 - streak };
}

/**
 * Calculate step points based on step count tiers
 */
export function calculateStepPoints(steps: number): number {
  if (steps >= 10000) return POINT_VALUES.STEPS_10K;
  if (steps >= 8000) return POINT_VALUES.STEPS_8K;
  if (steps >= 5000) return POINT_VALUES.STEPS_5K;
  if (steps >= 2000) return POINT_VALUES.STEPS_2K;
  return 0;
}

/**
 * Calculate workout points based on duration
 */
export function calculateWorkoutPoints(durationMinutes: number): number {
  const basePoints = POINT_VALUES.WORKOUT_BASE;
  const durationBonus = Math.min(
    Math.max(0, durationMinutes - 15) * POINT_VALUES.WORKOUT_PER_MINUTE,
    POINT_VALUES.WORKOUT_MAX_DURATION_BONUS
  );
  return basePoints + durationBonus;
}

/**
 * Get today's date string in user's timezone (or UTC)
 */
export function getTodayDateString(timezone?: string): string {
  const now = new Date();
  if (timezone) {
    try {
      return now.toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD format
    } catch {
      // Invalid timezone, fall back to UTC
    }
  }
  return now.toISOString().split('T')[0];
}

/**
 * Get yesterday's date string
 */
export function getYesterdayDateString(timezone?: string): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  if (timezone) {
    try {
      return now.toLocaleDateString('en-CA', { timeZone: timezone });
    } catch {
      // Invalid timezone, fall back to UTC
    }
  }
  return now.toISOString().split('T')[0];
}

/**
 * Award points to a user for an action
 * Handles streak checking, multiplier calculation, and transaction logging
 */
export async function awardPoints(
  userId: string,
  actionType: string,
  basePoints: number,
  description: string,
  referenceId?: string,
  referenceType?: string,
  timezone?: string
): Promise<{ transaction: any; userPoints: UserPoints; pointsAwarded: number }> {
  // Get or create user points record
  let userPointsRecord = await storage.getUserPoints(userId);

  if (!userPointsRecord) {
    userPointsRecord = await storage.createUserPoints({
      userId,
      lifetimePoints: 0,
      spendablePoints: 0,
      dailyPoints: 0,
      weeklyPoints: 0,
      monthlyPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
    });
  }

  // Check and update streak
  const today = getTodayDateString(timezone);
  const yesterday = getYesterdayDateString(timezone);

  let currentStreak = userPointsRecord.currentStreak;
  const lastActivity = userPointsRecord.lastActivityDate;

  if (lastActivity === today) {
    // Already active today, streak stays the same
  } else if (lastActivity === yesterday) {
    // Continue streak
    currentStreak += 1;
  } else if (!lastActivity) {
    // First activity ever
    currentStreak = 1;
  } else {
    // Streak broken, reset to 1
    currentStreak = 1;
  }

  // Calculate multiplier
  const multiplier = getStreakMultiplier(currentStreak);
  const totalPoints = Math.round(basePoints * multiplier);

  // Create transaction
  const transaction = await storage.createPointTransaction({
    userId,
    actionType,
    basePoints,
    multiplier,
    bonusPoints: 0,
    totalPoints,
    description,
    referenceId: referenceId || null,
    referenceType: referenceType || null,
  });

  // Update user points
  const updatedUserPoints = await storage.updateUserPoints(userId, {
    lifetimePoints: userPointsRecord.lifetimePoints + totalPoints,
    spendablePoints: userPointsRecord.spendablePoints + totalPoints,
    dailyPoints: userPointsRecord.dailyPoints + totalPoints,
    weeklyPoints: userPointsRecord.weeklyPoints + totalPoints,
    monthlyPoints: userPointsRecord.monthlyPoints + totalPoints,
    currentStreak,
    longestStreak: Math.max(userPointsRecord.longestStreak, currentStreak),
    lastActivityDate: today,
  });

  return {
    transaction,
    userPoints: updatedUserPoints,
    pointsAwarded: totalPoints,
  };
}

/**
 * Award food logging points
 */
export async function awardFoodLogPoints(
  userId: string,
  foodEntryId: string,
  foodName: string,
  timezone?: string
): Promise<{ pointsAwarded: number; multiplier: number }> {
  const result = await awardPoints(
    userId,
    "food_log",
    POINT_VALUES.FOOD_LOG,
    `Logged: ${foodName}`,
    foodEntryId,
    "food_entry",
    timezone
  );
  return { pointsAwarded: result.pointsAwarded, multiplier: result.userPoints.currentStreak > 0 ? getStreakMultiplier(result.userPoints.currentStreak) : 1 };
}

/**
 * Award workout points
 */
export async function awardWorkoutPoints(
  userId: string,
  exerciseLogId: string,
  workoutName: string,
  durationMinutes: number,
  timezone?: string
): Promise<{ pointsAwarded: number; multiplier: number }> {
  const basePoints = calculateWorkoutPoints(durationMinutes);
  const result = await awardPoints(
    userId,
    "workout",
    basePoints,
    `Workout: ${workoutName} (${durationMinutes} min)`,
    exerciseLogId,
    "exercise_log",
    timezone
  );
  return { pointsAwarded: result.pointsAwarded, multiplier: result.userPoints.currentStreak > 0 ? getStreakMultiplier(result.userPoints.currentStreak) : 1 };
}

/**
 * Award biofeedback logging points
 */
export async function awardBiofeedbackPoints(
  userId: string,
  dailyLogId: string,
  fields: { sleep?: boolean; energy?: boolean; stress?: boolean; mood?: boolean; weight?: boolean },
  timezone?: string
): Promise<{ pointsAwarded: number; multiplier: number }> {
  let basePoints = 0;
  const loggedFields: string[] = [];

  if (fields.sleep) {
    basePoints += POINT_VALUES.BIOFEEDBACK_SLEEP;
    loggedFields.push("sleep");
  }
  if (fields.energy) {
    basePoints += POINT_VALUES.BIOFEEDBACK_ENERGY;
    loggedFields.push("energy");
  }
  if (fields.stress) {
    basePoints += POINT_VALUES.BIOFEEDBACK_STRESS;
    loggedFields.push("stress");
  }
  if (fields.mood) {
    basePoints += POINT_VALUES.BIOFEEDBACK_MOOD;
    loggedFields.push("mood");
  }
  if (fields.weight) {
    basePoints += POINT_VALUES.BIOFEEDBACK_WEIGHT;
    loggedFields.push("weight");
  }

  if (basePoints === 0) {
    // No biofeedback fields to award
    const userPointsRecord = await storage.getUserPoints(userId);
    return { pointsAwarded: 0, multiplier: userPointsRecord ? getStreakMultiplier(userPointsRecord.currentStreak) : 1 };
  }

  const result = await awardPoints(
    userId,
    "biofeedback",
    basePoints,
    `Logged biofeedback: ${loggedFields.join(", ")}`,
    dailyLogId,
    "daily_log",
    timezone
  );
  return { pointsAwarded: result.pointsAwarded, multiplier: result.userPoints.currentStreak > 0 ? getStreakMultiplier(result.userPoints.currentStreak) : 1 };
}

/**
 * Award step milestone points
 */
export async function awardStepPoints(
  userId: string,
  dailyLogId: string,
  steps: number,
  previousSteps: number | null,
  timezone?: string
): Promise<{ pointsAwarded: number; multiplier: number }> {
  const newPoints = calculateStepPoints(steps);
  const oldPoints = previousSteps ? calculateStepPoints(previousSteps) : 0;

  // Only award the difference (in case steps increased)
  const pointsToAward = Math.max(0, newPoints - oldPoints);

  if (pointsToAward === 0) {
    const userPointsRecord = await storage.getUserPoints(userId);
    return { pointsAwarded: 0, multiplier: userPointsRecord ? getStreakMultiplier(userPointsRecord.currentStreak) : 1 };
  }

  const result = await awardPoints(
    userId,
    "steps",
    pointsToAward,
    `Steps milestone: ${steps.toLocaleString()} steps`,
    dailyLogId,
    "daily_log",
    timezone
  );
  return { pointsAwarded: result.pointsAwarded, multiplier: result.userPoints.currentStreak > 0 ? getStreakMultiplier(result.userPoints.currentStreak) : 1 };
}

/**
 * Award milestone achievement points
 */
export async function awardMilestonePoints(
  userId: string,
  milestoneKey: string,
  timezone?: string
): Promise<{ pointsAwarded: number }> {
  let basePoints = 0;
  let description = "";

  switch (milestoneKey) {
    case "first_food_log":
      basePoints = POINT_VALUES.MILESTONE_FIRST_FOOD;
      description = "First food logged!";
      break;
    case "first_workout":
      basePoints = POINT_VALUES.MILESTONE_FIRST_WORKOUT;
      description = "First workout completed!";
      break;
    case "day_3":
      basePoints = POINT_VALUES.MILESTONE_STREAK_3;
      description = "3-day streak achieved!";
      break;
    case "first_week":
      basePoints = POINT_VALUES.MILESTONE_FIRST_WEEK;
      description = "First week completed!";
      break;
    default:
      return { pointsAwarded: 0 };
  }

  const result = await awardPoints(
    userId,
    "milestone",
    basePoints,
    description,
    milestoneKey,
    "milestone",
    timezone
  );
  return { pointsAwarded: result.pointsAwarded };
}

/**
 * Get user's points summary for API response
 */
export async function getPointsSummary(userId: string): Promise<{
  lifetimePoints: number;
  spendablePoints: number;
  dailyPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  currentStreak: number;
  longestStreak: number;
  currentMultiplier: number;
  nextMultiplierInfo: { nextMultiplier: number; daysUntil: number } | null;
}> {
  const userPoints = await storage.getUserPoints(userId);

  if (!userPoints) {
    return {
      lifetimePoints: 0,
      spendablePoints: 0,
      dailyPoints: 0,
      weeklyPoints: 0,
      monthlyPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      currentMultiplier: 1,
      nextMultiplierInfo: { nextMultiplier: 2.0, daysUntil: 3 },
    };
  }

  return {
    lifetimePoints: userPoints.lifetimePoints,
    spendablePoints: userPoints.spendablePoints,
    dailyPoints: userPoints.dailyPoints,
    weeklyPoints: userPoints.weeklyPoints,
    monthlyPoints: userPoints.monthlyPoints,
    currentStreak: userPoints.currentStreak,
    longestStreak: userPoints.longestStreak,
    currentMultiplier: getStreakMultiplier(userPoints.currentStreak),
    nextMultiplierInfo: getNextMultiplierInfo(userPoints.currentStreak),
  };
}

/**
 * Get leaderboard for a given period (daily, weekly, monthly)
 */
export async function getLeaderboard(
  type: "daily" | "weekly" | "monthly",
  limit: number = 10
): Promise<Array<{
  rank: number;
  userId: string;
  username: string | null;
  displayName: string | null;
  profileImageUrl: string | null;
  points: number;
}>> {
  return storage.getLeaderboard(type, limit);
}
