import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc";
import { Upload, Video, TrendingUp, Award, Target } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ScoutNetwork() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [videoUrl, setVideoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const createReport = trpc.scoutNetwork.createReport.useMutation();
  const { data: reports } = trpc.scoutNetwork.getReports.useQuery();

  const handleAnalyze = async () => {
    if (!videoUrl.trim()) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "يرجى إدخال رابط الفيديو" : "Please enter a video URL",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    try {
      await createReport.mutateAsync({
        videoUrl,
        notes,
        status: 'pending',
      });

      toast({
        title: language === 'ar' ? "نجح" : "Success",
        description: language === 'ar' ? "تم إرسال الفيديو للتحليل" : "Video submitted for analysis",
      });

      setVideoUrl("");
      setNotes("");
    } catch (error) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "فشل إرسال الفيديو" : "Failed to submit video",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Video className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? 'شبكة الكشافة' : 'Scout Network'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'تحليل أداء اللاعبين بالذكاء الاصطناعي' : 'AI-powered player performance analysis'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {language === 'ar' ? 'رفع فيديو' : 'Upload Video'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' 
                ? 'قم برفع فيديو مباراة أو تدريب للتحليل' 
                : 'Upload a match or training video for analysis'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="videoUrl">
                {language === 'ar' ? 'رابط الفيديو' : 'Video URL'}
              </Label>
              <Input
                id="videoUrl"
                placeholder={language === 'ar' ? 'https://youtube.com/watch?v=...' : 'https://youtube.com/watch?v=...'}
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">
                {language === 'ar' ? 'ملاحظات' : 'Notes'}
              </Label>
              <Textarea
                id="notes"
                placeholder={language === 'ar' ? 'أضف أي ملاحظات أو سياق...' : 'Add any notes or context...'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>

            <Button 
              onClick={handleAnalyze} 
              disabled={analyzing}
              className="w-full"
            >
              {analyzing 
                ? (language === 'ar' ? 'جاري التحليل...' : 'Analyzing...') 
                : (language === 'ar' ? 'تحليل الفيديو' : 'Analyze Video')}
            </Button>
          </CardContent>
        </Card>

        {/* Analysis Metrics */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {language === 'ar' ? 'مقاييس التحليل' : 'Analysis Metrics'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">
                  {language === 'ar' ? 'المهارات التقنية' : 'Technical Skills'}
                </span>
                <Award className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">
                  {language === 'ar' ? 'الوعي التكتيكي' : 'Tactical Awareness'}
                </span>
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">
                  {language === 'ar' ? 'اللياقة البدنية' : 'Physical Fitness'}
                </span>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'ar' ? 'التقارير الأخيرة' : 'Recent Reports'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reports && reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((report) => (
                <div 
                  key={report.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Video className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {language === 'ar' ? 'تقرير كشفي' : 'Scout Report'} #{report.id}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      report.status === 'completed' ? 'bg-green-100 text-green-700' :
                      report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {report.status === 'completed' ? (language === 'ar' ? 'مكتمل' : 'Completed') :
                       report.status === 'pending' ? (language === 'ar' ? 'قيد المعالجة' : 'Pending') :
                       (language === 'ar' ? 'مسودة' : 'Draft')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {language === 'ar' ? 'لا توجد تقارير بعد' : 'No reports yet'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
