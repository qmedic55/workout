import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { TrendingDown, TrendingUp, Minus, Scale, Flame, Footprints, Moon, Ruler, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ShareButton } from "@/components/share-button";
import { createProgressCardData } from "@/hooks/use-share-card";
import type { DailyLog, UserProfile, BodyMeasurement, PublicProfile } from "@shared/schema";

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

// Body Measurement Input Form Component
function MeasurementForm({
  onSubmit,
  isLoading,
  initialDate
}: {
  onSubmit: (data: Record<string, number | string | undefined>) => void;
  isLoading: boolean;
  initialDate?: string;
}) {
  const [formData, setFormData] = useState<Record<string, string>>({
    measurementDate: initialDate || format(new Date(), "yyyy-MM-dd"),
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, number | string | undefined> = {
      measurementDate: formData.measurementDate,
    };

    // Convert string values to numbers where applicable
    const numericFields = [
      'chestCm', 'waistCm', 'hipsCm',
      'leftBicepCm', 'rightBicepCm', 'leftForearmCm', 'rightForearmCm',
      'leftThighCm', 'rightThighCm', 'leftCalfCm', 'rightCalfCm',
      'neckCm', 'shouldersCm', 'bodyFatPercentage'
    ];

    for (const field of numericFields) {
      if (formData[field] && formData[field].trim() !== '') {
        data[field] = parseFloat(formData[field]);
      }
    }

    onSubmit(data);
  };

  const measurementGroups = [
    {
      title: "Core",
      fields: [
        { name: "chestCm", label: "Chest", placeholder: "e.g., 95" },
        { name: "waistCm", label: "Waist", placeholder: "e.g., 80" },
        { name: "hipsCm", label: "Hips", placeholder: "e.g., 100" },
      ]
    },
    {
      title: "Arms",
      fields: [
        { name: "leftBicepCm", label: "Left Bicep", placeholder: "e.g., 35" },
        { name: "rightBicepCm", label: "Right Bicep", placeholder: "e.g., 35" },
        { name: "leftForearmCm", label: "Left Forearm", placeholder: "e.g., 28" },
        { name: "rightForearmCm", label: "Right Forearm", placeholder: "e.g., 28" },
      ]
    },
    {
      title: "Legs",
      fields: [
        { name: "leftThighCm", label: "Left Thigh", placeholder: "e.g., 55" },
        { name: "rightThighCm", label: "Right Thigh", placeholder: "e.g., 55" },
        { name: "leftCalfCm", label: "Left Calf", placeholder: "e.g., 38" },
        { name: "rightCalfCm", label: "Right Calf", placeholder: "e.g., 38" },
      ]
    },
    {
      title: "Other",
      fields: [
        { name: "neckCm", label: "Neck", placeholder: "e.g., 38" },
        { name: "shouldersCm", label: "Shoulders", placeholder: "e.g., 120" },
        { name: "bodyFatPercentage", label: "Body Fat %", placeholder: "e.g., 18" },
      ]
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="measurementDate">Date</Label>
        <Input
          id="measurementDate"
          type="date"
          value={formData.measurementDate}
          onChange={(e) => handleChange("measurementDate", e.target.value)}
          className="mt-1"
        />
      </div>

      {measurementGroups.map((group) => (
        <div key={group.title}>
          <h4 className="font-medium text-sm text-muted-foreground mb-2">{group.title}</h4>
          <div className="grid grid-cols-2 gap-3">
            {group.fields.map((field) => (
              <div key={field.name}>
                <Label htmlFor={field.name} className="text-xs">{field.label} (cm)</Label>
                <Input
                  id={field.name}
                  type="number"
                  step="0.1"
                  placeholder={field.placeholder}
                  value={formData[field.name] || ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="mt-1"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Measurements"}
      </Button>
    </form>
  );
}

// Measurement Change Badge
function MeasurementChange({ change, inverse = false }: { change: number | null; inverse?: boolean }) {
  if (change === null) return <span className="text-xs text-muted-foreground">-</span>;

  const isPositive = inverse ? change < 0 : change > 0;
  const isNegative = inverse ? change > 0 : change < 0;

  return (
    <span className={`text-xs flex items-center gap-0.5 ${
      isPositive ? "text-green-600" : isNegative ? "text-red-500" : "text-muted-foreground"
    }`}>
      {change > 0 ? <ArrowUp className="h-3 w-3" /> : change < 0 ? <ArrowDown className="h-3 w-3" /> : null}
      {change > 0 ? "+" : ""}{change.toFixed(1)} cm
    </span>
  );
}

// Body Measurements Tab Content
function BodyMeasurementsTab() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: measurements = [], isLoading } = useQuery<BodyMeasurement[]>({
    queryKey: ["/api/body-measurements"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, number | string | undefined>) => {
      const response = await apiRequest("POST", "/api/body-measurements", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/body-measurements"] });
      setDialogOpen(false);
      toast({
        title: "Measurements saved",
        description: "Your body measurements have been recorded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <Skeleton className="h-80" />;
  }

  // Calculate changes between latest and oldest measurements
  const latest = measurements[0];
  const oldest = measurements.length > 1 ? measurements[measurements.length - 1] : null;

  const getChange = (field: keyof BodyMeasurement): number | null => {
    if (!latest || !oldest) return null;
    const latestVal = latest[field] as number | null;
    const oldestVal = oldest[field] as number | null;
    if (latestVal === null || oldestVal === null) return null;
    return latestVal - oldestVal;
  };

  const measurementFields = [
    { key: "chestCm" as const, label: "Chest", inverse: false },
    { key: "waistCm" as const, label: "Waist", inverse: true },
    { key: "hipsCm" as const, label: "Hips", inverse: true },
    { key: "shouldersCm" as const, label: "Shoulders", inverse: false },
    { key: "neckCm" as const, label: "Neck", inverse: false },
    { key: "leftBicepCm" as const, label: "L. Bicep", inverse: false },
    { key: "rightBicepCm" as const, label: "R. Bicep", inverse: false },
    { key: "leftForearmCm" as const, label: "L. Forearm", inverse: false },
    { key: "rightForearmCm" as const, label: "R. Forearm", inverse: false },
    { key: "leftThighCm" as const, label: "L. Thigh", inverse: false },
    { key: "rightThighCm" as const, label: "R. Thigh", inverse: false },
    { key: "leftCalfCm" as const, label: "L. Calf", inverse: false },
    { key: "rightCalfCm" as const, label: "R. Calf", inverse: false },
  ];

  // Chart data for key measurements
  const chartData = [...measurements].reverse().map((m) => ({
    date: format(typeof m.measurementDate === 'string' ? parseISO(m.measurementDate) : m.measurementDate, "MMM d"),
    chest: m.chestCm,
    waist: m.waistCm,
    hips: m.hipsCm,
    bicep: ((m.leftBicepCm || 0) + (m.rightBicepCm || 0)) / 2 || null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Body Measurements</h3>
          <p className="text-sm text-muted-foreground">
            Track changes in your body composition over time
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Measurement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Body Measurements</DialogTitle>
              <DialogDescription>
                Enter your measurements in centimeters. You don't need to fill in all fields.
              </DialogDescription>
            </DialogHeader>
            <MeasurementForm
              onSubmit={(data) => saveMutation.mutate(data)}
              isLoading={saveMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {measurements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Ruler className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No measurements yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start tracking your body measurements to see your progress over time.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add First Measurement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Latest measurements grid */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Latest Measurements</CardTitle>
              <CardDescription>
                {latest && format(typeof latest.measurementDate === 'string' ? parseISO(latest.measurementDate) : latest.measurementDate, "MMMM d, yyyy")}
                {measurements.length > 1 && (
                  <span className="ml-2">
                    • Comparing with {format(typeof oldest!.measurementDate === 'string' ? parseISO(oldest!.measurementDate) : oldest!.measurementDate, "MMM d, yyyy")}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {measurementFields.map(({ key, label, inverse }) => {
                  const value = latest?.[key] as number | null;
                  const change = getChange(key);

                  return (
                    <div key={key} className="text-center p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">{label}</div>
                      <div className="text-lg font-semibold">
                        {value !== null ? `${value} cm` : "-"}
                      </div>
                      <MeasurementChange change={change} inverse={inverse} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Chart */}
          {chartData.length >= 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Measurement Trends</CardTitle>
                <CardDescription>
                  Key measurements over time (chest, waist, hips, biceps)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
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
                    <Legend />
                    <Line type="monotone" dataKey="chest" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Chest" />
                    <Line type="monotone" dataKey="waist" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Waist" />
                    <Line type="monotone" dataKey="hips" stroke="hsl(var(--chart-4))" strokeWidth={2} name="Hips" />
                    <Line type="monotone" dataKey="bicep" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Bicep (avg)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* History table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Measurement History</CardTitle>
              <CardDescription>All recorded measurements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4">Date</th>
                      <th className="text-right py-2 px-2">Chest</th>
                      <th className="text-right py-2 px-2">Waist</th>
                      <th className="text-right py-2 px-2">Hips</th>
                      <th className="text-right py-2 px-2">Shoulders</th>
                      <th className="text-right py-2 px-2">Bicep (L/R)</th>
                      <th className="text-right py-2 px-2">Thigh (L/R)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {measurements.slice(0, 10).map((m) => (
                      <tr key={m.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">
                          {format(typeof m.measurementDate === 'string' ? parseISO(m.measurementDate) : m.measurementDate, "MMM d, yyyy")}
                        </td>
                        <td className="text-right py-2 px-2">{m.chestCm ?? "-"}</td>
                        <td className="text-right py-2 px-2">{m.waistCm ?? "-"}</td>
                        <td className="text-right py-2 px-2">{m.hipsCm ?? "-"}</td>
                        <td className="text-right py-2 px-2">{m.shouldersCm ?? "-"}</td>
                        <td className="text-right py-2 px-2">
                          {m.leftBicepCm ?? "-"}/{m.rightBicepCm ?? "-"}
                        </td>
                        <td className="text-right py-2 px-2">
                          {m.leftThighCm ?? "-"}/{m.rightThighCm ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
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

  const { data: publicProfile } = useQuery<PublicProfile>({
    queryKey: ["/api/public-profile"],
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

        <div className="flex gap-2 items-center">
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
          <ShareButton
            cardData={createProgressCardData(
              {
                weightChange: avgWeight(secondHalf) && avgWeight(firstHalf)
                  ? (avgWeight(secondHalf)! - avgWeight(firstHalf)!)
                  : undefined,
                workoutsThisWeek: sortedLogs.filter(l => l.workoutCompleted).length,
                stepsAverage: avgSteps(sortedLogs),
              },
              timeRange === "7d" ? "week" : "month",
              publicProfile?.username || undefined
            )}
            size="sm"
          />
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
          <TabsTrigger value="measurements" data-testid="tab-measurements">Measurements</TabsTrigger>
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

        <TabsContent value="measurements">
          <BodyMeasurementsTab />
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
