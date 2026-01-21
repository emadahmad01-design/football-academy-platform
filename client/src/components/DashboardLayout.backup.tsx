import { useAuth } from "@/_core/hooks/useAuth";
import NotificationBell from "@/components/NotificationBell";
import { useParentChild } from "@/contexts/ParentChildContext";
import { ChildSelector } from "@/components/ChildSelector";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { 
  LayoutDashboard, 
  LogOut, 
  PanelLeft, 
  Users, 
  Activity, 
  Brain, 
  Dumbbell, 
  Apple, 
  Calendar, 
  Target, 
  Trophy, 
  BarChart3,
  Bell,
  Settings,
  UserCircle,
  Heart,
  Swords,
  Video,
  Sun,
  Moon,
  Satellite,
  XCircle,
  Film,
  TrendingUp,
  FileText,
  Network
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { AIChatWidget } from "./AIChatWidget";
import { usePermissions } from "@/hooks/usePermissions";

// Menu items with permission requirements
const getAllMenuItems = (t: (key: string) => string) => [
  { icon: LayoutDashboard, label: t("nav.dashboard"), path: "/dashboard", permission: null },
  
  // Admin/Coach Features
  { icon: Users, label: "All Players", path: "/players", permission: "view_players" },
  { icon: Video, label: t("menu.videoAnalysis"), path: "/videos", permission: "view_videos" },
  { icon: Film, label: t("menu.videoClipLibrary"), path: "/video-clip-library", permission: "view_videos" },
  { icon: Target, label: t("menu.tacticalHub"), path: "/tactical-hub", permission: "view_tactical" },
  { icon: XCircle, label: t("menu.aiEmergencyMode"), path: "/ai-emergency-mode", permission: "view_tactical" },
  { icon: FileText, label: t("menu.matchReports"), path: "/match-reports", permission: "view_matches" },
  { icon: Brain, label: t("menu.opponentAnalysis"), path: "/opponent-video-analysis", permission: "view_videos" },
  { icon: TrendingUp, label: t("menu.xgAnalytics"), path: "/xg-analytics", permission: "view_analytics" },
  { icon: BarChart3, label: t("menu.analytics"), path: "/analytics", permission: "view_analytics" },
  { icon: Satellite, label: t("menu.gpsTracker"), path: "/gps-tracker", permission: "view_performance" },
  { icon: Activity, label: "PlayerMaker", path: "/playermaker", permission: "view_performance" },
  { icon: Swords, label: t("menu.matchManagement"), path: "/matches", permission: "view_matches" },
  { icon: Target, label: t("menu.recordMatchEvents"), path: "/match-event-recording", permission: "create_matches" },
  { icon: Trophy, label: t("menu.leagueFixtures"), path: "/league", permission: "view_matches" },
  { icon: FileText, label: t("menu.footballLaws"), path: "/coach-education/laws", permission: "view_education" },
  { icon: Trophy, label: t("menu.coachingCourses"), path: "/coach-education/courses", permission: "view_education" },
  { icon: Video, label: t("menu.trainingVideos"), path: "/coach-education/videos", permission: "view_education" },
  { icon: Trophy, label: t("menu.coachAssessment"), path: "/coach-assessment", permission: "view_education" },
  { icon: Trophy, label: t("menu.coachDashboard"), path: "/coach-dashboard", permission: "view_analytics" },
  { icon: BarChart3, label: "Advanced Analytics", path: "/data-analysis-pro", permission: "view_analytics" },
  { icon: Brain, label: "AI Coach Assistant", path: "/ai-coach", permission: "view_tactical" },
  { icon: Brain, label: "AI Match Coach", path: "/ai-match-coach", permission: "view_tactical" },
  { icon: Target, label: "Heatmap Analysis", path: "/professional-heatmap", permission: "view_analytics" },
  { icon: Network, label: "Pass Network", path: "/pass-network", permission: "view_analytics" },
  { icon: Target, label: "Professional Tactical Board", path: "/professional-tactical-board", permission: "view_tactical" },
  
  // Staff Features
  { icon: Activity, label: "Performance", path: "/performance", permission: "view_performance" },
  { icon: Brain, label: "Mental Coaching", path: "/mental", permission: "view_mental" },
  { icon: Dumbbell, label: "Physical Training", path: "/physical", permission: "view_physical" },
  { icon: Apple, label: "Nutrition", path: "/nutrition", permission: "view_nutrition" },
  { icon: Calendar, label: "Training Sessions", path: "/training", permission: "view_training" },
  
  // Parent Features
  { icon: UserCircle, label: "My Child", path: "/parent-portal", permission: "view_child" },
  
  // Player Features
  { icon: Activity, label: "My Performance", path: "/my-performance", permission: null },
  { icon: Target, label: "My Goals", path: "/my-goals", permission: null },
  { icon: Calendar, label: "Schedule", path: "/schedule", permission: null },
  { icon: Trophy, label: "Achievements", path: "/achievements", permission: null },
  
  // Admin Features
  { icon: Settings, label: "Settings", path: "/settings", permission: "manage_settings" },
  { icon: LayoutDashboard, label: "Data Management", path: "/admin/data-management", permission: "manage_settings" },
  { icon: FileText, label: "Home Content", path: "/admin/home-content", permission: "manage_settings" },
];

// Legacy function for backward compatibility
const getMenuItems = (role: string, t: (key: string) => string) => {
  const baseItems = [
    { icon: LayoutDashboard, label: t("nav.dashboard"), path: "/dashboard" },
  ];

  // Admin/Coach only - Advanced features
  const adminCoachItems = [
    { icon: Users, label: "All Players", path: "/players" },
    { icon: Video, label: t("menu.videoAnalysis"), path: "/videos" },
    { icon: Film, label: t("menu.videoClipLibrary"), path: "/video-clip-library" },
    { icon: Target, label: t("menu.tacticalHub"), path: "/tactical-hub" },
    { icon: XCircle, label: t("menu.aiEmergencyMode"), path: "/ai-emergency-mode" },
    { icon: FileText, label: t("menu.matchReports"), path: "/match-reports" },
    { icon: Brain, label: t("menu.opponentAnalysis"), path: "/opponent-video-analysis" },
    { icon: TrendingUp, label: t("menu.xgAnalytics"), path: "/xg-analytics" },
    { icon: BarChart3, label: t("menu.analytics"), path: "/analytics" },
    { icon: Satellite, label: t("menu.gpsTracker"), path: "/gps-tracker" },
    { icon: Activity, label: "PlayerMaker", path: "/playermaker" },
    { icon: Swords, label: t("menu.matchManagement"), path: "/matches" },
    { icon: Target, label: t("menu.recordMatchEvents"), path: "/match-event-recording" },
    { icon: Trophy, label: t("menu.leagueFixtures"), path: "/league" },
    { icon: FileText, label: t("menu.footballLaws"), path: "/coach-education/laws" },
    { icon: Trophy, label: t("menu.coachingCourses"), path: "/coach-education/courses" },
    { icon: Video, label: t("menu.trainingVideos"), path: "/coach-education/videos" },
    { icon: Trophy, label: t("menu.coachAssessment"), path: "/coach-assessment" },
    { icon: Trophy, label: t("menu.coachDashboard"), path: "/coach-dashboard" },
    { icon: BarChart3, label: "Advanced Analytics", path: "/data-analysis-pro" },
    { icon: Brain, label: "AI Coach Assistant", path: "/ai-coach" },
    { icon: Brain, label: "AI Match Coach", path: "/ai-match-coach" },
    { icon: Target, label: "Heatmap Analysis", path: "/professional-heatmap" },
    { icon: Network, label: "Pass Network", path: "/pass-network" },
    { icon: Target, label: "Professional Tactical Board", path: "/professional-tactical-board" },
  ];

  // Staff items - Available to coaches and specialists
  const staffItems = [
    { icon: Activity, label: "Performance", path: "/performance" },
    { icon: Brain, label: "Mental Coaching", path: "/mental" },
    { icon: Dumbbell, label: "Physical Training", path: "/physical" },
    { icon: Apple, label: "Nutrition", path: "/nutrition" },
    { icon: Calendar, label: "Training Sessions", path: "/training" },
  ];

  // Parent items - Basic tabs only
  const parentItems = [
    { icon: UserCircle, label: "My Child", path: "/parent-portal" },
    { icon: Activity, label: "Performance", path: "/parent-portal" },
    { icon: Calendar, label: "Schedule", path: "/parent-portal" },
    { icon: Apple, label: "Nutrition", path: "/parent-portal" },
    { icon: Heart, label: "Wellness", path: "/parent-portal" },
    { icon: Bell, label: "Notifications", path: "/parent-portal" },
  ];

  const playerItems = [
    { icon: Activity, label: "My Performance", path: "/my-performance" },
    { icon: Target, label: "My Goals", path: "/my-goals" },
    { icon: Calendar, label: "Schedule", path: "/schedule" },
    { icon: Trophy, label: "Achievements", path: "/achievements" },
  ];

  const adminItems = [
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  if (role === 'admin') {
    return [...baseItems, ...adminCoachItems, ...staffItems, ...adminItems];
  } else if (role === 'coach') {
    return [...baseItems, ...adminCoachItems, ...staffItems];
  } else if (['nutritionist', 'mental_coach', 'physical_trainer'].includes(role)) {
    return [...baseItems, ...staffItems];
  } else if (role === 'parent') {
    return [...baseItems, ...parentItems];
  } else if (role === 'player') {
    return [...baseItems, ...playerItems];
  }
  
  return baseItems;
};

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen gradient-hero">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center">
              <Heart className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-center">
              Future Stars FC
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Sign in to access the player development platform and track your journey to excellence.
            </p>
          </div>
          <Button
            onClick={() => {
              const loginUrl = getLoginUrl();
              console.log('[Auth] Redirecting to login:', loginUrl);
              // Use window.location.assign for proper navigation
              window.location.assign(loginUrl);
            }}
            size="lg"
            className="w-full gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all"
          >
            Sign in to Continue
          </Button>
        </div>
      </div>
    );
  }

  // Check if user account is pending approval
  if (user.accountStatus === 'pending') {
    window.location.href = '/pending-approval';
    return null;
  }

  // Check if parent needs onboarding
  if (user.role === 'parent' && !user.onboardingCompleted) {
    window.location.href = '/parent-onboarding';
    return null;
  }

  // Check if user account was rejected
  if (user.accountStatus === 'rejected') {
    return (
      <div className="flex items-center justify-center min-h-screen gradient-hero">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-center">
              Account Not Approved
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Your registration request was not approved. Please contact the academy administrators for more information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

// Theme Toggle Button Component
function ChildSelectorInHeader() {
  const { selectedChildId, setSelectedChildId } = useParentChild();
  return (
    <ChildSelector
      selectedChildId={selectedChildId || ''}
      onChildChange={setSelectedChildId}
      className="text-xs"
    />
  );
}

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 rounded-lg"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-primary" />
      ) : (
        <Moon className="h-5 w-5 text-primary" />
      )}
    </Button>
  );
}

