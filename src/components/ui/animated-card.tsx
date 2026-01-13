import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  animation?: "fade-up" | "fade-in" | "scale-in" | "slide-left" | "slide-right";
}

export function AnimatedCard({
  children,
  delay = 0,
  className,
  animation = "fade-up"
}: AnimatedCardProps) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: "50px",
  });

  const animations = {
    "fade-up": "opacity-0 translate-y-8",
    "fade-in": "opacity-0",
    "scale-in": "opacity-0 scale-95",
    "slide-left": "opacity-0 -translate-x-8",
    "slide-right": "opacity-0 translate-x-8",
  };

  const activeAnimations = {
    "fade-up": "opacity-100 translate-y-0",
    "fade-in": "opacity-100",
    "scale-in": "opacity-100 scale-100",
    "slide-left": "opacity-100 translate-x-0",
    "slide-right": "opacity-100 translate-x-0",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        animations[animation],
        inView && activeAnimations[animation],
        className
      )}
      style={{
        transitionDelay: inView ? `${delay}ms` : "0ms",
      }}
    >
      {children}
    </div>
  );
}
