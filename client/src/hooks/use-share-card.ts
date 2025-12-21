import { useState, useCallback } from "react";

export interface ShareCardData {
  type: "progress" | "goal" | "streak" | "milestone" | "workout";
  title: string;
  subtitle?: string;
  stats: {
    label: string;
    value: string;
    icon?: string;
  }[];
  username?: string;
}

interface UseShareCardReturn {
  generateCard: (data: ShareCardData) => Promise<Blob>;
  isGenerating: boolean;
  error: string | null;
}

// App branding colors
const COLORS = {
  gradientStart: "#1a1a2e",
  gradientEnd: "#14b8a6",
  primary: "#14b8a6",
  text: "#ffffff",
  textMuted: "rgba(255, 255, 255, 0.7)",
  cardBg: "rgba(255, 255, 255, 0.1)",
};

// Canvas dimensions (Instagram-friendly square)
const CARD_SIZE = 1080;
const PADDING = 80;

export function useShareCard(): UseShareCardReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCard = useCallback(async (data: ShareCardData): Promise<Blob> => {
    setIsGenerating(true);
    setError(null);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = CARD_SIZE;
      canvas.height = CARD_SIZE;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, CARD_SIZE, CARD_SIZE);
      gradient.addColorStop(0, COLORS.gradientStart);
      gradient.addColorStop(1, COLORS.gradientEnd);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

      // Add subtle pattern overlay
      ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
      for (let i = 0; i < CARD_SIZE; i += 40) {
        ctx.fillRect(i, 0, 1, CARD_SIZE);
        ctx.fillRect(0, i, CARD_SIZE, 1);
      }

      // Draw VitalPath branding (top)
      ctx.fillStyle = COLORS.text;
      ctx.font = "bold 36px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("VitalPath", PADDING, PADDING + 36);

      // Draw card type badge
      const badgeText = data.type.charAt(0).toUpperCase() + data.type.slice(1);
      ctx.font = "600 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      const badgeWidth = ctx.measureText(badgeText).width + 32;
      ctx.fillStyle = COLORS.cardBg;
      roundRect(ctx, CARD_SIZE - PADDING - badgeWidth, PADDING, badgeWidth, 44, 22);
      ctx.fill();
      ctx.fillStyle = COLORS.text;
      ctx.textAlign = "right";
      ctx.fillText(badgeText, CARD_SIZE - PADDING - 16, PADDING + 30);

      // Draw main title
      ctx.textAlign = "center";
      ctx.fillStyle = COLORS.text;
      ctx.font = "bold 72px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

      // Word wrap title if needed
      const titleLines = wrapText(ctx, data.title, CARD_SIZE - PADDING * 2, 72);
      let titleY = 320;
      titleLines.forEach((line, i) => {
        ctx.fillText(line, CARD_SIZE / 2, titleY + i * 80);
      });

      // Draw subtitle if present
      if (data.subtitle) {
        ctx.font = "400 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.fillStyle = COLORS.textMuted;
        ctx.fillText(data.subtitle, CARD_SIZE / 2, titleY + titleLines.length * 80 + 20);
      }

      // Draw stats grid
      const statsY = 580;
      const statsPerRow = Math.min(data.stats.length, 3);
      const statWidth = (CARD_SIZE - PADDING * 2) / statsPerRow;

      data.stats.forEach((stat, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        const x = PADDING + statWidth * col + statWidth / 2;
        const y = statsY + row * 180;

        // Stat card background
        ctx.fillStyle = COLORS.cardBg;
        roundRect(ctx, x - statWidth / 2 + 16, y, statWidth - 32, 150, 16);
        ctx.fill();

        // Stat value
        ctx.fillStyle = COLORS.text;
        ctx.font = "bold 56px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(stat.value, x, y + 70);

        // Stat label
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = "500 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.fillText(stat.label, x, y + 115);
      });

      // Draw footer with profile URL
      const footerY = CARD_SIZE - PADDING - 20;
      ctx.textAlign = "center";
      ctx.fillStyle = COLORS.textMuted;
      ctx.font = "400 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

      if (data.username) {
        ctx.fillText(`vitalpath.app/u/${data.username}`, CARD_SIZE / 2, footerY);
      } else {
        ctx.fillText("vitalpath.app", CARD_SIZE / 2, footerY);
      }

      // Convert canvas to blob
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create image"));
          }
        }, "image/png", 1.0);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate card";
      setError(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generateCard, isGenerating, error };
}

// Helper function to draw rounded rectangles
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Helper function to wrap text
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

// Helper to create share card data from progress summary
export function createProgressCardData(
  summary: {
    weightChange?: number;
    workoutsThisWeek?: number;
    currentStreak?: number;
    stepsAverage?: number;
  },
  period: "week" | "month",
  username?: string
): ShareCardData {
  const stats: ShareCardData["stats"] = [];

  if (summary.weightChange !== undefined) {
    const sign = summary.weightChange > 0 ? "+" : "";
    stats.push({
      label: "Weight Change",
      value: `${sign}${summary.weightChange.toFixed(1)} kg`,
    });
  }

  if (summary.workoutsThisWeek !== undefined) {
    stats.push({
      label: "Workouts",
      value: String(summary.workoutsThisWeek),
    });
  }

  if (summary.currentStreak !== undefined) {
    stats.push({
      label: "Streak",
      value: `${summary.currentStreak} days`,
    });
  }

  if (summary.stepsAverage !== undefined) {
    stats.push({
      label: "Avg Steps",
      value: summary.stepsAverage.toLocaleString(),
    });
  }

  return {
    type: "progress",
    title: period === "week" ? "Weekly Progress" : "Monthly Progress",
    subtitle: new Date().toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
    stats,
    username,
  };
}

// Helper to create share card data from goal completion
export function createGoalCardData(
  goal: {
    title: string;
    startValue?: number;
    targetValue?: number;
    targetUnit?: string;
    startDate?: string;
    completedAt?: string;
  },
  username?: string
): ShareCardData {
  const stats: ShareCardData["stats"] = [];

  if (goal.startValue !== undefined && goal.targetValue !== undefined) {
    stats.push({
      label: "Started At",
      value: `${goal.startValue} ${goal.targetUnit || ""}`.trim(),
    });
    stats.push({
      label: "Achieved",
      value: `${goal.targetValue} ${goal.targetUnit || ""}`.trim(),
    });
  }

  if (goal.startDate && goal.completedAt) {
    const start = new Date(goal.startDate);
    const end = new Date(goal.completedAt);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    stats.push({
      label: "Duration",
      value: `${days} days`,
    });
  }

  return {
    type: "goal",
    title: "Goal Achieved!",
    subtitle: goal.title,
    stats,
    username,
  };
}

// Helper to create streak card data
export function createStreakCardData(
  streakDays: number,
  username?: string
): ShareCardData {
  return {
    type: "streak",
    title: `${streakDays} Day Streak!`,
    subtitle: "Consistency is key",
    stats: [
      { label: "Days Strong", value: String(streakDays) },
    ],
    username,
  };
}
