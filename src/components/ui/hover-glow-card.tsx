import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface HoverGlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
}

export function HoverGlowCard({
  children,
  className,
  glowColor = "rgba(99, 102, 241, 0.15)",
  onClick,
}: HoverGlowCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={cn(
        "relative group rounded-2xl border border-white/[0.08] bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 backdrop-blur-sm overflow-hidden",
        onClick && "cursor-pointer",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      // onTap goes through framer-motion's pointer-gesture system, which tracks
      // the element through its hover-lift transform — so mouse clicks register
      // reliably (a plain onClick was being dropped by the y:-4 transform).
      // Ignore taps that land on an inner control (Read more / Share buttons).
      onTap={(e) => {
        const target = e.target as HTMLElement | null;
        if (target?.closest("button")) return;
        onClick?.();
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
    >
      {/* Ambient glow on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              background: `radial-gradient(600px circle at 50% 0%, ${glowColor}, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Border glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={{
          boxShadow: isHovered
            ? `inset 0 0 0 1px rgba(255,255,255,0.12), 0 0 30px -5px ${glowColor}`
            : "inset 0 0 0 1px rgba(255,255,255,0.05), 0 0 0 0 transparent",
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Subtle shine sweep on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%]"
              style={{
                background: "conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.03) 10%, transparent 20%)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

interface CardGridProps {
  children: React.ReactNode;
  className?: string;
}

export function CardGrid({ children, className }: CardGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start",
        className
      )}
    >
      {children}
    </div>
  );
}
