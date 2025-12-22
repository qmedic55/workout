import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

const ONBOARDING_STEP_KEY = "vitalpath_onboarding_step";
const ONBOARDING_FORM_KEY = "vitalpath_onboarding_form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Scale,
  Utensils,
  Dumbbell,
  Heart,
  Brain,
  Sparkles,
} from "lucide-react";

const stepIcons = [User, Scale, Utensils, Dumbbell, Heart, Brain, Sparkles];

const onboardingSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  age: z.number().min(18).max(120),
  sex: z.enum(["male", "female"]),
  heightCm: z.number().min(100).max(250),
  currentWeightKg: z.number().min(30).max(300),
  targetWeightKg: z.number().min(30).max(300).optional(),
  bodyFatPercentage: z.number().min(3).max(60).optional(),
  waistCircumferenceCm: z.number().min(40).max(200).optional(),
  
  hasBeenDietingRecently: z.boolean(),
  dietingDurationMonths: z.number().optional(),
  previousLowestCalories: z.number().optional(),
  typicalDailyEating: z.string().optional(),
  biggestHurdles: z.string().optional(),
  relationshipWithFood: z.enum(["healthy", "restrictive", "emotional", "disordered"]).optional(),
  
  doesResistanceTraining: z.boolean(),
  resistanceTrainingFrequency: z.number().min(0).max(7).optional(),
  resistanceTrainingType: z.string().optional(),
  doesCardio: z.boolean().optional(),
  averageDailySteps: z.number().optional(),
  physicalLimitations: z.string().optional(),
  knowsRIR: z.boolean().optional(),
  
  occupation: z.string().optional(),
  activityLevel: z.enum(["sedentary", "lightly_active", "moderately_active", "very_active"]),
  averageSleepHours: z.number().min(3).max(14),
  sleepQuality: z.number().min(1).max(10),
  stressLevel: z.number().min(1).max(10),
  stressSources: z.string().optional(),
  
  energyLevelMorning: z.number().min(1).max(10),
  energyLevelAfternoon: z.number().min(1).max(10),
  digestionQuality: z.enum(["good", "bloating", "constipation", "other"]).optional(),
  moodGeneral: z.number().min(1).max(10),
  menstrualStatus: z.enum(["premenopausal", "perimenopausal", "postmenopausal", "not_applicable"]).optional(),
  
  usesWearable: z.boolean(),
  wearableType: z.string().optional(),
  
  coachingTone: z.enum(["empathetic", "scientific", "casual", "tough_love"]),
  enableNotifications: z.boolean(),
  hasHealthConditions: z.boolean(),
  healthConditionsNotes: z.string().optional(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const steps = [
  { title: "Basic Profile", description: "Tell us about yourself" },
  { title: "Body Metrics", description: "Current measurements and goals" },
  { title: "Diet History", description: "Your nutrition background" },
  { title: "Exercise", description: "Current activity levels" },
  { title: "Lifestyle", description: "Sleep, stress, and daily life" },
  { title: "Biofeedback", description: "Energy and wellbeing" },
  { title: "Preferences", description: "Customize your experience" },
];

// Helper to get saved step from localStorage
function getSavedStep(): number {
  try {
    const saved = localStorage.getItem(ONBOARDING_STEP_KEY);
    if (saved) {
      const step = parseInt(saved, 10);
      if (!isNaN(step) && step >= 0 && step < 7) {
        return step;
      }
    }
  } catch {
    // localStorage not available or error
  }
  return 0;
}

// Helper to get saved form data from localStorage
function getSavedFormData(): Partial<OnboardingFormData> | null {
  try {
    const saved = localStorage.getItem(ONBOARDING_FORM_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // localStorage not available or error
  }
  return null;
}

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(getSavedStep);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const defaultFormValues = {
    firstName: "",
    lastName: "",
    age: 45,
    sex: "male" as const,
    heightCm: 170,
    currentWeightKg: 80,
    hasBeenDietingRecently: false,
    doesResistanceTraining: false,
    activityLevel: "sedentary" as const,
    averageSleepHours: 7,
    sleepQuality: 5,
    stressLevel: 5,
    energyLevelMorning: 5,
    energyLevelAfternoon: 5,
    moodGeneral: 5,
    usesWearable: false,
    coachingTone: "empathetic" as const,
    enableNotifications: true,
    hasHealthConditions: false,
  };

  // Merge saved form data with defaults
  const savedFormData = getSavedFormData();
  const initialFormValues = savedFormData
    ? { ...defaultFormValues, ...savedFormData }
    : defaultFormValues;

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: initialFormValues,
  });

  // Persist step to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(ONBOARDING_STEP_KEY, currentStep.toString());
    } catch {
      // localStorage not available
    }
  }, [currentStep]);

  // Persist form data to localStorage on changes (debounced via subscription)
  useEffect(() => {
    const subscription = form.watch((data) => {
      try {
        localStorage.setItem(ONBOARDING_FORM_KEY, JSON.stringify(data));
      } catch {
        // localStorage not available
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const submitMutation = useMutation({
    mutationFn: async (data: OnboardingFormData) => {
      const response = await apiRequest("POST", "/api/onboarding", data);
      return response.json();
    },
    onSuccess: () => {
      // Clear saved onboarding progress
      try {
        localStorage.removeItem(ONBOARDING_STEP_KEY);
        localStorage.removeItem(ONBOARDING_FORM_KEY);
      } catch {
        // localStorage not available
      }
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Assessment Complete!",
        description: "Your personalized plan is ready. Let's begin your journey!",
      });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const progress = ((currentStep + 1) / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const onSubmit = (data: OnboardingFormData) => {
    // Only allow submission on the final step
    if (currentStep !== steps.length - 1) {
      return;
    }
    submitMutation.mutate(data);
  };

  const CurrentIcon = stepIcons[currentStep];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Welcome to VitalPath</h1>
          <p className="text-muted-foreground">
            Let's personalize your health journey. This assessment takes about 5 minutes.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CurrentIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle data-testid="text-step-title">{steps[currentStep].title}</CardTitle>
                <CardDescription>{steps[currentStep].description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} data-testid="input-first-name" />
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
                            <FormLabel>Last Name (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} data-testid="input-last-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-age"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sex"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Biological Sex</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="male" id="male" data-testid="radio-male" />
                                <Label htmlFor="male">Male</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="female" id="female" data-testid="radio-female" />
                                <Label htmlFor="female">Female</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormDescription>
                            This helps us calculate accurate calorie and macro targets.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="heightCm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Height (cm)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                data-testid="input-height"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="currentWeightKg"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Weight (kg)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                data-testid="input-weight"
                              />
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
                          <FormLabel>Target Weight (kg) - Optional</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Leave blank if unsure"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              data-testid="input-target-weight"
                            />
                          </FormControl>
                          <FormDescription>
                            Don't worry if you're not sure—we'll help you set realistic goals.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="waistCircumferenceCm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Waist Circumference (cm) - Optional</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Measure at navel level"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              data-testid="input-waist"
                            />
                          </FormControl>
                          <FormDescription>
                            Waist measurement helps track body composition changes.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="hasBeenDietingRecently"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Have you been dieting recently or in the past?</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(val) => field.onChange(val === "true")}
                              value={field.value ? "true" : "false"}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="true" id="dieting-yes" data-testid="radio-dieting-yes" />
                                <Label htmlFor="dieting-yes">Yes</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="false" id="dieting-no" data-testid="radio-dieting-no" />
                                <Label htmlFor="dieting-no">No</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("hasBeenDietingRecently") && (
                      <>
                        <FormField
                          control={form.control}
                          name="dietingDurationMonths"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>How long have you been dieting? (months)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                  data-testid="input-dieting-duration"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="previousLowestCalories"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Lowest daily calories you've eaten? (kcal)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="e.g., 1200"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                  data-testid="input-lowest-calories"
                                />
                              </FormControl>
                              <FormDescription>
                                This helps us understand if metabolic adaptation might be a factor.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    <FormField
                      control={form.control}
                      name="biggestHurdles"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What have been your biggest hurdles in losing weight?</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., stress eating, lack of time, restrictive diets leading to binges..."
                              {...field}
                              data-testid="input-hurdles"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="relationshipWithFood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How would you describe your relationship with food?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-food-relationship">
                                <SelectValue placeholder="Select one" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="healthy">Healthy - I enjoy food without guilt</SelectItem>
                              <SelectItem value="restrictive">Restrictive - I often limit myself</SelectItem>
                              <SelectItem value="emotional">Emotional - I eat based on feelings</SelectItem>
                              <SelectItem value="disordered">Complicated - It's a struggle</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="doesResistanceTraining"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Do you currently do resistance/weight training?</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(val) => field.onChange(val === "true")}
                              value={field.value ? "true" : "false"}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="true" id="resistance-yes" data-testid="radio-resistance-yes" />
                                <Label htmlFor="resistance-yes">Yes</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="false" id="resistance-no" data-testid="radio-resistance-no" />
                                <Label htmlFor="resistance-no">No</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("doesResistanceTraining") && (
                      <FormField
                        control={form.control}
                        name="resistanceTrainingFrequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>How many days per week?</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <Slider
                                  min={1}
                                  max={7}
                                  step={1}
                                  value={[field.value || 3]}
                                  onValueChange={([val]) => field.onChange(val)}
                                  data-testid="slider-training-frequency"
                                />
                                <div className="text-center text-sm text-muted-foreground">
                                  {field.value || 3} days per week
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="averageDailySteps"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Average daily steps</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 5000"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              data-testid="input-daily-steps"
                            />
                          </FormControl>
                          <FormDescription>
                            Estimate if you don't track. Even a rough number helps!
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="physicalLimitations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Any physical limitations or injuries?</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., bad knee, lower back issues, shoulder injury..."
                              {...field}
                              data-testid="input-limitations"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="activityLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Activity Level (outside of exercise)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-activity-level">
                                <SelectValue placeholder="Select one" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sedentary">Sedentary - Desk job, minimal movement</SelectItem>
                              <SelectItem value="lightly_active">Lightly Active - Some walking</SelectItem>
                              <SelectItem value="moderately_active">Moderately Active - On feet often</SelectItem>
                              <SelectItem value="very_active">Very Active - Physical job</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="averageSleepHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Average hours of sleep per night</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Slider
                                min={4}
                                max={10}
                                step={0.5}
                                value={[field.value]}
                                onValueChange={([val]) => field.onChange(val)}
                                data-testid="slider-sleep-hours"
                              />
                              <div className="text-center text-sm text-muted-foreground">
                                {field.value} hours
                              </div>
                            </div>
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
                          <FormLabel>Sleep Quality (1 = poor, 10 = excellent)</FormLabel>
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
                              <div className="text-center text-sm text-muted-foreground">
                                {field.value}/10
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stressLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Overall Stress Level (1 = low, 10 = very high)</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Slider
                                min={1}
                                max={10}
                                step={1}
                                value={[field.value]}
                                onValueChange={([val]) => field.onChange(val)}
                                data-testid="slider-stress-level"
                              />
                              <div className="text-center text-sm text-muted-foreground">
                                {field.value}/10
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="energyLevelMorning"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Morning Energy Level (1-10)</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Slider
                                min={1}
                                max={10}
                                step={1}
                                value={[field.value]}
                                onValueChange={([val]) => field.onChange(val)}
                                data-testid="slider-energy-morning"
                              />
                              <div className="text-center text-sm text-muted-foreground">
                                {field.value}/10
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="energyLevelAfternoon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Afternoon Energy Level (1-10)</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Slider
                                min={1}
                                max={10}
                                step={1}
                                value={[field.value]}
                                onValueChange={([val]) => field.onChange(val)}
                                data-testid="slider-energy-afternoon"
                              />
                              <div className="text-center text-sm text-muted-foreground">
                                {field.value}/10
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Low afternoon energy can indicate metabolic issues or blood sugar imbalances.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="moodGeneral"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>General Mood (1 = low, 10 = great)</FormLabel>
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
                              <div className="text-center text-sm text-muted-foreground">
                                {field.value}/10
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="usesWearable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Do you use a fitness tracker or smartwatch?</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(val) => field.onChange(val === "true")}
                              value={field.value ? "true" : "false"}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="true" id="wearable-yes" data-testid="radio-wearable-yes" />
                                <Label htmlFor="wearable-yes">Yes</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="false" id="wearable-no" data-testid="radio-wearable-no" />
                                <Label htmlFor="wearable-no">No</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStep === 6 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="coachingTone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How would you like your AI mentor to communicate?</FormLabel>
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
                            We'll adapt our coaching style to match your preference.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="enableNotifications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Would you like to receive proactive notifications?</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(val) => field.onChange(val === "true")}
                              value={field.value ? "true" : "false"}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="true" id="notifications-yes" data-testid="radio-notifications-yes" />
                                <Label htmlFor="notifications-yes">Yes, keep me on track</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="false" id="notifications-no" data-testid="radio-notifications-no" />
                                <Label htmlFor="notifications-no">No thanks</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormDescription>
                            Get daily reminders, personalized insights, and check-in prompts to help you stay consistent.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hasHealthConditions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Do you have any medical conditions we should know about?</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(val) => field.onChange(val === "true")}
                              value={field.value ? "true" : "false"}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="true" id="conditions-yes" data-testid="radio-conditions-yes" />
                                <Label htmlFor="conditions-yes">Yes</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="false" id="conditions-no" data-testid="radio-conditions-no" />
                                <Label htmlFor="conditions-no">No</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("hasHealthConditions") && (
                      <FormField
                        control={form.control}
                        name="healthConditionsNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Please describe briefly</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="e.g., thyroid condition, diabetes, heart condition..."
                                {...field}
                                data-testid="input-health-conditions"
                              />
                            </FormControl>
                            <FormDescription>
                              This helps us provide appropriate guidance. Always follow your doctor's advice.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="pt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-sm text-muted-foreground">
                        <strong>Disclaimer:</strong> VitalPath provides general wellness guidance and is not a substitute for medical advice. 
                        Always consult with healthcare professionals before making significant changes to your diet or exercise routine.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    data-testid="button-prev-step"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>

                  {currentStep < steps.length - 1 ? (
                    <Button type="button" onClick={nextStep} data-testid="button-next-step">
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={submitMutation.isPending}
                      data-testid="button-complete-assessment"
                    >
                      {submitMutation.isPending ? (
                        "Processing..."
                      ) : (
                        <>
                          Complete Assessment
                          <Check className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
