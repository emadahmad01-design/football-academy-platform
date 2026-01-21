import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/DashboardLayout';
import { DashboardLayoutSkeleton } from '@/components/DashboardLayoutSkeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useLocation, useParams } from 'wouter';
import { 
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Calendar,
  Target,
  Zap,
  Footprints,
  Brain,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  LineChart,
  MessageSquare,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// Coach Annotation Form Component
function CoachAnnotationForm({ playerId, playerName }: { playerId: number; playerName: string }) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const utils = trpc.useContext();

  const { data: annotations } = trpc.playermaker.getCoachAnnotations.useQuery({ playerId });
  const addAnnotation = trpc.playermaker.addCoachAnnotation.useMutation({
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: language === 'ar' ? 'تم حفظ الملاحظة بنجاح' : 'Annotation saved successfully',
      });
      setNote('');
      setIsSubmitting(false);
      utils.playermaker.getCoachAnnotations.invalidate({ playerId });
    },
    onError: (error) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = () => {
    if (!note.trim()) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى إدخال ملاحظة' : 'Please enter a note',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    addAnnotation.mutate({ playerId, note: note.trim() });
  };

  return (
    <div className="space-y-4">
      {/* Add New Annotation */}
      <div className="space-y-2">
        <Textarea
          placeholder={language === 'ar' ? 'أضف ملاحظة عن أداء ' + playerName : 'Add a note about ' + playerName + '\'s performance'}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || !note.trim()}
          size="sm"
        >
          <Send className="h-4 w-4 mr-2" />
          {language === 'ar' ? 'حفظ الملاحظة' : 'Save Note'}
        </Button>
      </div>

      {/* Display Existing Annotations */}
      {annotations && annotations.length > 0 && (
        <div className="space-y-3 mt-4">
          <h4 className="text-sm font-semibold">
            {language === 'ar' ? 'الملاحظات السابقة' : 'Previous Annotations'}
          </h4>
          {annotations.map((annotation: any) => (
            <div key={annotation.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {new Date(annotation.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <Badge variant="outline">{annotation.coachName}</Badge>
              </div>
              <p className="text-sm">{annotation.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PlayerMakerPlayerMetrics() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const params = useParams();
  const playerId = params.id ? parseInt(params.id) : undefined;

  const { data: playerMetrics, isLoading } = 
    trpc.playermaker.getPlayerMetrics.useQuery(
      { playerId: playerId! },
      { enabled: !!playerId }
    );

  const { data: teamAverages } = 
    trpc.playermaker.getTeamAverages.useQuery();

  if (authLoading || isLoading) return <DashboardLayoutSkeleton />;
  if (!user) {
    setLocation('/');
    return null;
  }

  // Check if playerMetrics is empty or the first element is undefined
  const latestMetrics = playerMetrics?.[0];
  
  if (!playerMetrics || playerMetrics.length === 0 || !latestMetrics) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => setLocation('/playermaker')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'العودة' : 'Back'}
          </Button>
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {language === 'ar' 
                  ? 'لا توجد بيانات لهذا اللاعب' 
                  : 'No data found for this player'}
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const playerName = latestMetrics?.playerName || 'Unknown Player';
  
  // Calculate averages
  const avgTouches = playerMetrics.reduce((sum, m) => sum + (m.totalTouches || 0), 0) / playerMetrics.length;
  const avgDistance = playerMetrics.reduce((sum, m) => sum + (parseFloat(m.distanceCovered as any) || 0), 0) / playerMetrics.length;
  const avgTopSpeed = playerMetrics.reduce((sum, m) => sum + (parseFloat(m.topSpeed as any) || 0), 0) / playerMetrics.length;
  const avgSprints = playerMetrics.reduce((sum, m) => sum + (m.sprintCount || 0), 0) / playerMetrics.length;

  // Compare with team averages
  const touchesVsTeam = teamAverages?.avgTouches 
    ? ((avgTouches - teamAverages.avgTouches) / teamAverages.avgTouches) * 100 
    : 0;
  const distanceVsTeam = teamAverages?.avgDistance 
    ? ((avgDistance - teamAverages.avgDistance) / teamAverages.avgDistance) * 100 
    : 0;

  const getComparisonBadge = (percentage: number) => {
    if (percentage > 10) return { variant: 'default' as const, icon: TrendingUp, text: `+${percentage.toFixed(0)}%` };
    if (percentage < -10) return { variant: 'destructive' as const, icon: TrendingDown, text: `${percentage.toFixed(0)}%` };
    return { variant: 'secondary' as const, icon: Activity, text: `${percentage >= 0 ? '+' : ''}${percentage.toFixed(0)}%` };
  };

  const touchesComparison = getComparisonBadge(touchesVsTeam);
  const distanceComparison = getComparisonBadge(distanceVsTeam);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation('/playermaker')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'العودة' : 'Back'}
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{playerName}</h1>
              <p className="text-muted-foreground">
                {latestMetrics.ageGroup} • {playerMetrics.length} {language === 'ar' ? 'جلسات' : 'sessions'}
              </p>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'ar' ? 'متوسط اللمسات' : 'Avg Touches'}
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgTouches.toFixed(0)}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={touchesComparison.variant} className="flex items-center gap-1">
                  <touchesComparison.icon className="h-3 w-3" />
                  {touchesComparison.text}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'مقابل الفريق' : 'vs team'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'ar' ? 'متوسط المسافة' : 'Avg Distance'}
              </CardTitle>
              <Footprints className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgDistance.toFixed(0)}m</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={distanceComparison.variant} className="flex items-center gap-1">
                  <distanceComparison.icon className="h-3 w-3" />
                  {distanceComparison.text}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'مقابل الفريق' : 'vs team'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'ar' ? 'أقصى سرعة' : 'Top Speed'}
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgTopSpeed.toFixed(1)} m/s</div>
              <p className="text-xs text-muted-foreground mt-1">
                {language === 'ar' ? 'متوسط أقصى سرعة' : 'Average top speed'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'ar' ? 'السباقات' : 'Sprints'}
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgSprints.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {language === 'ar' ? 'متوسط لكل جلسة' : 'Average per session'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI Performance Assessment */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle>{language === 'ar' ? 'تقييم الأداء بالذكاء الاصطناعي' : 'AI Performance Assessment'}</CardTitle>
            </div>
            <CardDescription>
              {language === 'ar' 
                ? 'تحليل شامل لأداء اللاعب بناءً على البيانات' 
                : 'Comprehensive analysis of player performance based on data'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Strengths */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {language === 'ar' ? 'نقاط القوة' : 'Strengths'}
                </h4>
                <div className="space-y-2">
                  {avgTouches > (teamAverages?.avgTouches || 0) && (
                    <div className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-1.5" />
                      <p className="text-muted-foreground">
                        {language === 'ar' 
                          ? `أداء ممتاز في اللمسات (${touchesVsTeam.toFixed(0)}% أعلى من متوسط الفريق)` 
                          : `Excellent ball control with ${touchesVsTeam.toFixed(0)}% more touches than team average`}
                      </p>
                    </div>
                  )}
                  {avgDistance > (teamAverages?.avgDistance || 0) && (
                    <div className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-1.5" />
                      <p className="text-muted-foreground">
                        {language === 'ar' 
                          ? `قدرة تحمل عالية (${distanceVsTeam.toFixed(0)}% أعلى من متوسط الفريق)` 
                          : `High endurance with ${distanceVsTeam.toFixed(0)}% more distance covered than team average`}
                      </p>
                    </div>
                  )}
                  {avgTopSpeed > 5.5 && (
                    <div className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-1.5" />
                      <p className="text-muted-foreground">
                        {language === 'ar' 
                          ? `سرعة قصوى ممتازة (${avgTopSpeed.toFixed(1)} م/ث)` 
                          : `Excellent top speed (${avgTopSpeed.toFixed(1)} m/s)`}
                      </p>
                    </div>
                  )}
                  {avgSprints > 15 && (
                    <div className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-1.5" />
                      <p className="text-muted-foreground">
                        {language === 'ar' 
                          ? `نشاط عالي مع ${avgSprints.toFixed(0)} سباق في المتوسط` 
                          : `High activity with ${avgSprints.toFixed(0)} sprints on average`}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Areas for Improvement */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  {language === 'ar' ? 'مجالات التحسين' : 'Areas for Improvement'}
                </h4>
                <div className="space-y-2">
                  {avgTouches < (teamAverages?.avgTouches || 0) && (
                    <div className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5" />
                      <p className="text-muted-foreground">
                        {language === 'ar' 
                          ? `يحتاج إلى تحسين التحكم بالكرة (${Math.abs(touchesVsTeam).toFixed(0)}% أقل من متوسط الفريق)` 
                          : `Ball control needs improvement (${Math.abs(touchesVsTeam).toFixed(0)}% below team average)`}
                      </p>
                    </div>
                  )}
                  {avgDistance < (teamAverages?.avgDistance || 0) && (
                    <div className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5" />
                      <p className="text-muted-foreground">
                        {language === 'ar' 
                          ? `يحتاج إلى تحسين القدرة على التحمل (${Math.abs(distanceVsTeam).toFixed(0)}% أقل من متوسط الفريق)` 
                          : `Endurance needs work (${Math.abs(distanceVsTeam).toFixed(0)}% below team average)`}
                      </p>
                    </div>
                  )}
                  {avgTopSpeed < 5.0 && (
                    <div className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5" />
                      <p className="text-muted-foreground">
                        {language === 'ar' 
                          ? `السرعة القصوى يمكن تحسينها (${avgTopSpeed.toFixed(1)} م/ث)` 
                          : `Top speed can be improved (${avgTopSpeed.toFixed(1)} m/s)`}
                      </p>
                    </div>
                  )}
                  {avgSprints < 10 && (
                    <div className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5" />
                      <p className="text-muted-foreground">
                        {language === 'ar' 
                          ? `يحتاج إلى زيادة النشاط والحركة (${avgSprints.toFixed(0)} سباق فقط)` 
                          : `Needs more activity and movement (only ${avgSprints.toFixed(0)} sprints)`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Training Recommendations */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <CardTitle>{language === 'ar' ? 'توصيات التدريب بالذكاء الاصطناعي' : 'AI Training Recommendations'}</CardTitle>
            </div>
            <CardDescription>
              {language === 'ar' 
                ? 'توصيات مخصصة لتحسين الأداء' 
                : 'Personalized recommendations to improve performance'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {avgTouches < (teamAverages?.avgTouches || 0) && (
                <div className="border-l-4 border-primary pl-4 py-2">
                  <h4 className="font-semibold text-sm mb-1">
                    {language === 'ar' ? 'تحسين التحكم بالكرة' : 'Improve Ball Control'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' 
                      ? 'ركز على تمارين اللمس والتحكم بالكرة. مارس تمارين الكرة الضيقة والتمرير السريع لمدة 20 دقيقة يومياً.' 
                      : 'Focus on touch and ball control drills. Practice close ball control and quick passing for 20 minutes daily.'}
                  </p>
                </div>
              )}
              {avgDistance < (teamAverages?.avgDistance || 0) && (
                <div className="border-l-4 border-chart-2 pl-4 py-2">
                  <h4 className="font-semibold text-sm mb-1">
                    {language === 'ar' ? 'تحسين القدرة على التحمل' : 'Build Endurance'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' 
                      ? 'أضف جلسات جري متواصل 3 مرات أسبوعياً. ابدأ بـ 15 دقيقة وزد تدريجياً إلى 30 دقيقة.' 
                      : 'Add continuous running sessions 3 times per week. Start with 15 minutes and gradually increase to 30 minutes.'}
                  </p>
                </div>
              )}
              {avgTopSpeed < 5.5 && (
                <div className="border-l-4 border-chart-3 pl-4 py-2">
                  <h4 className="font-semibold text-sm mb-1">
                    {language === 'ar' ? 'تطوير السرعة' : 'Develop Speed'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' 
                      ? 'مارس تمارين السرعة القصوى: 6-8 سباقات بطول 30-40 متر مع راحة كاملة بين كل سباق.' 
                      : 'Practice speed drills: 6-8 sprints of 30-40 meters with full recovery between each sprint.'}
                  </p>
                </div>
              )}
              {avgSprints < 15 && (
                <div className="border-l-4 border-chart-4 pl-4 py-2">
                  <h4 className="font-semibold text-sm mb-1">
                    {language === 'ar' ? 'زيادة النشاط' : 'Increase Activity'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' 
                      ? 'شارك أكثر في اللعب. حاول القيام بسباقات قصيرة عند فقدان الكرة واستعادة المراكز بسرعة.' 
                      : 'Get more involved in play. Make short sprints when losing the ball and quickly recover positions.'}
                  </p>
                </div>
              )}
              {avgTouches > (teamAverages?.avgTouches || 0) && avgDistance > (teamAverages?.avgDistance || 0) && (
                <div className="border-l-4 border-green-600 pl-4 py-2">
                  <h4 className="font-semibold text-sm mb-1">
                    {language === 'ar' ? 'حافظ على المستوى' : 'Maintain Excellence'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' 
                      ? 'أداؤك ممتاز! ركز على الاستمرارية وتطوير المهارات التكتيكية واتخاذ القرار.' 
                      : 'Your performance is excellent! Focus on consistency and developing tactical skills and decision-making.'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Historical Trend Analysis */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-chart-1" />
              <CardTitle>{language === 'ar' ? 'تحليل الاتجاهات التاريخية' : 'Historical Trend Analysis'}</CardTitle>
            </div>
            <CardDescription>
              {language === 'ar' 
                ? 'تتبع التحسن عبر آخر ' + playerMetrics.length + ' جلسات' 
                : 'Track improvement across last ' + playerMetrics.length + ' sessions'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Touches Improvement */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">
                    {language === 'ar' ? 'تطور اللمسات' : 'Touches Improvement'}
                  </span>
                  <div className="flex items-center gap-2">
                    {playerMetrics[0]?.totalTouches > playerMetrics[playerMetrics.length - 1]?.totalTouches ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-amber-600" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {language === 'ar' ? 'المتوسط:' : 'Avg:'} {avgTouches.toFixed(0)}
                    </span>
                  </div>
                </div>
                <div className="relative h-16 flex items-end gap-1">
                  {playerMetrics.slice(0, 10).reverse().map((m, i) => {
                    const height = ((m.totalTouches || 0) / Math.max(...playerMetrics.map(x => x.totalTouches || 0))) * 100;
                    return (
                      <div key={i} className="flex-1 bg-primary/20 rounded-t" style={{ height: `${height}%` }}>
                        <div className="w-full bg-primary rounded-t" style={{ height: '100%' }} />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{language === 'ar' ? 'الأقدم' : 'Oldest'}</span>
                  <span>{language === 'ar' ? 'الأحدث' : 'Latest'}</span>
                </div>
              </div>

              {/* Distance Improvement */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">
                    {language === 'ar' ? 'تطور المسافة' : 'Distance Improvement'}
                  </span>
                  <div className="flex items-center gap-2">
                    {parseFloat(playerMetrics[0]?.distanceCovered as any || '0') > parseFloat(playerMetrics[playerMetrics.length - 1]?.distanceCovered as any || '0') ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-amber-600" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {language === 'ar' ? 'المتوسط:' : 'Avg:'} {avgDistance.toFixed(0)}m
                    </span>
                  </div>
                </div>
                <div className="relative h-16 flex items-end gap-1">
                  {playerMetrics.slice(0, 10).reverse().map((m, i) => {
                    const height = (parseFloat(m.distanceCovered as any || '0') / Math.max(...playerMetrics.map(x => parseFloat(x.distanceCovered as any) || 0))) * 100;
                    return (
                      <div key={i} className="flex-1 bg-chart-2/20 rounded-t" style={{ height: `${height}%` }}>
                        <div className="w-full bg-chart-2 rounded-t" style={{ height: '100%' }} />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{language === 'ar' ? 'الأقدم' : 'Oldest'}</span>
                  <span>{language === 'ar' ? 'الأحدث' : 'Latest'}</span>
                </div>
              </div>

              {/* Speed & Sprint Trends */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-semibold mb-2">
                    {language === 'ar' ? 'السرعة القصوى' : 'Top Speed'}
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {avgTopSpeed.toFixed(1)}
                    <span className="text-sm text-muted-foreground ml-1">m/s</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {language === 'ar' ? 'النطاق:' : 'Range:'} {Math.min(...playerMetrics.map(m => parseFloat(m.topSpeed as any) || 0)).toFixed(1)} - {Math.max(...playerMetrics.map(m => parseFloat(m.topSpeed as any) || 0)).toFixed(1)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold mb-2">
                    {language === 'ar' ? 'متوسط السباقات' : 'Avg Sprints'}
                  </div>
                  <div className="text-2xl font-bold text-chart-3">
                    {avgSprints.toFixed(0)}
                    <span className="text-sm text-muted-foreground ml-1">{language === 'ar' ? 'سباق' : 'sprints'}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {language === 'ar' ? 'النطاق:' : 'Range:'} {Math.min(...playerMetrics.map(m => m.sprintCount || 0))} - {Math.max(...playerMetrics.map(m => m.sprintCount || 0))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coach Annotations */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <CardTitle>{language === 'ar' ? 'ملاحظات المدرب' : 'Coach Annotations'}</CardTitle>
            </div>
            <CardDescription>
              {language === 'ar' 
                ? 'ملاحظات وتعليقات مخصصة من المدرب' 
                : 'Custom notes and observations from coaches'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.role === 'coach' || user.role === 'admin' ? (
              <CoachAnnotationForm playerId={playerId!} playerName={playerName} />
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' 
                    ? 'لا توجد ملاحظات من المدرب حتى الآن' 
                    : 'No coach annotations yet'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'الجلسات الأخيرة' : 'Recent Sessions'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {playerMetrics.slice(0, 10).map((metrics, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {new Date(metrics.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                      </span>
                    </div>
                    <Badge variant="outline">{metrics.sessionId}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">{language === 'ar' ? 'اللمسات' : 'Touches'}</p>
                      <p className="font-semibold">{metrics.totalTouches || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{language === 'ar' ? 'المسافة' : 'Distance'}</p>
                      <p className="font-semibold">{parseFloat(metrics.distanceCovered as any || '0').toFixed(0)}m</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{language === 'ar' ? 'السرعة' : 'Top Speed'}</p>
                      <p className="font-semibold">{parseFloat(metrics.topSpeed as any || '0').toFixed(1)} m/s</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{language === 'ar' ? 'السباقات' : 'Sprints'}</p>
                      <p className="font-semibold">{metrics.sprintCount || 0}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
