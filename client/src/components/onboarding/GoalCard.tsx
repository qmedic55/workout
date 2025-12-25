import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon, Scale, Dumbbell, Zap, Heart, Check } from "lucide-react";

export type GoalType = "lose_weight" | "build_strength" | "more_energy" | "feel_better";

interface GoalCardProps {
  goal: GoalType;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

interface GoalConfig {
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  selectedColor: string;
}

const goalConfigs: Record<GoalType, GoalConfig> = {
  lose_weight: {
    label: "Lose weight",
    description: "Sustainable fat loss",
    icon: Scale,
    color: "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-300",
    selectedColor: "bg-orange-100 border-orange-500 text-orange-700 dark:bg-orange-950/50 dark:border-orange-500 dark:text-orange-300",
  },
  build_strength: {
    label: "Build strength",
    description: "Muscle & fitness",
    icon: Dumbbell,
    color: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300",
    selectedColor: "bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-950/50 dark:border-blue-500 dark:text-blue-300",
  },
  more_energy: {
    label: "More energy",
    description: "Feel energized daily",
    icon: Zap,
    color: "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-300",
    selectedColor: "bg-yellow-100 border-yellow-500 text-yellow-700 dark:bg-yellow-950/50 dark:border-yellow-500 dark:text-yellow-300",
  },
  feel_better: {
    label: "Feel better",
    description: "Overall wellbeing",
    icon: Heart,
    color: "bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-950/30 dark:border-pink-800 dark:text-pink-300",
    selectedColor: "bg-pink-100 border-pink-500 text-pink-700 dark:bg-pink-950/50 dark:border-pink-500 dark:text-pink-300",
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  tap: { scale: 0.98 },
};

export function GoalCard({ goal, selected, onSelect, disabled }: GoalCardProps) {
  const config = goalConfigs[goal];
  const Icon = config.icon;

  return (
    <motion.button
      type="button"
      variants={cardVariants}
      whileTap={disabled ? undefined : "tap"}
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "relative w-full p-4 rounded-xl border-2 transition-colors text-left",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        selected ? config.selectedColor : config.color,
        !selected && !disabled && "hover:border-current/50"
      )}
    >
      {/* Selection indicator */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-current flex items-center justify-center"
        >
          <Check className="w-3 h-3 text-white" />
        </motion.div>
      )}

      <div className="flex flex-col items-center text-center gap-2">
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            selected ? "bg-current/20" : "bg-current/10"
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <div className="font-semibold">{config.label}</div>
          <div className="text-xs opacity-80">{config.description}</div>
        </div>
      </div>
    </motion.button>
  );
}

// Container component for the goal grid with staggered animation
interface GoalGridProps {
  selectedGoal: GoalType | null;
  onSelectGoal: (goal: GoalType) => void;
  disabled?: boolean;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function GoalGrid({ selectedGoal, onSelectGoal, disabled }: GoalGridProps) {
  const goals: GoalType[] = ["lose_weight", "build_strength", "more_energy", "feel_better"];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-3"
    >
      {goals.map((goal) => (
        <GoalCard
          key={goal}
          goal={goal}
          selected={selectedGoal === goal}
          onSelect={() => onSelectGoal(goal)}
          disabled={disabled}
        />
      ))}
    </motion.div>
  );
}

// Get the acknowledgment text for a selected goal
export function getGoalAcknowledgment(goal: GoalType): string {
  const acknowledgments: Record<GoalType, string> = {
    lose_weight: "Weight loss is a journey, and I'll help you do it sustainably. No crash diets here!",
    build_strength: "Let's build some strength! Muscle is your metabolic engine, especially after 40.",
    more_energy: "Energy optimization is key for everything else to fall into place. Let's figure out what's holding you back.",
    feel_better: "Feeling better is what it's all about. We'll work on the foundations together.",
  };
  return acknowledgments[goal];
}
