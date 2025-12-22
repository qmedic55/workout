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
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Activity,
  Sparkles,
  Heart,
  Brain,
  Zap,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const stepIcons = [User, Activity, Sparkles];

// Simplified schema for 3-step onboarding
const onboardingSchema = z.object({
  // Step 1: The Basics
  firstName: z.string().min(1, "First name is required"),
  age: z.number().min(18, "Must be at least 18").max(120),
  sex: z.enum(["male", "female"]),
  heightCm: z.number().min(100).max(250),
  currentWeightKg: z.number().min(30).max(300),
  targetWeightKg: z.number().min(30).max(300).optional(),

  // Step 2: Lifestyle
  activityLevel: z.enum(["sedentary", "lightly_active", "moderately_active", "very_active"]),
  exerciseFrequency: z.enum(["none", "1-2", "3-4", "5+"]),
  dietingHistory: z.enum(["no", "few_weeks", "few_months", "6_months_plus"]),
  sleepQuality: z.enum(["poor", "fair", "good", "great"]),
  stressLevel: z.number().min(1).max(10),

  // Step 3: Preferences
  coachingTone: z.enum(["empathetic", "scientific", "casual", "tough_love"]),
  enableNotifications: z.boolean(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const steps = [
  { title: "The Basics", description: "Tell us about yourself", duration: "30 seconds" },
  { title: "Your Lifestyle", description: "A few quick questions", duration: "45 seconds" },
  { title: "Your Coach", description: "Customize your experience", duration: "30 seconds" },
];

// Coaching tone cards with examples
const coachingTones = [
  {
    value: "empathetic",
    label: "Empathetic",
    icon: Heart,
    description: "Warm, understanding, encouraging",
    example: "I know this is hard. You're doing amazing just by showing up.",
    color: "bg-pink-500/10 border-pink-500/30 text-pink-600 dark:text-pink-400",
  },
  {
    value: "scientific",
    label: "Scientific",
    icon: Brain,
    description: "Data-driven, explains the \"why\"",
    example: "Your protein intake is 15% below optimal for muscle protein synthesis.",
    color: "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
  },
  {
    value: "casual",
    label: "Casual",
    icon: MessageSquare,
    description: "Friendly, conversational, relaxed",
    example: "Hey! Solid workout yesterday. Let's keep that energy going.",
    color: "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400",
  },
  {
    value: "tough_love",
    label: "Tough Love",
    icon: Zap,
    description: "Direct, no excuses, accountability",
    example: "You skipped your workout. That's on you. Get back at it tomorrow.",
    color: "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400",
  },
];

// Helper to get saved step from localStorage
function getSavedStep(): number {
  try {
    const saved = localStorage.getItem(ONBOARDING_STEP_KEY);
    if (saved) {
      const step = parseInt(saved, 10);
      if (!isNaN(step) && step >= 0 && step < 3) {
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

  const defaultFormValues: OnboardingFormData = {
    firstName: "",
    age: 45,
    sex: "male",
    heightCm: 170,
    currentWeightKg: 80,
    activityLevel: "sedentary",
    exerciseFrequency: "none",
    dietingHistory: "no",
    sleepQuality: "fair",
    stressLevel: 5,
    coachingTone: "empathetic",
    enableNotifications: true,
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

  // Persist form data to localStorage on changes
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
      // Transform simplified form data to full onboarding format
      const transformedData = {
        firstName: data.firstName,
        lastName: "",
        age: data.age,
        sex: data.sex,
        heightCm: data.heightCm,
        currentWeightKg: data.currentWeightKg,
        targetWeightKg: data.targetWeightKg,

        // Transform exercise frequency to resistance training
        hasBeenDietingRecently: data.dietingHistory !== "no",
        dietingDurationMonths: data.dietingHistory === "few_weeks" ? 1
          : data.dietingHistory === "few_months" ? 3
          : data.dietingHistory === "6_months_plus" ? 6
          : undefined,

        doesResistanceTraining: data.exerciseFrequency !== "none",
        resistanceTrainingFrequency: data.exerciseFrequency === "1-2" ? 2
          : data.exerciseFrequency === "3-4" ? 4
          : data.exerciseFrequency === "5+" ? 5
          : 0,

        activityLevel: data.activityLevel,
        averageSleepHours: data.sleepQuality === "poor" ? 5
          : data.sleepQuality === "fair" ? 6.5
          : data.sleepQuality === "good" ? 7.5
          : 8,
        sleepQuality: data.sleepQuality === "poor" ? 3
          : data.sleepQuality === "fair" ? 5
          : data.sleepQuality === "good" ? 7
          : 9,
        stressLevel: data.stressLevel,

        // Defaults for fields we'll collect progressively
        energyLevelMorning: 5,
        energyLevelAfternoon: 5,
        moodGeneral: 5,
        usesWearable: false,

        coachingTone: data.coachingTone,
        enableNotifications: data.enableNotifications,
        hasHealthConditions: false,
      };

      const response = await apiRequest("POST", "/api/onboarding", transformedData);
      return response.json();
    },
    onSuccess: (result) => {
      // Clear saved onboarding progress
      try {
        localStorage.removeItem(ONBOARDING_STEP_KEY);
        localStorage.removeItem(ONBOARDING_FORM_KEY);
        // Store that this is a new user for first-week magic
        localStorage.setItem("vitalpath_first_day", new Date().toISOString());
      } catch {
        // localStorage not available
      }
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });

      // Navigate to dashboard with first-visit flag
      navigate("/?welcome=true");
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

  const nextStep = async () => {
    // Validate current step fields before proceeding
    let fieldsToValidate: (keyof OnboardingFormData)[] = [];

    if (currentStep === 0) {
      fieldsToValidate = ["firstName", "age", "sex", "heightCm", "currentWeightKg"];
    } else if (currentStep === 1) {
      fieldsToValidate = ["activityLevel", "exerciseFrequency", "dietingHistory", "sleepQuality", "stressLevel"];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const onSubmit = (data: OnboardingFormData) => {
    if (currentStep !== steps.length - 1) {
      return;
    }
    submitMutation.mutate(data);
  };

  const CurrentIcon = stepIcons[currentStep];
  const selectedTone = form.watch("coachingTone");

  return (
    <div className="min-h-screen p-4 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Welcome to VitalPath</h1>
          <p className="text-muted-foreground">
            Let's get you set up in under 2 minutes
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{steps[currentStep].duration}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2">
          {steps.map((step, index) => {
            const StepIcon = stepIcons[index];
            const isComplete = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <div
                key={index}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                  isComplete && "bg-primary border-primary text-primary-foreground",
                  isCurrent && "border-primary text-primary",
                  !isComplete && !isCurrent && "border-muted text-muted-foreground"
                )}
              >
                {isComplete ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <StepIcon className="h-5 w-5" />
                )}
              </div>
            );
          })}
        </div>

        {/* Main Card */}
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

                {/* Step 1: The Basics */}
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your first name"
                              {...field}
                              data-testid="input-first-name"
                              autoFocus
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
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
                                className="flex gap-4 pt-2"
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

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
                          <FormLabel>Goal Weight (kg) - Optional</FormLabel>
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
                            We'll help you set realistic goals based on your profile.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 2: Lifestyle */}
                {currentStep === 1 && (
                  <div className="space-y-5">
                    <FormField
                      control={form.control}
                      name="activityLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How active is your daily life? (not counting exercise)</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="grid gap-2"
                            >
                              {[
                                { value: "sedentary", label: "Sedentary", desc: "Desk job, minimal movement" },
                                { value: "lightly_active", label: "Lightly active", desc: "Some walking, light activity" },
                                { value: "moderately_active", label: "Moderately active", desc: "On feet often, physical job" },
                                { value: "very_active", label: "Very active", desc: "Labor-intensive job, always moving" },
                              ].map((option) => (
                                <div key={option.value} className="flex items-center space-x-3">
                                  <RadioGroupItem value={option.value} id={option.value} />
                                  <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                                    <span className="font-medium">{option.label}</span>
                                    <span className="text-muted-foreground ml-2 text-sm">- {option.desc}</span>
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="exerciseFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Do you currently exercise regularly?</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="grid grid-cols-2 gap-2"
                            >
                              {[
                                { value: "none", label: "No, just starting" },
                                { value: "1-2", label: "1-2 times/week" },
                                { value: "3-4", label: "3-4 times/week" },
                                { value: "5+", label: "5+ times/week" },
                              ].map((option) => (
                                <div
                                  key={option.value}
                                  className={cn(
                                    "flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors",
                                    field.value === option.value
                                      ? "border-primary bg-primary/5"
                                      : "border-muted hover:border-primary/50"
                                  )}
                                  onClick={() => field.onChange(option.value)}
                                >
                                  <RadioGroupItem value={option.value} id={`exercise-${option.value}`} className="sr-only" />
                                  <Label htmlFor={`exercise-${option.value}`} className="cursor-pointer text-sm">
                                    {option.label}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dietingHistory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Have you been dieting or restricting calories recently?</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="grid grid-cols-2 gap-2"
                            >
                              {[
                                { value: "no", label: "No, eating normally" },
                                { value: "few_weeks", label: "Yes, a few weeks" },
                                { value: "few_months", label: "Yes, a few months" },
                                { value: "6_months_plus", label: "Yes, 6+ months" },
                              ].map((option) => (
                                <div
                                  key={option.value}
                                  className={cn(
                                    "flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors",
                                    field.value === option.value
                                      ? "border-primary bg-primary/5"
                                      : "border-muted hover:border-primary/50"
                                  )}
                                  onClick={() => field.onChange(option.value)}
                                >
                                  <RadioGroupItem value={option.value} id={`dieting-${option.value}`} className="sr-only" />
                                  <Label htmlFor={`dieting-${option.value}`} className="cursor-pointer text-sm text-center">
                                    {option.label}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
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
                          <FormLabel>How would you rate your average sleep?</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="grid grid-cols-4 gap-2"
                            >
                              {[
                                { value: "poor", label: "Poor" },
                                { value: "fair", label: "Fair" },
                                { value: "good", label: "Good" },
                                { value: "great", label: "Great" },
                              ].map((option) => (
                                <div
                                  key={option.value}
                                  className={cn(
                                    "flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors",
                                    field.value === option.value
                                      ? "border-primary bg-primary/5"
                                      : "border-muted hover:border-primary/50"
                                  )}
                                  onClick={() => field.onChange(option.value)}
                                >
                                  <RadioGroupItem value={option.value} id={`sleep-${option.value}`} className="sr-only" />
                                  <Label htmlFor={`sleep-${option.value}`} className="cursor-pointer text-sm">
                                    {option.label}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
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
                          <FormLabel>Current stress level</FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              <Slider
                                min={1}
                                max={10}
                                step={1}
                                value={[field.value]}
                                onValueChange={([val]) => field.onChange(val)}
                                data-testid="slider-stress-level"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Low stress</span>
                                <span className="font-medium text-foreground">{field.value}/10</span>
                                <span>High stress</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 3: Coach Preferences */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="coachingTone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How should your AI coach communicate with you?</FormLabel>
                          <FormControl>
                            <div className="grid gap-3">
                              {coachingTones.map((tone) => {
                                const ToneIcon = tone.icon;
                                const isSelected = field.value === tone.value;

                                return (
                                  <div
                                    key={tone.value}
                                    className={cn(
                                      "relative p-4 rounded-lg border-2 cursor-pointer transition-all",
                                      isSelected
                                        ? tone.color + " border-current"
                                        : "border-muted hover:border-primary/30"
                                    )}
                                    onClick={() => field.onChange(tone.value)}
                                  >
                                    <RadioGroupItem
                                      value={tone.value}
                                      id={tone.value}
                                      className="sr-only"
                                    />
                                    <div className="flex items-start gap-3">
                                      <div className={cn(
                                        "p-2 rounded-lg",
                                        isSelected ? "bg-current/20" : "bg-muted"
                                      )}>
                                        <ToneIcon className={cn(
                                          "h-5 w-5",
                                          isSelected ? "text-current" : "text-muted-foreground"
                                        )} />
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold">{tone.label}</span>
                                          {isSelected && (
                                            <Check className="h-4 w-4" />
                                          )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{tone.description}</p>
                                        <p className="text-sm italic mt-1 opacity-80">"{tone.example}"</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="enableNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Daily Notifications</FormLabel>
                            <FormDescription>
                              Get daily reminders, insights, and check-ins to stay on track
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <p className="text-sm text-muted-foreground">
                        <strong>Note:</strong> VitalPath provides general wellness guidance and is not a substitute for medical advice.
                        Always consult with healthcare professionals before making significant changes to your diet or exercise routine.
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
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
                      className="min-w-[180px]"
                    >
                      {submitMutation.isPending ? (
                        "Creating your plan..."
                      ) : (
                        <>
                          Start My Journey
                          <Sparkles className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Bottom hint */}
        <p className="text-center text-sm text-muted-foreground">
          We'll personalize your experience and ask a few more questions over the next week.
        </p>
      </div>
    </div>
  );
}
