"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type Testimonial = {
  quote: string;
  name: string;
  designation: string;
  src: string;
  href?: string;
};

export const AnimatedTestimonials = ({
  testimonials,
  autoplay = false,
  className,
}: {
  testimonials: Testimonial[];
  autoplay?: boolean;
  className?: string;
}) => {
  const [active, setActive] = useState(0);

  const handleNext = useCallback(() => {
    setActive((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const handlePrev = useCallback(() => {
    setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  const isActive = (index: number) => {
    return index === active;
  };

  useEffect(() => {
    if (autoplay) {
      const interval = setInterval(handleNext, 6000);
      return () => clearInterval(interval);
    }
  }, [autoplay, handleNext]);

  // Touch swipe support
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const minSwipeDistance = 50;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const distance = touchStartX.current - touchEndX.current;
    if (Math.abs(distance) >= minSwipeDistance) {
      if (distance > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  }, [handleNext, handlePrev]);

  const randomRotateY = () => {
    return Math.floor(Math.random() * 15) - 7;
  };

  return (
    <div className={cn("max-w-sm md:max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-12", className)}>
      <div
        className="relative grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div>
          <div className="relative h-80 w-full">
            <AnimatePresence>
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.src}
                  initial={{
                    opacity: 0,
                    scale: 0.9,
                    z: -100,
                    rotate: randomRotateY(),
                  }}
                  animate={{
                    opacity: isActive(index) ? 1 : 0.7,
                    scale: isActive(index) ? 1 : 0.95,
                    z: isActive(index) ? 0 : -100,
                    rotate: isActive(index) ? 0 : randomRotateY(),
                    zIndex: isActive(index)
                      ? 999
                      : testimonials.length + 2 - index,
                    y: isActive(index) ? [0, -40, 0] : 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.9,
                    z: 100,
                    rotate: randomRotateY(),
                  }}
                  transition={{
                    duration: 0.8,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  className="absolute inset-0 origin-bottom"
                >
                  {testimonial.href ? (
                    <Link to={testimonial.href} className="block h-full w-full">
                      <img
                        src={testimonial.src}
                        alt={testimonial.name}
                        draggable={false}
                        className="h-full w-full rounded-3xl object-cover object-center shadow-lg hover:brightness-90 transition-all duration-300"
                      />
                    </Link>
                  ) : (
                    <img
                      src={testimonial.src}
                      alt={testimonial.name}
                      draggable={false}
                      className="h-full w-full rounded-3xl object-cover object-center shadow-lg"
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex justify-between flex-col py-4">
          <motion.div
            key={active}
            initial={{
              y: 20,
              opacity: 0,
            }}
            animate={{
              y: 0,
              opacity: 1,
            }}
            exit={{
              y: -20,
              opacity: 0,
            }}
            transition={{
              duration: 0.6,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            <h3 className="text-2xl font-bold text-foreground line-clamp-2">
              {testimonials[active].name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {testimonials[active].designation}
            </p>
            <motion.p className="text-base text-muted-foreground mt-6 line-clamp-4 leading-relaxed">
              {testimonials[active].quote.split(" ").map((word, index) => (
                <motion.span
                  key={index}
                  initial={{
                    filter: "blur(8px)",
                    opacity: 0,
                    y: 4,
                  }}
                  animate={{
                    filter: "blur(0px)",
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.4,
                    ease: [0.25, 0.1, 0.25, 1],
                    delay: 0.015 * index,
                  }}
                  className="inline-block"
                >
                  {word}&nbsp;
                </motion.span>
              ))}
            </motion.p>
            {testimonials[active].href && (
              <Link
                to={testimonials[active].href!}
                className="inline-flex items-center gap-1 mt-4 px-3 py-1 text-xs font-medium text-primary border border-primary/30 rounded-full hover:bg-primary/10 transition-colors duration-200"
              >
                Read more
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </motion.div>
          <div className="flex items-center gap-4 pt-8 md:pt-0 border-t border-border/40">
            <button
              onClick={handlePrev}
              className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors duration-200 shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 text-white" />
            </button>
            <button
              onClick={handleNext}
              className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors duration-200 shadow-sm"
            >
              <ArrowRight className="h-4 w-4 text-white" />
            </button>
            <span className="text-sm text-muted-foreground font-medium">
              {active + 1} / {testimonials.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
