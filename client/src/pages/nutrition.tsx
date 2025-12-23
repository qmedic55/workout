import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { format, subDays, addDays, isToday } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Utensils, Target, Calculator, Search, Bookmark, BookmarkPlus, ScanBarcode, CalendarIcon, ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { FoodSearch } from "@/components/food-search";
import { BarcodeScanner } from "@/components/barcode-scanner";
import type { FoodEntry, UserProfile, DailyLog, MealTemplate } from "@shared/schema";

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

function FoodEntryCard({
  entry,
  onDelete,
  onDragStart,
  isDragging = false,
}: {
  entry: FoodEntry;
  onDelete: (id: string) => void;
  onDragStart?: (e: React.DragEvent, entry: FoodEntry) => void;
  isDragging?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg bg-muted/50 transition-all ${
        isDragging ? "opacity-50 ring-2 ring-primary" : ""
      } ${onDragStart ? "cursor-grab active:cursor-grabbing" : ""}`}
      draggable={!!onDragStart}
      onDragStart={(e) => onDragStart?.(e, entry)}
    >
      {onDragStart && (
        <GripVertical className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
      )}
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

// Meal Template Card Component
function MealTemplateCard({
  template,
  onLog,
  onDelete,
  isLogging,
}: {
  template: MealTemplate;
  onLog: (id: string, mealType: string) => void;
  onDelete: (id: string) => void;
  isLogging: boolean;
}) {
  const [selectedMealType, setSelectedMealType] = useState(template.mealType || "snack");

  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-medium">{template.name}</h4>
          <p className="text-xs text-muted-foreground">
            {(template.items as any[]).length} items • Used {template.usageCount || 0} times
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(template.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Badge variant="secondary">{template.totalCalories || 0} kcal</Badge>
        <span className="text-xs text-muted-foreground">
          P: {template.totalProtein?.toFixed(0) || 0}g | C: {template.totalCarbs?.toFixed(0) || 0}g | F: {template.totalFat?.toFixed(0) || 0}g
        </span>
      </div>

      <div className="flex gap-2">
        <Select value={selectedMealType} onValueChange={setSelectedMealType}>
          <SelectTrigger className="w-28 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="breakfast">Breakfast</SelectItem>
            <SelectItem value="lunch">Lunch</SelectItem>
            <SelectItem value="dinner">Dinner</SelectItem>
            <SelectItem value="snack">Snack</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={() => onLog(template.id, selectedMealType)}
          disabled={isLogging}
          className="flex-1"
        >
          <Plus className="h-4 w-4 mr-1" />
          Log Meal
        </Button>
      </div>
    </div>
  );
}

// Create Template Dialog
function CreateTemplateDialog({
  open,
  onOpenChange,
  foodEntries,
  selectedMeal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  foodEntries: FoodEntry[];
  selectedMeal: string;
}) {
  const { toast } = useToast();
  const [templateName, setTemplateName] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; mealType: string; items: any[] }) => {
      const response = await apiRequest("POST", "/api/meal-templates", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-templates"] });
      toast({ title: "Template saved", description: "Your meal template has been created." });
      onOpenChange(false);
      setTemplateName("");
      setSelectedItems([]);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCreate = () => {
    if (!templateName.trim()) {
      toast({ title: "Error", description: "Please enter a template name", variant: "destructive" });
      return;
    }

    const itemsToSave = selectedItems.length > 0
      ? foodEntries.filter(e => selectedItems.includes(e.id))
      : foodEntries.filter(e => e.mealType === selectedMeal);

    if (itemsToSave.length === 0) {
      toast({ title: "Error", description: "No food items selected", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      name: templateName.trim(),
      mealType: selectedMeal,
      items: itemsToSave.map(e => ({
        foodName: e.foodName,
        servingSize: e.servingSize,
        quantity: e.servingQuantity || 1,
        calories: e.calories,
        proteinGrams: e.proteinGrams,
        carbsGrams: e.carbsGrams,
        fatGrams: e.fatGrams,
      })),
    });
  };

  const mealItems = foodEntries.filter(e => e.mealType === selectedMeal);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as Meal Template</DialogTitle>
          <DialogDescription>
            Save your current {selectedMeal} as a template for quick logging later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Template Name</label>
            <Input
              placeholder="e.g., Morning Protein Shake"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Foods to include</label>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {mealItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No foods logged for {selectedMeal} yet.</p>
              ) : (
                mealItems.map((entry) => (
                  <label key={entry.id} className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === 0 || selectedItems.includes(entry.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(prev => prev.length === 0 ? [entry.id] : [...prev, entry.id]);
                        } else {
                          setSelectedItems(prev => prev.filter(id => id !== entry.id));
                        }
                      }}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{entry.foodName}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.calories || 0} kcal • P: {entry.proteinGrams?.toFixed(0) || 0}g
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <Button
            onClick={handleCreate}
            disabled={createMutation.isPending || mealItems.length === 0}
            className="w-full"
          >
            <BookmarkPlus className="h-4 w-4 mr-2" />
            {createMutation.isPending ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Nutrition() {
  const [selectedMeal, setSelectedMeal] = useState<"breakfast" | "lunch" | "dinner" | "snack">("breakfast");
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false);
  const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { toast } = useToast();
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const viewingToday = isToday(selectedDate);

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    staleTime: 30000, // Consider stale after 30 seconds to pick up AI changes
    refetchOnMount: "always", // Always refetch when navigating to this page
  });

  const { data: todayLog } = useQuery<DailyLog>({
    queryKey: ["/api/daily-logs/today"],
  });

  const { data: foodEntries = [], isLoading } = useQuery<FoodEntry[]>({
    queryKey: ["/api/food-entries", dateStr],
  });

  // Meal templates query and mutations
  const { data: mealTemplates = [] } = useQuery<MealTemplate[]>({
    queryKey: ["/api/meal-templates"],
  });

  const logTemplateMutation = useMutation({
    mutationFn: async ({ id, mealType }: { id: string; mealType: string }) => {
      const response = await apiRequest("POST", `/api/meal-templates/${id}/log`, { mealType });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-logs/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meal-templates"] });
      toast({ title: "Meal logged", description: "Template foods added to your log." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/meal-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-templates"] });
      toast({ title: "Deleted", description: "Meal template removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
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
        logDate: dateStr,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-logs/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-logs", dateStr] });
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

  // Drag and drop state for moving food between meals
  const [draggingEntry, setDraggingEntry] = useState<FoodEntry | null>(null);
  const [dragOverMeal, setDragOverMeal] = useState<string | null>(null);

  // Mutation to move food to a different meal
  const moveFoodMutation = useMutation({
    mutationFn: async ({ id, mealType }: { id: string; mealType: string }) => {
      const response = await apiRequest("PATCH", `/api/food-entries/${id}`, { mealType });
      return response.json();
    },
    onSuccess: (_, { mealType }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-entries"] });
      toast({ title: "Food moved", description: `Moved to ${mealType}.` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleDragStart = (e: React.DragEvent, entry: FoodEntry) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", entry.id);
    setDraggingEntry(entry);
  };

  const handleDragEnd = () => {
    setDraggingEntry(null);
    setDragOverMeal(null);
  };

  const handleDragOver = (e: React.DragEvent, mealType: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverMeal(mealType);
  };

  const handleDragLeave = () => {
    setDragOverMeal(null);
  };

  const handleDrop = (e: React.DragEvent, targetMealType: string) => {
    e.preventDefault();
    const entryId = e.dataTransfer.getData("text/plain");
    if (entryId && draggingEntry && draggingEntry.mealType !== targetMealType) {
      moveFoodMutation.mutate({ id: entryId, mealType: targetMealType });
    }
    setDraggingEntry(null);
    setDragOverMeal(null);
  };

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Nutrition Tracker</h1>
          <p className="text-muted-foreground">Log your meals and track your macros</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[180px]">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {viewingToday ? "Today" : format(selectedDate, "MMM d, yyyy")}
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

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            disabled={viewingToday}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {!viewingToday && (
            <Button variant="secondary" size="sm" onClick={() => setSelectedDate(new Date())}>
              Today
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {viewingToday ? "Today's Summary" : "Daily Summary"}
            </CardTitle>
            <CardDescription>
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
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

                {/* Food Database Search + Barcode Scanner */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <FormLabel className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Search Food Database
                    </FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setBarcodeScannerOpen(true)}
                    >
                      <ScanBarcode className="h-4 w-4 mr-1" />
                      Scan
                    </Button>
                  </div>
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

      {/* My Meals / Saved Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5" />
                My Meals
              </CardTitle>
              <CardDescription>Saved meal templates for quick logging</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateTemplateOpen(true)}
              disabled={foodEntries.length === 0}
            >
              <BookmarkPlus className="h-4 w-4 mr-2" />
              Save Current Meal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {mealTemplates.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No saved meal templates yet.</p>
              <p className="text-xs mt-1">Log some foods, then click "Save Current Meal" to create a template.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mealTemplates.map((template) => (
                <MealTemplateCard
                  key={template.id}
                  template={template}
                  onLog={(id, mealType) => logTemplateMutation.mutate({ id, mealType })}
                  onDelete={(id) => deleteTemplateMutation.mutate(id)}
                  isLogging={logTemplateMutation.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Template Dialog */}
      <CreateTemplateDialog
        open={createTemplateOpen}
        onOpenChange={setCreateTemplateOpen}
        foodEntries={foodEntries}
        selectedMeal={selectedMeal}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {(["breakfast", "lunch", "dinner", "snack"] as const).map((meal) => (
          <Card
            key={meal}
            className={`transition-all ${
              dragOverMeal === meal && draggingEntry?.mealType !== meal
                ? "ring-2 ring-primary ring-offset-2 bg-primary/5"
                : ""
            }`}
            onDragOver={(e) => handleDragOver(e, meal)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, meal)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base capitalize">{meal}</CardTitle>
                  <CardDescription>
                    {mealEntries[meal].reduce((sum, e) => sum + (e.calories || 0), 0)} kcal
                  </CardDescription>
                </div>
                {dragOverMeal === meal && draggingEntry?.mealType !== meal && (
                  <Badge variant="secondary" className="animate-pulse">
                    Drop here
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {mealEntries[meal].length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {draggingEntry ? "Drop food here" : "No foods logged yet"}
                </p>
              ) : (
                <div onDragEnd={handleDragEnd}>
                  {mealEntries[meal].map((entry) => (
                    <FoodEntryCard
                      key={entry.id}
                      entry={entry}
                      onDelete={(id) => deleteFoodMutation.mutate(id)}
                      onDragStart={handleDragStart}
                      isDragging={draggingEntry?.id === entry.id}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Barcode Scanner */}
      <BarcodeScanner
        open={barcodeScannerOpen}
        onOpenChange={setBarcodeScannerOpen}
        onProductSelect={handleFoodSelect}
      />
    </div>
  );
}
