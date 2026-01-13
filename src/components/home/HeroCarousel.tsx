import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Smartphone, Shield, Brain, Briefcase, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Particle positions for floating effect
const particles = [
  { left: "10%", top: "20%", size: 4, delay: 0 },
  { left: "25%", top: "60%", size: 6, delay: 3 },
  { left: "50%", top: "15%", size: 3, delay: 6 },
  { left: "70%", top: "50%", size: 5, delay: 9 },
  { left: "85%", top: "30%", size: 4, delay: 12 },
  { left: "15%", top: "75%", size: 3, delay: 4 },
  { left: "40%", top: "85%", size: 5, delay: 7 },
  { left: "80%", top: "70%", size: 4, delay: 10 },
];

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
    title: "Latest",
    highlight: "Smartphones",
    description: "In-depth reviews, comparisons, and buying guides for the newest phones. Find your perfect device.",
    cta: "Explore Phones",
    ctaLink: "/phones",
    secondaryCta: "Compare Devices",
    secondaryLink: "/tools/phone-comparison",
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1920&h=1080&fit=crop&q=80",
    icon: Smartphone,
    gradient: "from-blue-600 via-blue-500 to-cyan-500",
    buttonGradient: "from-blue-600 to-cyan-500",
  },
  {
    id: 2,
    title: "AI &",
    highlight: "Technology",
    description: "Discover the latest in artificial intelligence, machine learning, and cutting-edge tech innovations.",
    cta: "Explore AI Tech",
    ctaLink: "/ai-tech",
    secondaryCta: "Try AI Tools",
    secondaryLink: "/tools",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1920&h=1080&fit=crop&q=80",
    icon: Brain,
    gradient: "from-violet-600 via-purple-500 to-fuchsia-500",
    buttonGradient: "from-violet-600 to-purple-500",
  },
  {
    id: 3,
    title: "Cybersecurity &",
    highlight: "Privacy",
    description: "Protect your digital life with expert security guides, tools, and best practices for staying safe online.",
    cta: "Security Guides",
    ctaLink: "/security",
    secondaryCta: "Password Tools",
    secondaryLink: "/tools/password-generator",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1920&h=1080&fit=crop&q=80",
    icon: Shield,
    gradient: "from-emerald-600 via-green-500 to-teal-500",
    buttonGradient: "from-emerald-600 to-green-500",
  },
  {
    id: 4,
    title: "Boost Your",
    highlight: "Productivity",
    description: "Master the best apps, tools, and techniques to work smarter and achieve more every day.",
    cta: "Productivity Tips",
    ctaLink: "/productivity",
    secondaryCta: "Free Tools",
    secondaryLink: "/tools",
    image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1920&h=1080&fit=crop&q=80",
    icon: Briefcase,
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    buttonGradient: "from-orange-500 to-amber-500",
  },
  {
    id: 5,
    title: "Online",
    highlight: "Side Hustles",
    description: "Learn proven strategies to earn money online, from freelancing to passive income and digital entrepreneurship.",
    cta: "Start Earning",
    ctaLink: "/make-money",
    secondaryCta: "Digital Store",
    secondaryLink: "/store",
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1920&h=1080&fit=crop&q=80",
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
      className="relative overflow-hidden h-[85vh] min-h-[600px] max-h-[900px] flex items-center"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Images with Ken Burns Effect */}
      {heroSlides.map((s, index) => (
        <div
          key={s.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            index === currentSlide ? "opacity-100" : "opacity-0"
          )}
        >
          {/* Background Image with Ken Burns effect (pan + zoom) */}
          <div
            className={cn(
              "absolute inset-0 bg-cover bg-center",
              index === currentSlide && "animate-ken-burns"
            )}
            style={{
              backgroundImage: `url(${s.image})`,
            }}
          />
          {/* Animated Gradient Overlay */}
          <div className={cn(
            "absolute inset-0",
            index === currentSlide && "animate-gradient-overlay"
          )} />
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
        </div>
      ))}

      {/* Floating Particles */}
      {particles.map((particle, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/40 backdrop-blur-sm animate-float-particle"
          style={{
            left: particle.left,
            top: particle.top,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}

      {/* Content Container */}
      <div className="container relative z-10 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Category Badge with Icon */}
          <div
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium mb-6 transition-all duration-500",
              isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            )}
          >
            <Icon className="w-4 h-4 text-white" />
            <span className="text-white/90">{slide.title} {slide.highlight}</span>
          </div>

          {/* Main Title */}
          <h1
            className={cn(
              "text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight transition-all duration-700",
              isTransitioning ? "opacity-0 translate-y-8" : "opacity-100 translate-y-0"
            )}
            style={{ transitionDelay: '100ms' }}
          >
            <span className="text-white">{slide.title}</span>{" "}
            <span className={cn("bg-gradient-to-r bg-clip-text text-transparent", slide.gradient)}>
              {slide.highlight}
            </span>
          </h1>

          {/* Description */}
          <p
            className={cn(
              "text-base md:text-lg text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed transition-all duration-700",
              isTransitioning ? "opacity-0 translate-y-8" : "opacity-100 translate-y-0"
            )}
            style={{ transitionDelay: '200ms' }}
          >
            {slide.description}
          </p>

          {/* CTA Buttons */}
          <div
            className={cn(
              "flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700",
              isTransitioning ? "opacity-0 translate-y-8" : "opacity-100 translate-y-0"
            )}
            style={{ transitionDelay: '300ms' }}
          >
            <Button
              size="lg"
              className={cn(
                "rounded-full text-white shadow-lg px-8 py-3 bg-gradient-to-r hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium",
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
                className="rounded-full bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 px-8 py-3 font-medium transition-all duration-300"
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

      {/* Slide Indicators / Dots */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {heroSlides.map((s, index) => (
          <button
            key={s.id}
            onClick={() => goToSlide(index)}
            className={cn(
              "relative h-2 rounded-full transition-all duration-500 overflow-hidden",
              index === currentSlide ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
            )}
            aria-label={`Go to slide ${index + 1}`}
          >
            {/* Progress bar for active slide */}
            {index === currentSlide && !isPaused && (
              <div
                className="absolute inset-0 bg-white/50 origin-left animate-progress"
                style={{ animationDuration: '6s' }}
              />
            )}
          </button>
        ))}
      </div>

    </section>
  );
}
