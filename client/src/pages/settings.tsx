import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import { User, Target, MessageSquare, Moon, Sun, Save, Download, FileJson, FileSpreadsheet } from "lucide-react";
import type { UserProfile } from "@shared/schema";

const settingsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  targetWeightKg: z.number().min(30).max(300).optional(),
  dailyStepsTarget: z.number().min(1000).max(50000),
  targetCalories: z.number().min(1000).max(6000).optional(),
  proteinGrams: z.number().min(50).max(400).optional(),
  carbsGrams: z.number().min(50).max(600).optional(),
  fatGrams: z.number().min(20).max(300).optional(),
  coachingTone: z.enum(["empathetic", "scientific", "casual", "tough_love"]),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-48" />
      ))}
    </div>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
  });

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dailyStepsTarget: 8000,
      coachingTone: "empathetic",
    },
    values: profile ? {
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      targetWeightKg: profile.targetWeightKg ?? undefined,
      dailyStepsTarget: profile.dailyStepsTarget || 8000,
      targetCalories: profile.targetCalories ?? undefined,
      proteinGrams: profile.proteinGrams ?? undefined,
      carbsGrams: profile.carbsGrams ?? undefined,
      fatGrams: profile.fatGrams ?? undefined,
      coachingTone: (profile.coachingTone as any) || "empathetic",
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      const response = await apiRequest("PATCH", "/api/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated.",
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

  const onSubmit = (data: SettingsFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <SettingsSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your profile and preferences</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-first-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-last-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="targetWeightKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Weight (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        data-testid="input-target-weight"
                      />
                    </FormControl>
                    <FormDescription>Leave blank if you don't have a specific weight goal.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Daily Targets
              </CardTitle>
              <CardDescription>Set your nutrition and activity goals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="dailyStepsTarget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Steps Target</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-steps-target"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name="targetCalories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Calorie Target (kcal)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        data-testid="input-calorie-target"
                      />
                    </FormControl>
                    <FormDescription>Your AI mentor can help calculate this based on your goals.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="proteinGrams"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Protein (g)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          data-testid="input-protein-target"
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
                      <FormLabel>Carbs (g)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          data-testid="input-carbs-target"
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
                      <FormLabel>Fat (g)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          data-testid="input-fat-target"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Coaching Preferences
              </CardTitle>
              <CardDescription>Customize how your AI mentor communicates with you</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="coachingTone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Communication Style</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-coaching-tone">
                          <SelectValue placeholder="Select a style" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="empathetic">Empathetic - Warm, understanding, supportive</SelectItem>
                        <SelectItem value="scientific">Scientific - Data-driven, detailed explanations</SelectItem>
                        <SelectItem value="casual">Casual - Friendly, simple, upbeat</SelectItem>
                        <SelectItem value="tough_love">Tough Love - Direct, challenging, motivating</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Your AI mentor will adapt its communication style to match your preference.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {theme === "light" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                Appearance
              </CardTitle>
              <CardDescription>Customize the look of the app</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground">
                    Currently using {theme} mode
                  </p>
                </div>
                <Button variant="outline" onClick={toggleTheme} data-testid="button-toggle-theme">
                  {theme === "light" ? (
                    <>
                      <Moon className="h-4 w-4 mr-2" />
                      Dark Mode
                    </>
                  ) : (
                    <>
                      <Sun className="h-4 w-4 mr-2" />
                      Light Mode
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Your Data
              </CardTitle>
              <CardDescription>Download all your VitalPath data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Export your profile, daily logs, nutrition data, and chat history in your preferred format.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    window.location.href = "/api/export/json";
                  }}
                  data-testid="button-export-json"
                >
                  <FileJson className="h-4 w-4 mr-2" />
                  Export as JSON
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    window.location.href = "/api/export/csv";
                  }}
                  data-testid="button-export-csv"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Daily Logs (CSV)
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                JSON includes all data (profile, logs, food entries, chat). CSV contains daily log summaries only.
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-settings">
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
