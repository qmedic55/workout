# VitalPath Native iOS App - Instructions for Claude in Xcode

## Project Overview

Build a native SwiftUI iOS app called **VitalPath** - an AI-powered health coaching app for body recomposition and metabolic recovery, designed for adults 40+.

The app connects to an existing backend API at: `https://health-mentor-ai--ikugelman.replit.app`

---

## Architecture Requirements

- **SwiftUI** for all UI
- **MVVM architecture** with `@Observable` classes (iOS 17+)
- **Swift Concurrency** (async/await) for networking
- **Sign in with Apple** for authentication
- **HealthKit** for Apple Health integration
- **Swift Charts** for data visualization
- **Minimum iOS version: 17.0**
- **Bundle ID: com.vitalpath.app**

---

## API Endpoints

Base URL: `https://health-mentor-ai--ikugelman.replit.app`

All authenticated requests must include the session cookie from Apple Sign In.

### Authentication
```
POST /api/auth/apple
Body: { identityToken, email, givenName, familyName, user }
Response: { success: true, user: { id, email, firstName, lastName } }
Sets cookie: __session
```

### Profile
```
GET /api/profile
Response: UserProfile object (see Data Models)

PATCH /api/profile
Body: Partial<UserProfile>
Response: Updated UserProfile

POST /api/onboarding
Body: OnboardingData (see Onboarding section)
Response: { success: true, profile: UserProfile }
```

### Daily Logs
```
GET /api/daily-logs
Response: DailyLog[]

GET /api/daily-logs/today
Response: DailyLog | null

GET /api/daily-logs/{date}  (format: YYYY-MM-DD)
Response: DailyLog | null

GET /api/daily-logs/range/{days}  (7, 30, or 90)
Response: DailyLog[]

POST /api/daily-logs
Body: DailyLog data
Response: Created DailyLog
```

### Food Tracking
```
GET /api/foods?q={searchQuery}
Response: FoodItem[] (from USDA database)

GET /api/food-entries/{date}
Response: FoodEntry[]

POST /api/food-entries
Body: { logDate, mealType, foodName, servingSize, servingQuantity, calories, proteinGrams, carbsGrams, fatGrams }
Response: Created FoodEntry

DELETE /api/food-entries/{id}
Response: { success: true }
```

### AI Chat
```
GET /api/chat/messages
Response: ChatMessage[]

POST /api/chat/send
Body: { content: string }
Response: { userMessage: ChatMessage, assistantMessage: ChatMessage }
```

### Health Insights
```
GET /api/insights
Response: HealthInsight[]
```

### Workouts
```
GET /api/workouts
Response: WorkoutTemplate[]
```

### Educational Content
```
GET /api/educational-content
Response: Article[]
```

### Data Export
```
GET /api/export/json
Response: Full data export as JSON

GET /api/export/csv
Response: Daily logs as CSV file
```

---

## Data Models (Swift)

