import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Check, Dumbbell, Heart, Moon, Utensils, Activity, Stethoscope, Send, Smile, Zap, Brain, BedDouble, Coffee, Droplets, Sun, Trophy, AlertCircle, Target } from "lucide-react";

import { CoachAvatar } from "@/components/onboarding/CoachAvatar";
import { TypewriterText } from "@/components/onboarding/TypewriterText";
import { ChatBubble } from "@/components/onboarding/ChatBubble";

interface ProgressivePrompt {
  promptKey: string;
  question: string;
  options: { value: string; label: string }[];
  skipLabel: string;
}

interface CoachConversationModalProps {
  prompt: ProgressivePrompt;
  open: boolean;
  onClose: () => void;
}

// Conversational versions of the prompts
const conversationalPrompts: Record<string, {
  coachMessage: string;
  followUpSuccess: string;
  followUpSkip: string;
  icon: React.ElementType;
  color: string;
}> = {
  workout_focus: {
    coachMessage: "I'd love to learn more about your exercise! What's your main workout focus these days?",
    followUpSuccess: "Great choice! I'll tailor your workout recommendations accordingly.",
    followUpSkip: "No worries! We can figure this out as we go. I'll make balanced suggestions for now.",
    icon: Dumbbell,
    color: "bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300",
  },
  energy_levels: {
    coachMessage: "How's your energy usually feel in the mornings? This helps me understand your natural rhythm.",
    followUpSuccess: "Good to know! I'll factor this into when I suggest workouts and activities.",
    followUpSkip: "That's okay - energy can vary. I'll check in with you about this over time.",
    icon: Activity,
    color: "bg-yellow-100 border-yellow-300 text-yellow-700 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-300",
  },
  dietary_restrictions: {
    coachMessage: "Any dietary preferences or restrictions I should keep in mind when making nutrition suggestions?",
    followUpSuccess: "Got it! I'll make sure my food suggestions work with your preferences.",
    followUpSkip: "No problem! If anything comes up later, just let me know in chat.",
    icon: Utensils,
    color: "bg-green-100 border-green-300 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300",
  },
  health_conditions: {
    coachMessage: "Any health considerations that affect your fitness? This helps me give you safer recommendations.",
    followUpSuccess: "Thanks for sharing! I'll be mindful of this when suggesting exercises and nutrition.",
    followUpSkip: "Understood. If anything comes up later, you can always update this in your profile.",
    icon: Stethoscope,
    color: "bg-red-100 border-red-300 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300",
  },
  body_measurements: {
    coachMessage: "Would you like to track body measurements for progress? It's a great way to see changes beyond the scale.",
    followUpSuccess: "Great! I'll remind you to take measurements periodically.",
    followUpSkip: "That's fine - weight alone can tell us a lot. You can always add measurements later.",
    icon: Heart,
    color: "bg-pink-100 border-pink-300 text-pink-700 dark:bg-pink-950/30 dark:border-pink-800 dark:text-pink-300",
  },
  digestion_quality: {
    coachMessage: "Quick question - how's your digestion generally? It's often connected to energy and recovery.",
    followUpSuccess: "Thanks! Digestion impacts so much. I'll keep this in mind with nutrition advice.",
    followUpSkip: "No worries! If you notice any patterns, feel free to mention them in chat.",
    icon: Moon,
    color: "bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-300",
  },
  // Daily check-in prompts (proactive)
  daily_sleep: {
    coachMessage: "Good morning! How did you sleep last night? Rest is so important for your progress.",
    followUpSuccess: "Thanks for letting me know! Sleep affects everything - energy, recovery, even appetite. I'll factor this in.",
    followUpSkip: "No problem! You can always log your sleep later.",
    icon: BedDouble,
    color: "bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-800 dark:text-indigo-300",
  },
  daily_mood: {
    coachMessage: "Hey there! How are you feeling today? Your mood helps me understand how to support you better.",
    followUpSuccess: "Thanks for sharing! Your emotional state matters just as much as the physical. I'm here for you!",
    followUpSkip: "That's okay! Feel free to share when you're ready.",
    icon: Smile,
    color: "bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300",
  },
  daily_energy: {
    coachMessage: "Quick check-in - how's your energy level right now? This helps me tailor my suggestions for today.",
    followUpSuccess: "Got it! I'll keep your energy level in mind when suggesting activities.",
    followUpSkip: "No worries! We can check in later.",
    icon: Zap,
    color: "bg-yellow-100 border-yellow-300 text-yellow-700 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-300",
  },
  daily_stress: {
    coachMessage: "One more thing - how's your stress level today? Stress affects everything from sleep to appetite.",
    followUpSuccess: "I appreciate you sharing. I'll keep this in mind - maybe some light movement or breathing exercises could help!",
    followUpSkip: "That's fine! Remember, I'm here if you want to talk about it.",
    icon: Brain,
    color: "bg-teal-100 border-teal-300 text-teal-700 dark:bg-teal-950/30 dark:border-teal-800 dark:text-teal-300",
  },
  // Morning prompts
  morning_intention: {
    coachMessage: "Let's set an intention for today. What's your plan for movement?",
    followUpSuccess: "Love it! Having a plan makes it so much more likely to happen. I'll check in later!",
    followUpSkip: "No worries - you can always decide later. Just showing up is what matters!",
    icon: Sun,
    color: "bg-orange-100 border-orange-300 text-orange-700 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-300",
  },
  breakfast_check: {
    coachMessage: "Just checking in - have you fueled up with breakfast yet?",
    followUpSuccess: "Great! Starting the day right makes everything easier.",
    followUpSkip: "No problem! Everyone's morning routine is different.",
    icon: Coffee,
    color: "bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300",
  },
  // Midday prompts
  lunch_check: {
    coachMessage: "Midday check-in! Have you had lunch yet?",
    followUpSuccess: "Good to hear! Keeping your energy steady through the day helps everything.",
    followUpSkip: "Okay! Just remember, consistent meals help maintain energy and focus.",
    icon: Utensils,
    color: "bg-green-100 border-green-300 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300",
  },
  hydration_check: {
    coachMessage: "Quick hydration check! How's your water intake today?",
    followUpSuccess: "Hydration is so underrated! It affects energy, focus, and even hunger signals.",
    followUpSkip: "No problem! Just a gentle reminder to sip throughout the day.",
    icon: Droplets,
    color: "bg-cyan-100 border-cyan-300 text-cyan-700 dark:bg-cyan-950/30 dark:border-cyan-800 dark:text-cyan-300",
  },
  // Afternoon prompts
  workout_check: {
    coachMessage: "Afternoon check-in - how's the workout situation today?",
    followUpSuccess: "Awesome! Whether you're crushing it or resting, you're on track!",
    followUpSkip: "All good! Rest days are just as important as workout days.",
    icon: Dumbbell,
    color: "bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300",
  },
  afternoon_energy: {
    coachMessage: "I noticed your energy was lower earlier. How are you feeling now?",
    followUpSuccess: "Thanks for the update! I'll adjust my suggestions based on how you're feeling.",
    followUpSkip: "No worries! Energy ebbs and flows - that's totally normal.",
    icon: Zap,
    color: "bg-yellow-100 border-yellow-300 text-yellow-700 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-300",
  },
  // Evening prompts
  dinner_check: {
    coachMessage: "Evening check-in! Have you had dinner yet?",
    followUpSuccess: "Perfect! Finishing meals at a reasonable time helps with sleep quality too.",
    followUpSkip: "Okay! Just making sure you're taking care of yourself.",
    icon: Utensils,
    color: "bg-green-100 border-green-300 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300",
  },
  protein_check: {
    coachMessage: "I noticed you're a bit behind on protein today. Any plans to catch up?",
    followUpSuccess: "Great! Protein is so important for recovery and maintaining muscle.",
    followUpSkip: "No problem! Some days are harder than others. We'll get it tomorrow!",
    icon: Target,
    color: "bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-300",
  },
  // Celebration prompts
  streak_celebration_3: {
    coachMessage: "🎉 3 days in a row! You're building a real habit here!",
    followUpSuccess: "That's the spirit! Consistency beats perfection every time.",
    followUpSkip: "Keep that momentum going! You're doing great!",
    icon: Trophy,
    color: "bg-yellow-100 border-yellow-300 text-yellow-700 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-300",
  },
  streak_celebration_7: {
    coachMessage: "🔥 ONE FULL WEEK! This is a huge milestone!",
    followUpSuccess: "I'm so proud of you! A week of consistency is no small feat.",
    followUpSkip: "You're crushing it! The first week is the hardest.",
    icon: Trophy,
    color: "bg-yellow-100 border-yellow-300 text-yellow-700 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-300",
  },
  workout_streak: {
    coachMessage: "💪 Multiple workouts this week! Your consistency is paying off!",
    followUpSuccess: "I love hearing how your body feels. This helps me tailor your program!",
    followUpSkip: "Keep listening to your body - you know it best!",
    icon: Dumbbell,
    color: "bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300",
  },
  // Pattern-based concern prompts
  low_sleep_pattern: {
    coachMessage: "I've noticed your sleep has been under 6 hours lately. Is everything okay?",
    followUpSuccess: "Thanks for sharing. Sleep is foundational - let's work on this together.",
    followUpSkip: "I understand. I'm here whenever you want to talk about it.",
    icon: BedDouble,
    color: "bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-800 dark:text-indigo-300",
  },
  high_stress_pattern: {
    coachMessage: "Your stress levels have been elevated this week. How can I support you?",
    followUpSuccess: "I'm here for you! Let's focus on what we can control.",
    followUpSkip: "Remember, I'm always here if you need to talk or want some stress-relief ideas.",
    icon: AlertCircle,
    color: "bg-red-100 border-red-300 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300",
  },
  low_activity_check: {
    coachMessage: "I noticed no workouts logged this week. Is that intentional?",
    followUpSuccess: "Thanks for letting me know! Context helps me support you better.",
    followUpSkip: "No judgment here - life happens. I'm here when you're ready!",
    icon: Activity,
    color: "bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-950/30 dark:border-gray-800 dark:text-gray-300",
  },
};

