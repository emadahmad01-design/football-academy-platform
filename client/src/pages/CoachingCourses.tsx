import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GraduationCap, 
  Award, 
  BookOpen, 
  Video, 
  Clock, 
  Users, 
  TrendingUp,
  CheckCircle2,
  Lock,
  PlayCircle
} from 'lucide-react';

// FIFA Coaching License Levels
const COACHING_LICENSES = [
  {
    id: 'grassroots',
    level: 'Grassroots',
    levelAr: 'المستوى التأسيسي',
    title: 'Grassroots Coaching Certificate',
    titleAr: 'شهادة تدريب المستوى التأسيسي',
    description: 'Entry-level coaching for youth development (Ages 4-12). Learn fundamental coaching principles and child development.',
    descriptionAr: 'تدريب المستوى المبتدئ لتطوير الشباب (أعمار 4-12). تعلم مبادئ التدريب الأساسية وتطوير الأطفال.',
    duration: '40 hours',
    modules: 8,
    prerequisites: 'None',
    prerequisitesAr: 'لا يوجد',
    minAge: 16,
    color: 'bg-green-500',
    icon: '🌱',
    topics: [
      'Child Development',
      'Basic Football Skills',
      'Fun Training Methods',
      'Safety & First Aid',
      'Communication with Parents',
      'Age-Appropriate Activities',
      'Motivation Techniques',
      'Session Planning'
    ],
    topicsAr: [
      'تطوير الطفل',
      'مهارات كرة القدم الأساسية',
      'طرق التدريب الممتعة',
      'السلامة والإسعافات الأولية',
      'التواصل مع أولياء الأمور',
      'الأنشطة المناسبة للعمر',
      'تقنيات التحفيز',
      'تخطيط الجلسات'
    ]
  },
  {
    id: 'c_license',
    level: 'C License',
    levelAr: 'رخصة C',
    title: 'UEFA/FIFA C License',
    titleAr: 'رخصة يويفا/فيفا C',
    description: 'Foundation level for coaching youth teams. Covers tactical basics, training methodology, and player development.',
    descriptionAr: 'المستوى التأسيسي لتدريب فرق الشباب. يغطي الأساسيات التكتيكية ومنهجية التدريب وتطوير اللاعبين.',
    duration: '120 hours',
    modules: 12,
    prerequisites: 'Grassroots Certificate',
    prerequisitesAr: 'شهادة المستوى التأسيسي',
    minAge: 18,
    color: 'bg-blue-500',
    icon: '🥉',
    topics: [
      'Tactical Fundamentals',
      'Training Methodology',
      'Player Assessment',
      'Match Analysis',
      'Team Management',
      'Technical Development',
      'Physical Conditioning',
      'Psychology of Youth Players',
      'Formation Systems',
      'Game Principles',
      'Communication Skills',
      'Coaching Philosophy'
    ],
    topicsAr: [
      'الأساسيات التكتيكية',
      'منهجية التدريب',
      'تقييم اللاعبين',
      'تحليل المباريات',
      'إدارة الفريق',
      'التطوير الفني',
      'اللياقة البدنية',
      'علم نفس لاعبي الشباب',
      'أنظمة التشكيل',
      'مبادئ اللعبة',
      'مهارات التواصل',
      'فلسفة التدريب'
    ]
  },
  {
    id: 'b_license',
    level: 'B License',
    levelAr: 'رخصة B',
    title: 'UEFA/FIFA B License',
    titleAr: 'رخصة يويفا/فيفا B',
    description: 'Advanced coaching for semi-professional and youth academy levels. Focus on advanced tactics and team psychology.',
    descriptionAr: 'تدريب متقدم لمستويات شبه الاحترافية وأكاديميات الشباب. التركيز على التكتيكات المتقدمة وعلم نفس الفريق.',
    duration: '200 hours',
    modules: 16,
    prerequisites: 'C License + 2 years experience',
    prerequisitesAr: 'رخصة C + سنتان خبرة',
    minAge: 18,
    color: 'bg-purple-500',
    icon: '🥈',
    topics: [
      'Advanced Tactical Systems',
      'Periodization',
      'Sports Science',
      'Video Analysis',
      'Opposition Analysis',
      'Set Piece Strategy',
      'Team Psychology',
      'Leadership Development',
      'Performance Analysis',
      'Injury Prevention',
      'Nutrition Planning',
      'Match Preparation'
    ],
    topicsAr: [
      'الأنظمة التكتيكية المتقدمة',
      'التخطيط الدوري',
      'علوم الرياضة',
      'تحليل الفيديو',
      'تحليل الخصم',
      'استراتيجية الكرات الثابتة',
      'علم نفس الفريق',
      'تطوير القيادة',
      'تحليل الأداء',
      'الوقاية من الإصابات',
      'تخطيط التغذية',
      'الإعداد للمباراة'
    ]
  },
  {
    id: 'a_license',
    level: 'A License',
    levelAr: 'رخصة A',
    title: 'UEFA/FIFA A License',
    titleAr: 'رخصة يويفا/فيفا A',
    description: 'Professional-level coaching qualification. Required for coaching professional teams and national youth teams.',
    descriptionAr: 'مؤهل تدريبي على المستوى الاحترافي. مطلوب لتدريب الفرق المحترفة وفرق الشباب الوطنية.',
    duration: '300 hours',
    modules: 20,
    prerequisites: 'B License + 3 years experience',
    prerequisitesAr: 'رخصة B + 3 سنوات خبرة',
    minAge: 18,
    color: 'bg-orange-500',
    icon: '🥇',
    topics: [
      'Elite Tactical Analysis',
      'Strategic Planning',
      'High-Performance Training',
      'Data Analytics',
      'Scouting & Recruitment',
      'Contract Management',
      'Media Relations',
      'Crisis Management',
      'International Standards',
      'Advanced Periodization',
      'Mental Coaching',
      'Team Building'
    ],
    topicsAr: [
      'التحليل التكتيكي النخبوي',
      'التخطيط الاستراتيجي',
      'تدريب الأداء العالي',
      'تحليل البيانات',
      'الكشافة والتوظيف',
      'إدارة العقود',
      'العلاقات الإعلامية',
      'إدارة الأزمات',
      'المعايير الدولية',
      'التخطيط الدوري المتقدم',
      'التدريب العقلي',
      'بناء الفريق'
    ]
  },
  {
    id: 'pro_license',
    level: 'Pro License',
    levelAr: 'الرخصة الاحترافية',
    title: 'UEFA Pro / FIFA Pro License',
    titleAr: 'رخصة يويفا/فيفا الاحترافية',
    description: 'Highest coaching qualification. Required for managing top-tier professional clubs and national teams.',
    descriptionAr: 'أعلى مؤهل تدريبي. مطلوب لإدارة الأندية المحترفة من الدرجة الأولى والمنتخبات الوطنية.',
    duration: '400+ hours',
    modules: 24,
    prerequisites: 'A License + 5 years professional experience',
    prerequisitesAr: 'رخصة A + 5 سنوات خبرة احترافية',
    minAge: 18,
    color: 'bg-red-500',
    icon: '🏆',
    topics: [
      'Elite Club Management',
      'International Tactics',
      'Tournament Preparation',
      'Transfer Strategy',
      'Financial Management',
      'Board Relations',
      'Global Scouting Networks',
      'Advanced Sports Science',
      'Performance Psychology',
      'Leadership at Elite Level',
      'Cultural Management',
      'Legacy Building'
    ],
    topicsAr: [
      'إدارة النوادي النخبوية',
      'التكتيكات الدولية',
      'الإعداد للبطولات',
      'استراتيجية الانتقالات',
      'الإدارة المالية',
      'العلاقات مع مجلس الإدارة',
      'شبكات الكشافة العالمية',
      'علوم الرياضة المتقدمة',
      'علم نفس الأداء',
      'القيادة على المستوى النخبوي',
      'الإدارة الثقافية',
      'بناء الإرث'
    ]
  }
];

