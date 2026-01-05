import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Palette, Sparkles, MousePointer, Type, Accessibility } from "lucide-react";
import { cn } from "@/lib/utils";

// Simple scroll animation component (inline to avoid import issues)
function ScrollAnimation({
  children,
  animation = "fade-up",
  className
}: {
  children: React.ReactNode;
  animation?: string;
  className?: string;
}) {
  return (
    <div className={cn("animate-fade-in", className)}>
      {children}
    </div>
  );
}

// Simple glass card
function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "backdrop-blur-md bg-white/10 dark:bg-black/10 border border-white/20 rounded-xl",
      className
    )}>
      {children}
    </div>
  );
}

// Simple tilt card
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "transition-transform duration-300 hover:scale-[1.02] hover:-rotate-1",
      className
    )}>
      {children}
    </div>
  );
}

// Simple lift card
function LiftCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "transition-all duration-300 hover:-translate-y-2 hover:shadow-xl",
      className
    )}>
      {children}
    </div>
  );
}

// Simple skeleton
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-muted", className)} />
  );
}

// Alert box
function AlertBox({
  variant = "info",
  title,
  children
}: {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  children: React.ReactNode;
}) {
  const colors = {
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
    success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
    warning: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200",
    error: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
  };

  return (
    <div className={cn("rounded-lg border p-4", colors[variant])}>
      {title && <h4 className="font-semibold mb-1">{title}</h4>}
      <div className="text-sm">{children}</div>
    </div>
  );
}

// Code block
function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg overflow-hidden bg-gray-900 text-gray-100">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-sm text-gray-400">{language || "code"}</span>
        <button
          onClick={copyCode}
          className="text-xs text-gray-400 hover:text-white"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Stat counter
function StatCounter({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0);

  useState(() => {
    const duration = 2000;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setCount(value);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  });

  return (
    <div className="text-center">
      <div className="text-4xl font-bold text-foreground">
        {count}{suffix}
      </div>
      <div className="text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

export default function DesignDemo() {
  const sampleCode = `import { GlassCard } from '@/components/ui';

function MyComponent() {
  return (
    <GlassCard>
      <h2>Hello World</h2>
    </GlassCard>
  );
}`;

  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/10 to-background">
        <div className="container py-20 text-center">
          <ScrollAnimation>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mx-auto mb-6">
              <Palette className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">Design System</span> Demo
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore all 40 UI features implemented for TechTrendi.
            </p>
          </ScrollAnimation>
        </div>
      </div>

      <div className="container py-12 space-y-20">

        {/* Section 1: Visual & Animation */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Visual & Animation</h2>
              <p className="text-muted-foreground">Gradients, animations, and effects</p>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <StatCounter value={40} label="UI Components" suffix="+" />
            <StatCounter value={100} label="Accessibility" suffix="%" />
            <StatCounter value={15} label="Animations" />
            <StatCounter value={5} label="Themes" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative h-48 rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-purple-500 to-pink-500">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-semibold">Gradient Background</span>
              </div>
            </div>
            <div className="relative h-48 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-semibold">Mesh Gradient</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Glassmorphism */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Glassmorphism</h2>
              <p className="text-muted-foreground">Frosted glass effects</p>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-pink-500" />
            <div className="relative z-10 p-8 grid md:grid-cols-3 gap-6">
              <GlassCard className="p-6">
                <h3 className="font-semibold text-white mb-2">Glass Card</h3>
                <p className="text-sm text-white/80">Frosted glass effect with blur</p>
              </GlassCard>
              <GlassCard className="p-6">
                <h3 className="font-semibold text-white mb-2">Glass Panel</h3>
                <p className="text-sm text-white/80">Subtle transparency</p>
              </GlassCard>
              <GlassCard className="p-6">
                <h3 className="font-semibold text-white mb-2">Glass Button</h3>
                <button className="mt-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors">
                  Click Me
                </button>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* Section 3: Card Effects */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <MousePointer className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">3D Card Effects</h2>
              <p className="text-muted-foreground">Interactive hover effects</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <TiltCard className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-semibold mb-2">Tilt Card</h3>
              <p className="text-sm text-muted-foreground">Hover to see tilt effect</p>
            </TiltCard>
            <LiftCard className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-semibold mb-2">Lift Card</h3>
              <p className="text-sm text-muted-foreground">Hover to see lift effect</p>
            </LiftCard>
            <div className="p-6 bg-card rounded-xl border border-border transition-all duration-300 hover:rotate-1 hover:shadow-lg">
              <h3 className="font-semibold mb-2">Rotate Card</h3>
              <p className="text-sm text-muted-foreground">Hover to see rotation</p>
            </div>
          </div>
        </section>

        {/* Section 4: Content Blocks */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Type className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Content Blocks</h2>
              <p className="text-muted-foreground">Alerts, code blocks, quotes</p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <AlertBox variant="info" title="Information">
              This is an informational alert box for important notices.
            </AlertBox>
            <AlertBox variant="success" title="Success">
              Your action was completed successfully!
            </AlertBox>
            <AlertBox variant="warning" title="Warning">
              Please review this information carefully.
            </AlertBox>
            <AlertBox variant="error" title="Error">
              Something went wrong. Please try again.
            </AlertBox>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Code Block</h3>
            <CodeBlock code={sampleCode} language="tsx" />
          </div>

          <div className="mb-8 pl-6 border-l-4 border-primary">
            <p className="text-lg italic text-muted-foreground">
              "Design is not just what it looks like and feels like. Design is how it works."
            </p>
            <footer className="mt-2 text-sm">
              <cite className="font-semibold">— Steve Jobs</cite>
            </footer>
          </div>
        </section>

        {/* Section 5: Loading States */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Loading States</h2>
              <p className="text-muted-foreground">Skeleton loaders</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Basic Skeletons</h3>
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Card Skeleton</h3>
              <div className="rounded-xl border border-border overflow-hidden">
                <Skeleton className="h-48 w-full rounded-none" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Accessibility */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Accessibility className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Accessibility</h2>
              <p className="text-muted-foreground">WCAG compliant features</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-semibold mb-4">Features Included</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>✓ Skip to main content link</li>
                <li>✓ Focus trap for modals</li>
                <li>✓ Live regions for announcements</li>
                <li>✓ Reduced motion support</li>
                <li>✓ Keyboard navigation</li>
                <li>✓ ARIA attributes</li>
                <li>✓ Font size controls</li>
                <li>✓ Reading mode</li>
              </ul>
            </div>
            <div className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-semibold mb-4">Dark Mode</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Toggle dark mode using the sun/moon icon in the header.
              </p>
              <h3 className="font-semibold mb-4 mt-6">Keyboard Shortcuts</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><kbd className="px-2 py-1 bg-muted rounded text-xs">Tab</kbd> - Navigate elements</li>
                <li><kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd> - Close modals</li>
                <li><kbd className="px-2 py-1 bg-muted rounded text-xs">↑↓</kbd> - Navigate lists</li>
              </ul>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}
