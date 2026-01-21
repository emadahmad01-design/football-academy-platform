import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { TrendingUp, TrendingDown, Minus, Loader2, Activity } from 'lucide-react';
import { Streamdown } from 'streamdown';

interface HalfComparisonProps {
  matchId: number;
}

export default function HalfComparison({ matchId }: HalfComparisonProps) {
  const { t, language } = useLanguage();
  const [selectedHalf, setSelectedHalf] = useState<'first' | 'second' | 'comparison'>('comparison');
  const [aiInsights, setAiInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Fetch half comparison data
  const { data: comparisonData, isLoading } = trpc.liveMatch.getHalfComparison.useQuery(
    { matchId },
    { enabled: !!matchId }
  );

  // Generate AI insights mutation
  const generateInsights = trpc.liveMatch.generateHalfInsights.useMutation({
    onSuccess: (data) => {
      setAiInsights(data.insights);
      setLoadingInsights(false);
    },
    onError: () => {
      setLoadingInsights(false);
    },
  });

  useEffect(() => {
    if (comparisonData && !aiInsights && !loadingInsights) {
      setLoadingInsights(true);
      generateInsights.mutate({ matchId });
    }
  }, [comparisonData]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (!comparisonData) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          {language === 'ar' ? 'لا توجد بيانات للمقارنة بعد' : 'No comparison data available yet'}
        </p>
      </Card>
    );
  }

  const { firstHalf, secondHalf } = comparisonData;

  const renderStatComparison = (label: string, first: number, second: number, unit: string = '') => {
    const diff = second - first;
    const percentChange = first > 0 ? ((diff / first) * 100).toFixed(1) : '0';
    
    return (
      <div className="flex items-center justify-between py-3 border-b">
        <span className="font-medium">{label}</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{first}{unit}</span>
          <div className="flex items-center gap-1">
            {diff > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : diff < 0 ? (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ) : (
              <Minus className="h-4 w-4 text-gray-400" />
            )}
            <span className={`text-sm font-semibold ${diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {diff > 0 ? '+' : ''}{diff}{unit}
            </span>
          </div>
          <span className="text-sm font-medium">{second}{unit}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Half Selector */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {language === 'ar' ? 'مقارنة الشوطين' : 'Half-by-Half Comparison'}
          </h3>
          <div className="flex gap-2">
            <Button
              variant={selectedHalf === 'first' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedHalf('first')}
            >
              {language === 'ar' ? 'الشوط الأول' : 'First Half'}
            </Button>
            <Button
              variant={selectedHalf === 'second' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedHalf('second')}
            >
              {language === 'ar' ? 'الشوط الثاني' : 'Second Half'}
            </Button>
            <Button
              variant={selectedHalf === 'comparison' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedHalf('comparison')}
            >
              {language === 'ar' ? 'المقارنة' : 'Comparison'}
            </Button>
          </div>
        </div>

        {/* Statistics Comparison */}
        {selectedHalf === 'comparison' && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-4 mb-4 text-center font-semibold">
              <div>{language === 'ar' ? 'الشوط الأول' : 'First Half'}</div>
              <div>{language === 'ar' ? 'الإحصائية' : 'Statistic'}</div>
              <div>{language === 'ar' ? 'الشوط الثاني' : 'Second Half'}</div>
            </div>
            {renderStatComparison(
              language === 'ar' ? 'الاستحواذ' : 'Possession',
              firstHalf.possession,
              secondHalf.possession,
              '%'
            )}
            {renderStatComparison(
              language === 'ar' ? 'التسديدات' : 'Shots',
              firstHalf.shots,
              secondHalf.shots
            )}
            {renderStatComparison(
              language === 'ar' ? 'التسديدات على المرمى' : 'Shots on Target',
              firstHalf.shotsOnTarget,
              secondHalf.shotsOnTarget
            )}
            {renderStatComparison(
              language === 'ar' ? 'الركنيات' : 'Corners',
              firstHalf.corners,
              secondHalf.corners
            )}
            {renderStatComparison(
              language === 'ar' ? 'الأخطاء' : 'Fouls',
              firstHalf.fouls,
              secondHalf.fouls
            )}
            {renderStatComparison(
              language === 'ar' ? 'المسافة المقطوعة (كم)' : 'Distance Covered (km)',
              firstHalf.distanceCovered,
              secondHalf.distanceCovered,
              ' km'
            )}
            {renderStatComparison(
              language === 'ar' ? 'السرعات العالية' : 'High-Speed Runs',
              firstHalf.highSpeedRuns,
              secondHalf.highSpeedRuns
            )}
          </div>
        )}

        {/* Individual Half Display */}
        {selectedHalf !== 'comparison' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(selectedHalf === 'first' ? firstHalf : secondHalf).map(([key, value]) => (
              <div key={key} className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                <p className="text-2xl font-bold">{value}{key === 'possession' ? '%' : ''}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* AI Insights */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">
            {language === 'ar' ? '🤖 تحليل الذكاء الاصطناعي' : '🤖 AI Tactical Analysis'}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoadingInsights(true);
              generateInsights.mutate({ matchId });
            }}
            disabled={loadingInsights}
          >
            {loadingInsights ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {language === 'ar' ? 'جاري التحليل...' : 'Analyzing...'}
              </>
            ) : (
              language === 'ar' ? 'تحليل جديد' : 'Refresh Analysis'
            )}
          </Button>
        </div>
        
        {loadingInsights ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : aiInsights ? (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <Streamdown>{aiInsights}</Streamdown>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            {language === 'ar' ? 'انقر على "تحليل جديد" للحصول على رؤى الذكاء الاصطناعي' : 'Click "Refresh Analysis" to get AI insights'}
          </p>
        )}
      </Card>
    </div>
  );
}
