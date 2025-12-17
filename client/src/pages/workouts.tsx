import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dumbbell, Clock, Target, ChevronRight, Info, Flame, Zap } from "lucide-react";
import type { WorkoutTemplate } from "@shared/schema";

const defaultWorkouts: WorkoutTemplate[] = [
  {
    id: "1",
    name: "Full Body Strength A",
    description: "Foundation workout focusing on compound movements with controlled tempo. Perfect for building strength while protecting joints.",
    type: "strength",
    difficulty: "beginner",
    durationMinutes: 45,
    targetAgeGroup: "40+",
    exercises: [
      { name: "Goblet Squat", sets: 3, reps: "10-12", rir: 3, notes: "Focus on depth and control" },
      { name: "Dumbbell Romanian Deadlift", sets: 3, reps: "10-12", rir: 3, notes: "Hinge at hips, slight knee bend" },
      { name: "Dumbbell Bench Press", sets: 3, reps: "10-12", rir: 3, notes: "Full range of motion" },
      { name: "Cable Row", sets: 3, reps: "10-12", rir: 3, notes: "Squeeze shoulder blades" },
      { name: "Overhead Press", sets: 3, reps: "10-12", rir: 3, notes: "Engage core throughout" },
      { name: "Plank", sets: 3, reps: "30-45 sec", rir: null, notes: "Neutral spine" },
    ],
    createdAt: new Date(),
  },
  {
    id: "2",
    name: "Full Body Strength B",
    description: "Complementary workout to Full Body A, targeting similar muscle groups with different movement patterns.",
    type: "strength",
    difficulty: "beginner",
    durationMinutes: 45,
    targetAgeGroup: "40+",
    exercises: [
      { name: "Leg Press", sets: 3, reps: "10-12", rir: 3, notes: "Controlled descent" },
      { name: "Walking Lunges", sets: 3, reps: "10 each", rir: 3, notes: "Step with control" },
      { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", rir: 3, notes: "30-45 degree angle" },
      { name: "Lat Pulldown", sets: 3, reps: "10-12", rir: 3, notes: "Pull to upper chest" },
      { name: "Face Pulls", sets: 3, reps: "15", rir: 2, notes: "External rotation at top" },
      { name: "Dead Bug", sets: 3, reps: "10 each", rir: null, notes: "Lower back pressed down" },
    ],
    createdAt: new Date(),
  },
  {
    id: "3",
    name: "Upper Body Focus",
    description: "Dedicated upper body session for building strength in chest, back, shoulders, and arms.",
    type: "strength",
    difficulty: "intermediate",
    durationMinutes: 50,
    targetAgeGroup: "40+",
    exercises: [
      { name: "Barbell Bench Press", sets: 4, reps: "8-10", rir: 2, notes: "Arch back slightly, retract shoulders" },
      { name: "Barbell Row", sets: 4, reps: "8-10", rir: 2, notes: "Torso at 45 degrees" },
      { name: "Dumbbell Shoulder Press", sets: 3, reps: "10-12", rir: 2, notes: "Neutral grip option for shoulders" },
      { name: "Chest Supported Row", sets: 3, reps: "12", rir: 2, notes: "Great for posture" },
      { name: "Tricep Pushdowns", sets: 3, reps: "12-15", rir: 2, notes: "Keep elbows pinned" },
      { name: "Dumbbell Curls", sets: 3, reps: "12-15", rir: 2, notes: "Controlled eccentric" },
    ],
    createdAt: new Date(),
  },
  {
    id: "4",
    name: "Lower Body Focus",
    description: "Comprehensive lower body workout targeting quads, hamstrings, glutes, and calves.",
    type: "strength",
    difficulty: "intermediate",
    durationMinutes: 50,
    targetAgeGroup: "40+",
    exercises: [
      { name: "Barbell Squat", sets: 4, reps: "8-10", rir: 2, notes: "Depth to parallel or below" },
      { name: "Romanian Deadlift", sets: 4, reps: "8-10", rir: 2, notes: "Feel hamstring stretch" },
      { name: "Bulgarian Split Squat", sets: 3, reps: "10 each", rir: 2, notes: "Rear foot elevated" },
      { name: "Leg Curl", sets: 3, reps: "12", rir: 2, notes: "Slow negative" },
      { name: "Leg Extension", sets: 3, reps: "12", rir: 2, notes: "Pause at top" },
      { name: "Standing Calf Raise", sets: 4, reps: "15", rir: 2, notes: "Full stretch at bottom" },
    ],
    createdAt: new Date(),
  },
  {
    id: "5",
    name: "Recovery & Mobility",
    description: "Active recovery session focusing on mobility, flexibility, and joint health. Essential for longevity.",
    type: "recovery",
    difficulty: "beginner",
    durationMinutes: 30,
    targetAgeGroup: "40+",
    exercises: [
      { name: "Cat-Cow Stretch", sets: 1, reps: "2 min", rir: null, notes: "Sync with breath" },
      { name: "World's Greatest Stretch", sets: 1, reps: "5 each", rir: null, notes: "Hold each position" },
      { name: "Hip 90/90", sets: 1, reps: "1 min each", rir: null, notes: "Keep spine tall" },
      { name: "Thoracic Spine Rotation", sets: 1, reps: "10 each", rir: null, notes: "From quadruped" },
      { name: "Wall Slides", sets: 2, reps: "10", rir: null, notes: "Shoulders pressed to wall" },
      { name: "Foam Rolling", sets: 1, reps: "10 min", rir: null, notes: "Major muscle groups" },
    ],
    createdAt: new Date(),
  },
  {
    id: "6",
    name: "LISS Cardio",
    description: "Low-intensity steady state cardio for fat oxidation and cardiovascular health without excessive stress.",
    type: "cardio",
    difficulty: "beginner",
    durationMinutes: 30,
    targetAgeGroup: "40+",
    exercises: [
      { name: "Walking or Light Cycling", sets: 1, reps: "30 min", rir: null, notes: "Heart rate zone 2 (60-70% max HR)" },
    ],
    createdAt: new Date(),
  },
];

function WorkoutCard({ workout, onClick }: { workout: WorkoutTemplate; onClick: () => void }) {
  const typeColors: Record<string, string> = {
    strength: "bg-chart-1/10 text-chart-1",
    cardio: "bg-chart-2/10 text-chart-2",
    flexibility: "bg-chart-3/10 text-chart-3",
    recovery: "bg-chart-4/10 text-chart-4",
  };

  const difficultyColors: Record<string, string> = {
    beginner: "bg-green-500/10 text-green-700 dark:text-green-400",
    intermediate: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    advanced: "bg-red-500/10 text-red-700 dark:text-red-400",
  };

  return (
    <Card className="hover-elevate cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg" data-testid={`text-workout-${workout.id}`}>{workout.name}</CardTitle>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </div>
        <CardDescription className="line-clamp-2">{workout.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge className={typeColors[workout.type] || ""} variant="secondary">
            {workout.type}
          </Badge>
          <Badge className={difficultyColors[workout.difficulty] || ""} variant="secondary">
            {workout.difficulty}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {workout.durationMinutes} min
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkoutDetail({ workout, onClose }: { workout: WorkoutTemplate; onClose: () => void }) {
  const exercises = (workout.exercises as any[]) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{workout.name}</h2>
          <p className="text-muted-foreground mt-1">{workout.description}</p>
        </div>
        <Button variant="outline" onClick={onClose} data-testid="button-close-workout">
          Back
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{workout.durationMinutes} minutes</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span className="capitalize">{workout.difficulty}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Dumbbell className="h-4 w-4 text-muted-foreground" />
          <span className="capitalize">{workout.type}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5" />
            Understanding RIR (Reps In Reserve)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            RIR indicates how many more reps you could do before failure. RIR 3 means you should stop with 3 reps "left in the tank."
            This approach helps prevent overtraining while still stimulating muscle growth—especially important for recovery after 40.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Exercises</h3>
        {exercises.map((exercise: any, index: number) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium" data-testid={`text-exercise-${index}`}>{exercise.name}</p>
                  {exercise.notes && (
                    <p className="text-sm text-muted-foreground mt-1">{exercise.notes}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-medium">{exercise.sets} x {exercise.reps}</p>
                  {exercise.rir !== null && (
                    <p className="text-xs text-muted-foreground">RIR {exercise.rir}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Tips for 40+ Training</p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>Warm up thoroughly—spend 5-10 minutes before lifting</li>
                <li>Focus on form over weight; controlled tempo protects joints</li>
                <li>Listen to your body; skip exercises that cause pain</li>
                <li>Allow adequate recovery between sessions (48+ hours for same muscles)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WorkoutsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-40" />
      ))}
    </div>
  );
}

export default function Workouts() {
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutTemplate | null>(null);

  const { data: workouts = defaultWorkouts, isLoading } = useQuery<WorkoutTemplate[]>({
    queryKey: ["/api/workouts"],
  });

  const allWorkouts = workouts.length > 0 ? workouts : defaultWorkouts;
  
  const strengthWorkouts = allWorkouts.filter(w => w.type === "strength");
  const cardioWorkouts = allWorkouts.filter(w => w.type === "cardio");
  const recoveryWorkouts = allWorkouts.filter(w => w.type === "recovery" || w.type === "flexibility");

  if (selectedWorkout) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <WorkoutDetail workout={selectedWorkout} onClose={() => setSelectedWorkout(null)} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Workout Programs</h1>
        <p className="text-muted-foreground">
          Evidence-based training programs designed for adults 40+ focusing on strength, mobility, and longevity.
        </p>
      </div>

      {isLoading ? (
        <WorkoutsSkeleton />
      ) : (
        <Tabs defaultValue="strength" className="space-y-4">
          <TabsList>
            <TabsTrigger value="strength" className="gap-1" data-testid="tab-strength">
              <Dumbbell className="h-4 w-4" />
              Strength
            </TabsTrigger>
            <TabsTrigger value="cardio" className="gap-1" data-testid="tab-cardio">
              <Flame className="h-4 w-4" />
              Cardio
            </TabsTrigger>
            <TabsTrigger value="recovery" className="gap-1" data-testid="tab-recovery">
              <Zap className="h-4 w-4" />
              Recovery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="strength">
            <div className="grid gap-4 md:grid-cols-2">
              {strengthWorkouts.map((workout) => (
                <WorkoutCard
                  key={workout.id}
                  workout={workout}
                  onClick={() => setSelectedWorkout(workout)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cardio">
            <div className="grid gap-4 md:grid-cols-2">
              {cardioWorkouts.map((workout) => (
                <WorkoutCard
                  key={workout.id}
                  workout={workout}
                  onClick={() => setSelectedWorkout(workout)}
                />
              ))}
            </div>
            {cardioWorkouts.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No cardio workouts available yet.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recovery">
            <div className="grid gap-4 md:grid-cols-2">
              {recoveryWorkouts.map((workout) => (
                <WorkoutCard
                  key={workout.id}
                  workout={workout}
                  onClick={() => setSelectedWorkout(workout)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
