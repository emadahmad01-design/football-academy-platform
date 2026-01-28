import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Trophy, 
  BarChart3,
  Brain,
  Target,
  Phone,
  Mail,
  MapPin,
  Star
} from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLoginUrl } from "@/const";
import LanguageToggle from "@/components/LanguageToggle";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import { FileUpload } from "@/components/FileUpload";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { Moon, Sun, Menu, X } from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { language, isRTL } = useLanguage();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch featured testimonials
  const { data: featuredTestimonials } = trpc.testimonials.getFeatured.useQuery();
  
  // Fetch gallery videos
  const galleryQuery = trpc.academyVideos.getGallery.useQuery();
  
  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  
  // Enrollment form state
  const [enrollmentForm, setEnrollmentForm] = useState({
    studentFirstName: "",
    studentLastName: "",
    dateOfBirth: "",
    gender: "",
    parentFirstName: "",
    parentLastName: "",
    parentEmail: "",
    parentPhone: "",
    programLevel: "",
    ageGroup: "",
    preferredPosition: "",
    previousExperience: "",
    medicalConditions: "",
    emergencyContact: "",
    birthCertificateUrl: "",
    medicalCertificateUrl: "",
    photoIdUrl: ""
  });
  
  const [enrollmentErrors, setEnrollmentErrors] = useState<Record<string, string>>({});
  const [isSubmittingEnrollment, setIsSubmittingEnrollment] = useState(false);
  
  const submitEnrollment = trpc.enrollments.submit.useMutation({
    onSuccess: () => {
      toast({
        title: language === 'ar' ? "تم إرسال الطلب بنجاح" : "Application Submitted!",
        description: language === 'ar' ? "شكراً لتسجيلك. سنتواصل معك قريباً" : "Thank you for enrolling. We'll contact you soon.",
      });
      // Clear form
      setEnrollmentForm({
        studentFirstName: "",
        studentLastName: "",
        dateOfBirth: "",
        gender: "",
        parentFirstName: "",
        parentLastName: "",
        parentEmail: "",
        parentPhone: "",
        programLevel: "",
        ageGroup: "",
        preferredPosition: "",
        previousExperience: "",
        medicalConditions: "",
        emergencyContact: ""
      });
      setEnrollmentErrors({});
      setIsSubmittingEnrollment(false);
    },
    onError: (error) => {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: error.message || (language === 'ar' ? "فشل إرسال الطلب. حاول مرة أخرى" : "Failed to submit application. Please try again."),
        variant: "destructive",
      });
      setIsSubmittingEnrollment(false);
    },
  });
  
  const submitContact = trpc.contact.submit.useMutation({
    onSuccess: () => {
      toast({
        title: language === 'ar' ? "تم الإرسال بنجاح" : "Message Sent!",
        description: language === 'ar' ? "شكراً لتواصلك معنا. سنرد عليك قريباً" : "Thank you for contacting us. We'll get back to you soon.",
      });
      setContactForm({ name: "", email: "", phone: "", subject: "", message: "" });
    },
    onError: (error) => {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: error.message || (language === 'ar' ? "فشل في إرسال الرسالة" : "Failed to send message"),
        variant: "destructive"
      });
    },
  });
  
  const validateEnrollmentForm = () => {
    const errors: Record<string, string> = {};
    
    if (!enrollmentForm.studentFirstName.trim()) {
      errors.studentFirstName = language === 'ar' ? 'الاسم الأول مطلوب' : 'First name is required';
    }
    if (!enrollmentForm.studentLastName.trim()) {
      errors.studentLastName = language === 'ar' ? 'الاسم الأخير مطلوب' : 'Last name is required';
    }
    if (!enrollmentForm.dateOfBirth) {
      errors.dateOfBirth = language === 'ar' ? 'تاريخ الميلاد مطلوب' : 'Date of birth is required';
    }
    if (!enrollmentForm.gender) {
      errors.gender = language === 'ar' ? 'الجنس مطلوب' : 'Gender is required';
    }
    if (!enrollmentForm.parentFirstName.trim()) {
      errors.parentFirstName = language === 'ar' ? 'اسم ولي الأمر مطلوب' : 'Parent first name is required';
    }
    if (!enrollmentForm.parentEmail.trim()) {
      errors.parentEmail = language === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enrollmentForm.parentEmail)) {
      errors.parentEmail = language === 'ar' ? 'البريد الإلكتروني غير صحيح' : 'Invalid email format';
    }
    if (!enrollmentForm.parentPhone.trim()) {
      errors.parentPhone = language === 'ar' ? 'رقم الهاتف مطلوب' : 'Phone number is required';
    } else if (!/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(enrollmentForm.parentPhone)) {
      errors.parentPhone = language === 'ar' ? 'رقم الهاتف غير صحيح' : 'Invalid phone format';
    }
    if (!enrollmentForm.programLevel) {
      errors.programLevel = language === 'ar' ? 'مستوى البرنامج مطلوب' : 'Program level is required';
    }
    
    return errors;
  };
  
  const handleEnrollmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateEnrollmentForm();
    if (Object.keys(errors).length > 0) {
      setEnrollmentErrors(errors);
      toast({
        title: language === 'ar' ? "خطأ في النموذج" : "Form Error",
        description: language === 'ar' ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmittingEnrollment(true);
    setEnrollmentErrors({});
    submitEnrollment.mutate(enrollmentForm);
  };
  
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (contactForm.name.length < 2) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "الاسم يجب أن يكون حرفين على الأقل" : "Name must be at least 2 characters",
        variant: "destructive"
      });
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactForm.email)) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "البريد الإلكتروني غير صالح" : "Invalid email address",
        variant: "destructive"
      });
      return;
    }
    
    if (contactForm.message.length < 10) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "الرسالة يجب أن تكون 10 أحرف على الأقل" : "Message must be at least 10 characters",
        variant: "destructive"
      });
      return;
    }
    
    submitContact.mutate(contactForm);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const [showTrainingDropdown, setShowTrainingDropdown] = useState(false);

  const navItems = [
    { id: 'hero', label: language === 'ar' ? 'الرئيسية' : 'Home' },
    { id: 'features', label: language === 'ar' ? 'المميزات' : 'Features' },
    { id: 'stats', label: language === 'ar' ? 'الإحصائيات' : 'Stats' },
    { id: 'gallery', label: language === 'ar' ? 'معرض الصور' : 'Gallery' },
    { id: 'blog', label: language === 'ar' ? 'الأخبار' : 'News' },
    { id: 'testimonials', label: language === 'ar' ? 'الآراء' : 'Testimonials' },
    { id: 'enrollment', label: language === 'ar' ? 'التسجيل' : 'Enroll' },
    { id: 'contact', label: language === 'ar' ? 'اتصل بنا' : 'Contact' },
    { id: 'careers', label: language === 'ar' ? 'الوظائف' : 'Careers' },
  ];

  const trainingSubTabs = [
    { href: '/training-library', label: language === 'ar' ? 'مكتبة التدريب' : 'Training Library' },
    { href: '/private-training', label: language === 'ar' ? 'التدريب الخاص' : 'Private Training' },
    { href: '/my-bookings', label: language === 'ar' ? 'حجوزاتي' : 'My Bookings' },
    { href: '/explore', label: language === 'ar' ? 'استكشف' : 'Explore' },
    { href: '/talent-portal', label: language === 'ar' ? 'بوابة المواهب' : 'Talent Portal' },
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-emerald-600" />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {language === 'ar' ? 'أكاديمية نجوم المستقبل' : 'Future Stars FC'}
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="text-sm text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  {item.label}
                </button>
              ))}
              
              {/* Training Dropdown */}
              {isAuthenticated && (
                <div 
                  className="relative"
                  onMouseEnter={() => setShowTrainingDropdown(true)}
                  onMouseLeave={() => setShowTrainingDropdown(false)}
                >
                  <button
                    onClick={() => setShowTrainingDropdown(!showTrainingDropdown)}
                    className="text-sm text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    {language === 'ar' ? 'التدريب' : 'Training'}
                  </button>
                  
                  {showTrainingDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                      {trainingSubTabs.map((tab) => (
                        <Link key={tab.href} href={tab.href}>
                          <span className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
                            {tab.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <a className="inline-block">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                      {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                    </Button>
                  </a>
                </Link>
              ) : (
                <a href={getLoginUrl()} className="inline-block">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                  </Button>
                </a>
              )}
              <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                {isDarkMode ? <Sun className="w-5 h-5 text-gray-300" /> : <Moon className="w-5 h-5 text-gray-700" />}
              </button>
              <LanguageToggle />
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                {isDarkMode ? <Sun className="w-5 h-5 text-gray-300" /> : <Moon className="w-5 h-5 text-gray-700" />}
              </button>
              <LanguageToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {item.label}
                </button>
              ))}
              
              {/* Training Sub-menu for Mobile */}
              {isAuthenticated && (
                <div className="mt-2">
                  <div className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white">
                    {language === 'ar' ? 'التدريب' : 'Training'}
                  </div>
                  {trainingSubTabs.map((tab) => (
                    <Link key={tab.href} href={tab.href}>
                      <span 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block w-full text-left px-8 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        {tab.label}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
              
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="sm" className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700">
                    {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button size="sm" className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700">
                    {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                  </Button>
                </a>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        id="hero" 
        className="relative min-h-screen flex items-center justify-center pt-16"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(/nano-hero-simple.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            {language === 'ar' ? 'أكاديمية نجوم المستقبل' : 'Future Stars Football Academy'}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-200 mb-8"
          >
            {language === 'ar' 
              ? 'تطوير المواهب الشابة من خلال التدريب الاحترافي والتكنولوجيا المتقدمة' 
              : 'Developing young talent through professional training and advanced technology'}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {isAuthenticated ? (
              <Link href="/dashboard">
                <a className="inline-block">
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
                    {language === 'ar' ? 'ابدأ الآن' : 'Get Started'}
                  </Button>
                </a>
              </Link>
            ) : (
              <a href={getLoginUrl()} className="inline-block">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
                  {language === 'ar' ? 'ابدأ الآن' : 'Get Started'}
                </Button>
              </a>
            )}
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white/10 px-8"
              onClick={() => scrollToSection('features')}
            >
              {language === 'ar' ? 'اعرف المزيد' : 'Learn More'}
            </Button>
          </motion.div>
          
          {/* Registration Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-6"
          >
            <Link href="/user-registration?role=parent">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white px-8">
                {language === 'ar' ? 'تسجيل ولي أمر' : 'Register as Parent'}
              </Button>
            </Link>
            <Link href="/user-registration?role=player">
              <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white px-8">
                {language === 'ar' ? 'تسجيل لاعب' : 'Register as Player'}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        id="features" 
        className="relative py-16 md:py-24"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95)), url(/nano-features-simple.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              {language === 'ar' ? 'لماذا تختارنا' : 'Why Choose Us'}
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400">
              {language === 'ar' 
                ? 'نقدم برامج تدريب شاملة لتطوير المهارات الفنية والبدنية والعقلية' 
                : 'Comprehensive training programs for technical, physical, and mental development'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Trophy className="w-8 h-8 text-emerald-600" />,
                title: language === 'ar' ? 'تدريب احترافي' : 'Professional Training',
                desc: language === 'ar' ? 'مدربون معتمدون من الاتحادات الدولية' : 'Certified coaches from international federations'
              },
              {
                icon: <Brain className="w-8 h-8 text-emerald-600" />,
                title: language === 'ar' ? 'تحليل بالذكاء الاصطناعي' : 'AI Analysis',
                desc: language === 'ar' ? 'تقييم الأداء باستخدام أحدث التقنيات' : 'Performance evaluation using latest technology'
              },
              {
                icon: <Target className="w-8 h-8 text-emerald-600" />,
                title: language === 'ar' ? 'خطط تطوير فردية' : 'Individual Development',
                desc: language === 'ar' ? 'برامج مخصصة لكل لاعب' : 'Customized programs for each player'
              },
              {
                icon: <BarChart3 className="w-8 h-8 text-emerald-600" />,
                title: language === 'ar' ? 'تتبع الأداء' : 'Performance Tracking',
                desc: language === 'ar' ? 'متابعة دقيقة للتقدم والإنجازات' : 'Detailed progress and achievement monitoring'
              },
              {
                icon: <Users className="w-8 h-8 text-emerald-600" />,
                title: language === 'ar' ? 'تواصل مع الأهل' : 'Parent Communication',
                desc: language === 'ar' ? 'تحديثات منتظمة عن تطور اللاعب' : 'Regular updates on player development'
              },
              {
                icon: <Star className="w-8 h-8 text-emerald-600" />,
                title: language === 'ar' ? 'منشآت حديثة' : 'Modern Facilities',
                desc: language === 'ar' ? 'ملاعب ومرافق بمعايير عالمية' : 'World-class pitches and facilities'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="mb-3">{feature.icon}</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section 
        id="stats" 
        className="relative py-16 md:py-24"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(/nano-stats-simple.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '500+', label: language === 'ar' ? 'لاعب' : 'Players' },
              { value: '25+', label: language === 'ar' ? 'مدرب' : 'Coaches' },
              { value: '15+', label: language === 'ar' ? 'بطولة' : 'Championships' },
              { value: '98%', label: language === 'ar' ? 'رضا الأهالي' : 'Parent Satisfaction' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-emerald-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-300">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-16 md:py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              {language === 'ar' ? 'معرض الصور' : 'Photo Gallery'}
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400">
              {language === 'ar' 
                ? 'لمحات من تدريباتنا ومبارياتنا' 
                : 'Moments from our training sessions and matches'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryQuery.isLoading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : galleryQuery.data && galleryQuery.data.length > 0 ? (
              galleryQuery.data.map((item: any, index: number) => {
                const metadata = typeof item.description === 'string' ? JSON.parse(item.description) : {};
                const isVideo = metadata.isVideo || item.videoUrl?.endsWith('.mp4');
                const title = language === 'ar' && metadata.titleAr ? metadata.titleAr : item.title;
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
                  >
                    {isVideo ? (
                      <video 
                        src={item.videoUrl} 
                        className="w-full h-64 object-cover"
                        muted
                        loop
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => e.currentTarget.pause()}
                      />
                    ) : (
                      <img 
                        src={item.videoUrl} 
                        alt={title}
                        className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-semibold text-lg">{title}</h3>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              [
                { src: '/media/team/b77066c1-11b8-4798-acb0-ae5d3b971ce0.jpg', title: language === 'ar' ? 'فريق الأكاديمية' : 'Academy Team' },
                { src: '/media/team/5980967093731969141(1).jpg', title: language === 'ar' ? 'تدريب جماعي' : 'Team Training' },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  <img 
                    src={item.src} 
                    alt={item.title}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-semibold text-lg">{item.title}</h3>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Blog/News Section */}
      <section id="blog" className="py-16 md:py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              {language === 'ar' ? 'الأخبار والتحديثات' : 'News & Updates'}
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400">
              {language === 'ar' 
                ? 'آخر الأخبار والفعاليات من أكاديميتنا' 
                : 'Latest news and events from our academy'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: language === 'ar' ? 'فوز فريق تحت 16 عامًا بالبطولة' : 'U16 Team Wins Championship',
                excerpt: language === 'ar' ? 'حقق فريقنا تحت 16 عامًا فوزًا رائعًا في البطولة الإقليمية' : 'Our U16 team achieved a fantastic victory in the regional championship',
                category: language === 'ar' ? 'إنجازات' : 'Achievements',
                date: '2026-01-05',
                image: '/media/team/b77066c1-11b8-4798-acb0-ae5d3b971ce0.jpg'
              },
              {
                title: language === 'ar' ? 'برنامج تدريبي جديد للصيف' : 'New Summer Training Program',
                excerpt: language === 'ar' ? 'نعلن عن إطلاق برنامج تدريبي مكثف لفترة الصيف' : 'Announcing the launch of an intensive training program for the summer period',
                category: language === 'ar' ? 'تدريب' : 'Training',
                date: '2026-01-03',
                image: '/media/team/5980967093731969141(1).jpg'
              },
              {
                title: language === 'ar' ? 'لقاء مع مدرب منتخب الشباب' : 'Meet with Youth National Team Coach',
                excerpt: language === 'ar' ? 'زيارة خاصة من مدرب المنتخب لمشاهدة مواهبنا' : 'Special visit from the national team coach to watch our talents',
                category: language === 'ar' ? 'فعاليات' : 'Events',
                date: '2026-01-01',
                image: '/training1.mp4'
              },
            ].map((article, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={article.image} 
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-full">
                      {article.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {new Date(article.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {article.excerpt}
                  </p>
                  <button className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                    {language === 'ar' ? 'اقرأ المزيد' : 'Read More'} →
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 md:py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              {language === 'ar' ? 'آراء العملاء' : 'What Parents Say'}
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400">
              {language === 'ar' 
                ? 'تجارب حقيقية من أولياء أمور لاعبينا' 
                : 'Real experiences from our players\' parents'}
            </p>
          </div>
          {featuredTestimonials && featuredTestimonials.length > 0 ? (
            <TestimonialCarousel testimonials={featuredTestimonials} />
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400">
              {language === 'ar' ? 'لا توجد آراء متاحة حالياً' : 'No testimonials available yet'}
            </div>
          )}
        </div>
      </section>

      {/* Enrollment Form Section */}
      <section id="enrollment" className="py-16 md:py-24 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              {language === 'ar' ? 'التسجيل في الأكاديمية' : 'Enroll in Our Academy'}
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400">
              {language === 'ar' 
                ? 'انضم إلى عائلة نجوم المستقبل وابدأ رحلتك نحو الاحتراف' 
                : 'Join the Future Stars family and start your journey to professionalism'}
            </p>
          </div>

          <Card className="shadow-2xl">
            <CardContent className="p-8">
              <form className="space-y-6" onSubmit={handleEnrollmentSubmit}>
                {/* Student Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {language === 'ar' ? 'معلومات اللاعب' : 'Student Information'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input 
                        placeholder={language === 'ar' ? 'الاسم الأول' : 'First Name'} 
                        value={enrollmentForm.studentFirstName}
                        onChange={(e) => setEnrollmentForm({...enrollmentForm, studentFirstName: e.target.value})}
                        className={enrollmentErrors.studentFirstName ? 'border-red-500' : ''}
                      />
                      {enrollmentErrors.studentFirstName && (
                        <p className="text-red-500 text-sm mt-1">{enrollmentErrors.studentFirstName}</p>
                      )}
                    </div>
                    <div>
                      <Input 
                        placeholder={language === 'ar' ? 'الاسم الأخير' : 'Last Name'} 
                        value={enrollmentForm.studentLastName}
                        onChange={(e) => setEnrollmentForm({...enrollmentForm, studentLastName: e.target.value})}
                        className={enrollmentErrors.studentLastName ? 'border-red-500' : ''}
                      />
                      {enrollmentErrors.studentLastName && (
                        <p className="text-red-500 text-sm mt-1">{enrollmentErrors.studentLastName}</p>
                      )}
                    </div>
                    <div>
                      <Input 
                        type="date" 
                        placeholder={language === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'} 
                        value={enrollmentForm.dateOfBirth}
                        onChange={(e) => setEnrollmentForm({...enrollmentForm, dateOfBirth: e.target.value})}
                        className={enrollmentErrors.dateOfBirth ? 'border-red-500' : ''}
                      />
                      {enrollmentErrors.dateOfBirth && (
                        <p className="text-red-500 text-sm mt-1">{enrollmentErrors.dateOfBirth}</p>
                      )}
                    </div>
                    <div>
                      <select 
                        className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${enrollmentErrors.gender ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                        value={enrollmentForm.gender}
                        onChange={(e) => setEnrollmentForm({...enrollmentForm, gender: e.target.value})}
                      >
                        <option value="">{language === 'ar' ? 'الجنس' : 'Gender'}</option>
                        <option value="male">{language === 'ar' ? 'ذكر' : 'Male'}</option>
                        <option value="female">{language === 'ar' ? 'أنثى' : 'Female'}</option>
                      </select>
                      {enrollmentErrors.gender && (
                        <p className="text-red-500 text-sm mt-1">{enrollmentErrors.gender}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Parent Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {language === 'ar' ? 'معلومات ولي الأمر' : 'Parent/Guardian Information'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input 
                        placeholder={language === 'ar' ? 'اسم ولي الأمر الأول' : 'Parent First Name'} 
                        value={enrollmentForm.parentFirstName}
                        onChange={(e) => setEnrollmentForm({...enrollmentForm, parentFirstName: e.target.value})}
                        className={enrollmentErrors.parentFirstName ? 'border-red-500' : ''}
                      />
                      {enrollmentErrors.parentFirstName && (
                        <p className="text-red-500 text-sm mt-1">{enrollmentErrors.parentFirstName}</p>
                      )}
                    </div>
                    <Input 
                      placeholder={language === 'ar' ? 'اسم ولي الأمر الأخير' : 'Parent Last Name'} 
                      value={enrollmentForm.parentLastName}
                      onChange={(e) => setEnrollmentForm({...enrollmentForm, parentLastName: e.target.value})}
                    />
                    <div>
                      <Input 
                        type="email" 
                        placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Email'} 
                        value={enrollmentForm.parentEmail}
                        onChange={(e) => setEnrollmentForm({...enrollmentForm, parentEmail: e.target.value})}
                        className={enrollmentErrors.parentEmail ? 'border-red-500' : ''}
                      />
                      {enrollmentErrors.parentEmail && (
                        <p className="text-red-500 text-sm mt-1">{enrollmentErrors.parentEmail}</p>
                      )}
                    </div>
                    <div>
                      <Input 
                        type="tel" 
                        placeholder={language === 'ar' ? 'رقم الهاتف' : 'Phone Number'} 
                        value={enrollmentForm.parentPhone}
                        onChange={(e) => setEnrollmentForm({...enrollmentForm, parentPhone: e.target.value})}
                        className={enrollmentErrors.parentPhone ? 'border-red-500' : ''}
                      />
                      {enrollmentErrors.parentPhone && (
                        <p className="text-red-500 text-sm mt-1">{enrollmentErrors.parentPhone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Program Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {language === 'ar' ? 'اختيار البرنامج' : 'Program Selection'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <select 
                        className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${enrollmentErrors.programLevel ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                        value={enrollmentForm.programLevel}
                        onChange={(e) => setEnrollmentForm({...enrollmentForm, programLevel: e.target.value})}
                      >
                        <option value="">{language === 'ar' ? 'مستوى البرنامج' : 'Program Level'}</option>
                        <option value="beginner">{language === 'ar' ? 'مبتدئ' : 'Beginner'}</option>
                        <option value="intermediate">{language === 'ar' ? 'متوسط' : 'Intermediate'}</option>
                        <option value="advanced">{language === 'ar' ? 'متقدم' : 'Advanced'}</option>
                        <option value="elite">{language === 'ar' ? 'نخبة' : 'Elite'}</option>
                      </select>
                      {enrollmentErrors.programLevel && (
                        <p className="text-red-500 text-sm mt-1">{enrollmentErrors.programLevel}</p>
                      )}
                    </div>
                    <Input 
                      placeholder={language === 'ar' ? 'الفئة العمرية' : 'Age Group (e.g., U12, U16)'} 
                      value={enrollmentForm.ageGroup}
                      onChange={(e) => setEnrollmentForm({...enrollmentForm, ageGroup: e.target.value})}
                    />
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      value={enrollmentForm.preferredPosition}
                      onChange={(e) => setEnrollmentForm({...enrollmentForm, preferredPosition: e.target.value})}
                    >
                      <option value="">{language === 'ar' ? 'المركز المفضل' : 'Preferred Position'}</option>
                      <option value="goalkeeper">{language === 'ar' ? 'حارس مرمى' : 'Goalkeeper'}</option>
                      <option value="defender">{language === 'ar' ? 'مدافع' : 'Defender'}</option>
                      <option value="midfielder">{language === 'ar' ? 'وسط' : 'Midfielder'}</option>
                      <option value="forward">{language === 'ar' ? 'مهاجم' : 'Forward'}</option>
                      <option value="any">{language === 'ar' ? 'أي مركز' : 'Any Position'}</option>
                    </select>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {language === 'ar' ? 'معلومات إضافية' : 'Additional Information'}
                  </h3>
                  <div className="space-y-4">
                    <textarea
                      placeholder={language === 'ar' ? 'الخبرة السابقة (اختياري)' : 'Previous Experience (Optional)'}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      value={enrollmentForm.previousExperience}
                      onChange={(e) => setEnrollmentForm({...enrollmentForm, previousExperience: e.target.value})}
                    />
                    <textarea
                      placeholder={language === 'ar' ? 'الحالات الطبية (اختياري)' : 'Medical Conditions (Optional)'}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      value={enrollmentForm.medicalConditions}
                      onChange={(e) => setEnrollmentForm({...enrollmentForm, medicalConditions: e.target.value})}
                    />
                    <Input 
                      placeholder={language === 'ar' ? 'جهة الاتصال في حالات الطوارئ' : 'Emergency Contact'} 
                      value={enrollmentForm.emergencyContact}
                      onChange={(e) => setEnrollmentForm({...enrollmentForm, emergencyContact: e.target.value})}
                    />
                  </div>
                </div>

                {/* Required Documents */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {language === 'ar' ? 'المستندات المطلوبة' : 'Required Documents'}
                  </h3>
                  <div className="space-y-6">
                    <FileUpload
                      label={language === 'ar' ? 'شهادة الميلاد' : 'Birth Certificate'}
                      accept="image/*,application/pdf"
                      maxSizeMB={5}
                      onUploadComplete={(url, fileKey) => {
                        setEnrollmentForm({...enrollmentForm, birthCertificateUrl: url});
                      }}
                    />
                    <FileUpload
                      label={language === 'ar' ? 'الشهادة الطبية' : 'Medical Certificate'}
                      accept="image/*,application/pdf"
                      maxSizeMB={5}
                      onUploadComplete={(url, fileKey) => {
                        setEnrollmentForm({...enrollmentForm, medicalCertificateUrl: url});
                      }}
                    />
                    <FileUpload
                      label={language === 'ar' ? 'صورة الهوية (ولي الأمر)' : 'Photo ID (Parent/Guardian)'}
                      accept="image/*,application/pdf"
                      maxSizeMB={5}
                      onUploadComplete={(url, fileKey) => {
                        setEnrollmentForm({...enrollmentForm, photoIdUrl: url});
                      }}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg py-6"
                  disabled={isSubmittingEnrollment}
                >
                  {isSubmittingEnrollment ? (language === 'ar' ? 'جاري الإرسال...' : 'Submitting...') : (language === 'ar' ? 'إرسال طلب التسجيل' : 'Submit Enrollment Application')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 md:py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400">
              {language === 'ar' 
                ? 'نحن هنا للإجابة على استفساراتك' 
                : 'We\'re here to answer your questions'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                    {language === 'ar' ? 'العنوان' : 'Address'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'ar' 
                      ? 'شارع الملاعب الرياضية، المدينة الرياضية' 
                      : 'Sports Stadium Street, Sports City'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Phone className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                    {language === 'ar' ? 'الهاتف' : 'Phone'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">+966 50 123 4567</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Mail className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">info@futurestarsfc.com</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <Input
                      placeholder={language === 'ar' ? 'الاسم' : 'Name'}
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Input
                      placeholder={language === 'ar' ? 'رقم الهاتف' : 'Phone'}
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Input
                      placeholder={language === 'ar' ? 'الموضوع' : 'Subject'}
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder={language === 'ar' ? 'الرسالة' : 'Message'}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={submitContact.isPending}
                  >
                    {submitContact.isPending 
                      ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...') 
                      : (language === 'ar' ? 'إرسال' : 'Send Message')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Careers Section */}
      <section id="careers" className="py-16 md:py-24 bg-gradient-to-br from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              {language === 'ar' ? 'انضم لفريقنا' : 'Join Our Team'}
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400">
              {language === 'ar' 
                ? 'نبحث عن مدربين موهوبين للانضمام إلى أكاديميتنا' 
                : 'We are looking for talented coaches to join our academy'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Career Info */}
            <div className="space-y-6">
              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {language === 'ar' ? 'لماذا تعمل معنا؟' : 'Why Work With Us?'}
                  </h3>
                  <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <Star className="w-5 h-5 text-emerald-600 mt-0.5" />
                      <span>{language === 'ar' ? 'بيئة عمل احترافية ومحفزة' : 'Professional and motivating work environment'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="w-5 h-5 text-emerald-600 mt-0.5" />
                      <span>{language === 'ar' ? 'فرص للتطوير المهني والتدريب' : 'Professional development and training opportunities'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="w-5 h-5 text-emerald-600 mt-0.5" />
                      <span>{language === 'ar' ? 'رواتب تنافسية ومزايا ممتازة' : 'Competitive salaries and excellent benefits'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="w-5 h-5 text-emerald-600 mt-0.5" />
                      <span>{language === 'ar' ? 'العمل مع أحدث التقنيات' : 'Work with the latest technologies'}</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {language === 'ar' ? 'الوظائف المتاحة' : 'Available Positions'}
                  </h3>
                  <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <span>{language === 'ar' ? 'مدرب كرة قدم' : 'Football Coach'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-blue-500" />
                      <span>{language === 'ar' ? 'مدرب لياقة بدنية' : 'Fitness Coach'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-500" />
                      <span>{language === 'ar' ? 'مدرب حراس مرمى' : 'Goalkeeper Coach'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-500" />
                      <span>{language === 'ar' ? 'أخصائي نفسي رياضي' : 'Sports Psychologist'}</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* CV Submission Form */}
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  {language === 'ar' ? 'قدم سيرتك الذاتية' : 'Submit Your CV'}
                </h3>
                <Link href="/careers">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3">
                    {language === 'ar' ? 'تقديم طلب التوظيف' : 'Apply Now'}
                  </Button>
                </Link>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
                  {language === 'ar' 
                    ? 'انقر للانتقال إلى صفحة التقديم الكاملة' 
                    : 'Click to go to the full application page'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-400">
            {language === 'ar' 
              ? '© 2026 أكاديمية نجوم المستقبل. جميع الحقوق محفوظة.' 
              : '© 2026 Future Stars FC. All rights reserved.'}
          </p>
        </div>
      </footer>
    </div>
  );
}
