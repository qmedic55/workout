import { Link, useLocation } from "wouter";
import { Home, MessageSquare, Utensils, Dumbbell, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/nutrition", icon: Utensils, label: "Food" },
  { href: "/chat", icon: MessageSquare, label: "Coach" },
  { href: "/workouts", icon: Dumbbell, label: "Train" },
  { href: "/progress", icon: BarChart3, label: "Progress" },
];

export function MobileNav() {
  const [location] = useLocation();

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
      </div>
    </nav>
  );
}
