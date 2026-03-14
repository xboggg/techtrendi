import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft, Sparkles, Search, Heart, Wrench, Crown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: string; // CSS selector to highlight
  position?: 'center' | 'top' | 'bottom';
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to TechTrendi! ✨',
    description: 'Your ultimate toolbox with 90+ free online tools for business, productivity, design, and more. Let us show you around!',
    icon: Sparkles,
    position: 'center',
  },
  {
    id: 'search',
    title: 'Quick Search (⌘K)',
    description: 'Press Ctrl+K (or ⌘K on Mac) anytime to quickly search and find any tool. You can also search articles, guides, and more.',
    icon: Search,
    position: 'top',
  },
  {
    id: 'favorites',
    title: 'Save Your Favorites',
    description: 'Click the heart icon on any tool to save it to your favorites. Access them quickly from the search modal or your dashboard.',
    icon: Heart,
    position: 'center',
  },
  {
    id: 'categories',
    title: 'Browse by Category',
    description: 'Tools are organized into 8 categories: Business, Productivity, Career, Creator, Developer, Security, Design, and Lifestyle.',
    icon: Wrench,
    position: 'center',
  },
  {
    id: 'premium',
    title: 'Unlock Premium Tools',
    description: 'Get access to Invoice Generator, CRM, Client Portal, and more premium tools with a subscription. Start with a 7-day free trial!',
    icon: Crown,
    position: 'center',
  },
  {
    id: 'done',
    title: "You're All Set! 🎉",
    description: "Start exploring the tools and make your work easier. Don't forget to sign in to save your favorites and track your usage!",
    icon: Check,
    position: 'center',
  },
];

const STORAGE_KEY = 'techtrendi_tour_completed';

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(true); // Default to true to avoid flash

  useEffect(() => {
    // Check if tour was completed
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Delay showing tour to let the page load
      const timer = setTimeout(() => {
        setHasCompleted(false);
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setHasCompleted(true);
    setIsOpen(false);
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (hasCompleted || !isOpen) return null;

  const step = tourSteps[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Tour Card */}
      <div className={cn(
        "absolute left-1/2 -translate-x-1/2 w-full max-w-md mx-auto px-4",
        step.position === 'top' ? 'top-24' : step.position === 'bottom' ? 'bottom-24' : 'top-1/2 -translate-y-1/2'
      )}>
        <div className="bg-background rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          {/* Progress Bar */}
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center">
              <Icon className="w-8 h-8 text-primary" />
            </div>

            {/* Text */}
            <h3 className="text-xl font-bold text-center text-foreground mb-2">
              {step.title}
            </h3>
            <p className="text-center text-muted-foreground mb-6">
              {step.description}
            </p>

            {/* Step Indicators */}
            <div className="flex justify-center gap-1.5 mb-6">
              {tourSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index === currentStep
                      ? "w-6 bg-primary"
                      : index < currentStep
                      ? "bg-primary/50"
                      : "bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {currentStep > 0 ? (
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="flex-1"
                >
                  Skip Tour
                </Button>
              )}

              <Button
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
              >
                {currentStep === tourSteps.length - 1 ? (
                  <>
                    Get Started
                    <Sparkles className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Hook to manually trigger tour
export function useTour() {
  const resetTour = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  return { resetTour };
}

export default OnboardingTour;
