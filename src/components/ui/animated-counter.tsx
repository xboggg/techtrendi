import { useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import CountUp from "react-countup";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  end: number;
  start?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  separator?: string;
  className?: string;
}

export function AnimatedCounter({
  end,
  start = 0,
  duration = 2.5,
  decimals = 0,
  prefix = "",
  suffix = "",
  separator = ",",
  className,
}: AnimatedCounterProps) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  const hasAnimated = useRef(false);

  useEffect(() => {
    if (inView) {
      hasAnimated.current = true;
    }
  }, [inView]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {inView || hasAnimated.current ? (
        <CountUp
          start={start}
          end={end}
          duration={duration}
          decimals={decimals}
          prefix={prefix}
          suffix={suffix}
          separator={separator}
          useEasing
          easingFn={(t, b, c, d) => {
            // EaseOutExpo
            return c * (-Math.pow(2, (-10 * t) / d) + 1) + b;
          }}
        />
      ) : (
        start
      )}
    </span>
  );
}
