import { db, isDatabaseConfigured } from "./db";
import { workoutTemplates, educationalContent, foodDatabase } from "@shared/schema";
import { sql } from "drizzle-orm";

// Workout templates for 40+ adults with phase-specific recommendations
// phases: which phases this workout is recommended for
// phasePriority: 1-10, higher = more recommended for that phase
const workoutData = [
  {
    name: "Full Body Strength A",
    description: "Foundation workout focusing on compound movements with controlled tempo. Perfect for building strength while protecting joints.",
    type: "strength",
    difficulty: "beginner",
    durationMinutes: 45,
    targetAgeGroup: "40+",
    phases: ["recovery", "recomp", "cutting"],
    phasePriority: 8, // Great for all phases
    exercises: [
      { name: "Goblet Squat", sets: 3, reps: "10-12", rir: 3, notes: "Focus on depth and control" },
      { name: "Dumbbell Romanian Deadlift", sets: 3, reps: "10-12", rir: 3, notes: "Hinge at hips, slight knee bend" },
      { name: "Dumbbell Bench Press", sets: 3, reps: "10-12", rir: 3, notes: "Full range of motion" },
      { name: "Cable Row", sets: 3, reps: "10-12", rir: 3, notes: "Squeeze shoulder blades" },
      { name: "Overhead Press", sets: 3, reps: "10-12", rir: 3, notes: "Engage core throughout" },
      { name: "Plank", sets: 3, reps: "30-45 sec", rir: null, notes: "Neutral spine" },
    ],
  },
  {
    name: "Full Body Strength B",
    description: "Complementary workout to Full Body A, targeting similar muscle groups with different movement patterns.",
    type: "strength",
    difficulty: "beginner",
    durationMinutes: 45,
    targetAgeGroup: "40+",
    phases: ["recovery", "recomp", "cutting"],
    phasePriority: 8, // Great for all phases
    exercises: [
      { name: "Leg Press", sets: 3, reps: "10-12", rir: 3, notes: "Controlled descent" },
      { name: "Walking Lunges", sets: 3, reps: "10 each", rir: 3, notes: "Step with control" },
      { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", rir: 3, notes: "30-45 degree angle" },
      { name: "Lat Pulldown", sets: 3, reps: "10-12", rir: 3, notes: "Pull to upper chest" },
      { name: "Face Pulls", sets: 3, reps: "15", rir: 2, notes: "External rotation at top" },
      { name: "Dead Bug", sets: 3, reps: "10 each", rir: null, notes: "Lower back pressed down" },
    ],
  },
  {
    name: "Upper Body Focus",
    description: "Dedicated upper body session for building strength in chest, back, shoulders, and arms.",
    type: "strength",
    difficulty: "intermediate",
    durationMinutes: 50,
    targetAgeGroup: "40+",
    phases: ["recomp", "cutting"],
    phasePriority: 9, // Best for muscle building/maintenance
    exercises: [
      { name: "Barbell Bench Press", sets: 4, reps: "8-10", rir: 2, notes: "Arch back slightly, retract shoulders" },
      { name: "Barbell Row", sets: 4, reps: "8-10", rir: 2, notes: "Torso at 45 degrees" },
      { name: "Dumbbell Shoulder Press", sets: 3, reps: "10-12", rir: 2, notes: "Neutral grip option for shoulders" },
      { name: "Chest Supported Row", sets: 3, reps: "12", rir: 2, notes: "Great for posture" },
      { name: "Tricep Pushdown", sets: 3, reps: "12-15", rir: 2, notes: "Lock elbows" },
      { name: "Hammer Curls", sets: 3, reps: "12-15", rir: 2, notes: "Control the descent" },
    ],
  },
  {
    name: "Lower Body Focus",
    description: "Complete lower body workout emphasizing quad, hamstring, and glute development.",
    type: "strength",
    difficulty: "intermediate",
    durationMinutes: 50,
    targetAgeGroup: "40+",
    phases: ["recomp", "cutting"],
    phasePriority: 9, // Best for muscle building/maintenance
    exercises: [
      { name: "Back Squat", sets: 4, reps: "8-10", rir: 2, notes: "Brace core, sit back" },
      { name: "Romanian Deadlift", sets: 4, reps: "8-10", rir: 2, notes: "Feel hamstring stretch" },
      { name: "Bulgarian Split Squat", sets: 3, reps: "10 each", rir: 2, notes: "Vertical shin" },
      { name: "Leg Curl", sets: 3, reps: "12-15", rir: 2, notes: "Slow eccentric" },
      { name: "Leg Extension", sets: 3, reps: "12-15", rir: 2, notes: "Pause at top" },
      { name: "Standing Calf Raise", sets: 3, reps: "15-20", rir: 2, notes: "Full stretch at bottom" },
    ],
  },
  {
    name: "Low Impact Cardio",
    description: "Joint-friendly cardiovascular session perfect for active recovery or cardio days.",
    type: "cardio",
    difficulty: "beginner",
    durationMinutes: 30,
    targetAgeGroup: "40+",
    phases: ["recovery", "recomp", "cutting"],
    phasePriority: 7, // Good for all phases, especially recovery
    exercises: [
      { name: "Stationary Bike", sets: 1, reps: "10 min", rir: null, notes: "Moderate pace, zone 2" },
      { name: "Elliptical", sets: 1, reps: "10 min", rir: null, notes: "Vary resistance" },
      { name: "Rowing Machine", sets: 1, reps: "10 min", rir: null, notes: "Focus on form" },
    ],
  },
  {
    name: "HIIT Training",
    description: "High-intensity interval training designed for metabolic conditioning and fat loss.",
    type: "cardio",
    difficulty: "intermediate",
    durationMinutes: 25,
    targetAgeGroup: "40+",
    phases: ["recomp", "cutting"],
    phasePriority: 8, // Great for fat loss phases, avoid during recovery
    exercises: [
      { name: "Jumping Jacks", sets: 4, reps: "30 sec on / 30 sec off", rir: null, notes: "Land softly" },
      { name: "Bodyweight Squats", sets: 4, reps: "30 sec on / 30 sec off", rir: null, notes: "Full depth" },
      { name: "Mountain Climbers", sets: 4, reps: "30 sec on / 30 sec off", rir: null, notes: "Modify if needed" },
      { name: "Push-ups", sets: 4, reps: "30 sec on / 30 sec off", rir: null, notes: "Incline option" },
      { name: "High Knees", sets: 4, reps: "30 sec on / 30 sec off", rir: null, notes: "March if impact is issue" },
    ],
  },
  {
    name: "Mobility & Recovery",
    description: "Essential stretching and mobility work for joint health and recovery. Especially important during metabolic recovery phases.",
    type: "recovery",
    difficulty: "beginner",
    durationMinutes: 20,
    targetAgeGroup: "40+",
    phases: ["recovery", "recomp", "cutting"],
    phasePriority: 10, // Top priority during recovery phase
    exercises: [
      { name: "Cat-Cow Stretch", sets: 2, reps: "10 breaths", rir: null, notes: "Slow, controlled" },
      { name: "Hip Flexor Stretch", sets: 2, reps: "60 sec each", rir: null, notes: "Don't arch back" },
      { name: "Thoracic Rotation", sets: 2, reps: "10 each side", rir: null, notes: "Follow hand with eyes" },
      { name: "90/90 Hip Stretch", sets: 2, reps: "60 sec each", rir: null, notes: "Breathe deeply" },
      { name: "World's Greatest Stretch", sets: 2, reps: "5 each side", rir: null, notes: "Hold each position" },
      { name: "Foam Rolling", sets: 1, reps: "5 min", rir: null, notes: "Focus on tight areas" },
    ],
  },
  {
    name: "Yoga Flow",
    description: "Gentle yoga sequence focusing on flexibility, balance, and stress reduction. Perfect for recovery days.",
    type: "recovery",
    difficulty: "beginner",
    durationMinutes: 30,
    targetAgeGroup: "40+",
    phases: ["recovery", "recomp", "cutting"],
    phasePriority: 9, // High priority during recovery phase
    exercises: [
      { name: "Sun Salutation A", sets: 3, reps: "complete flow", rir: null, notes: "Move with breath" },
      { name: "Warrior I & II", sets: 2, reps: "5 breaths each side", rir: null, notes: "Ground through feet" },
      { name: "Triangle Pose", sets: 2, reps: "5 breaths each", rir: null, notes: "Open chest" },
      { name: "Pigeon Pose", sets: 1, reps: "1 min each side", rir: null, notes: "Props if needed" },
      { name: "Seated Forward Fold", sets: 1, reps: "1 min", rir: null, notes: "Bend knees if tight" },
      { name: "Corpse Pose", sets: 1, reps: "5 min", rir: null, notes: "Complete relaxation" },
    ],
  },
  // New phase-specific workouts
  {
    name: "Metabolic Recovery Circuit",
    description: "Light resistance circuit designed for the recovery phase. Maintains muscle while minimizing stress on the body.",
    type: "strength",
    difficulty: "beginner",
    durationMinutes: 30,
    targetAgeGroup: "40+",
    phases: ["recovery"],
    phasePriority: 10, // Top priority for recovery phase
    exercises: [
      { name: "Bodyweight Squat", sets: 2, reps: "12-15", rir: 4, notes: "Focus on form, no added weight" },
      { name: "Wall Push-ups", sets: 2, reps: "12-15", rir: 4, notes: "Progress to incline when ready" },
      { name: "Band Pull-Aparts", sets: 2, reps: "15", rir: 4, notes: "Light resistance" },
      { name: "Glute Bridges", sets: 2, reps: "12-15", rir: 4, notes: "Squeeze at top" },
      { name: "Bird Dogs", sets: 2, reps: "10 each", rir: null, notes: "Core stability focus" },
    ],
  },
  {
    name: "Recomp Power Build",
    description: "Progressive overload focused workout for body recomposition. Build muscle while managing recovery.",
    type: "strength",
    difficulty: "intermediate",
    durationMinutes: 55,
    targetAgeGroup: "40+",
    phases: ["recomp"],
    phasePriority: 10, // Top priority for recomp phase
    exercises: [
      { name: "Trap Bar Deadlift", sets: 4, reps: "6-8", rir: 2, notes: "Great for 40+ backs" },
      { name: "Dumbbell Bench Press", sets: 4, reps: "8-10", rir: 2, notes: "Full range of motion" },
      { name: "Leg Press", sets: 3, reps: "10-12", rir: 2, notes: "Feet high for glutes" },
      { name: "Seated Cable Row", sets: 3, reps: "10-12", rir: 2, notes: "Squeeze at contraction" },
      { name: "Lateral Raises", sets: 3, reps: "12-15", rir: 2, notes: "Control the descent" },
      { name: "EZ Bar Curl", sets: 2, reps: "12-15", rir: 2, notes: "Superset with next" },
      { name: "Overhead Tricep Extension", sets: 2, reps: "12-15", rir: 2, notes: "Superset pair" },
    ],
  },
  {
    name: "Cutting Strength Maintenance",
    description: "Heavy compound movements to maintain muscle during fat loss. Lower volume, higher intensity.",
    type: "strength",
    difficulty: "intermediate",
    durationMinutes: 40,
    targetAgeGroup: "40+",
    phases: ["cutting"],
    phasePriority: 10, // Top priority for cutting phase
    exercises: [
      { name: "Barbell Squat", sets: 3, reps: "5-6", rir: 2, notes: "Heavy but controlled" },
      { name: "Weighted Pull-ups or Lat Pulldown", sets: 3, reps: "6-8", rir: 2, notes: "Full stretch at bottom" },
      { name: "Dumbbell Romanian Deadlift", sets: 3, reps: "8", rir: 2, notes: "Feel hamstring stretch" },
      { name: "Incline Dumbbell Press", sets: 3, reps: "8", rir: 2, notes: "Retract shoulders" },
      { name: "Face Pulls", sets: 2, reps: "15", rir: 2, notes: "Posture health" },
    ],
  },
  {
    name: "Fat Loss Finisher",
    description: "Metabolic conditioning circuit for the cutting phase. Burns calories while preserving muscle.",
    type: "cardio",
    difficulty: "intermediate",
    durationMinutes: 20,
    targetAgeGroup: "40+",
    phases: ["cutting"],
    phasePriority: 9, // High priority for cutting phase
    exercises: [
      { name: "Kettlebell Swings", sets: 4, reps: "15", rir: null, notes: "Hip hinge power" },
      { name: "Battle Ropes", sets: 4, reps: "30 sec", rir: null, notes: "Alternate patterns" },
      { name: "Box Step-Ups", sets: 4, reps: "12 each", rir: null, notes: "Low impact cardio" },
      { name: "Medicine Ball Slams", sets: 4, reps: "10", rir: null, notes: "Full body explosive" },
    ],
  },
];

// Educational content
const educationalData = [
  {
    title: "Understanding Metabolic Adaptation",
    slug: "metabolic-adaptation",
    category: "metabolic_adaptation",
    readTimeMinutes: 8,
    content: `# Understanding Metabolic Adaptation

Metabolic adaptation is your body's natural response to prolonged caloric restriction. When you eat fewer calories over time, your body becomes more efficient at using energy, which can slow down fat loss.

## What Happens During Metabolic Adaptation

When you reduce calories, several things happen:

1. **Reduced NEAT**: Non-exercise activity thermogenesis decreases. You fidget less, move less spontaneously, and burn fewer calories through daily activities.

2. **Hormonal Changes**: Leptin (the satiety hormone) decreases, making you hungrier. Thyroid hormones can decrease, slowing metabolism.

3. **Muscle Loss**: If protein intake or resistance training is inadequate, you may lose muscle mass, which further reduces metabolic rate.

4. **Adaptive Thermogenesis**: Your body actually burns fewer calories digesting food and maintaining body temperature.

## Signs You May Be Metabolically Adapted

- Eating very low calories but not losing weight
- Constantly feeling cold
- Low energy and fatigue
- Loss of menstrual cycle (women)
- Low libido
- Poor workout recovery
- Mood changes and irritability

## How to Recover

The solution is a **reverse diet**—gradually increasing calories back to maintenance levels. This process:

- Restores metabolic rate
- Improves hormone levels
- Increases energy and workout performance
- Sets you up for sustainable fat loss in the future

At VitalPath, if we detect signs of metabolic adaptation, we'll guide you through a recovery phase before attempting further fat loss.`,
  },
  {
    title: "Reverse Dieting: A Complete Guide",
    slug: "reverse-dieting",
    category: "reverse_dieting",
    readTimeMinutes: 10,
    content: `# Reverse Dieting: A Complete Guide

Reverse dieting is the strategic process of gradually increasing calorie intake after a period of caloric restriction. It's essential for metabolic recovery and long-term weight management success.

## Why Reverse Diet?

After dieting, your metabolism has adapted to lower calories. Jumping straight back to higher calories often leads to rapid fat gain because your body isn't ready to handle more food yet.

Reverse dieting helps you:

- Minimize fat gain while increasing calories
- Rebuild metabolic rate gradually
- Improve hormonal health
- Restore energy and gym performance
- Create a sustainable eating pattern

## How to Reverse Diet

### The Process

1. **Establish Starting Point**: Begin with your current calorie intake
2. **Weekly Increases**: Add 50-100 calories per week
3. **Monitor Response**: Track weight, energy, and biofeedback
4. **Adjust as Needed**: Slow down if gaining too fast, speed up if tolerating well

### How Long Does It Take?

Reverse dieting typically takes 8-16 weeks depending on how low your calories were and how long you've been dieting.

### What to Expect

- **Weeks 1-4**: Improved energy, better workouts, possible slight weight increase
- **Weeks 5-8**: Hunger normalizes, metabolism starts recovering
- **Weeks 9-16**: Reaching maintenance calories with minimal fat gain

## Signs Your Reverse Diet Is Working

- Increased energy levels
- Better sleep quality
- Improved workout performance
- More even hunger patterns
- Stable mood
- Return of libido
- For women: return of regular menstrual cycles`,
  },
  {
    title: "RIR Training: Train Smarter, Not Harder",
    slug: "rir-training",
    category: "training",
    readTimeMinutes: 7,
    content: `# RIR Training: Train Smarter, Not Harder

RIR (Reps In Reserve) is a method of rating how hard you're working during strength training. It helps you train at the right intensity for your goals without overtraining.

## What Is RIR?

RIR stands for "Reps In Reserve" — how many more reps you could have done before reaching failure.

- **RIR 0**: Complete failure, couldn't do another rep
- **RIR 1**: Could do 1 more rep
- **RIR 2**: Could do 2 more reps
- **RIR 3**: Could do 3 more reps

## Why Use RIR?

### Better Recovery

Training to failure every set causes excessive fatigue and slows recovery. Most sets should be at RIR 2-3.

### Sustainable Progress

By managing fatigue, you can train more frequently and make consistent progress over time.

### Injury Prevention

Especially important for those 40+, RIR helps you avoid the breakdown in form that happens near failure.

## RIR Guidelines by Goal

### Building Muscle (Hypertrophy)
- Most sets: RIR 2-3
- Final set of exercise: RIR 1-2
- Avoid RIR 0 in most cases

### Building Strength
- Heavy sets: RIR 1-2
- Volume sets: RIR 2-3
- Save failure for testing maxes

### Recovery/Deload
- All sets: RIR 4+
- Focus on movement quality

## How to Gauge RIR

It takes practice. Start by:

1. Occasionally taking sets to true failure (safely) to calibrate
2. Paying attention to bar speed — slower = closer to failure
3. Noticing when form starts to break down
4. Using the "breathing" test — if you can't talk, you're close to failure`,
  },
  {
    title: "Body Recomposition Explained",
    slug: "body-recomposition",
    category: "body_recomposition",
    readTimeMinutes: 9,
    content: `# Body Recomposition Explained

Body recomposition is the process of losing fat while simultaneously building muscle. It's often considered the holy grail of fitness, and it's very achievable—especially for certain groups.

## Who Can Recomp?

Body recomposition works best for:

1. **Beginners**: New to strength training (newbie gains)
2. **Detrained individuals**: Returning after a break (muscle memory)
3. **Those with higher body fat**: More energy reserves available
4. **People recovering from a diet**: Metabolic restoration + training stimulus

## How Recomp Works

During recomposition, you're in a slight caloric deficit or at maintenance, but because you're training hard and eating enough protein:

- Fat cells release energy
- Muscle cells use that energy + protein to grow
- Net result: The scale may stay similar, but body composition improves

## Keys to Successful Recomposition

### 1. High Protein Intake
Aim for 1.6-2.2g per kg of body weight. This is the most critical factor.

### 2. Resistance Training
Progressive overload with weights 3-4 times per week minimum.

### 3. Small Deficit or Maintenance Calories
A 10-15% calorie deficit, or eating at maintenance if you're new to training.

### 4. Prioritize Sleep
7-9 hours nightly. Growth hormone is released during sleep.

### 5. Be Patient
Recomposition is slower than either pure fat loss or pure muscle gain. It's a marathon, not a sprint.

## Tracking Progress During Recomp

**Don't rely solely on the scale!** 

Use these methods:
- Progress photos (same lighting, same time of day)
- Body measurements (waist, hips, arms, thighs)
- Strength progression in the gym
- How clothes fit
- How you feel and look in the mirror`,
  },
  {
    title: "Cortisol & Weight Loss: The Stress Connection",
    slug: "cortisol-stress",
    category: "cortisol",
    readTimeMinutes: 8,
    content: `# Cortisol & Weight Loss: The Stress Connection

Cortisol is often called the "stress hormone." While it's essential for survival, chronically elevated cortisol can sabotage your body composition goals.

## What Is Cortisol?

Cortisol is released by your adrenal glands in response to stress. It has many important functions:

- Regulating blood sugar
- Controlling inflammation
- Managing the sleep-wake cycle
- Helping the body use macronutrients

## The Problem: Chronic Stress

When stress is constant—from work, poor sleep, over-exercising, or undereating—cortisol stays elevated. This leads to:

### Weight Gain (Especially Around the Middle)
High cortisol promotes fat storage, particularly visceral fat around organs.

### Muscle Loss
Cortisol is catabolic—it breaks down muscle tissue for energy.

### Water Retention
Elevated cortisol causes the body to hold onto water, masking fat loss on the scale.

### Increased Appetite
Cortisol drives cravings for high-calorie, high-carb foods.

## Managing Cortisol for Better Results

### Sleep
- 7-9 hours per night
- Consistent sleep and wake times
- Dark, cool room

### Exercise (But Not Too Much)
- Avoid excessive cardio
- Keep intense sessions to 45-60 minutes
- Include recovery days

### Nutrition
- Don't under-eat for extended periods
- Include carbs, especially around workouts
- Avoid excessive caffeine

### Stress Management
- Daily relaxation practice (even 10 minutes)
- Time in nature
- Social connection
- Limiting news/social media consumption

### Strategic Diet Breaks
- If you've been dieting for months, take a break at maintenance
- This helps normalize cortisol and other hormones`,
  },
  {
    title: "Protein: How Much Do You Really Need?",
    slug: "protein-needs",
    category: "nutrition",
    readTimeMinutes: 6,
    content: `# Protein: How Much Do You Really Need?

Protein is the most important macronutrient for body composition. Here's everything you need to know about protein intake for health and performance.

## Why Protein Matters

1. **Muscle Building & Preservation**: Essential for muscle protein synthesis
2. **Satiety**: Most filling macronutrient, helps control hunger
3. **Thermic Effect**: Burns more calories during digestion than carbs or fats
4. **Recovery**: Repairs tissue damage from exercise
5. **Aging**: Helps prevent sarcopenia (age-related muscle loss)

## How Much Protein?

### General Recommendations

- **Sedentary adults**: 0.8-1.0g per kg body weight
- **Active adults (recreational exercise)**: 1.2-1.6g per kg
- **Active adults building muscle**: 1.6-2.2g per kg
- **Athletes in caloric deficit**: 2.0-2.4g per kg
- **Adults 40+**: Toward the higher end of recommendations (decreased muscle protein synthesis response)

### Example Calculations

For a 75kg (165lb) active adult aiming for muscle building:
- Minimum: 75 × 1.6 = 120g protein daily
- Maximum: 75 × 2.2 = 165g protein daily

## Best Protein Sources

### Complete Proteins (All Essential Amino Acids)
- Chicken breast
- Fish (salmon, tuna, cod)
- Eggs
- Greek yogurt
- Whey protein
- Beef

### Plant Sources (Combine for Complete Amino Acids)
- Tofu & tempeh
- Legumes (beans, lentils)
- Quinoa
- Hemp seeds

## Protein Timing

While total daily intake matters most, spreading protein across meals helps:

- Aim for 25-40g per meal
- Include protein at breakfast (often under-consumed)
- Post-workout protein helps, but total daily intake is more important

## Sample Day Hitting 140g Protein

**Breakfast**: Greek yogurt with nuts = ~25g protein
**Lunch**: Chicken salad = ~40g protein
**Snack**: Protein shake = ~25g protein
**Dinner**: Salmon with vegetables = ~35g protein

**Total**: ~135g protein`,
  },
];

// Common food database
const foodDatabaseData = [
  // Proteins
  { name: "Chicken Breast (raw)", servingSize: "100g", calories: 120, proteinGrams: 23, carbsGrams: 0, fatGrams: 2.6, fiberGrams: 0, category: "protein" },
  { name: "Chicken Breast (cooked)", servingSize: "100g", calories: 165, proteinGrams: 31, carbsGrams: 0, fatGrams: 3.6, fiberGrams: 0, category: "protein" },
  { name: "Salmon (cooked)", servingSize: "100g", calories: 208, proteinGrams: 20, carbsGrams: 0, fatGrams: 13, fiberGrams: 0, category: "protein" },
  { name: "Tuna (canned in water)", servingSize: "100g", calories: 116, proteinGrams: 26, carbsGrams: 0, fatGrams: 0.8, fiberGrams: 0, category: "protein" },
  { name: "Ground Beef (90% lean)", servingSize: "100g", calories: 176, proteinGrams: 20, carbsGrams: 0, fatGrams: 10, fiberGrams: 0, category: "protein" },
  { name: "Egg (whole)", servingSize: "1 large (50g)", calories: 72, proteinGrams: 6, carbsGrams: 0.4, fatGrams: 5, fiberGrams: 0, category: "protein" },
  { name: "Egg White", servingSize: "1 large", calories: 17, proteinGrams: 3.6, carbsGrams: 0.2, fatGrams: 0, fiberGrams: 0, category: "protein" },
  { name: "Greek Yogurt (0% fat)", servingSize: "150g", calories: 88, proteinGrams: 15, carbsGrams: 5, fatGrams: 0, fiberGrams: 0, category: "protein" },
  { name: "Greek Yogurt (2% fat)", servingSize: "150g", calories: 100, proteinGrams: 17, carbsGrams: 6, fatGrams: 2, fiberGrams: 0, category: "protein" },
  { name: "Cottage Cheese (2%)", servingSize: "100g", calories: 84, proteinGrams: 11, carbsGrams: 4, fatGrams: 2.3, fiberGrams: 0, category: "protein" },
  { name: "Whey Protein Powder", servingSize: "1 scoop (30g)", calories: 120, proteinGrams: 24, carbsGrams: 2, fatGrams: 1, fiberGrams: 0, category: "protein" },
  { name: "Tofu (firm)", servingSize: "100g", calories: 76, proteinGrams: 8, carbsGrams: 2, fatGrams: 4.8, fiberGrams: 0.3, category: "protein" },
  { name: "Shrimp (cooked)", servingSize: "100g", calories: 99, proteinGrams: 24, carbsGrams: 0.2, fatGrams: 0.3, fiberGrams: 0, category: "protein" },
  { name: "Turkey Breast (cooked)", servingSize: "100g", calories: 135, proteinGrams: 30, carbsGrams: 0, fatGrams: 0.7, fiberGrams: 0, category: "protein" },

  // Carbohydrates
  { name: "White Rice (cooked)", servingSize: "100g", calories: 130, proteinGrams: 2.7, carbsGrams: 28, fatGrams: 0.3, fiberGrams: 0.4, category: "carbs" },
  { name: "Brown Rice (cooked)", servingSize: "100g", calories: 111, proteinGrams: 2.6, carbsGrams: 23, fatGrams: 0.9, fiberGrams: 1.8, category: "carbs" },
  { name: "Oatmeal (dry)", servingSize: "40g", calories: 152, proteinGrams: 5.3, carbsGrams: 27, fatGrams: 2.7, fiberGrams: 4, category: "carbs" },
  { name: "Sweet Potato (cooked)", servingSize: "100g", calories: 86, proteinGrams: 1.6, carbsGrams: 20, fatGrams: 0.1, fiberGrams: 3, category: "carbs" },
  { name: "White Potato (cooked)", servingSize: "100g", calories: 77, proteinGrams: 2, carbsGrams: 17, fatGrams: 0.1, fiberGrams: 2.2, category: "carbs" },
  { name: "Pasta (cooked)", servingSize: "100g", calories: 131, proteinGrams: 5, carbsGrams: 25, fatGrams: 1.1, fiberGrams: 1.8, category: "carbs" },
  { name: "Whole Wheat Bread", servingSize: "1 slice (40g)", calories: 92, proteinGrams: 4, carbsGrams: 17, fatGrams: 1.5, fiberGrams: 2, category: "carbs" },
  { name: "Banana", servingSize: "1 medium (118g)", calories: 105, proteinGrams: 1.3, carbsGrams: 27, fatGrams: 0.4, fiberGrams: 3.1, category: "carbs" },
  { name: "Apple", servingSize: "1 medium (182g)", calories: 95, proteinGrams: 0.5, carbsGrams: 25, fatGrams: 0.3, fiberGrams: 4.4, category: "carbs" },
  { name: "Quinoa (cooked)", servingSize: "100g", calories: 120, proteinGrams: 4.4, carbsGrams: 21, fatGrams: 1.9, fiberGrams: 2.8, category: "carbs" },
  { name: "Blueberries", servingSize: "100g", calories: 57, proteinGrams: 0.7, carbsGrams: 14, fatGrams: 0.3, fiberGrams: 2.4, category: "carbs" },
  { name: "Orange", servingSize: "1 medium (131g)", calories: 62, proteinGrams: 1.2, carbsGrams: 15, fatGrams: 0.2, fiberGrams: 3.1, category: "carbs" },

  // Fats
  { name: "Avocado", servingSize: "1/2 medium (68g)", calories: 114, proteinGrams: 1.3, carbsGrams: 6, fatGrams: 10.5, fiberGrams: 4.6, category: "fats" },
  { name: "Olive Oil", servingSize: "1 tbsp (14g)", calories: 119, proteinGrams: 0, carbsGrams: 0, fatGrams: 13.5, fiberGrams: 0, category: "fats" },
  { name: "Almonds", servingSize: "28g (1 oz)", calories: 164, proteinGrams: 6, carbsGrams: 6, fatGrams: 14, fiberGrams: 3.5, category: "fats" },
  { name: "Peanut Butter", servingSize: "2 tbsp (32g)", calories: 188, proteinGrams: 8, carbsGrams: 6, fatGrams: 16, fiberGrams: 1.9, category: "fats" },
  { name: "Walnuts", servingSize: "28g (1 oz)", calories: 185, proteinGrams: 4.3, carbsGrams: 4, fatGrams: 18.5, fiberGrams: 1.9, category: "fats" },
  { name: "Chia Seeds", servingSize: "28g (1 oz)", calories: 138, proteinGrams: 4.7, carbsGrams: 12, fatGrams: 8.7, fiberGrams: 9.8, category: "fats" },
  { name: "Cheese (Cheddar)", servingSize: "28g", calories: 113, proteinGrams: 7, carbsGrams: 0.4, fatGrams: 9.3, fiberGrams: 0, category: "fats" },
  { name: "Dark Chocolate (70%)", servingSize: "28g", calories: 170, proteinGrams: 2.2, carbsGrams: 13, fatGrams: 12, fiberGrams: 3, category: "fats" },
  { name: "Coconut Oil", servingSize: "1 tbsp (14g)", calories: 121, proteinGrams: 0, carbsGrams: 0, fatGrams: 13.5, fiberGrams: 0, category: "fats" },
  { name: "Flaxseed", servingSize: "1 tbsp (10g)", calories: 55, proteinGrams: 1.9, carbsGrams: 3, fatGrams: 4.3, fiberGrams: 2.8, category: "fats" },

  // Vegetables
  { name: "Broccoli (cooked)", servingSize: "100g", calories: 35, proteinGrams: 2.4, carbsGrams: 7, fatGrams: 0.4, fiberGrams: 3.3, category: "vegetables" },
  { name: "Spinach (raw)", servingSize: "100g", calories: 23, proteinGrams: 2.9, carbsGrams: 3.6, fatGrams: 0.4, fiberGrams: 2.2, category: "vegetables" },
  { name: "Asparagus (cooked)", servingSize: "100g", calories: 22, proteinGrams: 2.4, carbsGrams: 4, fatGrams: 0.2, fiberGrams: 2, category: "vegetables" },
  { name: "Green Beans (cooked)", servingSize: "100g", calories: 35, proteinGrams: 1.9, carbsGrams: 8, fatGrams: 0.1, fiberGrams: 3.4, category: "vegetables" },
  { name: "Bell Pepper (raw)", servingSize: "1 medium (119g)", calories: 31, proteinGrams: 1, carbsGrams: 6, fatGrams: 0.3, fiberGrams: 2.1, category: "vegetables" },
  { name: "Cucumber (raw)", servingSize: "100g", calories: 16, proteinGrams: 0.7, carbsGrams: 3.6, fatGrams: 0.1, fiberGrams: 0.5, category: "vegetables" },
  { name: "Tomato (raw)", servingSize: "1 medium (123g)", calories: 22, proteinGrams: 1.1, carbsGrams: 4.8, fatGrams: 0.2, fiberGrams: 1.5, category: "vegetables" },
  { name: "Carrots (raw)", servingSize: "100g", calories: 41, proteinGrams: 0.9, carbsGrams: 10, fatGrams: 0.2, fiberGrams: 2.8, category: "vegetables" },
  { name: "Zucchini (cooked)", servingSize: "100g", calories: 17, proteinGrams: 1.2, carbsGrams: 3.1, fatGrams: 0.3, fiberGrams: 1, category: "vegetables" },
  { name: "Cauliflower (cooked)", servingSize: "100g", calories: 23, proteinGrams: 1.8, carbsGrams: 4.1, fatGrams: 0.5, fiberGrams: 2.3, category: "vegetables" },
];

export async function seedDatabase() {
  // Skip seeding if database is not configured
  if (!isDatabaseConfigured()) {
    console.log("DATABASE_URL not set, skipping database seeding");
    return;
  }

  console.log("Seeding database...");

  try {
    // Check if data already exists
    const existingWorkouts = await db.select().from(workoutTemplates).limit(1);
    const existingContent = await db.select().from(educationalContent).limit(1);
    
    if (existingWorkouts.length === 0) {
      console.log("Seeding workout templates...");
      await db.insert(workoutTemplates).values(workoutData);
      console.log(`Inserted ${workoutData.length} workout templates`);
    } else {
      console.log("Workout templates already exist, skipping...");
    }

    if (existingContent.length === 0) {
      console.log("Seeding educational content...");
      await db.insert(educationalContent).values(educationalData);
      console.log(`Inserted ${educationalData.length} educational articles`);
    } else {
      console.log("Educational content already exists, skipping...");
    }

    // Check for food database table and seed it
    const existingFoods = await db.select().from(foodDatabase).limit(1);
    if (existingFoods.length === 0) {
      console.log("Seeding food database...");
      await db.insert(foodDatabase).values(foodDatabaseData);
      console.log(`Inserted ${foodDatabaseData.length} food items`);
    } else {
      console.log("Food database already exists, skipping...");
    }

    console.log("Database seeding complete!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
