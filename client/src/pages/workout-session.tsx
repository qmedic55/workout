import { useState, useEffect, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dumbbell,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  SkipForward,
  X,
  Play,
  Pause,
  Timer,
  Info,
  Sparkles,
  Trophy,
} from "lucide-react";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  duration?: string;
  rir?: number | null;
  notes?: string;
}

interface WorkoutPlan {
  title: string;
  duration: string;
  exercises: Exercise[];
  timing?: string;
  recovery?: string;
}

interface SetLog {
  reps: number;
  weightKg: number;
  rir?: number;
}

interface ExerciseProgress {
  exerciseIndex: number;
  exerciseName: string;
  completedSets: SetLog[];
  skipped: boolean;
}

function parseWorkoutFromUrl(): WorkoutPlan | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const workoutData = params.get("workout");
    if (workoutData) {
      return JSON.parse(decodeURIComponent(workoutData));
    }
  } catch (e) {
    console.error("Failed to parse workout from URL:", e);
  }
  return null;
}

function RestTimer({
  seconds,
  onComplete,
  onSkip
}: {
  seconds: number;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || remaining <= 0) {
      if (remaining <= 0) {
        onComplete();
      }
      return;
    }

    const timer = setInterval(() => {
      setRemaining((r) => r - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [remaining, isPaused, onComplete]);

  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="pt-6 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Timer className="h-6 w-6 text-primary animate-pulse" />
          <span className="text-lg font-medium">Rest Time</span>
        </div>

        <div className="text-5xl font-bold font-mono">
          {minutes}:{secs.toString().padStart(2, "0")}
        </div>

        <Progress value={((seconds - remaining) / seconds) * 100} className="h-2" />

        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {isPaused ? "Resume" : "Pause"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setRemaining((r) => Math.max(0, r - 30))}
          >
            -30s
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setRemaining((r) => r + 30)}
          >
            +30s
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onSkip}
          >
            Skip Rest
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ExerciseCard({
  exercise,
  exerciseIndex,
  totalExercises,
  currentSet,
  progress,
  onCompleteSet,
  onSkipExercise,
  isActive,
}: {
  exercise: Exercise;
  exerciseIndex: number;
  totalExercises: number;
  currentSet: number;
  progress: ExerciseProgress | undefined;
  onCompleteSet: (set: SetLog) => void;
  onSkipExercise: () => void;
  isActive: boolean;
}) {
  const [reps, setReps] = useState(12);
  const [weight, setWeight] = useState(0);
  const [rir, setRir] = useState(exercise.rir ?? 2);

  // Parse target reps from the exercise
  const targetReps = parseInt(exercise.reps?.split("-")?.[1] || exercise.reps?.split("-")?.[0] || "12");

  useEffect(() => {
    setReps(targetReps);
  }, [targetReps]);

  if (!isActive) {
    return (
      <Card className="opacity-60">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{exercise.name}</p>
              <p className="text-sm text-muted-foreground">
                {exercise.sets} × {exercise.reps}
              </p>
            </div>
            {progress?.skipped ? (
              <Badge variant="secondary">Skipped</Badge>
            ) : progress?.completedSets && progress.completedSets.length > 0 ? (
              <Badge variant="default" className="bg-green-500">
                <Check className="h-3 w-3 mr-1" />
                Done
              </Badge>
            ) : (
              <Badge variant="outline">Upcoming</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">
            Exercise {exerciseIndex + 1} of {totalExercises}
          </Badge>
          <Badge variant="outline">
            Set {currentSet} of {exercise.sets}
          </Badge>
        </div>
        <CardTitle className="text-xl mt-2">{exercise.name}</CardTitle>
        {exercise.notes && (
          <CardDescription className="flex items-start gap-2 mt-2 p-2 bg-muted/50 rounded">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            {exercise.notes}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Target display */}
        <div className="flex items-center justify-center gap-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold">{exercise.sets}</p>
            <p className="text-xs text-muted-foreground">Sets</p>
          </div>
          <div className="text-2xl text-muted-foreground">×</div>
          <div className="text-center">
            <p className="text-2xl font-bold">{exercise.reps}</p>
            <p className="text-xs text-muted-foreground">Reps</p>
          </div>
          {exercise.rir !== null && exercise.rir !== undefined && (
            <>
              <div className="text-2xl text-muted-foreground">@</div>
              <div className="text-center">
                <p className="text-2xl font-bold">RIR {exercise.rir}</p>
                <p className="text-xs text-muted-foreground">In Reserve</p>
              </div>
            </>
          )}
        </div>

        {/* Completed sets display */}
        {progress?.completedSets && progress.completedSets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {progress.completedSets.map((set, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                Set {i + 1}: {set.reps} reps @ {set.weightKg}kg
              </Badge>
            ))}
          </div>
        )}

        {/* Input fields for current set */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Reps Completed</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setReps(Math.max(1, reps - 1))}
              >
                -
              </Button>
              <Input
                type="number"
                value={reps}
                onChange={(e) => setReps(Math.max(1, parseInt(e.target.value) || 0))}
                className="text-center text-lg font-bold"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setReps(reps + 1)}
              >
                +
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Weight (kg)</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setWeight(Math.max(0, weight - 2.5))}
              >
                -
              </Button>
              <Input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                className="text-center text-lg font-bold"
                step="2.5"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setWeight(weight + 2.5)}
              >
                +
              </Button>
            </div>
          </div>
        </div>

        {/* RIR Slider */}
        {exercise.rir !== null && exercise.rir !== undefined && (
          <div className="space-y-2">
            <label className="text-sm font-medium">RIR (Reps in Reserve): {rir}</label>
            <Slider
              value={[rir]}
              onValueChange={([v]) => setRir(v)}
              min={0}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Failure</span>
              <span>Easy</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            className="flex-1"
            onClick={() => onCompleteSet({ reps, weightKg: weight, rir })}
          >
            <Check className="h-4 w-4 mr-2" />
            Complete Set
          </Button>
          <Button
            variant="outline"
            onClick={onSkipExercise}
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkoutSummary({
  workout,
  progress,
  duration,
  onClose,
}: {
  workout: WorkoutPlan;
  progress: ExerciseProgress[];
  duration: number;
  onClose: () => void;
}) {
  const completedExercises = progress.filter((p) => !p.skipped && p.completedSets.length > 0);
  const totalSets = completedExercises.reduce((sum, p) => sum + p.completedSets.length, 0);
  const totalVolume = completedExercises.reduce((sum, p) => {
    return sum + p.completedSets.reduce((setSum, set) => setSum + set.reps * set.weightKg, 0);
  }, 0);

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-green-500/10 to-green-500/5 border-green-500/30">
        <CardContent className="pt-6 text-center">
          <Trophy className="h-16 w-16 mx-auto text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Workout Complete!</h2>
          <p className="text-muted-foreground">Great job finishing {workout.title}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{minutes}:{seconds.toString().padStart(2, "0")}</p>
            <p className="text-sm text-muted-foreground">Duration</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{completedExercises.length}</p>
            <p className="text-sm text-muted-foreground">Exercises</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{totalSets}</p>
            <p className="text-sm text-muted-foreground">Sets</p>
          </CardContent>
        </Card>
      </div>

      {totalVolume > 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-4xl font-bold">{totalVolume.toLocaleString()} kg</p>
            <p className="text-sm text-muted-foreground">Total Volume</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exercise Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {progress.map((p, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
              <span className="font-medium">{p.exerciseName}</span>
              {p.skipped ? (
                <Badge variant="secondary">Skipped</Badge>
              ) : (
                <Badge variant="default" className="bg-green-500">
                  {p.completedSets.length} sets
                </Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Button className="w-full" onClick={onClose}>
        Finish & Return to Dashboard
      </Button>
    </div>
  );
}

export default function WorkoutSession() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [workout, setWorkout] = useState<WorkoutPlan | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(1);
  const [progress, setProgress] = useState<ExerciseProgress[]>([]);
  const [isResting, setIsResting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  // Parse workout from URL on mount
  useEffect(() => {
    const parsedWorkout = parseWorkoutFromUrl();
    if (parsedWorkout) {
      setWorkout(parsedWorkout);
      // Initialize progress for all exercises
      setProgress(
        parsedWorkout.exercises.map((ex, i) => ({
          exerciseIndex: i,
          exerciseName: ex.name,
          completedSets: [],
          skipped: false,
        }))
      );
    }
  }, []);

  // Elapsed time tracker
  useEffect(() => {
    if (isComplete) return;

    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, isComplete]);

  // Save workout log mutation
  const saveWorkoutMutation = useMutation({
    mutationFn: async (data: {
      exercises: { exerciseName: string; sets: SetLog[]; skipped: boolean; exerciseOrder: number }[];
      durationSeconds: number;
      workoutTitle: string;
    }) => {
      const today = new Date().toISOString().split("T")[0];

      // Log each exercise
      for (const exercise of data.exercises) {
        if (exercise.skipped || exercise.sets.length === 0) continue;

        await apiRequest("POST", "/api/exercise-logs", {
          exerciseName: exercise.exerciseName,
          logDate: today,
          exerciseOrder: exercise.exerciseOrder,
          completedSets: exercise.sets.length,
          setDetails: exercise.sets,
          notes: `Completed via AI-guided session: ${data.workoutTitle}`,
        });
      }

      // Update daily log to mark workout as done
      await apiRequest("POST", `/api/daily-logs/${today}`, {
        workedOut: true,
        workoutType: "strength",
        workoutDurationMinutes: Math.round(data.durationSeconds / 60),
      });

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-logs/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/milestones"] });
      toast({
        title: "Workout saved!",
        description: "Your workout has been logged successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save workout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCompleteSet = useCallback((set: SetLog) => {
    if (!workout) return;

    const exercise = workout.exercises[currentExerciseIndex];

    setProgress((prev) => {
      const updated = [...prev];
      updated[currentExerciseIndex] = {
        ...updated[currentExerciseIndex],
        completedSets: [...updated[currentExerciseIndex].completedSets, set],
      };
      return updated;
    });

    // Check if we need to do more sets
    if (currentSetIndex < exercise.sets) {
      setCurrentSetIndex(currentSetIndex + 1);
      setIsResting(true);
    } else {
      // Move to next exercise
      moveToNextExercise();
    }
  }, [workout, currentExerciseIndex, currentSetIndex]);

  const handleSkipExercise = useCallback(() => {
    if (!workout) return;

    setProgress((prev) => {
      const updated = [...prev];
      updated[currentExerciseIndex] = {
        ...updated[currentExerciseIndex],
        skipped: true,
      };
      return updated;
    });

    // Don't show rest timer when skipping
    moveToNextExercise(false);
  }, [workout, currentExerciseIndex]);

  const moveToNextExercise = useCallback((showRestTimer: boolean = true) => {
    if (!workout) return;

    if (currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSetIndex(1);
      // Start rest timer between exercises (unless skipping)
      setIsResting(showRestTimer);
    } else {
      // Workout complete
      finishWorkout();
    }
  }, [workout, currentExerciseIndex]);

  const finishWorkout = useCallback(() => {
    if (!workout) return;

    setIsComplete(true);

    // Save the workout
    saveWorkoutMutation.mutate({
      exercises: progress.map((p, index) => ({
        exerciseName: p.exerciseName,
        sets: p.completedSets,
        skipped: p.skipped,
        exerciseOrder: index,
      })),
      durationSeconds: elapsedTime,
      workoutTitle: workout.title,
    });
  }, [workout, progress, elapsedTime, saveWorkoutMutation]);

  const handleClose = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const handleCancel = useCallback(() => {
    if (progress.some((p) => p.completedSets.length > 0)) {
      if (confirm("You have workout progress. Save before leaving?")) {
        finishWorkout();
        return;
      }
    }
    navigate("/");
  }, [progress, finishWorkout, navigate]);

  if (!workout) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center">
            <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No Workout Selected</h2>
            <p className="text-muted-foreground mb-4">
              Start a workout from your dashboard to begin a guided session.
            </p>
            <Button onClick={() => navigate("/")}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <WorkoutSummary
          workout={workout}
          progress={progress}
          duration={elapsedTime}
          onClose={handleClose}
        />
      </div>
    );
  }

  const currentExercise = workout.exercises[currentExerciseIndex];
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;
  const progressPercent = ((currentExerciseIndex + 1) / workout.exercises.length) * 100;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={handleCancel}>
          <X className="h-4 w-4 mr-2" />
          End Workout
        </Button>
        <div className="flex items-center gap-2 text-sm font-medium">
          <Clock className="h-4 w-4" />
          {minutes}:{seconds.toString().padStart(2, "0")}
        </div>
      </div>

      {/* Workout title and progress */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">{workout.title}</h2>
            <Badge variant="outline">
              {currentExerciseIndex + 1} / {workout.exercises.length}
            </Badge>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </CardContent>
      </Card>

      {/* Rest Timer or Current Exercise */}
      {isResting ? (
        <RestTimer
          seconds={90}
          onComplete={() => setIsResting(false)}
          onSkip={() => setIsResting(false)}
        />
      ) : (
        <ExerciseCard
          exercise={currentExercise}
          exerciseIndex={currentExerciseIndex}
          totalExercises={workout.exercises.length}
          currentSet={currentSetIndex}
          progress={progress[currentExerciseIndex]}
          onCompleteSet={handleCompleteSet}
          onSkipExercise={handleSkipExercise}
          isActive={true}
        />
      )}

      {/* Exercise List Preview */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Exercises</h3>
        {workout.exercises.map((exercise, i) => (
          <ExerciseCard
            key={i}
            exercise={exercise}
            exerciseIndex={i}
            totalExercises={workout.exercises.length}
            currentSet={1}
            progress={progress[i]}
            onCompleteSet={() => {}}
            onSkipExercise={() => {}}
            isActive={i === currentExerciseIndex && !isResting}
          />
        ))}
      </div>

      {/* End workout early button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={finishWorkout}
      >
        <Check className="h-4 w-4 mr-2" />
        End Workout Early & Save Progress
      </Button>
    </div>
  );
}
