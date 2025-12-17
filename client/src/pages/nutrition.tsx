import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Utensils, Target, Calculator, Search } from "lucide-react";
import { FoodSearch } from "@/components/food-search";
import type { FoodEntry, UserProfile, DailyLog } from "@shared/schema";

const foodEntrySchema = z.object({
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  foodName: z.string().min(1, "Food name is required"),
  servingSize: z.string().optional(),
  servingQuantity: z.number().min(0.1).default(1),
  calories: z.number().min(0).optional(),
  proteinGrams: z.number().min(0).optional(),
  carbsGrams: z.number().min(0).optional(),
  fatGrams: z.number().min(0).optional(),
});

type FoodEntryFormData = z.infer<typeof foodEntrySchema>;

const quickAddFoods = [
  { name: "Chicken Breast (100g)", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: "Brown Rice (100g)", calories: 111, protein: 2.6, carbs: 23, fat: 0.9 },
  { name: "Egg (1 large)", calories: 72, protein: 6, carbs: 0.4, fat: 5 },
  { name: "Greek Yogurt (150g)", calories: 100, protein: 17, carbs: 6, fat: 0.7 },
  { name: "Salmon (100g)", calories: 208, protein: 20, carbs: 0, fat: 13 },
  { name: "Avocado (half)", calories: 161, protein: 2, carbs: 9, fat: 15 },
  { name: "Oatmeal (40g dry)", calories: 152, protein: 5, carbs: 27, fat: 3 },
  { name: "Banana (1 medium)", calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
];

function MacroProgress({ label, current, target, color }: { label: string; current: number; target: number; color: string }) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {current.toFixed(0)}g / {target}g
        </span>
      </div>
      <Progress value={percentage} className="h-2" style={{ ["--progress-color" as any]: color }} />
      <p className="text-xs text-muted-foreground text-right">{percentage.toFixed(0)}%</p>
    </div>
  );
}

function FoodEntryCard({ entry, onDelete }: { entry: FoodEntry; onDelete: (id: string) => void }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate" data-testid={`text-food-${entry.id}`}>{entry.foodName}</p>
        <div className="flex flex-wrap gap-2 mt-1">
          <Badge variant="secondary" className="text-xs">{entry.calories || 0} kcal</Badge>
          <span className="text-xs text-muted-foreground">
            P: {entry.proteinGrams?.toFixed(0) || 0}g | C: {entry.carbsGrams?.toFixed(0) || 0}g | F: {entry.fatGrams?.toFixed(0) || 0}g
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(entry.id)}
        data-testid={`button-delete-food-${entry.id}`}
      >
        <Trash2 className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  );
}

function NutritionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

