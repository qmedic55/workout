import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Loader2 } from "lucide-react";

interface FoodDatabaseItem {
  id: string;
  name: string;
  servingSize: string | null;
  calories: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatGrams: number | null;
  fiberGrams: number | null;
  category: string | null;
}

interface FoodSearchProps {
  onSelect: (food: FoodDatabaseItem) => void;
}

export function FoodSearch({ onSelect }: FoodSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: foods = [], isLoading } = useQuery<FoodDatabaseItem[]>({
    queryKey: ["/api/foods", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      const res = await fetch(`/api/foods?q=${encodeURIComponent(debouncedQuery)}`);
      if (!res.ok) throw new Error("Failed to search foods");
      return res.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  const handleSelect = (food: FoodDatabaseItem) => {
    onSelect(food);
    setQuery("");
    setDebouncedQuery("");
  };

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case "protein":
        return "bg-chart-1/10 text-chart-1";
      case "carbs":
        return "bg-chart-2/10 text-chart-2";
      case "fats":
        return "bg-chart-4/10 text-chart-4";
      case "vegetables":
        return "bg-chart-3/10 text-chart-3";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search foods... (e.g., chicken, rice, salmon)"
          className="pl-9"
          data-testid="input-food-search"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {debouncedQuery.length >= 2 && (
        <div className="max-h-60 overflow-y-auto space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Searching...</p>
          ) : foods.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No foods found for "{debouncedQuery}"
            </p>
          ) : (
            foods.map((food) => (
              <Card
                key={food.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSelect(food)}
              >
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{food.name}</p>
                      {food.category && (
                        <Badge variant="secondary" className={`text-xs ${getCategoryColor(food.category)}`}>
                          {food.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {food.servingSize && `${food.servingSize} • `}
                      {food.calories ?? 0} kcal • P: {food.proteinGrams ?? 0}g • C: {food.carbsGrams ?? 0}g • F: {food.fatGrams ?? 0}g
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" className="shrink-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {query.length > 0 && query.length < 2 && (
        <p className="text-xs text-muted-foreground">Type at least 2 characters to search</p>
      )}
    </div>
  );
}
