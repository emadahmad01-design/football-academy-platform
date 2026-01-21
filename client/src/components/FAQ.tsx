import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface FAQItem {
  questionEn: string;
  questionAr: string;
  answerEn: string;
  answerAr: string;
}

const faqItems: FAQItem[] = [
  {
    questionEn: "What age groups do you accept?",
    questionAr: "ما هي الفئات العمرية التي تقبلونها؟",
    answerEn: "We accept players from ages 6 to 18, organized into age-appropriate groups: U-8, U-10, U-12, U-14, U-16, and U-18. Each group has tailored training programs suitable for their developmental stage.",
    answerAr: "نقبل اللاعبين من سن 6 إلى 18 عامًا، مقسمين إلى مجموعات مناسبة للعمر: تحت 8، تحت 10، تحت 12، تحت 14، تحت 16، وتحت 18. كل مجموعة لديها برامج تدريب مصممة خصيصًا لمرحلتها التطويرية.",
  },
  {
    questionEn: "What are the training schedules?",
    questionAr: "ما هي مواعيد التدريب؟",
    answerEn: "Training sessions are held 3 times per week. Weekday sessions run from 4:00 PM to 6:00 PM, and weekend sessions from 9:00 AM to 11:00 AM. Exact days vary by age group.",
    answerAr: "تُعقد جلسات التدريب 3 مرات في الأسبوع. جلسات أيام الأسبوع من 4:00 مساءً إلى 6:00 مساءً، وجلسات نهاية الأسبوع من 9:00 صباحًا إلى 11:00 صباحًا. الأيام المحددة تختلف حسب الفئة العمرية.",
  },
  {
    questionEn: "How can I register my child for a trial?",
    questionAr: "كيف يمكنني تسجيل طفلي للتجربة؟",
    answerEn: "You can register for a free trial session through our website by clicking 'Register Now' or by contacting us via WhatsApp. Trials are held every Saturday morning. Please bring sports attire, football boots, and water.",
    answerAr: "يمكنك التسجيل لجلسة تجريبية مجانية من خلال موقعنا بالنقر على 'سجل الآن' أو بالتواصل معنا عبر واتساب. تُعقد التجارب كل يوم سبت صباحًا. يرجى إحضار ملابس رياضية وحذاء كرة قدم وماء.",
  },
  {
    questionEn: "What is included in the membership fee?",
    questionAr: "ماذا يشمل رسم العضوية؟",
    answerEn: "Membership includes all training sessions, professional coaching, progress reports, parent portal access, nutrition guidance, and mental performance coaching. Football kits, tournament fees, and special events are not included.",
    answerAr: "تشمل العضوية جميع جلسات التدريب، والتدريب الاحترافي، وتقارير التقدم، والوصول إلى بوابة أولياء الأمور، وإرشادات التغذية، والتدريب على الأداء النفسي. لا تشمل أطقم كرة القدم ورسوم البطولات والفعاليات الخاصة.",
  },
  {
    questionEn: "Do you offer private coaching sessions?",
    questionAr: "هل تقدمون جلسات تدريب خاصة؟",
    answerEn: "Yes, we offer private 1-on-1 coaching sessions with our experienced coaches. These are available at an additional cost and can be booked through the parent portal or by contacting us directly.",
    answerAr: "نعم، نقدم جلسات تدريب خاصة فردية مع مدربينا ذوي الخبرة. هذه متاحة بتكلفة إضافية ويمكن حجزها من خلال بوابة أولياء الأمور أو بالتواصل معنا مباشرة.",
  },
  {
    questionEn: "What qualifications do your coaches have?",
    questionAr: "ما هي مؤهلات مدربيكم؟",
    answerEn: "All our coaches hold UEFA or CAF coaching licenses and have professional playing or coaching experience. Many have played at national or international levels and specialize in youth development.",
    answerAr: "جميع مدربينا حاصلون على رخص تدريب من الاتحاد الأوروبي أو الاتحاد الأفريقي ولديهم خبرة لعب أو تدريب احترافية. كثير منهم لعبوا على المستوى الوطني أو الدولي ومتخصصون في تطوير الشباب.",
  },
  {
    questionEn: "Where is the academy located?",
    questionAr: "أين تقع الأكاديمية؟",
    answerEn: "Our main training facility is located in Cairo, Egypt. We have professional-grade pitches with floodlights for evening training. Contact us for the exact address and directions.",
    answerAr: "يقع مرفق التدريب الرئيسي لدينا في القاهرة، مصر. لدينا ملاعب بمستوى احترافي مع أضواء كاشفة للتدريب المسائي. تواصل معنا للحصول على العنوان الدقيق والاتجاهات.",
  },
  {
    questionEn: "Can parents watch training sessions?",
    questionAr: "هل يمكن لأولياء الأمور مشاهدة جلسات التدريب؟",
    answerEn: "Yes, parents are welcome to watch training sessions from our designated viewing area. We also provide regular updates and progress reports through our parent portal.",
    answerAr: "نعم، أولياء الأمور مرحب بهم لمشاهدة جلسات التدريب من منطقة المشاهدة المخصصة. كما نقدم تحديثات وتقارير تقدم منتظمة من خلال بوابة أولياء الأمور.",
  },
];

export default function FAQ() {
  const { language } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {language === "ar" ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {language === "ar" 
              ? "اعثر على إجابات للأسئلة الشائعة حول أكاديميتنا"
              : "Find answers to common questions about our academy"
            }
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <span className="font-semibold text-lg">
                  {language === "ar" ? item.questionAr : item.questionEn}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="px-6 pb-5 text-muted-foreground leading-relaxed">
                  {language === "ar" ? item.answerAr : item.answerEn}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