```swift
// User Profile
struct UserProfile: Codable, Identifiable {
    let id: String
    let userId: String
    var firstName: String?
    var lastName: String?
    var age: Int?
    var sex: String? // "male" or "female"
    var heightCm: Double?
    var currentWeightKg: Double?
    var targetWeightKg: Double?
    var bodyFatPercentage: Double?
    var waistCircumferenceCm: Double?
    var currentPhase: String? // "assessment", "recovery", "recomp", "cutting"
    var phaseStartDate: String?
    var maintenanceCalories: Int?
    var targetCalories: Int?
    var proteinGrams: Int?
    var carbsGrams: Int?
    var fatGrams: Int?
    var dailyStepsTarget: Int?
    var coachingTone: String? // "empathetic", "scientific", "casual", "tough_love"
    var hasHealthConditions: Bool?
    var healthConditionsNotes: String?
    var onboardingCompleted: Bool?
}

// Daily Log
struct DailyLog: Codable, Identifiable {
    let id: String
    let userId: String
    let logDate: String // YYYY-MM-DD
    var weightKg: Double?
    var waistCm: Double?
    var hipsCm: Double?
    var chestCm: Double?
    var caloriesConsumed: Int?
    var proteinGrams: Double?
    var carbsGrams: Double?
    var fatGrams: Double?
    var waterLiters: Double?
    var steps: Int?
    var activeMinutes: Int?
    var workoutCompleted: Bool?
    var workoutType: String?
    var workoutDurationMinutes: Int?
    var sleepHours: Double?
    var sleepQuality: Int? // 1-10
    var energyLevel: Int? // 1-10
    var stressLevel: Int? // 1-10
    var moodRating: Int? // 1-10
    var notes: String?
    var avgHeartRate: Int?
    var hrv: Double?
}

// Food Entry
struct FoodEntry: Codable, Identifiable {
    let id: String
    let userId: String
    let logDate: String
    let mealType: String // "breakfast", "lunch", "dinner", "snack"
    let foodName: String
    var servingSize: String?
    var servingQuantity: Double?
    var calories: Int?
    var proteinGrams: Double?
    var carbsGrams: Double?
    var fatGrams: Double?
}

// Chat Message
struct ChatMessage: Codable, Identifiable {
    let id: String
    let userId: String
    let role: String // "user" or "assistant"
    let content: String
    let createdAt: String
}

// Health Insight
struct HealthInsight: Codable, Identifiable {
    let id: String
    let type: String // "warning", "positive", "suggestion"
    let category: String // "sleep", "nutrition", "stress", "training", "hydration", "phase"
    let title: String
    let message: String
    var actionUrl: String?
    let priority: Int
}

// Workout Template
struct WorkoutTemplate: Codable, Identifiable {
    let id: String
    let name: String
    var description: String?
    let type: String // "strength", "cardio", "flexibility", "recovery"
    let difficulty: String // "beginner", "intermediate", "advanced"
    var durationMinutes: Int?
    var exercises: [Exercise]?
}

struct Exercise: Codable {
    let name: String
    var sets: Int?
    var reps: String? // e.g., "8-12"
    var rir: Int? // Reps in Reserve
    var notes: String?
}

// Educational Article
struct Article: Codable, Identifiable {
    let id: String
    let title: String
    let slug: String
    let category: String
    let content: String // Markdown
    var readTimeMinutes: Int?
}
```

---

## Screens to Build

### 1. Landing Page (Unauthenticated)
- App logo and name "VitalPath"
- Headline: "Your Holistic Health Journey Starts Here"
- Subheadline: "AI-powered coaching for body recomposition and metabolic recovery, designed specifically for adults 40 and beyond."
- **Sign in with Apple** button (full-width, black background)
- Three feature cards:
  - AI Mentor - "Personalized guidance from an AI coach trained in metabolic science"
  - Track Everything - "Log nutrition, workouts, sleep, stress, and biometrics in one place"
  - Smart Insights - "Connect wearables and get data-driven recommendations"

### 2. Onboarding (7-Step Wizard)
After sign-in, if `profile.onboardingCompleted == false`, show onboarding.

**Step 1: Basic Profile**
- First name, Last name
- Age (number)
- Sex (picker: Male/Female)
- Height (cm)
- Current weight (kg)
- Target weight (kg)

**Step 2: Body Metrics**
- Waist circumference (cm)
- Hip circumference (cm)
- Chest circumference (cm)
- Body fat % (optional)

**Step 3: Diet History**
- Have you been actively dieting recently? (toggle)
- If yes: How many months?
- Lowest calorie intake you've tried
- Typical daily eating pattern (text)
- Biggest hurdles with nutrition (text)
- Relationship with food (picker: Healthy, Restrictive, Emotional, Needs Support)

**Step 4: Exercise Background**
- Do you do resistance training? (toggle)
- If yes: Days per week, Type of training
- Do you do cardio? (toggle)
- Average daily steps
- Physical limitations (text, optional)
- Familiar with RIR (Reps in Reserve)? (toggle)

**Step 5: Lifestyle**
- Average sleep hours
- Sleep quality (1-10 slider)
- Stress level (1-10 slider)
- Activity level (picker: Sedentary, Lightly Active, Moderately Active, Very Active)

**Step 6: Biofeedback Baseline**
- Morning energy (1-10 slider)
- Afternoon energy (1-10 slider)
- Digestion quality (picker: Good, Bloating, Constipation, Other)
- General mood (1-10 slider)
- For women: Menstrual status (picker: Premenopausal, Perimenopausal, Postmenopausal, Not Applicable)

**Step 7: Preferences**
- Use a wearable device? (toggle)
- If yes: Which device? (picker: Apple Watch, Fitbit, Garmin, Oura, Other)
- Coaching tone preference (picker: Empathetic, Scientific, Casual, Tough Love)
- Any health conditions? (toggle + text field if yes)

Submit all data to `POST /api/onboarding`

