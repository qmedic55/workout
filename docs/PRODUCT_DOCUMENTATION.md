# VitalPath: Complete Product & UI/UX Documentation

> **Purpose**: This document serves as the comprehensive reference for VitalPath's features, flows, design system, and future roadmap. Use this for UI/UX design prompts, development planning, and product decisions.

---

# PART 1: PRODUCT OVERVIEW

## 1.1 What is VitalPath?

**VitalPath** is an AI-powered health coaching platform specifically designed for adults 40+ years old. It combines workout tracking, nutrition logging, progress monitoring, and personalized AI coaching into a unified experience that understands the unique challenges of fitness after 40.

### Core Value Proposition
> "One AI coach that sees everything, connects everything, adapts everything."

Unlike fragmented solutions (MyFitnessPal for food, Strong for workouts, Oura for sleep), VitalPath synthesizes all health data through one intelligent system that:
- Knows you slept poorly and adjusts your workout accordingly
- Understands your stress levels and adapts calorie recommendations
- Remembers your injuries and modifies exercises
- Tracks your metabolic phase and optimizes for long-term results

### Target Audience
**Primary**: Adults 40-65 years old who want to:
- Lose weight sustainably (not crash dieting)
- Build or maintain muscle mass
- Improve energy and vitality
- Navigate hormonal changes (perimenopause, andropause)
- Return to fitness after injury or long break

**Secondary Personas**:
1. **Busy Professional Maria (45)** - "Just tell me what to do, I don't have time to figure it out"
2. **Health Beginner Dave (52)** - "I don't know where to start, every app assumes I know things"
3. **Post-Injury Sarah (48)** - "I'm scared of hurting myself again"
4. **Perimenopausal Lisa (47)** - "Nothing works anymore, my metabolism broke"

---

## 1.2 Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript |
| State Management | React Query (TanStack Query) |
| Routing | Wouter (lightweight) |
| UI Framework | shadcn/ui (Radix UI + Tailwind CSS) |
| Forms | React Hook Form + Zod validation |
| Charts | Recharts |
| Icons | Lucide React |
| Build Tool | Vite |
| Backend | Express.js + TypeScript |
| Database | PostgreSQL with Drizzle ORM |
| AI | OpenAI GPT-4o/GPT-4o-mini + Assistants API |
| Auth | Apple Sign-In + Session cookies |
| Mobile | Capacitor (iOS/Android) |

---

# PART 2: BRAND & DESIGN SYSTEM

## 2.1 Brand Identity

### App Name & Tagline
- **Name**: VitalPath
- **Tagline**: "Your AI Health Mentor"
- **Voice**: Knowledgeable, supportive, personalized, age-appropriate

### Logo Usage
- App icon: Stylized "V" with path/journey motif
- In-app: "VitalPath" text with icon
- Favicon: Simplified icon only

## 2.2 Color System

### Primary Palette
```css
--primary: hsl(222, 47%, 51%)        /* Brand blue - interactive elements */
--primary-foreground: hsl(210, 40%, 98%)
--background: hsl(0, 0%, 100%)        /* Light mode */
--foreground: hsl(222, 47%, 11%)
--muted: hsl(210, 40%, 96%)
--muted-foreground: hsl(215, 16%, 47%)
--border: hsl(214, 32%, 91%)
--ring: hsl(222, 47%, 51%)
```

### Dark Mode Palette
```css
--background: hsl(222, 47%, 11%)
--foreground: hsl(210, 40%, 98%)
--muted: hsl(217, 33%, 17%)
--muted-foreground: hsl(215, 20%, 65%)
--border: hsl(217, 33%, 17%)
```

### Semantic Colors
| Purpose | Light Mode | Usage |
|---------|------------|-------|
| Success/Positive | Green (`text-green-600`) | Weight loss, goal achieved, positive trends |
| Warning/Attention | Amber (`text-amber-600`) | Needs action, caution |
| Error/Destructive | Red (`text-red-600`) | Errors, delete actions, negative trends |
| Info | Blue (`text-blue-600`) | Information, suggestions |
| Recovery Phase | Purple (`bg-purple-500/10`) | Phase badge |
| Recomp Phase | Blue (`bg-blue-500/10`) | Phase badge |
| Cutting Phase | Orange (`bg-orange-500/10`) | Phase badge |

### Chart Colors
```css
--chart-1: hsl(142, 76%, 36%)  /* Green - protein, energy, positive */
--chart-2: hsl(221, 83%, 53%)  /* Blue - steps, carbs, activity */
--chart-3: hsl(38, 92%, 50%)   /* Orange - sleep, fat, calories */
--chart-4: hsl(262, 83%, 58%)  /* Purple - recovery, special metrics */
--chart-5: hsl(0, 84%, 60%)    /* Red - warnings, deficits */
```

## 2.3 Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
             "Helvetica Neue", Arial, sans-serif;
