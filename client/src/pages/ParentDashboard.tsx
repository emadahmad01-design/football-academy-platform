import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  User, Calendar, Bell, FileText, TrendingUp, Clock, 
  MapPin, Phone, Mail, BookOpen, Award, Activity 
} from 'lucide-react';
import { Link } from 'wouter';
import { format } from 'date-fns';

export default function ParentDashboard() {
  const { language } = useLanguage();
  
  // Simple translation helper
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'common.loading': { en: 'Loading...', ar: 'جاري التحميل...' },
      'common.viewAll': { en: 'View All', ar: 'عرض الكل' },
      'common.download': { en: 'Download', ar: 'تحميل' },
      'parentDashboard.title': { en: 'Parent Dashboard', ar: 'لوحة تحكم ولي الأمر' },
      'parentDashboard.subtitle': { en: 'Monitor your children\'s progress and upcoming activities', ar: 'راقب تقدم أطفالك والأنشطة القادمة' },
      'parentDashboard.bookSession': { en: 'Book Session', ar: 'حجز جلسة' },
      'parentDashboard.viewReports': { en: 'View Reports', ar: 'عرض التقارير' },
      'parentDashboard.age': { en: 'Age', ar: 'العمر' },
      'parentDashboard.overallRating': { en: 'Overall', ar: 'التقييم الإجمالي' },
      'parentDashboard.activities30Days': { en: '30 Days', ar: '30 يوم' },
      'parentDashboard.upcomingSessions': { en: 'Upcoming Sessions', ar: 'الجلسات القادمة' },
      'parentDashboard.with': { en: 'with', ar: 'مع' },
      'parentDashboard.noUpcomingSessions': { en: 'No upcoming sessions scheduled', ar: 'لا توجد جلسات قادمة مجدولة' },
      'parentDashboard.bookFirstSession': { en: 'Book Your First Session', ar: 'احجز جلستك الأولى' },
      'parentDashboard.recentReports': { en: 'Recent Reports', ar: 'التقارير الأخيرة' },
      'parentDashboard.noReports': { en: 'No reports available yet', ar: 'لا توجد تقارير متاحة بعد' },
      'parentDashboard.notifications': { en: 'Notifications', ar: 'الإشعارات' },
      'parentDashboard.noNotifications': { en: 'No new notifications', ar: 'لا توجد إشعارات جديدة' },
      'parentDashboard.quickActions': { en: 'Quick Actions', ar: 'إجراءات سريعة' },
      'parentDashboard.myBookings': { en: 'My Bookings', ar: 'حجوزاتي' },
      'parentDashboard.contactCoach': { en: 'Contact Coach', ar: 'اتصل بالمدرب' },
      'skills.technical': { en: 'Technical', ar: 'فني' },
      'skills.physical': { en: 'Physical', ar: 'بدني' },
      'skills.tactical': { en: 'Tactical', ar: 'تكتيكي' },
      'skills.mental': { en: 'Mental', ar: 'عقلي' },
    };
    return translations[key]?.[language] || key;
  };
  const [selectedChild, setSelectedChild] = useState<number | null>(null);

  // Fetch comprehensive dashboard data
  const { data: dashboardData, isLoading } = trpc.parentDashboard.getDashboardData.useQuery();
  const { data: childrenSummary } = trpc.parentDashboard.getChildrenSummary.useQuery();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const children = dashboardData?.children || [];
  const upcomingSessions = dashboardData?.upcomingSessions || [];
  const recentNotifications = dashboardData?.recentNotifications || [];
  const recentReports = dashboardData?.recentReports || [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('parentDashboard.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('parentDashboard.subtitle')}
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/private-training">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Calendar className="w-4 h-4 mr-2" />
                {t('parentDashboard.bookSession')}
              </Button>
            </Link>
            <Link to="/report-history">
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                {t('parentDashboard.viewReports')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Children Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => (
            <Card key={child.playerId} className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedChild(child.playerId)}>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  {child.playerPhoto ? (
                    <img src={child.playerPhoto} alt={child.playerName || ''} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    child.playerName?.charAt(0) || '?'
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {child.playerName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {child.playerPosition} • {child.playerTeam}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('parentDashboard.age')}: {child.playerAge}
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {t('parentDashboard.overallRating')}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {child.latestSkills?.overallRating || 0}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {t('parentDashboard.activities30Days')}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {child.recentActivityCount}
                  </p>
                </div>
              </div>

              {/* Skills Breakdown */}
              {child.latestSkills && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('skills.technical')}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {child.latestSkills.technicalAvg}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('skills.physical')}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {child.latestSkills.physicalAvg}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('skills.tactical')}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {child.latestSkills.tacticalAvg}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('skills.mental')}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {child.latestSkills.mentalAvg}
                    </span>
                  </div>
                </div>
              )}

              {/* Upcoming Bookings */}
              {child.upcomingBookings > 0 && (
                <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {child.upcomingBookings} {t('parentDashboard.upcomingSessions')}
                  </span>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upcoming Sessions & Reports */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Sessions */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  {t('parentDashboard.upcomingSessions')}
                </h2>
                <Link to="/my-bookings">
                  <Button variant="ghost" size="sm">
                    {t('common.viewAll')}
                  </Button>
                </Link>
              </div>

              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{t('parentDashboard.noUpcomingSessions')}</p>
                  <Link to="/private-training">
                    <Button className="mt-4" size="sm">
                      {t('parentDashboard.bookFirstSession')}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {session.sessionType}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t('parentDashboard.with')} {session.coachName}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            session.status === 'confirmed' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {session.sessionDate ? format(new Date(session.sessionDate), 'MMM dd, yyyy') : ''} • {session.startTime}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {session.playerName}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent Reports */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  {t('parentDashboard.recentReports')}
                </h2>
                <Link to="/report-history">
                  <Button variant="ghost" size="sm">
                    {t('common.viewAll')}
                  </Button>
                </Link>
              </div>

              {recentReports.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{t('parentDashboard.noReports')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {report.reportType} - {report.playerName}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {report.reportDate ? format(new Date(report.reportDate), 'MMM dd, yyyy') : ''}
                          </p>
                        </div>
                      </div>
                      <a href={report.pdfUrl || '#'} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline">
                          {t('common.download')}
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Notifications */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-600" />
                  {t('parentDashboard.notifications')}
                </h2>
              </div>

              {recentNotifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{t('parentDashboard.noNotifications')}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {recentNotifications.map((notification) => (
                    <div key={notification.id} className={`p-3 rounded-lg border ${
                      notification.isRead 
                        ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    }`}>
                      <div className="flex items-start gap-2">
                        <Bell className={`w-4 h-4 mt-1 ${
                          notification.isRead ? 'text-gray-400' : 'text-blue-600'
                        }`} />
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                            {notification.title}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {notification.createdAt ? format(new Date(notification.createdAt), 'MMM dd, HH:mm') : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('parentDashboard.quickActions')}
              </h2>
              <div className="space-y-2">
                <Link to="/private-training">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    {t('parentDashboard.bookSession')}
                  </Button>
                </Link>
                <Link to="/report-history">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    {t('parentDashboard.viewReports')}
                  </Button>
                </Link>
                <Link to="/my-bookings">
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="w-4 h-4 mr-2" />
                    {t('parentDashboard.myBookings')}
                  </Button>
                </Link>
                <a href={`https://wa.me/201004186970`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full justify-start">
                    <Phone className="w-4 h-4 mr-2" />
                    {t('parentDashboard.contactCoach')}
                  </Button>
                </a>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
