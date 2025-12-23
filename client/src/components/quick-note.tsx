import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquarePlus,
  Send,
  X,
  Clock,
  Loader2,
  Sparkles,
  AlertCircle,
  Dumbbell,
  Moon,
  Brain,
  Utensils,
} from "lucide-react";

interface HealthNote {
  id: string;
  content: string;
  category: string | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

function getCategoryIcon(category: string | null) {
  switch (category) {
    case "injury":
      return <AlertCircle className="h-3 w-3" />;
    case "nutrition":
      return <Utensils className="h-3 w-3" />;
    case "sleep":
      return <Moon className="h-3 w-3" />;
    case "stress":
      return <Brain className="h-3 w-3" />;
    case "training":
      return <Dumbbell className="h-3 w-3" />;
    default:
      return <MessageSquarePlus className="h-3 w-3" />;
  }
}

function getCategoryColor(category: string | null) {
  switch (category) {
    case "injury":
      return "bg-red-100 text-red-800 border-red-200";
    case "nutrition":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "sleep":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "stress":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "training":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function QuickNote() {
  const [note, setNote] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  // Fetch recent health notes (last 5)
  const { data: recentNotes = [] } = useQuery<HealthNote[]>({
    queryKey: ["/api/health-notes"],
    select: (data) => data.slice(0, 5),
  });

  // Save note mutation (with comprehensive AI parsing for food, workouts, sleep, etc.)
  const saveMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/health-notes", {
        content,
        // AI will categorize, but we could add a simple detection here
        category: detectCategory(content),
        // Short-term notes expire in 7 days, ongoing issues don't expire
        expiresInDays: isShortTermNote(content) ? 7 : undefined,
      });
      return response.json() as Promise<{
        note: HealthNote | null;
        foodEntries: Array<{ id: string; foodName: string; calories: number }>;
        foodsLogged: number;
        exerciseLogs: Array<{ id: string; exerciseName: string }>;
        exercisesLogged: number;
        dailyLogUpdated: boolean;
        dailyLogChanges: string[];
        workoutCompleted: boolean;
        workoutType?: string;
      }>;
    },
    onSuccess: (data) => {
      setNote("");
      setIsExpanded(false);
      // Invalidate all related queries - use predicate to match partial keys
      queryClient.invalidateQueries({ queryKey: ["/api/health-notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-guidance"] });
      // Match all food-entries queries (including those with date param like ["/api/food-entries", "2024-01-15"])
      queryClient.invalidateQueries({ predicate: (query) =>
        Array.isArray(query.queryKey) && query.queryKey[0] === "/api/food-entries"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-logs/today"] });
      // Match all exercise-logs queries
      queryClient.invalidateQueries({ predicate: (query) =>
        Array.isArray(query.queryKey) && query.queryKey[0] === "/api/exercise-logs"
      });

      // Build a comprehensive description of what was logged
      const parts: string[] = [];

      if (data.foodsLogged > 0) {
        const foodNames = data.foodEntries.map((f) => f.foodName).join(", ");
        const totalCals = data.foodEntries.reduce((sum, f) => sum + (f.calories || 0), 0);
        parts.push(`${foodNames} (${totalCals} cal)`);
      }

      if (data.exercisesLogged > 0) {
        const exerciseNames = data.exerciseLogs.map((e) => e.exerciseName).join(", ");
        parts.push(`Exercises: ${exerciseNames}`);
      }

      if (data.dailyLogChanges.length > 0) {
        parts.push(data.dailyLogChanges.join(", "));
      }

      if (data.note) {
        parts.push("Note saved for AI coach");
      }

      // Determine the title based on what was logged
      let title = "Logged";
      if (data.foodsLogged > 0 && data.exercisesLogged > 0) {
        title = "Food & workout logged";
      } else if (data.foodsLogged > 0) {
        title = "Food logged";
      } else if (data.exercisesLogged > 0 || data.workoutCompleted) {
        title = "Workout logged";
      } else if (data.dailyLogUpdated) {
        title = "Data updated";
      } else if (data.note) {
        title = "Note saved";
      }

      if (parts.length > 0) {
        toast({
          title,
          description: parts.join(" • "),
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete note mutation
  const deleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      await apiRequest("DELETE", `/api/health-notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health-notes"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (note.trim()) {
      saveMutation.mutate(note.trim());
    }
  };

  // Simple category detection based on keywords
  function detectCategory(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes("hurt") || lower.includes("injury") || lower.includes("pain") || lower.includes("sore")) {
      return "injury";
    }
    if (lower.includes("ate") || lower.includes("food") || lower.includes("eating") || lower.includes("party") || lower.includes("meal")) {
      return "nutrition";
    }
    if (lower.includes("sleep") || lower.includes("tired") || lower.includes("dream") || lower.includes("insomnia") || lower.includes("rest")) {
      return "sleep";
    }
    if (lower.includes("stress") || lower.includes("anxious") || lower.includes("worried") || lower.includes("mental")) {
      return "stress";
    }
    if (lower.includes("workout") || lower.includes("exercise") || lower.includes("training") || lower.includes("gym")) {
      return "training";
    }
    return "general";
  }

  // Check if this is likely a short-term note (one-time event vs ongoing issue)
  function isShortTermNote(text: string): boolean {
    const lower = text.toLowerCase();
    // One-time events: parties, specific meals, single bad nights
    const shortTermKeywords = ["yesterday", "last night", "party", "ate too much", "didn't sleep", "today"];
    return shortTermKeywords.some((kw) => lower.includes(kw));
  }

  return (
    <Card className="bg-gradient-to-r from-muted/30 to-muted/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Tell Your Coach</CardTitle>
          </div>
          {recentNotes.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {recentNotes.length} recent note{recentNotes.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          Log anything: food, workouts, sleep, mood - AI understands natural language
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          {isExpanded ? (
            <>
              <Textarea
                placeholder="e.g., 'Had eggs for breakfast, then did 3x10 bench press at 185lbs' or 'Slept 7 hours, feeling great' or 'My shoulder is hurting'"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[80px] text-sm resize-none"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!note.trim() || saveMutation.isPending}
                  className="flex-1"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-3 w-3 mr-1" />
                      Save Note
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsExpanded(false);
                    setNote("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start text-muted-foreground"
              onClick={() => setIsExpanded(true)}
            >
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              Add a note for your AI coach...
            </Button>
          )}
        </form>

        {/* Recent Notes */}
        {recentNotes.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Recent notes
            </p>
            <div className="space-y-1.5">
              {recentNotes.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-2 text-xs bg-background/50 rounded-md p-2 group"
                >
                  <span
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] ${getCategoryColor(n.category)}`}
                  >
                    {getCategoryIcon(n.category)}
                    {n.category || "general"}
                  </span>
                  <span className="flex-1 text-muted-foreground line-clamp-2">
                    {n.content}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground/60">
                      {formatTimeAgo(n.createdAt)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteMutation.mutate(n.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
