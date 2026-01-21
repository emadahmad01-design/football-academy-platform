import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Trophy, Star, ChevronLeft, Calendar,
  MapPin, Clock, Shield
} from 'lucide-react';
import { Link } from 'wouter';
import WhatsAppButton from '@/components/WhatsAppButton';
import MobileMenu from '@/components/MobileMenu';
import LanguageToggle from '@/components/LanguageToggle';

export default function AcademyTeams() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const teams = [
    {
      id: 'u8',
      name: isRTL ? 'تحت 8 سنوات' : 'Under 8',
      shortName: 'U-8',
      ageRange: isRTL ? '6-8 سنوات' : '6-8 years',
      playerCount: 24,
      coachName: isRTL ? 'أحمد حسن' : 'Ahmed Hassan',
      trainingDays: isRTL ? 'السبت والثلاثاء' : 'Saturday & Tuesday',
      trainingTime: '4:00 PM - 5:30 PM',
      color: 'from-blue-500 to-blue-600',
      achievements: [
        isRTL ? 'بطولة القاهرة للناشئين 2024' : 'Cairo Youth Cup 2024',
      ],
      players: [
        { name: isRTL ? 'يوسف أحمد' : 'Youssef Ahmed', position: isRTL ? 'مهاجم' : 'Forward', number: 10 },
        { name: isRTL ? 'عمر خالد' : 'Omar Khaled', position: isRTL ? 'وسط' : 'Midfielder', number: 8 },
        { name: isRTL ? 'آدم محمد' : 'Adam Mohamed', position: isRTL ? 'مدافع' : 'Defender', number: 4 },
      ]
    },
    {
      id: 'u10',
      name: isRTL ? 'تحت 10 سنوات' : 'Under 10',
      shortName: 'U-10',
      ageRange: isRTL ? '8-10 سنوات' : '8-10 years',
      playerCount: 28,
      coachName: isRTL ? 'محمد علي' : 'Mohamed Ali',
      trainingDays: isRTL ? 'الأحد والأربعاء' : 'Sunday & Wednesday',
      trainingTime: '4:00 PM - 5:30 PM',
      color: 'from-green-500 to-green-600',
      achievements: [
        isRTL ? 'دوري الأكاديميات 2024 - المركز الثاني' : 'Academy League 2024 - 2nd Place',
        isRTL ? 'كأس الصداقة 2024' : 'Friendship Cup 2024',
      ],
      players: [
        { name: isRTL ? 'كريم حسن' : 'Karim Hassan', position: isRTL ? 'حارس' : 'Goalkeeper', number: 1 },
        { name: isRTL ? 'زياد طارق' : 'Ziad Tarek', position: isRTL ? 'مهاجم' : 'Forward', number: 9 },
        { name: isRTL ? 'سيف الدين' : 'Seif El-Din', position: isRTL ? 'وسط' : 'Midfielder', number: 6 },
      ]
    },
    {
      id: 'u12',
      name: isRTL ? 'تحت 12 سنة' : 'Under 12',
      shortName: 'U-12',
      ageRange: isRTL ? '10-12 سنة' : '10-12 years',
      playerCount: 32,
      coachName: isRTL ? 'خالد محمود' : 'Khaled Mahmoud',
      trainingDays: isRTL ? 'الاثنين والخميس' : 'Monday & Thursday',
      trainingTime: '5:00 PM - 7:00 PM',
      color: 'from-gold-500 to-gold-600',
      achievements: [
        isRTL ? 'بطولة مصر للناشئين 2024' : 'Egypt Youth Championship 2024',
        isRTL ? 'أفضل أكاديمية في القاهرة' : 'Best Academy in Cairo',
        isRTL ? 'كأس التحدي 2024' : 'Challenge Cup 2024',
      ],
      players: [
        { name: isRTL ? 'مالك كمال' : 'Malek Kamal', position: isRTL ? 'وسط دفاعي' : 'Defensive Mid', number: 5 },
        { name: isRTL ? 'ياسين أحمد' : 'Yassin Ahmed', position: isRTL ? 'مهاجم' : 'Forward', number: 11 },
        { name: isRTL ? 'حمزة علي' : 'Hamza Ali', position: isRTL ? 'مدافع' : 'Defender', number: 3 },
      ]
    },
    {
      id: 'u14',
      name: isRTL ? 'تحت 14 سنة' : 'Under 14',
      shortName: 'U-14',
      ageRange: isRTL ? '12-14 سنة' : '12-14 years',
      playerCount: 26,
      coachName: isRTL ? 'عمرو سعيد' : 'Amr Saeed',
      trainingDays: isRTL ? 'السبت والثلاثاء والخميس' : 'Sat, Tue & Thu',
      trainingTime: '5:00 PM - 7:30 PM',
      color: 'from-purple-500 to-purple-600',
      achievements: [
        isRTL ? 'دوري الشباب الإقليمي 2024' : 'Regional Youth League 2024',
        isRTL ? '3 لاعبين في المنتخب الوطني' : '3 Players in National Team',
      ],
      players: [
        { name: isRTL ? 'أحمد فتحي' : 'Ahmed Fathy', position: isRTL ? 'قائد الفريق' : 'Team Captain', number: 10 },
        { name: isRTL ? 'محمود سامي' : 'Mahmoud Samy', position: isRTL ? 'مهاجم' : 'Striker', number: 9 },
        { name: isRTL ? 'علي حسام' : 'Ali Hossam', position: isRTL ? 'حارس' : 'Goalkeeper', number: 1 },
      ]
    },
    {
      id: 'u16',
      name: isRTL ? 'تحت 16 سنة' : 'Under 16',
      shortName: 'U-16',
      ageRange: isRTL ? '14-16 سنة' : '14-16 years',
      playerCount: 22,
      coachName: isRTL ? 'حسام غالي' : 'Hossam Ghaly',
      trainingDays: isRTL ? 'يومياً ما عدا الجمعة' : 'Daily except Friday',
      trainingTime: '4:00 PM - 7:00 PM',
      color: 'from-red-500 to-red-600',
      achievements: [
        isRTL ? 'بطولة مصر للشباب 2024' : 'Egypt Youth Championship 2024',
        isRTL ? '5 لاعبين انتقلوا للأندية المحترفة' : '5 Players moved to Pro Clubs',
        isRTL ? 'أفضل فريق شباب في مصر' : 'Best Youth Team in Egypt',
      ],
      players: [
        { name: isRTL ? 'عبدالله محمد' : 'Abdullah Mohamed', position: isRTL ? 'قائد' : 'Captain', number: 7 },
        { name: isRTL ? 'يوسف عادل' : 'Youssef Adel', position: isRTL ? 'مهاجم' : 'Forward', number: 9 },
        { name: isRTL ? 'كريم مصطفى' : 'Karim Mostafa', position: isRTL ? 'وسط' : 'Midfielder', number: 8 },
      ]
    },
  ];

  const selectedTeamData = teams.find(t => t.id === selectedTeam);

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-950 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo-transparent.png" alt="Future Stars FC" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold text-foreground">Future Stars FC</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              {isRTL ? 'الرئيسية' : 'Home'}
            </Link>
            <Link href="/team" className="text-muted-foreground hover:text-foreground transition-colors">
              {isRTL ? 'المدربون' : 'Coaches'}
            </Link>
            <Link href="/events" className="text-muted-foreground hover:text-foreground transition-colors">
              {isRTL ? 'الفعاليات' : 'Events'}
            </Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              {isRTL ? 'الأسعار' : 'Pricing'}
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <MobileMenu isLoggedIn={false} />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4 bg-gold-500 text-navy-900">
              <Shield className="w-3 h-3 mr-1" />
              {isRTL ? 'فرق الأكاديمية' : 'Academy Teams'}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {isRTL ? 'لاعبونا الموهوبون' : 'Our Talented Players'}
            </h1>
            <p className="text-lg text-gray-300">
              {isRTL 
                ? 'تعرف على فرق الأكاديمية المختلفة حسب الفئة العمرية واكتشف نجوم المستقبل'
                : 'Meet our academy teams organized by age group and discover the future stars'}
            </p>
          </div>
        </div>
      </section>

      {/* Teams Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Card 
                key={team.id}
                className={`overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl ${
                  selectedTeam === team.id ? 'ring-2 ring-gold-500' : ''
                }`}
                onClick={() => setSelectedTeam(selectedTeam === team.id ? null : team.id)}
              >
                <div className={`h-2 bg-gradient-to-r ${team.color}`} />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{team.name}</h3>
                      <p className="text-sm text-gray-500">{team.ageRange}</p>
                    </div>
                    <Badge className={`bg-gradient-to-r ${team.color} text-white text-lg px-3 py-1`}>
                      {team.shortName}
                    </Badge>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{team.playerCount} {isRTL ? 'لاعب' : 'Players'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Star className="w-4 h-4" />
                      <span>{isRTL ? 'المدرب:' : 'Coach:'} {team.coachName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{team.trainingDays}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{team.trainingTime}</span>
                    </div>
                  </div>

                  {/* Achievements */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">
                      {isRTL ? 'الإنجازات' : 'Achievements'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {team.achievements.slice(0, 2).map((achievement, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          <Trophy className="w-3 h-3 mr-1 text-gold-500" />
                          {achievement}
                        </Badge>
                      ))}
                      {team.achievements.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{team.achievements.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Selected Team Details */}
      {selectedTeamData && (
        <section className="py-12 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {selectedTeamData.name} - {isRTL ? 'اللاعبون' : 'Players'}
                </h2>
                <Button variant="outline" onClick={() => setSelectedTeam(null)}>
                  {isRTL ? 'إغلاق' : 'Close'}
                </Button>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {selectedTeamData.players.map((player, idx) => (
                  <Card key={idx} className="overflow-hidden">
                    <div className={`h-1 bg-gradient-to-r ${selectedTeamData.color}`} />
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${selectedTeamData.color} flex items-center justify-center text-white font-bold text-xl`}>
                          {player.number}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{player.name}</p>
                          <p className="text-sm text-gray-500">{player.position}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-8 text-center">
                <p className="text-gray-500 mb-4">
                  {isRTL 
                    ? 'للاطلاع على القائمة الكاملة للاعبين، يرجى تسجيل الدخول كولي أمر'
                    : 'To view the full player roster, please log in as a parent'}
                </p>
                <Link href="/dashboard">
                  <Button className="bg-gold-500 hover:bg-gold-600 text-navy-900">
                    {isRTL ? 'تسجيل الدخول' : 'Login to View More'}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-navy-900 to-navy-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {isRTL ? 'انضم إلى فريقنا' : 'Join Our Team'}
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            {isRTL 
              ? 'سجل طفلك في أكاديمية فيوتشر ستارز وامنحه الفرصة ليصبح نجم المستقبل'
              : 'Register your child at Future Stars FC Academy and give them the chance to become a future star'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing">
              <Button size="lg" className="bg-gold-500 hover:bg-gold-600 text-navy-900">
                {isRTL ? 'عرض الأسعار' : 'View Pricing'}
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                {isRTL ? 'تواصل معنا' : 'Contact Us'}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <WhatsAppButton />
    </div>
  );
}
