import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  Flame,
  Dumbbell,
  Footprints,
  AlertTriangle,
  Bell,
  PartyPopper,
  HelpCircle,
  Target,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Moon,
  Brain,
  Heart,
  Zap,
  Clock,
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface DailyGuidance {
  greeting: string;
  todaysPlan: {
    nutrition: {
      targetCalories: number;
      targetProtein: number;
      targetCarbs: number;
      targetFat: number;
      consumedCalories: number;
      consumedProtein: number;
      consumedCarbs: number;
      consumedFat: number;
      message: string;
    };
    workout: {
      recommended: boolean;
      type: string | null;
      message: string;
      specificPlan: {
        title: string;
        duration: string;
        exercises: Array<{
          name: string;
          sets?: number;
          reps?: string;
          duration?: string;
          notes?: string;
        }>;
        timing?: string;
        recovery?: string;
      } | null;
    };
    steps: {
      target: number;
      current: number;
      message: string;
    };
    focus: string;
  };
  checkIns: Array<{
    type: "warning" | "reminder" | "celebration" | "question";
    message: string;
    priority: number;
  }>;
  proactiveInsights?: Array<{
    category: "sleep" | "nutrition" | "workout" | "recovery" | "lifestyle";
    insight: string;
    actionable: string;
  }>;
  motivationalMessage: string;
  generatedAt: string;
}

