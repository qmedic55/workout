import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Moon,
  Utensils,
  Brain,
  Dumbbell,
  Droplets,
  TrendingUp,
  Scale,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface HealthInsight {
  id: string;
  type: "warning" | "positive" | "suggestion";
  category: "sleep" | "nutrition" | "stress" | "training" | "hydration" | "phase" | "weight";
  title: string;
  message: string;
  actionUrl?: string;
  priority: number;
}

const typeConfig = {
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-500/20",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  positive: {
    icon: CheckCircle2,
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-500/20",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  suggestion: {
    icon: Lightbulb,
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-500/20",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
};

const categoryIcons = {
  sleep: Moon,
  nutrition: Utensils,
  stress: Brain,
  training: Dumbbell,
  hydration: Droplets,
  phase: TrendingUp,
  weight: Scale,
};

function InsightCard({ insight }: { insight: HealthInsight }) {
  const config = typeConfig[insight.type];
  const TypeIcon = config.icon;
  const CategoryIcon = categoryIcons[insight.category];

  return (
    <div
      className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor} space-y-2`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${config.bgColor}`}>
            <TypeIcon className={`h-4 w-4 ${config.textColor}`} />
          </div>
          <div>
            <h4 className="font-medium text-sm">{insight.title}</h4>
            <Badge variant="outline" className="text-xs mt-1 gap-1">
              <CategoryIcon className="h-3 w-3" />
              {insight.category}
            </Badge>
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{insight.message}</p>
      {insight.actionUrl && (
        <Link href={insight.actionUrl}>
          <Button variant="ghost" size="sm" className="mt-1 h-7 px-2 text-xs">
            Take Action
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      )}
    </div>
  );
}

function InsightsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  );
}

interface HealthInsightsProps {
  limit?: number;
  showHeader?: boolean;
}

export function HealthInsights({ limit = 3, showHeader = true }: HealthInsightsProps) {
  const { data: insights = [], isLoading, error } = useQuery<HealthInsight[]>({
    queryKey: ["/api/insights"],
  });

  const displayInsights = insights.slice(0, limit);

  if (isLoading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Health Insights
            </CardTitle>
            <CardDescription>Loading your personalized insights...</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <InsightsSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Health Insights
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <p className="text-sm text-muted-foreground">Unable to load insights.</p>
        </CardContent>
      </Card>
    );
  }

  if (displayInsights.length === 0) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Health Insights
            </CardTitle>
            <CardDescription>Personalized recommendations based on your data</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-6">
            <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Start logging your daily data to receive personalized health insights.
            </p>
            <Link href="/daily-log">
              <Button variant="outline" className="mt-4" size="sm">
                Log Today's Data
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Health Insights
          </CardTitle>
          <CardDescription>
            Personalized recommendations based on your recent data
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {displayInsights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
        {insights.length > limit && (
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              {insights.length - limit} more insight{insights.length - limit > 1 ? "s" : ""} available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