```

### Type Scale
| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| Page Title | 2xl (24px) | Bold (700) | Page headers |
| Section Title | lg (18px) | Semibold (600) | Card titles, sections |
| Card Title | base (16px) | Semibold (600) | Card headers |
| Body | sm (14px) | Normal (400) | Primary content |
| Caption | xs (12px) | Normal (400) | Labels, timestamps |
| Muted | sm (14px) | Normal (400) | Secondary info (`text-muted-foreground`) |

## 2.4 Spacing System

Based on Tailwind's 4px base unit:
- **xs**: 4px (`p-1`, `gap-1`)
- **sm**: 8px (`p-2`, `gap-2`)
- **md**: 12px (`p-3`, `gap-3`)
- **lg**: 16px (`p-4`, `gap-4`)
- **xl**: 24px (`p-6`, `gap-6`)

### Common Patterns
- Card padding: `p-4` or `p-6`
- Section gaps: `space-y-4` or `space-y-6`
- Grid gaps: `gap-3` or `gap-4`
- Icon-text spacing: `gap-2`

## 2.5 Component Library (shadcn/ui)

### Cards
```
┌─────────────────────────────────────┐
│ CardHeader                          │
│   CardTitle                         │
│   CardDescription                   │
├─────────────────────────────────────┤
│ CardContent                         │
│   [Main content here]               │
│                                     │
├─────────────────────────────────────┤
│ CardFooter (optional)               │
└─────────────────────────────────────┘
```
- Rounded corners: `rounded-lg`
- Border: `border` (subtle gray)
- Shadow: `shadow-sm` (optional elevation)
- Special states: `bg-primary/5 border-primary/20` for highlighted cards

### Buttons
| Variant | Style | Usage |
|---------|-------|-------|
| Default | Solid primary color | Primary actions |
| Secondary | Light background | Secondary actions |
| Outline | Border only | Tertiary actions |
| Ghost | Text only | Minimal actions |
| Destructive | Red solid | Delete, logout |

**Sizes**: `sm`, `default`, `lg`, `icon`

### Form Elements
- **Input**: Border bottom focus ring, rounded
- **Textarea**: Resizable, focus ring
- **Select**: Dropdown with chevron
- **Slider**: Full-width track with thumb
- **Switch/Toggle**: Pill-shaped boolean
- **Radio Group**: Circle indicators
- **Checkbox**: Square with checkmark

### Badges
```jsx
<Badge variant="default">Primary</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Destructive</Badge>
```
- Used for: phase indicators, workout types, difficulty levels, counts

### Progress Indicators
- **Progress Bar**: Thin horizontal (`h-2`), color-coded
- **Skeleton**: Animated loading placeholders matching layout
- **Spinner**: Used sparingly for button loading states

## 2.6 Layout Patterns

### Page Structure
```
┌─────────────────────────────────────────────────┐
│ [Sidebar - Desktop only]  │  Page Content       │
│                           │                     │
│  Logo                     │  ┌───────────────┐  │
│  ─────                    │  │ Page Header   │  │
│  Dashboard                │  └───────────────┘  │
│  AI Mentor                │                     │
│  Progress                 │  ┌───────────────┐  │
│  Goals                    │  │ Main Content  │  │
│  Daily Log                │  │               │  │
│  ─────                    │  │               │  │
│  Nutrition                │  │               │  │
│  Workouts                 │  └───────────────┘  │
│  Devices                  │                     │
│  ─────                    │                     │
│  Learn                    │                     │
│  Settings                 │                     │
│                           │                     │
│  [User Avatar]            │                     │
└─────────────────────────────────────────────────┘
```

### Mobile Layout
```
┌─────────────────────────┐
│ Header (optional)       │
├─────────────────────────┤
│                         │
│                         │
│     Page Content        │
│                         │
│                         │
│                         │
├─────────────────────────┤
│ ○ Home ○ Food ○ Coach ○ Train │  ← Bottom nav
└─────────────────────────┘
```

### Responsive Breakpoints
| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Default | < 640px | Mobile, bottom nav, single column |
| sm | 640px+ | Minor adjustments |
| md | 768px+ | Sidebar appears, 2-column grids |
| lg | 1024px+ | Wider content, 3-4 column grids |

## 2.7 Animation & Micro-interactions

### Transitions
- **Default**: `transition-all duration-200`
- **Hover elevation**: `hover:shadow-md hover:-translate-y-0.5`
- **Button press**: Scale down slightly
- **Page transitions**: Fade in content

### Loading States
- Skeleton loaders that match content shape
- Typing indicator (3 bouncing dots) for AI responses
- Spinner on buttons during submission

### Celebrations
- Milestone modals with pulsing icon animation
- Party popper icons for achievements
- Confetti effect (planned)

---

# PART 3: NAVIGATION & INFORMATION ARCHITECTURE

## 3.1 Navigation Structure

### Desktop Sidebar
```
MAIN
├── Dashboard (Home icon)
├── AI Mentor (MessageSquare icon)
├── Progress (TrendingUp icon)
├── Goals (Target icon)
└── Daily Log (Calendar icon)

TRACKING
├── Nutrition (Utensils icon)
├── Workouts (Dumbbell icon)
└── Devices (Smartphone icon)

RESOURCES
├── Learn (BookOpen icon)
└── Settings (Settings icon)

