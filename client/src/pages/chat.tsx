import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Send, Bot, User, Sparkles, RefreshCw } from "lucide-react";
import type { ChatMessage } from "@shared/schema";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-8 w-8 border">
        <AvatarFallback className="bg-primary/10 text-primary">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-1 p-3 rounded-lg bg-muted">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <Avatar className="h-8 w-8 border shrink-0">
        <AvatarFallback className={isUser ? "bg-secondary" : "bg-primary/10 text-primary"}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div
        className={`max-w-[80%] p-4 rounded-lg ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        }`}
        data-testid={`text-message-${message.id}`}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        {message.createdAt && (
          <p className={`text-xs mt-2 ${isUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </div>
  );
}

function SuggestedPrompts({ onSelect }: { onSelect: (prompt: string) => void }) {
  const prompts = [
    "How should I adjust my calories this week?",
    "I'm feeling tired lately. What could be causing this?",
    "Explain metabolic adaptation to me",
    "I'm struggling with motivation. Can you help?",
    "What's the best workout split for someone 40+?",
    "How do I know if I'm in a caloric deficit?",
  ];

  return (
    <div className="space-y-4 py-8 text-center">
      <div className="flex justify-center">
        <div className="p-4 rounded-full bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-lg">Your AI Health Mentor</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Ask me anything about nutrition, training, recovery, or your health journey.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
        {prompts.map((prompt, i) => (
          <Button
            key={i}
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => onSelect(prompt)}
            data-testid={`button-suggested-prompt-${i}`}
          >
            {prompt}
          </Button>
        ))}
      </div>
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`flex items-start gap-3 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}>
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className={`h-20 ${i % 2 === 0 ? "w-48" : "w-64"} rounded-lg`} />
        </div>
      ))}
    </div>
  );
}

export default function Chat() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/chat/send", { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
    },
  });

  const handleSend = () => {
    if (!input.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendMessageMutation.isPending]);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">AI Health Mentor</h1>
            <p className="text-sm text-muted-foreground">
              Your personalized guide to metabolic health and body recomposition
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] })}
            data-testid="button-refresh-chat"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {isLoading ? (
          <ChatSkeleton />
        ) : messages.length === 0 ? (
          <SuggestedPrompts onSelect={handleSuggestedPrompt} />
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={{
                  id: message.id,
                  role: message.role as "user" | "assistant",
                  content: message.content,
                  createdAt: message.createdAt?.toString(),
                }}
              />
            ))}
            {sendMessageMutation.isPending && <TypingIndicator />}
          </div>
        )}
      </ScrollArea>

      <div className="border-t p-4">
        <Card className="shadow-none border-0 bg-muted/50">
          <CardContent className="p-3">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your health mentor anything..."
                className="resize-none border-0 bg-transparent focus-visible:ring-0 min-h-[60px]"
                rows={2}
                data-testid="input-chat-message"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || sendMessageMutation.isPending}
                size="icon"
                className="shrink-0 self-end"
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Your AI mentor provides guidance based on evidence-based practices. Always consult a healthcare provider for medical advice.
        </p>
      </div>
    </div>
  );
}
