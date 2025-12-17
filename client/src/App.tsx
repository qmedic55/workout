import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Activity, Brain, Heart, Sparkles } from "lucide-react";
import { MobileNav } from "@/components/mobile-nav";

import Dashboard from "@/pages/dashboard";
import Chat from "@/pages/chat";
import Onboarding from "@/pages/onboarding";
import DailyLog from "@/pages/daily-log";
import Progress from "@/pages/progress";
import Nutrition from "@/pages/nutrition";
import Workouts from "@/pages/workouts";
import Devices from "@/pages/devices";
import Learn from "@/pages/learn";
import Settings from "@/pages/settings";
import Playground from "@/pages/playground";
import NotFound from "@/pages/not-found";

function Router() {
  return (
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
      <Route path="/playground" component={Playground} />
      <Route component={NotFound} />
    </Switch>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between gap-4 px-6 h-16 border-b">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">VitalPath</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild data-testid="button-login">
            <a href="/api/login">Sign In</a>
          </Button>
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
            <Button size="lg" asChild className="mt-4" data-testid="button-get-started">
              <a href="/api/login">Get Started Free</a>
            </Button>
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
