/**
 * USDA FoodData Central API Integration
 * https://fdc.nal.usda.gov/api-guide.html
 *
 * Free API with 300K+ foods - no API key required for basic searches
 */

export interface USDAFood {
  fdcId: number;
  description: string;
  dataType: string;
  brandName?: string;
  brandOwner?: string;
  ingredients?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: USDANutrient[];
}

export interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  unitName: string;
  value: number;
}

export interface USDASearchResult {
  totalHits: number;
  currentPage: number;
  totalPages: number;
  foods: USDAFood[];
}

// Nutrient IDs we care about
const NUTRIENT_IDS = {
  ENERGY: 1008, // Calories (kcal)
  PROTEIN: 1003,
  FAT: 1004,
  CARBS: 1005,
  FIBER: 1079,
};

// Map USDA food to our app format
export interface FoodSearchResult {
  id: string;
  name: string;
  brandName?: string;
  servingSize: string | null;
  calories: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatGrams: number | null;
  fiberGrams: number | null;
  category: string | null;
  source: "usda" | "local";
}

function getNutrientValue(nutrients: USDANutrient[], nutrientId: number): number | null {
  const nutrient = nutrients.find(n => n.nutrientId === nutrientId);
  return nutrient ? Math.round(nutrient.value * 10) / 10 : null;
}

function categorizeFood(description: string, nutrients: USDANutrient[]): string | null {
  const desc = description.toLowerCase();
  const protein = getNutrientValue(nutrients, NUTRIENT_IDS.PROTEIN) || 0;
  const carbs = getNutrientValue(nutrients, NUTRIENT_IDS.CARBS) || 0;
  const fat = getNutrientValue(nutrients, NUTRIENT_IDS.FAT) || 0;

  // Categorize based on dominant macronutrient and keywords
  if (desc.includes("vegetable") || desc.includes("broccoli") || desc.includes("spinach") ||
      desc.includes("carrot") || desc.includes("lettuce") || desc.includes("tomato") ||
      desc.includes("cucumber") || desc.includes("pepper") || desc.includes("onion")) {
    return "vegetables";
  }

  if (desc.includes("chicken") || desc.includes("beef") || desc.includes("fish") ||
      desc.includes("salmon") || desc.includes("tuna") || desc.includes("turkey") ||
      desc.includes("egg") || desc.includes("pork") || desc.includes("shrimp") ||
      protein > 15 && protein > carbs && protein > fat) {
    return "protein";
  }

  if (desc.includes("rice") || desc.includes("bread") || desc.includes("pasta") ||
      desc.includes("oat") || desc.includes("cereal") || desc.includes("potato") ||
      desc.includes("beans") || desc.includes("fruit") || desc.includes("apple") ||
      desc.includes("banana") || carbs > 20 && carbs > protein * 2) {
    return "carbs";
  }

  if (desc.includes("oil") || desc.includes("butter") || desc.includes("cheese") ||
      desc.includes("avocado") || desc.includes("nuts") || desc.includes("almond") ||
      desc.includes("peanut") || fat > 15 && fat > protein && fat > carbs / 2) {
    return "fats";
  }

  return null;
}

function mapUSDAFoodToResult(food: USDAFood): FoodSearchResult {
  const nutrients = food.foodNutrients || [];

  // Build serving size string
  let servingSize: string | null = null;
  if (food.servingSize && food.servingSizeUnit) {
    servingSize = `${food.servingSize} ${food.servingSizeUnit}`;
  } else {
    servingSize = "100g"; // USDA default per 100g
  }

  // Build name with brand if available
  let name = food.description;
  if (food.brandName && !name.toLowerCase().includes(food.brandName.toLowerCase())) {
    name = `${food.brandName} ${name}`;
  }

  return {
    id: `usda-${food.fdcId}`,
    name: name.length > 100 ? name.substring(0, 97) + "..." : name,
    brandName: food.brandName,
    servingSize,
    calories: getNutrientValue(nutrients, NUTRIENT_IDS.ENERGY),
    proteinGrams: getNutrientValue(nutrients, NUTRIENT_IDS.PROTEIN),
    carbsGrams: getNutrientValue(nutrients, NUTRIENT_IDS.CARBS),
    fatGrams: getNutrientValue(nutrients, NUTRIENT_IDS.FAT),
    fiberGrams: getNutrientValue(nutrients, NUTRIENT_IDS.FIBER),
    category: categorizeFood(food.description, nutrients),
    source: "usda",
  };
}

/**
 * Search USDA FoodData Central for foods
 * @param query Search term
 * @param pageSize Number of results (max 50)
 */
export async function searchUSDAFoods(query: string, pageSize: number = 25): Promise<FoodSearchResult[]> {
  try {
    const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";

    const params = new URLSearchParams({
      query,
      pageSize: Math.min(pageSize, 50).toString(),
      dataType: "Foundation,SR Legacy,Branded", // Include branded foods for more results
    });

    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&${params}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`USDA API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: USDASearchResult = await response.json();

    // Map and filter results
    const results = data.foods
      .map(mapUSDAFoodToResult)
      .filter(food => food.calories !== null); // Only return foods with calorie data

    return results;
  } catch (error) {
    console.error("Error searching USDA foods:", error);
    return [];
  }
}

/**
 * Get details for a specific USDA food by ID
 */
export async function getUSDAFoodDetails(fdcId: number): Promise<FoodSearchResult | null> {
  try {
    const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";
    const url = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${apiKey}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`USDA API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const food: USDAFood = await response.json();
    return mapUSDAFoodToResult(food);
  } catch (error) {
    console.error("Error fetching USDA food details:", error);
    return null;
  }
}
