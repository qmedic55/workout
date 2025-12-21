import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
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
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface DailyGuidance {
  greeting: string;
  todaysPlan: {
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      message: string;
    };
    workout: {
      recommended: boolean;
      type: string | null;
      message: string;
    };
    steps: {
      target: number;
      message: string;
    };
    focus: string;
  };
  checkIns: Array<{
    type: "warning" | "reminder" | "celebration" | "question";
    message: string;
    priority: number;
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
  const { data: guidance, isLoading, error, refetch, isFetching } = useQuery<DailyGuidance>({
    queryKey: ["/api/daily-guidance"],
    staleTime: 5 * 60 * 1000, // Consider stale after 5 minutes
    refetchOnMount: true,
  });

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
                <p className="text-lg font-bold">{guidance.todaysPlan.nutrition.calories}</p>
                <p className="text-xs text-muted-foreground">Calories</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded">
                <p className="text-lg font-bold">{guidance.todaysPlan.nutrition.protein}g</p>
                <p className="text-xs text-muted-foreground">Protein</p>
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
              <CardTitle className="text-sm">Workout</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center p-2 bg-muted/50 rounded">
              {guidance.todaysPlan.workout.recommended ? (
                <>
                  <p className="text-lg font-bold text-chart-1">
                    {guidance.todaysPlan.workout.type || "Workout Day"}
                  </p>
                  <p className="text-xs text-muted-foreground">Recommended</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-muted-foreground">Rest Day</p>
                  <p className="text-xs text-muted-foreground">Recovery Focus</p>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{guidance.todaysPlan.workout.message}</p>
            <Link href="/workouts">
              <Button variant="outline" size="sm" className="w-full">
                View Workouts <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
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
              <p className="text-lg font-bold">{guidance.todaysPlan.steps.target.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Target Steps</p>
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