function LanguageToggleButton() {
  const { language, setLanguage } = useLanguage();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
      className="h-9 px-3 rounded-lg font-medium"
    >
      {language === 'en' ? 'عربي' : 'English'}
    </Button>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const { t, language, setLanguage } = useLanguage();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { hasPermission, canAccessTab, isLoading: permissionsLoading } = usePermissions();
  
  // Get all menu items and filter by permissions
  const allMenuItems = getAllMenuItems(t);
  const menuItems = allMenuItems.filter(item => {
    // Always show items with no permission requirement
    if (!item.permission) return true;
    // Check if user has the required permission
    return hasPermission(item.permission) || canAccessTab(item.path);
  });
  
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      admin: 'bg-primary/20 text-primary',
      coach: 'bg-chart-2/20 text-chart-2',
      nutritionist: 'bg-chart-3/20 text-chart-3',
      mental_coach: 'bg-chart-4/20 text-chart-4',
      physical_trainer: 'bg-chart-1/20 text-chart-1',
      parent: 'bg-accent/20 text-accent',
      player: 'bg-muted text-muted-foreground',
    };
    return roleColors[role] || roleColors.player;
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b border-sidebar-border">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <img 
                    src="/future-stars-fc-logo.png" 
                    alt="Future Stars FC" 
                    className="w-8 h-8 object-contain shrink-0"
                  />
                  <span className="font-bold tracking-tight truncate text-sm">
                    Future Stars FC
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2">
            <SidebarMenu className="px-2">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal ${isActive ? 'bg-sidebar-accent' : ''}`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <span className={isActive ? 'text-foreground font-medium' : ''}>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-sidebar-border">
            <div className="flex items-center justify-between mb-2 group-data-[collapsible=icon]:justify-center">
              <span className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">Theme</span>
              <ThemeToggleButton />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-sidebar-accent transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border border-sidebar-border shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-primary/20 text-primary">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "User"}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${getRoleBadge(user?.role || 'player')}`}>
                        {user?.role?.replace('_', ' ') || 'Player'}
                      </span>
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setLocation('/notifications')}
                  className="cursor-pointer"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Notifications</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b border-border h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground font-medium">
                    {activeMenuItem?.label ?? "Dashboard"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user?.role === 'parent' && <ChildSelectorInHeader />}
              <NotificationBell />
              <LanguageToggleButton />
              <ThemeToggleButton />
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
        <AIChatWidget />
      </SidebarInset>
    </>
  );
}
