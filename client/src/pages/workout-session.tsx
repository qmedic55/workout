import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  SkipForward,
  Check,
  Timer,
  Dumbbell,
  Youtube,
  X,
  Trophy,
  Flame,
  Clock,
  Target,
} from "lucide-react";
import type { WorkoutTemplate } from "@shared/schema";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rir?: number | null;
  notes?: string;
}

interface WorkoutState {
  currentExerciseIndex: number;
  currentSetIndex: number;
  completedSets: { exerciseIndex: number; setIndex: number; reps: number; weightKg?: number }[];
  skippedExercises: number[];
  startTime: Date;
  isResting: boolean;
  restTimeRemaining: number;
}

const DEFAULT_REST_TIME = 90;
const REST_TIME_OPTIONS = [30, 60, 90, 120, 180];

function getYouTubeSearchUrl(exerciseName: string): string {
  const query = encodeURIComponent(exerciseName + " exercise form tutorial");
  return "https://www.youtube.com/results?search_query=" + query;
}

function RestTimer({
  timeRemaining,
  totalTime,
  onSkip,
  onAdjust,
  nextExercise,
}: {
  timeRemaining: number;
  totalTime: number;
  onSkip: () => void;
  onAdjust: (delta: number) => void;
  nextExercise?: string;
}) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const progress = ((totalTime - timeRemaining) / totalTime) * 100;

  return (
    <div className="text-center space-y-4 py-6">
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <Timer className="h-5 w-5" />
        <span className="text-sm font-medium">Rest Time</span>
      </div>

      <div className="text-6xl font-bold tabular-nums">
        {minutes}:{seconds.toString().padStart(2, "0")}
      </div>

      <Progress value={progress} className="h-2 max-w-xs mx-auto" />

      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onAdjust(-30)}>
          -30s
        </Button>
        <Button variant="outline" size="sm" onClick={() => onAdjust(30)}>
          +30s
        </Button>
        <Button variant="secondary" onClick={onSkip}>
          <SkipForward className="h-4 w-4 mr-1" />
          Skip Rest
        </Button>
      </div>

      {nextExercise && (
        <p className="text-sm text-muted-foreground">
          Next: <span className="font-medium">{nextExercise}</span>
        </p>
      )}
    </div>
  );
}

