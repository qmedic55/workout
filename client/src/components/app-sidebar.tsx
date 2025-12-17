import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  MessageCircle,
  TrendingUp,
  Utensils,
  Dumbbell,
  BookOpen,
  Settings,
  Watch,
  ClipboardList,
  Blocks,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { NotificationBell } from "@/components/notification-bell";

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "AI Mentor",
    url: "/chat",
    icon: MessageCircle,
  },
  {
    title: "Progress",
    url: "/progress",
    icon: TrendingUp,
  },
  {
    title: "Daily Log",
    url: "/daily-log",
    icon: ClipboardList,
  },
];

const trackingItems = [
  {
    title: "Nutrition",
    url: "/nutrition",
    icon: Utensils,
  },
  {
    title: "Workouts",
    url: "/workouts",
    icon: Dumbbell,
  },
  {
    title: "Devices",
    url: "/devices",
    icon: Watch,
  },
];

const resourceItems = [
  {
    title: "Learn",
    url: "/learn",
    icon: BookOpen,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  ...(import.meta.env.DEV
    ? [
        {
          title: "Playground",
          url: "/playground",
          icon: Blocks,
        },
      ]
    : []),
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer" data-testid="link-home">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">V</span>
              </div>
              <div>
                <h1 className="font-semibold text-lg leading-none">VitalPath</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Health Mentor 40+</p>
              </div>
            </div>
          </Link>
          <NotificationBell />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                  >
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(" ", "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tracking</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {trackingItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                  >
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(" ", "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Resources</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {resourceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                  >
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(" ", "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="text-xs text-muted-foreground text-center">
          Your holistic health journey
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