function CheckInIcon({ type }: { type: string }) {
  switch (type) {
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case "reminder":
      return <Bell className="h-4 w-4 text-blue-500" />;
    case "celebration":
      return <PartyPopper className="h-4 w-4 text-green-500" />;
    case "question":
      return <HelpCircle className="h-4 w-4 text-purple-500" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
}

function CheckInBadge({ type }: { type: string }) {
  const variants: Record<string, string> = {
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    reminder: "bg-blue-100 text-blue-800 border-blue-200",
    celebration: "bg-green-100 text-green-800 border-green-200",
    question: "bg-purple-100 text-purple-800 border-purple-200",
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${variants[type] || variants.reminder}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}

function InsightIcon({ category }: { category: string }) {
  switch (category) {
    case "sleep":
      return <Moon className="h-4 w-4 text-indigo-500" />;
    case "nutrition":
      return <Flame className="h-4 w-4 text-orange-500" />;
    case "workout":
      return <Dumbbell className="h-4 w-4 text-blue-500" />;
    case "recovery":
      return <Heart className="h-4 w-4 text-pink-500" />;
    case "lifestyle":
      return <Brain className="h-4 w-4 text-purple-500" />;
    default:
      return <Zap className="h-4 w-4 text-yellow-500" />;
  }
}

function GuidanceSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export function DailyGuidance() {
  const [, navigate] = useLocation();
  const { data: guidance, isLoading, error, refetch, isFetching } = useQuery<DailyGuidance>({
    queryKey: ["/api/daily-guidance"],
    staleTime: 5 * 60 * 1000, // Consider stale after 5 minutes
    refetchOnMount: true,
  });

  const handleStartWorkout = () => {
    if (guidance?.todaysPlan?.workout?.specificPlan) {
      const workoutData = encodeURIComponent(JSON.stringify(guidance.todaysPlan.workout.specificPlan));
      navigate(`/workout-session?workout=${workoutData}`);
    }
  };

  if (isLoading) {
    return <GuidanceSkeleton />;
  }

  if (error || !guidance) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Unable to load daily guidance. Please try again later.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 mx-auto block"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Sort check-ins by priority
  const sortedCheckIns = [...(guidance.checkIns || [])].sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-4">
      {/* AI Greeting Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <Badge variant="secondary" className="text-xs">AI Coach</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 ml-auto"
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/daily-guidance"] });
                    refetch();
                  }}
                  disabled={isFetching}
                >
                  <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
                </Button>
              </div>
              <h2 className="text-xl font-semibold mb-2">{guidance.greeting}</h2>
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-primary" />
                <span className="font-medium">Today's Focus:</span>
                <span className="text-muted-foreground">{guidance.todaysPlan.focus}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Plan Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Nutrition Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-chart-4" />
              <CardTitle className="text-sm">Nutrition</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-center p-2 bg-muted/50 rounded">
                <p className="text-lg font-bold">
                  <span className="text-primary">{guidance.todaysPlan.nutrition.consumedCalories}</span>
                  <span className="text-muted-foreground">/{guidance.todaysPlan.nutrition.targetCalories}</span>
                </p>
                <p className="text-xs text-muted-foreground">Calories</p>
                <Progress
                  value={Math.min(100, (guidance.todaysPlan.nutrition.consumedCalories / guidance.todaysPlan.nutrition.targetCalories) * 100)}
                  className="h-1 mt-1"
                />
              </div>
              <div className="text-center p-2 bg-muted/50 rounded">
                <p className="text-lg font-bold">
                  <span className="text-primary">{guidance.todaysPlan.nutrition.consumedProtein}g</span>
                  <span className="text-muted-foreground">/{guidance.todaysPlan.nutrition.targetProtein}g</span>
                </p>
                <p className="text-xs text-muted-foreground">Protein</p>
                <Progress
                  value={Math.min(100, (guidance.todaysPlan.nutrition.consumedProtein / guidance.todaysPlan.nutrition.targetProtein) * 100)}
                  className="h-1 mt-1"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{guidance.todaysPlan.nutrition.message}</p>
            <Link href="/nutrition">
              <Button variant="outline" size="sm" className="w-full">
                Log Food <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Workout Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-chart-1" />
              <CardTitle className="text-sm">Today's Workout</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {guidance.todaysPlan.workout.recommended && guidance.todaysPlan.workout.specificPlan ? (
              <>
                <div className="p-2 bg-muted/50 rounded">
                  <p className="font-semibold text-sm text-chart-1">
                    {guidance.todaysPlan.workout.specificPlan.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    <span>{guidance.todaysPlan.workout.specificPlan.duration}</span>
                  </div>
                </div>
                {/* Show first 3 exercises as preview */}
                <div className="space-y-1.5">
                  {guidance.todaysPlan.workout.specificPlan.exercises.slice(0, 3).map((exercise, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-muted/30 p-1.5 rounded">
                      <span className="font-medium">{exercise.name}</span>
                      <span className="text-muted-foreground">
                        {exercise.sets && exercise.reps
                          ? `${exercise.sets}×${exercise.reps}`
                          : exercise.duration || ""}
                      </span>
                    </div>
                  ))}
                  {guidance.todaysPlan.workout.specificPlan.exercises.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{guidance.todaysPlan.workout.specificPlan.exercises.length - 3} more exercises
                    </p>
                  )}
                </div>
                {guidance.todaysPlan.workout.specificPlan.timing && (
                  <div className="flex items-start gap-2 text-xs bg-blue-50 dark:bg-blue-950/20 p-2 rounded border border-blue-200 dark:border-blue-800">
                    <Clock className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />
                    <span>{guidance.todaysPlan.workout.specificPlan.timing}</span>
                  </div>
                )}
                <Button variant="default" size="sm" className="w-full" onClick={handleStartWorkout}>
                  Start Workout <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </>
            ) : (
              <>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="text-lg font-bold text-muted-foreground">Rest Day</p>
                  <p className="text-xs text-muted-foreground">Recovery Focus</p>
                </div>
                <p className="text-xs text-muted-foreground">{guidance.todaysPlan.workout.message}</p>
                <Link href="/workouts">
                  <Button variant="outline" size="sm" className="w-full">
                    View Options <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* Steps Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Footprints className="h-4 w-4 text-chart-2" />
              <CardTitle className="text-sm">Steps</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center p-2 bg-muted/50 rounded">
              <p className="text-lg font-bold">
                <span className="text-primary">{(guidance.todaysPlan.steps.current || 0).toLocaleString()}</span>
                <span className="text-muted-foreground">/{guidance.todaysPlan.steps.target.toLocaleString()}</span>
              </p>
              <p className="text-xs text-muted-foreground">Steps Today</p>
              <Progress
                value={Math.min(100, ((guidance.todaysPlan.steps.current || 0) / guidance.todaysPlan.steps.target) * 100)}
                className="h-1 mt-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">{guidance.todaysPlan.steps.message}</p>
            <Link href="/daily-log">
              <Button variant="outline" size="sm" className="w-full">
                Log Activity <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* AI Check-ins */}
      {sortedCheckIns.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Check-ins from your AI Coach
            </CardTitle>
            <CardDescription>Personalized observations based on your recent activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedCheckIns.map((checkIn, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    checkIn.type === "warning"
                      ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20"
                      : checkIn.type === "celebration"
                      ? "bg-green-50 border-green-200 dark:bg-green-950/20"
                      : checkIn.type === "question"
                      ? "bg-purple-50 border-purple-200 dark:bg-purple-950/20"
                      : "bg-blue-50 border-blue-200 dark:bg-blue-950/20"
                  }`}
                >
                  <CheckInIcon type={checkIn.type} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckInBadge type={checkIn.type} />
                    </div>
                    <p className="text-sm">{checkIn.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Proactive Insights */}
      {guidance.proactiveInsights && guidance.proactiveInsights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              Proactive Insights
            </CardTitle>
            <CardDescription>AI recommendations based on your patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {guidance.proactiveInsights.map((insight, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-gradient-to-r from-muted/30 to-muted/10"
                >
                  <InsightIcon category={insight.category} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{insight.insight}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Action:</span> {insight.actionable}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Motivational Message */}
      {guidance.motivationalMessage && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-center italic text-muted-foreground">
              "{guidance.motivationalMessage}"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
