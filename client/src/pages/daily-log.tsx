import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  Scale,
  Flame,
  Footprints,
  Moon,
  Zap,
  Brain,
  Save,
  Dumbbell,
  Ruler,
} from "lucide-react";
import type { DailyLog, UserProfile } from "@shared/schema";

const dailyLogSchema = z.object({
  logDate: z.date(),
  weightKg: z.number().min(30).max(300).optional(),
  waistCm: z.number().min(40).max(200).optional(),
  hipsCm: z.number().min(40).max(200).optional(),
  chestCm: z.number().min(40).max(200).optional(),
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
  digestionNotes: z.string().optional(),
  notes: z.string().optional(),
});

type DailyLogFormData = z.infer<typeof dailyLogSchema>;

function MetricSection({ 
  title, 
  icon: Icon, 
  children 
}: { 
  title: string; 
  icon: React.ElementType; 
  children: React.ReactNode 
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
      weightKg: existingLog.weightKg ?? undefined,
      waistCm: existingLog.waistCm ?? undefined,
      hipsCm: existingLog.hipsCm ?? undefined,
      chestCm: existingLog.chestCm ?? undefined,
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
      digestionNotes: existingLog.digestionNotes ?? undefined,
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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Daily Log</h1>
          <p className="text-muted-foreground">Track your daily metrics and progress</p>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("justify-start text-left font-normal")} data-testid="button-select-date">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, "PPP")}
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <MetricSection title="Body Metrics" icon={Scale}>
              <FormField
                control={form.control}
                name="weightKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="e.g., 75.5"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        data-testid="input-weight"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-3 gap-2">
                <FormField
                  control={form.control}
                  name="waistCm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Waist (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          data-testid="input-waist"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hipsCm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Hips (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          data-testid="input-hips"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="chestCm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Chest (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          data-testid="input-chest"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </MetricSection>

            <MetricSection title="Nutrition" icon={Flame}>
              <FormField
                control={form.control}
                name="caloriesConsumed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calories (kcal)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={profile?.targetCalories ? `Target: ${profile.targetCalories}` : "e.g., 2000"}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        data-testid="input-calories"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-3 gap-2">
                <FormField
                  control={form.control}
                  name="proteinGrams"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Protein (g)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          data-testid="input-protein"
                        />
                      </FormControl>
                      <FormMessage />
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
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          data-testid="input-carbs"
                        />
                      </FormControl>
                      <FormMessage />
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
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          data-testid="input-fat"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="waterLiters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Water (liters)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="e.g., 2.5"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        data-testid="input-water"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </MetricSection>

            <MetricSection title="Activity" icon={Footprints}>
              <FormField
                control={form.control}
                name="steps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Steps</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={profile?.dailyStepsTarget ? `Target: ${profile.dailyStepsTarget}` : "e.g., 8000"}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        data-testid="input-steps"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="workoutCompleted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-workout"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Completed a workout today</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch("workoutCompleted") && (
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="workoutType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Type</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Strength"
                            {...field}
                            data-testid="input-workout-type"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="workoutDurationMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Duration (min)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-workout-duration"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </MetricSection>

            <MetricSection title="Sleep" icon={Moon}>
              <FormField
                control={form.control}
                name="sleepHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours of Sleep</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="e.g., 7.5"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        data-testid="input-sleep-hours"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sleepQuality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sleep Quality (1-10)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[field.value]}
                          onValueChange={([val]) => field.onChange(val)}
                          data-testid="slider-sleep-quality"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Poor</span>
                          <span className="font-medium">{field.value}/10</span>
                          <span>Excellent</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </MetricSection>

            <MetricSection title="Energy & Mood" icon={Zap}>
              <FormField
                control={form.control}
                name="energyLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Energy Level (1-10)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[field.value]}
                          onValueChange={([val]) => field.onChange(val)}
                          data-testid="slider-energy"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Low</span>
                          <span className="font-medium">{field.value}/10</span>
                          <span>High</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="moodRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mood (1-10)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[field.value]}
                          onValueChange={([val]) => field.onChange(val)}
                          data-testid="slider-mood"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Low</span>
                          <span className="font-medium">{field.value}/10</span>
                          <span>Great</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </MetricSection>

            <MetricSection title="Stress & Notes" icon={Brain}>
              <FormField
                control={form.control}
                name="stressLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stress Level (1-10)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[field.value]}
                          onValueChange={([val]) => field.onChange(val)}
                          data-testid="slider-stress"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Calm</span>
                          <span className="font-medium">{field.value}/10</span>
                          <span>Stressed</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any observations about today..."
                        {...field}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </MetricSection>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-log">
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save Log"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
