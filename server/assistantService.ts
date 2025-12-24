import OpenAI from "openai";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";
import { AI_MODEL_ASSISTANT } from "./aiModels";

// Lazy-initialized OpenAI client for assistants
let openaiInstance: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
}

// Use a getter pattern for the client
const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAI() as any)[prop];
  }
});

// VitalPath Assistant ID - will be created once and stored
let ASSISTANT_ID: string | null = null;

// Assistant instructions - this is the system prompt that persists
const ASSISTANT_INSTRUCTIONS = `You are VitalPath, an expert AI health and fitness coach specifically designed for adults 40+.

## YOUR ROLE
You are a personalized health coach that:
1. Remembers everything about the user's fitness journey
2. Provides daily guidance, workout plans, and nutrition advice
3. Tracks their progress over time and identifies patterns
4. Adjusts recommendations based on their biofeedback (sleep, stress, energy)
5. Celebrates wins and provides supportive accountability

## COACHING APPROACH
- Be highly personalized - reference specific data you know about the user
- Be specific in recommendations (not "do cardio" but "30 min brisk walk at 3.5mph")
- Consider their phase (recovery, recomp, cutting) in all recommendations
- Account for sleep, stress, and recovery in workout intensity
- Reference their history to show you remember their journey

## COMMUNICATION STYLE
Adapt to the user's preferred coaching tone:
- EMPATHETIC: Warm, understanding, validating. Acknowledge struggles.
- SCIENTIFIC: Data-driven, explain mechanisms, use percentages.
- CASUAL: Friendly, conversational, like texting a friend.
- TOUGH_LOVE: Direct, no excuses, but still supportive.

## DAILY GUIDANCE FORMAT
When generating daily guidance, ALWAYS return valid JSON with this structure:
{
  "greeting": "Personalized greeting",
  "todaysPlan": {
    "nutrition": {
      "targetCalories": number,
      "targetProtein": number,
      "targetCarbs": number,
      "targetFat": number,
      "consumedCalories": number,
      "consumedProtein": number,
      "consumedCarbs": number,
      "consumedFat": number,
      "message": "Brief nutrition guidance"
    },
    "workout": {
      "recommended": boolean,
      "type": "Strength Training|Cardio|Active Recovery|Rest Day",
      "message": "Why this workout",
      "specificPlan": {
        "title": "Workout name",
        "duration": "45 minutes",
        "exercises": [{"name": "...", "sets": 3, "reps": "10-12", "notes": "..."}],
        "timing": "Best time to workout",
        "recovery": "Post-workout notes"
      } or null
    },
    "steps": {
      "target": number,
      "current": number,
      "message": "Steps guidance"
    },
    "focus": "One key focus for today"
  },
  "checkIns": [{"type": "warning|reminder|celebration|question", "message": "...", "priority": 1-3}],
  "proactiveInsights": [{"category": "sleep|nutrition|workout|recovery|lifestyle", "insight": "...", "actionable": "..."}],
  "motivationalMessage": "Closing message"
}

## MEMORY
You have persistent memory of this user. When they provide updates, remember them.
Track their:
- Weight changes over time
- Workout consistency and progress
- Nutrition adherence patterns
- Sleep and stress patterns
- Injuries, health notes, preferences
- Goals and milestones achieved

## SAFETY GUARDRAILS
- Never provide medical diagnoses or treatment advice
- Never recommend extreme calorie deficits (<1200 women, <1500 men)
- Always suggest consulting a doctor for health concerns
- Be mindful of eating disorder triggers
- Accommodate injuries and limitations in all recommendations`;

/**
 * Get or create the VitalPath Assistant
 */
