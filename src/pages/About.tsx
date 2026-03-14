import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Link } from "react-router-dom";
import {
  Target, Users, Award, Heart, Sparkles, Shield, Zap,
  TrendingUp, Smartphone, Newspaper, Brain, Building2, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useInView } from "react-intersection-observer";

const stats = [
  { label: "Articles Published", value: 57, suffix: "+", icon: Newspaper, color: "from-blue-500 to-indigo-500" },
  { label: "Tools Available", value: 80, suffix: "+", icon: Zap, color: "from-purple-500 to-pink-500" },
  { label: "Daily Readers", value: 92, suffix: "K+", icon: Users, color: "from-orange-500 to-red-500" },
  { label: "User Satisfaction", value: 50, suffix: "%", icon: Heart, color: "from-green-500 to-emerald-500" },
];

const expertise = [
  {
    icon: Brain,
    title: "Artificial Intelligence",
    description: "Deep dives into AI tools, machine learning breakthroughs, and how they're reshaping our digital lives.",
  },
  {
    icon: Shield,
    title: "Cybersecurity",
    description: "Stay protected with practical security guides, privacy tools, and threat awareness articles.",
  },
  {
    icon: Zap,
    title: "Productivity",
    description: "Unlock your potential with app reviews, workflow tips, and efficiency-boosting guides.",
  },
  {
    icon: Building2,
    title: "Digital Economy",
    description: "Navigate the creator economy, side hustles, and remote work trends with actionable insights.",
  },
  {
    icon: Smartphone,
    title: "Smartphones & Gadgets",
    description: "Buying guides, in-depth reviews, and comparison tools for your next device.",
  },
  {
    icon: Newspaper,
    title: "Daily Tech News",
    description: "Stay informed with curated tech news covering AI, crypto, startups, and more.",
  },
];

const values = [
  {
    icon: Target,
    title: "Accuracy First",
    description: "We verify every fact and spec before publishing. Our reputation depends on it.",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: Users,
    title: "Built for Real People",
    description: "No jargon, no fluff. Clear language that anyone can understand and apply.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Award,
    title: "Truly Independent",
    description: "Our reviews and recommendations are never influenced by advertisers or sponsors.",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: Heart,
    title: "Free & Accessible",
    description: "Core content and tools are free forever. Premium is optional, never required.",
    color: "from-green-500 to-emerald-500",
  },
];

export default function About() {
  const { ref: statsRef, inView: statsInView } = useInView({ triggerOnce: true, threshold: 0.3 });

  return (
    <Layout>
      <SEOHead
        title="About TechTrendi - Technology Made Simple"
        description="Learn about TechTrendi's mission to make technology accessible for everyone through expert guides, honest reviews, and free AI-powered tools."
        canonicalUrl="https://techtrendi.com/about"
      />

      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-secondary/5 to-background" />
        <div className="absolute inset-0 bg-gradient-mesh opacity-50" />

        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Technology Made{" "}
              <span className="text-gradient">Simple</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              TechTrendi exists to simplify technology for everyday people. In a world flooded with AI tools, cybersecurity threats, and confusing tech trends, we deliver expert-quality guides, tools, and insights anyone can understand.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-16 bg-card border-y border-border">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                  {statsInView ? (
                    <AnimatedCounter end={stat.value} duration={2000} suffix={stat.suffix} />
                  ) : (
                    <span>0{stat.suffix}</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Story Section */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
                About TechTrendi
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                The TechTrendi Story
              </h2>
            </div>

            <div className="space-y-8">
              {/* Problem */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <span className="text-2xl">🤔</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Too much noise, not enough clarity</h3>
                  <p className="text-muted-foreground">
                    Tech media is full of clickbait, flimsy content, and paid promotions. Security advice is often too technical. AI tools are emerging faster than anyone can evaluate. Reviews are riddled with bias, and genuine expertise is hard to find.
                  </p>
                </div>
              </div>

              {/* Solution */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">A growing platform people trust</h3>
                  <p className="text-muted-foreground">
                    We created TechTrendi with one goal: break down AI, cybersecurity, productivity, and the digital economy into clear, actionable content anyone can understand and apply on day one — without the jargon or the pitch.
                  </p>
                </div>
              </div>

              {/* Mission */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">A growing platform people trust</h3>
                  <p className="text-muted-foreground">
                    With 50+ curated guides, 80+ free tools, and daily tech news — all backed by AI-assisted research — we're helping thousands make smarter technology decisions every day.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Expertise Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Your Tech, Our Expertise
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From daily breaking news to deep-dive guides — we cover the topics that matter most.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {expertise.map((item) => (
              <div
                key={item.title}
                className="p-6 bg-card rounded-2xl border border-border hover:shadow-card hover:border-primary/20 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Banner */}
      <section className="py-20">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-secondary to-accent p-8 md:p-12">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
            </div>

            <div className="relative z-10 max-w-3xl">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                We believe everyone deserves access to{" "}
                <span className="text-white/90 underline decoration-white/30 underline-offset-4">
                  clear, honest, and actionable
                </span>{" "}
                technology advice.
              </h2>
              <p className="text-white/80 text-lg">
                Whether you're choosing your next smartphone, protecting your passwords, or figuring out how to earn online — we're here to cut through the noise and give you what actually works.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
              Our Principles
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Our Values
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="p-6 bg-card rounded-2xl border border-border text-center"
              >
                <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${value.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <value.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to explore?
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Dive into our guides, check out the latest news, or try our free tools. Your smarter tech journey starts now.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="btn-premium rounded-xl text-white px-8">
                <Link to="/start-here">
                  Start Here
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-xl px-8">
                <Link to="/news">Latest News</Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="rounded-xl px-8">
                <Link to="/tools">Free Tools</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
