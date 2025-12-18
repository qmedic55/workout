/**
 * AI Action Parser
 *
 * This module parses AI responses to detect recommended changes
 * and automatically applies them to the user's profile.
 *
 * The AI is instructed to include a structured JSON block when recommending changes.
 */

import OpenAI from "openai";
import type { UserProfile, InsertProfileChange } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Types for AI-recommended changes
export interface AIRecommendedChange {
  category: "nutrition" | "training" | "sleep" | "phase" | "goals" | "general";
  field: string;
  previousValue: string | number | null;
  newValue: string | number;
  description: string;
  reasoning: string;
}

export interface ParsedAIActions {
  hasChanges: boolean;
  changes: AIRecommendedChange[];
  messageSummary: string;
}

// Map of field names to profile fields for auto-applying
const PROFILE_FIELD_MAP: Record<string, { field: keyof UserProfile; category: string }> = {
  targetCalories: { field: "targetCalories", category: "nutrition" },
  calories: { field: "targetCalories", category: "nutrition" },
  proteinGrams: { field: "proteinGrams", category: "nutrition" },
  protein: { field: "proteinGrams", category: "nutrition" },
  carbsGrams: { field: "carbsGrams", category: "nutrition" },
  carbs: { field: "carbsGrams", category: "nutrition" },
  fatGrams: { field: "fatGrams", category: "nutrition" },
  fat: { field: "fatGrams", category: "nutrition" },
  dailyStepsTarget: { field: "dailyStepsTarget", category: "training" },
  steps: { field: "dailyStepsTarget", category: "training" },
  currentPhase: { field: "currentPhase", category: "phase" },
  phase: { field: "currentPhase", category: "phase" },
  targetWeightKg: { field: "targetWeightKg", category: "goals" },
  targetWeight: { field: "targetWeightKg", category: "goals" },
};

/**
 * Parse AI response to extract any recommended changes
 * Uses a secondary AI call to extract structured data from the response
 */
export async function parseAIResponseForActions(
  aiResponse: string,
  currentProfile: UserProfile
): Promise<ParsedAIActions> {
  try {
    // Use AI to parse the response and extract any recommended changes
    const parseResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Use smaller model for parsing to save cost
      messages: [
        {
          role: "system",
          content: `You are a parser that extracts health coaching recommendations from AI responses.
Your job is to identify when the AI mentor is recommending specific, quantifiable changes to:
- Calories (targetCalories)
- Protein intake (proteinGrams)
- Carbs intake (carbsGrams)
- Fat intake (fatGrams)
- Daily step target (dailyStepsTarget)
- Training phase (currentPhase: "recovery", "recomp", or "cutting")
- Target weight (targetWeightKg)

IMPORTANT: Extract ANY specific numerical target the AI mentions as a recommendation, even if phrased conversationally.
Look for phrases like:
- "I'm adjusting your calories to..."
- "Let's increase your protein to..."
- "I recommend changing your phase to..."
- "Your new target should be..."
- "you should aim for X calories"
- "I suggest X calories per day"
- "target X calories"
- "let's set your calories at X"
- "X calories would be appropriate"
- "a target of X calories"
- "aim for around X calories"
- "your daily intake should be X"
- Any mention of a SPECIFIC number followed by "calories", "kcal", "protein", "carbs", "fat", "steps", etc.

DO extract changes when:
- The AI gives a specific number as a target or recommendation
- The AI says "should", "recommend", "suggest", "aim for", "target", "set to", "adjust to"
- The AI provides a new calorie/macro number that differs from the current profile

DO NOT extract changes when:
- The AI is just describing what the user currently eats
- The AI mentions numbers in a hypothetical or educational context without recommending them
- The AI asks a question about what the user wants

Return a JSON object with this structure:
{
  "hasChanges": boolean,
  "changes": [
    {
      "category": "nutrition" | "training" | "sleep" | "phase" | "goals" | "general",
      "field": "the field name (e.g., targetCalories, proteinGrams)",
      "newValue": "the recommended value (NUMBER ONLY, no units)",
      "description": "Human-readable description of the change",
      "reasoning": "Why this change is being made"
    }
  ],
  "messageSummary": "One-sentence summary of what the AI recommended"
}

If no quantifiable changes are recommended, return: {"hasChanges": false, "changes": [], "messageSummary": "General coaching conversation"}`,
        },
        {
          role: "user",
          content: `Current user profile values:
- Target Calories: ${currentProfile.targetCalories || "Not set"}
- Protein: ${currentProfile.proteinGrams || "Not set"}g
- Carbs: ${currentProfile.carbsGrams || "Not set"}g
- Fat: ${currentProfile.fatGrams || "Not set"}g
- Daily Steps Target: ${currentProfile.dailyStepsTarget || 8000}
- Current Phase: ${currentProfile.currentPhase || "assessment"}
- Target Weight: ${currentProfile.targetWeightKg || "Not set"}kg

AI Response to parse:
"""
${aiResponse}
"""

Extract any specific, quantifiable changes being recommended. Return JSON only.`,
        },
      ],
      temperature: 0.1, // Low temperature for consistent parsing
      response_format: { type: "json_object" },
    });

    const content = parseResponse.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content) as ParsedAIActions;

    // Add previous values from current profile
    if (parsed.changes && parsed.changes.length > 0) {
      parsed.changes = parsed.changes.map((change) => {
        const mapping = PROFILE_FIELD_MAP[change.field];
        if (mapping) {
          const rawValue = currentProfile[mapping.field];
          // Convert to string/number/null for type safety
          let previousValue: string | number | null = null;
          if (rawValue !== null && rawValue !== undefined) {
            previousValue = typeof rawValue === 'boolean' || rawValue instanceof Date
              ? String(rawValue)
              : rawValue;
          }
          return {
            ...change,
            category: mapping.category as AIRecommendedChange["category"],
            previousValue,
          };
        }
        return { ...change, previousValue: null };
      });
    }

    return parsed;
  } catch (error) {
    console.error("Error parsing AI response for actions:", error);
    return {
      hasChanges: false,
      changes: [],
      messageSummary: "Error parsing response",
    };
  }
}

