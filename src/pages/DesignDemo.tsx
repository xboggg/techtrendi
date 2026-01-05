import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Palette, Sparkles, Navigation, Type, MousePointer, Accessibility } from "lucide-react";

// Import all design system components
import {
  ScrollAnimation,
  StaggerAnimation,
  ParallaxSection,
  TiltCard,
  LiftCard,
  RotateCard,
  GradientMesh,
  GradientHero,
  BlobBackground,
  GlassCard,
  GlassPanel,
  GlassButton,
  GlassInput,
  GlassBadge,
  SmartNavbar,
  ReadingProgressBar,
  FloatingActionButton,
  ScrollToTopButton,
  TableOfContents,
  AlertBox,
  Blockquote,
  CodeBlock,
  Accordion,
  Timeline,
  StatCounter,
  ImageLightbox,
  useLightbox,
  LazyImage,
  ToastProvider,
  useToast,
  SkipLink,
  FocusTrap,
  VisuallyHidden,
  FontSizeControls,
  ReadingMode,
  Skeleton,
  CardSkeleton,
  CardGridSkeleton,
} from "@/components/ui/design-system-index";

import { CommandPalette, useCommandPalette } from "@/components/ui/command-palette";

// Toast Demo Component
function ToastDemo() {
  const { showToast } = useToast();

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => showToast({ type: "success", title: "Success!", message: "Your action was completed." })}
        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
      >
        Success Toast
      </button>
      <button
        onClick={() => showToast({ type: "error", title: "Error!", message: "Something went wrong." })}
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
      >
        Error Toast
      </button>
      <button
        onClick={() => showToast({ type: "warning", title: "Warning!", message: "Please review this." })}
        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
      >
        Warning Toast
      </button>
      <button
        onClick={() => showToast({ type: "info", title: "Info", message: "Here's some information." })}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Info Toast
      </button>
    </div>
  );
}

// Lightbox Demo Component
function LightboxDemo() {
  const { isOpen, currentImage, openLightbox, closeLightbox, next, prev } = useLightbox();

  const images = [
    { src: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800", alt: "Tech 1" },
    { src: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800", alt: "Tech 2" },
    { src: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800", alt: "Tech 3" },
  ];

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img.src}
            alt={img.alt}
            className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => openLightbox(images, idx)}
          />
        ))}
      </div>
      <ImageLightbox
        images={images}
        currentIndex={currentImage}
        isOpen={isOpen}
        onClose={closeLightbox}
        onNext={next}
        onPrev={prev}
      />
    </>
  );
}