### 3. Dashboard (Home)
- Welcome greeting with time-based salutation
- 4 metric cards in 2x2 grid:
  - Weight (latest, with trend indicator)
  - Calories (consumed vs target, with progress bar)
  - Steps (today vs target)
  - Sleep (last night hours + quality)
- Current Phase card (color-coded: Recovery=green, Recomp=blue, Cutting=orange)
- Quick action cards: "Log Today's Data", "Chat with AI Mentor", "Log Food"
- Today's macro targets with progress bars (Protein, Carbs, Fat)
- Health Insights section (top 2-3 insights, color-coded by type)

### 4. Daily Log
- Date picker (calendar, past dates only)
- Sections with expand/collapse:
  - **Body Metrics**: Weight, Waist, Hips, Chest
  - **Nutrition**: Calories, Protein, Carbs, Fat, Water (glasses)
  - **Activity**: Steps, Workout toggle (if on: type picker, duration)
  - **Sleep**: Hours, Quality slider (1-10)
  - **Energy & Mood**: Energy slider, Mood slider
  - **Stress & Notes**: Stress slider, Notes text field
- Save button (calls POST /api/daily-logs)

### 5. Nutrition Tracker
- Meal type tabs: Breakfast, Lunch, Dinner, Snack
- Today's summary card: Total calories, macro progress bars
- Food search component:
  - Search field with debounce (300ms)
  - Results from GET /api/foods?q={query}
  - Each result shows: name, serving size, calories, macros
  - Tap to add to current meal
- Quick add buttons: Chicken Breast, Brown Rice, Eggs, Greek Yogurt, Salmon, Avocado, Oatmeal, Banana
- Today's entries list (grouped by meal)
  - Each entry shows food name, calories, swipe to delete

### 6. AI Chat
- Full-screen chat interface
- Message bubbles: user (blue, right), assistant (gray, left)
- Timestamps on messages
- When empty, show suggested prompts:
  - "How should I adjust my calories this week?"
  - "I'm feeling tired lately. What could be causing this?"
  - "Explain metabolic adaptation to me"
  - "I'm struggling with motivation. Can you help?"
  - "What's the best workout split for someone 40+?"
  - "How do I know if I'm in a caloric deficit?"
- Text input at bottom with send button
- Typing indicator while waiting for response
- Auto-scroll to new messages

### 7. Progress
- Time range picker: 7 days, 30 days, 90 days
- 4 stat cards comparing first half vs second half:
  - Average Weight (down arrow = good)
  - Average Calories
  - Average Steps
  - Average Sleep
- 4 chart tabs (use Swift Charts):
  - **Weight Trend**: Line chart with target line
  - **Calorie Intake**: Bar chart with target line
  - **Daily Steps**: Bar chart with target line
  - **Biofeedback**: Multi-line chart (Energy, Sleep, Mood, Stress)

### 8. Workouts
- Tabs: Strength, Cardio, Recovery
- Workout cards showing:
  - Name
  - Type badge
  - Difficulty badge
  - Duration
- Tap to expand detail view:
  - Full description
  - Exercise list with sets x reps and RIR
  - Form tips
  - "Tips for 40+" section

### 9. Learn
- Search bar for filtering articles
- Article cards in grid:
  - Category badge (color-coded)
  - Title
  - Read time
- Tap to open article detail:
  - Markdown-rendered content
  - Back navigation

### 10. Profile
- Avatar with initials
- Name, age display
- Current phase badge
- Key metrics: weight, target weight, height, body fat %
- Recent activity summary
- Edit Profile button -> Settings

### 11. Settings
- Form sections:
  - Personal: First name, Last name
  - Goals: Target weight, Daily steps target
  - Nutrition: Target calories, Protein/Carbs/Fat grams
  - Preferences: Coaching tone picker
- Theme toggle (if supporting dark/light)
- Export Data section:
  - Export as JSON button
  - Export as CSV button
- Sign Out button

---

## Tab Bar Navigation

Bottom tab bar with 5 items:
1. **Home** (house icon) -> Dashboard
2. **Food** (fork/knife icon) -> Nutrition
3. **Coach** (chat bubble icon) -> AI Chat
4. **Train** (dumbbell icon) -> Workouts
5. **Profile** (person icon) -> Profile

---

## Color Scheme