/**
 * Apply parsed changes to user profile
 * Returns the updates to be made and change records to be logged
 */
export function prepareProfileUpdates(
  changes: AIRecommendedChange[],
  currentProfile: UserProfile,
  chatMessageId: string
): {
  profileUpdates: Partial<UserProfile>;
  changeRecords: InsertProfileChange[];
} {
  const profileUpdates: Partial<UserProfile> = {};
  const changeRecords: InsertProfileChange[] = [];

  for (const change of changes) {
    const mapping = PROFILE_FIELD_MAP[change.field];
    if (!mapping) continue;

    // Validate the new value
    let newValue = change.newValue;

    // Type conversion and validation
    if (["targetCalories", "proteinGrams", "carbsGrams", "fatGrams", "dailyStepsTarget", "targetWeightKg"].includes(mapping.field)) {
      newValue = Number(newValue);
      if (isNaN(newValue) || newValue <= 0) continue;
    }

    // Validate phase values
    if (mapping.field === "currentPhase") {
      if (!["recovery", "recomp", "cutting"].includes(String(newValue))) continue;
    }

    // Add to profile updates
    (profileUpdates as any)[mapping.field] = newValue;

    // Create change record
    changeRecords.push({
      userId: currentProfile.userId,
      chatMessageId,
      changeCategory: change.category,
      fieldName: mapping.field,
      changeDescription: change.description,
      previousValue: String(change.previousValue ?? ""),
      newValue: String(newValue),
      reasoning: change.reasoning,
      source: "ai_chat",
    });
  }

  return { profileUpdates, changeRecords };
}

/**
 * Generate a summary of all changes for display
 */
export function generateChangeSummary(changes: AIRecommendedChange[]): string {
  if (changes.length === 0) return "";

  const summaryParts = changes.map((change) => {
    if (change.previousValue !== null && change.previousValue !== undefined) {
      return `${change.description}: ${change.previousValue} → ${change.newValue}`;
    }
    return `${change.description}: ${change.newValue}`;
  });

  return summaryParts.join("\n");
}

/**
 * Format change notification message
 */
export function formatChangeNotification(changes: AIRecommendedChange[]): string {
  if (changes.length === 0) return "";

  const changeDescriptions = changes.map((c) => `• ${c.description}`).join("\n");
  return `Based on our conversation, I've updated your plan:\n\n${changeDescriptions}\n\nYou can view your change history in Settings.`;
}
