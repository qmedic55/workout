import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, BarChart3, Heart, Brain, Users, Clock, Repeat, HelpCircle, Zap, Target, Dumbbell, Award } from "lucide-react";
import { LucideIcon } from "lucide-react";

// Types
export type MotivationStyle = "data" | "encouragement" | "understanding" | "accountability";
export type PastExperience = "beginner" | "on_off" | "consistent" | "experienced";
export type BiggestChallenge = "time" | "consistency" | "knowledge" | "motivation";

export interface PersonalityData {
  motivationStyle: MotivationStyle | null;
  pastExperience: PastExperience | null;
  biggestChallenge: BiggestChallenge | null;
}

interface QuestionOption<T extends string> {
  value: T;
  label: string;
  icon: LucideIcon;
  description: string;
}

// Question configurations
export const motivationOptions: QuestionOption<MotivationStyle>[] = [
  { value: "data", label: "Data & Progress", icon: BarChart3, description: "Show me the numbers" },
  { value: "encouragement", label: "Encouragement", icon: Heart, description: "Celebrate my wins" },
  { value: "understanding", label: "Understanding", icon: Brain, description: "Explain the why" },
  { value: "accountability", label: "Accountability", icon: Users, description: "Keep me on track" },
];

export const experienceOptions: QuestionOption<PastExperience>[] = [
  { value: "beginner", label: "Just Starting", icon: Target, description: "New to fitness" },
  { value: "on_off", label: "On and Off", icon: Repeat, description: "Tried many times" },
  { value: "consistent", label: "Consistent", icon: Dumbbell, description: "But need guidance" },
  { value: "experienced", label: "Experienced", icon: Award, description: "Know my way around" },
];

export const challengeOptions: QuestionOption<BiggestChallenge>[] = [
  { value: "time", label: "Finding Time", icon: Clock, description: "Life gets busy" },
  { value: "consistency", label: "Staying Consistent", icon: Repeat, description: "Starting is easy" },
  { value: "knowledge", label: "Knowing What to Do", icon: HelpCircle, description: "Too much info" },
  { value: "motivation", label: "Staying Motivated", icon: Zap, description: "Losing steam" },
];

// Animation variants
const optionVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

// Single option button component
interface OptionButtonProps<T extends string> {
  option: QuestionOption<T>;
  selected: boolean;
  onSelect: () => void;
  color: string;
}

function OptionButton<T extends string>({ option, selected, onSelect, color }: OptionButtonProps<T>) {
  const Icon = option.icon;

  return (
    <motion.button
      type="button"
      variants={optionVariants}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        "relative w-full p-3 rounded-xl border-2 text-left transition-all",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        selected
          ? `${color} border-current`
          : "bg-background border-muted hover:border-primary/30"
      )}
    >
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-current flex items-center justify-center"
        >
          <Check className="w-3 h-3 text-white" />
        </motion.div>
      )}

      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
          selected ? "bg-current/20" : "bg-muted"
        )}>
          <Icon className={cn("w-5 h-5", selected ? "" : "text-muted-foreground")} />
        </div>
        <div className="min-w-0">
          <div className="font-medium text-sm">{option.label}</div>
          <div className="text-xs text-muted-foreground truncate">{option.description}</div>
        </div>
      </div>
    </motion.button>
  );
}

// Question section component
interface QuestionSectionProps<T extends string> {
  question: string;
  options: QuestionOption<T>[];
  selectedValue: T | null;
  onSelect: (value: T) => void;
  color: string;
}

function QuestionSection<T extends string>({
  question,
  options,
  selectedValue,
  onSelect,
  color,
}: QuestionSectionProps<T>) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">{question}</h3>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-2"
      >
        {options.map((option) => (
          <OptionButton
            key={option.value}
            option={option}
            selected={selectedValue === option.value}
            onSelect={() => onSelect(option.value)}
            color={color}
          />
        ))}
      </motion.div>
    </div>
  );
}

// Main component that shows all personality questions
interface PersonalityQuestionsProps {
  data: PersonalityData;
  onChange: (data: Partial<PersonalityData>) => void;
}

export function PersonalityQuestions({ data, onChange }: PersonalityQuestionsProps) {
  return (
    <div className="space-y-6">
      <QuestionSection
        question="What keeps you motivated?"
        options={motivationOptions}
        selectedValue={data.motivationStyle}
        onSelect={(value) => onChange({ motivationStyle: value })}
        color="bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/30 dark:border-blue-700 dark:text-blue-300"
      />

      <QuestionSection
        question="How would you describe your fitness journey?"
        options={experienceOptions}
        selectedValue={data.pastExperience}
        onSelect={(value) => onChange({ pastExperience: value })}
        color="bg-purple-50 border-purple-300 text-purple-700 dark:bg-purple-950/30 dark:border-purple-700 dark:text-purple-300"
      />

      <QuestionSection
        question="What's been your biggest obstacle?"
        options={challengeOptions}
        selectedValue={data.biggestChallenge}
        onSelect={(value) => onChange({ biggestChallenge: value })}
        color="bg-orange-50 border-orange-300 text-orange-700 dark:bg-orange-950/30 dark:border-orange-700 dark:text-orange-300"
      />
    </div>
  );
}

// Helper to check if all personality questions are answered
export function isPersonalityComplete(data: PersonalityData): boolean {
  return (
    data.motivationStyle !== null &&
    data.pastExperience !== null &&
    data.biggestChallenge !== null
  );
}

// Helper to get coaching tone suggestion based on personality
export function suggestCoachingTone(data: PersonalityData): "empathetic" | "scientific" | "casual" | "tough_love" {
  if (data.motivationStyle === "understanding") return "scientific";
  if (data.motivationStyle === "accountability") return "tough_love";
  if (data.motivationStyle === "encouragement") return "empathetic";
  return "casual";
}
