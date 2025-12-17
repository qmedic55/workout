import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { format, subDays, parseISO } from "date-fns";
import { TrendingDown, TrendingUp, Minus, Scale, Flame, Footprints, Moon } from "lucide-react";
import type { DailyLog, UserProfile } from "@shared/schema";

type TimeRange = "7d" | "30d" | "90d";

function TrendBadge({ current, previous, unit, inverse = false }: { current?: number; previous?: number; unit: string; inverse?: boolean }) {
  if (current === undefined || previous === undefined) {
    return <span className="text-xs text-muted-foreground">No data</span>;
  }

  const diff = current - previous;
  const percentChange = previous !== 0 ? ((diff / previous) * 100).toFixed(1) : "0";
  
  const isPositive = inverse ? diff < 0 : diff > 0;
  const isNeutral = Math.abs(diff) < 0.01;

  return (
    <div className={`flex items-center gap-1 text-xs ${isNeutral ? "text-muted-foreground" : isPositive ? "text-chart-1" : "text-destructive"}`}>
      {isNeutral ? (
        <Minus className="h-3 w-3" />
      ) : isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      <span>
        {diff > 0 ? "+" : ""}{diff.toFixed(1)} {unit} ({percentChange}%)
      </span>
    </div>
  );
}

function StatCard({ 
  title, 
  current, 
  previous, 
  unit, 
  icon: Icon, 
  inverse = false 
}: { 
  title: string; 
  current?: number; 
  previous?: number; 
  unit: string; 
  icon: React.ElementType;
  inverse?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`text-stat-${title.toLowerCase().replace(" ", "-")}`}>
          {current !== undefined ? current.toFixed(1) : "--"} {unit}
        </div>
        <div className="mt-1">
          <TrendBadge current={current} previous={previous} unit={unit} inverse={inverse} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">vs previous period</p>
      </CardContent>
    </Card>
  );
}

function ProgressSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-80" />
      <Skeleton className="h-80" />
    </div>
  );
}

export default function Progress() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;

  const { data: logs = [], isLoading } = useQuery<DailyLog[]>({
    queryKey: ["/api/daily-logs/range", timeRange],
  });

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ProgressSkeleton />
      </div>
    );
  }

  const sortedLogs = [...logs].sort((a, b) => 
    new Date(a.logDate).getTime() - new Date(b.logDate).getTime()
  );

  const chartData = sortedLogs.map((log) => ({
    date: format(typeof log.logDate === 'string' ? parseISO(log.logDate) : log.logDate, "MMM d"),
    weight: log.weightKg,
    calories: log.caloriesConsumed,
    steps: log.steps,
    sleep: log.sleepHours,
    energy: log.energyLevel,
    stress: log.stressLevel,
    mood: log.moodRating,
  }));

  const midpoint = Math.floor(sortedLogs.length / 2);
  const firstHalf = sortedLogs.slice(0, midpoint);
  const secondHalf = sortedLogs.slice(midpoint);

  const avgWeight = (logs: DailyLog[]) => {
    const weights = logs.filter(l => l.weightKg).map(l => l.weightKg!);
    return weights.length ? weights.reduce((a, b) => a + b, 0) / weights.length : undefined;
  };

  const avgCalories = (logs: DailyLog[]) => {
    const cals = logs.filter(l => l.caloriesConsumed).map(l => l.caloriesConsumed!);
    return cals.length ? cals.reduce((a, b) => a + b, 0) / cals.length : undefined;
  };

  const avgSteps = (logs: DailyLog[]) => {
    const steps = logs.filter(l => l.steps).map(l => l.steps!);
    return steps.length ? steps.reduce((a, b) => a + b, 0) / steps.length : undefined;
  };

  const avgSleep = (logs: DailyLog[]) => {
    const sleep = logs.filter(l => l.sleepHours).map(l => l.sleepHours!);
    return sleep.length ? sleep.reduce((a, b) => a + b, 0) / sleep.length : undefined;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Progress Tracking</h1>
          <p className="text-muted-foreground">Monitor your health journey over time</p>
        </div>

        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
              data-testid={`button-range-${range}`}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Average Weight"
          current={avgWeight(secondHalf)}
          previous={avgWeight(firstHalf)}
          unit="kg"
          icon={Scale}
          inverse
        />
        <StatCard
          title="Average Calories"
          current={avgCalories(secondHalf)}
          previous={avgCalories(firstHalf)}
          unit="kcal"
          icon={Flame}
        />
        <StatCard
          title="Average Steps"
          current={avgSteps(secondHalf)}
          previous={avgSteps(firstHalf)}
          unit=""
          icon={Footprints}
        />
        <StatCard
          title="Average Sleep"
          current={avgSleep(secondHalf)}
          previous={avgSleep(firstHalf)}
          unit="hrs"
          icon={Moon}
        />
      </div>

      <Tabs defaultValue="weight" className="space-y-4">
        <TabsList>
          <TabsTrigger value="weight" data-testid="tab-weight">Weight</TabsTrigger>
          <TabsTrigger value="nutrition" data-testid="tab-nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
          <TabsTrigger value="biofeedback" data-testid="tab-biofeedback">Biofeedback</TabsTrigger>
        </TabsList>

        <TabsContent value="weight">
          <Card>
            <CardHeader>
              <CardTitle>Weight Trend</CardTitle>
              <CardDescription>
                Your weight over the past {days} days
                {profile?.targetWeightKg && ` - Target: ${profile.targetWeightKg} kg`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No weight data recorded yet. Start logging your daily weight to see trends.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis domain={["dataMin - 2", "dataMax + 2"]} className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--chart-1))" }}
                      name="Weight (kg)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nutrition">
          <Card>
            <CardHeader>
              <CardTitle>Calorie Intake</CardTitle>
              <CardDescription>
                Daily calorie consumption
                {profile?.targetCalories && ` - Target: ${profile.targetCalories} kcal`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No nutrition data recorded yet. Start logging your meals to see trends.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Bar 
                      dataKey="calories" 
                      fill="hsl(var(--chart-4))" 
                      name="Calories"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Daily Steps</CardTitle>
              <CardDescription>
                Step count over time
                {profile?.dailyStepsTarget && ` - Target: ${profile.dailyStepsTarget} steps`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No activity data recorded yet. Start logging your steps to see trends.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Bar 
                      dataKey="steps" 
                      fill="hsl(var(--chart-2))" 
                      name="Steps"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="biofeedback">
          <Card>
            <CardHeader>
              <CardTitle>Biofeedback Trends</CardTitle>
              <CardDescription>
                Energy, sleep, stress, and mood ratings over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No biofeedback data recorded yet. Start logging your daily metrics to see trends.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis domain={[1, 10]} className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="energy"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      name="Energy"
                    />
                    <Line
                      type="monotone"
                      dataKey="sleep"
                      stroke="hsl(var(--chart-3))"
                      strokeWidth={2}
                      name="Sleep (hrs)"
                    />
                    <Line
                      type="monotone"
                      dataKey="mood"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      name="Mood"
                    />
                    <Line
                      type="monotone"
                      dataKey="stress"
                      stroke="hsl(var(--chart-5))"
                      strokeWidth={2}
                      name="Stress"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
