import { useEffect, useState, type ReactNode } from "react";
import { Carousel, CarouselContent, type CarouselApi } from "@/components/ui/carousel";

interface AutoCarouselProps {
  children: ReactNode;
  /** ms between auto-advances */
  delay?: number;
  className?: string;
}

/**
 * Auto-sliding, swipeable carousel. Embla handles touch/drag natively; we drive
 * auto-advance with an interval that pauses on hover and while the user is
 * dragging. Items control how many show per view via their own `basis-*` classes
 * (e.g. basis-full on mobile = one card at a time).
 */
export function AutoCarousel({ children, delay = 4000, className }: AutoCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!api) return;
    const id = window.setInterval(() => {
      if (!paused) api.scrollNext();
    }, delay);
    return () => window.clearInterval(id);
  }, [api, paused, delay]);

  return (
    <Carousel
      setApi={setApi}
      opts={{ loop: true, align: "start" }}
      className={className}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={() => setPaused(true)}
      onPointerUp={() => setPaused(false)}
    >
      <CarouselContent className="-ml-4">{children}</CarouselContent>
    </Carousel>
  );
}
