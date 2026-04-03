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
  { label: "Articles Published", value: 90, suffix: "+", icon: Newspaper, bg: "bg-blue-500" },
  { label: "Free Tools", value: 80, suffix: "+", icon: Zap, bg: "bg-purple-500" },
  { label: "Topics Covered", value: 12, suffix: "", icon: Users, bg: "bg-orange-500" },
  { label: "Years Online", value: 10, suffix: "", icon: Heart, bg: "bg-green-500" },
];

const expertise = [
  {
    icon: Brain,
    title: "Artificial Intelligence",
    description: "I test and review AI tools so you don't have to waste time on the ones that don't deliver.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Shield,
    title: "Cybersecurity",
    description: "Passwords, VPNs, phishing scams — I break down what you actually need to do to stay safe online.",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    icon: Zap,
    title: "Productivity",
    description: "Apps and workflows that genuinely save time — not the kind that add more complexity to your day.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: Building2,
    title: "Digital Economy",
    description: "Real side hustle ideas, remote work tips, and ways to make money with tech — things I've tried or thoroughly researched.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    icon: Smartphone,
    title: "Smartphones & Gadgets",
    description: "Honest phone comparisons, spec breakdowns, and 'should I upgrade?' advice from someone who actually cares about the details.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Newspaper,
    title: "Daily Tech News",
    description: "The tech stories that actually matter, published daily. No clickbait headlines, just what's worth knowing.",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
];

const values = [
  {
    icon: Target,
    title: "Accuracy First",
    description: "I double-check specs, prices, and claims before hitting publish. If I get something wrong, I fix it.",
    color: "bg-blue-500",
  },
  {
    icon: Users,
    title: "Written for Real People",
    description: "I write the way I talk. If my mom can't understand it, it's not ready to publish.",
    color: "bg-purple-500",
  },
  {
    icon: Award,
    title: "Honest Recommendations",
    description: "Nobody pays me to recommend anything. If I suggest a tool or product, it's because I've used it myself.",
    color: "bg-orange-500",
  },
  {
    icon: Heart,
    title: "Free by Default",
    description: "Everything on this site — articles, tools, guides — is free. That's not changing.",
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
              I started TechTrendi because I was tired of tech content that either talked down to people or drowned them in jargon. This site is my way of sharing what I actually know and use — no fluff, no sponsored opinions.
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
                  <h3 className="text-lg font-semibold text-foreground mb-2">The problem I kept running into</h3>
                  <p className="text-muted-foreground">
                    Every time I wanted a straight answer about a phone, a security tool, or an AI app, I'd end up on sites full of ads and vague recommendations. Half the "reviews" were just rewritten press releases. I figured if I'm already doing the research for myself, why not share it properly?
                  </p>
                </div>
              </div>

              {/* Solution */}
              <div className="flex gap-4 p-6 bg-card rounded-2xl border border-border">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">So I built TechTrendi</h3>
                  <p className="text-muted-foreground">
                    The domain has been around since 2016, but I really got serious about it in 2025. I write about the things I actually care about — phones, cybersecurity, productivity apps, side hustles, AI tools — and I try to explain them the way I'd explain them to a friend.
                  </p>
                </div>
              </div>

              {/* Growth */}
              <div className="flex gap-4 p-6 bg-card rounded-2xl border border-border">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Where things are now</h3>
                  <p className="text-muted-foreground">
                    TechTrendi now has over 90 articles, 80+ free tools (from password generators to invoice creators), and a growing collection of guides and news. I publish new content regularly and I'm always building new tools that I think people will actually find useful.
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
              What I Write About
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These are the topics I keep coming back to — the stuff I'm genuinely interested in and know well.
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
                Tech shouldn't be{" "}
                <span className="text-yellow-300">
                  confusing
                </span>{" "}
                — and good advice shouldn't cost you anything.
              </h2>
              <p className="text-white/80 text-lg">
                Whether you're picking your next phone, setting up a VPN, trying out an AI tool, or looking for a legit side hustle — I've probably written about it. And if I haven't, let me know.
              </p>
              <p className="text-white/60 text-sm mt-4">
                I run this site because I genuinely enjoy helping people make sense of technology. That's it.
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
              Have a look around — read some articles, try out a tool, or check the latest tech news. Hope you find something useful.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-xl px-8 shadow-lg">
                <Link to="/blog">
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
