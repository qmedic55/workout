import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  Flame,
  Footprints,
  Moon,
  Zap,
  Brain,
  Save,
  Droplets,
} from "lucide-react";
import { WorkoutLogger } from "@/components/workout-logger";
import type { DailyLog, UserProfile } from "@shared/schema";

const dailyLogSchema = z.object({
  logDate: z.date(),
  caloriesConsumed: z.number().min(0).max(10000).optional(),
  proteinGrams: z.number().min(0).max(500).optional(),
  carbsGrams: z.number().min(0).max(1000).optional(),
  fatGrams: z.number().min(0).max(500).optional(),
  waterLiters: z.number().min(0).max(10).optional(),
  steps: z.number().min(0).max(100000).optional(),
  activeMinutes: z.number().min(0).max(600).optional(),
  workoutCompleted: z.boolean(),
  workoutType: z.string().optional(),
  workoutDurationMinutes: z.number().min(0).max(300).optional(),
  sleepHours: z.number().min(0).max(16).optional(),
  sleepQuality: z.number().min(1).max(10),
  energyLevel: z.number().min(1).max(10),
  stressLevel: z.number().min(1).max(10),
  moodRating: z.number().min(1).max(10),
  notes: z.string().optional(),
});

type DailyLogFormData = z.infer<typeof dailyLogSchema>;

function MetricSection({
  title,
  icon: Icon,
  children,
  className
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-3 pb-3">
        {children}
      </CardContent>
    </Card>
  );
}

function DailyLogSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}

export default function DailyLogPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { toast } = useToast();

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
  });

  const { data: existingLog, isLoading } = useQuery<DailyLog>({
    queryKey: ["/api/daily-logs", dateStr],
  });

  const form = useForm<DailyLogFormData>({
    resolver: zodResolver(dailyLogSchema),
    defaultValues: {
      logDate: selectedDate,
      workoutCompleted: false,
      sleepQuality: 5,
      energyLevel: 5,
      stressLevel: 5,
      moodRating: 5,
    },
    values: existingLog ? {
      logDate: new Date(existingLog.logDate),
      caloriesConsumed: existingLog.caloriesConsumed ?? undefined,
      proteinGrams: existingLog.proteinGrams ?? undefined,
      carbsGrams: existingLog.carbsGrams ?? undefined,
      fatGrams: existingLog.fatGrams ?? undefined,
      waterLiters: existingLog.waterLiters ?? undefined,
      steps: existingLog.steps ?? undefined,
      activeMinutes: existingLog.activeMinutes ?? undefined,
      workoutCompleted: existingLog.workoutCompleted ?? false,
      workoutType: existingLog.workoutType ?? undefined,
      workoutDurationMinutes: existingLog.workoutDurationMinutes ?? undefined,
      sleepHours: existingLog.sleepHours ?? undefined,
      sleepQuality: existingLog.sleepQuality ?? 5,
      energyLevel: existingLog.energyLevel ?? 5,
      stressLevel: existingLog.stressLevel ?? 5,
      moodRating: existingLog.moodRating ?? 5,
      notes: existingLog.notes ?? undefined,
    } : undefined,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: DailyLogFormData) => {
      const payload = {
        ...data,
        logDate: format(data.logDate, "yyyy-MM-dd"),
      };
      const response = await apiRequest("POST", "/api/daily-logs", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-logs/today"] });
      toast({
        title: "Log Saved",
        description: "Your daily log has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DailyLogFormData) => {
    saveMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <DailyLogSkeleton />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Daily Log</h1>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal")} data-testid="button-select-date">
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {format(selectedDate, "MMM d, yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={(date) => date > new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          {/* Nutrition - Compact Row */}
          <MetricSection title="Nutrition" icon={Flame}>
            <div className="grid grid-cols-4 gap-2">
              <FormField
                control={form.control}
                name="caloriesConsumed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Calories</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={profile?.targetCalories?.toString() || "kcal"}
                        className="h-8 text-sm"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        data-testid="input-calories"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="proteinGrams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Protein (g)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="g"
                        className="h-8 text-sm"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        data-testid="input-protein"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="carbsGrams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Carbs (g)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="g"
                        className="h-8 text-sm"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        data-testid="input-carbs"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fatGrams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Fat (g)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="g"
                        className="h-8 text-sm"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        data-testid="input-fat"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </MetricSection>

          {/* Activity Row - Steps & Water side by side */}
          <div className="grid grid-cols-2 gap-3">
            <MetricSection title="Steps" icon={Footprints}>
              <FormField
                control={form.control}
                name="steps"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={profile?.dailyStepsTarget?.toString() || "8000"}
                        className="h-8 text-sm"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        data-testid="input-steps"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </MetricSection>

            <MetricSection title="Water" icon={Droplets}>
              <FormField
                control={form.control}
                name="waterLiters"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="liters"
                        className="h-8 text-sm"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        data-testid="input-water"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </MetricSection>
          </div>

          {/* Workout Logger */}
          <WorkoutLogger
            date={dateStr}
            onWorkoutChange={(hasWorkout) => {
              form.setValue("workoutCompleted", hasWorkout);
            }}
          />

          {/* Sleep - Compact */}
          <MetricSection title="Sleep" icon={Moon}>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="sleepHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="7.5"
                        className="h-8 text-sm"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        data-testid="input-sleep-hours"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sleepQuality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Quality ({field.value}/10)</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[field.value]}
                        onValueChange={([val]) => field.onChange(val)}
                        className="mt-2"
                        data-testid="slider-sleep-quality"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </MetricSection>

          {/* Biofeedback - All in one compact row */}
          <MetricSection title="How You Feel" icon={Zap}>
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="energyLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Energy ({field.value}/10)</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[field.value]}
                        onValueChange={([val]) => field.onChange(val)}
                        className="mt-2"
                        data-testid="slider-energy"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="moodRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Mood ({field.value}/10)</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[field.value]}
                        onValueChange={([val]) => field.onChange(val)}
                        className="mt-2"
                        data-testid="slider-mood"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stressLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Stress ({field.value}/10)</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[field.value]}
                        onValueChange={([val]) => field.onChange(val)}
                        className="mt-2"
                        data-testid="slider-stress"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </MetricSection>

          {/* Notes - Collapsed by default concept, but keeping simple textarea for now */}
          <MetricSection title="Notes" icon={Brain}>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Any observations about today..."
                      className="min-h-[60px] text-sm"
                      {...field}
                      data-testid="input-notes"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </MetricSection>

          <Button type="submit" className="w-full" disabled={saveMutation.isPending} data-testid="button-save-log">
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save Log"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
