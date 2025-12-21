import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthInsights } from "@/components/health-insights";
import { DailyGuidance } from "@/components/daily-guidance";
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
import type { UserProfile, DailyLog } from "@shared/schema";

function MetricCard({
  title,
  value,
  unit,
  target,
  icon: Icon,
  trend,
  trendValue,
  color = "primary",
}: {
  title: string;
  value: number | string;
  unit?: string;
  target?: number;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "primary" | "chart-1" | "chart-2" | "chart-3" | "chart-4";
}) {
  const progress = target ? (Number(value) / target) * 100 : 0;
  
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
          <span className="text-3xl font-bold" data-testid={`text-${title.toLowerCase().replace(" ", "-")}`}>
            {value}
          </span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
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

function PhaseCard({ phase, startDate }: { phase: string; startDate?: string }) {
  const phaseInfo: Record<string, { label: string; description: string; color: string }> = {
    assessment: {
      label: "Assessment",
      description: "Getting to know you and your goals",
      color: "bg-chart-2",
    },
    recovery: {
      label: "Recovery Phase",
      description: "Metabolic reset and reverse dieting",
      color: "bg-chart-4",
    },
    recomp: {
      label: "Recomposition",
      description: "Building muscle while losing fat",
      color: "bg-chart-1",
    },
    cutting: {
      label: "Fat Loss Phase",
      description: "Sustainable caloric deficit",
      color: "bg-chart-3",
    },
  };

  const info = phaseInfo[phase] || phaseInfo.assessment;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Current Phase
        </CardTitle>
        <Badge variant="secondary" className="text-xs">
          {startDate ? `Since ${new Date(startDate).toLocaleDateString()}` : "Getting Started"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${info.color}`} />
          <div>
            <p className="font-semibold text-lg" data-testid="text-current-phase">{info.label}</p>
            <p className="text-sm text-muted-foreground">{info.description}</p>
          </div>
        </div>
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

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    staleTime: 30000, // Consider stale after 30 seconds to pick up AI changes
    refetchOnMount: "always", // Always refetch when navigating to this page
  });

  const { data: todayLog, isLoading: logLoading } = useQuery<DailyLog>({
    queryKey: ["/api/daily-logs/today"],
  });

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

      {/* Show WelcomeCard for new users, DailyGuidance for onboarded users */}
      {!profile?.onboardingCompleted ? (
        <WelcomeCard profile={profile} />
      ) : (
        <DailyGuidance />
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
            value={todayLog?.caloriesConsumed || 0}
            unit="kcal"
            target={profile?.targetCalories || 2000}
            icon={Flame}
            color="chart-4"
          />
          <MetricCard
            title="Steps"
            value={todayLog?.steps?.toLocaleString() || "0"}
            target={profile?.dailyStepsTarget || 8000}
            icon={Footprints}
            color="chart-2"
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
        <HealthInsights limit={3} />
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
                    {todayLog?.proteinGrams?.toFixed(0) || 0}g / {profile.proteinGrams}g
                  </span>
                </div>
                <Progress 
                  value={profile.proteinGrams ? ((todayLog?.proteinGrams || 0) / profile.proteinGrams) * 100 : 0} 
                  className="h-2 bg-chart-1/20"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Carbs</span>
                  <span className="text-muted-foreground">
                    {todayLog?.carbsGrams?.toFixed(0) || 0}g / {profile.carbsGrams}g
                  </span>
                </div>
                <Progress 
                  value={profile.carbsGrams ? ((todayLog?.carbsGrams || 0) / profile.carbsGrams) * 100 : 0} 
                  className="h-2 bg-chart-2/20"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Fat</span>
                  <span className="text-muted-foreground">
                    {todayLog?.fatGrams?.toFixed(0) || 0}g / {profile.fatGrams}g
                  </span>
                </div>
                <Progress 
                  value={profile.fatGrams ? ((todayLog?.fatGrams || 0) / profile.fatGrams) * 100 : 0} 
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
