import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { TrendingUp, Loader2, BarChart3 } from 'lucide-react';
import { Streamdown } from 'streamdown';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PerformanceComparisonProps {
  playerId: number;
  playerName: string;
}

export default function PerformanceComparison({ playerId, playerName }: PerformanceComparisonProps) {
  const { language } = useLanguage();
  const [metric, setMetric] = useState<string>('distance');
  const [matchCount, setMatchCount] = useState<number>(5);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);

  const { data: performanceData, isLoading } = trpc.players.getPerformanceHistory.useQuery({
    playerId,
    matchCount,
  });

  const generateInsights = trpc.players.generatePerformanceInsights.useMutation({
    onSuccess: (data) => {
      setInsights(data.insights);
      setLoadingInsights(false);
    },
    onError: () => {
      setLoadingInsights(false);
    },
  });

  const handleGenerateInsights = () => {
    if (!performanceData) return;
    setLoadingInsights(true);
    generateInsights.mutate({ playerId, matchCount });
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (!performanceData || performanceData.matches.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          {language === 'ar' 
            ? 'لا توجد بيانات أداء كافية لهذا اللاعب' 
            : 'Not enough performance data for this player'}
        </p>
      </Card>
    );
  }

  const metricOptions = [
    { value: 'distance', label: language === 'ar' ? 'المسافة المقطوعة' : 'Distance Covered' },
    { value: 'sprints', label: language === 'ar' ? 'عدد السبرينتات' : 'Sprint Count' },
    { value: 'avgSpeed', label: language === 'ar' ? 'متوسط السرعة' : 'Average Speed' },
    { value: 'maxSpeed', label: language === 'ar' ? 'أقصى سرعة' : 'Max Speed' },
    { value: 'avgHeartRate', label: language === 'ar' ? 'معدل ضربات القلب' : 'Heart Rate' },
  ];

  const chartData = {
    labels: performanceData.matches.map((m: any) => 
      `${language === 'ar' ? 'مباراة' : 'Match'} ${m.matchNumber}`
    ),
    datasets: [
      {
        label: metricOptions.find(m => m.value === metric)?.label || metric,
        data: performanceData.matches.map((m: any) => m[metric]),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += context.parsed.y;
            if (metric === 'distance') label += ' km';
            if (metric.includes('Speed')) label += ' km/h';
            if (metric === 'avgHeartRate') label += ' bpm';
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const comparisonData = {
    labels: [language === 'ar' ? 'أفضل' : 'Best', language === 'ar' ? 'متوسط' : 'Average', language === 'ar' ? 'أحدث' : 'Latest'],
    datasets: [
      {
        label: metricOptions.find(m => m.value === metric)?.label || metric,
        data: [
          performanceData.summary.best[metric],
          performanceData.summary.average[metric],
          performanceData.summary.latest[metric],
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(251, 146, 60, 0.8)',
        ],
      },
    ],
  };

  const comparisonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <h3 className="text-lg font-bold">
              {language === 'ar' ? 'مقارنة الأداء التاريخي' : 'Historical Performance Comparison'}
            </h3>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label>{language === 'ar' ? 'المقياس' : 'Metric'}</Label>
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {metricOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{language === 'ar' ? 'عدد المباريات' : 'Number of Matches'}</Label>
            <Select value={matchCount.toString()} onValueChange={(v) => setMatchCount(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 {language === 'ar' ? 'مباريات' : 'matches'}</SelectItem>
                <SelectItem value="10">10 {language === 'ar' ? 'مباريات' : 'matches'}</SelectItem>
                <SelectItem value="15">15 {language === 'ar' ? 'مباراة' : 'matches'}</SelectItem>
                <SelectItem value="20">20 {language === 'ar' ? 'مباراة' : 'matches'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Performance Trend Chart */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-3">
            {language === 'ar' ? 'اتجاه الأداء' : 'Performance Trend'}
          </h4>
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Comparison Chart */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-3">
            {language === 'ar' ? 'مقارنة الإحصائيات' : 'Statistics Comparison'}
          </h4>
          <div className="h-48">
            <Bar data={comparisonData} options={comparisonOptions} />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 bg-green-500/10 border-green-500/20">
            <p className="text-xs text-muted-foreground mb-1">
              {language === 'ar' ? 'أفضل أداء' : 'Best Performance'}
            </p>
            <p className="text-2xl font-bold text-green-600">
              {performanceData.summary.best[metric].toFixed(1)}
            </p>
          </Card>

          <Card className="p-4 bg-blue-500/10 border-blue-500/20">
            <p className="text-xs text-muted-foreground mb-1">
              {language === 'ar' ? 'المتوسط' : 'Average'}
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {performanceData.summary.average[metric].toFixed(1)}
            </p>
          </Card>

          <Card className="p-4 bg-orange-500/10 border-orange-500/20">
            <p className="text-xs text-muted-foreground mb-1">
              {language === 'ar' ? 'آخر مباراة' : 'Latest Match'}
            </p>
            <p className="text-2xl font-bold text-orange-600">
              {performanceData.summary.latest[metric].toFixed(1)}
            </p>
          </Card>
        </div>

        {/* AI Insights */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {language === 'ar' ? 'رؤى الأداء' : 'Performance Insights'}
            </h4>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleGenerateInsights}
              disabled={loadingInsights}
            >
              {loadingInsights ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {language === 'ar' ? 'جاري التحليل...' : 'Analyzing...'}
                </>
              ) : (
                language === 'ar' ? 'تحليل بالذكاء الاصطناعي' : 'AI Analysis'
              )}
            </Button>
          </div>

          {insights ? (
            <Card className="p-4 bg-secondary/20">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <Streamdown>{insights}</Streamdown>
              </div>
            </Card>
          ) : (
            <Card className="p-4 bg-secondary/20">
              <p className="text-sm text-muted-foreground text-center">
                {language === 'ar' 
                  ? 'انقر على "تحليل بالذكاء الاصطناعي" للحصول على رؤى مفصلة' 
                  : 'Click "AI Analysis" for detailed insights'}
              </p>
            </Card>
          )}
        </div>
      </Card>
    </div>
  );
}
