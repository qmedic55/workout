import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Globe,
  Lock,
  User,
  Target,
  Flame,
  Dumbbell,
  TrendingUp,
  Trophy,
  Scale,
  Check,
  X,
  Loader2,
  Copy,
  ExternalLink,
} from "lucide-react";
import type { PublicProfile } from "@shared/schema";

interface UsernameCheckResult {
  available: boolean;
  reason: string | null;
}

export function PublicProfileSettings() {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [showWeight, setShowWeight] = useState(false);
  const [showGoals, setShowGoals] = useState(true);
  const [showStreaks, setShowStreaks] = useState(true);
  const [showWorkoutStats, setShowWorkoutStats] = useState(true);
  const [showProgress, setShowProgress] = useState(false);
  const [showMilestones, setShowMilestones] = useState(true);
  const [usernameDebounce, setUsernameDebounce] = useState("");

  const { data: profile, isLoading } = useQuery<PublicProfile | null>({
    queryKey: ["/api/public-profile"],
  });

  // Initialize form with existing data
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setDisplayName(profile.displayName || "");
      setBio(profile.bio || "");
      setIsPublic(profile.isPublic || false);
      setShowWeight(profile.showWeight || false);
      setShowGoals(profile.showGoals ?? true);
      setShowStreaks(profile.showStreaks ?? true);
      setShowWorkoutStats(profile.showWorkoutStats ?? true);
      setShowProgress(profile.showProgress || false);
      setShowMilestones(profile.showMilestones ?? true);
    }
  }, [profile]);

  // Debounce username check
  useEffect(() => {
    const timer = setTimeout(() => {
      setUsernameDebounce(username);
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  // Check username availability
  const { data: usernameCheck, isLoading: isCheckingUsername } = useQuery<UsernameCheckResult>({
    queryKey: ["/api/public-profile/check", usernameDebounce],
    enabled: usernameDebounce.length >= 3,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<PublicProfile>) => {
      const response = await apiRequest("POST", "/api/public-profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/public-profile"] });
      toast({
        title: "Profile saved",
        description: "Your public profile settings have been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      username: username || undefined,
      displayName: displayName || undefined,
      bio: bio || undefined,
      isPublic,
      showWeight,
      showGoals,
      showStreaks,
      showWorkoutStats,
      showProgress,
      showMilestones,
    });
  };

  const handleCopyLink = async () => {
    const url = `https://vitalpath.app/u/${username}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Profile URL copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const usernameValid = username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
  const usernameAvailable = usernameCheck?.available ?? true;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Public Profile
          </CardTitle>
          <CardDescription>
            Share your fitness journey with a public profile URL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Public Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Globe className="h-5 w-5 text-primary" />
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">
                  {isPublic ? "Profile is Public" : "Profile is Private"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isPublic
                    ? "Anyone can view your profile at your URL"
                    : "Only you can see your profile"}
                </p>
              </div>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                vitalpath.app/u/
              </span>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="yourname"
                className="pl-[120px]"
                maxLength={30}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isCheckingUsername ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : username.length >= 3 ? (
                  usernameAvailable ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )
                ) : null}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              3-30 characters, letters, numbers, and underscores only
            </p>
            {username.length >= 3 && !usernameAvailable && (
              <p className="text-xs text-red-500">{usernameCheck?.reason}</p>
            )}
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              maxLength={50}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about your fitness journey..."
              rows={3}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/300
            </p>
          </div>

          {/* Profile URL Preview */}
          {username && usernameValid && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <ExternalLink className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-mono flex-1 truncate">
                vitalpath.app/u/{username}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Privacy Controls</CardTitle>
          <CardDescription>
            Choose what information to show on your public profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PrivacyToggle
            icon={Target}
            label="Goals"
            description="Show active and completed goals"
            checked={showGoals}
            onCheckedChange={setShowGoals}
          />
          <PrivacyToggle
            icon={Flame}
            label="Streaks"
            description="Display your current logging streak"
            checked={showStreaks}
            onCheckedChange={setShowStreaks}
          />
          <PrivacyToggle
            icon={Dumbbell}
            label="Workout Stats"
            description="Show workouts completed in last 30 days"
            checked={showWorkoutStats}
            onCheckedChange={setShowWorkoutStats}
          />
          <PrivacyToggle
            icon={Trophy}
            label="Milestones"
            description="Display completed milestones count"
            checked={showMilestones}
            onCheckedChange={setShowMilestones}
          />
          <PrivacyToggle
            icon={TrendingUp}
            label="Progress"
            description="Show weight change over last 30 days"
            checked={showProgress}
            onCheckedChange={setShowProgress}
            sensitive
          />
          <PrivacyToggle
            icon={Scale}
            label="Weight"
            description="Display current and target weight"
            checked={showWeight}
            onCheckedChange={setShowWeight}
            sensitive
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saveMutation.isPending || (username.length >= 3 && !usernameAvailable)}
        className="w-full"
      >
        {saveMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Saving...
          </>
        ) : (
          "Save Profile Settings"
        )}
      </Button>
    </div>
  );
}

function PrivacyToggle({
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
  sensitive = false,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  sensitive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{label}</span>
            {sensitive && (
              <Badge variant="outline" className="text-xs">
                Sensitive
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
