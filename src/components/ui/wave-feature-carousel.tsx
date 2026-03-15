import { useEffect, useRef, useState, useCallback } from "react";
import { Sparkles, Shield, Zap, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Insights",
    description: "We use AI to analyze trends, generate comparisons, and surface the tech that actually matters — not just what's trending on Twitter.",
    gradient: "from-blue-500 to-cyan-400",
    glowColor: "rgba(59,130,246,0.5)",
  },
  {
    icon: Shield,
    title: "Security You Can Trust",
    description: "Every guide is reviewed for accuracy. Our cybersecurity content follows industry best practices so you can protect your data with confidence.",
    gradient: "from-purple-500 to-indigo-400",
    glowColor: "rgba(139,92,246,0.5)",
  },
  {
    icon: Zap,
    title: "90+ Free Tools",
    description: "Password generators, resume builders, Pomodoro timers, and more — all free, no sign-up required. Built to save you time, not waste it.",
    gradient: "from-amber-500 to-orange-400",
    glowColor: "rgba(245,158,11,0.5)",
  },
  {
    icon: BookOpen,
    title: "In-Depth Reviews & Guides",
    description: "No fluff, no filler. We test products hands-on and write guides that actually help you make decisions — not just hit a word count.",
    gradient: "from-emerald-500 to-teal-400",
    glowColor: "rgba(16,185,129,0.5)",
  },
];

