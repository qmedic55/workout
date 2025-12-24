import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Send,
  Loader2,
  Sparkles,
  Bot,
  User,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import type { ChatMessage } from "@shared/schema";

// Truncate long AI responses for the mini-chat view
function truncateResponse(text: string, maxLength: number = 200): { text: string; truncated: boolean } {
  if (text.length <= maxLength) {
    return { text, truncated: false };
  }
  // Try to cut at a sentence boundary
  const truncated = text.slice(0, maxLength);
  const lastPeriod = truncated.lastIndexOf(".");
  const lastQuestion = truncated.lastIndexOf("?");
  const lastExclaim = truncated.lastIndexOf("!");
  const cutPoint = Math.max(lastPeriod, lastQuestion, lastExclaim);

  if (cutPoint > maxLength * 0.5) {
    return { text: text.slice(0, cutPoint + 1), truncated: true };
  }
  return { text: truncated + "...", truncated: true };
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

export function QuickNote() {
  const [message, setMessage] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch recent chat messages (last 4 for mini view)
  const { data: recentMessages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages"],
    select: (data) => data.slice(-4), // Last 4 messages
  });

  // Send message mutation - uses the same endpoint as full chat
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/chat/send", { content });
      return response.json();
    },
    onSuccess: (data) => {
      setMessage("");
      // Invalidate chat messages to show new response
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });

      // If AI applied changes to profile, refresh profile data
      if (data.appliedChanges && data.appliedChanges.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      }

      // If food/exercise/biofeedback was logged, invalidate related queries
      if (data.loggedData) {
        if (data.loggedData.foodsLogged > 0) {
          queryClient.invalidateQueries({ predicate: (query) =>
            Array.isArray(query.queryKey) && query.queryKey[0] === "/api/food-entries"
          });
        }
        if (data.loggedData.exercisesLogged > 0) {
          queryClient.invalidateQueries({ predicate: (query) =>
            Array.isArray(query.queryKey) && query.queryKey[0] === "/api/exercise-logs"
          });
        }
        if (data.loggedData.dailyLogUpdated || data.loggedData.foodsLogged > 0 || data.loggedData.exercisesLogged > 0) {
          queryClient.invalidateQueries({ queryKey: ["/api/daily-logs/today"] });
          queryClient.invalidateQueries({ queryKey: ["/api/daily-guidance"] });
          queryClient.invalidateQueries({ queryKey: ["/api/milestones"] });
        }

        // Show toast for what was logged
        const parts: string[] = [];
        if (data.loggedData.foodsLogged > 0) {
          parts.push(`${data.loggedData.foodsLogged} food item${data.loggedData.foodsLogged > 1 ? "s" : ""}`);
        }
        if (data.loggedData.exercisesLogged > 0) {
          parts.push(`${data.loggedData.exercisesLogged} exercise${data.loggedData.exercisesLogged > 1 ? "s" : ""}`);
        }
        if (data.loggedData.dailyLogChanges?.length > 0) {
          parts.push(data.loggedData.dailyLogChanges.join(", "));
        }
        if (parts.length > 0) {
          toast({
            title: "Logged",
            description: parts.join(" • "),
          });
        }

        // Show toast for meal template creation
        if (data.loggedData.mealTemplateCreated) {
          queryClient.invalidateQueries({ queryKey: ["/api/meal-templates"] });
          toast({
            title: "Meal Template Created",
            description: `Saved "${data.loggedData.mealTemplateCreated.name}" for quick logging`,
          });
        } else if (data.loggedData.autoDetectedMealTemplate) {
          queryClient.invalidateQueries({ queryKey: ["/api/meal-templates"] });
          toast({
            title: "Frequent Meal Detected",
            description: `Created "${data.loggedData.autoDetectedMealTemplate.name}" template - you log this often!`,
          });
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMutation.isPending) {
      sendMutation.mutate(message.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const goToFullChat = () => {
    setLocation("/chat");
  };

  // Get the last assistant message for display
  const lastAssistantMessage = recentMessages
    .filter(m => m.role === "assistant")
    .slice(-1)[0];

  const lastUserMessage = recentMessages
    .filter(m => m.role === "user")
    .slice(-1)[0];

  return (
    <Card className="bg-gradient-to-r from-muted/30 to-muted/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">AI Coach</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 px-2"
            onClick={goToFullChat}
          >
            Full Chat
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Recent conversation preview */}
        {(lastUserMessage || lastAssistantMessage) && (
          <div className="space-y-2 max-h-[180px] overflow-y-auto">
            {lastUserMessage && (
              <div className="flex items-start gap-2">
                <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <User className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {lastUserMessage.content}
                  </p>
                  <span className="text-[10px] text-muted-foreground/60">
                    {formatTimeAgo(lastUserMessage.createdAt?.toString() || new Date().toISOString())}
                  </span>
                </div>
              </div>
            )}
            {lastAssistantMessage && (
              <div className="flex items-start gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-3 w-3 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  {(() => {
                    const { text, truncated } = truncateResponse(lastAssistantMessage.content);
                    return (
                      <>
                        <p className="text-xs text-foreground">
                          {text}
                        </p>
                        {truncated && (
                          <button
                            className="text-[10px] text-primary hover:underline"
                            onClick={goToFullChat}
                          >
                            See full response →
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Typing indicator when AI is responding */}
        {sendMutation.isPending && (
          <div className="flex items-start gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="h-3 w-3 text-primary" />
            </div>
            <div className="flex items-center gap-1 py-2">
              <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            placeholder="Log food, ask questions, share how you're feeling..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] max-h-[100px] text-sm resize-none flex-1"
            disabled={sendMutation.isPending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!message.trim() || sendMutation.isPending}
            className="shrink-0 self-end h-9 w-9"
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Empty state - encourage first message */}
        {!lastUserMessage && !lastAssistantMessage && !sendMutation.isPending && (
          <div className="text-center py-2">
            <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">
              Tell me what you ate, how you slept, or ask anything about your health journey
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