export default function Nutrition() {
  const [selectedMeal, setSelectedMeal] = useState<"breakfast" | "lunch" | "dinner" | "snack">("breakfast");
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
  });

  const { data: todayLog } = useQuery<DailyLog>({
    queryKey: ["/api/daily-logs/today"],
  });

  const { data: foodEntries = [], isLoading } = useQuery<FoodEntry[]>({
    queryKey: ["/api/food-entries", today],
  });

  const form = useForm<FoodEntryFormData>({
    resolver: zodResolver(foodEntrySchema),
    defaultValues: {
      mealType: "breakfast",
      foodName: "",
      servingQuantity: 1,
    },
  });

  const addFoodMutation = useMutation({
    mutationFn: async (data: FoodEntryFormData) => {
      const response = await apiRequest("POST", "/api/food-entries", {
        ...data,
        logDate: today,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-logs/today"] });
      form.reset({ mealType: selectedMeal, foodName: "", servingQuantity: 1 });
      toast({ title: "Food added", description: "Your food entry has been logged." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteFoodMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/food-entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-logs/today"] });
      toast({ title: "Deleted", description: "Food entry removed." });
    },
  });

  const onSubmit = (data: FoodEntryFormData) => {
    addFoodMutation.mutate(data);
  };

  const handleQuickAdd = (food: typeof quickAddFoods[0]) => {
    addFoodMutation.mutate({
      mealType: selectedMeal,
      foodName: food.name,
      servingQuantity: 1,
      calories: food.calories,
      proteinGrams: food.protein,
      carbsGrams: food.carbs,
      fatGrams: food.fat,
    });
  };

  // Handler for food search selection - populates the form
  const handleFoodSelect = (food: {
    name: string;
    servingSize: string | null;
    calories: number | null;
    proteinGrams: number | null;
    carbsGrams: number | null;
    fatGrams: number | null;
  }) => {
    form.setValue("foodName", food.name);
    if (food.calories) form.setValue("calories", food.calories);
    if (food.proteinGrams) form.setValue("proteinGrams", food.proteinGrams);
    if (food.carbsGrams) form.setValue("carbsGrams", food.carbsGrams);
    if (food.fatGrams) form.setValue("fatGrams", food.fatGrams);
    if (food.servingSize) form.setValue("servingSize", food.servingSize);
  };

  const totalCalories = foodEntries.reduce((sum, e) => sum + (e.calories || 0), 0);
  const totalProtein = foodEntries.reduce((sum, e) => sum + (e.proteinGrams || 0), 0);
  const totalCarbs = foodEntries.reduce((sum, e) => sum + (e.carbsGrams || 0), 0);
  const totalFat = foodEntries.reduce((sum, e) => sum + (e.fatGrams || 0), 0);

  const mealEntries = {
    breakfast: foodEntries.filter(e => e.mealType === "breakfast"),
    lunch: foodEntries.filter(e => e.mealType === "lunch"),
    dinner: foodEntries.filter(e => e.mealType === "dinner"),
    snack: foodEntries.filter(e => e.mealType === "snack"),
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <NutritionSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nutrition Tracker</h1>
        <p className="text-muted-foreground">Log your meals and track your macros</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Today's Summary
            </CardTitle>
            <CardDescription>
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 rounded-lg bg-primary/5">
              <p className="text-sm text-muted-foreground">Total Calories</p>
              <p className="text-4xl font-bold" data-testid="text-total-calories">
                {totalCalories}
              </p>
              <p className="text-sm text-muted-foreground">
                / {profile?.targetCalories || 2000} kcal
              </p>
              <Progress 
                value={profile?.targetCalories ? (totalCalories / profile.targetCalories) * 100 : 0} 
                className="h-2 mt-2"
              />
            </div>

            <div className="space-y-3">
              <MacroProgress
                label="Protein"
                current={totalProtein}
                target={profile?.proteinGrams || 150}
                color="hsl(var(--chart-1))"
              />
              <MacroProgress
                label="Carbohydrates"
                current={totalCarbs}
                target={profile?.carbsGrams || 200}
                color="hsl(var(--chart-2))"
              />
              <MacroProgress
                label="Fat"
                current={totalFat}
                target={profile?.fatGrams || 70}
                color="hsl(var(--chart-4))"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Food
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="mealType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meal</FormLabel>
                      <Select 
                        onValueChange={(val) => {
                          field.onChange(val);
                          setSelectedMeal(val as typeof selectedMeal);
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-meal-type">
                            <SelectValue placeholder="Select meal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="breakfast">Breakfast</SelectItem>
                          <SelectItem value="lunch">Lunch</SelectItem>
                          <SelectItem value="dinner">Dinner</SelectItem>
                          <SelectItem value="snack">Snack</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Food Database Search */}
                <div className="space-y-2">
                  <FormLabel className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Search Food Database
                  </FormLabel>
                  <FoodSearch onSelect={handleFoodSelect} />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or enter manually</span>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="foodName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Food Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Grilled chicken breast" {...field} data-testid="input-food-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="calories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Calories</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="kcal"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-food-calories"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="proteinGrams"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Protein (g)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="g"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            data-testid="input-food-protein"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="carbsGrams"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carbs (g)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="g"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            data-testid="input-food-carbs"
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
                            placeholder="g"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            data-testid="input-food-fat"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={addFoodMutation.isPending} data-testid="button-add-food">
                  <Plus className="h-4 w-4 mr-2" />
                  {addFoodMutation.isPending ? "Adding..." : "Add Food"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Quick Add
          </CardTitle>
          <CardDescription>Common foods for fast logging</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {quickAddFoods.map((food, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAdd(food)}
                disabled={addFoodMutation.isPending}
                data-testid={`button-quick-add-${i}`}
              >
                {food.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {(["breakfast", "lunch", "dinner", "snack"] as const).map((meal) => (
          <Card key={meal}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base capitalize">{meal}</CardTitle>
              <CardDescription>
                {mealEntries[meal].reduce((sum, e) => sum + (e.calories || 0), 0)} kcal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {mealEntries[meal].length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No foods logged yet
                </p>
              ) : (
                mealEntries[meal].map((entry) => (
                  <FoodEntryCard
                    key={entry.id}
                    entry={entry}
                    onDelete={(id) => deleteFoodMutation.mutate(id)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
