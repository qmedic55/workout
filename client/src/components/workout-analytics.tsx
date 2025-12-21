import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Dumbbell,
  Flame,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Target,
  Clock,
} from "lucide-react";

interface WorkoutSummary {
  totalWorkouts: number;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  averageWorkoutsPerWeek: number;
  favoriteWorkoutType: string;
  totalVolumeKg: number;
}

interface WeeklyTrend {
  week: string;
  weekLabel: string;
  workoutCount: number;
  totalVolume: number;
  avgDuration: number;
}

interface MuscleGroupData {
  muscleGroup: string;
  workouts: number;
  lastTrained: string | null;
  daysSinceLastTrained: number | null;
}

interface ExerciseProgressData {
  exerciseName: string;
  bestWeight: number;
  bestReps: number;
  totalSets: number;
  recentPerformance: {
    date: string;
    weight: number;
    reps: number;
  }[];
  trend: "improving" | "maintaining" | "declining";
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
}

interface WorkoutAnalytics {
  summary: WorkoutSummary;
  weeklyTrends: WeeklyTrend[];
  muscleGroupFrequency: MuscleGroupData[];
  exerciseProgress: ExerciseProgressData[];
  streaks: StreakData;
}

function SummaryCard({ summary, streaks }: { summary: WorkoutSummary; streaks: StreakData }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Workouts</p>
              <p className="text-2xl font-bold">{summary.totalWorkouts}</p>
            </div>
            <Dumbbell className="h-8 w-8 text-primary opacity-80" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {summary.workoutsThisMonth} this month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Weekly Average</p>
              <p className="text-2xl font-bold">{summary.averageWorkoutsPerWeek}</p>
            </div>
            <Calendar className="h-8 w-8 text-chart-2 opacity-80" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {summary.workoutsThisWeek} this week
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Streak</p>
              <p className="text-2xl font-bold">{streaks.currentStreak} days</p>
            </div>
            <Flame className="h-8 w-8 text-orange-500 opacity-80" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Best: {streaks.longestStreak} days
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Volume</p>
              <p className="text-2xl font-bold">{(summary.totalVolumeKg / 1000).toFixed(1)}k</p>
            </div>
            <Trophy className="h-8 w-8 text-yellow-500 opacity-80" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Favorite: {summary.favoriteWorkoutType}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function VolumeChart({ data }: { data: WeeklyTrend[] }) {
  if (data.every(d => d.workoutCount === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weekly Volume</CardTitle>
          <CardDescription>Training volume over the last 8 weeks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            <p>No workout data yet. Start logging workouts to see your progress!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Weekly Volume</CardTitle>
        <CardDescription>Training volume over the last 8 weeks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="weekLabel"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${value.toLocaleString()} kg`, "Volume"]}
              />
              <Bar dataKey="totalVolume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkoutFrequencyChart({ data }: { data: WeeklyTrend[] }) {
  if (data.every(d => d.workoutCount === 0)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Workout Frequency</CardTitle>
        <CardDescription>Workouts per week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="weekLabel"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                domain={[0, "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [value, "Workouts"]}
              />
              <Line
                type="monotone"
                dataKey="workoutCount"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-2))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function MuscleGroupHeatmap({ data }: { data: MuscleGroupData[] }) {
  if (data.length === 0) {
    return null;
  }

  // Define color intensity based on workout count
  const maxWorkouts = Math.max(...data.map(d => d.workouts));

  const getColor = (count: number) => {
    const intensity = count / maxWorkouts;
    if (intensity > 0.75) return "bg-primary text-primary-foreground";
    if (intensity > 0.5) return "bg-primary/70 text-primary-foreground";
    if (intensity > 0.25) return "bg-primary/40";
    return "bg-primary/20";
  };

  const getRecoveryStatus = (daysSince: number | null): string | undefined => {
    if (daysSince === null) return undefined;
    if (daysSince <= 2) return "text-green-600";
    if (daysSince <= 4) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4" />
          Muscle Groups Trained
        </CardTitle>
        <CardDescription>Training frequency by muscle group</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {data.map((muscle) => (
            <div
              key={muscle.muscleGroup}
              className={`px-3 py-2 rounded-lg ${getColor(muscle.workouts)}`}
            >
              <div className="font-medium capitalize text-sm">{muscle.muscleGroup}</div>
              <div className="text-xs opacity-80 flex items-center gap-2">
                <span>{muscle.workouts} sessions</span>
                {muscle.daysSinceLastTrained !== null && (
                  <span className={getRecoveryStatus(muscle.daysSinceLastTrained)}>
                    {muscle.daysSinceLastTrained === 0
                      ? "Today"
                      : muscle.daysSinceLastTrained === 1
                      ? "Yesterday"
                      : `${muscle.daysSinceLastTrained}d ago`}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ExerciseProgressList({ data }: { data: ExerciseProgressData[] }) {
  if (data.length === 0) {
    return null;
  }

  const TrendIcon = ({ trend }: { trend: string }) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "declining":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Exercise Progress
        </CardTitle>
        <CardDescription>Your most trained exercises and personal bests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.slice(0, 6).map((exercise) => (
            <div key={exercise.exerciseName} className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{exercise.exerciseName}</span>
                  <TrendIcon trend={exercise.trend} />
                </div>
                <div className="text-xs text-muted-foreground">
                  {exercise.totalSets} total sets
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {exercise.bestWeight > 0 ? `${exercise.bestWeight} kg` : "-"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Best: {exercise.bestReps} reps
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function WorkoutAnalytics() {
  const { data: analytics, isLoading, error } = useQuery<WorkoutAnalytics>({
    queryKey: ["/api/workout-analytics"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <p>Failed to load workout analytics. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  const hasData = analytics.summary.totalWorkouts > 0;

  if (!hasData) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
          <h3 className="font-medium mb-2">No Workout Data Yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Start logging your workouts to see detailed analytics about your training patterns,
            volume progression, and exercise progress.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <SummaryCard summary={analytics.summary} streaks={analytics.streaks} />

      <div className="grid gap-6 md:grid-cols-2">
        <VolumeChart data={analytics.weeklyTrends} />
        <WorkoutFrequencyChart data={analytics.weeklyTrends} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <MuscleGroupHeatmap data={analytics.muscleGroupFrequency} />
        <ExerciseProgressList data={analytics.exerciseProgress} />
      </div>
    </div>
  );
}
