import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Clock, Search, ChevronLeft, ArrowRight } from "lucide-react";
import type { EducationalContent } from "@shared/schema";

const defaultContent: EducationalContent[] = [
  {
    id: "1",
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
    createdAt: new Date(),
  },
  {
    id: "2",
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
- Restore metabolic rate
- Improve energy and performance
- Establish a higher maintenance baseline
- Prepare for future successful fat loss phases

## How to Reverse Diet

### Step 1: Establish Your Current Intake
Know exactly what you're eating now. This is your starting point.

### Step 2: Increase Gradually
Add 50-100 calories per week. This is typically done through adding carbohydrates or fats (protein should already be adequate).

### Step 3: Monitor Progress
Track:
- Weekly average weight
- Biofeedback (energy, sleep, mood)
- Workout performance
- Hunger levels

### Step 4: Adjust Based on Response
- If weight is stable: continue adding calories
- If weight increases significantly: hold current calories for a week
- If biofeedback improves: great sign of metabolic recovery

### Step 5: Find Your New Maintenance
When you can no longer add calories without gaining, you've found your maintenance. This might be 200-500+ calories higher than when you started!

## What to Expect

The scale may go up initially due to:
- Increased glycogen storage (each gram of glycogen binds 3-4g of water)
- More food in your digestive system
- Reduced stress hormones allowing water release

This is NOT fat gain. Trust the process.

## Psychological Challenges

Reverse dieting can be mentally challenging, especially if you've been restricting for a long time. Common fears:

- "I'll get fat if I eat more"
- "The scale is going up—I should stop"
- "Maybe I don't need to do this"

Remember: A healthy metabolism is essential for long-term success. Short-term scale fluctuations are normal and expected.`,
    createdAt: new Date(),
  },
  {
    id: "3",
    title: "RIR: Training with Reps in Reserve",
    slug: "rir-training",
    category: "rir",
    readTimeMinutes: 6,
    content: `# RIR: Training with Reps in Reserve

RIR (Reps in Reserve) is a method of regulating exercise intensity based on how many reps you could still perform before reaching failure.

## Understanding RIR

- **RIR 0**: Muscular failure—you cannot complete another rep
- **RIR 1**: One more rep possible
- **RIR 2**: Two more reps possible
- **RIR 3**: Three more reps possible

## Why RIR Matters for 40+ Training

As we age, recovery becomes more important. Training to failure (RIR 0) on every set:

- Increases injury risk
- Requires longer recovery
- Can lead to joint issues
- May cause overtraining

Training with RIR 2-3 on most sets allows you to:
- Build muscle effectively
- Recover adequately between sessions
- Reduce injury risk
- Train consistently for years

## How to Gauge RIR

Learning to accurately estimate RIR takes practice. Tips:

1. **Pay attention to bar speed**: When the bar slows significantly, you're getting close to failure
2. **Notice breathing**: Heavy, desperate breathing indicates fewer reps left
3. **Feel the burn**: Intense muscular burning typically means RIR 1-2
4. **Practice**: Occasionally take sets to failure to calibrate your sense

## Recommended RIR by Exercise Type

- **Compound lifts** (squats, deadlifts): RIR 2-3 for safety
- **Isolation exercises** (curls, extensions): RIR 1-2 acceptable
- **Recovery/Deload weeks**: RIR 4-5

## Progressive Overload with RIR

You can still progress while leaving reps in reserve:

Week 1: 100lbs x 10 reps @ RIR 3
Week 2: 100lbs x 11 reps @ RIR 3
Week 3: 100lbs x 12 reps @ RIR 3
Week 4: 105lbs x 10 reps @ RIR 3

The key is consistent effort and gradual progression.`,
    createdAt: new Date(),
  },
  {
    id: "4",
    title: "Body Recomposition After 40",
    slug: "body-recomposition",
    category: "body_recomposition",
    readTimeMinutes: 12,
    content: `# Body Recomposition After 40

Body recomposition—simultaneously losing fat and building muscle—is absolutely possible after 40. Here's how to do it right.

## Is Recomp Realistic After 40?

Yes! Research shows that older adults can effectively build muscle and lose fat, especially if:

- You're relatively new to resistance training
- You've taken a long break from training
- You have excess body fat to lose
- You're coming off a period of high stress or poor nutrition

## The Three Pillars of Recomposition

### 1. Resistance Training
This is non-negotiable. You must provide a stimulus for your muscles to grow.

- Train 3-4 days per week
- Focus on compound movements
- Progressive overload over time
- Adequate recovery between sessions

### 2. Adequate Protein
Protein is crucial for muscle preservation and growth.

- Aim for 1.6-2.2g per kg of body weight
- Spread intake across meals (30-40g per meal)
- Include protein at every meal
- Quality sources: lean meats, fish, eggs, dairy, legumes

### 3. Moderate Caloric Deficit
For recomp, you need a small to moderate deficit:

- 10-20% below maintenance
- Too aggressive = muscle loss
- Too small = slow progress

## Realistic Expectations

Body recomposition is slower than focused cutting or bulking. Expect:

- 0.25-0.5 kg fat loss per week
- 0.1-0.25 kg muscle gain per week (beginners may see more)
- Scale may not change much (muscle replaces fat)
- Measurements and photos show progress better than weight

## Tracking Progress

Don't rely only on the scale. Track:

- Waist circumference (should decrease)
- Strength in the gym (should increase)
- How clothes fit
- Progress photos
- Energy levels

## Special Considerations for 40+

- **Recovery**: Allow 48-72 hours between training same muscles
- **Sleep**: Prioritize 7-8 hours for optimal hormone function
- **Stress management**: High cortisol impairs recomp
- **Warm-up**: Spend 10 minutes warming up joints and muscles
- **Listen to your body**: Skip exercises that cause pain

## When to Shift Strategies

Recomp works well for:
- Beginners
- Returning trainees
- Those with moderate body fat

Consider focused cutting or building if:
- You're an advanced trainee
- You have specific physique goals
- Progress has stalled for 8+ weeks`,
    createdAt: new Date(),
  },
  {
    id: "5",
    title: "Managing Cortisol for Fat Loss",
    slug: "cortisol-management",
    category: "cortisol",
    readTimeMinutes: 7,
    content: `# Managing Cortisol for Fat Loss

Cortisol is often called the "stress hormone." While it's essential for survival, chronically elevated cortisol can sabotage your fat loss efforts.

## How Cortisol Affects Your Body

Cortisol serves important functions:
- Regulates blood sugar
- Controls inflammation
- Manages stress response
- Influences sleep-wake cycles

However, when chronically elevated:
- Promotes fat storage, especially belly fat
- Breaks down muscle tissue
- Increases water retention
- Disrupts sleep
- Increases hunger and cravings

## Signs of High Cortisol

- Weight gain around the midsection
- Poor sleep or waking at 2-4 AM
- Constant fatigue but feeling "wired"
- Difficulty recovering from workouts
- Frequent illness
- Mood swings or anxiety
- Cravings for sugar or salt

## What Raises Cortisol

- Caloric restriction (especially severe)
- Overtraining
- Poor sleep
- Work stress
- Relationship stress
- Excessive caffeine
- Chronic inflammation

## Strategies to Lower Cortisol

### 1. Sleep Optimization
- Aim for 7-9 hours
- Consistent sleep/wake times
- Dark, cool bedroom
- Limit screens before bed

### 2. Strategic Nutrition
- Avoid extreme caloric deficits
- Include carbs, especially around workouts
- Adequate protein for recovery
- Consider evening carbs for sleep

### 3. Training Smart
- Don't overtrain
- Include rest days
- Balance intense sessions with recovery work
- Consider deload weeks

### 4. Stress Management
- Daily walks in nature
- Breathing exercises
- Meditation or yoga
- Social connection
- Limiting news/social media

### 5. Limit Stimulants
- Reduce caffeine after noon
- Be aware of hidden caffeine sources
- Consider cycling off caffeine periodically

## When Cortisol Impacts Fat Loss

If you're doing everything "right" but not seeing progress, consider:

- Taking a diet break (eating at maintenance for 1-2 weeks)
- Reducing training volume
- Prioritizing sleep
- Addressing life stressors

Sometimes the best thing for fat loss is reducing stress, not eating less or exercising more.`,
    createdAt: new Date(),
  },
  {
    id: "6",
    title: "Protein Needs for Adults 40+",
    slug: "protein-needs",
    category: "nutrition",
    readTimeMinutes: 8,
    content: `# Protein Needs for Adults 40+

As we age, protein becomes even more important for maintaining muscle mass, supporting recovery, and overall health.

## Why Protein Matters More After 40

### Anabolic Resistance
As we age, our muscles become less responsive to protein. This means:
- You need MORE protein to achieve the same muscle-building effect
- Protein timing becomes more important
- Quality of protein sources matters

### Muscle Loss Prevention
Without adequate protein and resistance training, adults lose 3-8% of muscle mass per decade after 30. This leads to:
- Decreased metabolism
- Reduced strength
- Higher injury risk
- Lower quality of life

## How Much Protein Do You Need?

Research suggests adults 40+ should aim for:

**Minimum**: 1.2g per kg of body weight
**Optimal for active individuals**: 1.6-2.2g per kg of body weight

For a 80kg person, this means 128-176g of protein daily.

## Protein Distribution

Don't save all your protein for one meal. Research shows benefits from:

- 30-40g of protein per meal
- 3-4 protein-containing meals per day
- At least 20g at breakfast (often neglected)

## Best Protein Sources

### Complete Proteins (all essential amino acids)
- Eggs
- Poultry
- Fish and seafood
- Beef and pork
- Dairy products
- Soy products

### Leucine Content Matters
Leucine is the amino acid that triggers muscle protein synthesis. High-leucine foods:
- Whey protein
- Eggs
- Chicken breast
- Greek yogurt
- Lean beef

## Practical Tips

1. **Start breakfast with protein**: Eggs, Greek yogurt, or a protein shake
2. **Include protein at every meal**: Palm-sized portion of protein source
3. **Use protein supplements strategically**: Convenient for reaching targets
4. **Don't fear whole eggs**: The yolk contains nutrients that support health
5. **Variety matters**: Different sources provide different nutrients

## Protein and Kidney Health

Concern: "Won't high protein damage my kidneys?"

Research shows that high protein intake is safe for healthy individuals. However, those with existing kidney disease should consult their doctor.

## Sample Day of Eating

**Breakfast**: 3 eggs, Greek yogurt = ~35g protein
**Lunch**: Chicken salad = ~40g protein
**Snack**: Protein shake = ~25g protein
**Dinner**: Salmon with vegetables = ~35g protein

**Total**: ~135g protein`,
    createdAt: new Date(),
  },
];

function ArticleCard({ article, onClick }: { article: EducationalContent; onClick: () => void }) {
  const categoryColors: Record<string, string> = {
    metabolic_adaptation: "bg-chart-1/10 text-chart-1",
    reverse_dieting: "bg-chart-2/10 text-chart-2",
    rir: "bg-chart-3/10 text-chart-3",
    body_recomposition: "bg-chart-4/10 text-chart-4",
    cortisol: "bg-chart-5/10 text-chart-5",
    nutrition: "bg-primary/10 text-primary",
    training: "bg-secondary-foreground/10 text-secondary-foreground",
  };

  const categoryLabels: Record<string, string> = {
    metabolic_adaptation: "Metabolism",
    reverse_dieting: "Reverse Dieting",
    rir: "Training",
    body_recomposition: "Recomposition",
    cortisol: "Recovery",
    nutrition: "Nutrition",
    training: "Training",
  };

  return (
    <Card className="hover-elevate cursor-pointer" onClick={onClick}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <Badge className={categoryColors[article.category] || "bg-muted"} variant="secondary">
            {categoryLabels[article.category] || article.category}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {article.readTimeMinutes} min read
          </div>
        </div>
        <CardTitle className="text-lg mt-2" data-testid={`text-article-${article.id}`}>{article.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="ghost" className="p-0 h-auto text-primary">
          Read Article
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

function ArticleDetail({ article, onBack }: { article: EducationalContent; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2" data-testid="button-back">
        <ChevronLeft className="h-4 w-4" />
        Back to Articles
      </Button>

      <div>
        <div className="flex items-center gap-3 mb-2">
          <Badge variant="secondary">{article.category.replace("_", " ")}</Badge>
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {article.readTimeMinutes} min read
          </span>
        </div>
        <h1 className="text-3xl font-bold">{article.title}</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ScrollArea className="h-[60vh]">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {article.content.split("\n").map((line, i) => {
                if (line.startsWith("# ")) {
                  return null;
                }
                if (line.startsWith("## ")) {
                  return <h2 key={i} className="text-xl font-semibold mt-6 mb-3">{line.replace("## ", "")}</h2>;
                }
                if (line.startsWith("### ")) {
                  return <h3 key={i} className="text-lg font-medium mt-4 mb-2">{line.replace("### ", "")}</h3>;
                }
                if (line.startsWith("- ")) {
                  return <li key={i} className="ml-4">{line.replace("- ", "")}</li>;
                }
                if (line.startsWith("**") && line.endsWith("**")) {
                  return <p key={i} className="font-semibold my-2">{line.replace(/\*\*/g, "")}</p>;
                }
                if (line.trim() === "") {
                  return <br key={i} />;
                }
                return <p key={i} className="my-2 leading-relaxed">{line}</p>;
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function LearnSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-40" />
      ))}
    </div>
  );
}

export default function Learn() {
  const [selectedArticle, setSelectedArticle] = useState<EducationalContent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: articles = defaultContent, isLoading } = useQuery<EducationalContent[]>({
    queryKey: ["/api/educational-content"],
  });

  const allArticles = articles.length > 0 ? articles : defaultContent;

  const filteredArticles = allArticles.filter((article) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedArticle) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <ArticleDetail article={selectedArticle} onBack={() => setSelectedArticle(null)} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Learn
        </h1>
        <p className="text-muted-foreground">
          Educational resources to help you understand your health journey better.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-articles"
        />
      </div>

      {isLoading ? (
        <LearnSkeleton />
      ) : filteredArticles.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No articles found matching your search.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onClick={() => setSelectedArticle(article)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
