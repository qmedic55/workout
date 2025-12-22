import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import {
  PartyPopper,
  Flame,
  Trophy,
  Sparkles,
  Star,
  Utensils,
  Dumbbell,
  TrendingUp,
  Award,
} from "lucide-react";

interface Milestone {
  key: string;
  achieved: boolean;
  achievedAt: string | null;
  seen: boolean;
  data: Record<string, unknown> | null;
}

interface MilestonesResponse {
  milestones: Milestone[];
  unseenCount: number;
  nextMilestone: { key: string; requiredAction: string } | null;
}

interface FirstWeekReport {
  loggingStats: { daysLogged: number; mealsLogged: number };
  nutritionStats: { avgCalories: number; avgProtein: number; proteinPercent: number };
  activityStats: { avgSteps: number; workoutsCompleted: number };
  biofeedbackStats: { avgSleep: number; avgEnergy: number };
  coachAnalysis: { wins: string[]; focusAreas: string[]; message: string };
}

const milestoneConfig: Record<string, {
  icon: React.ReactNode;
  title: string;
  description: string;
  celebration: string;
}> = {
  first_food_log: {
    icon: <Utensils className="h-8 w-8 text-green-500" />,
    title: "First Meal Logged!",
    description: "You're building the foundation for lasting change.",
    celebration: "Consistency > perfection. Keep showing up!",
  },
  first_workout: {
    icon: <Dumbbell className="h-8 w-8 text-blue-500" />,
    title: "First Workout Complete!",
    description: "Great job getting moving!",
    celebration: "Movement is medicine. You've taken the first step!",
  },
  day_2_streak: {
    icon: <Flame className="h-8 w-8 text-orange-500" />,
    title: "2-Day Streak!",
    description: "You're back! That's what builds results.",
    celebration: "The first week is about building the habit. Show up every day, even if it's just logging one meal.",
  },
  day_3: {
    icon: <TrendingUp className="h-8 w-8 text-purple-500" />,
    title: "Day 3 Pattern Emerging!",
    description: "You're starting to build real momentum.",
    celebration: "Three days is where habits start to form. You're on your way!",
  },
  first_week: {
    icon: <Trophy className="h-8 w-8 text-yellow-500" />,
    title: "First Week Complete!",
    description: "You crushed your first week!",
    celebration: "A full week of consistency. This is how lasting change happens!",
  },
};

function MilestoneDialog({
  milestone,
  isOpen,
  onClose,
  onDismiss,
}: {
  milestone: Milestone;
  isOpen: boolean;
  onClose: () => void;
  onDismiss: () => void;
}) {
  const config = milestoneConfig[milestone.key];
  const queryClient = useQueryClient();

  // Fetch first week report if this is the first_week milestone
  const { data: weekReport } = useQuery<FirstWeekReport>({
    queryKey: ["/api/first-week-report"],
    enabled: milestone.key === "first_week" && isOpen,
  });

  const markSeenMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/milestones/${milestone.key}/seen`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/milestones"] });
    },
  });

  const handleDismiss = () => {
    markSeenMutation.mutate();
    onDismiss();
    onClose();
  };

  if (!config) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 animate-ping opacity-20 rounded-full bg-primary" />
              <div className="relative p-4 rounded-full bg-primary/10">
                {config.icon}
              </div>
            </div>
          </div>
          <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2">
            <PartyPopper className="h-6 w-6 text-yellow-500" />
            {config.title}
            <PartyPopper className="h-6 w-6 text-yellow-500 scale-x-[-1]" />
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* First week report details */}
          {milestone.key === "first_week" && weekReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-muted/50">
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold">{weekReport.loggingStats.daysLogged}/7</p>
                    <p className="text-xs text-muted-foreground">Days Logged</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold">{weekReport.loggingStats.mealsLogged}</p>
                    <p className="text-xs text-muted-foreground">Meals Logged</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold">{weekReport.activityStats.workoutsCompleted}</p>
                    <p className="text-xs text-muted-foreground">Workouts</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold">{weekReport.nutritionStats.proteinPercent}%</p>
                    <p className="text-xs text-muted-foreground">Protein Target</p>
                  </CardContent>
                </Card>
              </div>

              {weekReport.coachAnalysis.wins.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Wins This Week
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {weekReport.coachAnalysis.wins.map((win, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {win}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3">
                  <p className="text-sm flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="italic">{weekReport.coachAnalysis.message}</span>
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Standard milestone celebration */}
          {milestone.key !== "first_week" && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <p className="text-sm flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="italic">{config.celebration}</span>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick tip for first food log */}
          {milestone.key === "first_food_log" && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p className="font-medium mb-1">Quick tip:</p>
              <p>Log meals right after eating - it takes 10 seconds and builds the habit. Don't wait until end of day!</p>
            </div>
          )}
        </div>

        <Button onClick={handleDismiss} className="w-full">
          {milestone.key === "first_week" ? "Start Week 2" : "Got it!"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function MilestoneCelebration() {
  const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { data: milestonesData } = useQuery<MilestonesResponse>({
    queryKey: ["/api/milestones"],
    refetchInterval: 30000, // Check every 30 seconds for new milestones
  });

  useEffect(() => {
    if (milestonesData?.milestones) {
      // Find first unseen achieved milestone
      const unseenMilestone = milestonesData.milestones.find(
        (m) => m.achieved && !m.seen
      );

      if (unseenMilestone && !currentMilestone) {
        setCurrentMilestone(unseenMilestone);
        setIsOpen(true);
      }
    }
  }, [milestonesData, currentMilestone]);

  const handleDismiss = () => {
    setCurrentMilestone(null);
  };

  if (!currentMilestone) return null;

  return (
    <MilestoneDialog
      milestone={currentMilestone}
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onDismiss={handleDismiss}
    />
  );
}

// Export a component to show milestone progress
export function MilestoneProgress() {
  const { data: milestonesData } = useQuery<MilestonesResponse>({
    queryKey: ["/api/milestones"],
  });

  if (!milestonesData) return null;

  const achieved = milestonesData.milestones.filter((m) => m.achieved).length;
  const total = milestonesData.milestones.length;

  if (achieved === total) return null; // All done, hide progress

  return (
    <Card className="bg-muted/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            First Week Journey
          </p>
          <Badge variant="secondary" className="text-xs">
            {achieved}/{total}
          </Badge>
        </div>
        <div className="flex gap-1">
          {milestonesData.milestones.map((m) => (
            <div
              key={m.key}
              className={`h-2 flex-1 rounded-full ${
                m.achieved ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        {milestonesData.nextMilestone && (
          <p className="text-xs text-muted-foreground mt-2">
            Next: {milestonesData.nextMilestone.requiredAction}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
