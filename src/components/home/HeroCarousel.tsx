import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Smartphone, Shield, Brain, Briefcase, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NewsTicker } from "./NewsTicker";

interface HeroSlide {
  id: number;
  title: string;
  highlight: string;
  description: string;
  cta: string;
  ctaLink: string;
  secondaryCta?: string;
  secondaryLink?: string;
  image: string;
  icon: React.ElementType;
  gradient: string;
  buttonGradient: string;
}

const heroSlides: HeroSlide[] = [
  {
    id: 1,
    title: "Find Your Next",
    highlight: "Smartphone",
    description: "Compare the newest phones on specs and price with our free comparison tool. Find your perfect device.",
    cta: "Explore Phones",
    ctaLink: "/phones",
    secondaryCta: "Compare Devices",
    secondaryLink: "/tools/phone-comparison",
    image: "/images/hero/hero-smartphone.png",
    icon: Smartphone,
    gradient: "from-blue-600 via-blue-500 to-cyan-500",
    buttonGradient: "from-blue-600 to-cyan-500",
  },
  {
    id: 2,
    title: "AI That Actually",
    highlight: "Works for You",
    description: "Discover the latest in artificial intelligence, machine learning, and cutting-edge tech innovations.",
    cta: "Explore AI Tech",
    ctaLink: "/ai-tech",
    secondaryCta: "Try AI Tools",
    secondaryLink: "/tools",
    image: "/images/hero/hero-ai.png",
    icon: Brain,
    gradient: "from-violet-600 via-purple-500 to-fuchsia-500",
    buttonGradient: "from-violet-600 to-purple-500",
  },
  {
    id: 3,
    title: "Stay Safe",
    highlight: "Online",
    description: "Protect your digital life with expert security guides, tools, and best practices for staying safe online.",
    cta: "Security Guides",
    ctaLink: "/security",
    secondaryCta: "Password Tools",
    secondaryLink: "/tools/password-generator",
    image: "/images/hero/hero-security.png",
    icon: Shield,
    gradient: "from-emerald-600 via-green-500 to-teal-500",
    buttonGradient: "from-emerald-600 to-green-500",
  },
  {
    id: 4,
    title: "Work Smarter",
    highlight: "Not Harder",
    description: "The best apps, workflows, and free tools — tested and ranked — to help you get more done in less time.",
    cta: "Productivity Tips",
    ctaLink: "/productivity",
    secondaryCta: "Free Tools",
    secondaryLink: "/tools",
    image: "/images/hero/hero-productivity.png",
    icon: Briefcase,
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    buttonGradient: "from-orange-500 to-amber-500",
  },
  {
    id: 5,
    title: "Turn Skills Into",
    highlight: "Income",
    description: "Build digital skills, launch projects, and grow your career with practical guides and proven strategies.",
    cta: "Explore Now",
    ctaLink: "/smart-income",
    secondaryCta: "Digital Store",
    secondaryLink: "/store",
    image: "/images/hero/hero-income.png",
    icon: DollarSign,
    gradient: "from-rose-500 via-pink-500 to-red-500",
    buttonGradient: "from-rose-500 to-pink-500",
  },
];

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  const goToSlide = useCallback((index: number, dir?: 'left' | 'right') => {
    if (isTransitioning) return;
    setDirection(dir || (index > currentSlide ? 'right' : 'left'));
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 1200);
  }, [isTransitioning, currentSlide]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % heroSlides.length, 'right');
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + heroSlides.length) % heroSlides.length, 'left');
  }, [currentSlide, goToSlide]);

  // Auto-slide every 6 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [nextSlide, isPaused]);

  const slide = heroSlides[currentSlide];
  const Icon = slide.icon;

  return (
    <section
      className="relative w-full h-[100svh] min-h-[550px] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Animated Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/70 to-transparent z-[1] animate-gradient-shift" />

      {/* Floating Particles */}
      <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-float-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[150px] animate-pulse-slow z-[1]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-secondary/20 blur-[120px] animate-pulse-slower z-[1]" />

      {/* Animated Grid Lines */}
      <div className="absolute inset-0 z-[2] opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:60px_60px] animate-grid-move" />
      </div>

      {/* Background Images with Ken Burns Effect */}
      {heroSlides.map((s, index) => (
        <div
          key={s.id}
          className="absolute inset-0"
          style={{
            opacity: index === currentSlide ? 1 : 0,
            transition: 'opacity 2500ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Background Image with Parallax */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${s.image})`,
              transform: index === currentSlide ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 12000ms ease-out',
            }}
          />
          {/* Animated Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
        </div>
      ))}

      {/* Animated Lines/Streaks */}
      <div className="absolute inset-0 z-[3] overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent animate-scan-line" />
        <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-scan-line-delay" />
        <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent animate-scan-line-slow" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container">
          <div className="max-w-2xl">
            {/* Animated Category Badge */}
            <div
              className={cn(
                "inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium mb-6",
                "transition-all duration-[1200ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                isTransitioning
                  ? direction === 'right'
                    ? "opacity-0 -translate-x-4 scale-[0.99]"
                    : "opacity-0 translate-x-4 scale-[0.99]"
                  : "opacity-100 translate-x-0 scale-100"
              )}
            >
              <span className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r shadow-lg animate-pulse-glow",
                slide.buttonGradient
              )}>
                <Icon className="w-4 h-4 text-white animate-icon-bounce" />
              </span>
              <span className="text-white tracking-wide">{slide.title} {slide.highlight}</span>
            </div>

            {/* Main Title with Character Animation */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1]">
              <span
                className={cn(
                  "text-white block transition-all duration-[1200ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                  isTransitioning
                    ? direction === 'right'
                      ? "opacity-0 -translate-x-5"
                      : "opacity-0 translate-x-5"
                    : "opacity-100 translate-x-0"
                )}
                style={{ transitionDelay: '100ms' }}
              >
                {slide.title}
              </span>
              <span
                className={cn(
                  "bg-gradient-to-r bg-clip-text text-transparent block transition-all duration-[1200ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] animate-text-shimmer bg-[length:200%_auto]",
                  slide.gradient,
                  isTransitioning
                    ? direction === 'right'
                      ? "opacity-0 -translate-x-6"
                      : "opacity-0 translate-x-6"
                    : "opacity-100 translate-x-0"
                )}
                style={{ transitionDelay: '200ms' }}
              >
                {slide.highlight}
              </span>
            </h1>

            {/* Description */}
            <p
              className={cn(
                "text-base md:text-lg text-white/80 mb-8 max-w-xl leading-relaxed",
                "transition-all duration-[1200ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                isTransitioning
                  ? "opacity-0 translate-y-3"
                  : "opacity-100 translate-y-0"
              )}
              style={{ transitionDelay: '300ms' }}
            >
              {slide.description}
            </p>

            {/* CTA Buttons with Stagger Animation */}
            <div
              className={cn(
                "flex flex-wrap items-center gap-4",
                "transition-all duration-[1200ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                isTransitioning
                  ? "opacity-0 translate-y-4"
                  : "opacity-100 translate-y-0"
              )}
              style={{ transitionDelay: '400ms' }}
            >
              <Button
                size="lg"
                className={cn(
                  "rounded-full text-white shadow-2xl px-8 bg-gradient-to-r relative overflow-hidden group",
                  "hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 transition-all duration-300",
                  slide.buttonGradient
                )}
                asChild
              >
                <Link to={slide.ctaLink} className="flex items-center gap-2">
                  {/* Shine effect */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative">{slide.cta}</span>
                  <ArrowRight className="w-4 h-4 relative group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              {slide.secondaryCta && (
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full bg-white/5 backdrop-blur-md border-white/30 text-white hover:bg-white/15 hover:border-white/50 px-8 transition-all duration-300 hover:scale-105"
                  asChild
                >
                  <Link to={slide.secondaryLink || "#"}>
                    {slide.secondaryCta}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows with Hover Animation */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:scale-110 hover:border-white/40 transition-all duration-300 group"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:scale-110 hover:border-white/40 transition-all duration-300 group"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
      </button>

      {/* Animated Slide Indicators */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        {heroSlides.map((s, index) => (
          <button
            key={s.id}
            onClick={() => goToSlide(index)}
            className={cn(
              "relative h-2 rounded-full transition-all duration-500 overflow-hidden",
              index === currentSlide
                ? "w-12 bg-white/30"
                : "w-2 bg-white/30 hover:bg-white/50 hover:w-4"
            )}
            aria-label={`Go to slide ${index + 1}`}
          >
            {index === currentSlide && (
              <span
                className="absolute inset-0 bg-white rounded-full animate-progress-bar"
                style={{ animationDuration: '6s' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Slide Counter */}
      <div className="absolute bottom-16 right-8 z-20 hidden md:flex items-center gap-2 text-white/60 font-mono text-sm">
        <span className="text-white text-2xl font-bold">{String(currentSlide + 1).padStart(2, '0')}</span>
        <span>/</span>
        <span>{String(heroSlides.length).padStart(2, '0')}</span>
      </div>

      {/* News Ticker at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <NewsTicker />
      </div>

      {/* Custom Animations Styles */}
      <style>{`
        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-40px) translateX(-5px);
            opacity: 0.3;
          }
          75% {
            transform: translateY(-20px) translateX(-10px);
            opacity: 0.5;
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.1);
          }
        }

        @keyframes pulse-slower {
          0%, 100% {
            opacity: 0.15;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(1.15);
          }
        }

        @keyframes grid-move {
          0% {
            transform: translateX(0) translateY(0);
          }
          100% {
            transform: translateX(60px) translateY(60px);
          }
        }

        @keyframes scan-line {
          0% {
            transform: translateY(-100vh);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }

        @keyframes text-shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 10px rgba(255,255,255,0.3);
          }
          50% {
            box-shadow: 0 0 25px rgba(255,255,255,0.5);
          }
        }

        @keyframes icon-bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }

        @keyframes progress-bar {
          0% {
            transform: scaleX(0);
            transform-origin: left;
          }
          100% {
            transform: scaleX(1);
            transform-origin: left;
          }
        }

        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-float-particle {
          animation: float-particle var(--duration, 10s) ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-pulse-slower {
          animation: pulse-slower 6s ease-in-out infinite;
        }

        .animate-grid-move {
          animation: grid-move 20s linear infinite;
        }

        .animate-scan-line {
          animation: scan-line 8s ease-in-out infinite;
        }

        .animate-scan-line-delay {
          animation: scan-line 10s ease-in-out infinite;
          animation-delay: 3s;
        }

        .animate-scan-line-slow {
          animation: scan-line 12s ease-in-out infinite;
          animation-delay: 6s;
        }

        .animate-text-shimmer {
          animation: text-shimmer 3s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .animate-icon-bounce {
          animation: icon-bounce 2s ease-in-out infinite;
        }

        .animate-progress-bar {
          animation: progress-bar 6s linear;
        }

        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 8s ease infinite;
        }
      `}</style>
    </section>
  );
}
