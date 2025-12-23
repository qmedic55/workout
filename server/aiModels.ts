/**
 * Centralized AI Model Configuration
 *
 * Change these values to switch models across the entire application.
 * All AI-related files import from here.
 */

// Primary model for main AI features (chat, insights, recommendations)
export const AI_MODEL_PRIMARY = "gpt-5.2";

// Fallback model if primary fails (e.g., rate limits, capacity issues)
export const AI_MODEL_FALLBACK = "gpt-4o";

// Model for vision/image analysis (photo food logging)
export const AI_MODEL_VISION = "gpt-5.2";

// Fallback for vision model
export const AI_MODEL_VISION_FALLBACK = "gpt-4o";

// Lighter model for simpler tasks (parsing, action detection)
// Set to same as primary if you want consistent quality, or use a smaller model for cost savings
export const AI_MODEL_LIGHT = "gpt-5.2";

// Fallback for light model
export const AI_MODEL_LIGHT_FALLBACK = "gpt-4o-mini";

// Model for assistants API (if used)
export const AI_MODEL_ASSISTANT = "gpt-5.2";
