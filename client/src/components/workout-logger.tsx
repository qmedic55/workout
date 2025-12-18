import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dumbbell, Plus, X, ChevronDown, ChevronUp, Check } from "lucide-react";
import type { WorkoutTemplate, ExerciseLog } from "@shared/schema";

interface SetDetail {
  reps: number;
  weightKg?: number;
  rir?: number;
}

interface WorkoutLoggerProps {
  date: string;
  onWorkoutChange?: (hasWorkout: boolean) => void;
}

function ExerciseCard({
  log,
  onUpdate,
  onDelete,
  onSkipToggle,
}: {
  log: ExerciseLog;
  onUpdate: (id: string, setDetails: SetDetail[]) => void;
  onDelete: (id: string) => void;
  onSkipToggle: (id: string, skipped: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [sets, setSets] = useState<SetDetail[]>(() => {
    if (log.setDetails && Array.isArray(log.setDetails)) {
      return log.setDetails as SetDetail[];
    }
    // Initialize with empty sets based on prescribed sets
    const numSets = log.prescribedSets || 3;
    return Array(numSets).fill(null).map(() => ({ reps: 0, weightKg: undefined }));
  });

  const handleSetChange = (index: number, field: keyof SetDetail, value: number | undefined) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], [field]: value };
    setSets(newSets);
    onUpdate(log.id, newSets);
  };

  const addSet = () => {
    const newSets = [...sets, { reps: 0, weightKg: undefined }];
    setSets(newSets);
    onUpdate(log.id, newSets);
  };

  const removeSet = (index: number) => {
    const newSets = sets.filter((_, i) => i !== index);
    setSets(newSets);
    onUpdate(log.id, newSets);
  };

  const completedSets = sets.filter(s => s.reps > 0).length;
  const isCustomExercise = !log.workoutTemplateId;

  return (
    <Card className={`${log.skipped ? "opacity-50" : ""}`}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Checkbox
              checked={log.skipped || false}
              onCheckedChange={(checked) => onSkipToggle(log.id, checked as boolean)}
              data-testid={`checkbox-skip-${log.id}`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`font-medium truncate ${log.skipped ? "line-through" : ""}`}>
                  {log.exerciseName}
                </p>
                {isCustomExercise && (
                  <Badge variant="secondary" className="text-xs shrink-0">Custom</Badge>
                )}
              </div>
              {log.notes && !log.skipped && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.notes}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!log.skipped && (
              <Badge variant={completedSets > 0 ? "default" : "outline"} className="text-xs">
                {completedSets}/{sets.length} sets
              </Badge>
            )}
            {log.prescribedReps && !log.skipped && (
              <Badge variant="outline" className="text-xs">
                {log.prescribedReps}
              </Badge>
            )}
            {isCustomExercise && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onDelete(log.id)}
                data-testid={`button-delete-${log.id}`}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            {!log.skipped && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setExpanded(!expanded)}
                data-testid={`button-expand-${log.id}`}
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>

        {expanded && !log.skipped && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground px-1">
              <span>Set</span>
              <span>Weight (kg)</span>
              <span>Reps</span>
              <span></span>
            </div>
            {sets.map((set, index) => (
              <div key={index} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
                <span className="text-sm font-medium w-6 text-center">{index + 1}</span>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="kg"
                  value={set.weightKg ?? ""}
                  onChange={(e) => handleSetChange(index, "weightKg", e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="h-8"
                  data-testid={`input-weight-${log.id}-${index}`}
                />
                <Input
                  type="number"
                  placeholder="reps"
                  value={set.reps || ""}
                  onChange={(e) => handleSetChange(index, "reps", e.target.value ? parseInt(e.target.value) : 0)}
                  className="h-8"
                  data-testid={`input-reps-${log.id}-${index}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeSet(index)}
                  disabled={sets.length <= 1}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={addSet}
              data-testid={`button-add-set-${log.id}`}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Set
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AddExerciseDialog({
  date,
  currentOrder,
  onAdd,
}: {
  date: string;
  currentOrder: number;
  onAdd: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState("10-12");
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/exercise-logs", {
        logDate: date,
        exerciseName: name,
        exerciseOrder: currentOrder,
        prescribedSets: sets,
        prescribedReps: reps,
        setDetails: Array(sets).fill(null).map(() => ({ reps: 0, weightKg: undefined })),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-logs", date] });
      setOpen(false);
      setName("");
      setSets(3);
      setReps("10-12");
      onAdd();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add exercise",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" data-testid="button-add-exercise">
          <Plus className="h-4 w-4 mr-2" />
          Add Exercise
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Custom Exercise</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="exercise-name">Exercise Name</Label>
            <Input
              id="exercise-name"
              placeholder="e.g., Bicep Curls"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-exercise-name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exercise-sets">Sets</Label>
              <Input
                id="exercise-sets"
                type="number"
                value={sets}
                onChange={(e) => setSets(parseInt(e.target.value) || 3)}
                data-testid="input-exercise-sets"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exercise-reps">Reps</Label>
              <Input
                id="exercise-reps"
                placeholder="e.g., 10-12"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                data-testid="input-exercise-reps"
              />
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => createMutation.mutate()}
            disabled={!name.trim() || createMutation.isPending}
            data-testid="button-confirm-add-exercise"
          >
            {createMutation.isPending ? "Adding..." : "Add Exercise"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function WorkoutLogger({ date, onWorkoutChange }: WorkoutLoggerProps) {
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch available workouts
  const { data: workouts = [], isLoading: loadingWorkouts } = useQuery<WorkoutTemplate[]>({
    queryKey: ["/api/workouts"],
  });

  // Fetch existing exercise logs for this date
  const { data: exerciseLogs = [], isLoading: loadingLogs } = useQuery<ExerciseLog[]>({
    queryKey: ["/api/exercise-logs", date],
  });

  // Notify parent when workout status changes
  useEffect(() => {
    onWorkoutChange?.(exerciseLogs.length > 0);
  }, [exerciseLogs.length, onWorkoutChange]);

  // Set selected workout if logs exist
  useEffect(() => {
    if (exerciseLogs.length > 0 && exerciseLogs[0].workoutTemplateId) {
      setSelectedWorkoutId(exerciseLogs[0].workoutTemplateId);
    }
  }, [exerciseLogs]);

  // Load workout template exercises
  const loadWorkoutMutation = useMutation({
    mutationFn: async (workoutId: string) => {
      const workout = workouts.find(w => w.id === workoutId);
      if (!workout) throw new Error("Workout not found");

      const exercises = (workout.exercises as any[]) || [];
      const response = await apiRequest("POST", "/api/exercise-logs/bulk", {
        workoutTemplateId: workoutId,
        logDate: date,
        exercises,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-logs", date] });
      toast({
        title: "Workout Loaded",
        description: "Exercises have been added to your log.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to load workout",
        variant: "destructive",
      });
    },
  });

  // Update exercise log
  const updateMutation = useMutation({
    mutationFn: async ({ id, setDetails }: { id: string; setDetails: SetDetail[] }) => {
      const completedSets = setDetails.filter(s => s.reps > 0).length;
      const response = await apiRequest("PATCH", `/api/exercise-logs/${id}`, {
        setDetails,
        completedSets,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-logs", date] });
    },
  });

  // Toggle skip
  const skipMutation = useMutation({
    mutationFn: async ({ id, skipped }: { id: string; skipped: boolean }) => {
      const response = await apiRequest("PATCH", `/api/exercise-logs/${id}`, { skipped });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-logs", date] });
    },
  });

  // Delete exercise log
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/exercise-logs/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-logs", date] });
    },
  });

  const handleWorkoutSelect = (workoutId: string) => {
    setSelectedWorkoutId(workoutId);
    loadWorkoutMutation.mutate(workoutId);
  };

  const handleUpdate = (id: string, setDetails: SetDetail[]) => {
    updateMutation.mutate({ id, setDetails });
  };

  const handleSkipToggle = (id: string, skipped: boolean) => {
    skipMutation.mutate({ id, skipped });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  if (loadingWorkouts || loadingLogs) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-primary" />
            Workout
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedWorkout = workouts.find(w => w.id === selectedWorkoutId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-primary" />
          Workout
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Workout selector */}
        <div className="space-y-2">
          <Label>Select Workout Program</Label>
          <Select
            value={selectedWorkoutId || ""}
            onValueChange={handleWorkoutSelect}
          >
            <SelectTrigger data-testid="select-workout">
              <SelectValue placeholder="Choose a workout..." />
            </SelectTrigger>
            <SelectContent>
              {workouts.map((workout) => (
                <SelectItem key={workout.id} value={workout.id}>
                  <div className="flex items-center gap-2">
                    <span>{workout.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {workout.durationMinutes} min
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedWorkout && (
            <p className="text-xs text-muted-foreground">{selectedWorkout.description}</p>
          )}
        </div>

        {/* Exercise list */}
        {exerciseLogs.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Exercises</Label>
              <Badge variant="secondary" className="text-xs">
                {exerciseLogs.filter(l => !l.skipped && (l.setDetails as SetDetail[] | null)?.some(s => s.reps > 0)).length}/{exerciseLogs.length} logged
              </Badge>
            </div>
            {exerciseLogs.map((log) => (
              <ExerciseCard
                key={log.id}
                log={log}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onSkipToggle={handleSkipToggle}
              />
            ))}
          </div>
        )}

        {/* Add custom exercise */}
        <AddExerciseDialog
          date={date}
          currentOrder={exerciseLogs.length}
          onAdd={() => {}}
        />

        {exerciseLogs.length === 0 && !selectedWorkoutId && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Select a workout program above or add individual exercises.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
