import React, { ReactNode } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

type AnimationType =
  | 'fade-in'
  | 'fade-in-up'
  | 'fade-in-down'
  | 'fade-in-left'
  | 'fade-in-right'
  | 'scale-in'
  | 'blur-in';

interface ScrollAnimationProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  threshold?: number;
}

/**
 * Wrapper component for scroll-triggered animations
 */
export function ScrollAnimation({
  children,
  animation = 'fade-in-up',
  delay = 0,
  duration = 600,
  className,
  as: Component = 'div',
  threshold = 0.1,
}: ScrollAnimationProps) {
  const { ref, isVisible } = useScrollAnimation({ threshold });

  const animationStyles: Record<AnimationType, { initial: React.CSSProperties; visible: React.CSSProperties }> = {
    'fade-in': {
      initial: { opacity: 0 },
      visible: { opacity: 1 },
    },
    'fade-in-up': {
      initial: { opacity: 0, transform: 'translateY(30px)' },
      visible: { opacity: 1, transform: 'translateY(0)' },
    },
    'fade-in-down': {
      initial: { opacity: 0, transform: 'translateY(-30px)' },
      visible: { opacity: 1, transform: 'translateY(0)' },
    },
    'fade-in-left': {
      initial: { opacity: 0, transform: 'translateX(-30px)' },
      visible: { opacity: 1, transform: 'translateX(0)' },
    },
    'fade-in-right': {
      initial: { opacity: 0, transform: 'translateX(30px)' },
      visible: { opacity: 1, transform: 'translateX(0)' },
    },
    'scale-in': {
      initial: { opacity: 0, transform: 'scale(0.9)' },
      visible: { opacity: 1, transform: 'scale(1)' },
    },
    'blur-in': {
      initial: { opacity: 0, filter: 'blur(10px)' },
      visible: { opacity: 1, filter: 'blur(0)' },
    },
  };

  const { initial, visible } = animationStyles[animation];

  return (
    <Component
      ref={ref as React.RefObject<HTMLDivElement>}
      className={className}
      style={{
        ...(isVisible ? visible : initial),
        transition: `all ${duration}ms ease-out ${delay}ms`,
      }}
    >
      {children}
    </Component>
  );
}

/**
 * Stagger animation for lists of items
 */
interface StaggerAnimationProps {
  children: ReactNode[];
  staggerDelay?: number;
  className?: string;
}

export function StaggerAnimation({
  children,
  staggerDelay = 100,
  className,
}: StaggerAnimationProps) {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: `all 400ms ease-out ${index * staggerDelay}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

/**
 * Parallax section wrapper
 */
interface ParallaxSectionProps {
  children: ReactNode;
  backgroundImage?: string;
  backgroundColor?: string;
  speed?: number;
  className?: string;
  overlay?: boolean;
}

export function ParallaxSection({
  children,
  backgroundImage,
  backgroundColor,
  speed = 0.5,
  className,
  overlay = true,
}: ParallaxSectionProps) {
  const [scrollY, setScrollY] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const elementCenter = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      const offset = (elementCenter - viewportCenter) * speed;
      setScrollY(offset);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div
      ref={ref}
      className={cn('relative overflow-hidden', className)}
    >
      {/* Background Layer */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          transform: `translateY(${scrollY}px)`,
          backgroundColor,
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Overlay */}
      {overlay && (
        <div className="absolute inset-0 -z-10 bg-black/30" />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default ScrollAnimation;