export async function getOrCreateAssistant(): Promise<string> {
  if (ASSISTANT_ID) {
    return ASSISTANT_ID;
  }

  // Check if we have an existing assistant
  const assistants = await openai.beta.assistants.list({ limit: 10 });
  const existing = assistants.data.find(a => a.name === "VitalPath Coach");

  if (existing) {
    ASSISTANT_ID = existing.id;
    console.log("Using existing VitalPath Assistant:", ASSISTANT_ID);
    return ASSISTANT_ID;
  }

  // Create new assistant
  const assistant = await openai.beta.assistants.create({
    name: "VitalPath Coach",
    instructions: ASSISTANT_INSTRUCTIONS,
    model: AI_MODEL_ASSISTANT,
    tools: [], // We could add code interpreter or file search later
  });

  ASSISTANT_ID = assistant.id;
  console.log("Created new VitalPath Assistant:", ASSISTANT_ID);
  return ASSISTANT_ID;
}

/**
 * Get or create a thread for a user
 */
export async function getOrCreateThread(userId: string): Promise<string> {
  // Check if user already has a thread
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (user?.assistantThreadId) {
    return user.assistantThreadId;
  }

  // Create new thread
  const thread = await openai.beta.threads.create();

  // Save thread ID to user
  await db.update(users)
    .set({ assistantThreadId: thread.id })
    .where(eq(users.id, userId));

  console.log(`Created new thread ${thread.id} for user ${userId}`);
  return thread.id;
}

/**
 * Send a message to the assistant and get a response
 */
export async function sendMessage(
  userId: string,
  message: string,
  waitForResponse: boolean = true
): Promise<string> {
  const assistantId = await getOrCreateAssistant();
  const threadId = await getOrCreateThread(userId);

  // Add the message to the thread
  await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: message,
  });

  if (!waitForResponse) {
    return "Message sent";
  }

  // Run the assistant
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
  });

  // Wait for completion (with timeout)
  const maxWaitTime = 60000; // 60 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const runStatus = await (openai.beta.threads.runs.retrieve as any)(threadId, run.id);

    if (runStatus.status === "completed") {
      // Get the latest message
      const messages = await openai.beta.threads.messages.list(threadId, { limit: 1 });
      const lastMessage = messages.data[0];

      if (lastMessage.role === "assistant" && lastMessage.content[0].type === "text") {
        return lastMessage.content[0].text.value;
      }
      return "No response";
    }

    if (runStatus.status === "failed" || runStatus.status === "cancelled" || runStatus.status === "expired") {
      console.error("Run failed:", runStatus);
      throw new Error(`Assistant run ${runStatus.status}: ${runStatus.last_error?.message || "Unknown error"}`);
    }

    // Wait before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error("Assistant response timeout");
}

/**
 * Update the assistant with user context (call this when user data changes significantly)
 */
export async function updateUserContext(
  userId: string,
  contextUpdate: string
): Promise<void> {
  const threadId = await getOrCreateThread(userId);

  // Add context update as a system-like message
  await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: `[SYSTEM UPDATE - Store this information about me for future reference]\n\n${contextUpdate}`,
  });

  console.log(`Updated context for user ${userId}`);
}

/**
 * Initialize user thread with their full profile and history
 * Call this once when user first uses the AI, or periodically to refresh context
 */
export async function initializeUserThread(
  userId: string,
  fullContext: {
    profile: Record<string, unknown>;
    assessment: Record<string, unknown> | null;
    yearlyHistory: Record<string, unknown> | null;
    healthNotes: Array<{ content: string; category: string | null }>;
    goals: Array<Record<string, unknown>>;
  }
): Promise<void> {
  const threadId = await getOrCreateThread(userId);

  const contextMessage = `[INITIAL USER CONTEXT - This is comprehensive information about me. Remember all of this for personalized coaching.]

## MY PROFILE
${JSON.stringify(fullContext.profile, null, 2)}

## MY ONBOARDING ASSESSMENT
${fullContext.assessment ? JSON.stringify(fullContext.assessment, null, 2) : "Not completed yet"}

## MY YEARLY HISTORY SUMMARY
${fullContext.yearlyHistory ? JSON.stringify(fullContext.yearlyHistory, null, 2) : "No history yet - I'm just starting"}

## MY HEALTH NOTES
${fullContext.healthNotes.length > 0
  ? fullContext.healthNotes.map(n => `- [${n.category || 'general'}] ${n.content}`).join('\n')
  : "No health notes yet"}

## MY CURRENT GOALS
${fullContext.goals.length > 0
  ? JSON.stringify(fullContext.goals, null, 2)
  : "No goals set yet"}

Please acknowledge that you've received this information and will remember it for all future interactions.`;

  await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: contextMessage,
  });

  // Run to process the context
  const assistantId = await getOrCreateAssistant();
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
  });

  // Wait for acknowledgment (shorter timeout since this is just processing)
  const maxWaitTime = 30000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const runStatus = await (openai.beta.threads.runs.retrieve as any)(threadId, run.id);
    if (runStatus.status === "completed" || runStatus.status === "failed") {
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`Initialized thread for user ${userId} with full context`);
}

