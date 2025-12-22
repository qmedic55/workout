# VitalPath: Comprehensive Research & Implementation Guide

**Document Version:** 1.0
**Last Updated:** December 22, 2025
**Application:** VitalPath - AI-Powered Health Coaching Platform

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement & Vision](#2-problem-statement--vision)
3. [Target Audience](#3-target-audience)
4. [Technology Stack](#4-technology-stack)
5. [Project Architecture](#5-project-architecture)
6. [Database Schema](#6-database-schema)
7. [Core Features](#7-core-features)
8. [AI Integration](#8-ai-integration)
9. [API Reference](#9-api-reference)
10. [Frontend Implementation](#10-frontend-implementation)
11. [Mobile Implementation](#11-mobile-implementation)
12. [Authentication System](#12-authentication-system)
13. [Third-Party Integrations](#13-third-party-integrations)
14. [Business Logic Modules](#14-business-logic-modules)
15. [Styling & Design System](#15-styling--design-system)
16. [Build & Deployment](#16-build--deployment)
17. [Rebuilding Guide](#17-rebuilding-guide)

---

## 1. Executive Summary

### What is VitalPath?

VitalPath is a comprehensive AI-powered health coaching platform specifically designed for adults aged 40 and beyond. The application combines scientific evidence-based approaches to body recomposition with personalized AI coaching to help users achieve sustainable health transformations.

### Key Differentiators

1. **Age-Appropriate Focus**: Unlike generic fitness apps, VitalPath prioritizes metabolic health, recovery, joint safety, and sustainable approaches suitable for the 40+ demographic.

2. **Metabolic Adaptation Expertise**: The platform specifically addresses metabolic adaptation from chronic dieting, offering reverse dieting and metabolic recovery protocols.

3. **AI-Powered Personalization**: Uses OpenAI's GPT-4 to provide genuinely personalized coaching that adapts to user data, biofeedback, and progress.

4. **Phase-Based Coaching**: Implements a structured phase system (Recovery → Recomposition → Cutting) based on metabolic science rather than arbitrary timelines.

5. **Holistic Biofeedback Integration**: Tracks sleep, stress, energy, mood, and digestion alongside traditional fitness metrics to inform coaching decisions.

### What Has Been Built

| Component | Status | Description |
|-----------|--------|-------------|
| **Full-Stack Web Application** | Complete | React frontend + Express backend |
| **PostgreSQL Database** | Complete | 18 tables with Drizzle ORM |
| **AI Coaching System** | Complete | OpenAI integration with context-aware responses |
| **Mobile Apps** | Complete | iOS/Android via Capacitor |
| **Nutrition Tracking** | Complete | USDA database integration (300K+ foods) |
| **Workout System** | Complete | 40+ exercise templates with logging |
| **Analytics Dashboard** | Complete | Workout analytics, trends, insights |
| **Social Features** | Complete | Public profiles, sharing cards |
| **Wearable Integration** | Framework | OAuth infrastructure for device connections |

---

## 2. Problem Statement & Vision

### The Problem

Adults over 40 face unique challenges in health and fitness:

1. **Metabolic Slowdown**: Years of crash dieting leads to metabolic adaptation, making weight management increasingly difficult.

2. **One-Size-Fits-All Apps**: Most fitness apps ignore age-related recovery needs, joint health considerations, and metabolic history.

3. **Information Overload**: Conflicting advice online leads to confusion about what actually works for mature adults.

4. **Lack of Personalization**: Generic calorie calculators don't account for dieting history, stress levels, sleep quality, or metabolic state.

5. **Recovery Ignorance**: Apps push aggressive deficits and high-volume training without considering recovery capacity.

### The Vision

Create an AI health mentor that:

- **Understands Individual Context**: Knows your dieting history, stress levels, sleep patterns, and adjusts recommendations accordingly.

- **Prioritizes Sustainable Approaches**: Focuses on metabolic health first, body composition second.

- **Adapts in Real-Time**: Uses daily biofeedback to modify recommendations before problems arise.

- **Educates, Not Just Prescribes**: Teaches users *why* things work, building long-term health literacy.

- **Prevents Metabolic Damage**: Recognizes signs of overtraining or excessive restriction and intervenes proactively.

---

## 3. Target Audience

### Primary Demographic

- **Age**: 40+ years old
- **Background**: History of dieting, yo-yo weight changes
- **Goals**: Body recomposition, sustainable fat loss, improved energy
- **Tech Comfort**: Moderate (comfortable with smartphones, apps)

### User Personas

#### Persona 1: "The Chronic Dieter"
- 45-year-old professional
- Has tried numerous diets, lost/regained weight multiple times
- Metabolism feels "broken"
- Needs metabolic recovery before any fat loss attempt

#### Persona 2: "The Busy Professional"
- 52-year-old executive
- Limited time for detailed tracking
- Wants efficient workouts
- Values data-driven decisions

#### Persona 3: "The Comeback Athlete"
- 48-year-old former athlete
- Returning to fitness after years away
- Needs age-appropriate training
- Wants to avoid injury

### Key User Needs

1. **Simplicity**: Quick logging without excessive detail
2. **Guidance**: Clear direction on what to do each day
3. **Accountability**: Someone (or something) checking in
4. **Education**: Understanding the "why" behind recommendations
5. **Flexibility**: Adjusts to real life (travel, stress, illness)

---

## 4. Technology Stack

### Frontend Technologies

```
Package                Version    Purpose
-------                -------    -------
React                  18.3.1     UI framework
Vite                   5.4.20     Build tool & dev server
TypeScript             5.6.3      Type safety
Wouter                 3.3.5      Client-side routing
TanStack React Query   5.60.5     Server state management
Tailwind CSS           3.4.17     Utility-first styling
Radix UI               Various    Headless UI components
Lucide React           0.453.0    Icon library
Recharts               2.15.2     Data visualization
Framer Motion          11.13.1    Animations
React Hook Form        7.55.0     Form handling
Zod                    3.24.2     Schema validation
date-fns               3.6.0      Date utilities
```

### Backend Technologies

```
Package                Version    Purpose
-------                -------    -------
Express                4.21.2     HTTP server framework
Drizzle ORM            0.39.3     Type-safe database ORM
PostgreSQL             (pg 8.16)  Primary database
OpenAI                 6.14.0     AI/ML integration
Passport.js            0.7.0      Authentication middleware
express-session        1.18.2     Session management
connect-pg-simple      10.0.0     PostgreSQL session store
Jose                   6.1.3      JWT handling (Apple Auth)
ws                     8.18.0     WebSocket support
```

### Mobile Technologies

```
Package                    Version    Purpose
-------                    -------    -------
@capacitor/core            8.0.0      Native bridge
@capacitor/ios             8.0.0      iOS platform
@capacitor/android         8.0.0      Android platform
@capacitor/splash-screen   8.0.0      Splash screen
@capacitor/status-bar      8.0.0      Status bar control
@capacitor/keyboard        8.0.0      Keyboard handling
@capacitor/share           8.0.0      Native sharing
@capacitor-community/apple-sign-in  7.1.0  Apple authentication
```

### Development Tools

```
Package                Version    Purpose
-------                -------    -------
tsx                    4.20.5     TypeScript execution
esbuild                0.25.0     JavaScript bundler
drizzle-kit            0.31.4     Database migrations
postcss                8.4.47     CSS processing
autoprefixer           10.4.20    CSS vendor prefixes
```

---

## 5. Project Architecture

### Directory Structure

```
workout/
├── client/                          # Frontend application
│   ├── src/
│   │   ├── pages/                   # Route components (14 pages)
│   │   │   ├── dashboard.tsx        # Main overview (532 lines)
│   │   │   ├── daily-log.tsx        # Daily tracking (608 lines)
│   │   │   ├── nutrition.tsx        # Food logging (852 lines)
│   │   │   ├── workouts.tsx         # Workout library (540 lines)
│   │   │   ├── progress.tsx         # Charts & trends (820 lines)
│   │   │   ├── chat.tsx             # AI mentor (263 lines)
│   │   │   ├── goals.tsx            # Goal management (764 lines)
│   │   │   ├── onboarding.tsx       # Initial setup (1046 lines)
│   │   │   ├── learn.tsx            # Educational content (614 lines)
│   │   │   ├── settings.tsx         # User preferences (415 lines)
│   │   │   ├── profile.tsx          # User profile (389 lines)
│   │   │   ├── devices.tsx          # Wearable connections (328 lines)
│   │   │   ├── public-profile.tsx   # Social sharing (221 lines)
│   │   │   └── playground.tsx       # Dev testing (124 lines)
│   │   ├── components/
│   │   │   ├── ui/                  # Radix-based UI components
│   │   │   ├── app-sidebar.tsx      # Navigation sidebar
│   │   │   ├── mobile-nav.tsx       # Mobile bottom navigation
│   │   │   └── theme-*.tsx          # Theme components
│   │   ├── hooks/
│   │   │   ├── use-auth.ts          # Authentication hook
│   │   │   ├── use-apple-auth.ts    # Apple Sign In hook
│   │   │   └── use-*.ts             # Various utility hooks
│   │   ├── lib/
│   │   │   ├── queryClient.ts       # React Query configuration
│   │   │   └── utils.ts             # Utility functions
│   │   ├── App.tsx                  # Application root
│   │   └── main.tsx                 # Entry point
│   └── index.html                   # HTML template
│
├── server/                          # Backend application
│   ├── index.ts                     # Server entry point
│   ├── routes.ts                    # All API endpoints (3392 lines)
│   ├── storage.ts                   # Database operations
│   ├── db.ts                        # Database connection
│   ├── openai.ts                    # OpenAI integration
│   ├── aiRecommendations.ts         # AI-powered recommendations
│   ├── aiActionParser.ts            # Parse AI responses for actions
│   ├── insights.ts                  # Health insights generation
│   ├── dailyGuidance.ts             # Daily coaching messages
│   ├── phaseTransition.ts           # Phase management logic
│   ├── workoutAnalytics.ts          # Workout statistics
│   ├── restDayRecommendations.ts    # Rest day advice
│   ├── notificationService.ts       # Notification templates
│   ├── proactiveNotifications.ts    # Scheduled notifications
│   ├── foodApi.ts                   # USDA food database API
│   ├── seed.ts                      # Database seeding
│   ├── vite.ts                      # Vite dev integration
│   ├── static.ts                    # Static file serving
│   └── replit_integrations/
│       └── auth/                    # Authentication modules
│           ├── replitAuth.ts        # Replit OAuth setup
│           └── storage.ts           # User persistence
│
├── shared/                          # Shared code
│   ├── schema.ts                    # Database schema (801 lines)
│   └── models/
│       └── auth.ts                  # Auth type definitions
│
├── migrations/                      # Database migrations
├── android/                         # Android native files
├── ios/                             # iOS native files
├── dist/                            # Built output
│
├── package.json                     # Dependencies
├── capacitor.config.ts              # Mobile configuration
├── vite.config.ts                   # Vite configuration
├── tailwind.config.js               # Tailwind configuration
├── drizzle.config.ts                # Drizzle ORM configuration
└── tsconfig.json                    # TypeScript configuration
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                               │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  React + Vite + TypeScript                                       │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐        │ │
│  │  │  Wouter   │ │  React    │ │  Radix    │ │  Framer   │        │ │
│  │  │  Router   │ │  Query    │ │  UI       │ │  Motion   │        │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘        │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/REST
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           SERVER LAYER                               │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Express.js + TypeScript                                         │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐        │ │
│  │  │  Routes   │ │  Auth     │ │  Business │ │  Storage  │        │ │
│  │  │  Handler  │ │  Middleware│ │  Logic    │ │  Layer    │        │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘        │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
          │                                              │
          │ API                                          │ SQL
          ▼                                              ▼
┌─────────────────────┐                    ┌─────────────────────┐
│    EXTERNAL APIS    │                    │      DATABASE       │
│  ┌───────────────┐  │                    │  ┌───────────────┐  │
│  │   OpenAI      │  │                    │  │  PostgreSQL   │  │
│  │   GPT-4       │  │                    │  │  (Drizzle ORM)│  │
│  └───────────────┘  │                    │  └───────────────┘  │
│  ┌───────────────┐  │                    └─────────────────────┘
│  │   USDA Food   │  │
│  │   Database    │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │   Apple Auth  │  │
│  │   Services    │  │
│  └───────────────┘  │
└─────────────────────┘
```

### Request/Response Flow

```
1. User Action (Click, Form Submit)
         │
         ▼
2. React Component
         │ Calls hook/fetch
         ▼
3. TanStack React Query
         │ Manages cache, deduplication
         ▼
4. HTTP Request to /api/*
         │
         ▼
5. Express Middleware Chain
         │ JSON parsing, logging, auth check
         ▼
6. Route Handler (routes.ts)
         │ Validates input with Zod
         ▼
7. Business Logic Module
         │ (aiRecommendations.ts, insights.ts, etc.)
         ▼
8. Storage Layer (storage.ts)
         │ Drizzle ORM queries
         ▼
9. PostgreSQL Database
         │
         ▼
10. Response back through layers
```

---

## 6. Database Schema

### Entity Relationship Overview

```
users (1) ─────────────────┬──────────────────────────────────────────┐
                           │                                          │
                    (1:1)  │  (1:N)                                   │
                           │                                          │
                    userProfiles                                      │
                    onboardingAssessments                             │
                    publicProfiles                                    │
                           │                                          │
              ┌────────────┼────────────┬────────────┐                │
              │            │            │            │                │
         dailyLogs    chatMessages   goals    wearableConnections    │
              │                         │                             │
         ┌────┴────┐              milestones                         │
         │         │                                                  │
    foodEntries  exerciseLogs ─────────── workoutTemplates           │
                                                                      │
         healthNotes    bodyMeasurements    mealTemplates            │
         profileChanges notifications       shareEvents              │
                                                                      │
         educationalContent    foodDatabase                          │
```

### Complete Table Definitions

#### 1. users (from auth)
```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL UNIQUE,
  firstName TEXT,
  lastName TEXT,
  profileImageUrl TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### 2. userProfiles
```sql
CREATE TABLE user_profiles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR NOT NULL REFERENCES users(id),

  -- Basic Info
  firstName TEXT,
  lastName TEXT,
  age INTEGER,
  sex TEXT,                              -- 'male' | 'female'
  heightCm REAL,
  currentWeightKg REAL,
  targetWeightKg REAL,
  bodyFatPercentage REAL,
  waistCircumferenceCm REAL,

  -- Phase Management
  currentPhase TEXT DEFAULT 'assessment', -- 'assessment' | 'recovery' | 'recomp' | 'cutting'
  phaseStartDate DATE,

  -- Calculated Targets
  maintenanceCalories INTEGER,
  targetCalories INTEGER,
  proteinGrams INTEGER,
  carbsGrams INTEGER,
  fatGrams INTEGER,
  dailyStepsTarget INTEGER DEFAULT 8000,

  -- Preferences
  coachingTone TEXT DEFAULT 'empathetic', -- 'empathetic' | 'scientific' | 'casual' | 'tough_love'
  enableNotifications BOOLEAN DEFAULT true,

  -- Health Conditions
  hasHealthConditions BOOLEAN DEFAULT false,
  healthConditionsNotes TEXT,

  onboardingCompleted BOOLEAN DEFAULT false,
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### 3. onboardingAssessments
```sql
CREATE TABLE onboarding_assessments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR NOT NULL REFERENCES users(id),

  -- Diet History
  hasBeenDietingRecently BOOLEAN,
  dietingDurationMonths INTEGER,
  previousLowestCalories INTEGER,
  typicalDailyEating TEXT,
  biggestHurdles TEXT,
  relationshipWithFood TEXT,            -- 'healthy' | 'restrictive' | 'emotional' | 'disordered'

  -- Exercise Background
  doesResistanceTraining BOOLEAN,
  resistanceTrainingFrequency INTEGER,   -- days per week
  resistanceTrainingType TEXT,
  doesCardio BOOLEAN,
  averageDailySteps INTEGER,
  physicalLimitations TEXT,
  knowsRIR BOOLEAN,                      -- Reps in Reserve familiarity

  -- Lifestyle
  occupation TEXT,
  activityLevel TEXT,                    -- 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active'
  averageSleepHours REAL,
  sleepQuality INTEGER,                  -- 1-10
  stressLevel INTEGER,                   -- 1-10
  stressSources TEXT,

  -- Biofeedback Baseline
  energyLevelMorning INTEGER,            -- 1-10
  energyLevelAfternoon INTEGER,          -- 1-10
  digestionQuality TEXT,                 -- 'good' | 'bloating' | 'constipation' | 'other'
  moodGeneral INTEGER,                   -- 1-10

  -- Women-specific
  menstrualStatus TEXT,                  -- 'premenopausal' | 'perimenopausal' | 'postmenopausal' | 'not_applicable'

  -- Wearable Data
  usesWearable BOOLEAN,
  wearableType TEXT,
  averageHRV REAL,
  restingHeartRate INTEGER,

  -- Classification Results
  metabolicState TEXT,                   -- 'adapted' | 'healthy' | 'unknown'
  recommendedStartPhase TEXT,            -- 'recovery' | 'recomp' | 'cutting'
  psychologicalReadiness TEXT,           -- 'ready' | 'needs_support' | 'high_anxiety'

  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### 4. dailyLogs
```sql
CREATE TABLE daily_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR NOT NULL REFERENCES users(id),
  logDate DATE NOT NULL,

  -- Weight & Measurements
  weightKg REAL,
  waistCm REAL,
  hipsCm REAL,
  chestCm REAL,

  -- Nutrition
  caloriesConsumed INTEGER,
  proteinGrams REAL,
  carbsGrams REAL,
  fatGrams REAL,
  waterLiters REAL,

  -- Activity
  steps INTEGER,
  activeMinutes INTEGER,
  workoutCompleted BOOLEAN DEFAULT false,
  workoutType TEXT,
  workoutDurationMinutes INTEGER,

  -- Biofeedback (1-10 scales)
  sleepHours REAL,
  sleepQuality INTEGER,
  energyLevel INTEGER,
  stressLevel INTEGER,
  moodRating INTEGER,
  digestionNotes TEXT,

  -- Wearable Data
  avgHeartRate INTEGER,
  hrv REAL,

  -- Notes
  notes TEXT,
  dataSource TEXT DEFAULT 'manual',     -- 'manual' | 'apple_health' | 'fitbit' | 'garmin' | 'oura'

  createdAt TIMESTAMP DEFAULT NOW(),
  UNIQUE(userId, logDate)
);
```

#### 5. foodEntries
```sql
CREATE TABLE food_entries (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR NOT NULL REFERENCES users(id),
  dailyLogId VARCHAR REFERENCES daily_logs(id),
  logDate DATE NOT NULL,

  mealType TEXT NOT NULL,                -- 'breakfast' | 'lunch' | 'dinner' | 'snack'
  foodName TEXT NOT NULL,
  servingSize TEXT,
  servingQuantity REAL DEFAULT 1,

  calories INTEGER,
  proteinGrams REAL,
  carbsGrams REAL,
  fatGrams REAL,
  fiberGrams REAL,

  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### 6. exerciseLogs
```sql
CREATE TABLE exercise_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR NOT NULL REFERENCES users(id),
  dailyLogId VARCHAR REFERENCES daily_logs(id),
  workoutTemplateId VARCHAR REFERENCES workout_templates(id),
  logDate DATE NOT NULL,

  exerciseName TEXT NOT NULL,
  exerciseOrder INTEGER NOT NULL,

  -- Prescribed (from template)
  prescribedSets INTEGER,
  prescribedReps TEXT,                   -- e.g., "10-12" or "30 sec"
  prescribedRir INTEGER,                 -- Reps in Reserve

  -- Actual Performance
  completedSets INTEGER,
  setDetails JSONB,                      -- [{reps: 12, weightKg: 50, rir: 2}, ...]

  notes TEXT,
  skipped BOOLEAN DEFAULT false,

  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### 7. workoutTemplates
```sql
CREATE TABLE workout_templates (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,                    -- 'strength' | 'cardio' | 'flexibility' | 'recovery'
  difficulty TEXT NOT NULL,              -- 'beginner' | 'intermediate' | 'advanced'
  durationMinutes INTEGER,
  targetAgeGroup TEXT DEFAULT '40+',

  phases JSONB DEFAULT '["recovery", "recomp", "cutting"]',
  phasePriority INTEGER DEFAULT 5,       -- 1-10, higher = more recommended

  exercises JSONB,                       -- Array of exercise objects

  createdAt TIMESTAMP DEFAULT NOW()
);
```

**Exercise Object Structure:**
```json
{
  "name": "Goblet Squats",
  "sets": 3,
  "reps": "10-12",
  "rir": 2,
  "restSeconds": 90,
  "notes": "Focus on depth, pause at bottom"
}
```

#### 8. chatMessages
```sql
CREATE TABLE chat_messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR NOT NULL REFERENCES users(id),

  role TEXT NOT NULL,                    -- 'user' | 'assistant'
  content TEXT NOT NULL,
  contextType TEXT,                      -- 'onboarding' | 'check_in' | 'question' | 'coaching' | 'phase_transition'

  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### 9. goals
```sql
CREATE TABLE goals (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR NOT NULL REFERENCES users(id),

  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,                -- 'weight' | 'strength' | 'nutrition' | 'activity' | 'body_comp'

  targetType TEXT NOT NULL,              -- 'reach_value' | 'maintain_streak' | 'complete_count'
  targetValue REAL,
  targetUnit TEXT,                       -- 'lbs' | 'kg' | 'g' | 'reps' | 'days'

  startValue REAL,
  currentValue REAL,

  targetDate DATE,
  startDate DATE DEFAULT CURRENT_DATE,
  completedAt TIMESTAMP,

  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'completed' | 'abandoned'

  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### 10. milestones
```sql
CREATE TABLE milestones (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  goalId VARCHAR NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  userId VARCHAR NOT NULL REFERENCES users(id),

  title TEXT NOT NULL,
  targetValue REAL,

  isCompleted BOOLEAN DEFAULT false,
  completedAt TIMESTAMP,

  "order" INTEGER DEFAULT 0,

  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### 11. bodyMeasurements
```sql
CREATE TABLE body_measurements (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR NOT NULL REFERENCES users(id),
  measurementDate DATE NOT NULL,

  -- Core (cm)
  chestCm REAL,
  waistCm REAL,
  hipsCm REAL,

  -- Arms (cm)
  leftBicepCm REAL,
  rightBicepCm REAL,
  leftForearmCm REAL,
  rightForearmCm REAL,

  -- Legs (cm)
  leftThighCm REAL,
  rightThighCm REAL,
  leftCalfCm REAL,
  rightCalfCm REAL,

  -- Other
  neckCm REAL,
  shouldersCm REAL,
  bodyFatPercentage REAL,

  notes TEXT,

  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### 12. mealTemplates
```sql
CREATE TABLE meal_templates (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR NOT NULL REFERENCES users(id),

  name TEXT NOT NULL,
  mealType TEXT,

  totalCalories INTEGER,
  totalProtein REAL,
  totalCarbs REAL,
  totalFat REAL,

  items JSONB NOT NULL,                  -- Array of food items

  usageCount INTEGER DEFAULT 0,
  lastUsedAt TIMESTAMP,

  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### 13. healthNotes
```sql
CREATE TABLE health_notes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR NOT NULL REFERENCES users(id),

  content TEXT NOT NULL,
  category TEXT,                         -- 'injury' | 'nutrition' | 'sleep' | 'stress' | 'lifestyle' | 'general'

  isActive BOOLEAN DEFAULT true,
  expiresAt TIMESTAMP,

  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### 14. profileChanges
```sql
CREATE TABLE profile_changes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR NOT NULL REFERENCES users(id),
  chatMessageId VARCHAR REFERENCES chat_messages(id),

  changeCategory TEXT NOT NULL,          -- 'nutrition' | 'training' | 'sleep' | 'phase' | 'goals'
  fieldName TEXT NOT NULL,
  changeDescription TEXT NOT NULL,

  previousValue TEXT,
  newValue TEXT,
  reasoning TEXT,

  source TEXT NOT NULL DEFAULT 'ai_chat', -- 'ai_chat' | 'manual' | 'phase_transition' | 'onboarding'

  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### 15. publicProfiles
```sql
CREATE TABLE public_profiles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR NOT NULL UNIQUE REFERENCES users(id),

  username VARCHAR(30) UNIQUE,
  displayName VARCHAR(50),
  bio TEXT,

  -- Privacy Controls
  showWeight BOOLEAN DEFAULT false,
  showGoals BOOLEAN DEFAULT true,
  showStreaks BOOLEAN DEFAULT true,
  showWorkoutStats BOOLEAN DEFAULT true,
  showProgress BOOLEAN DEFAULT false,
  showMilestones BOOLEAN DEFAULT true,

  isPublic BOOLEAN DEFAULT false,

  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### 16. shareEvents
```sql
CREATE TABLE share_events (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR NOT NULL REFERENCES users(id),

  cardType TEXT NOT NULL,                -- 'progress' | 'goal' | 'streak' | 'milestone' | 'workout'
  platform TEXT,                         -- 'native' | 'twitter' | 'download' | 'copy'

  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### 17. wearableConnections
```sql
CREATE TABLE wearable_connections (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR NOT NULL REFERENCES users(id),

  provider TEXT NOT NULL,                -- 'apple_health' | 'fitbit' | 'garmin' | 'oura'
  accessToken TEXT,
  refreshToken TEXT,
  tokenExpiresAt TIMESTAMP,

  isConnected BOOLEAN DEFAULT false,
  lastSyncAt TIMESTAMP,

  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### 18. Supporting Tables

```sql
-- Notifications
CREATE TABLE notifications (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR NOT NULL REFERENCES users(id),

  type TEXT NOT NULL,                    -- 'reminder' | 'insight' | 'phase_change' | 'achievement'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  isRead BOOLEAN DEFAULT false,
  actionUrl TEXT,

  createdAt TIMESTAMP DEFAULT NOW()
);

-- Educational Content
CREATE TABLE educational_content (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),

  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,                -- 'metabolic_adaptation' | 'reverse_dieting' | 'rir' | etc.
  content TEXT NOT NULL,
  readTimeMinutes INTEGER,

  createdAt TIMESTAMP DEFAULT NOW()
);

-- Food Database (USDA cache)
CREATE TABLE food_database (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  servingSize TEXT,
  calories INTEGER,
  proteinGrams REAL,
  carbsGrams REAL,
  fatGrams REAL,
  fiberGrams REAL,
  category TEXT,

  createdAt TIMESTAMP DEFAULT NOW()
);
```

---

## 7. Core Features

### 7.1 Onboarding & Assessment

**Purpose:** Gather comprehensive health information to personalize the coaching experience.

**Flow:**
1. Welcome screen with app introduction
2. Basic information (age, sex, height, weight)
3. Diet history assessment
4. Exercise background
5. Lifestyle & stress evaluation
6. Biofeedback baseline
7. Wearable device information
8. Classification & phase recommendation
9. Target calculation

**Implementation Details:**
- Multi-step wizard (10+ steps)
- Progress indicator
- Data validation at each step
- AI-based classification of metabolic state
- Automatic target calculation

**Key Calculations:**
```typescript
// Maintenance calories (Mifflin-St Jeor)
BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + (sex === 'male' ? 5 : -161)
TDEE = BMR × activity_multiplier

// Phase-based targets
if (phase === 'recovery') {
  targetCalories = TDEE + 100  // Small surplus
} else if (phase === 'recomp') {
  targetCalories = TDEE        // Maintenance
} else if (phase === 'cutting') {
  targetCalories = TDEE - 300  // Moderate deficit
}

// Protein target (higher for 40+)
proteinGrams = weight_kg × 2.0  // 2g per kg bodyweight
```

### 7.2 Daily Logging

**Purpose:** Track daily metrics to inform AI coaching and generate insights.

**Tracked Metrics:**
- Weight (kg)
- Nutrition (calories, protein, carbs, fat, fiber, water)
- Activity (steps, active minutes, workout completion)
- Biofeedback (sleep hours/quality, energy, stress, mood)
- Wearable data (heart rate, HRV)
- Notes

**Features:**
- Quick-add buttons for common values
- Historical comparison
- Target progress bars
- Trend indicators

### 7.3 Nutrition Tracking

**Purpose:** Detailed food logging with macronutrient tracking.

**Features:**
- USDA food database search (300K+ foods)
- Barcode scanning (html5-qrcode)
- Meal templates (save favorite meals)
- Quick-log from templates
- Meal type categorization (breakfast, lunch, dinner, snack)
- Daily summary with target comparison
- Historical view

**USDA Integration:**
```typescript
// Food search endpoint
GET /api/foods?query=chicken+breast

// Response
{
  "foods": [
    {
      "fdcId": 171077,
      "description": "Chicken breast, boneless, skinless, raw",
      "nutrients": {
        "calories": 120,
        "protein": 26.7,
        "fat": 1.3,
        "carbs": 0
      }
    }
  ]
}
```

### 7.4 Workout System

**Purpose:** Structured workout logging with progress tracking.

**Components:**
- 40+ pre-built workout templates
- Phase-specific workout recommendations
- Exercise-by-exercise logging
- Set-by-set detail tracking (reps, weight, RIR)
- Workout duration tracking
- Notes per exercise

**Template Structure:**
```json
{
  "name": "Full Body Strength A",
  "type": "strength",
  "difficulty": "intermediate",
  "durationMinutes": 45,
  "phases": ["recomp", "cutting"],
  "exercises": [
    { "name": "Goblet Squats", "sets": 3, "reps": "10-12", "rir": 2, "restSeconds": 90 },
    { "name": "Romanian Deadlifts", "sets": 3, "reps": "10-12", "rir": 2, "restSeconds": 90 },
    { "name": "Dumbbell Bench Press", "sets": 3, "reps": "8-10", "rir": 2, "restSeconds": 120 },
    { "name": "Cable Rows", "sets": 3, "reps": "10-12", "rir": 2, "restSeconds": 90 },
    { "name": "Overhead Press", "sets": 3, "reps": "8-10", "rir": 2, "restSeconds": 90 },
    { "name": "Planks", "sets": 3, "reps": "30-45 sec", "restSeconds": 60 }
  ]
}
```

### 7.5 Workout Analytics

**Purpose:** Visualize training progress and patterns.

**Metrics:**
- Total workouts (all-time, weekly, monthly)
- Average workouts per week
- Total volume lifted (kg)
- Workout streaks (current, longest)
- Weekly trends (workouts, volume, duration)
- Muscle group frequency
- Exercise progress (best weight, reps, trend)

**Implementation:** See `server/workoutAnalytics.ts`

### 7.6 Goal Management

**Purpose:** Set, track, and achieve fitness goals.

**Goal Types:**
- `reach_value`: Reach a specific target (e.g., weigh 180 lbs)
- `maintain_streak`: Maintain consistency (e.g., workout 3x/week)
- `complete_count`: Complete N occurrences (e.g., 100 workouts)

**Features:**
- Goal creation with milestones
- Automatic progress tracking
- Milestone completion
- Goal completion celebration
- Goal abandonment (with dignity)

### 7.7 Phase System

**Phases:**

| Phase | Purpose | Duration | Calorie Target | Focus |
|-------|---------|----------|----------------|-------|
| Recovery | Metabolic restoration | 8-12 weeks | TDEE + 100 | Sleep, stress reduction, building metabolic capacity |
| Recomposition | Body recomp | 12-16 weeks | TDEE | Build muscle, maintain/slow fat loss |
| Cutting | Fat loss | 8-12 weeks | TDEE - 300 | Preserve muscle, sustainable deficit |

**Transition Criteria:**
```typescript
// Recovery → Recomp
if (weeksInPhase >= 8 && biofeedbackScore >= 6.5) {
  readyForTransition = true;
}

// Recomp → Cutting
if (weeksInPhase >= 12 && currentWeight > targetWeight + 2) {
  readyForTransition = true;
}

// Cutting → Recovery
if (weeksInPhase >= 8 && biofeedbackScore < 5) {
  readyForTransition = true;
}
```

### 7.8 Health Notes

**Purpose:** Capture context that affects training/nutrition recommendations.

**Categories:**
- Injury (temporary or chronic)
- Nutrition (dietary restrictions, allergies)
- Sleep (sleep issues, schedule changes)
- Stress (work stress, life events)
- Lifestyle (travel, schedule changes)
- General (anything else)

**Features:**
- AI categorization
- Expiration dates (for temporary issues)
- Active/inactive status
- Used in AI context for personalized coaching

### 7.9 Body Measurements

**Purpose:** Track body composition beyond just weight.

**Measurements:**
- Core: chest, waist, hips
- Arms: left/right bicep, left/right forearm
- Legs: left/right thigh, left/right calf
- Other: neck, shoulders
- Body fat percentage

**Features:**
- Historical tracking
- Trend analysis
- Comparison views

### 7.10 Educational Content

**Purpose:** Evidence-based education to build health literacy.

**Topics Covered:**
- Metabolic adaptation and how to recover
- Reverse dieting explained
- RIR (Reps in Reserve) methodology
- Body recomposition science
- Cortisol and stress management
- Nutrition fundamentals for 40+
- Training for longevity
- Sleep optimization

**Features:**
- Category organization
- Read time estimates
- Progress tracking (read/unread)

---

## 8. AI Integration

### 8.1 Overview

VitalPath uses OpenAI's GPT-4 for intelligent, context-aware health coaching. The AI integration goes beyond simple chat to include:

1. **Conversational Coaching**: Natural language health mentoring
2. **Profile Analysis**: Comprehensive assessment of user data
3. **Workout Recommendations**: Phase-appropriate training suggestions
4. **Daily Guidance**: Proactive coaching messages
5. **Health Insights**: Pattern detection and alerts
6. **Action Parsing**: Extract profile changes from conversations

### 8.2 System Prompt Construction

The AI receives comprehensive context about the user:

```typescript
function buildSystemPrompt(context: ChatContext): string {
  // 1. Set coaching tone based on user preference
  let toneInstruction = "";
  switch (profile?.coachingTone) {
    case "scientific":
      toneInstruction = "Be data-driven and provide detailed scientific explanations.";
      break;
    case "casual":
      toneInstruction = "Be friendly, upbeat, and use simple everyday language.";
      break;
    case "tough_love":
      toneInstruction = "Be direct, challenging, and motivating.";
      break;
    case "empathetic":
    default:
      toneInstruction = "Be warm, understanding, and supportive.";
  }

  // 2. Include user profile data
  // 3. Include daily progress summary
  // 4. Include assessment data
  // 5. Include recent daily logs with trends
  // 6. Include food log entries
  // 7. Include workout log entries
  // 8. Include health notes for context

  return `You are VitalPath, an AI health coach specializing in body recomposition
  for adults 40+. ${toneInstruction}

  ${contextInfo}

  IMPORTANT GUIDELINES:
  - Prioritize joint health, recovery, and sustainable approaches
  - Avoid recommending aggressive deficits or extreme training
  - Consider metabolic adaptation from long-term dieting
  - Sleep and stress management are critical for this demographic
  - Always validate feelings while providing evidence-based guidance
  `;
}
```

### 8.3 Chat Response Generation

```typescript
async function generateChatResponse(
  userId: string,
  userMessage: string,
  conversationHistory: Array<{role: string, content: string}>
): Promise<string> {
  // Gather context
  const profile = await storage.getProfile(userId);
  const recentLogs = await storage.getDailyLogs(userId, last14Days);
  const assessment = await storage.getOnboardingAssessment(userId);
  const foodEntries = await storage.getFoodEntries(userId, last7Days);
  const exerciseLogs = await storage.getExerciseLogs(userId, last7Days);
  const healthNotes = await storage.getActiveHealthNotes(userId);

  // Build system prompt with full context
  const systemPrompt = buildSystemPrompt({
    profile,
    recentLogs,
    assessment,
    foodEntries,
    exerciseLogs,
    healthNotes
  });

  // Make OpenAI API call
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: userMessage }
    ],
    temperature: 0.7,
    max_tokens: 1000
  });

  return response.choices[0].message.content;
}
```

### 8.4 AI Recommendations

```typescript
interface ProfileAnalysis {
  overallAssessment: string;
  recommendations: AIRecommendation[];
  suggestedWorkoutTypes: string[];
  nutritionAdjustments: {
    calories: "increase" | "decrease" | "maintain";
    protein: "increase" | "decrease" | "maintain";
    reasoning: string;
  };
  trainingAdjustments: {
    volume: "increase" | "decrease" | "maintain";
    intensity: "increase" | "decrease" | "maintain";
    recoveryDays: "increase" | "decrease" | "maintain";
    reasoning: string;
  };
  phaseRecommendation: {
    currentPhase: string;
    shouldTransition: boolean;
    suggestedPhase: string | null;
    reasoning: string;
  };
}
```

### 8.5 Daily Guidance

The AI generates personalized daily coaching messages:

```typescript
interface DailyGuidance {
  greeting: string;
  todaysFocus: string;
  tips: string[];
  actionItems: {
    action: string;
    reasoning: string;
  }[];
  motivation: string;
}
```

### 8.6 Health Insights

Rule-based insights with AI enhancement:

| Insight Type | Trigger | Message Example |
|--------------|---------|-----------------|
| Sleep-Energy | <6 hrs sleep + low energy | "Your energy dipped after only 5.5 hours of sleep. Aim for 7+ tonight." |
| Protein Recovery | Workout + <70% protein | "You worked out but protein is at 65% of target. Add a protein-rich snack." |
| Stress Pattern | 3+ days high stress | "Elevated stress for 3 days can affect recovery. Consider a rest day." |
| Calorie Deficit | 5+ days under target | "Extended deficit detected. Consider a maintenance day to support metabolism." |
| Hydration | >10K steps + <2L water | "You walked 12,000 steps but only logged 1.5L water. Stay hydrated!" |
| Training Recovery | Workout yesterday + poor sleep | "After yesterday's workout, prioritize recovery sleep tonight." |
| Weight Trend | Up despite deficit | "Weight up 0.5kg - likely water retention. Check sodium and stress." |
| Phase Progress | Good biofeedback in recovery | "Energy, sleep, and stress are trending positive. Approaching next phase readiness." |

### 8.7 Action Parsing

The AI can suggest profile modifications that are extracted and applied with user consent:

```typescript
interface ParsedAction {
  category: "nutrition" | "training" | "phase" | "goals";
  fieldName: string;
  changeDescription: string;
  previousValue: string;
  newValue: string;
  reasoning: string;
}

// Example: AI suggests increasing protein target
// "Based on your recent workout volume and recovery metrics,
// I recommend increasing your protein target from 140g to 160g per day."

// Parsed action:
{
  category: "nutrition",
  fieldName: "proteinGrams",
  changeDescription: "Increase protein target",
  previousValue: "140",
  newValue: "160",
  reasoning: "Higher workout volume requires more protein for recovery"
}
```

### 8.8 Rate Limiting

AI endpoints are rate-limited to prevent abuse:

```typescript
// 10 requests per minute per user
const aiRateLimiter = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

  const userRequests = aiRateLimiter.get(userId) || [];
  const recentRequests = userRequests.filter(t => now - t < windowMs);

  if (recentRequests.length >= maxRequests) {
    return false; // Rate limited
  }

  recentRequests.push(now);
  aiRateLimiter.set(userId, recentRequests);
  return true;
}
```

---

## 9. API Reference

### 9.1 Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/login` | Initiate Replit OAuth login |
| GET | `/api/callback` | OAuth callback handler |
| GET | `/api/logout` | Logout current user |
| GET | `/api/auth/user` | Get current authenticated user |
| POST | `/api/auth/apple` | Apple Sign In verification |

### 9.2 Profile Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get user profile |
| PATCH | `/api/profile` | Update user profile |
| POST | `/api/onboarding` | Submit onboarding assessment |

### 9.3 Daily Log Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/daily-logs/today` | Get today's log |
| GET | `/api/daily-logs/:date` | Get log for specific date |
| GET | `/api/daily-logs/range/:timeRange` | Get logs for range (7d, 30d, 90d) |
| POST | `/api/daily-logs` | Create/update daily log |

### 9.4 Food Entry Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/food-entries/:date` | Get food entries for date |
| POST | `/api/food-entries` | Log food entry |
| DELETE | `/api/food-entries/:id` | Delete food entry |
| GET | `/api/foods` | Search USDA food database |
| POST | `/api/barcode/lookup` | Lookup food by barcode |

### 9.5 Exercise Log Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/exercise-logs/:date` | Get exercise logs for date |
| POST | `/api/exercise-logs` | Log single exercise |
| POST | `/api/exercise-logs/bulk` | Log multiple exercises |
| PATCH | `/api/exercise-logs/:id` | Update exercise log |
| DELETE | `/api/exercise-logs/:id` | Delete exercise log |

### 9.6 Workout Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workouts` | Get all workout templates |
| GET | `/api/workouts/recommended` | Get phase-appropriate workouts |
| GET | `/api/workout-analytics` | Get workout statistics |
| GET | `/api/workout-plan` | Get AI-generated workout plan |
| GET | `/api/rest-day-recommendation` | Get rest day advice |

### 9.7 Chat & AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/messages` | Get chat history |
| POST | `/api/chat/send` | Send message, get AI response |
| GET | `/api/insights` | Get health insights |
| GET | `/api/daily-guidance` | Get AI daily coaching |
| GET | `/api/ai-recommendations` | Get comprehensive AI analysis |
| GET | `/api/ai-recommendations/workout` | Get workout recommendations |

### 9.8 Phase Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/phase-evaluation` | Evaluate phase transition readiness |
| POST | `/api/phase-transition` | Execute phase transition |

### 9.9 Goal Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/goals` | List all goals |
| GET | `/api/goals/:id` | Get specific goal |
| POST | `/api/goals` | Create goal |
| PATCH | `/api/goals/:id` | Update goal |
| DELETE | `/api/goals/:id` | Delete goal |
| POST | `/api/goals/:id/complete` | Mark goal complete |
| POST | `/api/goals/:id/abandon` | Abandon goal |
| POST | `/api/goals/:goalId/milestones` | Add milestone |
| POST | `/api/goals/:goalId/milestones/:milestoneId/complete` | Complete milestone |
| DELETE | `/api/goals/:goalId/milestones/:milestoneId` | Delete milestone |

### 9.10 Body Measurement Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/body-measurements` | List measurements |
| GET | `/api/body-measurements/:date` | Get measurement for date |
| POST | `/api/body-measurements` | Log measurements |
| DELETE | `/api/body-measurements/:id` | Delete measurement |
| GET | `/api/body-measurements/analysis` | Get measurement trends |

### 9.11 Meal Template Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/meal-templates` | List saved meals |
| GET | `/api/meal-templates/:id` | Get meal template |
| POST | `/api/meal-templates` | Save meal template |
| PATCH | `/api/meal-templates/:id` | Update meal template |
| DELETE | `/api/meal-templates/:id` | Delete meal template |
| POST | `/api/meal-templates/:id/log` | Quick-log meal |

### 9.12 Health Note Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health-notes` | List health notes |
| POST | `/api/health-notes` | Create health note |
| PATCH | `/api/health-notes/:id` | Update health note |
| DELETE | `/api/health-notes/:id` | Delete health note |

### 9.13 Public Profile & Social Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public-profile` | Get own public profile |
| POST | `/api/public-profile` | Update public profile |
| GET | `/api/public-profile/check/:username` | Check username availability |
| GET | `/api/u/:username` | View public profile |
| POST | `/api/share/log` | Record share event |
| GET | `/api/share/events` | Get share history |

### 9.14 Notification Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List notifications |
| GET | `/api/notifications/unread-count` | Get unread count |
| POST | `/api/notifications/:id/read` | Mark as read |
| POST | `/api/notifications/read-all` | Mark all as read |

### 9.15 Export Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/export/json` | Export all data as JSON |
| GET | `/api/export/csv` | Export data as CSV |
| GET | `/api/streaks` | Get streak data |
| GET | `/api/weekly-report` | Get weekly summary |

---

## 10. Frontend Implementation

### 10.1 Application Structure

```typescript
// App.tsx - Root component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AppContent() {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Public routes don't require auth
  if (isPublicProfileRoute) {
    return <PublicProfile />;
  }

  if (isLoading) return <LoadingScreen />;

  return isAuthenticated ? <AuthenticatedApp /> : <LandingPage />;
}
```

### 10.2 Routing

```typescript
// Wouter-based routing with lazy loading
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Chat = lazy(() => import("@/pages/chat"));
// ... other lazy imports

function Router() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/chat" component={Chat} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/daily-log" component={DailyLog} />
        <Route path="/progress" component={Progress} />
        <Route path="/nutrition" component={Nutrition} />
        <Route path="/workouts" component={Workouts} />
        <Route path="/devices" component={Devices} />
        <Route path="/learn" component={Learn} />
        <Route path="/settings" component={Settings} />
        <Route path="/profile" component={Profile} />
        <Route path="/goals" component={Goals} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}
```

### 10.3 State Management

TanStack React Query handles server state:

```typescript
// Query client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Example query hook
function useDailyLog(date: string) {
  return useQuery({
    queryKey: ['daily-log', date],
    queryFn: async () => {
      const res = await fetch(`/api/daily-logs/${date}`);
      return res.json();
    },
  });
}

// Example mutation hook
function useUpdateDailyLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DailyLogInput) => {
      const res = await fetch('/api/daily-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-log'] });
    },
  });
}
```

### 10.4 Component Library

Using Radix UI primitives with Tailwind styling:

```typescript
// Button component example
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

// Available components:
// Accordion, AlertDialog, Avatar, Button, Calendar, Card,
// Checkbox, Collapsible, Command, ContextMenu, Dialog,
// Dropdown, HoverCard, Input, Label, Menubar, NavigationMenu,
// Popover, Progress, RadioGroup, ScrollArea, Select, Separator,
// Sheet, Sidebar, Skeleton, Slider, Switch, Table, Tabs,
// Textarea, Toast, Toggle, Tooltip
```

### 10.5 Responsive Design

```typescript
// Mobile-first approach with breakpoints
function AuthenticatedApp() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        {/* Sidebar hidden on mobile, visible on md+ */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          <header className="...">
            {/* Mobile: Logo, Desktop: Sidebar toggle */}
            <SidebarTrigger className="hidden md:flex" />
            <div className="flex items-center gap-2 md:hidden">
              <Activity className="h-5 w-5 text-primary" />
              <span className="font-semibold">VitalPath</span>
            </div>
          </header>

          <main className="flex-1 overflow-auto pb-20 md:pb-0">
            <Router />
          </main>
        </div>

        {/* Mobile bottom navigation */}
        <MobileNav />
      </div>
    </SidebarProvider>
  );
}
```

---

## 11. Mobile Implementation

### 11.1 Capacitor Configuration

```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.vitalpath.app',
  appName: 'VitalPath',
  webDir: 'dist/public',
  server: {
    url: 'https://health-mentor-ai--ikugelman.replit.app',
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1a1a2e',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1a1a2e'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    }
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'VitalPath'
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};
```

### 11.2 Native Features

**Apple Sign In:**
```typescript
import { SignInWithApple } from '@capacitor-community/apple-sign-in';

async function signInWithApple() {
  try {
    const result = await SignInWithApple.authorize({
      clientId: 'com.vitalpath.app',
      scopes: 'email name',
      redirectURI: 'https://health-mentor-ai--ikugelman.replit.app/api/auth/apple',
      state: crypto.randomUUID(),
    });

    // Send identity token to backend for verification
    const response = await fetch('/api/auth/apple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identityToken: result.response.identityToken,
        user: result.response.user,
        email: result.response.email,
        givenName: result.response.givenName,
        familyName: result.response.familyName,
      }),
    });

    // Handle authentication response
  } catch (error) {
    console.error('Apple Sign In failed:', error);
  }
}
```

**Native Sharing:**
```typescript
import { Share } from '@capacitor/share';

async function shareProgress(shareData: ShareData) {
  await Share.share({
    title: 'My VitalPath Progress',
    text: shareData.message,
    url: shareData.url,
  });
}
```

### 11.3 Build Commands

```bash
# Sync web assets to native projects
npm run cap:sync

# Build and sync
npm run cap:build

# Open Xcode for iOS development
npm run cap:ios

# Open Android Studio
npm run cap:android

# Run on iOS simulator
npm run cap:run:ios

# Run on Android emulator
npm run cap:run:android
```

---

## 12. Authentication System

### 12.1 Authentication Methods

**1. Replit OAuth (Primary - Web)**
```typescript
// OAuth flow initiation
app.get("/api/login", async (req, res) => {
  // Generate OAuth URL
  const authUrl = await getOAuthURL();
  res.redirect(authUrl);
});

// OAuth callback
app.get("/api/callback", async (req, res) => {
  const { code } = req.query;

  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code);

  // Get user info
  const userInfo = await getUserInfo(tokens.access_token);

  // Create or update user
  const user = await storage.upsertUser({
    id: userInfo.id,
    email: userInfo.email,
    firstName: userInfo.given_name,
    lastName: userInfo.family_name,
  });

  // Create session
  req.session.userId = user.id;

  res.redirect('/');
});
```

**2. Apple Sign In (Mobile)**
```typescript
// Apple authentication endpoint
app.post("/api/auth/apple", async (req, res) => {
  const { identityToken, user, email, givenName, familyName } = req.body;

  // Verify identity token with Apple's public keys
  const JWKS = jose.createRemoteJWKSet(
    new URL('https://appleid.apple.com/auth/keys')
  );

  const { payload } = await jose.jwtVerify(identityToken, JWKS, {
    issuer: 'https://appleid.apple.com',
    audience: 'com.vitalpath.app',
  });

  // Extract user identifier
  const appleUserId = payload.sub;

  // Create or find user
  const dbUser = await storage.upsertUser({
    id: appleUserId,
    email: email || payload.email,
    firstName: givenName,
    lastName: familyName,
  });

  // Create session
  req.session.userId = dbUser.id;

  res.json({ success: true, user: dbUser });
});
```

### 12.2 Session Management

```typescript
// Session configuration
app.use(session({
  store: new pgSession({
    pool: dbPool,
    tableName: 'sessions',
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
}));
```

### 12.3 Authentication Middleware

```typescript
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session?.userId) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
}

// Protected route example
app.get("/api/profile", isAuthenticated, async (req, res) => {
  const profile = await storage.getProfile(req.session.userId);
  res.json(profile);
});
```

---

## 13. Third-Party Integrations

### 13.1 OpenAI Integration

**Configuration:**
```typescript
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
```

**Usage:**
```typescript
// Chat completion
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage }
  ],
  temperature: 0.7,
  max_tokens: 1000
});

// Structured output (for recommendations)
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [...],
  response_format: { type: "json_object" }
});
```

### 13.2 USDA FoodData Central API

**Endpoint:** `https://api.nal.usda.gov/fdc/v1/foods/search`

**No API key required** for basic searches.

```typescript
async function searchFoods(query: string): Promise<Food[]> {
  const response = await fetch(
    `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=20`
  );

  const data = await response.json();

  return data.foods.map(food => ({
    fdcId: food.fdcId,
    description: food.description,
    nutrients: extractNutrients(food.foodNutrients),
  }));
}

function extractNutrients(foodNutrients: any[]): Nutrients {
  const nutrientMap: Record<number, string> = {
    1008: 'calories',
    1003: 'protein',
    1004: 'fat',
    1005: 'carbs',
    1079: 'fiber',
  };

  const nutrients: Nutrients = {};

  for (const nutrient of foodNutrients) {
    const key = nutrientMap[nutrient.nutrientId];
    if (key) {
      nutrients[key] = nutrient.value;
    }
  }

  return nutrients;
}
```

### 13.3 Apple Authentication Services

**JWKS Verification:**
```typescript
import * as jose from 'jose';

async function verifyAppleToken(identityToken: string): Promise<jose.JWTPayload> {
  const JWKS = jose.createRemoteJWKSet(
    new URL('https://appleid.apple.com/auth/keys')
  );

  const { payload } = await jose.jwtVerify(identityToken, JWKS, {
    issuer: 'https://appleid.apple.com',
    audience: 'com.vitalpath.app',
  });

  return payload;
}
```

---

## 14. Business Logic Modules

### 14.1 Module Overview

| Module | File | Purpose |
|--------|------|---------|
| OpenAI | `openai.ts` | Chat responses, target calculations |
| AI Recommendations | `aiRecommendations.ts` | Profile analysis, suggestions |
| AI Action Parser | `aiActionParser.ts` | Extract profile changes from AI |
| Insights | `insights.ts` | Health pattern detection |
| Daily Guidance | `dailyGuidance.ts` | Proactive coaching messages |
| Phase Transition | `phaseTransition.ts` | Phase management logic |
| Workout Analytics | `workoutAnalytics.ts` | Training statistics |
| Rest Day | `restDayRecommendations.ts` | Recovery recommendations |
| Notifications | `notificationService.ts` | Notification templates |
| Food API | `foodApi.ts` | USDA integration |
| Storage | `storage.ts` | Database operations |

### 14.2 Insights Engine

```typescript
// 8 insight generators
const generators = [
  checkSleepPerformance,      // Sleep → Energy correlation
  checkNutritionRecovery,     // Protein + sleep optimization
  checkStressLevels,          // Stress pattern detection
  checkCalorieDeficit,        // Extended deficit warning
  checkHydration,             // Activity-based hydration
  checkTrainingRecovery,      // Workout + sleep relationship
  checkWeightTrends,          // Weight change analysis
  checkPhaseProgress,         // Phase-specific biofeedback
];

// Insights are prioritized 1-5 (5 = highest)
// Top 5 insights returned to user
```

### 14.3 Phase Transition Logic

```typescript
// Biofeedback score calculation
function calculateBiofeedbackScore(logs: DailyLog[]): number {
  let totalScore = 0;
  let count = 0;

  for (const log of logs) {
    if (log.energyLevel) { totalScore += log.energyLevel; count++; }
    if (log.sleepQuality) { totalScore += log.sleepQuality; count++; }
    if (log.moodRating) { totalScore += log.moodRating; count++; }
    if (log.stressLevel) { totalScore += (11 - log.stressLevel); count++; } // Inverted
  }

  return count > 0 ? totalScore / count : 5;
}

// Transition criteria by phase
// Recovery → Recomp: 8+ weeks && biofeedback ≥ 6.5
// Recomp → Cutting: 12+ weeks && above target weight
// Cutting → Recovery: 8+ weeks && biofeedback < 5
```

### 14.4 Workout Analytics

```typescript
// Muscle group mapping
const muscleGroupMap = {
  "Bench Press": ["chest", "triceps", "shoulders"],
  "Squats": ["quads", "glutes"],
  "Deadlifts": ["hamstrings", "glutes", "back"],
  // ... 40+ exercises mapped
};

// Analytics calculated
interface WorkoutAnalytics {
  summary: {
    totalWorkouts: number;
    workoutsThisWeek: number;
    averageWorkoutsPerWeek: number;
    totalVolumeKg: number;
  };
  weeklyTrends: WeeklyTrend[];
  muscleGroupFrequency: MuscleGroupData[];
  exerciseProgress: ExerciseProgressData[];
  streaks: {
    currentStreak: number;
    longestStreak: number;
  };
}
```

---

## 15. Styling & Design System

### 15.1 Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  darkMode: ['class'],
  content: ['./client/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: { /* ... */ },
        muted: { /* ... */ },
        accent: { /* ... */ },
        destructive: { /* ... */ },
        // Chart colors
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
  ],
};
```

### 15.2 CSS Variables

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark mode overrides */
}
```

### 15.3 Component Variants

```typescript
// Using class-variance-authority
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

---

## 16. Build & Deployment

### 16.1 Development

```bash
# Install dependencies
npm install

# Start development server (Vite + Express)
npm run dev

# Database migrations
npm run db:push

# Type checking
npm run check
```

### 16.2 Production Build

```bash
# Full build
npm run build

# Start production server
npm run start
```

**Build Process (`script/build.ts`):**
1. TypeScript type checking
2. Vite frontend build
3. esbuild backend compilation
4. Output to `dist/` directory

### 16.3 Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:password@host:5432/database
OPENAI_API_KEY=sk-...

# Optional
NODE_ENV=production
PORT=5000
SESSION_SECRET=your-secret-key
```

### 16.4 Database Setup

```bash
# Push schema to database
npm run db:push

# Or with specific URL
DATABASE_URL="postgresql://..." npm run db:push
```

---

## 17. Rebuilding Guide

### 17.1 Prerequisites

- Node.js 20+
- PostgreSQL 15+
- OpenAI API key
- (For mobile) Xcode 15+ / Android Studio

### 17.2 Step-by-Step Setup

**1. Clone & Install**
```bash
git clone <repository>
cd workout
npm install
```

**2. Database Setup**
```bash
# Create PostgreSQL database
createdb vitalpath

# Set environment variable
export DATABASE_URL="postgresql://localhost:5432/vitalpath"

# Push schema
npm run db:push

# Seed initial data (workout templates, educational content)
npm run seed
```

**3. Environment Configuration**
```bash
# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://localhost:5432/vitalpath
OPENAI_API_KEY=sk-your-key-here
SESSION_SECRET=$(openssl rand -hex 32)
NODE_ENV=development
EOF
```

**4. Start Development**
```bash
npm run dev
```

**5. Mobile Setup (Optional)**
```bash
# iOS
npm run cap:ios

# Android
npm run cap:android
```

### 17.3 Key Files to Modify

| Purpose | File |
|---------|------|
| Database URL | `.env` or `server/db.ts` |
| OpenAI Key | `.env` |
| Mobile App ID | `capacitor.config.ts` |
| Server URL (mobile) | `capacitor.config.ts` |
| Auth Configuration | `server/replit_integrations/auth/` |

### 17.4 Testing the Build

1. **Authentication**: Visit `/api/login` or test Apple Sign In on mobile
2. **Onboarding**: Complete the onboarding flow
3. **Daily Logging**: Log weight, nutrition, activity
4. **AI Chat**: Send a message and verify AI response
5. **Workouts**: View templates and log a workout
6. **Insights**: Check dashboard for health insights

### 17.5 Deployment Options

**Option 1: Replit**
- Push to Replit git remote
- Secrets configured in Replit dashboard
- Automatic SSL

**Option 2: Railway/Render**
- Connect GitHub repository
- Set environment variables
- Add PostgreSQL addon

**Option 3: Self-Hosted**
- Deploy Node.js server
- Configure PostgreSQL
- Set up reverse proxy (nginx)
- Configure SSL (Let's Encrypt)

---

## Appendix A: Code Statistics

| Metric | Value |
|--------|-------|
| Total Server Code | ~8,000 lines |
| Total Client Code | ~12,000 lines |
| Database Schema | 801 lines |
| API Endpoints | 80+ |
| Database Tables | 18 |
| React Pages | 14 |
| UI Components | 60+ |
| Workout Templates | 40+ |
| Exercise Mappings | 40+ |

---

## Appendix B: Future Considerations

1. **Wearable Integration**: Complete OAuth flows for Fitbit, Garmin, Oura
2. **Push Notifications**: Implement with Firebase Cloud Messaging
3. **Offline Support**: Service worker for PWA functionality
4. **Photo Progress**: Before/after photo tracking
5. **Community Features**: Forums, challenges, accountability partners
6. **Premium Features**: Subscription tiers with Stripe
7. **Export Formats**: PDF reports, Apple Health integration
8. **Localization**: Multi-language support

---

*Document generated December 22, 2025*