// Animation variants
const optionVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export function CoachConversationModal({ prompt, open, onClose }: CoachConversationModalProps) {
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherText, setOtherText] = useState("");
  const otherInputRef = useRef<HTMLInputElement>(null);

  // Reset state when prompt changes (new question)
  useEffect(() => {
    setSelectedValue(null);
    setShowFollowUp(false);
    setIsSkipping(false);
    setShowOtherInput(false);
    setOtherText("");
  }, [prompt.promptKey]);

  // Focus the input when "Other" is selected
  useEffect(() => {
    if (showOtherInput && otherInputRef.current) {
      otherInputRef.current.focus();
    }
  }, [showOtherInput]);

  // Get conversational config, handling dynamic daily prompt keys (e.g., daily_sleep_2025-12-28)
  const getConversationalConfig = () => {
    // First check for exact match
    if (conversationalPrompts[prompt.promptKey]) {
      return conversationalPrompts[prompt.promptKey];
    }

    // Pattern matching for date-suffixed prompts (remove _YYYY-MM-DD suffix)
    const promptPatterns = [
      // Daily check-ins
      { prefix: "daily_sleep_", config: "daily_sleep" },
      { prefix: "daily_mood_", config: "daily_mood" },
      { prefix: "daily_energy_", config: "daily_energy" },
      { prefix: "daily_stress_", config: "daily_stress" },
      // Morning prompts
      { prefix: "morning_intention_", config: "morning_intention" },
      { prefix: "breakfast_check_", config: "breakfast_check" },
      // Midday prompts
      { prefix: "lunch_check_", config: "lunch_check" },
      { prefix: "hydration_check_", config: "hydration_check" },
      // Afternoon prompts
      { prefix: "workout_check_", config: "workout_check" },
      { prefix: "afternoon_energy_", config: "afternoon_energy" },
      // Evening prompts
      { prefix: "dinner_check_", config: "dinner_check" },
      { prefix: "protein_check_", config: "protein_check" },
      // Celebration prompts
      { prefix: "streak_celebration_3_", config: "streak_celebration_3" },
      { prefix: "streak_celebration_7_", config: "streak_celebration_7" },
      { prefix: "workout_streak_", config: "workout_streak" },
      // Pattern-based prompts
      { prefix: "low_sleep_pattern_", config: "low_sleep_pattern" },
      { prefix: "high_stress_pattern_", config: "high_stress_pattern" },
      { prefix: "low_activity_check_", config: "low_activity_check" },
    ];

    for (const pattern of promptPatterns) {
      if (prompt.promptKey.startsWith(pattern.prefix)) {
        return conversationalPrompts[pattern.config];
      }
    }

    // Default fallback
    return {
      coachMessage: prompt.question,
      followUpSuccess: "Thanks for letting me know!",
      followUpSkip: "No problem, we can skip this for now.",
      icon: Activity,
      color: "bg-gray-100 border-gray-300 text-gray-700",
    };
  };

  const conversational = getConversationalConfig();

  const Icon = conversational.icon;

  // Mutation for submitting the prompt response
  const submitMutation = useMutation({
    mutationFn: async ({ value, skipped }: { value?: string; skipped: boolean }) => {
      const response = await apiRequest("POST", "/api/onboarding/progressive", {
        promptKey: prompt.promptKey,
        value: value ? { selected: value } : null,
        skipped,
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh the next prompt check
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/next-prompt"] });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/progressive"] });

      // Check if there's another prompt waiting
      const hasNextPrompt = data?.nextPrompt != null;

      // Reduced delays for snappier UX
      setTimeout(() => {
        if (!hasNextPrompt) {
          onClose();
        }
        // If there's a next prompt, the query invalidation will update the prompt prop
        // and the useEffect will reset the state for the new question
      }, hasNextPrompt ? 800 : 1200);
    },
    onError: () => {
      // Still close modal on error after showing follow-up
      setTimeout(() => {
        onClose();
      }, 1200);
    },
  });

  const handleSelect = (value: string) => {
    setSelectedValue(value);

    // If "other" is selected, show the text input instead of submitting
    if (value === "other") {
      setShowOtherInput(true);
      return;
    }

    setShowFollowUp(true);
    submitMutation.mutate({ value, skipped: false });
  };

  const handleOtherSubmit = () => {
    if (!otherText.trim()) return;

    setShowOtherInput(false);
    setShowFollowUp(true);
    // Submit with "other:" prefix so backend knows it's a custom value
    submitMutation.mutate({ value: `other: ${otherText.trim()}`, skipped: false });
  };

  const handleOtherKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && otherText.trim()) {
      handleOtherSubmit();
    }
  };

  const handleSkip = () => {
    setIsSkipping(true);
    setShowFollowUp(true);
    submitMutation.mutate({ skipped: true });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <CoachAvatar state={showFollowUp ? "nodding" : "idle"} size="sm" />
            <div>
              <p className="font-medium">Your Coach</p>
              <p className="text-xs text-muted-foreground">has a quick question</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Coach message */}
          <ChatBubble animate={false}>
            <TypewriterText
              text={conversational.coachMessage}
              speed={10}
              showCursor={false}
              className="text-sm"
            />
          </ChatBubble>

          {/* Options grid */}
          {!showFollowUp && !showOtherInput && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 gap-2"
            >
              {prompt.options.map((option) => (
                <motion.button
                  key={option.value}
                  variants={optionVariants}
                  onClick={() => handleSelect(option.value)}
                  disabled={submitMutation.isPending}
                  className={cn(
                    "relative p-3 rounded-lg border-2 text-left transition-all",
                    "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    selectedValue === option.value
                      ? conversational.color + " border-current"
                      : "bg-background border-muted hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        selectedValue === option.value
                          ? "bg-current/20"
                          : "bg-muted"
                      )}
                    >
                      <Icon className={cn(
                        "w-4 h-4",
                        selectedValue === option.value ? "" : "text-muted-foreground"
                      )} />
                    </div>
                    <span className="text-sm font-medium line-clamp-2">{option.label}</span>
                  </div>
                  {selectedValue === option.value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1 right-1 w-4 h-4 rounded-full bg-current flex items-center justify-center"
                    >
                      <Check className="w-2.5 h-2.5 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* "Other" text input */}
          <AnimatePresence>
            {showOtherInput && !showFollowUp && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <p className="text-sm text-muted-foreground">
                  Tell me more - what would you like me to know?
                </p>
                <div className="flex gap-2">
                  <Input
                    ref={otherInputRef}
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    onKeyDown={handleOtherKeyPress}
                    placeholder="Type your answer..."
                    className="flex-1"
                    disabled={submitMutation.isPending}
                  />
                  <Button
                    size="icon"
                    onClick={handleOtherSubmit}
                    disabled={!otherText.trim() || submitMutation.isPending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowOtherInput(false);
                    setSelectedValue(null);
                    setOtherText("");
                  }}
                  className="text-muted-foreground"
                >
                  Go back to options
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Follow-up message */}
          <AnimatePresence>
            {showFollowUp && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <ChatBubble delay={0.1}>
                  <span className="text-sm">
                    {isSkipping
                      ? conversational.followUpSkip
                      : conversational.followUpSuccess}
                  </span>
                </ChatBubble>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skip button */}
          {!showFollowUp && !showOtherInput && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                disabled={submitMutation.isPending}
                className="text-muted-foreground"
              >
                {prompt.skipLabel || "Skip for now"}
              </Button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
