// The site's slider (src/components/ui/slider.tsx), with one difference: the name and the
// spoken value go on the THUMB, the element with role="slider" that screen readers focus.
// The shared component puts aria-label on the outer wrapper, so its thumb has no name.
// Same markup and classes otherwise, so the data bundle pages look exactly the same.
import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

type Props = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-valuetext"?: string;
};

export const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, Props>(
  ({ className, "aria-label": label, "aria-labelledby": labelledBy, "aria-valuetext": valueText, ...props }, ref) => (
    <SliderPrimitive.Root ref={ref} className={cn("relative flex w-full touch-none select-none items-center", className)} {...props}>
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={label}
        aria-labelledby={labelledBy}
        aria-valuetext={valueText}
        // The 20 px thumb gets a transparent 44 px hit area (12 px each side) for fingers (UI audit L3).
        className="relative block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors before:absolute before:-inset-3 before:rounded-full before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      />
    </SliderPrimitive.Root>
  ),
);
Slider.displayName = "LabelledSlider";
