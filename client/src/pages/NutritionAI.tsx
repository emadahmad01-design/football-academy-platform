import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc";
import { Camera, Apple, TrendingUp, Flame, Droplet } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NutritionAI() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [mealDescription, setMealDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [calories, setCalories] = useState("");

  const logMeal = trpc.nutritionAI.logMeal.useMutation();
  const { data: mealLogs } = trpc.nutritionAI.getMealLogs.useQuery();

  const handleLogMeal = async () => {
    if (!mealDescription.trim()) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "يرجى إدخال وصف الوجبة" : "Please enter meal description",
        variant: "destructive",
      });
      return;
    }

    try {
      await logMeal.mutateAsync({
        mealDescription,
        photoUrl: photoUrl || undefined,
        calories: calories ? parseInt(calories) : undefined,
      });

      toast({
        title: language === 'ar' ? "نجح" : "Success",
        description: language === 'ar' ? "تم تسجيل الوجبة" : "Meal logged successfully",
      });

      setMealDescription("");
      setPhotoUrl("");
      setCalories("");
    } catch (error) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "فشل تسجيل الوجبة" : "Failed to log meal",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Apple className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? 'التغذية الذكية' : 'Nutrition AI'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'تتبع وتحليل التغذية بالذكاء الاصطناعي' : 'AI-powered nutrition tracking and analysis'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Meal Logging Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              {language === 'ar' ? 'تسجيل وجبة' : 'Log Meal'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' 
                ? 'سجل وجباتك للحصول على توصيات غذائية مخصصة' 
                : 'Log your meals to get personalized nutrition recommendations'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mealDescription">
                {language === 'ar' ? 'وصف الوجبة' : 'Meal Description'}
              </Label>
              <Textarea
                id="mealDescription"
                placeholder={language === 'ar' ? 'مثال: دجاج مشوي مع أرز بني وسلطة' : 'e.g., Grilled chicken with brown rice and salad'}
                value={mealDescription}
                onChange={(e) => setMealDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photoUrl">
                {language === 'ar' ? 'رابط صورة الوجبة (اختياري)' : 'Meal Photo URL (optional)'}
              </Label>
              <Input
                id="photoUrl"
                placeholder={language === 'ar' ? 'https://...' : 'https://...'}
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="calories">
                {language === 'ar' ? 'السعرات الحرارية (اختياري)' : 'Calories (optional)'}
              </Label>
              <Input
                id="calories"
                type="number"
                placeholder="500"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleLogMeal} 
              className="w-full"
            >
              {language === 'ar' ? 'تسجيل الوجبة' : 'Log Meal'}
            </Button>
          </CardContent>
        </Card>

        {/* Nutrition Stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {language === 'ar' ? 'إحصائيات اليوم' : "Today's Stats"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'السعرات الحرارية' : 'Calories'}
                  </p>
                  <p className="text-2xl font-bold">
                    {mealLogs?.reduce((sum, log) => sum + (log.calories || 0), 0) || 0}
                  </p>
                </div>
                <Flame className="h-8 w-8 text-orange-500" />
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'الترطيب' : 'Hydration'}
                  </p>
                  <p className="text-2xl font-bold">
                    {mealLogs?.reduce((sum, log) => sum + (log.hydration || 0), 0) || 0}L
                  </p>
                </div>
                <Droplet className="h-8 w-8 text-blue-500" />
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'البروتين' : 'Protein'}
                  </p>
                  <p className="text-2xl font-bold">
                    {mealLogs?.reduce((sum, log) => sum + (log.protein || 0), 0) || 0}g
                  </p>
                </div>
                <Apple className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Meals */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'ar' ? 'الوجبات الأخيرة' : 'Recent Meals'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mealLogs && mealLogs.length > 0 ? (
            <div className="space-y-3">
              {mealLogs.slice(0, 5).map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Apple className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{log.mealDescription}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(log.loggedAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                      </p>
                    </div>
                  </div>
                  {log.calories && (
                    <div className="flex items-center gap-1 text-sm">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">{log.calories} cal</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {language === 'ar' ? 'لا توجد وجبات مسجلة بعد' : 'No meals logged yet'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
