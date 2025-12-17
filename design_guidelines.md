# Design Guidelines: Holistic Health Mentor App

## Design Approach

**System**: Material Design 3 with health/wellness optimizations
**Rationale**: Provides robust data visualization components, accessibility features crucial for 40+ users, and established patterns for complex dashboards while maintaining a modern, trustworthy aesthetic.

## Core Design Principles

1. **Clarity First**: Prioritize readability and data comprehension over decoration
2. **Empathetic Interface**: Warm, approachable design that reduces anxiety around health tracking
3. **Progressive Disclosure**: Don't overwhelm - reveal complexity as needed
4. **Trust Through Consistency**: Predictable patterns build confidence in the coaching process

## Typography

**Font Family**: Inter (via Google Fonts CDN) for excellent readability at all sizes
- **Headings (H1)**: 32px, weight 700 - Dashboard titles, phase headers
- **Headings (H2)**: 24px, weight 600 - Section titles, card headers  
- **Headings (H3)**: 18px, weight 600 - Subsections, metric labels
- **Body Large**: 16px, weight 400, line-height 1.6 - Primary content, chat messages
- **Body Regular**: 14px, weight 400, line-height 1.5 - Secondary text, descriptions
- **Caption/Labels**: 12px, weight 500 - Form labels, chart annotations, timestamps
- **Data Display**: 28px, weight 700 - Large metric numbers (weight, calories)

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16** (e.g., p-4, gap-8, mb-12)
- Component padding: p-6 or p-8
- Section spacing: mb-12 or mb-16
- Card gaps: gap-6
- Form field spacing: space-y-4
- Tight spacing for related items: gap-2

**Container Strategy**:
- Max-width: max-w-7xl for main content areas
- Dashboard grid: 12-column responsive grid
- Mobile-first breakpoints: stack to single column below md:

## Component Library

### Navigation
- **Top Header**: Fixed, minimal height with app logo, user profile dropdown, notification bell
- **Side Navigation** (desktop): Persistent sidebar with icons + labels for Dashboard, Progress, Nutrition, Workouts, Chat, Settings
- **Bottom Tab Bar** (mobile): 5 primary navigation items with icons

### Dashboard Cards
- Rounded corners (rounded-lg)
- Elevation with subtle shadow
- Header with icon + title + optional action button
- Body with key metrics or visualizations
- Footer for "View Details" links when applicable

### Data Entry Forms
- **Input Fields**: Full-width, generous padding (p-3), clear labels above inputs
- **Number Steppers**: For weight, calories with +/- buttons
- **Date Pickers**: Native date inputs with calendar icon
- **Sliders**: For subjective ratings (energy 1-10, sleep quality 1-10) with visible value display
- **Quick Add Buttons**: Frequently logged foods as tappable chips

### Progress Tracking
- **Line Charts**: Weight trends, calorie intake over 7/30/90 days with smooth curves
- **Bar Charts**: Weekly workout completion, daily step counts
- **Radial Progress**: Macro targets (protein, carbs, fats) as circular gauges
- **Trend Indicators**: Up/down arrows with percentage changes

### AI Chat Interface
- **Message Bubbles**: User messages aligned right, AI responses aligned left
- **Avatar Icons**: Small circular avatars (AI mentor icon vs user initial)
- **Typing Indicator**: Animated dots when AI is responding
- **Quick Replies**: Suggested response chips below AI messages
- **Input Bar**: Sticky bottom with text area + send button

### Data Display
- **Metric Cards**: Large number at top, label below, subtle trend indicator
- **Timeline View**: Vertical timeline for phase transitions with milestone markers
- **Comparison Tables**: Side-by-side macro targets vs actual intake
- **Badge System**: Achievement badges for streaks, milestones

### Onboarding Flow
- **Multi-step Progress Bar**: Clear indication of completion (Step 3 of 7)
- **Large Form Fields**: Easy to tap/click for older users
- **Section Headers**: Clear categorization of questions
- **Save & Continue**: Prominent primary button, subtle "Save for Later" secondary

### Wearable Connections
- **Integration Cards**: Device logo, connection status, "Connect" or "Disconnect" actions
- **Sync Status**: Last synced timestamp with refresh button
- **Data Source Indicators**: Small badges showing data origin (manual entry vs synced)

## Animations

**Minimal & Purposeful Only**:
- Page transitions: Simple fade (150ms)
- Chart reveals: Gentle draw-in on load (300ms ease-out)
- Success states: Subtle scale bounce on form submission
- **No**: Parallax, continuous animations, decorative motion

## Images

**Hero Section** (Landing/Marketing):
- Full-width hero with inspiring health/fitness imagery showing 40+ individuals exercising or healthy lifestyle
- Image should convey energy, strength, and positivity
- Overlay with semi-transparent gradient for text readability

**Dashboard/App**:
- Avatar placeholders for user profile
- Icon-based navigation (no decorative images in functional areas)
- Achievement badge illustrations
- Optional: Motivational imagery in empty states ("Start your first workout!")

## Accessibility Essentials

- Minimum touch targets: 44x44px (especially critical for 40+ users)
- High contrast ratios for all text (WCAG AA minimum)
- Clear focus states on all interactive elements
- Form validation with inline error messages below fields
- Generous line spacing for readability (1.5-1.6 for body text)

## Key Screen Layouts

**Dashboard**: 3-column grid (lg:) → 2-column (md:) → 1-column (mobile) with priority metrics at top
**Progress**: Full-width chart area with filter controls above, metric cards in grid below
**Nutrition Calculator**: 2-column split - calculator inputs left, macro breakdown visualization right
**Chat**: Full-height conversation area with persistent input at bottom
**Data Entry**: Single-column centered form (max-w-2xl) with logical grouping and clear CTAs