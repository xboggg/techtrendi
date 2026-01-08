import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  role?: string;
  company?: string;
  avatar?: string;
  content: string;
  rating?: number;
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
  autoPlay?: boolean;
  interval?: number;
  className?: string;
}

export function TestimonialCarousel({
  testimonials,
  autoPlay = true,
  interval = 5000,
  className,
}: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      goToNext();
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, currentIndex]);

  const goToNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const goToPrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const goToIndex = (index: number) => {
    if (isAnimating || index === currentIndex) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div className={cn('relative', className)}>
      {/* Main testimonial card */}
      <div className="bg-card border border-border rounded-2xl p-8 md:p-12 relative overflow-hidden">
        {/* Quote icon */}
        <Quote className="absolute top-6 left-6 w-12 h-12 text-primary/10" />

        {/* Content */}
        <div
          className={cn(
            'transition-all duration-500',
            isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          )}
        >
          {/* Rating */}
          {currentTestimonial.rating && (
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'w-5 h-5',
                    i < currentTestimonial.rating!
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-muted'
                  )}
                />
              ))}
            </div>
          )}

          {/* Quote */}
          <blockquote className="text-lg md:text-xl text-foreground leading-relaxed mb-8">
            "{currentTestimonial.content}"
          </blockquote>

          {/* Author */}
          <div className="flex items-center gap-4">
            {currentTestimonial.avatar ? (
              <img
                src={currentTestimonial.avatar}
                alt={currentTestimonial.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">
                  {currentTestimonial.name.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <p className="font-semibold text-foreground">{currentTestimonial.name}</p>
              {(currentTestimonial.role || currentTestimonial.company) && (
                <p className="text-sm text-muted-foreground">
                  {currentTestimonial.role}
                  {currentTestimonial.role && currentTestimonial.company && ' at '}
                  {currentTestimonial.company}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        {/* Dots */}
        <div className="flex gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                index === currentIndex
                  ? 'w-6 bg-primary'
                  : 'bg-muted hover:bg-muted-foreground/30'
              )}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>

        {/* Arrows */}
        <div className="flex gap-2">
          <button
            onClick={goToPrev}
            className="p-2 rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            className="p-2 rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Grid variant for displaying multiple testimonials
interface TestimonialGridProps {
  testimonials: Testimonial[];
  columns?: 1 | 2 | 3;
  className?: string;
}

export function TestimonialGrid({
  testimonials,
  columns = 3,
  className,
}: TestimonialGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div className={cn('grid gap-6', gridCols[columns], className)}>
      {testimonials.map((testimonial) => (
        <div
          key={testimonial.id}
          className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
        >
          {testimonial.rating && (
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'w-4 h-4',
                    i < testimonial.rating!
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-muted'
                  )}
                />
              ))}
            </div>
          )}

          <p className="text-muted-foreground mb-4 line-clamp-4">
            "{testimonial.content}"
          </p>

          <div className="flex items-center gap-3">
            {testimonial.avatar ? (
              <img
                src={testimonial.avatar}
                alt={testimonial.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {testimonial.name.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <p className="font-medium text-foreground text-sm">{testimonial.name}</p>
              {testimonial.role && (
                <p className="text-xs text-muted-foreground">{testimonial.role}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TestimonialCarousel;
