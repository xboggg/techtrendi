import { Layout } from "@/components/layout/Layout";
import { Users, Target, Award, Heart } from "lucide-react";

const stats = [
  { label: "Monthly Readers", value: "500K+" },
  { label: "Guides Published", value: "200+" },
  { label: "Free Tools", value: "10+" },
  { label: "Years of Experience", value: "5+" },
];

const values = [
  {
    icon: Target,
    title: "Accuracy First",
    description: "We verify every fact and spec before publishing. No guesswork, no assumptions.",
  },
  {
    icon: Users,
    title: "User-Focused",
    description: "Every guide and tool is designed with real user needs in mind.",
  },
  {
    icon: Award,
    title: "Independence",
    description: "Our reviews and recommendations are never influenced by advertisers.",
  },
  {
    icon: Heart,
    title: "Community",
    description: "We build tools that help millions of people make better tech decisions.",
  },
];

export default function About() {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 bg-gradient-hero">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Making Technology{" "}
              <span className="text-gradient">Simple for Everyone</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              TechTrendi is your trusted source for technology guidance. We combine AI-powered insights with expert knowledge to help you navigate the ever-changing world of tech.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-card border-y border-border">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gradient mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6 text-center">
              Our Mission
            </h2>
            <div className="prose prose-lg text-muted-foreground">
              <p className="text-center mb-6">
                We believe everyone deserves access to clear, honest, and actionable technology advice. Whether you're choosing your next smartphone, securing your online accounts, or looking for productivity tools, we're here to help.
              </p>
              <p className="text-center">
                Our team of tech enthusiasts and AI systems work together to create comprehensive guides, unbiased reviews, and practical tools that save you time and help you make informed decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">
            Our Values
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="p-6 bg-card rounded-2xl border border-border"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-primary-foreground" />
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

      {/* Contact CTA */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center p-8 rounded-2xl bg-gradient-primary">
            <h2 className="text-2xl font-bold text-primary-foreground mb-4">
              Have Questions?
            </h2>
            <p className="text-primary-foreground/80 mb-6">
              We'd love to hear from you. Reach out for partnerships, content suggestions, or just to say hello.
            </p>
            <a
              href="mailto:contact@techtrendi.com"
              className="inline-flex items-center px-6 py-3 bg-background text-foreground font-semibold rounded-xl hover:bg-background/90 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
