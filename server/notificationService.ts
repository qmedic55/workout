import { storage } from "./storage";
import type { InsertNotification } from "@shared/schema";

// Notification types
export type NotificationType = "reminder" | "insight" | "phase_change" | "achievement";

interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
}

// Send a notification to a user
export async function sendNotification(payload: NotificationPayload) {
  const notification: InsertNotification = {
    userId: payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    actionUrl: payload.actionUrl || null,
    isRead: false,
  };

  return storage.createNotification(notification);
}

// Pre-defined notification templates
export const notificationTemplates = {
  // Daily reminders
  dailyLogReminder: (userId: string) =>
    sendNotification({
      userId,
      type: "reminder",
      title: "Log Your Day",
      message: "Don't forget to log your weight, meals, and biofeedback for today!",
      actionUrl: "/daily-log",
    }),

  mealLogReminder: (userId: string) =>
    sendNotification({
      userId,
      type: "reminder",
      title: "Time to Log Lunch",
      message: "Track your midday meal to stay on top of your nutrition goals.",
      actionUrl: "/nutrition",
    }),

  weeklyCheckIn: (userId: string) =>
    sendNotification({
      userId,
      type: "reminder",
      title: "Weekly Check-in",
      message: "Let's review your progress this week and chat about how things are going!",
      actionUrl: "/chat",
    }),

  // Phase transitions
  phaseReadyForTransition: (userId: string, currentPhase: string, suggestedPhase: string) =>
    sendNotification({
      userId,
      type: "phase_change",
      title: "Ready for Next Phase?",
      message: `Based on your progress in ${currentPhase}, you may be ready to transition to ${suggestedPhase}. Chat with your AI mentor to discuss.`,
      actionUrl: "/chat",
    }),

  phaseTransitionComplete: (userId: string, newPhase: string) =>
    sendNotification({
      userId,
      type: "phase_change",
      title: "Phase Transition Complete",
      message: `You've moved to the ${newPhase} phase. Your targets have been updated accordingly.`,
      actionUrl: "/",
    }),

  // Achievements
  streakAchievement: (userId: string, days: number) =>
    sendNotification({
      userId,
      type: "achievement",
      title: `${days}-Day Streak!`,
      message: `Amazing consistency! You've logged data for ${days} days in a row.`,
      actionUrl: "/progress",
    }),

  weightMilestone: (userId: string, weightLost: number) =>
    sendNotification({
      userId,
      type: "achievement",
      title: "Weight Milestone Reached!",
      message: `Congratulations! You've lost ${weightLost.toFixed(1)}kg since starting your journey.`,
      actionUrl: "/progress",
    }),

  proteinGoalMet: (userId: string) =>
    sendNotification({
      userId,
      type: "achievement",
      title: "Protein Target Hit!",
      message: "Great job hitting your protein goal today! Consistent protein intake supports muscle maintenance.",
      actionUrl: "/nutrition",
    }),

  // Insights
  sleepInsight: (userId: string, message: string) =>
    sendNotification({
      userId,
      type: "insight",
      title: "Sleep Pattern Insight",
      message,
      actionUrl: "/daily-log",
    }),

  nutritionInsight: (userId: string, message: string) =>
    sendNotification({
      userId,
      type: "insight",
      title: "Nutrition Insight",
      message,
      actionUrl: "/nutrition",
    }),

  stressInsight: (userId: string, message: string) =>
    sendNotification({
      userId,
      type: "insight",
      title: "Stress & Recovery Insight",
      message,
      actionUrl: "/chat",
    }),
};

// Check and send notifications based on user data
export async function checkAndSendNotifications(userId: string) {
  const profile = await storage.getProfile(userId);
  if (!profile || !profile.onboardingCompleted) return;

  const today = new Date().toISOString().split("T")[0];
  const todayLog = await storage.getDailyLog(userId, today);

  // Check if user hasn't logged today and it's afternoon
  const hour = new Date().getHours();
  if (!todayLog && hour >= 14) {
    await notificationTemplates.dailyLogReminder(userId);
  }

  // Check for logging streaks
  const endDate = today;
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const logs = await storage.getDailyLogs(userId, startDate, endDate);

  // Calculate consecutive days
  let streak = 0;
  const sortedLogs = logs.sort((a, b) =>
    new Date(b.logDate).getTime() - new Date(a.logDate).getTime()
  );

  for (let i = 0; i < sortedLogs.length; i++) {
    const logDate = new Date(sortedLogs[i].logDate);
    const expectedDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    expectedDate.setHours(0, 0, 0, 0);
    logDate.setHours(0, 0, 0, 0);

    if (logDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  // Send streak achievement notifications
  if (streak === 7 || streak === 14 || streak === 30 || streak === 60 || streak === 90) {
    await notificationTemplates.streakAchievement(userId, streak);
  }

  // Check protein goal
  if (todayLog?.proteinGrams && profile.proteinGrams) {
    const proteinPercentage = (todayLog.proteinGrams / profile.proteinGrams) * 100;
    if (proteinPercentage >= 100) {
      await notificationTemplates.proteinGoalMet(userId);
    }
  }

  // Check weight milestone
  if (profile.currentWeightKg && profile.targetWeightKg) {
    const logsWithWeight = logs.filter(log => log.weightKg);
    if (logsWithWeight.length > 0) {
      const startWeight = profile.currentWeightKg;
      const currentWeight = logsWithWeight[0].weightKg!;
      const weightLost = startWeight - currentWeight;

      // Check for milestones: 2.5kg, 5kg, 10kg, etc.
      const milestones = [2.5, 5, 7.5, 10, 15, 20, 25];
      for (const milestone of milestones) {
        if (weightLost >= milestone && weightLost < milestone + 0.5) {
          await notificationTemplates.weightMilestone(userId, milestone);
          break;
        }
      }
    }
  }
}