export function WaveFeatureCarousel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(0);
  const [displayActive, setDisplayActive] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );
  const isDarkRef = useRef(isDark);

  // Watch for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains("dark");
      setIsDark(dark);
      isDarkRef.current = dark;
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Smooth transition: fade out, swap content, fade in
  const transitionTo = useCallback((nextIndex: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    // After fade-out completes, swap content and fade back in
    setTimeout(() => {
      setDisplayActive(nextIndex);
      setActive(nextIndex);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 500);
  }, [isTransitioning]);

  // Auto-advance carousel
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((p) => {
        const next = (p + 1) % features.length;
        transitionTo(next);
        return p; // don't change here, transitionTo handles it
      });
    }, 5000);
  }, [transitionTo]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  const go = (dir: number) => {
    const next = (active + dir + features.length) % features.length;
    transitionTo(next);
    resetTimer();
  };

  // Wave canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;
    const waves = Array.from({ length: 8 }, () => ({
      value: Math.random() * 0.5 + 0.1,
      target: Math.random() * 0.5 + 0.1,
      speed: Math.random() * 0.02 + 0.01,
    }));

    function resize() {
      canvas!.width = canvas!.offsetWidth * window.devicePixelRatio;
      canvas!.height = canvas!.offsetHeight * window.devicePixelRatio;
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function draw() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, w, h);
      const dark = isDarkRef.current;

      waves.forEach((wave, i) => {
        if (Math.random() < 0.01) wave.target = Math.random() * 0.7 + 0.1;
        wave.value += (wave.target - wave.value) * wave.speed;

        const freq = wave.value * 7;
        ctx!.beginPath();
        for (let x = 0; x < w; x++) {
          const nx = (x / w) * 2 - 1;
          const px = nx + i * 0.04 + freq * 0.03;
          const py = Math.sin(px * 10 + time) * Math.cos(px * 2) * freq * 0.1 * ((i + 1) / 8);
          const y = (py + 1) * h / 2 + h * 0.15;
          x === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y);
        }

        const intensity = Math.min(1, freq * 0.3);
        let r: number, g: number, b: number, alpha: number;

        if (dark) {
          // Dark mode: soft indigo/purple waves with glow
          r = 79 + intensity * 100;
          g = 70 + intensity * 130;
          b = 229;
          alpha = 0.5;
          ctx!.lineWidth = 1 + i * 0.3;
          ctx!.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx!.shadowColor = `rgba(${r},${g},${b},0.4)`;
          ctx!.shadowBlur = 5;
        } else {
          // Light mode: crisp, vibrant waves — no blur
          r = 55 + intensity * 50;
          g = 48 + intensity * 60;
          b = 210 + intensity * 45;
          alpha = 0.85;
          ctx!.lineWidth = 1.5 + i * 0.4;
          ctx!.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx!.shadowBlur = 0;
        }

        ctx!.stroke();
        ctx!.shadowBlur = 0;
      });

      time += 0.02;
      animId = requestAnimationFrame(draw);
    }

    window.addEventListener("resize", resize);
    resize();
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  const feat = features[displayActive];
  const Icon = feat.icon;

  return (
    <section className="relative w-full py-14 md:py-20 overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:bg-background dark:from-transparent dark:to-transparent">
      {/* Wave canvas background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-80 dark:opacity-60"
      />

      {/* Subtle radial overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.06),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(79,70,229,0.08),transparent_70%)]" />

      <div className="container relative z-10">
        {/* Section header */}
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-sm font-medium text-primary mb-4 border border-primary/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20">
            Why Choose Us
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Why Choose{" "}
            <span className="text-gradient">
              TechTrendi
            </span>
            ?
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            We combine AI intelligence with expert knowledge to deliver the most accurate and helpful tech guidance.
          </p>
        </div>

        {/* Carousel */}
        <div className="flex items-center justify-center gap-4 md:gap-8">
          {/* Prev button */}
          <button
            onClick={() => go(-1)}
            className="shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full border border-border bg-card/50 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card/80 transition-all dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Card */}
          <div className="w-full max-w-sm">
            <div
              className="relative rounded-2xl overflow-hidden transition-all duration-500 animate-float"
              style={{
                background: isDark ? "rgba(15, 15, 35, 0.45)" : "rgba(255, 255, 255, 0.55)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(99,102,241,0.15)",
                boxShadow: isDark
                  ? `0 0 80px ${feat.glowColor.replace("0.5", "0.12")}, 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)`
                  : `0 0 60px ${feat.glowColor.replace("0.5", "0.08")}, 0 8px 32px rgba(99,102,241,0.08), 0 1px 3px rgba(0,0,0,0.06)`,
              }}
            >
              {/* Top visual area */}
              <div className="p-6 pb-4 flex justify-center">
                <div
                  className="w-full h-44 rounded-xl relative overflow-hidden flex items-center justify-center"
                  style={{
                    background: isDark
                      ? "linear-gradient(135deg, rgba(79,70,229,0.08), rgba(139,92,246,0.05))"
                      : "linear-gradient(135deg, rgba(79,70,229,0.06), rgba(139,92,246,0.04))",
                    border: isDark ? "1px solid rgba(99,102,241,0.15)" : "1px solid rgba(99,102,241,0.12)",
                    boxShadow: isDark
                      ? `inset 0 0 60px ${feat.glowColor.replace("0.5", "0.06")}, inset 0 1px 0 rgba(255,255,255,0.05)`
                      : `inset 0 0 40px ${feat.glowColor.replace("0.5", "0.04")}`,
                  }}
                >
                  {/* Animated grid */}
                  <div
                    className="absolute inset-0 opacity-10 dark:opacity-10"
                    style={{
                      backgroundImage: isDark
                        ? "linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)"
                        : "linear-gradient(90deg, rgba(99,102,241,0.25) 1px, transparent 1px), linear-gradient(rgba(99,102,241,0.25) 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                      animation: "gridDrift 4s linear infinite",
                    }}
                  />
                  {/* Icon with glow */}
                  <div
                    className="relative z-10"
                    style={{
                      opacity: isTransitioning ? 0 : 1,
                      transform: isTransitioning ? 'scale(0.92)' : 'scale(1)',
                      transition: 'opacity 500ms cubic-bezier(0.25,0.1,0.25,1), transform 500ms cubic-bezier(0.25,0.1,0.25,1)',
                    }}
                  >
                    <div
                      className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center shadow-xl`}
                      style={{ boxShadow: `0 0 30px ${feat.glowColor}` }}
                    >
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  {/* Corner accents */}
                  <div className="absolute top-2 left-2 w-6 h-6 border-t border-l border-indigo-400/30 dark:border-indigo-400/30 rounded-tl-md" />
                  <div className="absolute top-2 right-2 w-6 h-6 border-t border-r border-indigo-400/30 dark:border-indigo-400/30 rounded-tr-md" />
                  <div className="absolute bottom-2 left-2 w-6 h-6 border-b border-l border-indigo-400/30 dark:border-indigo-400/30 rounded-bl-md" />
                  <div className="absolute bottom-2 right-2 w-6 h-6 border-b border-r border-indigo-400/30 dark:border-indigo-400/30 rounded-br-md" />
                </div>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent dark:via-white/20" />

              {/* Content */}
              <div
                className="p-6"
                style={{
                  opacity: isTransitioning ? 0 : 1,
                  transform: isTransitioning ? 'translateY(8px)' : 'translateY(0)',
                  transition: 'opacity 500ms cubic-bezier(0.25,0.1,0.25,1), transform 500ms cubic-bezier(0.25,0.1,0.25,1)',
                }}
              >
                <span className="inline-block px-3 py-1 text-primary dark:text-indigo-300 rounded-full text-xs font-medium mb-3 border border-primary/20 bg-primary/10 dark:border-indigo-400/20 dark:bg-indigo-500/10">
                  {String(displayActive + 1).padStart(2, "0")} / {String(features.length).padStart(2, "0")}
                </span>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feat.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feat.description}
                </p>
              </div>
            </div>
          </div>

          {/* Next button */}
          <button
            onClick={() => go(1)}
            className="shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full border border-border bg-card/50 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card/80 transition-all dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {features.map((_, i) => (
            <button
              key={i}
              onClick={() => { transitionTo(i); resetTimer(); }}
              className={`h-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
                i === displayActive
                  ? "w-8 bg-primary dark:bg-indigo-400"
                  : "w-2 bg-foreground/15 hover:bg-foreground/30 dark:bg-white/20 dark:hover:bg-white/40"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
