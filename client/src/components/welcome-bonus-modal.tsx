import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Target,
  Dumbbell,
  Scale,
  Moon,
  Brain,
  MessageSquare,
  Bell,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WelcomeBonusBreakdown {
  base: number;
  targetWeight: number;
  exerciseInfo: number;
  dietingHistory: number;
  sleepInfo: number;
  stressInfo: number;
  coachingPreference: number;
  notifications: number;
  total: number;
}

interface WelcomeBonusProps {
  pointsAwarded: number;
  breakdown: WelcomeBonusBreakdown;
}

const STORAGE_KEY = "vitalpath_welcome_bonus";

export function WelcomeBonusModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [bonusData, setBonusData] = useState<WelcomeBonusProps | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setBonusData(parsed);
        setIsOpen(true);
        // Clear it so it only shows once
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // localStorage not available or invalid data
    }
  }, []);

  if (!bonusData) return null;

  const bonusItems = [
    { label: "Profile completed", points: bonusData.breakdown.base, icon: Star, always: true },
    { label: "Goal weight set", points: bonusData.breakdown.targetWeight, icon: Target },
    { label: "Exercise habits shared", points: bonusData.breakdown.exerciseInfo, icon: Dumbbell },
    { label: "Diet history shared", points: bonusData.breakdown.dietingHistory, icon: Scale },
    { label: "Sleep info provided", points: bonusData.breakdown.sleepInfo, icon: Moon },
    { label: "Stress level shared", points: bonusData.breakdown.stressInfo, icon: Brain },
    { label: "Coaching style selected", points: bonusData.breakdown.coachingPreference, icon: MessageSquare },
    { label: "Notifications enabled", points: bonusData.breakdown.notifications, icon: Bell },
  ].filter(item => item.always || item.points > 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            Welcome Bonus Earned!
          </DialogTitle>
          <DialogDescription>
            You earned points for completing your profile. The more you share, the more you earn!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Total Points */}
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
            <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
              +{bonusData.pointsAwarded}
            </p>
            <p className="text-sm text-muted-foreground mt-1">points earned</p>
          </div>

          {/* Breakdown */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Breakdown:</p>
            <div className="space-y-1.5">
              {bonusItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg",
                      item.points > 0 ? "bg-green-500/10" : "bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {item.points > 0 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={cn(
                        "text-sm",
                        item.points > 0 ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {item.label}
                      </span>
                    </div>
                    {item.points > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        +{item.points}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Streak info */}
          <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
            <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
              Day 1 streak started!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Keep logging to build your streak and earn multipliers
            </p>
          </div>
        </div>

        <Button onClick={() => setIsOpen(false)} className="w-full">
          Let's Go!
        </Button>
      </DialogContent>
    </Dialog>
  );
}
