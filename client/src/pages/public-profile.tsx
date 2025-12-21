import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Target,
  Flame,
  Dumbbell,
  Trophy,
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
} from "lucide-react";

interface PublicProfileData {
  username: string;
  displayName: string;
  bio: string | null;
  currentWeight?: number;
  targetWeight?: number;
  currentStreak?: number;
  workoutsLast30Days?: number;
  activeGoals?: number;
  completedGoals?: number;
  completedMilestones?: number;
  weightChange30Days?: number;
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <Skeleton className="h-24 w-24 rounded-full mx-auto" />
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
        <Skeleton className="h-16 w-full max-w-md mx-auto" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  trend?: "up" | "down" | null;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{value}</p>
              {trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
              {trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
            </div>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PublicProfile() {
  const params = useParams<{ username: string }>();
  const username = params.username;

  const { data: profile, isLoading, error } = useQuery<PublicProfileData>({
    queryKey: [`/api/u/${username}`],
    enabled: !!username,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="p-6 max-w-4xl mx-auto">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <User className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground">
              This profile doesn't exist or is set to private.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        {/* Profile Header */}
        <div className="text-center space-y-4">
          <div className="h-24 w-24 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
            <User className="h-12 w-12 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile.displayName}</h1>
            <p className="text-muted-foreground">@{profile.username}</p>
          </div>
          {profile.bio && (
            <p className="text-muted-foreground max-w-md mx-auto">{profile.bio}</p>
          )}
          <Badge variant="outline" className="mt-2">
            VitalPath Member
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profile.currentStreak !== undefined && (
            <StatCard
              icon={Flame}
              label="Current Streak"
              value={`${profile.currentStreak} days`}
              subtext="Consecutive days logged"
            />
          )}

          {profile.workoutsLast30Days !== undefined && (
            <StatCard
              icon={Dumbbell}
              label="Workouts"
              value={profile.workoutsLast30Days}
              subtext="Last 30 days"
            />
          )}

          {profile.activeGoals !== undefined && (
            <StatCard
              icon={Target}
              label="Active Goals"
              value={profile.activeGoals}
              subtext={
                profile.completedGoals !== undefined
                  ? `${profile.completedGoals} completed`
                  : undefined
              }
            />
          )}

          {profile.completedMilestones !== undefined && (
            <StatCard
              icon={Trophy}
              label="Milestones"
              value={profile.completedMilestones}
              subtext="Completed"
            />
          )}

          {profile.weightChange30Days !== undefined && (
            <StatCard
              icon={Scale}
              label="30-Day Change"
              value={`${profile.weightChange30Days > 0 ? "+" : ""}${profile.weightChange30Days.toFixed(1)} kg`}
              trend={profile.weightChange30Days < 0 ? "down" : profile.weightChange30Days > 0 ? "up" : null}
            />
          )}

          {profile.currentWeight !== undefined && (
            <StatCard
              icon={Scale}
              label="Current Weight"
              value={`${profile.currentWeight} kg`}
              subtext={
                profile.targetWeight !== undefined
                  ? `Target: ${profile.targetWeight} kg`
                  : undefined
              }
            />
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Tracking progress with{" "}
            <a href="/" className="text-primary hover:underline font-medium">
              VitalPath
            </a>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Science-based health coaching for adults 40+
          </p>
        </div>
      </div>
    </div>
  );
}
