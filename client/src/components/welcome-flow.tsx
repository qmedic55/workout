import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Sparkles,
  Flame,
  Dumbbell,
  Utensils,
  ArrowRight,
  Target,
  TrendingUp,
  X,
} from "lucide-react";

interface UserProfile {
  firstName: string | null;
  currentPhase: string | null;
  targetCalories: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatGrams: number | null;
  dailyStepsTarget: number | null;
}

interface DayOneInsightResponse {
  insight: string;
}

export function WelcomeFlow({
  profile,
  onDismiss,
}: {
  profile: UserProfile;
  onDismiss: () => void;
}) {
  const [step, setStep] = useState(0);

  const { data: dayOneInsight } = useQuery<DayOneInsightResponse>({
    queryKey: ["/api/insights/day-one"],
  });

  const phaseLabels: Record<string, { label: string; description: string }> = {
    recovery: {
      label: "Metabolic Recovery",
      description: "Eating at or above maintenance to restore your metabolism",
    },
    recomp: {
      label: "Body Recomposition",
      description: "Building muscle while gradually losing fat",
    },
    cutting: {
      label: "Fat Loss",
      description: "Sustainable calorie deficit while preserving muscle",
    },
    assessment: {
      label: "Getting Started",
      description: "Setting up your personalized plan",
    },
  };

  const currentPhaseInfo = phaseLabels[profile.currentPhase || 'assessment'] || phaseLabels.assessment;

  if (step === 0) {
    return (
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Welcome
            </Badge>
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardTitle className="text-2xl">
            Welcome to VitalPath, {profile.firstName}!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-background/80 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Your Personalized Plan
            </h3>

            <p className="text-sm text-muted-foreground">
              Based on your goals and lifestyle, here's your starting point:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{profile.targetCalories}</p>
                <p className="text-xs text-muted-foreground">Daily Calories</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{profile.proteinGrams}g</p>
                <p className="text-xs text-muted-foreground">Protein</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{profile.carbsGrams}g</p>
                <p className="text-xs text-muted-foreground">Carbs</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{profile.fatGrams}g</p>
                <p className="text-xs text-muted-foreground">Fat</p>
              </div>
            </div>

            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Your Phase: {currentPhaseInfo.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{currentPhaseInfo.description}</p>
            </div>
          </div>

          <Button onClick={() => setStep(1)} className="w-full">
            See Your First Insight <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 1) {
    return (
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Your First Insight
            </Badge>
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardTitle className="text-xl">AI Coach Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-background/80 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm leading-relaxed">
                {dayOneInsight?.insight || "Analyzing your profile to generate personalized insights..."}
              </p>
            </div>
          </div>

          <Button onClick={() => setStep(2)} className="w-full">
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Let's Get Started
          </Badge>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardTitle className="text-xl">What would you like to do first?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Pick one to get started. There's no wrong choice!
        </p>

        <div className="space-y-3">
          <Link href="/nutrition">
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={onDismiss}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                  <Utensils className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Log Your First Meal</p>
                  <p className="text-xs text-muted-foreground">Start tracking your nutrition</p>
                </div>
              </div>
            </Button>
          </Link>

          <Link href="/workouts">
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={onDismiss}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                  <Dumbbell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Start a Workout</p>
                  <p className="text-xs text-muted-foreground">Browse workout templates</p>
                </div>
              </div>
            </Button>
          </Link>

          <Button
            variant="outline"
            className="w-full justify-start h-auto p-4"
            onClick={onDismiss}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900">
                <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-left">
                <p className="font-medium">Explore the App</p>
                <p className="text-xs text-muted-foreground">Take a look around first</p>
              </div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
