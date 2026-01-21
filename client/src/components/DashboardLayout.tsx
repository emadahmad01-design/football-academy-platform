import { useAuth } from "@/_core/hooks/useAuth";
import NotificationBell from "@/components/NotificationBell";
import { useParentChild } from "@/contexts/ParentChildContext";
import { ChildSelector } from "@/components/ChildSelector";
import { TeamSwitcher } from "@/components/TeamSwitcher";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { 
  LayoutDashboard, 
  LogOut, 
  Users, 
  Activity, 
  Brain, 
  Dumbbell, 
  Apple, 
  Calendar, 
  Target, 
  Trophy, 
  BarChart3,
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
  Network,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  MessageSquare,
  Shield,
  Zap,
  ClipboardList,
  Map,
  Gamepad2,
  BookOpen,
  Users2,
  Flame,
  Gift,
  Home,
  Globe,
  Compass,
  Star
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { AIChatWidget } from "./AIChatWidget";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

// Define the team-specific items that appear in both Main Team and Academy Team modules
const getTeamModuleItems = (language: string, teamPrefix: string) => [
  { icon: Users, label: language === 'ar' ? 'اللاعبين' : 'Players', path: `/${teamPrefix}/players` },
  { icon: Activity, label: language === 'ar' ? 'الأداء' : 'Performance', path: `/${teamPrefix}/performance` },
  { icon: Calendar, label: language === 'ar' ? 'التدريب' : 'Training', path: `/${teamPrefix}/training` },
  { icon: Swords, label: language === 'ar' ? 'المباريات' : 'Matches', path: `/${teamPrefix}/matches` },
  { icon: Video, label: language === 'ar' ? 'الفيديو' : 'Videos', path: `/${teamPrefix}/videos` },
  { icon: BarChart3, label: language === 'ar' ? 'التحليلات' : 'Analytics', path: `/${teamPrefix}/analytics` },
];

// Module-based navigation structure
const getModules = (t: (key: string) => string, language: string, userTeamType?: string | null) => {
  const baseModules = [
    {
      id: 'dashboard',
      label: language === 'ar' ? 'لوحة التحكم' : 'Dashboard',
      icon: LayoutDashboard,
      items: [
        { icon: LayoutDashboard, label: language === 'ar' ? 'الرئيسية' : 'Overview', path: '/dashboard' },
        { icon: Trophy, label: language === 'ar' ? 'لوحة المدرب' : 'Coach Dashboard', path: '/coach-dashboard' },
      ]
    },
    // Main Team Module
    {
      id: 'main-team',
      label: language === 'ar' ? 'الفريق الأول' : 'Main Team',
      icon: Trophy,
      teamType: 'main',
      items: [
        { icon: LayoutDashboard, label: language === 'ar' ? 'لوحة التحكم' : 'Dashboard', path: '/team-dashboard?team=main' },
        { icon: Users, label: language === 'ar' ? 'اللاعبين' : 'Players', path: '/players?team=main' },
        { icon: Activity, label: language === 'ar' ? 'الأداء' : 'Performance', path: '/performance?team=main' },
        { icon: Calendar, label: language === 'ar' ? 'التدريب' : 'Training', path: '/training?team=main' },
        { icon: Swords, label: language === 'ar' ? 'المباريات' : 'Matches', path: '/matches?team=main' },
        { icon: Video, label: language === 'ar' ? 'الفيديو' : 'Videos', path: '/videos?team=main' },
        { icon: BarChart3, label: language === 'ar' ? 'التحليلات' : 'Analytics', path: '/analytics?team=main' },
        { icon: Target, label: language === 'ar' ? 'التكتيكات' : 'Tactics', path: '/professional-tactical-board?team=main' },
        { icon: Brain, label: language === 'ar' ? 'أدوات AI' : 'AI Tools', path: '/ai-coach?team=main' },
      ]
    },
    // Academy Team Module
    {
      id: 'academy-team',
      label: language === 'ar' ? 'فريق الأكاديمية' : 'Academy Team',
      icon: Shield,
      teamType: 'academy',
      items: [
        { icon: LayoutDashboard, label: language === 'ar' ? 'لوحة التحكم' : 'Dashboard', path: '/team-dashboard?team=academy' },
        { icon: Users, label: language === 'ar' ? 'اللاعبين' : 'Players', path: '/players?team=academy' },
        { icon: Activity, label: language === 'ar' ? 'الأداء' : 'Performance', path: '/performance?team=academy' },
        { icon: Calendar, label: language === 'ar' ? 'التدريب' : 'Training', path: '/training?team=academy' },
        { icon: Swords, label: language === 'ar' ? 'المباريات' : 'Matches', path: '/matches?team=academy' },
        { icon: Video, label: language === 'ar' ? 'الفيديو' : 'Videos', path: '/videos?team=academy' },
        { icon: BarChart3, label: language === 'ar' ? 'التحليلات' : 'Analytics', path: '/analytics?team=academy' },
        { icon: Target, label: language === 'ar' ? 'التكتيكات' : 'Tactics', path: '/professional-tactical-board?team=academy' },
        { icon: Brain, label: language === 'ar' ? 'أدوات AI' : 'AI Tools', path: '/ai-coach?team=academy' },
      ]
    },
    {
      id: 'players',
      label: language === 'ar' ? 'إدارة اللاعبين' : 'Player Management',
      icon: Users,
      items: [
        { icon: Users, label: language === 'ar' ? 'جميع اللاعبين' : 'All Players', path: '/players' },
        { icon: Activity, label: language === 'ar' ? 'الأداء' : 'Performance', path: '/performance' },
        { icon: ClipboardList, label: language === 'ar' ? 'تقييم المهارات' : 'Skill Assessment', path: '/skill-assessment' },
        { icon: TrendingUp, label: language === 'ar' ? 'مقارنة اللاعبين' : 'Player Comparison', path: '/coach/player-comparison' },
      ]
    },
    {
      id: 'training',
      label: language === 'ar' ? 'التدريب' : 'Training',
      icon: Calendar,
      items: [
        { icon: Calendar, label: language === 'ar' ? 'التدريب' : 'Training', path: '/training' },
        { icon: BookOpen, label: language === 'ar' ? 'مكتبة التدريب' : 'Training Library', path: '/training-library' },
        { icon: Users, label: language === 'ar' ? 'التدريب الخاص' : 'Private Training', path: '/private-training' },
        { icon: Calendar, label: language === 'ar' ? 'حجوزاتي' : 'My Bookings', path: '/my-bookings' },
        { icon: Calendar, label: language === 'ar' ? 'التوفر' : 'Availability', path: '/coach-availability' },
        { icon: Compass, label: language === 'ar' ? 'استكشف' : 'Explore', path: '/explore' },
        { icon: Globe, label: language === 'ar' ? 'بوابة المواهب' : 'Talent Portal', path: '/talent-portal' },
      ]
    },
    {
      id: 'matches',
      label: language === 'ar' ? 'المباريات والتكتيكات' : 'Match & Tactics',
      icon: Swords,
      items: [
        { icon: Swords, label: language === 'ar' ? 'إدارة المباريات' : 'Match Management', path: '/matches' },
        { icon: Gamepad2, label: language === 'ar' ? 'وضع المباراة الحية' : 'Live Match Mode', path: '/coach/live-match' },
        { icon: Target, label: language === 'ar' ? 'اللوحة التكتيكية' : 'Tactical Board', path: '/professional-tactical-board' },
        { icon: Users2, label: language === 'ar' ? 'بناء التشكيلة' : 'Formation Builder', path: '/formation-builder' },
        { icon: Target, label: language === 'ar' ? 'مصمم الكرات الثابتة' : 'Set Piece Designer', path: '/set-piece-designer' },
        { icon: ClipboardList, label: language === 'ar' ? 'تسجيل أحداث المباراة' : 'Record Match Events', path: '/match-event-recording' },
        { icon: Trophy, label: language === 'ar' ? 'جدول الدوري' : 'League Fixtures', path: '/league' },
      ]
    },
    {
      id: 'video',
      label: language === 'ar' ? 'تحليل الفيديو' : 'Video Analysis',
      icon: Video,
      items: [
        { icon: Video, label: language === 'ar' ? 'مكتبة الفيديو' : 'Video Library', path: '/videos' },
        { icon: Film, label: language === 'ar' ? 'مقاطع الفيديو' : 'Video Clips', path: '/video-clip-library' },
        { icon: Brain, label: language === 'ar' ? 'تحليل الفيديو AI' : 'AI Video Analysis', path: '/coach/ai-video-analysis' },
        { icon: Map, label: language === 'ar' ? 'خريطة الحرارة' : 'Heatmap Analysis', path: '/professional-heatmap' },
        { icon: Network, label: language === 'ar' ? 'شبكة التمريرات' : 'Pass Network', path: '/pass-network' },
      ]
    },
    {
      id: 'ai',
      label: language === 'ar' ? 'أدوات الذكاء الاصطناعي' : 'AI Tools',
      icon: Brain,
      items: [
        { icon: Zap, label: language === 'ar' ? 'مركز الميزات' : 'Features Hub', path: '/features-hub' },
        { icon: Brain, label: language === 'ar' ? 'مساعد المدرب AI' : 'AI Coach Assistant', path: '/ai-coach' },
        { icon: Zap, label: language === 'ar' ? 'مدرب المباراة AI' : 'AI Match Coach', path: '/ai-match-coach' },
        { icon: XCircle, label: language === 'ar' ? 'وضع الطوارئ AI' : 'AI Emergency Mode', path: '/ai-emergency-mode' },
        { icon: TrendingUp, label: language === 'ar' ? 'توقع الأداء' : 'Performance Prediction', path: '/coach/performance-prediction' },
        { icon: Users2, label: language === 'ar' ? 'محاكاة التشكيلة' : 'Formation Simulation', path: '/coach/ai-formation-simulation' },
        { icon: Calendar, label: language === 'ar' ? 'التقويم الذكي' : 'AI Calendar', path: '/coach/ai-calendar' },
      ]
    },
    {
      id: 'analytics',
      label: language === 'ar' ? 'التحليلات والتقارير' : 'Analytics & Reports',
      icon: BarChart3,
      items: [
        { icon: BarChart3, label: language === 'ar' ? 'تحليلات الأداء' : 'Performance Analytics', path: '/analytics' },
        { icon: TrendingUp, label: language === 'ar' ? 'تحليلات xG' : 'xG Analytics', path: '/xg-analytics' },
        { icon: FileText, label: language === 'ar' ? 'تقارير المباريات' : 'Match Reports', path: '/match-reports' },
        { icon: FileText, label: language === 'ar' ? 'مولد التقارير AI' : 'AI Report Generator', path: '/coach/match-report-generator' },
      ]
    },
    {
      id: 'staff',
      label: language === 'ar' ? 'أدوات الطاقم' : 'Staff Tools',
      icon: Heart,
      items: [
        { icon: Brain, label: language === 'ar' ? 'التدريب الذهني' : 'Mental Coaching', path: '/mental' },
        { icon: Dumbbell, label: language === 'ar' ? 'التدريب البدني' : 'Physical Training', path: '/physical' },
        { icon: Apple, label: language === 'ar' ? 'التغذية' : 'Nutrition', path: '/nutrition' },
        { icon: Heart, label: language === 'ar' ? 'تتبع الإصابات' : 'Injury Tracking', path: '/coach/injury-tracking' },
        { icon: Satellite, label: language === 'ar' ? 'تتبع GPS' : 'GPS Tracker', path: '/gps-tracker' },
        { icon: Activity, label: 'PlayerMaker', path: '/playermaker' },
      ]
    },
    {
      id: 'education',
      label: language === 'ar' ? 'التعليم' : 'Education',
      icon: GraduationCap,
      items: [
        { icon: BookOpen, label: language === 'ar' ? 'قوانين كرة القدم' : 'Football Laws', path: '/coach-education/laws' },
        { icon: GraduationCap, label: language === 'ar' ? 'دورات التدريب' : 'Coaching Courses', path: '/coach-education/courses' },
        { icon: Video, label: language === 'ar' ? 'فيديوهات التدريب' : 'Training Videos', path: '/coach-education/videos' },
        { icon: Trophy, label: language === 'ar' ? 'تقييم المدرب' : 'Coach Assessment', path: '/coach-assessment' },
      ]
    },
    {
      id: 'community',
      label: language === 'ar' ? 'المجتمع' : 'Community',
      icon: MessageSquare,
      items: [
        { icon: UserCircle, label: language === 'ar' ? 'لوحة تحكم ولي الأمر' : 'Parent Dashboard', path: '/parent-dashboard' },
        { icon: UserCircle, label: language === 'ar' ? 'بوابة أولياء الأمور' : 'Parent Portal', path: '/parent-portal' },
        { icon: MessageSquare, label: language === 'ar' ? 'المنتدى' : 'Forum', path: '/forum' },
        { icon: Gift, label: language === 'ar' ? 'المكافآت' : 'Rewards', path: '/rewards' },
        { icon: Flame, label: language === 'ar' ? 'السلسلة اليومية' : 'Daily Streak', path: '/streak' },
      ]
    },
    {
      id: 'admin',
      label: language === 'ar' ? 'الإدارة' : 'Admin',
      icon: Settings,
      items: [
        { icon: Settings, label: language === 'ar' ? 'الإعدادات' : 'Settings', path: '/settings' },
        { icon: Users, label: language === 'ar' ? 'إدارة المستخدمين' : 'User Management', path: '/user-management' },
        { icon: Shield, label: language === 'ar' ? 'إدارة الأدوار' : 'Role Management', path: '/admin/role-management' },
        { icon: LayoutDashboard, label: language === 'ar' ? 'إدارة البيانات' : 'Data Management', path: '/admin/data-management' },
        { icon: FileText, label: language === 'ar' ? 'محتوى الصفحة الرئيسية' : 'Home Content', path: '/admin/home-content' },
        { icon: Users2, label: language === 'ar' ? 'تعيين الفرق' : 'Team Assignment', path: '/admin/team-assignment' },
        { icon: Users, label: language === 'ar' ? 'تعيين المدربين' : 'Coach Assignment', path: '/admin/coach-assignment' },
        { icon: Users2, label: language === 'ar' ? 'إدارة الفرق' : 'Team Management', path: '/admin/team-management' },
        { icon: Trophy, label: language === 'ar' ? 'قوائم الفرق' : 'Team Rosters', path: '/team-rosters' },
      ]
    },
  ];

  return baseModules;
};

// Get modules based on user role and team assignment
const getModulesForRole = (
  role: string, 
  t: (key: string) => string, 
  language: string,
  userTeamType?: string | null
) => {
  const allModules = getModules(t, language, userTeamType);
  
  if (role === 'admin') {
    // Admin sees all modules
    return allModules;
  } else if (role === 'coach') {
    // Coach sees all except admin
    return allModules.filter(m => m.id !== 'admin');
  } else if (['nutritionist', 'mental_coach', 'physical_trainer'].includes(role)) {
    // Staff sees limited modules plus both team modules
    return allModules.filter(m => 
      ['dashboard', 'main-team', 'academy-team', 'players', 'staff', 'community'].includes(m.id)
    );
  } else if (role === 'parent') {
    // Parent sees only their child's team module
    if (userTeamType === 'main') {
      return allModules.filter(m => ['dashboard', 'main-team', 'community'].includes(m.id));
    } else if (userTeamType === 'academy') {
      return allModules.filter(m => ['dashboard', 'academy-team', 'community'].includes(m.id));
    }
    // If no team assigned, show both
    return allModules.filter(m => ['dashboard', 'main-team', 'academy-team', 'community'].includes(m.id));
  } else if (role === 'player') {
    // Player sees only their team module
    if (userTeamType === 'main') {
      return allModules.filter(m => ['dashboard', 'main-team', 'training', 'community'].includes(m.id));
    } else if (userTeamType === 'academy') {
      return allModules.filter(m => ['dashboard', 'academy-team', 'training', 'community'].includes(m.id));
    }
    // If no team assigned, show both
    return allModules.filter(m => ['dashboard', 'main-team', 'academy-team', 'training', 'community'].includes(m.id));
  }
  
  return [allModules[0]]; // Dashboard only for unknown roles
};

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

function ModuleNavigation({ modules, currentPath }: { modules: ReturnType<typeof getModules>, currentPath: string }) {
  const [openModules, setOpenModules] = useState<string[]>(['dashboard']);
  const [, navigate] = useLocation();
  const { language } = useLanguage();

  // Auto-open module containing current path
  useEffect(() => {
    const currentModule = modules.find(m => m.items.some(item => {
      // Check if path matches (ignoring query params)
      const itemBasePath = item.path.split('?')[0];
      const currentBasePath = currentPath.split('?')[0];
      return itemBasePath === currentBasePath || item.path === currentPath;
    }));
    if (currentModule && !openModules.includes(currentModule.id)) {
      setOpenModules(prev => [...prev, currentModule.id]);
    }
  }, [currentPath, modules]);

  const toggleModule = (moduleId: string) => {
    setOpenModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const isItemActive = (itemPath: string) => {
    const itemBasePath = itemPath.split('?')[0];
    const currentBasePath = currentPath.split('?')[0];
    return itemBasePath === currentBasePath;
  };

  return (
    <div className="space-y-1" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {modules.map((module) => (
        <Collapsible
          key={module.id}
          open={openModules.includes(module.id)}
          onOpenChange={() => toggleModule(module.id)}
        >
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                "flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                openModules.includes(module.id) && "bg-accent/50",
                // Highlight team modules with special colors
                module.id === 'main-team' && "border-l-2 border-gold-500",
                module.id === 'academy-team' && "border-l-2 border-blue-500"
              )}
            >
              <module.icon className={cn(
                "h-4 w-4", 
                language === 'ar' ? 'ml-3' : 'mr-3',
                module.id === 'main-team' && "text-gold-500",
                module.id === 'academy-team' && "text-blue-500"
              )} />
              <span className="flex-1 text-left">{module.label}</span>
              {openModules.includes(module.id) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1">
            {module.items.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors",
                  language === 'ar' ? 'pr-10' : 'pl-10',
                  isItemActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4", language === 'ar' ? 'ml-3' : 'mr-3')} />
                <span>{item.label}</span>
              </button>
            ))}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const isMobile = useIsMobile();
  
  // Get player info for the current user to determine their team
  const { data: playerInfo } = trpc.players.getByUserId.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user && (user.role === 'player') }
  );
  
  // Get parent's children to determine team for parent users
  const { data: parentChildren } = trpc.players.getForParent.useQuery(
    undefined,
    { enabled: !!user && user.role === 'parent' }
  );
  
  // Get team info to determine team type
  const { data: teams } = trpc.teams.getAll.useQuery(undefined, {
    enabled: !!user
  });

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
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-center">
              {language === 'ar' ? 'منصة أكاديمية كرة القدم' : 'Football Academy Platform'}
            </h1>
            <p className="text-muted-foreground text-center">
              {language === 'ar' 
                ? 'سجل الدخول للوصول إلى منصة تطوير اللاعبين وتتبع رحلتك نحو التميز.'
                : 'Sign in to access the player development platform and track your journey to excellence.'}
            </p>
          </div>
          <Button 
            onClick={() => window.location.href = getLoginUrl()}
            className="w-full"
            size="lg"
          >
            {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
          </Button>
        </div>
      </div>
    );
  }

  // Determine user's team type
  let userTeamType: string | null = null;
  
  if (user.role === 'player' && playerInfo?.teamId && teams) {
    const playerTeam = teams.find(t => t.id === playerInfo.teamId);
    userTeamType = playerTeam?.teamType || null;
  } else if (user.role === 'parent' && parentChildren && parentChildren.length > 0 && teams) {
    // For parents, use the first child's team
    const firstChild = parentChildren[0];
    if (firstChild?.teamId) {
      const childTeam = teams.find(t => t.id === firstChild.teamId);
      userTeamType = childTeam?.teamType || null;
    }
  }

  const modules = getModulesForRole(user.role, t, language, userTeamType);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Sidebar
          style={{ '--sidebar-width': `${sidebarWidth}px` } as CSSProperties}
          className="border-r"
        >
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">
                  {language === 'ar' ? 'نجوم المستقبل' : 'Future Stars FC'}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {user.role === 'admin' ? (language === 'ar' ? 'مدير' : 'Admin') :
                   user.role === 'coach' ? (language === 'ar' ? 'مدرب' : 'Coach') :
                   user.role === 'parent' ? (language === 'ar' ? 'ولي أمر' : 'Parent') :
                   user.role === 'player' ? (language === 'ar' ? 'لاعب' : 'Player') :
                   user.role}
                </span>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-2">
            <ModuleNavigation modules={modules} currentPath={location} />
          </SidebarContent>
          
          <SidebarFooter className="border-t p-4">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              >
                <Globe className="h-4 w-4 mr-1" />
                {language === 'ar' ? 'EN' : 'عربي'}
              </Button>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-accent transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-sm">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'الإعدادات' : 'Settings'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        
        <SidebarInset className="flex-1">
          <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
            <SidebarTrigger />
            <div className="flex-1" />
            {['coach', 'admin'].includes(user.role) && <TeamSwitcher />}
            <NotificationBell />
            {user.role === 'parent' && <ChildSelector />}
          </header>
          
          <main className="flex-1 p-4 lg:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
      
      {/* AI Chat Widget */}
      <AIChatWidget />
    </SidebarProvider>
  );
}
