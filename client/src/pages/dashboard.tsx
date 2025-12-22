import { useEffect, useState, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueries } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { QuickNote } from "@/components/quick-note";
import { MilestoneCelebration, MilestoneProgress } from "@/components/milestone-celebration";
import { WelcomeFlow } from "@/components/welcome-flow";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Scale,
  Flame,
  Footprints,
  Moon,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageCircle,
  Target,
  Zap,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import type { UserProfile, DailyLog, FoodEntry } from "@shared/schema";

// Lazy load heavy components to improve initial load time
const HealthInsights = lazy(() => import("@/components/health-insights").then(m => ({ default: m.HealthInsights })));
const DailyGuidance = lazy(() => import("@/components/daily-guidance").then(m => ({ default: m.DailyGuidance })));
const RestDayCard = lazy(() => import("@/components/rest-day-card").then(m => ({ default: m.RestDayCard })));

function MetricCard({
  title,
  value,
  unit,
  target,
  icon: Icon,
  trend,
  trendValue,
  color = "primary",
  showConsumedFormat = false,
}: {
  title: string;
  value: number | string;
  unit?: string;
  target?: number;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "primary" | "chart-1" | "chart-2" | "chart-3" | "chart-4";
  showConsumedFormat?: boolean;
}) {
  const numValue = typeof value === "string" ? parseFloat(value.replace(/,/g, "")) || 0 : value;
  const progress = target ? (numValue / target) * 100 : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg bg-${color}/10`}>
          <Icon className={`h-4 w-4 text-${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          {showConsumedFormat && target ? (
            <>
              <span className="text-3xl font-bold" data-testid={`text-${title.toLowerCase().replace(" ", "-")}`}>
                {typeof value === "number" ? value.toLocaleString() : value}
              </span>
              <span className="text-lg text-muted-foreground">/ {target.toLocaleString()}</span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </>
          ) : (
            <>
              <span className="text-3xl font-bold" data-testid={`text-${title.toLowerCase().replace(" ", "-")}`}>
                {value}
              </span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </>
          )}
        </div>

        {target && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-1.5" />
          </div>
        )}

        {trend && trendValue && (
          <div className="flex items-center gap-1 mt-2">
            {trend === "up" && <TrendingUp className="h-3 w-3 text-chart-1" />}
            {trend === "down" && <TrendingDown className="h-3 w-3 text-destructive" />}
            {trend === "neutral" && <Minus className="h-3 w-3 text-muted-foreground" />}
            <span className={`text-xs ${trend === "up" ? "text-chart-1" : trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PhaseEvaluation {
  currentPhase: string;
  weeksInPhase: number;
  readyForTransition: boolean;
  suggestedPhase: string | null;
  reason: string;
  biofeedbackScore: number;
}

function PhaseCard({ phase, startDate }: { phase: string; startDate?: string }) {
  const { data: phaseEval } = useQuery<PhaseEvaluation>({
    queryKey: ["/api/phase-evaluation"],
    staleTime: 60000, // Cache for 1 minute
  });

  const phaseInfo: Record<string, { label: string; description: string; color: string; nextPhase?: string }> = {
    assessment: {
      label: "Assessment",
      description: "Getting to know you and your goals",
      color: "bg-chart-2",
      nextPhase: "recovery",
    },
    recovery: {
      label: "Recovery Phase",
      description: "Metabolic reset and reverse dieting",
      color: "bg-chart-4",
      nextPhase: "recomp",
    },
    recomp: {
      label: "Recomposition",
      description: "Building muscle while losing fat",
      color: "bg-chart-1",
      nextPhase: "cutting",
    },
    cutting: {
      label: "Fat Loss Phase",
      description: "Sustainable caloric deficit",
      color: "bg-chart-3",
      nextPhase: "recovery",
    },
  };

  const info = phaseInfo[phase] || phaseInfo.assessment;
  const nextPhaseInfo = info.nextPhase ? phaseInfo[info.nextPhase] : null;

  // Calculate weeks in phase
  const weeksInPhase = phaseEval?.weeksInPhase ?? (startDate
    ? Math.floor((Date.now() - new Date(startDate).getTime()) / (7 * 24 * 60 * 60 * 1000))
    : 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Current Phase
        </CardTitle>
        <Badge variant="secondary" className="text-xs">
          {weeksInPhase > 0 ? `Week ${weeksInPhase}` : "Getting Started"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${info.color}`} />
          <div>
            <p className="font-semibold text-lg" data-testid="text-current-phase">{info.label}</p>
            <p className="text-sm text-muted-foreground">{info.description}</p>
          </div>
        </div>

        {/* Next phase projection */}
        {nextPhaseInfo && phase !== "assessment" && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ArrowRight className="h-3 w-3" />
              <span>Next: <span className="font-medium">{nextPhaseInfo.label}</span></span>
            </div>
            {phaseEval?.readyForTransition ? (
              <p className="text-xs text-green-600 mt-1">
                Ready for transition! Sync to apply.
              </p>
            ) : phaseEval?.reason ? (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {phaseEval.reason}
              </p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
        <CardDescription>What would you like to do today?</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Link href="/daily-log">
          <Button variant="outline" className="w-full justify-between" data-testid="button-log-today">
            <span className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Log Today's Data
            </span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href="/chat">
          <Button variant="outline" className="w-full justify-between" data-testid="button-chat-mentor">
            <span className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat with AI Mentor
            </span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href="/nutrition">
          <Button variant="outline" className="w-full justify-between" data-testid="button-log-food">
            <span className="flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Log Food
            </span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function WelcomeCard({ profile }: { profile?: UserProfile }) {
  const firstName = profile?.firstName || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold" data-testid="text-greeting">
              {greeting}, {firstName}!
            </h2>
            <p className="text-muted-foreground mt-1">
              {profile?.onboardingCompleted
                ? "Let's continue your health journey today."
                : "Welcome to VitalPath! Let's get started with your personalized plan."}
            </p>
          </div>
          <div className="hidden sm:block">
            <Zap className="h-12 w-12 text-primary/50" />
          </div>
        </div>
        
        {!profile?.onboardingCompleted && (
          <Link href="/onboarding">
            <Button className="mt-4" data-testid="button-start-onboarding">
              Start Your Assessment
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];

  // State for first-time welcome flow
  const [showWelcomeFlow, setShowWelcomeFlow] = useState(false);

  // Parallel data fetching for better performance
  const results = useQueries({
    queries: [
      {
        queryKey: ["/api/profile"],
        staleTime: 5 * 60 * 1000, // 5 minutes - profile rarely changes
      },
      {
        queryKey: ["/api/daily-logs/today"],
        staleTime: 30 * 1000, // 30 seconds - may be updated by food logging
      },
      {
        queryKey: ["/api/food-entries", today],
        staleTime: 10 * 1000, // 10 seconds - changes when food is logged
      },
    ],
  });

  const profile = results[0].data as UserProfile | undefined;
  const profileLoading = results[0].isLoading;
  const todayLog = results[1].data as DailyLog | undefined;
  const logLoading = results[1].isLoading;
  const foodEntries = (results[2].data as FoodEntry[] | undefined) || [];

  // Calculate nutrition from food entries directly for most accurate display
  const todayNutrition = {
    calories: foodEntries.reduce((sum, e) => sum + (e.calories || 0), 0),
    protein: foodEntries.reduce((sum, e) => sum + (e.proteinGrams || 0), 0),
    carbs: foodEntries.reduce((sum, e) => sum + (e.carbsGrams || 0), 0),
    fat: foodEntries.reduce((sum, e) => sum + (e.fatGrams || 0), 0),
  };

  // AI Sync mutation - analyzes all data and applies updates
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/sync");
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate all relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-logs/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });

      if (data.appliedChanges && data.appliedChanges.length > 0) {
        toast({
          title: "Plan updated",
          description: `AI made ${data.appliedChanges.length} adjustment(s) to your plan.`,
        });
      } else {
        toast({
          title: "Sync complete",
          description: "Your data is up to date. No changes needed.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Auto-redirect unonboarded users to onboarding
  useEffect(() => {
    if (!profileLoading && profile && !profile.onboardingCompleted) {
      navigate("/onboarding");
    }
  }, [profile, profileLoading, navigate]);

  // Check if this is a first-time visit after onboarding
  useEffect(() => {
    if (profile?.onboardingCompleted) {
      const welcomeShown = localStorage.getItem("vitalpath_welcome_shown");
      if (!welcomeShown) {
        setShowWelcomeFlow(true);
      }
    }
  }, [profile]);

  const handleDismissWelcome = () => {
    localStorage.setItem("vitalpath_welcome_shown", "true");
    setShowWelcomeFlow(false);
  };

  const isLoading = profileLoading || logLoading;

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Milestone Celebration Modal - auto-shows when milestones are achieved */}
      <MilestoneCelebration />

      {/* Header with Sync Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your health journey at a glance</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="gap-2"
          data-testid="button-sync"
        >
          <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
          {syncMutation.isPending ? "Syncing..." : "Sync"}
        </Button>
      </div>

      {/* Quick Note - always visible at top for quick logging */}
      {profile?.onboardingCompleted && <QuickNote />}

      {/* First-time Welcome Flow - shows after completing onboarding */}
      {showWelcomeFlow && profile && (
        <WelcomeFlow profile={profile} onDismiss={handleDismissWelcome} />
      )}

      {/* Milestone Progress - shows progress through first week */}
      {profile?.onboardingCompleted && !showWelcomeFlow && <MilestoneProgress />}

      {/* Show WelcomeCard for new users, DailyGuidance for onboarded users */}
      {!profile?.onboardingCompleted ? (
        <WelcomeCard profile={profile} />
      ) : !showWelcomeFlow ? (
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <DailyGuidance />
        </Suspense>
      ) : null}

      {/* Rest Day Recommendation - shows when rest is suggested */}
      {profile?.onboardingCompleted && (
        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <RestDayCard variant="full" />
        </Suspense>
      )}

      {/* Quick metrics - only show for onboarded users */}
      {profile?.onboardingCompleted && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Weight"
            value={todayLog?.weightKg?.toFixed(1) || profile?.currentWeightKg?.toFixed(1) || "--"}
            unit="kg"
            icon={Scale}
            trend={todayLog?.weightKg ? "down" : undefined}
            trendValue={todayLog?.weightKg ? "-0.3 this week" : undefined}
          />
          <MetricCard
            title="Calories"
            value={todayNutrition.calories}
            unit="kcal"
            target={profile?.targetCalories || 2000}
            icon={Flame}
            color="chart-4"
            showConsumedFormat={true}
          />
          <MetricCard
            title="Steps"
            value={todayLog?.steps || 0}
            target={profile?.dailyStepsTarget || 8000}
            icon={Footprints}
            color="chart-2"
            showConsumedFormat={true}
          />
          <MetricCard
            title="Sleep"
            value={todayLog?.sleepHours?.toFixed(1) || "--"}
            unit="hrs"
            icon={Moon}
            trend={todayLog?.sleepHours && todayLog.sleepHours >= 7 ? "up" : todayLog?.sleepHours ? "down" : undefined}
            trendValue={todayLog?.sleepQuality ? `Quality: ${todayLog.sleepQuality}/10` : undefined}
            color="chart-3"
          />
        </div>
      )}

      {profile?.onboardingCompleted && (
        <div className="grid gap-6 md:grid-cols-2">
          <PhaseCard
            phase={profile?.currentPhase || "assessment"}
            startDate={profile?.phaseStartDate || undefined}
          />
          <QuickActionCard />
        </div>
      )}

      {profile?.onboardingCompleted && (
        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <HealthInsights limit={3} />
        </Suspense>
      )}

      {profile?.targetCalories && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Nutrition Targets</CardTitle>
            <CardDescription>Track your macros to stay on target</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Protein</span>
                  <span className="text-muted-foreground">
                    {todayNutrition.protein.toFixed(0)}g / {profile.proteinGrams}g
                  </span>
                </div>
                <Progress
                  value={profile.proteinGrams ? (todayNutrition.protein / profile.proteinGrams) * 100 : 0}
                  className="h-2 bg-chart-1/20"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Carbs</span>
                  <span className="text-muted-foreground">
                    {todayNutrition.carbs.toFixed(0)}g / {profile.carbsGrams}g
                  </span>
                </div>
                <Progress
                  value={profile.carbsGrams ? (todayNutrition.carbs / profile.carbsGrams) * 100 : 0}
                  className="h-2 bg-chart-2/20"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Fat</span>
                  <span className="text-muted-foreground">
                    {todayNutrition.fat.toFixed(0)}g / {profile.fatGrams}g
                  </span>
                </div>
                <Progress
                  value={profile.fatGrams ? (todayNutrition.fat / profile.fatGrams) * 100 : 0}
                  className="h-2 bg-chart-4/20"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
