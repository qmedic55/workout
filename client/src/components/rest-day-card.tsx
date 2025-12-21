import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  BedDouble,
  Battery,
  TrendingDown,
  Dumbbell,
  Brain,
  Activity,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useState } from "react";

interface RestDayRecommendation {
  shouldRest: boolean;
  confidence: "high" | "medium" | "low";
  reasons: string[];
  suggestedRestType: "complete" | "active_recovery" | "deload" | "normal_training";
  alternativeActivity: string | null;
  todaysPlan: string;
  metrics: {
    consecutiveWorkoutDays: number;
    recoveryScore: number;
    avgEnergyLast3Days: number | null;
    avgSleepQualityLast3Days: number | null;
    avgStressLast3Days: number | null;
    weeklyVolumeVsBaseline: number | null;
  };
}

const restTypeConfig = {
  complete: {
    label: "Complete Rest",
    color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
    icon: BedDouble,
  },
  active_recovery: {
    label: "Active Recovery",
    color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    icon: Activity,
  },
  deload: {
    label: "Deload Day",
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    icon: TrendingDown,
  },
  normal_training: {
    label: "Ready to Train",
    color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
    icon: Dumbbell,
  },
};

const confidenceConfig = {
  high: { label: "High Confidence", color: "bg-primary/10 text-primary" },
  medium: { label: "Moderate", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  low: { label: "Suggestion", color: "bg-muted text-muted-foreground" },
};

interface RestDayCardProps {
  variant?: "compact" | "full";
  showWhenReady?: boolean;
}

export function RestDayCard({ variant = "full", showWhenReady = false }: RestDayCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: recommendation, isLoading, error } = useQuery<RestDayRecommendation>({
    queryKey: ["/api/rest-day-recommendation"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !recommendation) {
    return null; // Silently fail - not critical
  }

  // If user is ready to train and we don't want to show that state, hide the card
  if (!recommendation.shouldRest && !showWhenReady) {
    return null;
  }

  const restConfig = restTypeConfig[recommendation.suggestedRestType];
  const confConfig = confidenceConfig[recommendation.confidence];
  const RestIcon = restConfig.icon;

  if (variant === "compact") {
    return (
      <Alert className={`${restConfig.color} border`}>
        <RestIcon className="h-4 w-4" />
        <AlertTitle className="font-medium">{restConfig.label}</AlertTitle>
        <AlertDescription className="text-sm opacity-90">
          {recommendation.todaysPlan}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={`${restConfig.color} border-2`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${recommendation.shouldRest ? "bg-background/50" : "bg-primary/10"}`}>
              <RestIcon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {recommendation.shouldRest ? "Rest Recommended" : "Ready to Train"}
                <Badge variant="outline" className={confConfig.color}>
                  {confConfig.label}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                {restConfig.label}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="shrink-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm font-medium">
          {recommendation.todaysPlan}
        </p>

        {recommendation.alternativeActivity && (
          <div className="flex items-start gap-2 text-sm bg-background/50 p-3 rounded-lg">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{recommendation.alternativeActivity}</span>
          </div>
        )}

        {isExpanded && (
          <div className="space-y-4 pt-2 border-t">
            {/* Reasons */}
            {recommendation.reasons.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Why this recommendation?
                </h4>
                <ul className="space-y-1">
                  {recommendation.reasons.map((reason, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Metrics */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Recovery Metrics
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <MetricItem
                  label="Workout Streak"
                  value={`${recommendation.metrics.consecutiveWorkoutDays} days`}
                  icon={Dumbbell}
                  status={
                    recommendation.metrics.consecutiveWorkoutDays >= 5
                      ? "warning"
                      : recommendation.metrics.consecutiveWorkoutDays >= 4
                      ? "caution"
                      : "good"
                  }
                />
                <MetricItem
                  label="Recovery Score"
                  value={`${recommendation.metrics.recoveryScore}/100`}
                  icon={Battery}
                  status={
                    recommendation.metrics.recoveryScore < 40
                      ? "warning"
                      : recommendation.metrics.recoveryScore < 60
                      ? "caution"
                      : "good"
                  }
                />
                {recommendation.metrics.avgEnergyLast3Days !== null && (
                  <MetricItem
                    label="Avg Energy (3d)"
                    value={`${recommendation.metrics.avgEnergyLast3Days}/10`}
                    icon={Activity}
                    status={
                      recommendation.metrics.avgEnergyLast3Days < 5
                        ? "warning"
                        : recommendation.metrics.avgEnergyLast3Days < 7
                        ? "caution"
                        : "good"
                    }
                  />
                )}
                {recommendation.metrics.avgSleepQualityLast3Days !== null && (
                  <MetricItem
                    label="Avg Sleep (3d)"
                    value={`${recommendation.metrics.avgSleepQualityLast3Days}/10`}
                    icon={BedDouble}
                    status={
                      recommendation.metrics.avgSleepQualityLast3Days < 5
                        ? "warning"
                        : recommendation.metrics.avgSleepQualityLast3Days < 7
                        ? "caution"
                        : "good"
                    }
                  />
                )}
                {recommendation.metrics.weeklyVolumeVsBaseline !== null && (
                  <MetricItem
                    label="Volume vs Baseline"
                    value={`${Math.round(recommendation.metrics.weeklyVolumeVsBaseline * 100)}%`}
                    icon={TrendingDown}
                    status={
                      recommendation.metrics.weeklyVolumeVsBaseline > 1.2
                        ? "warning"
                        : recommendation.metrics.weeklyVolumeVsBaseline > 1.1
                        ? "caution"
                        : "good"
                    }
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MetricItemProps {
  label: string;
  value: string;
  icon: React.ElementType;
  status: "good" | "caution" | "warning";
}

function MetricItem({ label, value, icon: Icon, status }: MetricItemProps) {
  const statusConfig = {
    good: { icon: CheckCircle2, color: "text-green-600 dark:text-green-400" },
    caution: { icon: Info, color: "text-amber-600 dark:text-amber-400" },
    warning: { icon: AlertTriangle, color: "text-red-600 dark:text-red-400" },
  };

  const StatusIcon = statusConfig[status].icon;

  return (
    <div className="flex items-center gap-2 bg-background/50 p-2 rounded-lg">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
      <StatusIcon className={`h-4 w-4 ${statusConfig[status].color} shrink-0`} />
    </div>
  );
}