export default function DesignDemo() {
  const [accordionOpen, setAccordionOpen] = useState<string | null>("item1");
  const { isOpen: cmdOpen, open: openCmd, close: closeCmd } = useCommandPalette();

  const sections = [
    { id: "visual", title: "Visual & Animation" },
    { id: "glassmorphism", title: "Glassmorphism" },
    { id: "cards", title: "3D Card Effects" },
    { id: "navigation", title: "Navigation" },
    { id: "content", title: "Content Blocks" },
    { id: "interactive", title: "Interactive" },
    { id: "loading", title: "Loading States" },
    { id: "accessibility", title: "Accessibility" },
  ];

  const timelineItems = [
    { date: "Jan 2025", title: "Project Started", description: "Initial design system planning" },
    { date: "Feb 2025", title: "Components Built", description: "40 UI components created" },
    { date: "Mar 2025", title: "Testing Complete", description: "All features verified" },
  ];

  const accordionItems = [
    { id: "item1", title: "What is this design system?", content: "A comprehensive collection of 40 reusable UI components built with React and Tailwind CSS." },
    { id: "item2", title: "How do I use these components?", content: "Import them from @/components/ui/design-system-index and use them in your pages." },
    { id: "item3", title: "Are they accessible?", content: "Yes! All components follow WCAG guidelines with proper ARIA attributes and keyboard navigation." },
  ];

  const sampleCode = `import { GlassCard, TiltCard } from '@/components/ui/design-system-index';

function MyComponent() {
  return (
    <GlassCard>
      <TiltCard>
        <h2>Hello World</h2>
      </TiltCard>
    </GlassCard>
  );
}`;

  return (
    <ToastProvider>
      <Layout>
        <ReadingProgressBar />
        <SkipLink />

        {/* Hero Section with Gradient */}
        <div className="relative overflow-hidden">
          <GradientHero className="min-h-[50vh] flex items-center justify-center">
            <div className="container text-center relative z-10">
              <ScrollAnimation animation="fade-up">
                <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6">
                  <Palette className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  <span className="text-gradient">Design System</span> Demo
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                  Explore all 40 UI features in action. Press <kbd className="px-2 py-1 bg-muted rounded text-sm">Ctrl+K</kbd> to open command palette.
                </p>
                <div className="flex justify-center gap-4">
                  <GlassButton onClick={openCmd}>
                    Open Command Palette
                  </GlassButton>
                </div>
              </ScrollAnimation>
            </div>
          </GradientHero>
        </div>

        {/* Table of Contents */}
        <div className="container py-8">
          <TableOfContents sections={sections} />
        </div>

        <div className="container py-12 space-y-24">

          {/* Section 1: Visual & Animation */}
          <section id="visual">
            <ScrollAnimation animation="fade-up">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Visual & Animation</h2>
                  <p className="text-muted-foreground">Micro-interactions, scroll effects, gradients</p>
                </div>
              </div>
            </ScrollAnimation>

            {/* Scroll Animations */}
            <div className="mb-12">
              <h3 className="text-lg font-semibold mb-4">Scroll Animations</h3>
              <StaggerAnimation staggerDelay={100}>
                <div className="grid md:grid-cols-4 gap-4">
                  {["fade-up", "fade-down", "fade-left", "fade-right"].map((anim) => (
                    <ScrollAnimation key={anim} animation={anim as any}>
                      <div className="p-6 bg-card rounded-xl border border-border text-center">
                        <code className="text-sm text-primary">{anim}</code>
                      </div>
                    </ScrollAnimation>
                  ))}
                </div>
              </StaggerAnimation>
            </div>

            {/* Stat Counters */}
            <div className="mb-12">
              <h3 className="text-lg font-semibold mb-4">Animated Stat Counters</h3>
              <div className="grid md:grid-cols-4 gap-6">
                <StatCounter end={40} label="UI Components" suffix="+" />
                <StatCounter end={100} label="Accessibility Score" suffix="%" />
                <StatCounter end={15} label="Animation Types" />
                <StatCounter end={5} label="Theme Variants" />
              </div>
            </div>

            {/* Gradient Backgrounds */}
            <div className="mb-12">
              <h3 className="text-lg font-semibold mb-4">Gradient Backgrounds</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="relative h-48 rounded-2xl overflow-hidden">
                  <GradientMesh className="absolute inset-0" />
                  <div className="relative z-10 flex items-center justify-center h-full">
                    <span className="text-white font-semibold">Gradient Mesh</span>
                  </div>
                </div>
                <div className="relative h-48 rounded-2xl overflow-hidden">
                  <BlobBackground className="absolute inset-0" />
                  <div className="relative z-10 flex items-center justify-center h-full">
                    <span className="text-white font-semibold">Blob Background</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Glassmorphism */}
          <section id="glassmorphism">
            <ScrollAnimation animation="fade-up">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Glassmorphism</h2>
                  <p className="text-muted-foreground">Frosted glass effects with blur</p>
                </div>
              </div>
            </ScrollAnimation>

            <div className="relative">
              <BlobBackground className="absolute inset-0 rounded-2xl" />
              <div className="relative z-10 p-8 grid md:grid-cols-3 gap-6">
                <GlassCard className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">Glass Card</h3>
                  <p className="text-sm text-muted-foreground">A card with frosted glass effect</p>
                </GlassCard>

                <GlassPanel className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">Glass Panel</h3>
                  <p className="text-sm text-muted-foreground">More subtle glass effect</p>
                </GlassPanel>

                <div className="space-y-4 p-6">
                  <GlassBadge>Glass Badge</GlassBadge>
                  <GlassButton className="w-full">Glass Button</GlassButton>
                  <GlassInput placeholder="Glass Input..." />
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: 3D Card Effects */}
          <section id="cards">
            <ScrollAnimation animation="fade-up">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <MousePointer className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">3D Card Effects</h2>
                  <p className="text-muted-foreground">Interactive hover effects</p>
                </div>
              </div>
            </ScrollAnimation>

            <div className="grid md:grid-cols-3 gap-6">
              <TiltCard className="p-6 bg-card rounded-xl border border-border">
                <h3 className="font-semibold mb-2">Tilt Card</h3>
                <p className="text-sm text-muted-foreground">Hover to see 3D tilt effect following your cursor</p>
              </TiltCard>

              <LiftCard className="p-6 bg-card rounded-xl border border-border">
                <h3 className="font-semibold mb-2">Lift Card</h3>
                <p className="text-sm text-muted-foreground">Hover to see the card lift up with shadow</p>
              </LiftCard>

              <RotateCard className="p-6 bg-card rounded-xl border border-border">
                <h3 className="font-semibold mb-2">Rotate Card</h3>
                <p className="text-sm text-muted-foreground">Hover to see subtle rotation effect</p>
              </RotateCard>
            </div>
          </section>

          {/* Section 4: Navigation */}
          <section id="navigation">
            <ScrollAnimation animation="fade-up">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Navigation className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Navigation</h2>
                  <p className="text-muted-foreground">Smart navbar, FAB, command palette</p>
                </div>
              </div>
            </ScrollAnimation>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-card rounded-xl border border-border">
                <h3 className="font-semibold mb-4">Command Palette</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+K</kbd> anywhere to open
                </p>
                <GlassButton onClick={openCmd}>Open Command Palette</GlassButton>
              </div>

              <div className="p-6 bg-card rounded-xl border border-border">
                <h3 className="font-semibold mb-4">Smart Features</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>- Reading progress bar at top</li>
                  <li>- Scroll to top button (bottom right)</li>
                  <li>- Table of contents with active section</li>
                  <li>- Smart navbar hides on scroll down</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 5: Content Blocks */}
          <section id="content">
            <ScrollAnimation animation="fade-up">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Type className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Content Blocks</h2>
                  <p className="text-muted-foreground">Alerts, quotes, code, accordions, timelines</p>
                </div>
              </div>
            </ScrollAnimation>

            {/* Alert Boxes */}
            <div className="mb-8 space-y-4">
              <h3 className="text-lg font-semibold">Alert Boxes</h3>
              <AlertBox variant="info" title="Information">
                This is an informational alert to highlight important details.
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

            {/* Blockquote */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Blockquote</h3>
              <Blockquote author="Steve Jobs" source="Stanford Commencement, 2005">
                Design is not just what it looks like and feels like. Design is how it works.
              </Blockquote>
            </div>

            {/* Code Block */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Code Block</h3>
              <CodeBlock language="tsx" filename="example.tsx">
                {sampleCode}
              </CodeBlock>
            </div>

            {/* Accordion */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Accordion</h3>
              <Accordion
                items={accordionItems}
                openItem={accordionOpen}
                onToggle={setAccordionOpen}
              />
            </div>

            {/* Timeline */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Timeline</h3>
              <Timeline items={timelineItems} />
            </div>
          </section>

          {/* Section 6: Interactive */}
          <section id="interactive">
            <ScrollAnimation animation="fade-up">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <MousePointer className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Interactive Components</h2>
                  <p className="text-muted-foreground">Toasts, lightbox, lazy images</p>
                </div>
              </div>
            </ScrollAnimation>

            {/* Toast Notifications */}
            <div className="mb-8 p-6 bg-card rounded-xl border border-border">
              <h3 className="font-semibold mb-4">Toast Notifications</h3>
              <ToastDemo />
            </div>

            {/* Image Lightbox */}
            <div className="mb-8 p-6 bg-card rounded-xl border border-border">
              <h3 className="font-semibold mb-4">Image Lightbox</h3>
              <p className="text-sm text-muted-foreground mb-4">Click any image to open fullscreen viewer</p>
              <LightboxDemo />
            </div>

            {/* Lazy Image */}
            <div className="mb-8 p-6 bg-card rounded-xl border border-border">
              <h3 className="font-semibold mb-4">Lazy Loading Images</h3>
              <p className="text-sm text-muted-foreground mb-4">Images load as they enter viewport with blur-up effect</p>
              <div className="grid md:grid-cols-3 gap-4">
                <LazyImage
                  src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=400"
                  alt="Tech"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <LazyImage
                  src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400"
                  alt="Code"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <LazyImage
                  src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400"
                  alt="Security"
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            </div>
          </section>

          {/* Section 7: Loading States */}
          <section id="loading">
            <ScrollAnimation animation="fade-up">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Loading States</h2>
                  <p className="text-muted-foreground">Skeleton loaders for content</p>
                </div>
              </div>
            </ScrollAnimation>

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
                <CardSkeleton />
              </div>
            </div>

            <div className="mt-8">
              <h3 className="font-semibold mb-4">Card Grid Skeleton</h3>
              <CardGridSkeleton count={3} />
            </div>
          </section>

          {/* Section 8: Accessibility */}
          <section id="accessibility">
            <ScrollAnimation animation="fade-up">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Accessibility className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Accessibility</h2>
                  <p className="text-muted-foreground">Skip links, focus traps, font controls</p>
                </div>
              </div>
            </ScrollAnimation>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-card rounded-xl border border-border">
                <h3 className="font-semibold mb-4">Font Size Controls</h3>
                <p className="text-sm text-muted-foreground mb-4">Allow users to adjust text size</p>
                <FontSizeControls />
              </div>

              <div className="p-6 bg-card rounded-xl border border-border">
                <h3 className="font-semibold mb-4">Accessibility Features</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>- Skip link (press Tab on page load)</li>
                  <li>- Focus trap for modals</li>
                  <li>- Live regions for screen readers</li>
                  <li>- Reduced motion support</li>
                  <li>- Keyboard navigation</li>
                  <li>- ARIA attributes on all components</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 p-6 bg-card rounded-xl border border-border">
              <h3 className="font-semibold mb-4">Reading Mode</h3>
              <p className="text-sm text-muted-foreground mb-4">Simplified view for better focus</p>
              <ReadingMode>
                <p>This content is displayed in reading mode with optimized typography for better readability. The text is centered, has comfortable line height, and uses a maximum width to prevent eye strain from long lines.</p>
              </ReadingMode>
            </div>
          </section>

        </div>

        {/* Floating Components */}
        <ScrollToTopButton />
        <FloatingActionButton
          icon={<Palette className="w-5 h-5" />}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="bottom-24"
        />

        {/* Command Palette */}
        <CommandPalette isOpen={cmdOpen} onClose={closeCmd} />
      </Layout>
    </ToastProvider>
  );
}
