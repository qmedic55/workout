import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { History, Utensils, Dumbbell, Moon, Target, ArrowRight, MessageSquare, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ProfileChange {
  id: string;
  userId: string;
  chatMessageId: string | null;
  changeCategory: string;
  fieldName: string;
  changeDescription: string;
  previousValue: string | null;
  newValue: string | null;
  reasoning: string | null;
  source: string;
  createdAt: string;
}

interface ChangesSummary {
  totalChanges: number;
  periodDays: number;
  byCategory: Record<string, {
    count: number;
    latestChange: string;
    changes: ProfileChange[];
  }>;
  recentChanges: ProfileChange[];
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "nutrition":
      return <Utensils className="h-4 w-4" />;
    case "training":
      return <Dumbbell className="h-4 w-4" />;
    case "sleep":
      return <Moon className="h-4 w-4" />;
    case "phase":
      return <RefreshCw className="h-4 w-4" />;
    case "goals":
      return <Target className="h-4 w-4" />;
    default:
      return <History className="h-4 w-4" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "nutrition":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-300";
    case "training":
      return "bg-blue-500/10 text-blue-600 border-blue-300";
    case "sleep":
      return "bg-purple-500/10 text-purple-600 border-purple-300";
    case "phase":
      return "bg-amber-500/10 text-amber-600 border-amber-300";
    case "goals":
      return "bg-rose-500/10 text-rose-600 border-rose-300";
    default:
      return "bg-gray-500/10 text-gray-600 border-gray-300";
  }
};

const getSourceLabel = (source: string) => {
  switch (source) {
    case "ai_chat":
      return "AI Coach";
    case "manual":
      return "Manual";
    case "phase_transition":
      return "Phase Change";
    case "onboarding":
      return "Onboarding";
    default:
      return source;
  }
};

export function ProfileChangesHistory({ limit = 10 }: { limit?: number }) {
  const { data: summary, isLoading } = useQuery<ChangesSummary>({
    queryKey: ["/api/profile-changes/summary"],
    queryFn: async () => {
      const res = await fetch("/api/profile-changes/summary?days=30");
      if (!res.ok) throw new Error("Failed to fetch changes summary");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Plan Changes History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.totalChanges === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Plan Changes History
          </CardTitle>
          <CardDescription>
            Track all adjustments to your health plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            No changes yet. Chat with your AI coach to get personalized adjustments!
          </p>
        </CardContent>
      </Card>
    );
  }

  const recentChanges = summary.recentChanges.slice(0, limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Plan Changes History
        </CardTitle>
        <CardDescription>
          {summary.totalChanges} changes in the last {summary.periodDays} days
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Summary */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(summary.byCategory).map(([category, data]) => (
            <Badge
              key={category}
              variant="outline"
              className={`${getCategoryColor(category)} flex items-center gap-1`}
            >
              {getCategoryIcon(category)}
              {category}: {data.count}
            </Badge>
          ))}
        </div>

        {/* Recent Changes List */}
        <div className="space-y-3">
          {recentChanges.map((change) => (
            <div
              key={change.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className={`p-2 rounded-full ${getCategoryColor(change.changeCategory)}`}>
                {getCategoryIcon(change.changeCategory)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">{change.changeDescription}</p>
                  {change.chatMessageId && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <MessageSquare className="h-3 w-3" />
                      via Chat
                    </Badge>
                  )}
                </div>

                {change.previousValue && change.newValue && (
                  <div className="flex items-center gap-2 mt-1 text-sm">
                    <span className="text-muted-foreground line-through">
                      {change.previousValue}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-foreground font-medium">
                      {change.newValue}
                    </span>
                  </div>
                )}

                {change.reasoning && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {change.reasoning}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {getSourceLabel(change.source)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(change.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {summary.totalChanges > limit && (
          <p className="text-xs text-muted-foreground text-center">
            Showing {limit} of {summary.totalChanges} changes
          </p>
        )}
      </CardContent>
    </Card>
  );
}
