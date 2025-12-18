/**
 * Proactive Notification Generator
 *
 * Analyzes user's daily progress and generates smart reminders
 * to help them stay on track with their goals.
 */

import { storage } from "./storage";
import { format } from "date-fns";
import type { UserProfile, DailyLog, FoodEntry } from "@shared/schema";

export interface ProactiveReminder {
  type: "calorie_deficit" | "protein_low" | "no_workout" | "hydration" | "logging_reminder" | "steps_behind";
  priority: "high" | "medium" | "low";
  title: string;
  message: string;
  actionUrl?: string;
}

interface DailyProgress {
  caloriesConsumed: number;
  caloriesTarget: number;
  caloriesRemaining: number;
  proteinConsumed: number;
  proteinTarget: number;
  proteinRemaining: number;
  stepsLogged: number;
  stepsTarget: number;
  hasLoggedToday: boolean;
  hasWorkedOutToday: boolean;
  waterLiters: number;
}

/**
 * Calculate today's progress from food entries and daily log
 */
async function calculateDailyProgress(
  userId: string,
  profile: UserProfile
): Promise<DailyProgress> {
  const today = format(new Date(), "yyyy-MM-dd");

  // Get today's food entries
  const foodEntries = await storage.getFoodEntries(userId, today);
  const caloriesConsumed = foodEntries.reduce((sum, e) => sum + (e.calories || 0), 0);
  const proteinConsumed = foodEntries.reduce((sum, e) => sum + (e.proteinGrams || 0), 0);

  // Get today's daily log
  const dailyLog = await storage.getDailyLog(userId, today);

  const caloriesTarget = profile.targetCalories || 2000;
  const proteinTarget = profile.proteinGrams || 150;
  const stepsTarget = profile.dailyStepsTarget || 8000;

  return {
    caloriesConsumed,
    caloriesTarget,
    caloriesRemaining: caloriesTarget - caloriesConsumed,
    proteinConsumed,
    proteinTarget,
    proteinRemaining: proteinTarget - proteinConsumed,
    stepsLogged: dailyLog?.steps || 0,
    stepsTarget,
    hasLoggedToday: !!dailyLog,
    hasWorkedOutToday: dailyLog?.workoutCompleted || false,
    waterLiters: dailyLog?.waterLiters || 0,
  };
}

/**
 * Generate afternoon check-in reminders (around 2-4 PM)
 * Analyzes progress and suggests what to focus on for the rest of the day
 */
export async function generateAfternoonReminders(userId: string): Promise<ProactiveReminder[]> {
  const profile = await storage.getProfile(userId);
  if (!profile || !profile.enableNotifications) return [];

  const progress = await calculateDailyProgress(userId, profile);
  const reminders: ProactiveReminder[] = [];

  // Check calorie deficit - if they've eaten less than 50% of target by afternoon
  const caloriePercentage = (progress.caloriesConsumed / progress.caloriesTarget) * 100;
  if (caloriePercentage < 50) {
    const remaining = progress.caloriesRemaining;
    reminders.push({
      type: "calorie_deficit",
      priority: "high",
      title: "Time to fuel up!",
      message: `You've only had ${progress.caloriesConsumed} cal so far today. You still need about ${remaining} cal to hit your ${progress.caloriesTarget} cal target. Consider a balanced meal or snack soon!`,
      actionUrl: "/nutrition",
    });
  } else if (caloriePercentage < 70 && caloriePercentage >= 50) {
    reminders.push({
      type: "calorie_deficit",
      priority: "medium",
      title: "Stay on track",
      message: `You're at ${progress.caloriesConsumed} cal today. Make sure to get in another ${progress.caloriesRemaining} cal to meet your goal. A protein-rich dinner would be perfect!`,
      actionUrl: "/nutrition",
    });
  }

  // Check protein intake
  const proteinPercentage = (progress.proteinConsumed / progress.proteinTarget) * 100;
  if (proteinPercentage < 40) {
    reminders.push({
      type: "protein_low",
      priority: "high",
      title: "Protein check",
      message: `Only ${Math.round(progress.proteinConsumed)}g protein so far. You need ${Math.round(progress.proteinRemaining)}g more to hit your ${progress.proteinTarget}g target. Great protein sources: chicken, fish, eggs, Greek yogurt, or a protein shake.`,
      actionUrl: "/nutrition",
    });
  }

  // Check steps progress
  const stepsPercentage = (progress.stepsLogged / progress.stepsTarget) * 100;
  if (progress.stepsLogged > 0 && stepsPercentage < 50) {
    reminders.push({
      type: "steps_behind",
      priority: "medium",
      title: "Get moving!",
      message: `You're at ${progress.stepsLogged.toLocaleString()} steps. Try to get in a walk this afternoon to hit your ${progress.stepsTarget.toLocaleString()} step goal!`,
      actionUrl: "/log",
    });
  }

  // Hydration reminder
  if (progress.waterLiters < 1.5) {
    reminders.push({
      type: "hydration",
      priority: "low",
      title: "Stay hydrated",
      message: `Don't forget to drink water! Aim for at least 2-3 liters throughout the day.`,
    });
  }

  return reminders;
}

