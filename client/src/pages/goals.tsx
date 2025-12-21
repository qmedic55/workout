import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ShareButton } from "@/components/share-button";
import { createGoalCardData } from "@/hooks/use-share-card";
import {
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Trophy,
  Flag,
  Calendar,
  TrendingUp,
  X,
  ChevronDown,
  ChevronUp,
  PartyPopper,
} from "lucide-react";
import type { Goal, Milestone, PublicProfile } from "@shared/schema";

type GoalWithMilestones = Goal & { milestones: Milestone[] };

const categoryOptions = [
  { value: "weight", label: "Weight", icon: "scale" },
  { value: "strength", label: "Strength", icon: "dumbbell" },
  { value: "nutrition", label: "Nutrition", icon: "utensils" },
  { value: "activity", label: "Activity", icon: "footprints" },
  { value: "body_comp", label: "Body Composition", icon: "body" },
];

const targetTypeOptions = [
  { value: "reach_value", label: "Reach a target value" },
  { value: "maintain_streak", label: "Maintain a streak" },
  { value: "complete_count", label: "Complete a count" },
];

function GoalCard({
  goal,
  onComplete,
  onAbandon,
  onDelete,
  onCompleteMilestone,
}: {
  goal: GoalWithMilestones;
  onComplete: (id: string) => void;
  onAbandon: (id: string) => void;
  onDelete: (id: string) => void;
  onCompleteMilestone: (goalId: string, milestoneId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const progress =
    goal.targetValue && goal.startValue !== null && goal.currentValue !== null
      ? Math.min(
          100,
          Math.max(
            0,
            ((goal.currentValue - goal.startValue) / (goal.targetValue - goal.startValue)) * 100
          )
        )
      : 0;

  const completedMilestones = goal.milestones.filter((m) => m.isCompleted).length;
  const totalMilestones = goal.milestones.length;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "weight":
        return "bg-blue-100 text-blue-700";
      case "strength":
        return "bg-red-100 text-red-700";
      case "nutrition":
        return "bg-green-100 text-green-700";
      case "activity":
        return "bg-yellow-100 text-yellow-700";
      case "body_comp":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusBadge = () => {
    if (goal.status === "completed") {
      return <Badge className="bg-green-500">Completed</Badge>;
    }
    if (goal.status === "abandoned") {
      return <Badge variant="secondary">Abandoned</Badge>;
    }
    return <Badge variant="outline">Active</Badge>;
  };

  return (
    <Card className={goal.status !== "active" ? "opacity-70" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{goal.title}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getCategoryColor(goal.category)} variant="secondary">
                {categoryOptions.find((c) => c.value === goal.category)?.label || goal.category}
              </Badge>
              {getStatusBadge()}
            </div>
          </div>
          {goal.status === "active" && (
            <div className="flex gap-1">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trophy className="h-4 w-4 text-green-600" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Complete this goal?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Mark "{goal.title}" as completed. This action will record your achievement.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onComplete(goal.id)}>
                      Complete Goal
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Abandon this goal?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Mark "{goal.title}" as abandoned. You can always create a new goal later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onAbandon(goal.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Abandon Goal
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this goal?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{goal.title}" and all its milestones. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(goal.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
        {goal.description && (
          <CardDescription className="pt-2">{goal.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              {goal.currentValue !== null ? goal.currentValue : goal.startValue || 0}{" "}
              {goal.targetUnit}
            </span>
            <span className="text-muted-foreground">
              Target: {goal.targetValue} {goal.targetUnit}
            </span>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-xs text-muted-foreground text-right">{progress.toFixed(0)}% complete</p>
        </div>

        {/* Timeline info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Started: {goal.startDate ? format(new Date(goal.startDate), "MMM d, yyyy") : "N/A"}</span>
          </div>
          {goal.targetDate && (
            <div className="flex items-center gap-1">
              <Flag className="h-4 w-4" />
              <span>Target: {format(new Date(goal.targetDate), "MMM d, yyyy")}</span>
            </div>
          )}
        </div>

        {/* Milestones */}
        {goal.milestones.length > 0 && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between"
              onClick={() => setExpanded(!expanded)}
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Milestones ({completedMilestones}/{totalMilestones})
              </span>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {expanded && (
              <div className="mt-2 space-y-2 pl-2">
                {goal.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      {milestone.isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className={milestone.isCompleted ? "line-through text-muted-foreground" : ""}>
                        {milestone.title}
                      </span>
                      {milestone.targetValue && (
                        <Badge variant="outline" className="text-xs">
                          {milestone.targetValue} {goal.targetUnit}
                        </Badge>
                      )}
                    </div>
                    {!milestone.isCompleted && goal.status === "active" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCompleteMilestone(goal.id, milestone.id)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CreateGoalDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("weight");
  const [targetType, setTargetType] = useState("reach_value");
  const [targetValue, setTargetValue] = useState("");
  const [targetUnit, setTargetUnit] = useState("lbs");
  const [startValue, setStartValue] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [milestones, setMilestones] = useState<{ title: string; targetValue: string }[]>([]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/goals", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({ title: "Goal created", description: "Your goal has been set!" });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("weight");
    setTargetType("reach_value");
    setTargetValue("");
    setTargetUnit("lbs");
    setStartValue("");
    setTargetDate("");
    setMilestones([]);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({ title: "Error", description: "Please enter a goal title", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || null,
      category,
      targetType,
      targetValue: targetValue ? parseFloat(targetValue) : null,
      targetUnit: targetUnit || null,
      startValue: startValue ? parseFloat(startValue) : null,
      currentValue: startValue ? parseFloat(startValue) : null,
      targetDate: targetDate || null,
      milestones: milestones
        .filter((m) => m.title.trim())
        .map((m) => ({
          title: m.title.trim(),
          targetValue: m.targetValue ? parseFloat(m.targetValue) : null,
        })),
    });
  };

  const addMilestone = () => {
    setMilestones([...milestones, { title: "", targetValue: "" }]);
  };

  const updateMilestone = (index: number, field: "title" | "targetValue", value: string) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Goal</DialogTitle>
          <DialogDescription>Set a specific, measurable goal to track your progress.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium">Goal Title</label>
            <Input
              placeholder="e.g., Reach 180 lbs"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea
              placeholder="Why is this goal important to you?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Goal Type</label>
              <Select value={targetType} onValueChange={setTargetType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {targetTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">Start Value</label>
              <Input
                type="number"
                placeholder="185"
                value={startValue}
                onChange={(e) => setStartValue(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Target Value</label>
              <Input
                type="number"
                placeholder="180"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Unit</label>
              <Input
                placeholder="lbs"
                value={targetUnit}
                onChange={(e) => setTargetUnit(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Target Date (optional)</label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Milestones */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Milestones (optional)</label>
              <Button type="button" variant="ghost" size="sm" onClick={addMilestone}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            {milestones.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Add milestones to break your goal into smaller steps.
              </p>
            ) : (
              <div className="space-y-2">
                {milestones.map((milestone, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Milestone title"
                      value={milestone.title}
                      onChange={(e) => updateMilestone(index, "title", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Value"
                      value={milestone.targetValue}
                      onChange={(e) => updateMilestone(index, "targetValue", e.target.value)}
                      className="w-24"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMilestone(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button onClick={handleSubmit} disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending ? "Creating..." : "Create Goal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GoalsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-48" />
      <Skeleton className="h-48" />
    </div>
  );
}

export default function Goals() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [celebrationGoal, setCelebrationGoal] = useState<GoalWithMilestones | null>(null);

  const { data: goals = [], isLoading } = useQuery<GoalWithMilestones[]>({
    queryKey: ["/api/goals", statusFilter !== "all" ? `?status=${statusFilter}` : ""],
  });

  const { data: publicProfile } = useQuery<PublicProfile>({
    queryKey: ["/api/public-profile"],
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/goals/${id}/complete`);
      return response.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      // Find the goal that was just completed to show in celebration modal
      const completedGoal = goals.find(g => g.id === id);
      if (completedGoal) {
        setCelebrationGoal(completedGoal);
      }
      toast({ title: "Goal completed!", description: "Congratulations on reaching your goal!" });
    },
  });

  const abandonMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/goals/${id}/abandon`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({ title: "Goal abandoned", description: "The goal has been marked as abandoned." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({ title: "Goal deleted", description: "The goal has been removed." });
    },
  });

  const completeMilestoneMutation = useMutation({
    mutationFn: async ({ goalId, milestoneId }: { goalId: string; milestoneId: string }) => {
      const response = await apiRequest("POST", `/api/goals/${goalId}/milestones/${milestoneId}/complete`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({ title: "Milestone achieved!", description: "Keep up the great work!" });
    },
  });

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <GoalsSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Goals</h1>
          <p className="text-muted-foreground">Track your fitness and health goals</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        <Button
          variant={statusFilter === "active" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("active")}
        >
          Active ({activeGoals.length})
        </Button>
        <Button
          variant={statusFilter === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("completed")}
        >
          Completed ({completedGoals.length})
        </Button>
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("all")}
        >
          All
        </Button>
      </div>

      {/* Goals list */}
      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No goals yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Set your first goal to start tracking your progress toward your health and fitness targets.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onComplete={(id) => completeMutation.mutate(id)}
              onAbandon={(id) => abandonMutation.mutate(id)}
              onDelete={(id) => deleteMutation.mutate(id)}
              onCompleteMilestone={(goalId, milestoneId) =>
                completeMilestoneMutation.mutate({ goalId, milestoneId })
              }
            />
          ))}
        </div>
      )}

      <CreateGoalDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {/* Goal Completion Celebration Modal */}
      <Dialog open={!!celebrationGoal} onOpenChange={(open) => !open && setCelebrationGoal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
              <PartyPopper className="h-12 w-12 text-primary" />
            </div>
            <DialogTitle className="text-center text-2xl">Goal Achieved!</DialogTitle>
            <DialogDescription className="text-center">
              Congratulations on completing your goal!
            </DialogDescription>
          </DialogHeader>

          {celebrationGoal && (
            <div className="space-y-4">
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <h3 className="font-semibold text-lg mb-2">{celebrationGoal.title}</h3>
                  {celebrationGoal.description && (
                    <p className="text-sm text-muted-foreground mb-3">{celebrationGoal.description}</p>
                  )}
                  {celebrationGoal.startValue !== null && celebrationGoal.targetValue && (
                    <div className="flex justify-between text-sm">
                      <span>Started: {celebrationGoal.startValue} {celebrationGoal.targetUnit}</span>
                      <span>Achieved: {celebrationGoal.targetValue} {celebrationGoal.targetUnit}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <p className="text-center text-muted-foreground text-sm">
                Share your achievement with friends and family!
              </p>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            {celebrationGoal && (
              <ShareButton
                cardData={createGoalCardData(
                  {
                    title: celebrationGoal.title,
                    startValue: celebrationGoal.startValue ?? undefined,
                    targetValue: celebrationGoal.targetValue ?? undefined,
                    targetUnit: celebrationGoal.targetUnit ?? undefined,
                    startDate: celebrationGoal.startDate,
                    completedAt: new Date().toISOString(),
                  },
                  publicProfile?.username || undefined
                )}
                variant="default"
                className="w-full"
              />
            )}
            <Button
              variant="outline"
              onClick={() => setCelebrationGoal(null)}
              className="w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
