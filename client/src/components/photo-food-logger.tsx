import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Camera, ImagePlus, Loader2, Check, X, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface PhotoFoodItem {
  name: string;
  servingSize: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  confidence: number;
  selected: boolean;
}

interface PhotoAnalysisResult {
  success: boolean;
  items: Omit<PhotoFoodItem, "selected">[];
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  error?: string;
}

interface PhotoFoodLoggerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date?: string;
  onSuccess?: () => void;
}

export function PhotoFoodLogger({
  open,
  onOpenChange,
  date,
  onSuccess,
}: PhotoFoodLoggerProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [imageType, setImageType] = useState<string>("image/jpeg");
  const [mealType, setMealType] = useState<string>("lunch");
  const [analyzedItems, setAnalyzedItems] = useState<PhotoFoodItem[]>([]);
  const [step, setStep] = useState<"capture" | "analyze" | "review">("capture");

  const logDate = date || format(new Date(), "yyyy-MM-dd");

  const analyzeMutation = useMutation({
    mutationFn: async (image: string) => {
      const response = await apiRequest("POST", "/api/food/photo", {
        image,
        imageType,
      });
      return response.json() as Promise<PhotoAnalysisResult>;
    },
    onSuccess: (data) => {
      if (data.success && data.items.length > 0) {
        setAnalyzedItems(
          data.items.map((item) => ({ ...item, selected: true }))
        );
        setStep("review");
      } else {
        toast({
          title: "No food detected",
          description: "Could not identify any food in the image. Try a clearer photo.",
          variant: "destructive",
        });
        setStep("capture");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze the photo",
        variant: "destructive",
      });
      setStep("capture");
    },
  });

  const saveFoodMutation = useMutation({
    mutationFn: async (items: PhotoFoodItem[]) => {
      const selectedItems = items.filter((item) => item.selected);

      // Create food entries for each selected item
      const promises = selectedItems.map((item) =>
        apiRequest("POST", "/api/food-entries", {
          date: logDate,
          mealType,
          foodName: item.name,
          servingSize: item.servingSize,
          servingQuantity: 1,
          calories: item.calories,
          proteinGrams: item.proteinGrams,
          carbsGrams: item.carbsGrams,
          fatGrams: item.fatGrams,
          source: "photo_ai",
        })
      );

      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-logs/today"] });
      toast({
        title: "Food logged!",
        description: `${analyzedItems.filter(i => i.selected).length} item(s) added to your ${mealType}`,
      });
      handleClose();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving food",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image under 10MB.",
        variant: "destructive",
      });
      return;
    }

    setImageType(file.type);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);

      // Extract base64 data (remove data:image/xxx;base64, prefix)
      const base64 = result.split(",")[1];
      setBase64Image(base64);
      setStep("analyze");
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnalyze = () => {
    if (base64Image) {
      analyzeMutation.mutate(base64Image);
    }
  };

  const handleSave = () => {
    saveFoodMutation.mutate(analyzedItems);
  };

  const handleClose = () => {
    setPreviewUrl(null);
    setBase64Image(null);
    setAnalyzedItems([]);
    setStep("capture");
    onOpenChange(false);
  };

  const toggleItemSelection = (index: number) => {
    setAnalyzedItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const selectedItems = analyzedItems.filter((item) => item.selected);
  const totalNutrition = selectedItems.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.proteinGrams,
      carbs: acc.carbs + item.carbsGrams,
      fat: acc.fat + item.fatGrams,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photo Food Logger
          </DialogTitle>
          <DialogDescription>
            {step === "capture" && "Take a photo or select an image of your meal"}
            {step === "analyze" && "Analyzing your meal..."}
            {step === "review" && "Review detected items and log them"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Capture */}
          {step === "capture" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="photo-food-input"
                />
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.removeAttribute("capture");
                      fileInputRef.current.click();
                      fileInputRef.current.setAttribute("capture", "environment");
                    }
                  }}
                >
                  <ImagePlus className="h-4 w-4 mr-2" />
                  Gallery
                </Button>
              </div>

              <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Point at your meal for best results</p>
              </div>
            </div>
          )}

          {/* Step 2: Analyze */}
          {step === "analyze" && previewUrl && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Food preview"
                  className="w-full max-h-48 object-cover"
                />
                {analyzeMutation.isPending && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium">Analyzing your meal...</p>
                      <p className="text-xs text-muted-foreground">This may take a few seconds</p>
                    </div>
                  </div>
                )}
              </div>

              {!analyzeMutation.isPending && (
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep("capture")}>
                    <X className="h-4 w-4 mr-2" />
                    Retake
                  </Button>
                  <Button className="flex-1" onClick={handleAnalyze}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {step === "review" && (
            <div className="space-y-4">
              {previewUrl && (
                <div className="rounded-lg overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Food preview"
                    className="w-full max-h-32 object-cover"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Meal Type</Label>
                <Select value={mealType} onValueChange={setMealType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Detected Items
                </Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {analyzedItems.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        item.selected ? "bg-primary/5 border-primary/20" : "bg-muted/30"
                      }`}
                    >
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={() => toggleItemSelection(index)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm truncate">{item.name}</span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {Math.round(item.confidence * 100)}% sure
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.servingSize}</p>
                        <div className="flex gap-3 mt-1 text-xs">
                          <span>{item.calories} cal</span>
                          <span>{item.proteinGrams}g P</span>
                          <span>{item.carbsGrams}g C</span>
                          <span>{item.fatGrams}g F</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedItems.length > 0 && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm font-medium mb-1">Total for selected items:</p>
                  <div className="flex gap-4 text-sm">
                    <span>{totalNutrition.calories} cal</span>
                    <span>{totalNutrition.protein}g protein</span>
                    <span>{totalNutrition.carbs}g carbs</span>
                    <span>{totalNutrition.fat}g fat</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("capture")}
                >
                  Try Again
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={selectedItems.length === 0 || saveFoodMutation.isPending}
                >
                  {saveFoodMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Log {selectedItems.length} Item{selectedItems.length !== 1 ? "s" : ""}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
