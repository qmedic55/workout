import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Star,
} from "lucide-react";
import { useState } from "react";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string | null;
  displayName: string | null;
  profileImageUrl: string | null;
  points: number;
}

type LeaderboardType = "daily" | "weekly" | "monthly";

const rankIcons: Record<number, { icon: React.ElementType; color: string }> = {
  1: { icon: Crown, color: "text-yellow-500" },
  2: { icon: Medal, color: "text-gray-400" },
  3: { icon: Award, color: "text-amber-600" },
};

export function LeaderboardCard() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>("weekly");

  const { data: dailyLeaderboard, isLoading: dailyLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboards/daily"],
    staleTime: 60 * 1000, // Cache for 1 minute
  });

  const { data: weeklyLeaderboard, isLoading: weeklyLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboards/weekly"],
    staleTime: 60 * 1000,
  });

  const { data: monthlyLeaderboard, isLoading: monthlyLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboards/monthly"],
    staleTime: 60 * 1000,
  });

  const leaderboards: Record<LeaderboardType, { data: LeaderboardEntry[] | undefined; loading: boolean }> = {
    daily: { data: dailyLeaderboard, loading: dailyLoading },
    weekly: { data: weeklyLeaderboard, loading: weeklyLoading },
    monthly: { data: monthlyLeaderboard, loading: monthlyLoading },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
            <Trophy className="h-6 w-6 text-yellow-500" />
          </div>
          <div>
            <CardTitle className="text-lg">Leaderboard</CardTitle>
            <CardDescription>See how you stack up</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeaderboardType)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="daily">Today</TabsTrigger>
            <TabsTrigger value="weekly">Week</TabsTrigger>
            <TabsTrigger value="monthly">Month</TabsTrigger>
          </TabsList>

          {(["daily", "weekly", "monthly"] as LeaderboardType[]).map((type) => (
            <TabsContent key={type} value={type} className="mt-0">
              <LeaderboardList
                entries={leaderboards[type].data}
                isLoading={leaderboards[type].loading}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface LeaderboardListProps {
  entries: LeaderboardEntry[] | undefined;
  isLoading: boolean;
}

function LeaderboardList({ entries, isLoading }: LeaderboardListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No rankings yet</p>
        <p className="text-xs">Start earning points to appear here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {entries.map((entry) => {
        const RankIcon = rankIcons[entry.rank]?.icon;
        const rankColor = rankIcons[entry.rank]?.color;
        const displayName = entry.displayName || entry.username || "Anonymous";
        const initials = displayName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return (
          <div
            key={entry.userId}
            className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
              entry.rank <= 3 ? "bg-muted/50" : "hover:bg-muted/30"
            }`}
          >
            {/* Rank */}
            <div className="w-7 flex justify-center">
              {RankIcon ? (
                <RankIcon className={`h-5 w-5 ${rankColor}`} />
              ) : (
                <span className="text-sm font-medium text-muted-foreground">
                  {entry.rank}
                </span>
              )}
            </div>

            {/* Avatar */}
            <Avatar className="h-8 w-8">
              <AvatarImage src={entry.profileImageUrl || undefined} alt={displayName} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-sm">{displayName}</p>
            </div>

            {/* Points */}
            <Badge
              variant={entry.rank <= 3 ? "default" : "secondary"}
              className={entry.rank === 1 ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" : ""}
            >
              {entry.points.toLocaleString()} pts
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
