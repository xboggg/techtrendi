import React, { useRef, useEffect, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Hook for parallax scroll effect
export function useParallax(speed: number = 0.5) {
  const [offset, setOffset] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const scrolled = window.scrollY;
        const elementTop = rect.top + scrolled;
        const relativeScroll = scrolled - elementTop + window.innerHeight;
        setOffset(relativeScroll * speed);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return { ref, offset };
}

// Parallax Container Component
interface ParallaxContainerProps {
  children: ReactNode;
  className?: string;
  speed?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function ParallaxContainer({
  children,
  className,
  speed = 0.3,
  direction = 'up',
}: ParallaxContainerProps) {
  const { ref, offset } = useParallax(speed);

  const getTransform = () => {
    switch (direction) {
      case 'up':
        return `translateY(${-offset}px)`;
      case 'down':
        return `translateY(${offset}px)`;
      case 'left':
        return `translateX(${-offset}px)`;
      case 'right':
        return `translateX(${offset}px)`;
      default:
        return `translateY(${-offset}px)`;
    }
  };

  return (
    <div
      ref={ref}
      className={cn('will-change-transform', className)}
      style={{ transform: getTransform() }}
    >
      {children}
    </div>
  );
}

// Parallax Background Component
interface ParallaxBackgroundProps {
  imageUrl: string;
  className?: string;
  speed?: number;
  overlay?: boolean;
  overlayOpacity?: number;
  children?: ReactNode;
  height?: string;
}

export function ParallaxBackground({
  imageUrl,
  className,
  speed = 0.5,
  overlay = true,
  overlayOpacity = 0.5,
  children,
  height = '400px',
}: ParallaxBackgroundProps) {
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setScrollY(window.scrollY);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      style={{ height }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
        style={{
          backgroundImage: `url(${imageUrl})`,
          transform: `translateY(${scrollY * speed}px) scale(1.1)`,
          height: '120%',
          top: '-10%',
        }}
      />
      {overlay && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      <div className="relative z-10 h-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// Parallax Hero Section
interface ParallaxHeroProps {
  title: string;
  subtitle?: string;
  backgroundImage: string;
  className?: string;
  height?: string;
  children?: ReactNode;
}

export function ParallaxHero({
  title,
  subtitle,
  backgroundImage,
  className,
  height = '70vh',
  children,
}: ParallaxHeroProps) {
  return (
    <ParallaxBackground
      imageUrl={backgroundImage}
      height={height}
      className={className}
      overlay
      overlayOpacity={0.6}
    >
      <div className="container text-center text-white">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-fade-in">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8 animate-slide-up">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </ParallaxBackground>
  );
}

// Parallax Layers Component for multiple layer effects
interface ParallaxLayer {
  content: ReactNode;
  speed: number;
  zIndex?: number;
  className?: string;
}

interface ParallaxLayersProps {
  layers: ParallaxLayer[];
  className?: string;
  height?: string;
}

export function ParallaxLayers({
  layers,
  className,
  height = '500px',
}: ParallaxLayersProps) {
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setScrollY(window.scrollY);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      style={{ height }}
    >
      {layers.map((layer, index) => (
        <div
          key={index}
          className={cn(
            'absolute inset-0 will-change-transform',
            layer.className
          )}
          style={{
            transform: `translateY(${scrollY * layer.speed}px)`,
            zIndex: layer.zIndex ?? index,
          }}
        >
          {layer.content}
        </div>
      ))}
    </div>
  );
}

// Scroll-triggered fade in component
interface ScrollFadeInProps {
  children: ReactNode;
  className?: string;
  threshold?: number;
  delay?: number;
}

export function ScrollFadeIn({
  children,
  className,
  threshold = 0.1,
  delay = 0,
}: ScrollFadeInProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, delay]);

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        className
      )}
    >
      {children}
    </div>
  );
}

// Scroll-triggered scale component
interface ScrollScaleProps {
  children: ReactNode;
  className?: string;
  threshold?: number;
  initialScale?: number;
}

export function ScrollScale({
  children,
  className,
  threshold = 0.1,
  initialScale = 0.9,
}: ScrollScaleProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={cn('transition-all duration-500 ease-out', className)}
      style={{
        transform: isVisible ? 'scale(1)' : `scale(${initialScale})`,
        opacity: isVisible ? 1 : 0,
      }}
    >
      {children}
    </div>
  );
}

// Staggered children animation
interface StaggeredChildrenProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
}

export function StaggeredChildren({
  children,
  className,
  staggerDelay = 100,
}: StaggeredChildrenProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          className="transition-all duration-500 ease-out"
          style={{
            transitionDelay: `${index * staggerDelay}ms`,
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

export default ParallaxContainer;
