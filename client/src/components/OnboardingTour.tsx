import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useLocation } from "wouter";

interface TourStep {
  id: string;
  title: string;
  description: string;
  path: string;
  targetElement?: string;
  position?: "top" | "bottom" | "left" | "right";
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Future Stars FC Platform",
    description: "Let's take a quick tour of the professional coaching tools available to you. This will only take 2 minutes!",
    path: "/dashboard",
  },
  {
    id: "video-analysis",
    title: "Advanced Video Analysis",
    description: "Upload match or training videos and get AI-powered analysis with player tracking, heatmaps, and passing networks. Use frame-by-frame controls and drawing tools to annotate key moments.",
    path: "/dashboard",
    targetElement: "[data-tour='video-analysis']",
  },
  {
    id: "video-clips",
    title: "Video Clip Library",
    description: "Create and organize video clips with custom tags (goals, assists, tackles). Build playlists for player reviews and team meetings.",
    path: "/dashboard",
    targetElement: "[data-tour='video-clips']",
  },
  {
    id: "tactical-lab",
    title: "Tactical Simulation Lab",
    description: "Create animated tactical scenarios with custom formations. Compare planned tactics vs actual execution from matches. Export scenarios as videos or PDFs.",
    path: "/dashboard",
    targetElement: "[data-tour='tactical-lab']",
  },
  {
    id: "xg-analytics",
    title: "xG Analytics Dashboard",
    description: "Analyze matches with Expected Goals (xG) metrics, shot maps, pass maps, and defensive action tracking. Get professional-level statistics used by elite clubs.",
    path: "/dashboard",
    targetElement: "[data-tour='xg-analytics']",
  },
  {
    id: "complete",
    title: "You're All Set!",
    description: "You now know where to find all the advanced coaching tools. Start by uploading a video or creating a tactical scenario. Need help? Check the documentation in Settings.",
    path: "/dashboard",
  },
];

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Check if user has completed the tour
    const tourCompleted = localStorage.getItem("onboarding-tour-completed");
    const isFirstVisit = localStorage.getItem("first-visit");
    
    if (!tourCompleted && !isFirstVisit && location === "/dashboard") {
      // Show tour after a short delay on first visit
      const timer = setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem("first-visit", "true");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      const nextStep = tourSteps[currentStep + 1];
      if (nextStep.path !== location) {
        setLocation(nextStep.path);
      }
    } else {
      completeTour();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      const prevStep = tourSteps[currentStep - 1];
      if (prevStep.path !== location) {
        setLocation(prevStep.path);
      }
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    localStorage.setItem("onboarding-tour-skipped", "true");
  };

  const completeTour = () => {
    setIsOpen(false);
    localStorage.setItem("onboarding-tour-completed", "true");
  };

  const restartTour = () => {
    setCurrentStep(0);
    setIsOpen(true);
    setLocation("/dashboard");
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={restartTour}
        className="fixed bottom-4 right-4 z-50 shadow-lg"
      >
        Restart Tour
      </Button>
    );
  }

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" />

      {/* Tour Card */}
      <Card className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg z-50 shadow-2xl border-2">
        <CardContent className="p-6">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Step {currentStep + 1} of {tourSteps.length}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="h-6 px-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              {currentStep === tourSteps.length - 1 ? (
                <Button onClick={completeTour} className="gap-2">
                  <Check className="h-4 w-4" />
                  Finish Tour
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>

            {/* Skip Link */}
            {currentStep < tourSteps.length - 1 && (
              <div className="text-center pt-2">
                <button
                  onClick={handleSkip}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip tour
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Spotlight Effect (optional - highlights target element) */}
      {step.targetElement && (
        <style>{`
          ${step.targetElement} {
            position: relative;
            z-index: 45;
            box-shadow: 0 0 0 4px rgba(var(--primary), 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5);
            border-radius: 0.5rem;
          }
        `}</style>
      )}
    </>
  );
}

// Hook to manually trigger tour
export function useOnboardingTour() {
  const restartTour = () => {
    localStorage.removeItem("onboarding-tour-completed");
    localStorage.removeItem("onboarding-tour-skipped");
    window.location.reload();
  };

  return { restartTour };
}