[User Avatar + Dropdown]
```

### Mobile Bottom Navigation
```
┌────────┬────────┬────────┬────────┐
│  Home  │  Food  │ Coach  │ Train  │
│   ○    │   ○    │   ○    │   ○    │
└────────┴────────┴────────┴────────┘
```
- Home → Dashboard
- Food → Nutrition
- Coach → Chat
- Train → Workouts

### User Menu (Dropdown)
- Profile
- Settings
- Sign Out

## 3.2 Route Map

| Route | Page | Auth Required | Description |
|-------|------|---------------|-------------|
| `/` | Dashboard | Yes | Main hub with daily overview |
| `/onboarding` | Onboarding | Yes | 3-step setup flow |
| `/chat` | AI Mentor | Yes | Chat interface |
| `/nutrition` | Nutrition | Yes | Food logging |
| `/workouts` | Workouts | Yes | Workout library |
| `/workout-session/:id` | Workout Session | Yes | Active workout |
| `/progress` | Progress | Yes | Charts and tracking |
| `/daily-log` | Daily Log | Yes | Daily metrics |
| `/profile` | Profile | Yes | User profile view |
| `/settings` | Settings | Yes | Preferences |
| `/goals` | Goals | Yes | Goal management |
| `/devices` | Devices | Yes | Wearable connections |
| `/learn` | Learn | Yes | Educational content |
| `/u/:username` | Public Profile | No | Shareable profile |

---

# PART 4: FEATURES - COMPLETE SPECIFICATION

## 4.1 Onboarding Flow

### Overview
- **Duration**: Under 2 minutes
- **Steps**: 3
- **Persistence**: localStorage (auto-save)
- **Resumable**: Yes

### Step 1: The Basics (30 seconds)
```
┌─────────────────────────────────────────────────────────────────┐
│  Step 1 of 3                    [●○○] Progress                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  THE BASICS                                                     │
│  Let's start with the essentials                                │
│                                                                 │
│  First Name *                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ [Auto-focused input]                                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────┐       │
│  │ Age *                   │  │ Biological Sex *        │       │
│  │ [Number input]          │  │ ○ Male  ○ Female        │       │
│  └─────────────────────────┘  └─────────────────────────┘       │
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────┐       │
│  │ Height (cm) *           │  │ Current Weight (kg) *   │       │
│  │ [Number input]          │  │ [Number input, 0.1 step]│       │
│  └─────────────────────────┘  └─────────────────────────┘       │
│                                                                 │
│  Goal Weight (kg)                                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ [Optional - placeholder: "Leave blank if unsure"]       │    │
│  └─────────────────────────────────────────────────────────┘    │
│  We'll help you set realistic goals based on your profile.      │
│                                                                 │
│  [Back - disabled]                              [Next →]        │
└─────────────────────────────────────────────────────────────────┘
```

**Validation Rules**:
- firstName: Required, min 1 character
- age: Required, 18-120
- sex: Required, "male" or "female"
- heightCm: Required, 100-250
- currentWeightKg: Required, 30-300
- targetWeightKg: Optional, 30-300

### Step 2: Your Lifestyle (45 seconds)
```
┌─────────────────────────────────────────────────────────────────┐
│  Step 2 of 3                    [●●○] Progress                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  YOUR LIFESTYLE                                                 │
│  Help us understand your daily routine                          │
│                                                                 │
│  How active is your daily life? (not counting exercise)         │
│  ○ Sedentary - Desk job, minimal movement                       │
│  ○ Lightly active - Some walking, light activity                │
│  ○ Moderately active - On feet often, physical job              │
│  ○ Very active - Labor-intensive job, always moving             │
│                                                                 │
│  Do you currently exercise regularly?                           │
│  ┌────────────────┐ ┌────────────────┐                          │
│  │ No, just       │ │ 1-2 times      │                          │
│  │ starting       │ │ /week          │                          │
│  └────────────────┘ └────────────────┘                          │
│  ┌────────────────┐ ┌────────────────┐                          │
│  │ 3-4 times      │ │ 5+ times       │                          │
│  │ /week          │ │ /week          │                          │
│  └────────────────┘ └────────────────┘                          │
│                                                                 │
│  Have you been dieting or restricting calories recently?        │
│  ┌────────────────┐ ┌────────────────┐                          │
│  │ No, eating     │ │ Yes, a few     │                          │
│  │ normally       │ │ weeks          │                          │
│  └────────────────┘ └────────────────┘                          │
│  ┌────────────────┐ ┌────────────────┐                          │
│  │ Yes, a few     │ │ Yes, 6+        │                          │
│  │ months         │ │ months         │                          │
│  └────────────────┘ └────────────────┘                          │
│                                                                 │
│  How would you rate your average sleep?                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                            │
│  │ Poor │ │ Fair │ │ Good │ │Great │                            │
│  └──────┘ └──────┘ └──────┘ └──────┘                            │
│                                                                 │
│  Current stress level                                           │
│  Low ──────────────●────────────── High                         │
│                    5/10                                         │
│                                                                 │
│  [← Back]                                       [Next →]        │
└─────────────────────────────────────────────────────────────────┘
```

**Field Mappings**:
| UI Selection | Stored Value |
|--------------|--------------|
| Activity: Sedentary | `activityLevel: "sedentary"` |
| Activity: Lightly active | `activityLevel: "lightly_active"` |
| Activity: Moderately active | `activityLevel: "moderately_active"` |
| Activity: Very active | `activityLevel: "very_active"` |
| Exercise: No, just starting | `resistanceTrainingFrequency: 0, doesResistanceTraining: false` |
| Exercise: 1-2 times/week | `resistanceTrainingFrequency: 2, doesResistanceTraining: true` |
| Exercise: 3-4 times/week | `resistanceTrainingFrequency: 4, doesResistanceTraining: true` |
| Exercise: 5+ times/week | `resistanceTrainingFrequency: 5, doesResistanceTraining: true` |
| Dieting: No | `hasBeenDietingRecently: false, dietingDurationMonths: 0` |
| Dieting: Few weeks | `hasBeenDietingRecently: true, dietingDurationMonths: 1` |
| Dieting: Few months | `hasBeenDietingRecently: true, dietingDurationMonths: 3` |
| Dieting: 6+ months | `hasBeenDietingRecently: true, dietingDurationMonths: 6` |
| Sleep: Poor | `averageSleepHours: 5, sleepQuality: 3` |
| Sleep: Fair | `averageSleepHours: 6.5, sleepQuality: 5` |
| Sleep: Good | `averageSleepHours: 7.5, sleepQuality: 7` |
| Sleep: Great | `averageSleepHours: 8, sleepQuality: 9` |
| Stress slider | `stressLevel: [1-10]` |

### Step 3: Your Coach (30 seconds)
```
┌─────────────────────────────────────────────────────────────────┐
│  Step 3 of 3                    [●●●] Progress                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  YOUR COACH                                                     │
│  Choose how your AI mentor should communicate with you          │
│                                                                 │
│  ┌─────────────────────────────────────────┐                    │
│  │ 💗 EMPATHETIC                    [✓]   │                    │
│  │ Warm, understanding, encouraging        │                    │
│  │ "I know this is hard. You're doing      │                    │
│  │ amazing just by showing up."            │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                 │
│  ┌─────────────────────────────────────────┐                    │
│  │ 🧠 SCIENTIFIC                           │                    │
│  │ Data-driven, explains the "why"         │                    │
│  │ "Your protein intake is 15% below       │                    │
│  │ optimal for muscle protein synthesis."  │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                 │
│  ┌─────────────────────────────────────────┐                    │
│  │ 💬 CASUAL                               │                    │
│  │ Friendly, conversational, relaxed       │                    │
│  │ "Hey! Solid workout yesterday.          │                    │
│  │ Let's keep that energy going."          │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                 │
│  ┌─────────────────────────────────────────┐                    │
│  │ ⚡ TOUGH LOVE                            │                    │
│  │ Direct, no excuses, accountability      │                    │
│  │ "You skipped your workout. That's on    │                    │
│  │ you. Get back at it tomorrow."          │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 🔔 Daily Notifications                           [═══●] │    │
│  │ Get daily reminders, insights, and check-ins            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ⚠️ VitalPath provides general wellness guidance and is  │    │
│  │ not a substitute for medical advice.                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  [← Back]                            [Start My Journey →]       │
└─────────────────────────────────────────────────────────────────┘
```

**Coaching Tone Colors**:
- Empathetic: Pink (`bg-pink-500/10 border-pink-200`)
- Scientific: Blue (`bg-blue-500/10 border-blue-200`)
- Casual: Green (`bg-green-500/10 border-green-200`)
- Tough Love: Orange (`bg-orange-500/10 border-orange-200`)

### Post-Onboarding Calculations

**BMR Calculation (Mifflin-St Jeor)**:
```
Male:   BMR = 10×weight(kg) + 6.25×height(cm) - 5×age + 5
Female: BMR = 10×weight(kg) + 6.25×height(cm) - 5×age - 161
```

**Activity Multiplier**:
| Activity Level | Multiplier |
|----------------|------------|
| Sedentary | 1.2 |
| Lightly active | 1.375 |
| Moderately active | 1.55 |
| Very active | 1.725 |

**Maintenance Calories** = BMR × Activity Multiplier

**Target Calories** (based on phase):
- Recovery: Previous lowest + 100 (reverse diet) or maintenance
- Recomp: 95% of maintenance
- Cutting: 85% of maintenance
- Minimum: Never below 85% of BMR

**Macro Targets**:
- Protein: 1.8g per kg bodyweight (higher for 40+)
- Fat: 0.8g per kg bodyweight
- Carbs: Remaining calories ÷ 4 (minimum 100g)

---

## 4.2 Dashboard

### Feature Maturity: ✅ Production Ready

### Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  Good morning, [Name]!                    [AI Sync] [Refresh]   │
│  Today is [Day], [Date] • [Phase Badge]                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐  │
│  │ Weight      │ │ Calories    │ │ Steps       │ │ Sleep     │  │
│  │ 82.5 kg     │ │ 1,450/2,100 │ │ 4,200/8,000 │ │ 7.5 hrs   │  │
│  │ ↓ 0.3 kg    │ │ ████░░░ 69% │ │ ███░░░ 53%  │ │ Good      │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 💬 Quick Note to Coach                                  │    │
│  │ ┌─────────────────────────────────────────────────────┐ │    │
│  │ │ [Recent messages preview - last 4]                  │ │    │
│  │ │ ─────────────────────────────────────────────────── │ │    │
│  │ │ [Input: "Ask your coach anything..."]        [Send] │ │    │
│  │ └─────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ✨ Today's Guidance from Your AI Coach      [Refresh]   │    │
│  │ ─────────────────────────────────────────────────────── │    │
│  │ [Personalized greeting based on time of day]            │    │
│  │                                                         │    │
│  │ ┌────────────┐ ┌────────────┐ ┌────────────┐            │    │
│  │ │ Nutrition  │ │ Workout    │ │ Steps      │            │    │
│  │ │ 1,450/2,100│ │ Upper Body │ │ 4,200/8000 │            │    │
│  │ │ 110g/130g P│ │ 45 min     │ │ Keep moving│            │    │
│  │ │ [Log Food] │ │ [Start]    │ │ [Log]      │            │    │
│  │ └────────────┘ └────────────┘ └────────────┘            │    │
│  │                                                         │    │
│  │ 💡 Check-ins: [Warning/Reminder badges]                 │    │
│  │ 📊 Insights: [Actionable AI observations]               │    │
│  │                                                         │    │
│  │ "[Motivational closing message]"                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────┐ ┌─────────────────────────┐        │
│  │ 🏆 Points & Streaks     │ │ 🏅 Leaderboard          │        │
│  │ 1,250 lifetime          │ │ #12 Weekly              │        │
│  │ 🔥 7-day streak (3x)    │ │ [View Rankings]         │        │
│  │ [View History]          │ │                         │        │
│  └─────────────────────────┘ └─────────────────────────┘        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 📈 Today's Macros                                       │    │
│  │ Protein:  ████████████░░░░░░░░  110g / 130g             │    │
│  │ Carbs:    █████████░░░░░░░░░░░  150g / 210g             │    │
│  │ Fat:      ██████████████░░░░░░   52g / 70g              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  [+ Floating FAB: Log Food]                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Components Used
- `QuickNote` - Mini chat interface
- `DailyGuidance` - AI daily plan (lazy loaded)
- `PointsDisplay` - Gamification stats
- `LeaderboardCard` - Competitive rankings
- `RestDayCard` - Recovery recommendations
- `HealthInsights` - Smart observations
- `FoodFAB` - Floating action button
- `MilestoneCelebration` - Achievement modals

---

## 4.3 Nutrition Tracking

### Feature Maturity: ✅ Production Ready

### Main View
```
┌─────────────────────────────────────────────────────────────────┐
│  Nutrition                        [◀ Prev] [Date] [Next ▶]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Daily Summary                              1,450 / 2,100 │    │
│  │ ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░  69%      │    │
│  │                                                          │    │
│  │ Protein    ████████████░░░  110g/130g                    │    │
│  │ Carbs      █████████░░░░░░  150g/210g                    │    │
│  │ Fat        ██████████████░   52g/70g                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ➕ Add Food                                              │    │
│  │ ┌───────────────────────────────────────────────────┐   │    │
│  │ │ 🔍 Search foods or scan barcode...                │   │    │
│  │ └───────────────────────────────────────────────────┘   │    │
│  │                                                          │    │
│  │ [Breakfast ▼]  [📷 Photo]  [📱 Barcode]                  │    │
│  │                                                          │    │
│  │ Quick Add:                                               │    │
│  │ [Protein Shake] [Greek Yogurt] [Eggs] [Chicken]          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 🌅 Breakfast                              420 cal        │    │
│  │ ├── Greek Yogurt with Berries    180 cal  20g P         │    │
│  │ ├── Scrambled Eggs (2)           140 cal  12g P         │    │
│  │ └── Coffee with Milk             100 cal   3g P         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 🌞 Lunch                                   630 cal       │    │
│  │ ├── Grilled Chicken Salad        350 cal  35g P         │    │
│  │ └── Whole Wheat Bread (2 slices) 280 cal   8g P         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 🌙 Dinner                                  [Empty]       │    │
│  │ Tap to add foods                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 🍎 Snacks                                  400 cal       │    │
│  │ └── Protein Bar                  400 cal  30g P         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 📋 My Meals (Templates)                    [+ Create]    │    │
│  │ ├── Morning Routine     450 cal  [Use for Breakfast]    │    │
│  │ └── Post-Workout Shake  350 cal  [Use for Snack]        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Food Entry Capabilities
1. **Manual Entry**: Name, calories, macros
2. **Database Search**: USDA database (300K+ foods) with local fallback
3. **Barcode Scanning**: Product lookup via camera
4. **Photo AI**: GPT Vision analyzes food photos
5. **Voice (via Chat)**: Natural language parsing
6. **Meal Templates**: Save and reuse common meals

