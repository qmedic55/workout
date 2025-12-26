import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Check, Dumbbell, Heart, Moon, Utensils, Activity, Stethoscope } from "lucide-react";

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

  const conversational = conversationalPrompts[prompt.promptKey] || {
    coachMessage: prompt.question,
    followUpSuccess: "Thanks for letting me know!",
    followUpSkip: "No problem, we can skip this for now.",
    icon: Activity,
    color: "bg-gray-100 border-gray-300 text-gray-700",
  };

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
    onSuccess: () => {
      // Invalidate queries to refresh the next prompt check
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/next-prompt"] });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/progressive"] });

      // Close modal after a brief delay to show the follow-up
      setTimeout(() => {
        onClose();
      }, 2000);
    },
    onError: () => {
      // Still close modal on error after showing follow-up
      setTimeout(() => {
        onClose();
      }, 2000);
    },
  });

  const handleSelect = (value: string) => {
    setSelectedValue(value);
    setShowFollowUp(true);
    submitMutation.mutate({ value, skipped: false });
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
              speed={20}
              showCursor={false}
              className="text-sm"
            />
          </ChatBubble>

          {/* Options grid */}
          {!showFollowUp && (
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

          {/* Follow-up message */}
          <AnimatePresence>
            {showFollowUp && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <ChatBubble delay={0.3}>
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
          {!showFollowUp && (
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
