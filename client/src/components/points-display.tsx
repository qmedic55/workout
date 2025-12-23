import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Flame,
  Trophy,
  Zap,
  TrendingUp,
  Star,
  ChevronDown,
  ChevronUp,
  Info,
  Utensils,
  Dumbbell,
  Heart,
  Footprints,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface PointsSummary {
  lifetimePoints: number;
  spendablePoints: number;
  dailyPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  currentStreak: number;
  longestStreak: number;
  currentMultiplier: number;
  nextMultiplierInfo: { nextMultiplier: number; daysUntil: number } | null;
}

interface PointTransaction {
  id: string;
  actionType: string;
  basePoints: number;
  multiplier: number;
  totalPoints: number;
  description: string;
  createdAt: string;
}

const multiplierColors: Record<number, string> = {
  1: "bg-muted text-muted-foreground",
  2: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  3: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  4: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const actionTypeIcons: Record<string, React.ElementType> = {
  food_log: Star,
  workout: Trophy,
  biofeedback: Zap,
  steps: TrendingUp,
  milestone: Trophy,
};

interface PointsDisplayProps {
  variant?: "compact" | "full";
}

export function PointsDisplay({ variant = "full" }: PointsDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: pointsSummary, isLoading: summaryLoading } = useQuery<PointsSummary>({
    queryKey: ["/api/points"],
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  const { data: todayTransactions } = useQuery<PointTransaction[]>({
    queryKey: ["/api/points/today"],
    staleTime: 30 * 1000,
    enabled: isExpanded,
  });

  if (summaryLoading) {
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

  if (!pointsSummary) {
    return null;
  }

  const multiplierColor = multiplierColors[pointsSummary.currentMultiplier] || multiplierColors[4];

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-4 p-3 bg-card rounded-lg border">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <span className="font-bold">{pointsSummary.currentStreak}</span>
          <span className="text-muted-foreground text-sm">day streak</span>
        </div>
        <Badge className={multiplierColor}>
          {pointsSummary.currentMultiplier}x
        </Badge>
        <div className="flex items-center gap-2 ml-auto">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="font-semibold">{pointsSummary.lifetimePoints.toLocaleString()}</span>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {pointsSummary.currentStreak} Day Streak
                <Badge className={multiplierColor}>
                  {pointsSummary.currentMultiplier}x Multiplier
                </Badge>
              </CardTitle>
              <CardDescription>
                {pointsSummary.nextMultiplierInfo
                  ? `${pointsSummary.nextMultiplierInfo.daysUntil} day${pointsSummary.nextMultiplierInfo.daysUntil !== 1 ? "s" : ""} until ${pointsSummary.nextMultiplierInfo.nextMultiplier}x multiplier`
                  : "Maximum multiplier reached!"}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="shrink-0">
                  <Info className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="end">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">How to Earn Points</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Utensils className="h-4 w-4 text-green-500" />
                      <span>Log food</span>
                      <Badge variant="secondary" className="ml-auto text-xs">+10 pts</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-blue-500" />
                      <span>Log workout</span>
                      <Badge variant="secondary" className="ml-auto text-xs">+50 pts</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-pink-500" />
                      <span>Log biofeedback</span>
                      <Badge variant="secondary" className="ml-auto text-xs">+10-20 pts</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Footprints className="h-4 w-4 text-purple-500" />
                      <span>Hit step goals</span>
                      <Badge variant="secondary" className="ml-auto text-xs">+10-50 pts</Badge>
                    </div>
                  </div>
                  <div className="pt-2 border-t text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Streak Multipliers</p>
                    <p>Build your streak to multiply all points!</p>
                    <div className="flex gap-2 mt-1">
                      <span>Day 3: 2x</span>
                      <span>Day 7: 3x</span>
                      <span>Day 14: 4x</span>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
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
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Points Overview */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-primary">
              {pointsSummary.dailyPoints.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Today</p>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold">
              {pointsSummary.weeklyPoints.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">This Week</p>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold">
              {pointsSummary.lifetimePoints.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Lifetime</p>
          </div>
        </div>

        {/* Next Multiplier Progress */}
        {pointsSummary.nextMultiplierInfo && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress to {pointsSummary.nextMultiplierInfo.nextMultiplier}x</span>
              <span className="font-medium">
                {getProgressToNextMultiplier(pointsSummary.currentStreak)}%
              </span>
            </div>
            <Progress
              value={getProgressToNextMultiplier(pointsSummary.currentStreak)}
              className="h-2"
            />
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && (
          <div className="space-y-4 pt-2 border-t">
            {/* Streak Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 bg-muted/50 p-3 rounded-lg">
                <Flame className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Current Streak</p>
                  <p className="font-semibold">{pointsSummary.currentStreak} days</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-muted/50 p-3 rounded-lg">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Best Streak</p>
                  <p className="font-semibold">{pointsSummary.longestStreak} days</p>
                </div>
              </div>
            </div>

            {/* Today's Activity */}
            {todayTransactions && todayTransactions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Today's Points</h4>
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {todayTransactions.map((transaction) => {
                    const Icon = actionTypeIcons[transaction.actionType] || Star;
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="truncate max-w-[180px]">
                            {transaction.description}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {transaction.multiplier > 1 && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              {transaction.multiplier}x
                            </Badge>
                          )}
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            +{transaction.totalPoints}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Multiplier Tiers */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Streak Multipliers</h4>
              <div className="grid grid-cols-4 gap-1.5 text-xs">
                <div className={`p-2 rounded text-center ${pointsSummary.currentStreak >= 1 ? "bg-muted text-foreground" : "bg-muted/30 text-muted-foreground"}`}>
                  <p className="font-bold">1x</p>
                  <p>Day 1-2</p>
                </div>
                <div className={`p-2 rounded text-center ${pointsSummary.currentStreak >= 3 ? "bg-amber-500/20 text-amber-700 dark:text-amber-400" : "bg-muted/30 text-muted-foreground"}`}>
                  <p className="font-bold">2x</p>
                  <p>Day 3-6</p>
                </div>
                <div className={`p-2 rounded text-center ${pointsSummary.currentStreak >= 7 ? "bg-orange-500/20 text-orange-700 dark:text-orange-400" : "bg-muted/30 text-muted-foreground"}`}>
                  <p className="font-bold">3x</p>
                  <p>Day 7-13</p>
                </div>
                <div className={`p-2 rounded text-center ${pointsSummary.currentStreak >= 14 ? "bg-red-500/20 text-red-700 dark:text-red-400" : "bg-muted/30 text-muted-foreground"}`}>
                  <p className="font-bold">4x</p>
                  <p>Day 14+</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getProgressToNextMultiplier(streak: number): number {
  if (streak >= 14) return 100;
  if (streak >= 7) return Math.round(((streak - 7) / 7) * 100);
  if (streak >= 3) return Math.round(((streak - 3) / 4) * 100);
  return Math.round((streak / 3) * 100);
}
