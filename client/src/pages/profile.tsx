import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import {
  User,
  Target,
  Flame,
  Footprints,
  Moon,
  Activity,
  TrendingUp,
  Calendar,
  Settings,
  Dumbbell,
  Utensils,
} from "lucide-react";
import { format } from "date-fns";
import type { UserProfile, OnboardingAssessment, DailyLog } from "@shared/schema";

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  );
}

const phaseColors: Record<string, string> = {
  recovery: "bg-purple-500/10 text-purple-600 border-purple-300",
  recomp: "bg-blue-500/10 text-blue-600 border-blue-300",
  cutting: "bg-orange-500/10 text-orange-600 border-orange-300",
  assessment: "bg-gray-500/10 text-gray-600 border-gray-300",
};

const phaseDescriptions: Record<string, string> = {
  recovery: "Metabolic Recovery - Restoring metabolic health",
  recomp: "Body Recomposition - Building muscle while managing fat",
  cutting: "Fat Loss Phase - Strategic calorie deficit",
  assessment: "Initial Assessment - Getting to know your needs",
};

export default function Profile() {
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
  });

  const { data: assessment } = useQuery<OnboardingAssessment>({
    queryKey: ["/api/onboarding/assessment"],
  });

  const { data: recentLogs } = useQuery<DailyLog[]>({
    queryKey: ["/api/daily-logs"],
  });

  if (profileLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <ProfileSkeleton />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground mb-4">
              Complete onboarding to set up your profile.
            </p>
            <Button asChild>
              <Link href="/onboarding">Start Onboarding</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPhase = profile.currentPhase || "assessment";
  const initials = `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.toUpperCase() || "VP";
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "VitalPath User";

  // Calculate weight progress
  const weightProgress = profile.targetWeightKg && profile.currentWeightKg
    ? Math.max(0, Math.min(100, 100 - Math.abs(profile.currentWeightKg - profile.targetWeightKg) / profile.currentWeightKg * 100))
    : null;

  // Get today's log stats
  const todayLog = recentLogs?.[0];
  const calorieProgress = todayLog?.caloriesConsumed && profile.targetCalories
    ? Math.round((todayLog.caloriesConsumed / profile.targetCalories) * 100)
    : 0;
  const proteinProgress = todayLog?.proteinGrams && profile.proteinGrams
    ? Math.round((todayLog.proteinGrams / profile.proteinGrams) * 100)
    : 0;
  const stepsProgress = todayLog?.steps && profile.dailyStepsTarget
    ? Math.round((todayLog.steps / profile.dailyStepsTarget) * 100)
    : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary">
            <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{fullName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={phaseColors[currentPhase]}>
                {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)} Phase
              </Badge>
              {profile.age && (
                <span className="text-sm text-muted-foreground">
                  {profile.age} years old
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {phaseDescriptions[currentPhase]}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/settings">
            <Settings className="h-4 w-4 mr-2" />
            Edit Profile
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Weight</p>
                <p className="text-xl font-semibold">
                  {profile.currentWeightKg ? `${profile.currentWeightKg} kg` : "Not set"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Target Weight</p>
                <p className="text-xl font-semibold">
                  {profile.targetWeightKg ? `${profile.targetWeightKg} kg` : "Not set"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Flame className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Daily Calories</p>
                <p className="text-xl font-semibold">
                  {profile.targetCalories ? `${profile.targetCalories} kcal` : "Not set"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Footprints className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Daily Steps</p>
                <p className="text-xl font-semibold">
                  {profile.dailyStepsTarget?.toLocaleString() || "8,000"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Today's Progress
          </CardTitle>
          <CardDescription>
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span>Calories</span>
              </div>
              <span className="text-muted-foreground">
                {todayLog?.caloriesConsumed || 0} / {profile.targetCalories || "—"} kcal
              </span>
            </div>
            <Progress value={Math.min(calorieProgress, 100)} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-green-500" />
                <span>Protein</span>
              </div>
              <span className="text-muted-foreground">
                {todayLog?.proteinGrams || 0} / {profile.proteinGrams || "—"} g
              </span>
            </div>
            <Progress value={Math.min(proteinProgress, 100)} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Footprints className="h-4 w-4 text-blue-500" />
                <span>Steps</span>
              </div>
              <span className="text-muted-foreground">
                {(todayLog?.steps || 0).toLocaleString()} / {(profile.dailyStepsTarget || 8000).toLocaleString()}
              </span>
            </div>
            <Progress value={Math.min(stepsProgress, 100)} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Nutrition Targets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Macro Targets
          </CardTitle>
          <CardDescription>Your daily nutrition goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-primary">
                {profile.proteinGrams || "—"}
              </p>
              <p className="text-sm text-muted-foreground">Protein (g)</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-primary">
                {profile.carbsGrams || "—"}
              </p>
              <p className="text-sm text-muted-foreground">Carbs (g)</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-primary">
                {profile.fatGrams || "—"}
              </p>
              <p className="text-sm text-muted-foreground">Fat (g)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Summary */}
      {assessment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Assessment Summary
            </CardTitle>
            <CardDescription>From your initial onboarding</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Activity Level</span>
                  <span className="font-medium capitalize">
                    {assessment.activityLevel?.replace("_", " ") || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resistance Training</span>
                  <span className="font-medium">
                    {assessment.doesResistanceTraining
                      ? `${assessment.resistanceTrainingFrequency}x/week`
                      : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Sleep</span>
                  <span className="font-medium">
                    {assessment.averageSleepHours ? `${assessment.averageSleepHours} hours` : "Not set"}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stress Level</span>
                  <span className="font-medium">
                    {assessment.stressLevel ? `${assessment.stressLevel}/10` : "Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metabolic State</span>
                  <span className="font-medium capitalize">
                    {assessment.metabolicState?.replace("_", " ") || "Not assessed"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recent Dieting</span>
                  <span className="font-medium">
                    {assessment.hasBeenDietingRecently
                      ? `Yes (${assessment.dietingDurationMonths} months)`
                      : "No"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/chat">
            <Dumbbell className="h-4 w-4 mr-2" />
            Talk to Coach
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/daily-log">
            <Calendar className="h-4 w-4 mr-2" />
            Log Today
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/progress">
            <TrendingUp className="h-4 w-4 mr-2" />
            View Progress
          </Link>
        </Button>
      </div>
    </div>
  );
}
