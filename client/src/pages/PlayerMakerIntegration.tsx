import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/DashboardLayout';
import { DashboardLayoutSkeleton } from '@/components/DashboardLayoutSkeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { 
  Settings,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Activity,
  TrendingUp,
  Users,
  Calendar as CalendarIcon,
  BarChart3,
  Zap,
  Clock,
  Plus,
  History
} from 'lucide-react';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';

export default function PlayerMakerIntegration() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();

  const [credentials, setCredentials] = useState({
    clientKey: '',
    clientSecret: '',
    clientTeamId: '',
    teamCode: ''
  });

  // Date range state for sync
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [datePreset, setDatePreset] = useState<string>('30');
  const [sessionTypeFilter, setSessionTypeFilter] = useState<'all' | 'training' | 'match'>('all');

  // Sample training session form state
  const [sampleSession, setSampleSession] = useState({
    sessionType: 'training' as 'training' | 'match',
    playerCount: 10,
    sessionDate: new Date(),
    duration: 90,
    intensity: 'medium' as 'low' | 'medium' | 'high',
    notes: ''
  });

  // Auto-sync settings state
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [autoSyncFrequency, setAutoSyncFrequency] = useState<'hourly' | 'daily' | 'weekly'>('daily');

  const { data: settings, isLoading: settingsLoading, refetch: refetchSettings } = 
    trpc.playermaker.getSettings.useQuery();
  
  const { data: sessions, isLoading: sessionsLoading } = 
    trpc.playermaker.getSessions.useQuery(undefined, {
      enabled: !!settings?.isActive
    });

  const { data: recentMetrics } = 
    trpc.playermaker.getRecentMetrics.useQuery(undefined, {
      enabled: !!settings?.isActive
    });

  const { data: syncHistory } = 
    trpc.playermaker.getSyncHistory.useQuery(undefined, {
      enabled: !!settings?.isActive
    });

  // Check rate limit status
  const { data: rateLimitStatus, refetch: refetchRateLimitStatus } = 
    trpc.playermaker.getRateLimitStatus.useQuery(undefined, {
      enabled: !!settings?.isActive,
      refetchInterval: 60000, // Refresh every minute
    });

  const saveSettings = trpc.playermaker.saveSettings.useMutation({
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
      refetchSettings();
      setCredentials({ clientKey: '', clientSecret: '', clientTeamId: '', teamCode: '' });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const testConnection = trpc.playermaker.testConnection.useMutation({
    onSuccess: (data) => {
      toast.success(
        language === 'ar' 
          ? `تم الاتصال بنجاح! النادي: ${data.clubName}` 
          : `Connected successfully! Club: ${data.clubName}`
      );
    },
    onError: (error) => {
      if (error.message.includes('412') || error.message.includes('BadCredentials') || error.message.includes('BadLoginDetails')) {
        toast.warning(
          language === 'ar'
            ? 'في انتظار انضمام اللاعبين. يرجى توزيع رمز الفريق على اللاعبين للانضمام عبر تطبيق PlayerMaker.'
            : 'Waiting for players to join. Please distribute the team code to players to join via the PlayerMaker app.',
          { duration: 8000 }
        );
      } else {
        toast.error(error.message);
      }
    },
  });

  const syncData = trpc.playermaker.syncData.useMutation({
    onSuccess: (data) => {
      toast.success(
        language === 'ar' 
          ? `تم المزامنة! ${data.sessionsCount} جلسات، ${data.metricsCount} مقاييس` 
          : `Synced! ${data.sessionsCount} sessions, ${data.metricsCount} metrics`
      );
      refetchSettings();
    },
    onError: (error) => {
      if (error.message.includes('412') || error.message.includes('BadCredentials') || error.message.includes('BadLoginDetails')) {
        toast.warning(
          language === 'ar'
            ? 'في انتظار انضمام اللاعبين. يرجى توزيع رمز الفريق على اللاعبين للانضمام عبر تطبيق PlayerMaker.'
            : 'Waiting for players to join. Please distribute the team code to players to join via the PlayerMaker app.',
          { duration: 8000 }
        );
      } else {
        toast.error(error.message);
      }
    },
  });

  const generateReport = trpc.playermaker.generateWeeklyReport.useMutation({
    onSuccess: (data) => {
      toast.success(language === 'ar' ? 'تم إنشاء التقرير بنجاح' : 'Report generated successfully');
      console.log('Weekly Report:', data.summary);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const generateSampleData = trpc.playermaker.generateSampleData.useMutation({
    onSuccess: (data) => {
      toast.success(
        language === 'ar' 
          ? `تم إنشاء ${data.sessionsCount} جلسة و ${data.metricsCount} مقياس` 
          : `Generated ${data.sessionsCount} sessions and ${data.metricsCount} metrics`
      );
      refetchSettings();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createSampleSession = trpc.playermaker.createSampleSession.useMutation({
    onSuccess: (data) => {
      toast.success(
        language === 'ar' 
          ? `تم إنشاء جلسة تدريبية مع ${data.metricsCount} مقياس` 
          : `Created training session with ${data.metricsCount} player metrics`
      );
      refetchSettings();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const saveAutoSyncSettings = trpc.playermaker.saveAutoSyncSettings.useMutation({
    onSuccess: () => {
      toast.success(
        language === 'ar' 
          ? 'تم حفظ إعدادات المزامنة التلقائية' 
          : 'Auto-sync settings saved'
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Load auto-sync settings from server
  useEffect(() => {
    if (settings?.autoSyncEnabled !== undefined) {
      setAutoSyncEnabled(settings.autoSyncEnabled);
    }
    if (settings?.autoSyncFrequency) {
      setAutoSyncFrequency(settings.autoSyncFrequency as 'hourly' | 'daily' | 'weekly');
    }
  }, [settings]);

  if (authLoading || settingsLoading) return <DashboardLayoutSkeleton />;
  if (!user) {
    setLocation('/');
    return null;
  }

  if (user.role !== 'admin' && user.role !== 'coach') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Card className="w-96">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {language === 'ar' 
                  ? 'هذه الصفحة متاحة للمدربين والمسؤولين فقط' 
                  : 'This page is only available to coaches and admins'}
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings.mutate({
      clientKey: credentials.clientKey,
      clientSecret: credentials.clientSecret,
      clientTeamId: credentials.clientTeamId,
      teamCode: credentials.teamCode
    });
  };

  const handleTestConnection = () => {
    if (!settings) {
      toast.error(language === 'ar' ? 'يرجى حفظ الإعدادات أولاً' : 'Please save settings first');
      return;
    }
    testConnection.mutate();
  };

  const handleDatePresetChange = (value: string) => {
    setDatePreset(value);
    const now = new Date();
    let from: Date;
    
    switch (value) {
      case '7':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90':
        from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        return; // Don't change dates for custom
      default:
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    setDateRange({ from, to: now });
  };

  const handleSyncData = () => {
    if (!settings) {
      toast.error(language === 'ar' ? 'يرجى حفظ الإعدادات أولاً' : 'Please save settings first');
      return;
    }
    
    // Check rate limit before syncing
    if (rateLimitStatus && !rateLimitStatus.canSync) {
      toast.error(
        language === 'ar' 
          ? `يرجى الانتظار ${rateLimitStatus.waitTimeFormatted} قبل المزامنة مرة أخرى`
          : rateLimitStatus.message
      );
      return;
    }
    
    // Calculate days back from date range
    const daysBack = dateRange?.from 
      ? Math.ceil((Date.now() - dateRange.from.getTime()) / (24 * 60 * 60 * 1000))
      : 30;
    
    syncData.mutate({
      sessionType: sessionTypeFilter,
      daysBack,
      startDate: dateRange?.from?.toISOString(),
      endDate: dateRange?.to?.toISOString()
    }, {
      onSuccess: () => {
        // Refresh rate limit status after successful sync
        refetchRateLimitStatus();
      }
    });
  };

  const handleGenerateReport = () => {
    generateReport.mutate();
  };

  const handleGenerateSampleData = () => {
    if (confirm(language === 'ar' ? 'هل تريد إنشاء بيانات تجريبية؟' : 'Generate sample data for testing?')) {
      generateSampleData.mutate();
    }
  };

  const handleCreateSampleSession = () => {
    createSampleSession.mutate({
      sessionType: sampleSession.sessionType,
      playerCount: sampleSession.playerCount,
      sessionDate: sampleSession.sessionDate.toISOString(),
      duration: sampleSession.duration,
      intensity: sampleSession.intensity,
      notes: sampleSession.notes
    });
  };

  const handleAutoSyncToggle = (enabled: boolean) => {
    setAutoSyncEnabled(enabled);
    saveAutoSyncSettings.mutate({
      enabled,
      frequency: autoSyncFrequency
    });
  };

  const handleAutoSyncFrequencyChange = (frequency: 'hourly' | 'daily' | 'weekly') => {
    setAutoSyncFrequency(frequency);
    if (autoSyncEnabled) {
      saveAutoSyncSettings.mutate({
        enabled: autoSyncEnabled,
        frequency
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              {language === 'ar' ? 'تكامل PlayerMaker' : 'PlayerMaker Integration'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'ar' 
                ? 'مزامنة بيانات الأداء من أجهزة PlayerMaker' 
                : 'Sync performance data from PlayerMaker devices'}
            </p>
          </div>
        </div>

        {/* Connection Status */}
        {settings && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {settings.isActive ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {settings.isActive 
                        ? (language === 'ar' ? 'متصل' : 'Connected')
                        : (language === 'ar' ? 'غير متصل' : 'Disconnected')}
                    </p>
                    {settings.clubName && (
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'النادي:' : 'Club:'} {settings.clubName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {autoSyncEnabled && (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {language === 'ar' ? 'مزامنة تلقائية' : 'Auto-sync'}: {autoSyncFrequency}
                    </Badge>
                  )}
                  {settings.lastSyncAt && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'آخر مزامنة:' : 'Last synced:'}
                      </p>
                      <p className="text-sm font-medium">
                        {new Date(settings.lastSyncAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'الإعدادات' : 'Settings'}
            </TabsTrigger>
            <TabsTrigger value="sync" disabled={!settings?.isActive}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'المزامنة' : 'Sync Data'}
            </TabsTrigger>
            <TabsTrigger value="sample" disabled={!settings?.isActive}>
              <Plus className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'بيانات تجريبية' : 'Sample Data'}
            </TabsTrigger>
            <TabsTrigger value="dashboard" disabled={!settings?.isActive}>
              <BarChart3 className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
            </TabsTrigger>
            <TabsTrigger value="sessions" disabled={!settings?.isActive}>
              <CalendarIcon className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'الجلسات' : 'Sessions'}
            </TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{language === 'ar' ? 'إعدادات API' : 'API Settings'}</CardTitle>
                  <CardDescription>
                    {language === 'ar' 
                      ? 'أدخل بيانات اعتماد PlayerMaker API الخاصة بك' 
                      : 'Enter your PlayerMaker API credentials'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveSettings} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientKey">
                        {language === 'ar' ? 'مفتاح العميل' : 'Client Key'}
                      </Label>
                      <Input
                        id="clientKey"
                        value={credentials.clientKey}
                        onChange={(e) => setCredentials({ ...credentials, clientKey: e.target.value })}
                        placeholder={settings?.clientKey ? '••••••••' : 'Enter client key'}
                        required={!settings}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clientSecret">
                        {language === 'ar' ? 'سر العميل' : 'Client Secret'}
                      </Label>
                      <Input
                        id="clientSecret"
                        type="password"
                        value={credentials.clientSecret}
                        onChange={(e) => setCredentials({ ...credentials, clientSecret: e.target.value })}
                        placeholder={settings?.clientSecret ? '••••••••' : 'Enter client secret'}
                        required={!settings}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clientTeamId">
                        {language === 'ar' ? 'معرف الفريق' : 'Team ID'}
                      </Label>
                      <Input
                        id="clientTeamId"
                        type="text"
                        value={credentials.clientTeamId}
                        onChange={(e) => setCredentials({ ...credentials, clientTeamId: e.target.value })}
                        placeholder={settings?.clientTeamId || 'Enter team ID (e.g., 6591)'}
                        required={!settings}
                      />
                      <p className="text-xs text-muted-foreground">
                        {language === 'ar' ? 'معرف الفريق الرقمي من PlayerMaker' : 'Numeric team ID from PlayerMaker'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teamCode">
                        {language === 'ar' ? 'رمز الفريق' : 'Team Code'}
                      </Label>
                      <Input
                        id="teamCode"
                        type="text"
                        value={credentials.teamCode}
                        onChange={(e) => setCredentials({ ...credentials, teamCode: e.target.value })}
                        placeholder={settings?.teamCode || 'Enter team code (e.g., cLIo)'}
                        required={!settings}
                      />
                      <p className="text-xs text-muted-foreground">
                        {language === 'ar' ? 'رمز الفريق الذي يستخدمه اللاعبون للانضمام' : 'Team code that players use to join'}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button type="submit" disabled={saveSettings.isPending}>
                        {saveSettings.isPending 
                          ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
                          : (language === 'ar' ? 'حفظ الإعدادات' : 'Save Settings')}
                      </Button>
                      {settings && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleTestConnection}
                          disabled={testConnection.isPending}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          {testConnection.isPending 
                            ? (language === 'ar' ? 'جاري الاختبار...' : 'Testing...') 
                            : (language === 'ar' ? 'اختبار الاتصال' : 'Test Connection')}
                        </Button>
                      )}
                    </div>
                  </form>

                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">
                      {language === 'ar' ? 'كيفية الحصول على بيانات الاعتماد:' : 'How to get credentials:'}
                    </h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>{language === 'ar' ? 'تواصل مع دعم PlayerMaker' : 'Contact PlayerMaker support'}</li>
                      <li>{language === 'ar' ? 'قدم عنوان بريد إلكتروني صالح' : 'Provide a valid email address'}</li>
                      <li>{language === 'ar' ? 'احصل على Client Key و Client Secret و Team ID' : 'Receive Client Key, Client Secret, and Team ID'}</li>
                      <li>{language === 'ar' ? 'أدخل البيانات هنا واحفظ' : 'Enter credentials here and save'}</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              {/* Auto-Sync Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {language === 'ar' ? 'المزامنة التلقائية' : 'Auto-Sync Settings'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'ar' 
                      ? 'جدولة المزامنة التلقائية للبيانات' 
                      : 'Schedule automatic data synchronization'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{language === 'ar' ? 'تفعيل المزامنة التلقائية' : 'Enable Auto-Sync'}</Label>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' 
                          ? 'مزامنة البيانات تلقائياً حسب الجدول' 
                          : 'Automatically sync data on schedule'}
                      </p>
                    </div>
                    <Switch
                      checked={autoSyncEnabled}
                      onCheckedChange={handleAutoSyncToggle}
                      disabled={!settings?.isActive}
                    />
                  </div>

                  {autoSyncEnabled && (
                    <div className="space-y-2">
                      <Label>{language === 'ar' ? 'تكرار المزامنة' : 'Sync Frequency'}</Label>
                      <Select
                        value={autoSyncFrequency}
                        onValueChange={(v) => handleAutoSyncFrequencyChange(v as 'hourly' | 'daily' | 'weekly')}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">
                            {language === 'ar' ? 'كل ساعة' : 'Hourly'}
                          </SelectItem>
                          <SelectItem value="daily">
                            {language === 'ar' ? 'يومياً' : 'Daily'}
                          </SelectItem>
                          <SelectItem value="weekly">
                            {language === 'ar' ? 'أسبوعياً' : 'Weekly'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {autoSyncFrequency === 'hourly' && (language === 'ar' ? 'المزامنة كل ساعة' : 'Syncs every hour')}
                        {autoSyncFrequency === 'daily' && (language === 'ar' ? 'المزامنة يومياً في الساعة 6 صباحاً' : 'Syncs daily at 6:00 AM')}
                        {autoSyncFrequency === 'weekly' && (language === 'ar' ? 'المزامنة كل يوم اثنين في الساعة 6 صباحاً' : 'Syncs every Monday at 6:00 AM')}
                      </p>
                    </div>
                  )}

                  {/* Sync History */}
                  {syncHistory && syncHistory.length > 0 && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        {language === 'ar' ? 'سجل المزامنة' : 'Sync History'}
                      </Label>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {syncHistory.slice(0, 5).map((entry: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                            <span>{new Date(entry.syncedAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</span>
                            <Badge variant={entry.success ? 'default' : 'destructive'}>
                              {entry.success 
                                ? `${entry.sessionsCount} ${language === 'ar' ? 'جلسات' : 'sessions'}`
                                : (language === 'ar' ? 'فشل' : 'Failed')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sync Data Tab with Date Range */}
          <TabsContent value="sync">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'مزامنة البيانات' : 'Sync Data'}</CardTitle>
                <CardDescription>
                  {language === 'ar' 
                    ? 'اختر نطاق التاريخ ونوع الجلسة للمزامنة' 
                    : 'Select date range and session type to sync'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Date Preset */}
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'الفترة الزمنية' : 'Time Period'}</Label>
                    <Select value={datePreset} onValueChange={handleDatePresetChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">
                          {language === 'ar' ? 'آخر 7 أيام' : 'Last 7 days'}
                        </SelectItem>
                        <SelectItem value="30">
                          {language === 'ar' ? 'آخر 30 يوم' : 'Last 30 days'}
                        </SelectItem>
                        <SelectItem value="90">
                          {language === 'ar' ? 'آخر 90 يوم' : 'Last 90 days'}
                        </SelectItem>
                        <SelectItem value="custom">
                          {language === 'ar' ? 'تاريخ مخصص' : 'Custom range'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Session Type Filter */}
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'نوع الجلسة' : 'Session Type'}</Label>
                    <Select 
                      value={sessionTypeFilter} 
                      onValueChange={(v) => setSessionTypeFilter(v as 'all' | 'training' | 'match')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {language === 'ar' ? 'الكل' : 'All'}
                        </SelectItem>
                        <SelectItem value="training">
                          {language === 'ar' ? 'تدريب' : 'Training'}
                        </SelectItem>
                        <SelectItem value="match">
                          {language === 'ar' ? 'مباراة' : 'Match'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Date Range Picker */}
                  {datePreset === 'custom' && (
                    <div className="space-y-2">
                      <Label>{language === 'ar' ? 'نطاق التاريخ' : 'Date Range'}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                              dateRange.to ? (
                                <>
                                  {format(dateRange.from, "LLL dd, y")} -{" "}
                                  {format(dateRange.to, "LLL dd, y")}
                                </>
                              ) : (
                                format(dateRange.from, "LLL dd, y")
                              )
                            ) : (
                              <span>{language === 'ar' ? 'اختر التاريخ' : 'Pick a date'}</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>

                {/* Date Range Summary */}
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>{language === 'ar' ? 'ملخص المزامنة:' : 'Sync Summary:'}</strong>{' '}
                    {language === 'ar' ? 'سيتم مزامنة' : 'Will sync'}{' '}
                    <Badge variant="secondary">
                      {sessionTypeFilter === 'all' 
                        ? (language === 'ar' ? 'جميع الجلسات' : 'all sessions')
                        : sessionTypeFilter === 'training'
                          ? (language === 'ar' ? 'جلسات التدريب' : 'training sessions')
                          : (language === 'ar' ? 'المباريات' : 'matches')}
                    </Badge>{' '}
                    {language === 'ar' ? 'من' : 'from'}{' '}
                    <Badge variant="outline">
                      {dateRange?.from ? format(dateRange.from, "MMM dd, yyyy") : 'N/A'}
                    </Badge>{' '}
                    {language === 'ar' ? 'إلى' : 'to'}{' '}
                    <Badge variant="outline">
                      {dateRange?.to ? format(dateRange.to, "MMM dd, yyyy") : 'N/A'}
                    </Badge>
                  </p>
                </div>

                {/* Rate Limit Warning */}
                {rateLimitStatus && !rateLimitStatus.canSync && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <Clock className="h-5 w-5" />
                      <span className="font-medium">
                        {language === 'ar' ? 'تم تفعيل حد الطلبات' : 'Rate Limit Active'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {language === 'ar' 
                        ? `يرجى الانتظار ${rateLimitStatus.waitTimeFormatted} قبل المزامنة مرة أخرى. واجهة PlayerMaker API تحد الطلبات إلى مرة واحدة كل 15 دقيقة.`
                        : `Please wait ${rateLimitStatus.waitTimeFormatted} before syncing again. The PlayerMaker API limits requests to once every 15 minutes.`}
                    </p>
                  </div>
                )}

                <Button 
                  onClick={handleSyncData} 
                  disabled={syncData.isPending || (rateLimitStatus && !rateLimitStatus.canSync)}
                  className="w-full"
                  size="lg"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncData.isPending ? 'animate-spin' : ''}`} />
                  {syncData.isPending 
                    ? (language === 'ar' ? 'جاري المزامنة...' : 'Syncing...') 
                    : rateLimitStatus && !rateLimitStatus.canSync
                      ? (language === 'ar' ? `انتظر ${rateLimitStatus.waitTimeFormatted}` : `Wait ${rateLimitStatus.waitTimeFormatted}`)
                      : (language === 'ar' ? 'بدء المزامنة' : 'Start Sync')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sample Data Tab */}
          <TabsContent value="sample">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Sample Data */}
              <Card>
                <CardHeader>
                  <CardTitle>{language === 'ar' ? 'بيانات تجريبية سريعة' : 'Quick Sample Data'}</CardTitle>
                  <CardDescription>
                    {language === 'ar' 
                      ? 'إنشاء 20 جلسة تدريبية عشوائية للاختبار' 
                      : 'Generate 20 random training sessions for testing'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleGenerateSampleData} 
                    disabled={generateSampleData.isPending}
                    className="w-full"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {generateSampleData.isPending 
                      ? (language === 'ar' ? 'جاري الإنشاء...' : 'Generating...') 
                      : (language === 'ar' ? 'إنشاء بيانات عشوائية' : 'Generate Random Data')}
                  </Button>
                </CardContent>
              </Card>

              {/* Custom Sample Session */}
              <Card>
                <CardHeader>
                  <CardTitle>{language === 'ar' ? 'إنشاء جلسة مخصصة' : 'Create Custom Session'}</CardTitle>
                  <CardDescription>
                    {language === 'ar' 
                      ? 'إنشاء جلسة تدريبية بمواصفات محددة' 
                      : 'Create a training session with specific parameters'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{language === 'ar' ? 'نوع الجلسة' : 'Session Type'}</Label>
                      <Select 
                        value={sampleSession.sessionType}
                        onValueChange={(v) => setSampleSession({ ...sampleSession, sessionType: v as 'training' | 'match' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="training">
                            {language === 'ar' ? 'تدريب' : 'Training'}
                          </SelectItem>
                          <SelectItem value="match">
                            {language === 'ar' ? 'مباراة' : 'Match'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{language === 'ar' ? 'عدد اللاعبين' : 'Player Count'}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        value={sampleSession.playerCount}
                        onChange={(e) => setSampleSession({ ...sampleSession, playerCount: parseInt(e.target.value) || 10 })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{language === 'ar' ? 'المدة (دقيقة)' : 'Duration (min)'}</Label>
                      <Input
                        type="number"
                        min={15}
                        max={180}
                        value={sampleSession.duration}
                        onChange={(e) => setSampleSession({ ...sampleSession, duration: parseInt(e.target.value) || 90 })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{language === 'ar' ? 'الشدة' : 'Intensity'}</Label>
                      <Select 
                        value={sampleSession.intensity}
                        onValueChange={(v) => setSampleSession({ ...sampleSession, intensity: v as 'low' | 'medium' | 'high' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">
                            {language === 'ar' ? 'منخفضة' : 'Low'}
                          </SelectItem>
                          <SelectItem value="medium">
                            {language === 'ar' ? 'متوسطة' : 'Medium'}
                          </SelectItem>
                          <SelectItem value="high">
                            {language === 'ar' ? 'عالية' : 'High'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'تاريخ الجلسة' : 'Session Date'}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(sampleSession.sessionDate, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={sampleSession.sessionDate}
                          onSelect={(date) => date && setSampleSession({ ...sampleSession, sessionDate: date })}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
                    <Input
                      value={sampleSession.notes}
                      onChange={(e) => setSampleSession({ ...sampleSession, notes: e.target.value })}
                      placeholder={language === 'ar' ? 'ملاحظات اختيارية...' : 'Optional notes...'}
                    />
                  </div>

                  <Button 
                    onClick={handleCreateSampleSession} 
                    disabled={createSampleSession.isPending}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {createSampleSession.isPending 
                      ? (language === 'ar' ? 'جاري الإنشاء...' : 'Creating...') 
                      : (language === 'ar' ? 'إنشاء الجلسة' : 'Create Session')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'ar' ? 'إجمالي الجلسات' : 'Total Sessions'}
                  </CardTitle>
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sessions?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' ? 'آخر 30 يوماً' : 'Last 30 days'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'ar' ? 'اللاعبون النشطون' : 'Active Players'}
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {recentMetrics?.uniquePlayers || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' ? 'مع بيانات حديثة' : 'With recent data'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'ar' ? 'متوسط اللمسات' : 'Avg Touches'}
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {recentMetrics?.avgTouches?.toFixed(0) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' ? 'لكل جلسة' : 'Per session'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'ar' ? 'متوسط المسافة' : 'Avg Distance'}
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {recentMetrics?.avgDistance?.toFixed(0) || 0}m
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' ? 'لكل جلسة' : 'Per session'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {recentMetrics?.topPerformers && recentMetrics.topPerformers.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>{language === 'ar' ? 'أفضل الأداءات' : 'Top Performers'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentMetrics.topPerformers.map((player: any, index: number) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => player.playerId && setLocation(`/playermaker/player/${player.playerId}`)}
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{index + 1}</Badge>
                          <div>
                            <p className="font-medium">{player.playerName}</p>
                            <p className="text-sm text-muted-foreground">{player.ageGroup}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{player.totalTouches} {language === 'ar' ? 'لمسة' : 'touches'}</p>
                          <p className="text-sm text-muted-foreground">
                            {player.distanceCovered}m {language === 'ar' ? 'مسافة' : 'distance'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weekly Report Button */}
            {user.role === 'admin' && (
              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={handleGenerateReport} disabled={generateReport.isPending}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {generateReport.isPending 
                    ? (language === 'ar' ? 'جاري إنشاء التقرير...' : 'Generating report...') 
                    : (language === 'ar' ? 'إنشاء تقرير أسبوعي' : 'Generate Weekly Report')}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'الجلسات الأخيرة' : 'Recent Sessions'}</CardTitle>
              </CardHeader>
              <CardContent>
                {sessionsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                  </div>
                ) : sessions && sessions.length > 0 ? (
                  <div className="space-y-4">
                    {sessions.map((session: any) => (
                      <div key={session.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{session.tag || session.sessionType}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(session.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                            </p>
                          </div>
                          <Badge variant={session.sessionType === 'match' ? 'default' : 'secondary'}>
                            {session.sessionType}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">{language === 'ar' ? 'المدة' : 'Duration'}</p>
                            <p className="font-medium">{session.phaseDuration} {language === 'ar' ? 'دقيقة' : 'min'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{language === 'ar' ? 'اللاعبون' : 'Players'}</p>
                            <p className="font-medium">{session.participatedPlayers}</p>
                          </div>
                          {session.matchOpponent && (
                            <div>
                              <p className="text-muted-foreground">{language === 'ar' ? 'الخصم' : 'Opponent'}</p>
                              <p className="font-medium">{session.matchOpponent}</p>
                            </div>
                          )}
                          {session.intensity && (
                            <div>
                              <p className="text-muted-foreground">{language === 'ar' ? 'الشدة' : 'Intensity'}</p>
                              <p className="font-medium">{session.intensity}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {language === 'ar' ? 'لا توجد جلسات' : 'No sessions found'}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