- Primary: Purple/Indigo (#6366F1)
- Background: System background (adapts to dark/light mode)
- Phase colors:
  - Assessment: Gray
  - Recovery: Green (#22C55E)
  - Recomp: Blue (#3B82F6)
  - Cutting: Orange (#F97316)
- Insight colors:
  - Warning: Amber (#F59E0B)
  - Positive: Green (#22C55E)
  - Suggestion: Blue (#3B82F6)

---

## Networking Layer

Create an `APIClient` class that:
1. Stores the session cookie from Sign in with Apple
2. Includes cookie in all requests
3. Handles JSON encoding/decoding
4. Provides async methods for all endpoints
5. Handles errors gracefully

```swift
@Observable
class APIClient {
    static let shared = APIClient()
    private let baseURL = "https://health-mentor-ai--ikugelman.replit.app"
    private var sessionCookie: String?

    func setSession(_ cookie: String) {
        self.sessionCookie = cookie
    }

    func request<T: Decodable>(_ endpoint: String, method: String = "GET", body: Encodable? = nil) async throws -> T {
        // Implementation
    }
}
```

---

## HealthKit Integration

Request authorization for:
- Steps (HKQuantityType.stepCount)
- Heart Rate (HKQuantityType.heartRate)
- Sleep Analysis (HKCategoryType.sleepAnalysis)
- Active Energy (HKQuantityType.activeEnergyBurned)
- Resting Heart Rate (HKQuantityType.restingHeartRate)
- Heart Rate Variability (HKQuantityType.heartRateVariabilitySDNN)

Sync data to daily logs when available.

---

## Sign in with Apple Implementation

Use AuthenticationServices framework:

```swift
import AuthenticationServices

func handleSignInWithApple() {
    let request = ASAuthorizationAppleIDProvider().createRequest()
    request.requestedScopes = [.fullName, .email]

    let controller = ASAuthorizationController(authorizationRequests: [request])
    controller.delegate = self
    controller.performRequests()
}

// On success, send to /api/auth/apple:
// - identityToken (JWT string)
// - email
// - givenName
// - familyName
// - user (Apple user ID)
```

---

## Important UX Notes

1. **Safe Area**: Respect safe area insets, especially for bottom tab bar
2. **Loading States**: Show skeleton loaders or spinners while fetching
3. **Empty States**: Show helpful messages when lists are empty
4. **Error Handling**: Show toast/alert on API errors
5. **Haptic Feedback**: Use on button taps and slider changes
6. **Pull to Refresh**: Support on list views
7. **Keyboard Handling**: Dismiss on tap outside, scroll content when keyboard appears

---

## File Structure Suggestion

```
VitalPath/
├── App/
│   ├── VitalPathApp.swift
│   └── ContentView.swift
├── Models/
│   ├── UserProfile.swift
│   ├── DailyLog.swift
│   ├── FoodEntry.swift
│   ├── ChatMessage.swift
│   └── ... (other models)
├── ViewModels/
│   ├── AuthViewModel.swift
│   ├── ProfileViewModel.swift
│   ├── DailyLogViewModel.swift
│   ├── NutritionViewModel.swift
│   ├── ChatViewModel.swift
│   └── ... (other view models)
├── Views/
│   ├── Landing/
│   │   └── LandingView.swift
│   ├── Onboarding/
│   │   ├── OnboardingView.swift
│   │   └── OnboardingSteps/
│   ├── Dashboard/
│   │   └── DashboardView.swift
│   ├── DailyLog/
│   │   └── DailyLogView.swift
│   ├── Nutrition/
│   │   ├── NutritionView.swift
│   │   └── FoodSearchView.swift
│   ├── Chat/
│   │   └── ChatView.swift
│   ├── Progress/
│   │   └── ProgressView.swift
│   ├── Workouts/
│   │   └── WorkoutsView.swift
│   ├── Learn/
│   │   └── LearnView.swift
│   ├── Profile/
│   │   └── ProfileView.swift
│   └── Settings/
│       └── SettingsView.swift
├── Services/
│   ├── APIClient.swift
│   ├── AuthService.swift
│   └── HealthKitService.swift
├── Components/
│   ├── MetricCard.swift
│   ├── ProgressBar.swift
│   ├── InsightCard.swift
│   └── ... (reusable components)
└── Utilities/
    ├── Extensions.swift
    └── Constants.swift
```

---

## Getting Started

1. Create a new Xcode project: iOS App, SwiftUI, Swift
2. Set Bundle Identifier to: `com.vitalpath.app`
3. Enable capabilities:
   - Sign in with Apple
   - HealthKit
4. Start with the Models and APIClient
5. Build the AuthViewModel and LandingView
6. Implement Sign in with Apple flow
7. Build remaining views one by one

Ask me if you need clarification on any endpoint, data model, or UI behavior!
