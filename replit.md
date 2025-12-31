# VitalPath - AI Health Coaching Platform

## Overview

VitalPath is an AI-powered health coaching application designed for adults 40+ focused on body recomposition, metabolic recovery, and sustainable fat loss. The platform combines workout tracking, nutrition logging, progress monitoring, and personalized AI coaching through a single intelligent system that synthesizes all health data.

The application serves as both a web platform and a native mobile app (via Capacitor), connecting users with an AI mentor that adapts recommendations based on sleep, stress, exercise, and nutrition patterns.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: shadcn/ui built on Radix UI primitives with Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **Build Tool**: Vite with path aliases (@/ for client, @shared/ for shared code)

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **AI Integration**: OpenAI API (GPT-4o/GPT-5.2) with Assistants API for persistent memory
- **Authentication**: Replit Auth integration with session-based auth, plus Sign in with Apple for native iOS

### Data Layer
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Auth Models**: `shared/models/auth.ts` for users and sessions tables
- **Migrations**: Managed via drizzle-kit (`npm run db:push`)

### Mobile Architecture
- **Framework**: Capacitor for iOS/Android builds
- **Bundle ID**: com.vitalpath.app
- **Native Features**: Sign in with Apple, HealthKit integration planned
- **Build Output**: `dist/public` serves as webDir for Capacitor

### AI Services Structure
- **Model Configuration**: Centralized in `server/aiModels.ts`
- **Chat/Mentor**: `server/openai.ts` with system prompt in `server/prompts/mentor-system-prompt.ts`
- **Daily Guidance**: `server/dailyGuidance.ts` generates personalized daily plans
- **Action Parser**: `server/aiActionParser.ts` detects AI recommendations and auto-applies profile changes
- **Assistants API**: `server/assistantService.ts` for persistent AI memory per user

### Key Design Patterns
- **MVVM-like Structure**: Pages connect to API via React Query hooks
- **Lazy Loading**: All page components use React.lazy() for code splitting
- **Timezone-Aware**: All date operations use user's timezone from profile
- **Rate Limiting**: In-memory rate limiter for AI endpoints (10 requests/minute)
- **Gamification**: Points system with streaks, milestones, and leaderboards

## External Dependencies

### AI Services
- **OpenAI API**: Primary AI provider for chat, vision (photo food logging), and assistants
- **Models Used**: gpt-5.2 (primary), gpt-4o (fallback), gpt-4o-mini (light tasks)

### Food Data
- **USDA FoodData Central API**: Free food database with 300K+ items for nutrition lookup
- **Barcode Lookup**: OpenFoodFacts integration for product scanning

### Database
- **PostgreSQL**: Primary data store provisioned via Replit
- **Connection**: Via DATABASE_URL environment variable

### Authentication
- **Replit Auth**: Primary web authentication (session-based with express-session)
- **Sign in with Apple**: Native iOS authentication via @capacitor-community/apple-sign-in

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API access
- `SESSION_SECRET`: Express session encryption (for Replit Auth)