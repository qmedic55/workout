# Quick Start Prompt for Claude in Xcode

Copy and paste this into Claude in Xcode to get started:

---

## Initial Prompt

```
I'm building a native SwiftUI iOS app called VitalPath - a health coaching app for body recomposition.

The app connects to an existing backend API at: https://health-mentor-ai--ikugelman.replit.app

Please help me build this step by step. Here's what I need:

1. **Architecture**: SwiftUI with MVVM, @Observable classes, async/await networking, iOS 17+
2. **Bundle ID**: com.vitalpath.app
3. **Auth**: Sign in with Apple (sends token to POST /api/auth/apple)

Key screens needed:
- Landing page with Sign in with Apple
- 7-step onboarding wizard
- Dashboard with health metrics
- Daily logging (weight, food, sleep, mood, etc.)
- Nutrition tracker with food search
- AI chat interface
- Progress charts
- Workout browser
- Educational articles
- Profile & Settings

Let's start by:
1. Creating the data models (UserProfile, DailyLog, FoodEntry, ChatMessage)
2. Building the APIClient networking layer
3. Implementing Sign in with Apple

I have a full specification document - should I share the API endpoints and data models first?
```

---

## Follow-up: Share the API Details

After the initial setup, share this:

```
Here are the main API endpoints:

Authentication:
- POST /api/auth/apple - Send { identityToken, email, givenName, familyName, user }

Profile:
- GET /api/profile - Returns UserProfile
- PATCH /api/profile - Update profile fields
- POST /api/onboarding - Submit onboarding data

Daily Logs:
- GET /api/daily-logs/today - Today's log
- GET /api/daily-logs/{YYYY-MM-DD} - Specific date
- POST /api/daily-logs - Create/update log

Food:
- GET /api/foods?q={query} - Search food database
- GET /api/food-entries/{date} - Get entries for date
- POST /api/food-entries - Add food entry
- DELETE /api/food-entries/{id} - Remove entry

Chat:
- GET /api/chat/messages - Get chat history
- POST /api/chat/send - Send message, get AI response

UserProfile model fields:
- firstName, lastName, age, sex, heightCm
- currentWeightKg, targetWeightKg, bodyFatPercentage
- currentPhase (assessment/recovery/recomp/cutting)
- targetCalories, proteinGrams, carbsGrams, fatGrams
- dailyStepsTarget, coachingTone, onboardingCompleted

DailyLog model fields:
- logDate (YYYY-MM-DD)
- weightKg, waistCm, hipsCm, chestCm
- caloriesConsumed, proteinGrams, carbsGrams, fatGrams, waterLiters
- steps, workoutCompleted, workoutType, workoutDurationMinutes
- sleepHours, sleepQuality (1-10), energyLevel (1-10)
- stressLevel (1-10), moodRating (1-10), notes
```

---

## Building Screen by Screen

Use prompts like:

```
Now let's build the Dashboard view. It should show:
- Welcome greeting with the user's name
- 4 metric cards: Weight, Calories (with progress), Steps, Sleep
- Current phase badge (Recovery=green, Recomp=blue, Cutting=orange)
- Quick action buttons for logging
- Today's macro progress bars

Use data from GET /api/profile and GET /api/daily-logs/today
```

```
Build the Nutrition tracker view with:
- Tabs for Breakfast, Lunch, Dinner, Snack
- Today's calorie/macro summary at top
- Food search that calls GET /api/foods?q={query}
- List of today's entries from GET /api/food-entries/{today}
- Swipe to delete entries
```

```
Build the AI Chat view:
- Full screen chat with message bubbles
- User messages on right (blue), assistant on left (gray)
- Text input at bottom
- When empty, show 6 suggested prompts as tappable chips
- Call POST /api/chat/send with { content: message }
```

---

## Tips for Working with Claude in Xcode

1. **Be specific about UI**: Describe layouts, colors, spacing
2. **Reference iOS patterns**: "Use a NavigationStack", "Add a TabView"
3. **Ask for previews**: "Add a SwiftUI preview with sample data"
4. **Iterate**: "Make the cards have more padding" or "Use SF Symbols for icons"
5. **Debug together**: Share error messages and ask for fixes

Good luck!
