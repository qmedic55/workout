import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { useTimezoneSync } from "@/hooks/use-timezone-sync";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Activity, Brain, Heart, Sparkles } from "lucide-react";
import { MobileNav } from "@/components/mobile-nav";
import { useAppleAuth } from "@/hooks/use-apple-auth";

// Lazy load all page components for better initial bundle size
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Chat = lazy(() => import("@/pages/chat"));
const Onboarding = lazy(() => import("@/pages/onboarding"));
const DailyLog = lazy(() => import("@/pages/daily-log"));
const Progress = lazy(() => import("@/pages/progress"));
const Nutrition = lazy(() => import("@/pages/nutrition"));
const Workouts = lazy(() => import("@/pages/workouts"));
const Devices = lazy(() => import("@/pages/devices"));
const Learn = lazy(() => import("@/pages/learn"));
const Settings = lazy(() => import("@/pages/settings"));
const Profile = lazy(() => import("@/pages/profile"));
const Goals = lazy(() => import("@/pages/goals"));
const Playground = lazy(() => import("@/pages/playground"));
const PublicProfile = lazy(() => import("@/pages/public-profile"));
const WorkoutSession = lazy(() => import("@/pages/workout-session"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Route loading fallback
function RouteLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/chat" component={Chat} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/daily-log" component={DailyLog} />
        <Route path="/progress" component={Progress} />
        <Route path="/nutrition" component={Nutrition} />
        <Route path="/workouts" component={Workouts} />
        <Route path="/devices" component={Devices} />
        <Route path="/learn" component={Learn} />
        <Route path="/settings" component={Settings} />
        <Route path="/profile" component={Profile} />
        <Route path="/goals" component={Goals} />
        <Route path="/playground" component={Playground} />
        <Route path="/workout-session" component={WorkoutSession} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function LandingPage() {
  const { signInWithApple, isLoading: appleLoading, isAppleSignInAvailable } = useAppleAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between gap-4 px-6 h-16 border-b safe-area-inset-top">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">VitalPath</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!isAppleSignInAvailable && (
            <Button asChild data-testid="button-login">
              <a href="/api/login">Sign In</a>
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full space-y-12 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Your Holistic Health Journey Starts Here
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              AI-powered coaching for body recomposition and metabolic recovery,
              designed specifically for adults 40 and beyond.
            </p>
            <div className="flex flex-col items-center gap-3 mt-6">
              {isAppleSignInAvailable ? (
                <Button
                  size="lg"
                  onClick={signInWithApple}
                  disabled={appleLoading}
                  className="bg-black hover:bg-gray-800 text-white w-full max-w-xs"
                  data-testid="button-apple-signin"
                >
                  {appleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                  )}
                  Sign in with Apple
                </Button>
              ) : (
                <Button size="lg" asChild className="w-full max-w-xs" data-testid="button-get-started">
                  <a href="/api/login">Get Started Free</a>
                </Button>
              )}
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="text-left">
              <CardHeader>
                <Brain className="h-8 w-8 text-primary mb-2" />
                <CardTitle>AI Mentor</CardTitle>
                <CardDescription>
                  Personalized guidance from an AI coach trained in metabolic science
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="text-left">
              <CardHeader>
                <Heart className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Track Everything</CardTitle>
                <CardDescription>
                  Log nutrition, workouts, sleep, stress, and biometrics in one place
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="text-left">
              <CardHeader>
                <Sparkles className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Smart Insights</CardTitle>
                <CardDescription>
                  Connect wearables and get data-driven recommendations
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  // Sync user's timezone to server on first load
  useTimezoneSync();

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        {/* Sidebar hidden on mobile, visible on md+ */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 px-4 h-14 border-b bg-background shrink-0 sticky top-0 z-50 safe-area-inset-top">
            <SidebarTrigger data-testid="button-sidebar-toggle" className="hidden md:flex" />
            <div className="flex items-center gap-2 md:hidden">
              <Activity className="h-5 w-5 text-primary" />
              <span className="font-semibold">VitalPath</span>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto pb-20 md:pb-0">
            <Router />
          </main>
        </div>
        {/* Mobile bottom navigation */}
        <MobileNav />
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Check if we're on a public profile route
  const isPublicProfileRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/u/');

  // Public profile pages don't require authentication
  if (isPublicProfileRoute) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Switch>
          <Route path="/u/:username" component={PublicProfile} />
        </Switch>
      </Suspense>
    );
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <AuthenticatedApp /> : <LandingPage />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
