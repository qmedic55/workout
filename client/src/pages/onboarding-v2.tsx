import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Sparkles, ChevronRight, ArrowRight } from "lucide-react";

import { CoachAvatar, AvatarState } from "@/components/onboarding/CoachAvatar";
import { TypewriterText } from "@/components/onboarding/TypewriterText";
import { ChatBubble } from "@/components/onboarding/ChatBubble";
import { GoalGrid, GoalType, getGoalAcknowledgment } from "@/components/onboarding/GoalCard";
import { InsightCard, getInsightExplanation } from "@/components/onboarding/InsightCard";
import { CompactForm } from "@/components/onboarding/CompactForm";
import {
  OnboardingProvider,
  useOnboarding,
  calculateInitialTargets,
  clearOnboardingStorage,
  OnboardingData,
} from "@/components/onboarding/OnboardingContext";

// Screen transition variants
const screenVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

// Progress indicator
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            "w-2 h-2 rounded-full transition-colors",
            i + 1 === current ? "bg-primary" : i + 1 < current ? "bg-primary/50" : "bg-muted"
          )}
          animate={i + 1 === current ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
        />
      ))}
    </div>
  );
}

// Screen 1: Coach Introduction
function Screen1({ onContinue }: { onContinue: () => void }) {
  const [showCTA, setShowCTA] = useState(false);
  const { state } = useOnboarding();
  const isReturning = state.isReturningUser;

  const welcomeText = isReturning
    ? `Welcome back! I'm your VitalPath coach. I've got a fresh new look and I'm excited to reconnect with you.`
    : `Hi, I'm your VitalPath coach. I'm here to guide you on your health journey. Ready to get started?`;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <CoachAvatar state="waving" size="lg" />
      </motion.div>

      <div className="mt-8 max-w-sm">
        <TypewriterText
          text={welcomeText}
          speed={25}
          delay={800}
          onComplete={() => setShowCTA(true)}
          className="text-lg text-foreground"
        />
      </div>

      <AnimatePresence>
        {showCTA && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <Button size="lg" onClick={onContinue} className="gap-2">
              Let's Go
              <Sparkles className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Screen 2: Conversational Data
function Screen2({ onContinue }: { onContinue: () => void }) {
  const { state, setName, setMetrics, canProceedFromScreen } = useOnboarding();
  const [phase, setPhase] = useState<"name" | "greeting" | "form">(
    state.data.firstName ? "form" : "name"
  );
  const [nameInput, setNameInput] = useState(state.data.firstName);
  const isReturning = state.isReturningUser;

  const handleNameSubmit = () => {
    if (nameInput.trim()) {
      setName(nameInput.trim());
      setPhase("greeting");
    }
  };

  const greetingText = isReturning
    ? `Great to see you again, ${state.data.firstName || nameInput}! Let me just verify your details are up to date.`
    : `Nice to meet you, ${state.data.firstName || nameInput}! Just a few quick details to personalize your plan.`;

  return (
    <div className="flex flex-col min-h-[70vh] px-6 py-4">
      <div className="flex items-start gap-3 mb-6">
        <CoachAvatar state="idle" size="sm" />
        <div className="flex-1 pt-1">
          {phase === "name" && (
            <ChatBubble>
              <span className="text-sm">What should I call you?</span>
            </ChatBubble>
          )}
          {phase === "greeting" && (
            <TypewriterText
              text={greetingText}
              speed={25}
              onComplete={() => setPhase("form")}
              className="text-sm text-foreground bg-muted px-4 py-3 rounded-2xl rounded-bl-md"
            />
          )}
          {phase === "form" && (
            <ChatBubble animate={false}>
              <span className="text-sm">
                {isReturning ? "Does this look right?" : "Just a few quick details:"}
              </span>
            </ChatBubble>
          )}
        </div>
      </div>

      <div className="flex-1">
        {phase === "name" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Input
              autoFocus
              placeholder="Your first name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
              className="h-12 text-base"
            />
            <Button
              onClick={handleNameSubmit}
              disabled={!nameInput.trim()}
              className="w-full"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        )}

        {phase === "form" && (
          <>
            <CompactForm
              data={{
                age: state.data.age,
                sex: state.data.sex,
                heightCm: state.data.heightCm,
                currentWeightKg: state.data.currentWeightKg,
              }}
              onChange={setMetrics}
              className="mb-6"
            />
            <Button
              onClick={onContinue}
              disabled={!canProceedFromScreen(2)}
              className="w-full"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// Screen 3: Goal Discovery
function Screen3({ onContinue }: { onContinue: () => void }) {
  const { state, setGoal } = useOnboarding();
  const [showAcknowledgment, setShowAcknowledgment] = useState(false);

  const handleGoalSelect = (goal: GoalType) => {
    setGoal(goal);
    setShowAcknowledgment(true);
  };

  return (
    <div className="flex flex-col min-h-[70vh] px-6 py-4">
      <div className="flex items-start gap-3 mb-6">
        <CoachAvatar state={showAcknowledgment ? "nodding" : "idle"} size="sm" />
        <div className="flex-1 pt-1">
          <ChatBubble>
            <span className="text-sm">What's your main goal right now?</span>
          </ChatBubble>
        </div>
      </div>

      <div className="flex-1">
        <GoalGrid
          selectedGoal={state.data.goal}
          onSelectGoal={handleGoalSelect}
        />

        <AnimatePresence>
          {showAcknowledgment && state.data.goal && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <ChatBubble delay={0.3}>
                <span className="text-sm">{getGoalAcknowledgment(state.data.goal)}</span>
              </ChatBubble>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-6"
              >
                <Button onClick={onContinue} className="w-full">
                  Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Screen 4: First Insight
function Screen4({ onComplete }: { onComplete: () => void }) {
  const { state, setCalculated } = useOnboarding();
  const [showInsights, setShowInsights] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate targets when screen loads
  useEffect(() => {
    if (state.data.goal && !state.calculated) {
      const targets = calculateInitialTargets(state.data as OnboardingData & { goal: GoalType });
      setCalculated(targets);
    }
  }, [state.data, state.calculated, setCalculated]);

  const insightText = state.calculated && state.data.goal
    ? `Based on what you told me, here's your personalized plan:`
    : "Calculating your personalized plan...";

  return (
    <div className="flex flex-col min-h-[70vh] px-6 py-4">
      <div className="flex items-start gap-3 mb-6">
        <CoachAvatar state={showInsights ? "celebrating" : "thinking"} size="sm" />
        <div className="flex-1 pt-1">
          <TypewriterText
            text={insightText}
            speed={25}
            onComplete={() => setShowInsights(true)}
            className="text-sm text-foreground bg-muted px-4 py-3 rounded-2xl rounded-bl-md"
          />
        </div>
      </div>

      <div className="flex-1">
        <AnimatePresence>
          {showInsights && state.calculated && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <InsightCard
                calories={state.calculated.targetCalories}
                protein={state.calculated.proteinGrams}
                phase={state.calculated.recommendedPhase}
                className="mb-6"
              />

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <ChatBubble delay={0.5}>
                  <span className="text-sm">
                    {getInsightExplanation(
                      state.calculated.recommendedPhase,
                      state.data.goal || "feel_better"
                    )}
                  </span>
                </ChatBubble>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="mt-6"
                >
                  <Button
                    size="lg"
                    onClick={onComplete}
                    disabled={isSubmitting}
                    className="w-full gap-2"
                  >
                    {isSubmitting ? "Setting up..." : "Start My Journey"}
                    <Sparkles className="w-4 h-4" />
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Main onboarding component
function OnboardingV2Content() {
  const { state, nextScreen, prevScreen, reset } = useOnboarding();
  const [direction, setDirection] = useState(1);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Mutation for submitting onboarding data
  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data, calculated } = state;

      // Transform to backend format
      const transformedData = {
        firstName: data.firstName,
        lastName: "",
        age: data.age,
        sex: data.sex,
        heightCm: data.heightCm,
        currentWeightKg: data.currentWeightKg,
        targetWeightKg: data.goal === "lose_weight" ? Math.round(data.currentWeightKg * 0.9) : undefined,
        activityLevel: "sedentary" as const,
        hasBeenDietingRecently: false,
        sleepQuality: 5, // Middle of 1-10 scale
        stressLevel: 5,
        coachingTone: "empathetic" as const,
        enableNotifications: true,
        hasHealthConditions: false,
      };

      const response = await apiRequest("POST", "/api/onboarding", transformedData);
      return response.json();
    },
    onSuccess: (result) => {
      // Clear saved onboarding progress
      clearOnboardingStorage();

      // Store first-day marker for milestones
      try {
        localStorage.setItem("vitalpath_first_day", new Date().toISOString());
        if (result.welcomeBonus) {
          localStorage.setItem("vitalpath_welcome_bonus", JSON.stringify(result.welcomeBonus));
        }
      } catch {
        // localStorage not available
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points"] });

      // Navigate to dashboard
      navigate("/?welcome=true");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    setDirection(1);
    nextScreen();
  };

  const handlePrev = () => {
    setDirection(-1);
    prevScreen();
  };

  const handleComplete = () => {
    submitMutation.mutate();
  };

  const screens = {
    1: <Screen1 onContinue={handleNext} />,
    2: <Screen2 onContinue={handleNext} />,
    3: <Screen3 onContinue={handleNext} />,
    4: <Screen4 onComplete={handleComplete} />,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with progress */}
      <div className="p-4 flex items-center justify-between">
        <div className="w-20">
          {state.screen > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              className="text-muted-foreground"
            >
              Back
            </Button>
          )}
        </div>
        <ProgressDots current={state.screen} total={4} />
        <div className="w-20" />
      </div>

      {/* Screen content with transitions */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={state.screen}
            custom={direction}
            variants={screenVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0"
          >
            {screens[state.screen]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom safe area */}
      <div className="h-8" />
    </div>
  );
}

// Wrapper with provider
export default function OnboardingV2() {
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const isReturning = searchParams.get("returning") === "true";

  return (
    <OnboardingProvider>
      <OnboardingPrefillLoader isReturning={isReturning}>
        <OnboardingV2Content />
      </OnboardingPrefillLoader>
    </OnboardingProvider>
  );
}

// Component to load prefill data for returning users
function OnboardingPrefillLoader({
  isReturning,
  children,
}: {
  isReturning: boolean;
  children: React.ReactNode;
}) {
  const { setPrefill } = useOnboarding();

  // Fetch prefill data for returning users
  const { data: prefillData } = useQuery({
    queryKey: ["/api/onboarding/prefill"],
    enabled: isReturning,
  });

  // Apply prefill data when loaded
  useEffect(() => {
    if (prefillData && isReturning) {
      setPrefill(prefillData as Partial<OnboardingData>, true);
    }
  }, [prefillData, isReturning, setPrefill]);

  return <>{children}</>;
}
