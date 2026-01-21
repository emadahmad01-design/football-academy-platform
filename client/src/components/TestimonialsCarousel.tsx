import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface TestimonialsCarouselProps {
  isDarkMode: boolean;
  language: string;
}

export default function TestimonialsCarousel({ isDarkMode, language }: TestimonialsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { data: testimonials, isLoading } = trpc.testimonials.getFeatured.useQuery();

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {language === 'ar' ? 'جاري التحميل...' : 'Loading testimonials...'}
        </div>
      </div>
    );
  }

  if (!testimonials || testimonials.length === 0) {
    return (
      <div className="text-center py-12">
        <div className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {language === 'ar' ? 'لا توجد آراء متاحة حالياً' : 'No testimonials available at the moment'}
        </div>
      </div>
    );
  }

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const current = testimonials[currentIndex];

  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Main Testimonial Card */}
      <Card className={`${isDarkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200'} backdrop-blur-xl shadow-2xl`}>
        <CardContent className="p-12">
          {/* Quote Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
              <Quote className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Rating Stars */}
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-6 h-6 ${
                  i < current.rating
                    ? 'fill-orange-500 text-orange-500'
                    : isDarkMode
                    ? 'text-gray-700'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Testimonial Text */}
          <p className={`text-xl md:text-2xl text-center mb-8 leading-relaxed ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            "{current.testimonial}"
          </p>

          {/* Author Info */}
          <div className="text-center">
            <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {current.name}
            </div>
            {current.role && (
              <div className={`text-sm ${isDarkMode ? 'text-orange-400' : 'text-orange-600'} mt-1`}>
                {current.role}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      {testimonials.length > 1 && (
        <div className="flex justify-center gap-4 mt-8">
          <Button
            onClick={prevTestimonial}
            variant="outline"
            size="lg"
            className={`rounded-full w-14 h-14 p-0 ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white'
                : 'bg-white border-gray-300 hover:bg-gray-100'
            }`}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          {/* Dots Indicator */}
          <div className="flex items-center gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-orange-500 w-8'
                    : isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>

          <Button
            onClick={nextTestimonial}
            variant="outline"
            size="lg"
            className={`rounded-full w-14 h-14 p-0 ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white'
                : 'bg-white border-gray-300 hover:bg-gray-100'
            }`}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
      )}

      {/* Counter */}
      <div className={`text-center mt-6 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
        {currentIndex + 1} / {testimonials.length}
      </div>
    </div>
  );
}