/**
 * Generate morning check-in reminders
 */
export async function generateMorningReminders(userId: string): Promise<ProactiveReminder[]> {
  const profile = await storage.getProfile(userId);
  if (!profile || !profile.enableNotifications) return [];

  const reminders: ProactiveReminder[] = [];
  const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");

  // Check if they logged yesterday
  const yesterdayLog = await storage.getDailyLog(userId, yesterday);
  if (!yesterdayLog) {
    reminders.push({
      type: "logging_reminder",
      priority: "medium",
      title: "Log yesterday's data",
      message: "Don't forget to log yesterday's weight, meals, and activity! Consistent tracking helps me give you better guidance.",
      actionUrl: "/log",
    });
  }

  // Phase-specific morning message
  const phase = profile.currentPhase || "recomp";
  if (phase === "recovery") {
    reminders.push({
      type: "logging_reminder",
      priority: "low",
      title: "Recovery phase focus",
      message: `Today's priorities: hit your ${profile.targetCalories} cal target, get quality sleep, and keep stress low. Recovery is when the magic happens!`,
    });
  }

  return reminders;
}

/**
 * Generate evening wrap-up reminders
 */
export async function generateEveningReminders(userId: string): Promise<ProactiveReminder[]> {
  const profile = await storage.getProfile(userId);
  if (!profile || !profile.enableNotifications) return [];

  const progress = await calculateDailyProgress(userId, profile);
  const reminders: ProactiveReminder[] = [];

  // If significantly under calories, suggest a late snack
  if (progress.caloriesRemaining > 400) {
    reminders.push({
      type: "calorie_deficit",
      priority: "medium",
      title: "End the day right",
      message: `You still have ${progress.caloriesRemaining} cal left for today. A healthy evening snack like Greek yogurt with berries or nuts could help you hit your target.`,
      actionUrl: "/nutrition",
    });
  }

  // Protein reminder
  if (progress.proteinRemaining > 30) {
    reminders.push({
      type: "protein_low",
      priority: "medium",
      title: "Protein top-up",
      message: `You're ${Math.round(progress.proteinRemaining)}g short on protein today. A casein shake or cottage cheese before bed can help with overnight muscle recovery.`,
    });
  }

  // Workout reminder if no workout logged
  if (!progress.hasWorkedOutToday) {
    // Check what day of the week it is and their training frequency
    reminders.push({
      type: "no_workout",
      priority: "low",
      title: "Rest day?",
      message: "No workout logged today. If this is a rest day, great! If not, there's still time for a quick session or some mobility work.",
      actionUrl: "/log",
    });
  }

  return reminders;
}

/**
 * Create and store proactive notifications for a user
 */
export async function sendProactiveNotifications(
  userId: string,
  timeOfDay: "morning" | "afternoon" | "evening"
): Promise<void> {
  let reminders: ProactiveReminder[] = [];

  switch (timeOfDay) {
    case "morning":
      reminders = await generateMorningReminders(userId);
      break;
    case "afternoon":
      reminders = await generateAfternoonReminders(userId);
      break;
    case "evening":
      reminders = await generateEveningReminders(userId);
      break;
  }

  // Store high and medium priority reminders as notifications
  for (const reminder of reminders.filter(r => r.priority !== "low")) {
    await storage.createNotification({
      userId,
      type: "reminder",
      title: reminder.title,
      message: reminder.message,
      actionUrl: reminder.actionUrl,
    });
  }
}

/**
 * Get real-time progress summary for chat context
 */
export async function getDailyProgressSummary(userId: string): Promise<string> {
  const profile = await storage.getProfile(userId);
  if (!profile) return "";

  const progress = await calculateDailyProgress(userId, profile);

  const calorieStatus = progress.caloriesRemaining > 0
    ? `${progress.caloriesRemaining} cal remaining`
    : `${Math.abs(progress.caloriesRemaining)} cal over target`;

  const proteinStatus = progress.proteinRemaining > 0
    ? `${Math.round(progress.proteinRemaining)}g remaining`
    : `${Math.abs(Math.round(progress.proteinRemaining))}g over target`;

  return `
TODAY'S PROGRESS (Real-time):
- Calories: ${progress.caloriesConsumed}/${progress.caloriesTarget} (${calorieStatus})
- Protein: ${Math.round(progress.proteinConsumed)}g/${progress.proteinTarget}g (${proteinStatus})
- Steps: ${progress.stepsLogged.toLocaleString()}/${progress.stepsTarget.toLocaleString()}
- Water: ${progress.waterLiters}L
- Workout today: ${progress.hasWorkedOutToday ? "Yes" : "Not yet"}
`;
}
