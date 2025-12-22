import { Link, useLocation } from "wouter";
import { Home, MessageSquare, Utensils, Dumbbell, User, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/nutrition", icon: Utensils, label: "Food" },
  { href: "/chat", icon: MessageSquare, label: "Coach" },
  { href: "/workouts", icon: Dumbbell, label: "Train" },
];

export function MobileNav() {
  const [location] = useLocation();
  const isProfileActive = location === "/profile" || location === "/settings";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden z-50 safe-area-inset-bottom"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-16 h-full",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Profile dropdown for mobile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-16 h-full",
                isProfileActive ? "text-primary" : "text-muted-foreground"
              )}
              aria-label="Profile menu"
              data-testid="nav-profile"
            >
              <User className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs font-medium">Profile</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-48 mb-2">
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer w-full">
                <User className="mr-2 h-4 w-4" />
                View Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer w-full">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={() => window.location.href = "/api/logout"}
              data-testid="mobile-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
