import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// ==================== PAGE IMPORTS ====================

// Public Pages
import Home from "./pages/Home";
import Register from "./pages/Register";
import UserRegistration from "./pages/UserRegistration";
import PendingApproval from "./pages/PendingApproval";
import ParentOnboarding from "./pages/ParentOnboarding";
import Events from "./pages/Events";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Team from "./pages/Team";
import Careers from "./pages/Careers";

// Dashboard
import Dashboard from "./pages/Dashboard";
import CoachDashboard from './pages/CoachDashboard';
import TeamDashboard from './pages/TeamDashboard';
import FeaturesHub from './pages/FeaturesHub';
import ScoutNetwork from './pages/ScoutNetwork';
import NutritionAI from './pages/NutritionAI';
import InjuryPrevention from './pages/InjuryPrevention';

// Player Management
import Players from "./pages/Players";
import PlayerScorecard from "./pages/PlayerScorecard";
import PlayerDashboard from "./pages/PlayerDashboard";
import Performance from "./pages/Performance";
import PerformanceDashboard from "./pages/PerformanceDashboard";
import SkillAssessment from "./pages/SkillAssessment";
import PlayerComparison from './pages/PlayerComparison';

// Training
import Training from "./pages/Training";
import TrainingLibrary from "./pages/TrainingLibrary";
import TrainingSessionPlanner from './pages/TrainingSessionPlanner';
import PrivateTraining from "./pages/PrivateTraining";
import CoachSchedule from "./pages/CoachSchedule";
import CoachCalendar from "./pages/CoachCalendar";
import MyBookings from "./pages/MyBookings";
import Explore from "./pages/Explore";

// Match & Tactics
import Matches from "./pages/Matches";
import League from "./pages/League";
import LiveMatchMode from './pages/LiveMatchMode';
import ProfessionalTacticalBoard from './pages/ProfessionalTacticalBoardNew';
import FormationBuilder from "./pages/FormationBuilder";
import SetPieceDesigner from "./pages/SetPieceDesigner";
import MatchEventRecording from "./pages/MatchEventRecording";
import AIMatchCoach from './pages/AIMatchCoach';
import OpponentManagement from "./pages/OpponentManagement";
import OppositionAnalysis from "./pages/OppositionAnalysis";
import LiveMatchNotes from "./pages/LiveMatchNotes";

// Video Analysis
import Videos from "./pages/Videos";
import VideoClipLibrary from "./pages/VideoClipLibrary";
import CreateVideoClip from "./pages/CreateVideoClip";
import AIVideoAnalysis from './pages/AIVideoAnalysis';
import ProfessionalHeatmap from './pages/ProfessionalHeatmap';
import PassNetworkViewer from './pages/PassNetworkViewer';
import VideoManagement from "./pages/VideoManagement";

// AI Tools
import AICoachAssistant from './pages/AICoachAssistantEnhanced';
import AIEmergencyMode from './pages/AIEmergencyMode';
import PerformancePrediction from './pages/PerformancePrediction';
import AIFormationSimulation from './pages/AIFormationSimulation';
import AICalendar from './pages/AICalendar';
import AIDashboard from './pages/AIDashboard';

// Analytics & Reports
import Analytics from './pages/AnalyticsImproved';
import XGAnalytics from "./pages/XGAnalytics";
import DataAnalysisPro from './pages/DataAnalysisPro';
import MatchReports from './pages/MatchReports';
import MatchReportGenerator from './pages/MatchReportGenerator';

// Staff Tools
import Mental from "./pages/Mental";
import Physical from "./pages/Physical";
import Nutrition from "./pages/Nutrition";
import InjuryTracking from './pages/InjuryTracking';
import GpsTracker from "./pages/GpsTracker";
import PlayerMakerIntegration from './pages/PlayerMakerIntegration';
import PlayerMakerPlayerMetrics from './pages/PlayerMakerPlayerMetrics';
import PlayerMakerTeamAnalytics from './pages/PlayerMakerTeamAnalytics';

// Education
import FootballLaws from './pages/FootballLaws';
import CoachingCourses from './pages/CoachingCourses';
import CourseContent from './pages/CourseContent';
import FIFAVideoLibrary from './pages/FIFAVideoLibrary';
import CoachAssessment from './pages/CoachAssessment';
import QuizReview from './pages/QuizReview';

// Community & Portal
import ParentPortal from "./pages/ParentPortal";
import CourseDetail from "./pages/CourseDetail";
import LessonViewer from "./pages/LessonViewer";
import QuizTaker from "./pages/QuizTaker";
import ParentDashboard from "./pages/ParentDashboard";
import Messages from "./pages/Messages";
import Forum from './pages/Forum';
import Rewards from "./pages/Rewards";
import StreakPage from './pages/StreakPage';