/**
 * Generate daily guidance using the persistent thread
 */
export async function generateDailyGuidanceWithThread(
  userId: string,
  todayData: {
    currentHour: number;
    todayNutrition: { calories: number; protein: number; carbs: number; fat: number };
    todaySteps: number;
    yesterdayLog: Record<string, unknown> | null;
    workedOutYesterday: boolean;
    recentSleepAvg: number | null;
    profile: {
      firstName: string | null;
      targetCalories: number | null;
      proteinGrams: number | null;
      carbsGrams: number | null;
      fatGrams: number | null;
      dailyStepsTarget: number | null;
      coachingTone: string | null;
      currentPhase: string | null;
    };
  }
): Promise<string> {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const now = new Date();

  const timeOfDay = todayData.currentHour < 12 ? "morning" : todayData.currentHour < 17 ? "afternoon" : "evening";

  const prompt = `Generate my daily guidance for today.

## TODAY'S DATE & TIME
${dayNames[now.getDay()]}, ${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()} at ${todayData.currentHour}:00 (${timeOfDay})

## MY TODAY'S DATA SO FAR
- Calories logged: ${todayData.todayNutrition.calories} of ${todayData.profile.targetCalories || 2000}
- Protein logged: ${todayData.todayNutrition.protein}g of ${todayData.profile.proteinGrams || 150}g
- Carbs logged: ${todayData.todayNutrition.carbs}g
- Fat logged: ${todayData.todayNutrition.fat}g
- Steps: ${todayData.todaySteps} of ${todayData.profile.dailyStepsTarget || 8000}

## YESTERDAY'S DATA
${todayData.yesterdayLog ? JSON.stringify(todayData.yesterdayLog, null, 2) : "No data logged yesterday"}
- Worked out yesterday: ${todayData.workedOutYesterday ? "YES" : "NO"}

## MY CURRENT STATE
- Coaching tone preference: ${todayData.profile.coachingTone || "empathetic"}
- Current phase: ${todayData.profile.currentPhase || "assessment"}
- Recent sleep average: ${todayData.recentSleepAvg?.toFixed(1) || "unknown"} hours

Please generate my personalized daily guidance as JSON matching the format in your instructions. Remember to reference my history and patterns you know about me.`;

  return sendMessage(userId, prompt);
}

/**
 * Check if user's thread needs initialization (new user or thread was deleted)
 */
export async function needsThreadInitialization(userId: string): Promise<boolean> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user?.assistantThreadId) {
    return true;
  }

  // Check if thread still exists
  try {
    await openai.beta.threads.retrieve(user.assistantThreadId);
    return false;
  } catch {
    // Thread doesn't exist, need to reinitialize
    return true;
  }
}

/**
 * Delete user's thread (for testing or reset)
 */
export async function deleteUserThread(userId: string): Promise<void> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (user?.assistantThreadId) {
    try {
      await (openai.beta.threads as any).del(user.assistantThreadId);
    } catch (e) {
      console.error("Error deleting thread:", e);
    }
  }

  await db.update(users)
    .set({ assistantThreadId: null })
    .where(eq(users.id, userId));

  console.log(`Deleted thread for user ${userId}`);
}