export default function CoachingCourses() {
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [selectedLicense, setSelectedLicense] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <GraduationCap className="h-12 w-12 text-indigo-600" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {language === 'en' ? 'Coaching Education' : 'تعليم المدربين'}
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {language === 'en' 
              ? 'FIFA & UEFA coaching license pathway - From grassroots to professional level'
              : 'مسار رخص التدريب من فيفا ويويفا - من المستوى التأسيسي إلى المستوى الاحترافي'}
          </p>
        </div>

        {/* Language Toggle */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-lg shadow-sm">
            <Button
              variant={language === 'en' ? 'default' : 'ghost'}
              onClick={() => setLanguage('en')}
              size="sm"
            >
              English
            </Button>
            <Button
              variant={language === 'ar' ? 'default' : 'ghost'}
              onClick={() => setLanguage('ar')}
              size="sm"
            >
              العربية
            </Button>
          </div>
        </div>

        {/* License Pathway Diagram */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-6">
            {language === 'en' ? 'Coaching License Pathway' : 'مسار رخص التدريب'}
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 flex-wrap">
            {COACHING_LICENSES.map((license, index) => (
              <div key={license.id} className="flex items-center">
                <div className="text-center">
                  <div className={`${license.color} text-white rounded-full w-20 h-20 flex items-center justify-center text-3xl mb-2 shadow-lg`}>
                    {license.icon}
                  </div>
                  <p className="font-semibold text-sm">
                    {language === 'en' ? license.level : license.levelAr}
                  </p>
                </div>
                {index < COACHING_LICENSES.length - 1 && (
                  <div className="hidden md:block mx-4 text-2xl text-muted-foreground">→</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* License Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {COACHING_LICENSES.map(license => (
            <Card 
              key={license.id}
              className="hover:shadow-xl transition-all border-2 hover:border-indigo-500"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`${license.color} text-white rounded-lg w-12 h-12 flex items-center justify-center text-2xl`}>
                      {license.icon}
                    </div>
                    <div>
                      <CardTitle className={language === 'ar' ? 'text-right' : ''}>
                        {language === 'en' ? license.title : license.titleAr}
                      </CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {language === 'en' ? license.level : license.levelAr}
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardDescription className={language === 'ar' ? 'text-right' : ''}>
                  {language === 'en' ? license.description : license.descriptionAr}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Course Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {language === 'en' ? 'Duration' : 'المدة'}
                      </p>
                      <p className="font-semibold text-sm">{license.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {language === 'en' ? 'Modules' : 'الوحدات'}
                      </p>
                      <p className="font-semibold text-sm">{license.modules}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {language === 'en' ? 'Min Age' : 'الحد الأدنى للعمر'}
                      </p>
                      <p className="font-semibold text-sm">{license.minAge}+</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {language === 'en' ? 'Prerequisites' : 'المتطلبات'}
                      </p>
                      <p className="font-semibold text-sm">
                        {language === 'en' ? license.prerequisites : license.prerequisitesAr}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Topics */}
                <div>
                  <p className="font-semibold mb-2 text-sm">
                    {language === 'en' ? 'Course Topics:' : 'موضوعات الدورة:'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(language === 'en' ? license.topics : license.topicsAr).slice(0, 6).map((topic, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                    {license.topics.length > 6 && (
                      <Badge variant="outline" className="text-xs">
                        +{license.topics.length - 6} {language === 'en' ? 'more' : 'المزيد'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex gap-2">
                <Link href={`/coach-education/course/${license.id}`}>
                  <Button className="flex-1" variant="default">
                    <BookOpen className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Start Course' : 'ابدأ الدورة'}
                  </Button>
                </Link>
                <Button variant="outline" onClick={() => setSelectedLicense(license.id)}>
                  {language === 'en' ? 'Details' : 'التفاصيل'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Free Training Videos */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-center mb-6">
            {language === 'en' ? 'Free Training Videos' : 'فيديوهات تدريبية مجانية'}
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            {language === 'en' 
              ? 'Learn from professional coaches with these free educational videos'
              : 'تعلم من المدربين المحترفين من خلال هذه الفيديوهات التعليمية المجانية'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Video 1: Grassroots Coaching */}
            <Card>
              <CardHeader>
                <Badge className="mb-2 w-fit" style={{ backgroundColor: '#10b981' }}>Grassroots</Badge>
                <CardTitle className="text-lg">
                  {language === 'en' ? 'Youth Coaching Basics' : 'أساسيات تدريب الشباب'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-lg mb-3 overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/WWPW85wswMs"
                    title="Youth Coaching Basics"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' 
                    ? 'Introduction to coaching young players and creating fun training sessions'
                    : 'مقدمة لتدريب اللاعبين الشباب وإنشاء جلسات تدريبية ممتعة'}
                </p>
              </CardContent>
            </Card>

            {/* Video 2: Tactical Fundamentals */}
            <Card>
              <CardHeader>
                <Badge className="mb-2 w-fit" style={{ backgroundColor: '#3b82f6' }}>C License</Badge>
                <CardTitle className="text-lg">
                  {language === 'en' ? 'Tactical Fundamentals' : 'الأساسيات التكتيكية'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-lg mb-3 overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/2lK4LW0aF6Q"
                    title="Tactical Fundamentals"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' 
                    ? 'Learn basic tactical concepts and formations for youth teams'
                    : 'تعلم المفاهيم التكتيكية الأساسية والتشكيلات لفرق الشباب'}
                </p>
              </CardContent>
            </Card>

            {/* Video 3: Advanced Tactics */}
            <Card>
              <CardHeader>
                <Badge className="mb-2 w-fit" style={{ backgroundColor: '#a855f7' }}>B License</Badge>
                <CardTitle className="text-lg">
                  {language === 'en' ? 'Advanced Tactics' : 'التكتيكات المتقدمة'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-lg mb-3 overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/QvXCPdVKJvQ"
                    title="Advanced Tactics"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' 
                    ? 'Advanced tactical systems and pressing strategies'
                    : 'الأنظمة التكتيكية المتقدمة واستراتيجيات الضغط'}
                </p>
              </CardContent>
            </Card>

            {/* Video 4: Match Analysis */}
            <Card>
              <CardHeader>
                <Badge className="mb-2 w-fit" style={{ backgroundColor: '#f97316' }}>A License</Badge>
                <CardTitle className="text-lg">
                  {language === 'en' ? 'Match Analysis' : 'تحليل المباريات'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-lg mb-3 overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/bM2xJfwD6P8"
                    title="Match Analysis"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' 
                    ? 'Professional match analysis techniques and opponent scouting'
                    : 'تقنيات تحليل المباريات الاحترافية وكشافة المنافسين'}
                </p>
              </CardContent>
            </Card>

            {/* Video 5: Player Development */}
            <Card>
              <CardHeader>
                <Badge className="mb-2 w-fit" style={{ backgroundColor: '#3b82f6' }}>C License</Badge>
                <CardTitle className="text-lg">
                  {language === 'en' ? 'Player Development' : 'تطوير اللاعبين'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-lg mb-3 overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/hXzDGv7UFQQ"
                    title="Player Development"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' 
                    ? 'Individual player development and skill progression'
                    : 'تطوير اللاعبين الفردي وتطور المهارات'}
                </p>
              </CardContent>
            </Card>

            {/* Video 6: Elite Coaching */}
            <Card>
              <CardHeader>
                <Badge className="mb-2 w-fit" style={{ backgroundColor: '#ef4444' }}>Pro License</Badge>
                <CardTitle className="text-lg">
                  {language === 'en' ? 'Elite Level Coaching' : 'التدريب على المستوى النخبوي'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-lg mb-3 overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/8ZXfEqPMXUw"
                    title="Elite Level Coaching"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' 
                    ? 'Insights from top professional coaches and elite team management'
                    : 'رؤى من كبار المدربين المحترفين وإدارة الفرق النخبوية'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-center mb-6">
            {language === 'en' ? 'Additional Resources' : 'موارد إضافية'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Video className="h-8 w-8 text-indigo-600 mb-2" />
                <CardTitle className="text-lg">
                  {language === 'en' ? 'Video Library' : 'مكتبة الفيديو'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' 
                    ? 'Access 500+ training videos from FIFA Training Centre'
                    : 'الوصول إلى أكثر من 500 فيديو تدريبي من مركز FIFA التدريبي'}
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  {language === 'en' ? 'Browse Videos' : 'تصفح الفيديوهات'}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <BookOpen className="h-8 w-8 text-indigo-600 mb-2" />
                <CardTitle className="text-lg">
                  {language === 'en' ? 'Laws of the Game' : 'قوانين اللعبة'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' 
                    ? 'Study the 17 official laws in Arabic and English'
                    : 'دراسة القوانين الـ17 الرسمية بالعربية والإنجليزية'}
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/coach-education/laws">
                    {language === 'en' ? 'Study Laws' : 'دراسة القوانين'}
                  </a>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-indigo-600 mb-2" />
                <CardTitle className="text-lg">
                  {language === 'en' ? 'Tactical Analysis' : 'التحليل التكتيكي'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' 
                    ? 'Learn from professional match analysis and tactics'
                    : 'تعلم من تحليل المباريات والتكتيكات الاحترافية'}
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  {language === 'en' ? 'View Analysis' : 'عرض التحليل'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