// Admin
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import AdminDataManagement from "./pages/AdminDataManagement";
import RoleManagement from "@/pages/admin/RoleManagement";
import HomePageContentManagement from '@/pages/admin/HomePageContentManagement';
import HomeContentEditor from '@/pages/admin/HomeContentEditor';
import HomePageEditor from './pages/admin/HomePageEditor';
import CacheManagement from "@/pages/admin/CacheManagement";
import TestimonialsManagement from "./pages/admin/TestimonialsManagement";
import AdminEnrollments from "@/pages/AdminEnrollments";
import AdminBlog from "@/pages/AdminBlog";
import AdminCoachAssignment from "@/pages/AdminCoachAssignment";
import AdminTeamManagement from "@/pages/AdminTeamManagement";
import CareerApplications from "@/pages/admin/CareerApplications";
import AdminCourseManagement from "@/pages/admin/AdminCourseManagement";
import QuizManagement from "@/pages/admin/QuizManagement";
import CertificateGallery from "@/pages/parent/CertificateGallery";
import CoachAvailabilityManagement from "@/pages/CoachAvailabilityManagement";
import TeamAssignment from "@/pages/TeamAssignment";
import TeamRosters from "@/pages/TeamRosters";

// Other
import IDP from "./pages/IDP";
import AcademyTeams from "./pages/AcademyTeams";
import TeamPlayers from "./pages/TeamPlayers";
import PointsManagement from "./pages/PointsManagement";
import LocationManagement from "./pages/LocationManagement";
import BookingManagement from "./pages/BookingManagement";
import CoachReminders from "./pages/CoachReminders";

