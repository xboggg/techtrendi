import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Link } from "react-router-dom";
import {
  Target, Users, Award, Heart, Sparkles, Shield, Zap,
  TrendingUp, Smartphone, Newspaper, Brain, Building2, ArrowRight, Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useInView } from "react-intersection-observer";

const stats = [
  { label: "Articles Published", value: 57, suffix: "+", icon: Newspaper, bg: "bg-blue-500" },
  { label: "Tools Available", value: 80, suffix: "+", icon: Zap, bg: "bg-purple-500" },
  { label: "Daily Readers", value: 92, suffix: "K+", icon: Users, bg: "bg-orange-500" },
  { label: "User Satisfaction", value: 99, suffix: "%", icon: Heart, bg: "bg-green-500" },
];

const expertise = [
  {
    icon: Brain,
    title: "Artificial Intelligence",
    description: "Deep dives into AI tools, machine learning breakthroughs, and how they're reshaping our digital lives.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Shield,
    title: "Cybersecurity",
    description: "Stay protected with practical security guides, privacy tools, and threat awareness articles.",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    icon: Zap,
    title: "Productivity",
    description: "Unlock your potential with app reviews, workflow tips, and efficiency-boosting guides.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: Building2,
    title: "Digital Economy",
    description: "Navigate the creator economy, side hustles, and remote work trends with actionable insights.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    icon: Smartphone,
    title: "Smartphones & Gadgets",
    description: "Buying guides, in-depth reviews, and comparison tools for your next device.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Newspaper,
    title: "Daily Tech News",
    description: "Stay informed with curated tech news covering AI, crypto, startups, and more.",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
];

const values = [
  {
    icon: Target,
    title: "Accuracy First",
    description: "We verify every fact and spec before publishing. Our reputation depends on it.",
    color: "bg-blue-500",
  },
  {
    icon: Users,
    title: "Built for Real People",
    description: "No jargon, no fluff. Clear language that anyone can understand and apply.",
    color: "bg-purple-500",
  },
  {
    icon: Award,
    title: "Truly Independent",
    description: "Our reviews and recommendations are never influenced by advertisers or sponsors.",
    color: "bg-orange-500",
  },
  {
    icon: Heart,
    title: "Free & Accessible",
    description: "Core content and tools are free forever. Premium is optional, never required.",
    color: "bg-green-500",
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

      {/* Hero Section with Gradient */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        {/* Colorful Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%3E%3Cg%20fill%3D%22%23fff%22%20fill-opacity%3D%22.1%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />

        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Technology Made <span className="text-white/90">Simple</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed mb-8">
              TechTrendi exists to simplify technology for everyday people. In a world flooded with AI tools, cybersecurity threats, and confusing tech trends, we deliver expert-quality guides, tools, and practical insights anyone can understand.
            </p>

            {/* Play Button */}
            <button className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all hover:scale-110">
              <Play className="w-6 h-6 ml-1" fill="currentColor" />
            </button>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-8 -mt-16 relative z-20">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-card border border-border rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow">
                <div className={`w-12 h-12 mx-auto mb-3 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
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
              <div className="flex gap-4 p-6 bg-card rounded-2xl border border-border">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
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
              <div className="flex gap-4 p-6 bg-card rounded-2xl border border-border">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">We created TechTrendi with one goal</h3>
                  <p className="text-muted-foreground">
                    Break down AI, cybersecurity, productivity, and the digital economy into clear, actionable content anyone can understand and apply on day one — without the jargon or the pitch.
                  </p>
                </div>
              </div>

              {/* Growth */}
              <div className="flex gap-4 p-6 bg-card rounded-2xl border border-border">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {expertise.map((item) => (
              <div
                key={item.title}
                className="p-6 bg-card rounded-2xl border border-border hover:shadow-lg hover:border-primary/20 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
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
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 p-8 md:p-12">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%3E%3Cg%20fill%3D%22%23fff%22%20fill-opacity%3D%221%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />

            <div className="relative z-10 max-w-3xl">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                We believe everyone deserves access to{" "}
                <span className="text-yellow-300">
                  clear, honest, and actionable
                </span>{" "}
                technology advice.
              </h2>
              <p className="text-white/80 text-lg">
                Whether you're choosing your next smartphone, protecting your passwords, or figuring out how to earn online — we're here to cut through the noise and give you what actually works.
              </p>
              <p className="text-white/60 text-sm mt-4">
                No clickbait. No fluff. No paid opinions — just content that helps you make better decisions about the technology in your life.
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

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {values.map((value) => (
              <div
                key={value.title}
                className="p-6 bg-card rounded-2xl border border-border text-center hover:shadow-lg transition-shadow"
              >
                <div className={`w-14 h-14 mx-auto rounded-xl ${value.color} flex items-center justify-center mb-4 shadow-lg`}>
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
          <div className="max-w-3xl mx-auto text-center bg-card border border-border rounded-3xl p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to explore?
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Dive into our guides, check out the latest news, or try our free tools. Your smarter tech journey starts now.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-xl px-8 shadow-lg">
                <Link to="/guides">
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