### Points System Integration
- 10 points per food logged
- Streak multiplier applies (up to 4x)
- Points awarded immediately on log

---

## 4.4 Workout System

### Feature Maturity: ✅ Production Ready

### Workout Library
```
┌─────────────────────────────────────────────────────────────────┐
│  Workout Programs                                               │
│  Evidence-based training for adults 40+                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [AI Recommended Workout Card - if from chat]                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ✨ AI Recommended for Today                      [X]    │    │
│  │ Upper Body Strength                                      │    │
│  │ "Based on your recovery, this moderate session..."       │    │
│  │ [Strength] [Intermediate] [45 min]                       │    │
│  │ Exercises: Bench Press, Rows, Shoulder Press...          │    │
│  │                        [▶ Start This Workout]            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  [Rest Day Card - if recommended]                               │
│                                                                 │
│  [Strength] [Cardio] [Recovery] [History] [Analytics]           │
│                                                                 │
│  ┌─────────────────────────┐ ┌─────────────────────────┐        │
│  │ Full Body Strength A    │ │ Full Body Strength B    │        │
│  │ Foundation compound     │ │ Complementary workout   │        │
│  │ movements               │ │ different patterns      │        │
│  │ [Strength] [Beginner]   │ │ [Strength] [Beginner]   │        │
│  │ [45 min]                │ │ [45 min]                │        │
│  └─────────────────────────┘ └─────────────────────────┘        │
│                                                                 │
│  ┌─────────────────────────┐ ┌─────────────────────────┐        │
│  │ Upper Body Focus        │ │ Lower Body Focus        │        │
│  │ Dedicated upper body    │ │ Comprehensive legs      │        │
│  │ [Strength] [Intermediate]│ │ [Strength] [Intermediate]│       │
│  │ [50 min]                │ │ [50 min]                │        │
│  └─────────────────────────┘ └─────────────────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Default Workout Templates (6)
1. **Full Body Strength A** - Beginner, 45 min, compound movements
2. **Full Body Strength B** - Beginner, 45 min, complementary patterns
3. **Upper Body Focus** - Intermediate, 50 min, chest/back/shoulders/arms
4. **Lower Body Focus** - Intermediate, 50 min, quads/hamstrings/glutes/calves
5. **Recovery & Mobility** - Beginner, 30 min, stretching/foam rolling
6. **LISS Cardio** - Beginner, 30 min, zone 2 cardio

### Workout Detail View
```
┌─────────────────────────────────────────────────────────────────┐
│  [← Back]                                                       │
│                                                                 │
│  Full Body Strength A                                           │
│  Foundation workout focusing on compound movements              │
│                                                                 │
│  [▶ Start Workout]                                              │
│                                                                 │
│  ⏱ 45 minutes  |  🎯 Beginner  |  💪 Strength                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ℹ️ Understanding RIR (Reps In Reserve)                   │    │
│  │ RIR indicates how many more reps you could do before    │    │
│  │ failure. RIR 3 means stop with 3 reps "left in tank."   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  EXERCISES                                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Goblet Squat                          3 × 10-12 @ RIR 3 │    │
│  │ Focus on depth and control                               │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ Dumbbell Romanian Deadlift            3 × 10-12 @ RIR 3 │    │
│  │ Hinge at hips, slight knee bend                          │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ Dumbbell Bench Press                  3 × 10-12 @ RIR 3 │    │
│  │ Full range of motion                                     │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ Cable Row                             3 × 10-12 @ RIR 3 │    │
│  │ Squeeze shoulder blades                                  │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ Overhead Press                        3 × 10-12 @ RIR 3 │    │
│  │ Engage core throughout                                   │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ Plank                                 3 × 30-45 sec      │    │
│  │ Neutral spine                                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ⚡ Tips for 40+ Training                                 │    │
│  │ • Warm up thoroughly—5-10 minutes before lifting        │    │
│  │ • Focus on form over weight; controlled tempo           │    │
│  │ • Listen to your body; skip exercises that cause pain   │    │
│  │ • Allow 48+ hours recovery for same muscle groups       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Active Workout Session
```
┌─────────────────────────────────────────────────────────────────┐
│  [End]     Full Body Strength A     ⏱ 12:34     [3/6]          │
│  ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  50%      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                     🏋️ GOBLET SQUAT                      │    │
│  │                   3 sets × 10-12 reps @ RIR 3            │    │
│  │                                                          │    │
│  │   [💡 Form tip: Keep chest up, push knees out]           │    │
│  │                                                          │    │
│  │                      SET 2 of 3                          │    │
│  │                                                          │    │
│  │   Weight (kg)           Reps                             │    │
│  │   ┌────────────┐        ┌────────────┐                   │    │
│  │   │    30      │        │    12      │                   │    │
│  │   └────────────┘        └────────────┘                   │    │
│  │                                                          │    │
│  │   Previous: 30 kg × 12 reps                              │    │
│  │                                                          │    │
│  │              [✓ Complete Set]                            │    │
│  │                                                          │    │
│  │   [⏭ Skip Exercise]                                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Rest time: [30s] [60s] [90s*] [120s] [180s]                    │
│                                                                 │
│  Completed: [Set 1: 12 @ 30kg]                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Rest Timer
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                     ✅ Set 2 Complete!                          │
│                     30 kg × 12 reps                             │
│                                                                 │
│                         REST                                    │
│                                                                 │
│                        1:32                                     │
│                 ████████████░░░░░░░░                            │
│                     2:00 total                                  │
│                                                                 │
│              [-30s]  [Skip Rest →]  [+30s]                      │
│                                                                 │
│          Next: Set 3 of 3 - Goblet Squat                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 💡 Coach tip: Focus on controlled descent next set.     │    │
│  │ The eccentric phase builds the most muscle.             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Workout Complete Summary
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    🎉 WORKOUT COMPLETE!                         │
│                                                                 │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │
│  │ Duration   │ │ Exercises  │ │ Sets       │ │ Volume     │    │
│  │  43:21     │ │   6/6      │ │   16/16    │ │ 4,280 kg   │    │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘    │
│                                                                 │
│  📈 vs. Last Workout:                                           │
│  • Volume: +320 kg (+8%) ⬆️                                     │
│  • Squat: +5 kg PR! 🏆                                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 🤖 Coach says:                                          │    │
│  │ "Great session! You hit all your RIR targets which      │    │
│  │ means we can consider adding weight next time.          │    │
│  │ Recovery is key - aim for 7+ hours of sleep tonight."   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│                   [Save & Continue]                             │
│                                                                 │
│  [Share Progress]           [View Detailed Log]                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4.5 AI Chat / Mentor

### Feature Maturity: ✅ Production Ready

### Chat Interface
```
┌─────────────────────────────────────────────────────────────────┐
│  AI Health Mentor                                    [Refresh]  │
│  Your personalized guide to metabolic health                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Workout Recommendation Card - if AI suggested workout]        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 💪 Upper Body Strength              [45 min] [X]        │    │
│  │ [Strength] [Intermediate]                                │    │
│  │ Exercises: Bench Press, Rows, OHP, Curls, Triceps        │    │
│  │                          [▶ Start This Workout]          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │    [Empty State - Suggested Prompts]                     │    │
│  │                                                          │    │
│  │            ✨ Your AI Health Mentor                      │    │
│  │    Ask me anything about nutrition, training,            │    │
│  │    recovery, or your health journey.                     │    │
│  │                                                          │    │
│  │    [How should I adjust my calories this week?]          │    │
│  │    [I'm feeling tired lately. What could cause this?]    │    │
│  │    [Explain metabolic adaptation to me]                  │    │
│  │    [I'm struggling with motivation. Can you help?]       │    │
│  │    [What's the best workout split for someone 40+?]      │    │
│  │    [How do I know if I'm in a caloric deficit?]          │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ─────────── OR with messages ───────────                       │
│                                                                 │
│                               ┌─────────────────────────┐       │
│                               │ I had eggs and toast    │ 8:32  │
│                               │ for breakfast           │       │
│                               └─────────────────────────┘       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Got it! I've logged your breakfast:                      │    │
│  │ • Eggs (2 large) - 140 cal, 12g protein                  │    │
│  │ • Toast (2 slices) - 160 cal, 6g protein                 │    │
│  │                                                          │    │
│  │ That's 300 calories and 18g protein to start your day.   │    │
│  │ Great choice for protein! You're at 14% of your daily    │    │
│  │ target already.                                     8:32 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  [●●●] Typing...                                                │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Ask your health mentor anything...               [Send]  │    │
│  └─────────────────────────────────────────────────────────┘    │
│  AI provides guidance based on evidence-based practices.        │
│  Always consult a healthcare provider for medical advice.       │
└─────────────────────────────────────────────────────────────────┘
```

### AI Capabilities (What Chat Can Do)
1. **Log Food**: "I had a chicken salad for lunch" → Creates food entry
2. **Log Exercise**: "I did 30 minutes of running" → Creates exercise log
3. **Log Biofeedback**: "I slept 7 hours, feeling energized" → Updates daily log
4. **Recommend Workouts**: Provides structured workout with start button
5. **Answer Questions**: Health, nutrition, training knowledge
6. **Apply Profile Changes**: "Lower my calories by 100" → Updates targets
7. **Create Meal Templates**: Auto-detects recurring meals
8. **Provide Phase Guidance**: Contextual to current metabolic phase
9. **Generate Insights**: Pattern recognition across data

### Coaching Tones (Affects All AI Responses)
| Tone | Style | Example |
|------|-------|---------|
| Empathetic | Warm, validating | "I know this is hard. You're doing amazing just by showing up." |
| Scientific | Data-driven | "Your protein intake is 15% below optimal for muscle protein synthesis." |
| Casual | Friendly | "Hey! Solid workout yesterday. Let's keep that energy going." |
| Tough Love | Direct | "You skipped your workout. That's on you. Get back at it tomorrow." |

---

## 4.6 Progress Tracking

### Feature Maturity: ✅ Production Ready

### Main View
```
┌─────────────────────────────────────────────────────────────────┐
│  Progress                           [7 days] [30 days] [90 days]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │
│  │ Avg Weight │ │ Avg Cals   │ │ Avg Steps  │ │ Avg Sleep  │    │
│  │ 82.3 kg    │ │ 1,980      │ │ 6,450      │ │ 7.2 hrs    │    │
│  │ ↓ 0.5 kg   │ │ ↑ 5%       │ │ ↑ 12%      │ │ ↑ 0.3 hrs  │    │
│  │ vs prior   │ │ vs prior   │ │ vs prior   │ │ vs prior   │    │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘    │
│                                                                 │
│  [Weight] [Measurements] [Nutrition] [Activity] [Biofeedback]   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Weight Over Time                      │    │
│  │  84 ─┬───────────────────────────────────────────────    │    │
│  │      │     ╭──╮                                          │    │
│  │  83 ─┼────╯    ╰──────╮                                  │    │
│  │      │                 ╰────╮                            │    │
│  │  82 ─┼──────────────────────╰────╮                       │    │
│  │      │                            ╰───                   │    │
│  │  81 ─┼───────────────────────────────────────────────    │    │
│  │      └───────────────────────────────────────────────    │    │
│  │        Mon  Tue  Wed  Thu  Fri  Sat  Sun                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│                            [Share Progress]                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Body Measurements Tab
```
┌─────────────────────────────────────────────────────────────────┐
│  Body Measurements                              [+ Add New]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Latest Measurements (Dec 20, 2024)                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │
│  │ Chest      │ │ Waist      │ │ Hips       │ │ Body Fat   │    │
│  │ 102 cm     │ │ 88 cm      │ │ 98 cm      │ │ 22%        │    │
│  │ ↓ 1 cm     │ │ ↓ 3 cm     │ │ ↓ 2 cm     │ │ ↓ 2%       │    │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘    │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │
│  │ L Bicep    │ │ R Bicep    │ │ L Thigh    │ │ R Thigh    │    │
│  │ 35 cm      │ │ 35.5 cm    │ │ 58 cm      │ │ 58.5 cm    │    │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Waist Trend (12 weeks)                  │    │
│  │  [Chart showing waist measurement over time]             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Measurement History                                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Date       │ Chest │ Waist │ Hips  │ Body Fat          │    │
│  │ Dec 20     │ 102   │ 88    │ 98    │ 22%               │    │
│  │ Dec 13     │ 102.5 │ 89    │ 99    │ 23%               │    │
│  │ Dec 6      │ 103   │ 91    │ 100   │ 24%               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4.7 Gamification (Points & Leaderboards)

### Feature Maturity: ✅ Production Ready

### Points System
| Action | Base Points | Notes |
|--------|-------------|-------|
| Log Food | 10 | Per entry |
| Log Workout | 50 | + up to 30 bonus for duration |
| Log Sleep | 15 | |
| Log Energy | 10 | |
| Log Stress | 10 | |
| Log Mood | 10 | |
| Log Weight | 20 | |
| Log Steps (2K) | 10 | |
| Log Steps (5K) | 20 | |
| Log Steps (8K) | 35 | |
| Log Steps (10K+) | 50 | |
| First Food Log | 50 | Milestone |
| First Workout | 100 | Milestone |
| Day 3 Streak | 100 | Milestone |
| First Week | 250 | Milestone |
| Welcome Bonus | 50-110 | Based on onboarding completeness |

### Streak Multipliers
| Streak Days | Multiplier |
|-------------|------------|
| 1-2 | 1.0x |
| 3-6 | 2.0x |
| 7-13 | 3.0x |
| 14+ | 4.0x |

### Leaderboard Types
- Daily (resets midnight UTC)
- Weekly (resets Sunday midnight UTC)
- Monthly (resets 1st of month)

---

## 4.8 First Week Experience (Milestones)

### Feature Maturity: ✅ Production Ready

### Milestone Definitions
| Key | Icon | Title | Trigger |
|-----|------|-------|---------|
| first_food_log | Utensils (Green) | "First Meal Logged!" | First food entry created |
| first_workout | Dumbbell (Blue) | "First Workout Complete!" | First exercise logged |
| day_2_streak | Flame (Orange) | "2-Day Streak!" | 2 consecutive days of logging |
| day_3 | TrendingUp (Purple) | "Day 3 Pattern Emerging!" | 3 consecutive days |
| first_week | Trophy (Yellow) | "First Week Complete!" | 7 consecutive days |

### Milestone Celebration Modal
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    [Pulsing Icon Animation]                     │
│                                                                 │
│               🎉 First Meal Logged! 🎉                          │
│                                                                 │
│     You're building the foundation for lasting change.          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ✨ Consistency > perfection. Keep showing up!           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 💡 Quick tip:                                           │    │
│  │ Log meals right after eating - it takes 10 seconds      │    │
│  │ and builds the habit. Don't wait until end of day!      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│                        [Got it!]                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### First Week Report (Day 7 Milestone)
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    🏆 YOUR FIRST WEEK                           │
│                                                                 │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │
│  │ Days       │ │ Meals      │ │ Workouts   │ │ Protein    │    │
│  │ 6/7        │ │ 18         │ │ 3          │ │ 91%        │    │
│  │ logged     │ │ logged     │ │ completed  │ │ of target  │    │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘    │
│                                                                 │
│  ⭐ Wins This Week                                              │
│  [Logged 6 days] [Hit protein 5 days] [3 workouts]              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ✨ "Fantastic start! Your consistency is exactly what   │    │
│  │ builds lasting change. Focus for Week 2: bump protein   │    │
│  │ by ~15g/day to hit 100%."                               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│                      [Start Week 2]                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4.9 Phase System

### Feature Maturity: ✅ Production Ready

### Phase Definitions

| Phase | Color | Description | Min Duration | Transition Criteria |
|-------|-------|-------------|--------------|---------------------|
| Assessment | Gray | Initial data gathering | N/A | Always ready → Recovery |
| Recovery | Purple | Metabolic restoration | 8 weeks | Biofeedback 6.5+ OR 12 weeks |
| Recomposition | Blue | Build muscle, manage fat | 12 weeks | Weight > target + 2kg OR 16 weeks + biofeedback 7+ |
| Cutting | Orange | Strategic fat loss | Variable | Manual transition |

### Phase-Specific Guidance
| Phase | Workout Focus | Nutrition Approach |
|-------|---------------|-------------------|
| Recovery | Mobility, light resistance (RIR 4+), low-impact cardio | Reverse diet, eat at/above maintenance |
| Recomposition | 3-4 strength sessions, progressive overload, moderate cardio | Small deficit or maintenance, high protein |
| Cutting | Heavy compounds (lower volume), HIIT, metabolic finishers | 15% deficit, very high protein |

### Phase Transition Logic
```
┌──────────────┐
│  Assessment  │
└──────┬───────┘
       │ Always ready
       ▼
┌──────────────┐
│   Recovery   │ 8+ weeks + biofeedback 6.5+
│              │ OR 12+ weeks
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Recomp    │ 12+ weeks + weight > target + 2kg
│              │ OR 16+ weeks + biofeedback 7+
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Cutting    │
└──────────────┘
```

---

## 4.10 Daily Log

### Feature Maturity: ✅ Production Ready

### Sections
1. **Nutrition**: Calories, Protein, Carbs, Fat (manual entry or synced)
2. **Activity**: Steps, Water intake
3. **Workout Logger**: Embedded workout tracking
4. **Sleep**: Hours and quality (1-10)
5. **Biofeedback**: Energy, Mood, Stress (1-10 sliders)
6. **Notes**: Free-form observations

---

## 4.11 Settings

### Feature Maturity: ✅ Production Ready

### Sections
1. **Profile Picture Upload**
2. **Profile Info**: Name, target weight
3. **Daily Targets**: Steps, calories, macros
4. **Coaching Preferences**: Tone selection with examples
5. **Appearance**: Theme toggle (Light/Dark)
6. **Data Export**: JSON (full) or CSV (logs only)
7. **Public Profile Settings**: Privacy controls
8. **Profile Changes History**: Audit log
9. **Sign Out**

---

## 4.12 Additional Features

### Goals (Feature Maturity: 🟡 Beta)
- Set custom health goals
- Track progress toward targets
- Categories: Weight, Strength, Nutrition, Activity, Body Composition

### Devices / Wearables (Feature Maturity: 🟡 Beta)
- Apple Health integration (planned)
- Fitbit, Garmin, Oura connection UI (planned)
- Manual data entry fallback

### Learn / Educational Content (Feature Maturity: 🟡 Beta)
- Article library
- Categories: Nutrition, Training, Recovery, Mindset
- Reading time estimates

### Public Profile (Feature Maturity: ✅ Production Ready)
- Shareable at `/u/username`
- Privacy controls for each data type
- Social sharing buttons

---

# PART 5: API REFERENCE

## 5.1 Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/profile` | GET | Fetch user profile |
| `/api/profile` | PATCH | Update profile |
| `/api/onboarding` | POST | Complete onboarding |
| `/api/daily-logs/today` | GET | Today's log |
| `/api/daily-logs/:date` | GET | Specific date log |
| `/api/daily-logs` | POST | Create/update log |
| `/api/food-entries/:date` | GET | Foods for date |
| `/api/food-entries` | POST | Create food entry |
| `/api/exercise-logs/:date` | GET | Exercises for date |
| `/api/exercise-logs` | POST | Create exercise |
| `/api/chat/messages` | GET | Chat history |
| `/api/chat/send` | POST | Send message to AI |
| `/api/daily-guidance` | GET | AI daily plan |
| `/api/milestones` | GET | User milestones |
| `/api/points/summary` | GET | Points and streaks |
| `/api/leaderboard/:period` | GET | Rankings |
| `/api/phase-evaluation` | GET | Phase readiness |
| `/api/body-measurements` | GET/POST | Measurements |
| `/api/workouts` | GET | Workout library |
| `/api/meal-templates` | GET/POST/DELETE | Saved meals |

## 5.2 AI Models Used
| Purpose | Primary Model | Fallback |
|---------|---------------|----------|
| Chat/Guidance | gpt-4o | gpt-4o-mini |
| Vision (Photos) | gpt-4o | gpt-4o |
| Parsing/Extraction | gpt-4o-mini | gpt-4o-mini |
| Assistants API | gpt-4o | N/A |

---

# PART 6: DATABASE SCHEMA SUMMARY

## 6.1 Core Tables
- **users** - Auth identity (Apple ID)
- **userProfiles** - Demographics, targets, preferences
- **onboardingAssessments** - Initial health survey
- **dailyLogs** - Daily metrics
- **foodEntries** - Individual food items
- **exerciseLogs** - Workout performance
- **bodyMeasurements** - Physical measurements

## 6.2 AI & Coaching Tables
- **chatMessages** - Conversation history
- **healthNotes** - User context for AI
- **profileChanges** - Audit log of AI-applied changes

## 6.3 Gamification Tables
- **userPoints** - Points and streaks
- **pointTransactions** - Point history
- **userMilestones** - Achievement tracking

## 6.4 Content Tables
- **workoutTemplates** - Pre-built workouts
- **mealTemplates** - User-saved meals
- **educationalContent** - Articles
- **foodDatabase** - Nutrition info

---

# PART 7: FUTURE FEATURES

## 7.1 Planned Features (High Priority)
| Feature | Description | Status |
|---------|-------------|--------|
| Push Notifications | Morning briefing, meal reminders, streak protection | 📋 Planned |
| Apple Health Sync | Auto-import steps, sleep, workouts | 📋 Planned |
| Voice Food Logging | "Siri, log my breakfast" | 📋 Planned |
| Barcode Scanner Improvements | Faster lookup, manual fallback | 📋 Planned |
| Workout History Analytics | Volume trends, strength PRs | 🟡 In Progress |

## 7.2 Considered Features (Medium Priority)
| Feature | Description |
|---------|-------------|
| Friends/Social | Follow friends, share progress |
| Challenges | Weekly/monthly competitions |
| Points Store | Redeem points for rewards |
| Recipe Database | Healthy recipe suggestions |
| Meal Planning | Weekly meal prep plans |
| Progress Photos | Before/after comparisons |
| Custom Workouts | Create your own templates |
| Habit Tracking | Non-fitness habits |

## 7.3 Future Vision (Low Priority)
| Feature | Description |
|---------|-------------|
| Wearable Deep Integration | HRV-based workout adjustments |
| Supplement Tracking | Vitamins, medications |
| Blood Work Integration | Lab result analysis |
| Telehealth | Connect with real coaches |
| AR Exercise Form Check | Camera-based form feedback |
| Genetic Personalization | DNA-based recommendations |

---

# PART 8: FEATURE MATURITY LEGEND

| Symbol | Status | Definition |
|--------|--------|------------|
| ✅ | Production Ready | Fully implemented, tested, stable |
| 🟡 | Beta | Implemented but may have rough edges |
| 🟠 | Alpha | Basic functionality, needs polish |
| 📋 | Planned | Designed but not yet implemented |
| 💡 | Concept | Idea stage, not designed yet |

---

# APPENDIX A: COMPLETE ONBOARDING FIELD MAPPING

```typescript
// Simplified form (3-step UI)
interface OnboardingForm {
  // Step 1
  firstName: string;
  age: number;
  sex: "male" | "female";
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg?: number;

  // Step 2
  activityLevel: "sedentary" | "lightly_active" | "moderately_active" | "very_active";
  exerciseFrequency: "none" | "1-2" | "3-4" | "5+";
  dietingHistory: "no" | "few_weeks" | "few_months" | "6_months_plus";
  sleepQuality: "poor" | "fair" | "good" | "great";
  stressLevel: number; // 1-10

  // Step 3
  coachingTone: "empathetic" | "scientific" | "casual" | "tough_love";
  enableNotifications: boolean;
}

// Full onboarding data (stored in DB)
interface OnboardingAssessment {
  // From form
  firstName: string;
  lastName: string; // ""
  age: number;
  sex: "male" | "female";
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number | null;

  // Derived from activityLevel
  activityLevel: string;
  occupation: string; // "Not specified"

  // Derived from exerciseFrequency
  doesResistanceTraining: boolean;
  resistanceTrainingFrequency: number;
  doesCardio: boolean;
  averageDailySteps: number;

  // Derived from dietingHistory
  hasBeenDietingRecently: boolean;
  dietingDurationMonths: number;
  previousLowestCalories: number | null;

  // Derived from sleepQuality
  averageSleepHours: number;
  sleepQuality: number;

  // From form
  stressLevel: number;
  coachingTone: string;
  enableNotifications: boolean;

  // Defaults
  energyLevelMorning: 5;
  energyLevelAfternoon: 5;
  moodGeneral: 5;
  usesWearable: false;
  hasHealthConditions: false;
  relationshipWithFood: "neutral";

  // Calculated
  recommendedStartPhase: "recovery" | "recomp";
  metabolicState: "adapted" | "healthy" | "unknown";
  psychologicalReadiness: "ready" | "needs_support";
}
```

---

# APPENDIX B: AI SYSTEM PROMPT STRUCTURE

The AI mentor receives context including:
1. User profile (age, sex, phase, targets, coaching tone)
2. Current health notes and injuries
3. Last 7-14 days of logs (nutrition, workouts, biofeedback)
4. Yearly history summary (if using Assistants API)
5. Current date/time in user's timezone
6. Today's logged data so far

The AI is instructed to:
- Always personalize responses using user's data
- Respect the selected coaching tone
- Consider current phase in recommendations
- Never provide medical diagnoses
- Never recommend extreme deficits
- Flag concerns requiring professional help
- Reference specific numbers and patterns
- Be encouraging but honest

---

*End of Document*

**Version**: 1.0
**Last Updated**: December 2024
**Maintained By**: VitalPath Product Team