function Router() {
  return (
    <Switch>
      {/* ==================== PUBLIC PAGES ==================== */}
      <Route path="/" component={Home} />
      <Route path="/team" component={Team} />
      <Route path="/register" component={Register} />
      <Route path="/user-registration" component={UserRegistration} />
      <Route path="/pending-approval" component={PendingApproval} />
      <Route path="/parent-onboarding" component={ParentOnboarding} />
      <Route path="/events" component={Events} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/contact" component={Contact} />
      <Route path="/careers" component={Careers} />

      {/* ==================== DASHBOARD ==================== */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/coach-dashboard" component={CoachDashboard} />
      <Route path="/team-dashboard" component={TeamDashboard} />
      <Route path="/performance-dashboard" component={PerformanceDashboard} />
      <Route path="/features-hub" component={FeaturesHub} />
      <Route path="/scout-network" component={ScoutNetwork} />
      <Route path="/nutrition-ai" component={NutritionAI} />
      <Route path="/injury-prevention" component={InjuryPrevention} />

      {/* ==================== PLAYER MANAGEMENT ==================== */}
      <Route path="/players" component={Players} />
      <Route path="/player/:id" component={PlayerDashboard} />
      <Route path="/players/:id/scorecard" component={PlayerScorecard} />
      <Route path="/performance" component={Performance} />
      <Route path="/skill-assessment" component={SkillAssessment} />
      <Route path="/coach/player-comparison" component={PlayerComparison} />

      {/* ==================== TRAINING ==================== */}
      <Route path="/training" component={Training} />
      <Route path="/training-library" component={TrainingLibrary} />
      <Route path="/coach/training-planner" component={TrainingSessionPlanner} />
      <Route path="/private-training" component={PrivateTraining} />
      <Route path="/my-bookings" component={MyBookings} />
      <Route path="/explore" component={Explore} />
      <Route path="/coach-schedule" component={CoachSchedule} />
      <Route path="/coach/calendar" component={CoachCalendar} />

      {/* ==================== MATCH & TACTICS ==================== */}
      <Route path="/matches" component={Matches} />
      <Route path="/league" component={League} />
      <Route path="/coach/live-match" component={LiveMatchMode} />
      <Route path="/professional-tactical-board" component={ProfessionalTacticalBoard} />
      <Route path="/formation-builder" component={FormationBuilder} />
      <Route path="/set-piece-designer" component={SetPieceDesigner} />
      <Route path="/match-event-recording" component={MatchEventRecording} />
      <Route path="/ai-match-coach" component={AIMatchCoach} />
      <Route path="/opponent-management" component={OpponentManagement} />
      <Route path="/opposition-analysis" component={OppositionAnalysis} />
      <Route path="/live-match-notes" component={LiveMatchNotes} />

      {/* ==================== VIDEO ANALYSIS ==================== */}
      <Route path="/videos" component={Videos} />
      <Route path="/video-clip-library" component={VideoClipLibrary} />
      <Route path="/create-video-clip" component={CreateVideoClip} />
      <Route path="/coach/ai-video-analysis" component={AIVideoAnalysis} />
      <Route path="/professional-heatmap" component={ProfessionalHeatmap} />
      <Route path="/pass-network" component={PassNetworkViewer} />
      <Route path="/video-management" component={VideoManagement} />

      {/* ==================== AI TOOLS ==================== */}
      <Route path="/ai-coach" component={AICoachAssistant} />
      <Route path="/ai-emergency-mode" component={AIEmergencyMode} />
      <Route path="/coach/performance-prediction" component={PerformancePrediction} />
      <Route path="/coach/ai-formation-simulation" component={AIFormationSimulation} />
      <Route path="/coach/ai-calendar" component={AICalendar} />
      <Route path="/coach/ai-dashboard" component={AIDashboard} />

      {/* ==================== ANALYTICS & REPORTS ==================== */}
      <Route path="/analytics" component={Analytics} />
      <Route path="/xg-analytics" component={XGAnalytics} />
      <Route path="/data-analysis-pro" component={DataAnalysisPro} />
      <Route path="/match-reports" component={MatchReports} />
      <Route path="/coach/match-report-generator" component={MatchReportGenerator} />

      {/* ==================== STAFF TOOLS ==================== */}
      <Route path="/mental" component={Mental} />
      <Route path="/physical" component={Physical} />
      <Route path="/nutrition" component={Nutrition} />
      <Route path="/coach/injury-tracking" component={InjuryTracking} />
      <Route path="/gps-tracker" component={GpsTracker} />
      <Route path="/playermaker" component={PlayerMakerIntegration} />
      <Route path="/playermaker/team-analytics" component={PlayerMakerTeamAnalytics} />
      <Route path="/playermaker/player/:id" component={PlayerMakerPlayerMetrics} />

      {/* ==================== EDUCATION ==================== */}
      <Route path="/coach-education/laws" component={FootballLaws} />
      <Route path="/coach-education/courses" component={CoachingCourses} />
      <Route path="/coach-education/course/:level" component={CourseContent} />
      <Route path="/coach-education/videos" component={FIFAVideoLibrary} />
      <Route path="/coach-assessment" component={CoachAssessment} />
      <Route path="/quiz-review/:attemptId" component={QuizReview} />

      {/* ==================== COMMUNITY & PORTAL ==================== */}
      <Route path="/parent-portal" component={ParentPortal} />
      <Route path="/parent-portal/course/:id" component={CourseDetail} />
      <Route path="/parent-portal/lesson/:id" component={LessonViewer} />
      <Route path="/parent-portal/quiz/:courseId" component={QuizTaker} />
      <Route path="/parent-dashboard" component={ParentDashboard} />
      <Route path="/messages" component={Messages} />
      <Route path="/forum" component={Forum} />
      <Route path="/rewards" component={Rewards} />
      <Route path="/streak" component={StreakPage} />

      {/* ==================== ADMIN ==================== */}
      <Route path="/settings" component={Settings} />
      <Route path="/user-management" component={UserManagement} />
      <Route path="/admin/data-management" component={AdminDataManagement} />
      <Route path="/admin/role-management" component={RoleManagement} />
      <Route path="/admin/home-content" component={HomePageContentManagement} />
      <Route path="/admin/home-editor" component={HomeContentEditor} />
      <Route path="/admin/home-page-editor" component={HomePageEditor} />
      <Route path="/admin/cache" component={CacheManagement} />
      <Route path="/admin/testimonials" component={TestimonialsManagement} />
      <Route path="/admin/enrollments" component={AdminEnrollments} />
      <Route path="/admin/blog" component={AdminBlog} />
      <Route path="/admin/coach-assignment" component={AdminCoachAssignment} />
      <Route path="/admin/team-management" component={AdminTeamManagement} />
      <Route path="/admin/career-applications" component={CareerApplications} />
      <Route path="/admin/courses" component={AdminCourseManagement} />
      <Route path="/admin/quiz-management" component={QuizManagement} />
      <Route path="/parent/certificates" component={CertificateGallery} />
      <Route path="/coach-availability" component={CoachAvailabilityManagement} />
      <Route path="/admin/team-assignment" component={TeamAssignment} />
      <Route path="/team-rosters" component={TeamRosters} />

      {/* ==================== OTHER ==================== */}
      <Route path="/idp" component={IDP} />
      <Route path="/academy-teams" component={AcademyTeams} />
      <Route path="/team-players" component={TeamPlayers} />
      <Route path="/points-management" component={PointsManagement} />
      <Route path="/location-management" component={LocationManagement} />
      <Route path="/booking-management" component={BookingManagement} />
      <Route path="/coach-reminders" component={CoachReminders} />

      {/* ==================== FALLBACK ==================== */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
