import { getDb } from './db';
import { educationCourses, courseModules, vrTrainingScenarios, scoutReports, mealLogs, injuryRiskAssessments } from '../drizzle/schema';

async function seedSampleData() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    return;
  }

  console.log('Starting sample data seeding...');

  // 1. Create 5 Parent Education Courses
  const courses = [
    {
      title: 'Understanding Youth Football Development',
      titleAr: 'فهم تطوير كرة القدم للشباب',
      description: 'Learn the fundamentals of youth football development and how to support your child',
      descriptionAr: 'تعلم أساسيات تطوير كرة القدم للشباب وكيفية دعم طفلك',
      category: 'development' as const,
      duration: 120,
      isPublished: true,
    },
    {
      title: 'Nutrition for Young Athletes',
      titleAr: 'التغذية للرياضيين الشباب',
      description: 'Essential nutrition knowledge for parents of young football players',
      descriptionAr: 'معرفة التغذية الأساسية لأولياء أمور لاعبي كرة القدم الشباب',
      category: 'nutrition' as const,
      duration: 90,
      isPublished: true,
    },
    {
      title: 'Mental Health in Youth Sports',
      titleAr: 'الصحة النفسية في الرياضة للشباب',
      description: 'Supporting your child\'s mental wellbeing in competitive sports',
      descriptionAr: 'دعم الصحة النفسية لطفلك في الرياضة التنافسية',
      category: 'mental_health' as const,
      duration: 100,
      isPublished: true,
    },
    {
      title: 'Injury Prevention and Recovery',
      titleAr: 'الوقاية من الإصابات والتعافي',
      description: 'Learn how to prevent injuries and support recovery',
      descriptionAr: 'تعلم كيفية الوقاية من الإصابات ودعم التعافي',
      category: 'health' as const,
      duration: 80,
      isPublished: true,
    },
    {
      title: 'Communication with Coaches',
      titleAr: 'التواصل مع المدربين',
      description: 'Effective communication strategies for parents and coaches',
      descriptionAr: 'استراتيجيات التواصل الفعال لأولياء الأمور والمدربين',
      category: 'communication' as const,
      duration: 60,
      isPublished: true,
    },
  ];

  console.log('Inserting courses...');
  await db.insert(educationCourses).values(courses);
  console.log('✓ 5 courses created');

  // 2. Create 10 VR Training Scenarios
  const vrScenarios = [
    {
      title: 'Penalty Kick Pressure',
      titleAr: 'ضغط ركلة الجزاء',
      description: 'Practice penalty kicks in high-pressure situations',
      descriptionAr: 'تدرب على ركلات الجزاء في مواقف الضغط العالي',
      difficulty: 'intermediate' as const,
      duration: 15,
      category: 'shooting' as const,
      isActive: true,
    },
    {
      title: 'Defensive Positioning',
      titleAr: 'المواقع الدفاعية',
      description: 'Learn optimal defensive positioning against various attacks',
      descriptionAr: 'تعلم المواقع الدفاعية المثلى ضد الهجمات المختلفة',
      difficulty: 'advanced' as const,
      duration: 20,
      category: 'defending' as const,
      isActive: true,
    },
    {
      title: 'First Touch Mastery',
      titleAr: 'إتقان اللمسة الأولى',
      description: 'Improve your first touch control in game situations',
      descriptionAr: 'حسّن سيطرتك على اللمسة الأولى في مواقف اللعب',
      difficulty: 'beginner' as const,
      duration: 10,
      category: 'ball_control' as const,
      isActive: true,
    },
    {
      title: 'Counter-Attack Speed',
      titleAr: 'سرعة الهجوم المضاد',
      description: 'Practice quick transitions from defense to attack',
      descriptionAr: 'تدرب على الانتقالات السريعة من الدفاع إلى الهجوم',
      difficulty: 'intermediate' as const,
      duration: 18,
      category: 'tactics' as const,
      isActive: true,
    },
    {
      title: 'Goalkeeper Reflexes',
      titleAr: 'ردود أفعال حارس المرمى',
      description: 'Enhance goalkeeper reaction time and positioning',
      descriptionAr: 'عزز وقت رد فعل حارس المرمى ومواقعه',
      difficulty: 'advanced' as const,
      duration: 12,
      category: 'goalkeeping' as const,
      isActive: true,
    },
    {
      title: 'Passing Under Pressure',
      titleAr: 'التمرير تحت الضغط',
      description: 'Maintain passing accuracy when pressed by opponents',
      descriptionAr: 'حافظ على دقة التمرير عند الضغط من الخصوم',
      difficulty: 'intermediate' as const,
      duration: 15,
      category: 'passing' as const,
      isActive: true,
    },
    {
      title: 'Set Piece Execution',
      titleAr: 'تنفيذ الكرات الثابتة',
      description: 'Master free kicks and corner kick scenarios',
      descriptionAr: 'أتقن الركلات الحرة وسيناريوهات الركنيات',
      difficulty: 'advanced' as const,
      duration: 20,
      category: 'set_pieces' as const,
      isActive: true,
    },
    {
      title: 'Dribbling in Tight Spaces',
      titleAr: 'المراوغة في المساحات الضيقة',
      description: 'Improve close control and dribbling skills',
      descriptionAr: 'حسّن السيطرة القريبة ومهارات المراوغة',
      difficulty: 'beginner' as const,
      duration: 12,
      category: 'dribbling' as const,
      isActive: true,
    },
    {
      title: 'Tactical Awareness Training',
      titleAr: 'تدريب الوعي التكتيكي',
      description: 'Develop game reading and decision-making skills',
      descriptionAr: 'طور مهارات قراءة اللعب واتخاذ القرار',
      difficulty: 'advanced' as const,
      duration: 25,
      category: 'tactics' as const,
      isActive: true,
    },
    {
      title: 'Heading Technique',
      titleAr: 'تقنية ضرب الكرة بالرأس',
      description: 'Practice safe and effective heading techniques',
      descriptionAr: 'تدرب على تقنيات ضرب الكرة بالرأس الآمنة والفعالة',
      difficulty: 'beginner' as const,
      duration: 10,
      category: 'shooting' as const,
      isActive: true,
    },
  ];

  console.log('Inserting VR scenarios...');
  await db.insert(vrTrainingScenarios).values(vrScenarios);
  console.log('✓ 10 VR scenarios created');

  console.log('Sample data seeding completed successfully!');
}

seedSampleData().catch(console.error);
