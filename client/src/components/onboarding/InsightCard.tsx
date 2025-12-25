import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { Flame, Beef, TrendingUp, Target } from "lucide-react";

interface InsightCardProps {
  calories: number;
  protein: number;
  phase: string;
  className?: string;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

// Get phase display info
function getPhaseInfo(phase: string): { label: string; color: string; description: string } {
  switch (phase.toLowerCase()) {
    case "recovery":
      return {
        label: "Recovery",
        color: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
        description: "Focus on metabolic restoration",
      };
    case "recomp":
    case "recomposition":
      return {
        label: "Recomposition",
        color: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
        description: "Build muscle while managing fat",
      };
    case "cutting":
      return {
        label: "Fat Loss",
        color: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
        description: "Strategic calorie deficit",
      };
    default:
      return {
        label: phase,
        color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        description: "Personalized approach",
      };
  }
}

export function InsightCard({ calories, protein, phase, className }: InsightCardProps) {
  const phaseInfo = getPhaseInfo(phase);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-3", className)}
    >
      {/* Calories card */}
      <motion.div
        variants={cardVariants}
        className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-xl p-4 border border-orange-200 dark:border-orange-800"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">Daily Calories</div>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {calories.toLocaleString()} cal
            </div>
          </div>
        </div>
      </motion.div>

      {/* Protein card */}
      <motion.div
        variants={cardVariants}
        className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
            <Beef className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Protein Target</div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {protein}g
            </div>
          </div>
        </div>
      </motion.div>

      {/* Phase card */}
      <motion.div
        variants={cardVariants}
        className={cn(
          "rounded-xl p-4 border",
          phaseInfo.color.includes("purple")
            ? "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-purple-200 dark:border-purple-800"
            : phaseInfo.color.includes("blue")
            ? "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800"
            : "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              phaseInfo.color.includes("purple")
                ? "bg-purple-100 dark:bg-purple-900/50"
                : phaseInfo.color.includes("blue")
                ? "bg-blue-100 dark:bg-blue-900/50"
                : "bg-orange-100 dark:bg-orange-900/50"
            )}
          >
            <Target
              className={cn(
                "w-5 h-5",
                phaseInfo.color.includes("purple")
                  ? "text-purple-600 dark:text-purple-400"
                  : phaseInfo.color.includes("blue")
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-orange-600 dark:text-orange-400"
              )}
            />
          </div>
          <div className="flex-1">
            <div
              className={cn(
                "text-sm font-medium",
                phaseInfo.color.includes("purple")
                  ? "text-purple-600 dark:text-purple-400"
                  : phaseInfo.color.includes("blue")
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-orange-600 dark:text-orange-400"
              )}
            >
              Recommended Phase
            </div>
            <div
              className={cn(
                "text-xl font-bold",
                phaseInfo.color.includes("purple")
                  ? "text-purple-700 dark:text-purple-300"
                  : phaseInfo.color.includes("blue")
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-orange-700 dark:text-orange-300"
              )}
            >
              {phaseInfo.label}
            </div>
            <div className="text-xs opacity-70 mt-0.5">{phaseInfo.description}</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Get insight explanation text based on phase and goal
export function getInsightExplanation(phase: string, goal: string): string {
  const phaseExplanations: Record<string, Record<string, string>> = {
    cutting: {
      lose_weight: "Based on your profile, I've set you up with a moderate calorie deficit. This will help you lose about 0.5-1% of body weight per week - sustainable and healthy.",
      build_strength: "You'll start with a slight deficit to manage body composition while we build strength. Once we establish your training baseline, we can adjust.",
      more_energy: "We'll start conservatively to see how your energy responds. If you feel great, we can adjust your targets as needed.",
      feel_better: "I've calculated targets that balance progress with how you'll feel day-to-day. We can always adjust based on your feedback.",
    },
    recomp: {
      lose_weight: "I'm recommending a recomposition approach - building muscle while losing fat. It's slower but more sustainable for your goals.",
      build_strength: "Perfect for building strength! You'll eat at a small deficit while focusing on progressive overload. Muscle gains plus fat management.",
      more_energy: "Recomposition will help optimize your body composition without extreme restrictions that could tank your energy.",
      feel_better: "This balanced approach focuses on overall health - you'll see gradual improvements in how you look and feel.",
    },
    recovery: {
      lose_weight: "Before focusing on fat loss, let's first optimize your metabolism. This recovery phase will set you up for better long-term results.",
      build_strength: "We'll start with recovery to ensure your body is primed for strength gains. Think of it as building a foundation.",
      more_energy: "Recovery phase is exactly what you need! We'll focus on restoring your energy systems before adding stress.",
      feel_better: "Starting with recovery will help reset your baseline. Many people feel dramatically better after this phase.",
    },
  };

  const phaseKey = phase.toLowerCase().replace("recomposition", "recomp");
  return (
    phaseExplanations[phaseKey]?.[goal] ||
    "Based on your profile, I've created personalized targets to help you reach your goals safely and effectively."
  );
}