function VideoModal({
  exerciseName,
  open,
  onOpenChange,
}: {
  exerciseName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const searchUrl = getYouTubeSearchUrl(exerciseName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            {exerciseName} - Video Guide
          </DialogTitle>
          <DialogDescription>
            Watch form tutorials and exercise demonstrations
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click the button below to search YouTube for exercise tutorials:
          </p>
          <Button asChild className="w-full" variant="outline">
            <a href={searchUrl} target="_blank" rel="noopener noreferrer">
              <Youtube className="h-4 w-4 mr-2 text-red-500" />
              Search on YouTube
            </a>
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Opens in a new tab. Look for videos demonstrating proper form.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WorkoutSummary({
  exercises,
  completedSets,
  skippedExercises,
  duration,
  open,
  onClose,
}: {
  exercises: Exercise[];
  completedSets: WorkoutState["completedSets"];
  skippedExercises: number[];
  duration: number;
  open: boolean;
  onClose: () => void;
}) {
  const totalVolume = completedSets.reduce((sum, set) => {
    return sum + (set.reps * (set.weightKg || 0));
  }, 0);

  const totalSetsCompleted = completedSets.length;
  const exercisesCompleted = exercises.length - skippedExercises.length;
  const durationMinutes = Math.floor(duration / 60);
  const durationSeconds = duration % 60;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Workout Complete!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 p-3 rounded-lg text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xl font-bold">
                {durationMinutes}:{durationSeconds.toString().padStart(2, "0")}
              </p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg text-center">
              <Target className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xl font-bold">{exercisesCompleted}/{exercises.length}</p>
              <p className="text-xs text-muted-foreground">Exercises</p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg text-center">
              <Dumbbell className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xl font-bold">{totalSetsCompleted}</p>
              <p className="text-xs text-muted-foreground">Sets</p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg text-center">
              <Flame className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xl font-bold">{totalVolume.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Volume (kg)</p>
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
            <p className="font-medium text-green-700 dark:text-green-400">
              Great work! You've earned points for this workout.
            </p>
          </div>
        </div>

        <Button onClick={onClose} className="w-full">
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default function WorkoutSession() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [state, setState] = useState<WorkoutState>({
    currentExerciseIndex: 0,
    currentSetIndex: 0,
    completedSets: [],
    skippedExercises: [],
    startTime: new Date(),
    isResting: false,
    restTimeRemaining: DEFAULT_REST_TIME,
  });

  const [weight, setWeight] = useState<string>("");
  const [reps, setReps] = useState<string>("");
  const [restTime, setRestTime] = useState(DEFAULT_REST_TIME);
  const [showVideo, setShowVideo] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const { data: workout, isLoading } = useQuery<WorkoutTemplate>({
    queryKey: ["/api/workouts", id],
    queryFn: async () => {
      const response = await fetch("/api/workouts/" + id, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch workout");
      return response.json();
    },
    enabled: !!id,
  });

  const exercises = (workout?.exercises as Exercise[]) || [];
  const currentExercise = exercises[state.currentExerciseIndex];
  const isLastExercise = state.currentExerciseIndex === exercises.length - 1;
  const isLastSet = state.currentSetIndex === (currentExercise?.sets || 1) - 1;

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - state.startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [state.startTime]);

  useEffect(() => {
    if (state.isResting && state.restTimeRemaining > 0) {
      const interval = setInterval(() => {
        setState((prev) => ({
          ...prev,
          restTimeRemaining: prev.restTimeRemaining - 1,
        }));
      }, 1000);
      return () => clearInterval(interval);
    } else if (state.isResting && state.restTimeRemaining === 0) {
      playRestCompleteSound();
      setState((prev) => ({ ...prev, isResting: false }));
    }
  }, [state.isResting, state.restTimeRemaining]);

  const playRestCompleteSound = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      gainNode.gain.value = 0.3;

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);

      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch (e) {
      console.log("Audio not supported");
    }
  }, []);

  const handleCompleteSet = () => {
    const repsNum = parseInt(reps) || 0;
    const weightNum = parseFloat(weight) || undefined;

    if (repsNum <= 0) {
      toast({
        title: "Enter reps",
        description: "Please enter the number of reps completed",
        variant: "destructive",
      });
      return;
    }

    const newCompletedSet = {
      exerciseIndex: state.currentExerciseIndex,
      setIndex: state.currentSetIndex,
      reps: repsNum,
      weightKg: weightNum,
    };

    setState((prev) => ({
      ...prev,
      completedSets: [...prev.completedSets, newCompletedSet],
    }));

    if (isLastSet) {
      if (isLastExercise) {
        setShowSummary(true);
      } else {
        setState((prev) => ({
          ...prev,
          currentExerciseIndex: prev.currentExerciseIndex + 1,
          currentSetIndex: 0,
          isResting: true,
          restTimeRemaining: restTime,
        }));
        setWeight("");
        setReps("");
      }
    } else {
      setState((prev) => ({
        ...prev,
        currentSetIndex: prev.currentSetIndex + 1,
        isResting: true,
        restTimeRemaining: restTime,
      }));
    }
  };

  const handleSkipExercise = () => {
    setState((prev) => ({
      ...prev,
      skippedExercises: [...prev.skippedExercises, prev.currentExerciseIndex],
      currentExerciseIndex: prev.currentExerciseIndex + 1,
      currentSetIndex: 0,
    }));
    setWeight("");
    setReps("");

    if (isLastExercise) {
      setShowSummary(true);
    }
  };

  const handleSkipRest = () => {
    setState((prev) => ({ ...prev, isResting: false, restTimeRemaining: restTime }));
  };

  const handleAdjustRest = (delta: number) => {
    setState((prev) => ({
      ...prev,
      restTimeRemaining: Math.max(0, prev.restTimeRemaining + delta),
    }));
  };

  const handleEndWorkout = () => {
    if (state.completedSets.length > 0) {
      setShowSummary(true);
    } else {
      setLocation("/workouts");
    }
  };

  const handleSummaryClose = () => {
    setShowSummary(false);
    setLocation("/workouts");
  };

  if (isLoading) {
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!workout || exercises.length === 0) {
    return (
      <div className="p-4 max-w-2xl mx-auto text-center">
        <p className="text-muted-foreground">Workout not found</p>
        <Button onClick={() => setLocation("/workouts")} className="mt-4">
          Back to Workouts
        </Button>
      </div>
    );
  }

  const elapsedMinutes = Math.floor(elapsedTime / 60);
  const elapsedSeconds = elapsedTime % 60;
  const progressPercent = (state.currentExerciseIndex / exercises.length) * 100;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={handleEndWorkout}>
          <X className="h-4 w-4 mr-1" />
          End
        </Button>
        <div className="text-center">
          <p className="font-semibold text-sm">{workout.name}</p>
          <p className="text-xs text-muted-foreground">
            {elapsedMinutes}:{elapsedSeconds.toString().padStart(2, "0")} elapsed
          </p>
        </div>
        <Badge variant="secondary">
          {state.currentExerciseIndex + 1}/{exercises.length}
        </Badge>
      </div>

      <Progress value={progressPercent} className="h-1" />

      {state.isResting ? (
        <Card>
          <CardContent className="pt-6">
            <RestTimer
              timeRemaining={state.restTimeRemaining}
              totalTime={restTime}
              onSkip={handleSkipRest}
              onAdjust={handleAdjustRest}
              nextExercise={
                isLastSet && !isLastExercise
                  ? exercises[state.currentExerciseIndex + 1]?.name
                  : currentExercise?.name
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg">{currentExercise?.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentExercise?.sets} sets × {currentExercise?.reps}
                  {currentExercise?.rir ? " @ RIR " + currentExercise.rir : ""}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowVideo(true)}>
                <Youtube className="h-4 w-4 mr-1 text-red-500" />
                Video
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentExercise?.notes && (
              <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                {currentExercise.notes}
              </p>
            )}

            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-1">Current Set</p>
              <p className="text-4xl font-bold">
                {state.currentSetIndex + 1}
                <span className="text-lg text-muted-foreground">
                  {" "}/ {currentExercise?.sets}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Weight (kg)</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="Optional"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Reps</label>
                <Input
                  type="number"
                  placeholder={currentExercise?.reps?.split("-")[0] || "10"}
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <Button onClick={handleCompleteSet} className="w-full" size="lg">
              <Check className="h-5 w-5 mr-2" />
              Complete Set
            </Button>

            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={handleSkipExercise}
            >
              <SkipForward className="h-4 w-4 mr-1" />
              Skip Exercise
            </Button>
          </CardContent>
        </Card>
      )}

      {!state.isResting && (
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">Rest time:</span>
          {REST_TIME_OPTIONS.map((time) => (
            <Button
              key={time}
              variant={restTime === time ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setRestTime(time)}
            >
              {time >= 60 ? (time / 60) + "m" : time + "s"}
            </Button>
          ))}
        </div>
      )}

      {state.completedSets.filter((s) => s.exerciseIndex === state.currentExerciseIndex)
        .length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {state.completedSets
            .filter((s) => s.exerciseIndex === state.currentExerciseIndex)
            .map((set, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                Set {set.setIndex + 1}: {set.reps} reps
                {set.weightKg ? " @ " + set.weightKg + "kg" : ""}
              </Badge>
            ))}
        </div>
      )}

      {currentExercise && (
        <VideoModal
          exerciseName={currentExercise.name}
          open={showVideo}
          onOpenChange={setShowVideo}
        />
      )}

      <WorkoutSummary
        exercises={exercises}
        completedSets={state.completedSets}
        skippedExercises={state.skippedExercises}
        duration={elapsedTime}
        open={showSummary}
        onClose={handleSummaryClose}
      />
    </div>
  );
}
