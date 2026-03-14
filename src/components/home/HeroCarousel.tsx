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
    description: "In-depth reviews, comparisons, and buying guides for the newest phones. Find your perfect device.",
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
    description: "Learn proven strategies to earn money online, from freelancing to passive income and digital entrepreneurship.",
    cta: "Start Earning",
    ctaLink: "/make-money",
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

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 700);
  }, [isTransitioning]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % heroSlides.length);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + heroSlides.length) % heroSlides.length);
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
      {/* Background Images */}
      {heroSlides.map((s, index) => (
        <div
          key={s.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            index === currentSlide ? "opacity-100" : "opacity-0"
          )}
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${s.image})` }}
          />
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
        </div>
      ))}

      {/* Content Container - Full height, centered vertically */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container">
          <div className="max-w-2xl">
            {/* Category Badge with Icon */}
            <div
              className={cn(
                "inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium mb-6 transition-all duration-500",
                isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
              )}
            >
              <span className={cn("w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r", slide.buttonGradient)}>
                <Icon className="w-4 h-4 text-white" />
              </span>
              <span className="text-white">{slide.title} {slide.highlight}</span>
            </div>

            {/* Main Title - Two lines */}
            <h1
              className={cn(
                "text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] transition-all duration-700",
                isTransitioning ? "opacity-0 translate-y-8" : "opacity-100 translate-y-0"
              )}
              style={{ transitionDelay: '100ms' }}
            >
              <span className="text-white block">{slide.title}</span>
              <span className={cn("bg-gradient-to-r bg-clip-text text-transparent block", slide.gradient)}>
                {slide.highlight}
              </span>
            </h1>

            {/* Description */}
            <p
              className={cn(
                "text-base md:text-lg text-white/80 mb-8 max-w-xl leading-relaxed transition-all duration-700",
                isTransitioning ? "opacity-0 translate-y-8" : "opacity-100 translate-y-0"
              )}
              style={{ transitionDelay: '200ms' }}
            >
              {slide.description}
            </p>

            {/* CTA Buttons */}
            <div
              className={cn(
                "flex flex-wrap items-center gap-4 transition-all duration-700",
                isTransitioning ? "opacity-0 translate-y-8" : "opacity-100 translate-y-0"
              )}
              style={{ transitionDelay: '300ms' }}
            >
              <Button
                size="lg"
                className={cn(
                  "rounded-full text-white shadow-lg px-8 bg-gradient-to-r hover:shadow-xl hover:scale-105 transition-all duration-300",
                  slide.buttonGradient
                )}
                asChild
              >
                <Link to={slide.ctaLink} className="flex items-center gap-2">
                  {slide.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              {slide.secondaryCta && (
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 px-8 transition-all duration-300"
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

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 group"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 group"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {heroSlides.map((s, index) => (
          <button
            key={s.id}
            onClick={() => goToSlide(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-500",
              index === currentSlide
                ? "w-8 bg-white"
                : "w-2 bg-white/40 hover:bg-white/60"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* News Ticker at bottom of hero */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <NewsTicker />
      </div>
    </section>
  );
}
