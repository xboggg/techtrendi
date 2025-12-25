import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Shield, Zap, BookOpen, Wrench, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import heroBg from "@/assets/hero-bg.png";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Insights",
    description: "Get smart recommendations powered by advanced AI technology.",
  },
  {
    icon: Shield,
    title: "Security First",
    description: "Expert advice on keeping your digital life safe and secure.",
  },
  {
    icon: Zap,
    title: "Quick Tools",
    description: "Free utilities that save you time and boost productivity.",
  },
  {
    icon: BookOpen,
    title: "Expert Guides",
    description: "Comprehensive tutorials written by technology professionals.",
  },
];

const featuredGuides = [
  {
    title: "Best Smartphones 2025",
    category: "Phone Guides",
    description: "Complete comparison of the top smartphones with detailed specs and recommendations.",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop",
    href: "/guides/phones",
  },
  {
    title: "Password Security Guide",
    category: "Security",
    description: "Essential tips to create and manage strong passwords across all your accounts.",
    image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400&h=300&fit=crop",
    href: "/guides/security",
  },
  {
    title: "Top Productivity Apps",
    category: "Productivity",
    description: "The best apps to streamline your workflow and get more done in less time.",
    image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=300&fit=crop",
    href: "/guides/productivity",
  },
];

const tools = [
  {
    icon: Shield,
    title: "Password Generator",
    description: "Create strong, secure passwords instantly",
    href: "/tools/password-generator",
    color: "primary",
  },
  {
    icon: Wrench,
    title: "QR Code Generator",
    description: "Generate QR codes for any URL or text",
    href: "/tools/qr-generator",
    color: "secondary",
  },
  {
    icon: Zap,
    title: "Image Compressor",
    description: "Compress images without losing quality",
    href: "/tools/image-compressor",
    color: "accent",
  },
];

export default function Index() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 opacity-30">
          <img src={heroBg} alt="" className="w-full h-full object-cover object-center" />
        </div>
        <div className="container relative py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Tech Guidance
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Your Smart Guide to{" "}
              <span className="text-gradient">Modern Technology</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Expert reviews, comprehensive guides, and powerful AI tools to help you make the best tech decisions.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/guides">
                  Explore Guides
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="heroOutline" size="xl" asChild>
                <Link to="/tools">Try Free Tools</Link>
              </Button>
            </div>
          </div>
        </div>
        {/* Gradient fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose TechTrendi?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We combine AI intelligence with expert knowledge to deliver the most accurate and helpful tech guidance.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl bg-card border border-border shadow-card hover:shadow-elevated hover:border-primary/20 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Guides */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Featured Guides
              </h2>
              <p className="text-muted-foreground">Expert-written guides to help you navigate technology.</p>
            </div>
            <Button variant="outline" asChild className="hidden md:inline-flex">
              <Link to="/guides">
                View All Guides
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredGuides.map((guide) => (
              <Link
                key={guide.title}
                to={guide.href}
                className="group bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-elevated hover:border-primary/20 transition-all duration-300"
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={guide.image}
                    alt={guide.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                    {guide.category}
                  </span>
                  <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">{guide.description}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" asChild>
              <Link to="/guides">
                View All Guides
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* AI Tools Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Free AI-Powered Tools
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful utilities to boost your productivity and keep you secure online.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <Link
                key={tool.title}
                to={tool.href}
                className="group p-8 rounded-2xl bg-card border border-border shadow-card hover:shadow-elevated hover:border-primary/20 transition-all duration-300 text-center"
              >
                <div className={`w-16 h-16 rounded-2xl bg-${tool.color}/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <tool.icon className={`w-8 h-8 text-${tool.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {tool.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">{tool.description}</p>
                <span className="inline-flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                  Try Now <ArrowRight className="w-4 h-4 ml-1" />
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/tools">
                Explore All Tools
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-background blur-3xl" />
        </div>
        <div className="container relative text-center">
          <div className="max-w-2xl mx-auto">
            <Star className="w-12 h-12 text-primary-foreground mx-auto mb-6 animate-float" />
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Get Premium Access
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8">
              Unlock ad-free browsing, premium tools, downloadable guides, and early access to new content.
            </p>
            <Button
              size="xl"
              className="bg-background text-foreground hover:bg-background/90 shadow-elevated"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-primary-foreground/60 text-sm mt-4">
              Just $4.99/month • Cancel anytime
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
