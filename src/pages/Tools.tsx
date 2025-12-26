import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Shield, QrCode, Image, ArrowRight, Smartphone, FileText, Lock } from "lucide-react";

const tools = [
  {
    icon: Shield,
    title: "Password Generator",
    description: "Create strong, secure passwords with customizable options including length, symbols, and character types.",
    href: "/tools/password-generator",
    category: "Security",
  },
  {
    icon: QrCode,
    title: "QR Code Generator",
    description: "Generate QR codes for URLs, text, or any data. Download in multiple sizes for print or digital use.",
    href: "/tools/qr-generator",
    category: "Utility",
  },
  {
    icon: Image,
    title: "Image Compressor",
    description: "Compress images without losing quality. Perfect for websites, emails, and social media.",
    href: "/tools/image-compressor",
    category: "Media",
  },
  {
    icon: Smartphone,
    title: "Phone Comparison",
    description: "Compare smartphone specifications side by side. Make informed decisions on your next device.",
    href: "/tools/phone-comparison",
    category: "Comparison",
  },
  {
    icon: FileText,
    title: "Should I Upgrade?",
    description: "AI-powered calculator to determine if upgrading your device is worth it based on your usage.",
    href: "/tools/upgrade-calculator",
    category: "AI Tools",
  },
  {
    icon: Lock,
    title: "Password Strength Checker",
    description: "Check how strong your existing passwords are and get suggestions for improvement.",
    href: "/tools/password-checker",
    category: "Security",
  },
];

export default function Tools() {
  return (
    <Layout>
      <div className="container py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Free AI-Powered Tools
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Powerful utilities to boost your productivity, keep you secure, and make tech decisions easier.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.title}
              to={tool.href}
              className="group bg-card rounded-2xl border border-border shadow-card p-6 transition-all duration-300 hover:shadow-elevated hover:border-primary/20"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <tool.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                  {tool.category}
                </span>
              </div>
              
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {tool.title}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                {tool.description}
              </p>

              <span className="inline-flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                Use Tool
                <ArrowRight className="w-4 h-4 ml-1" />
              </span>
            </Link>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center p-8 rounded-2xl bg-gradient-primary">
          <h2 className="text-2xl font-bold text-primary-foreground mb-4">
            Need More Features?
          </h2>
          <p className="text-primary-foreground/80 mb-6 max-w-lg mx-auto">
            Upgrade to Premium for unlimited access to all tools, ad-free experience, and exclusive features.
          </p>
          <Link
            to="/premium"
            className="inline-flex items-center px-6 py-3 bg-background text-foreground font-semibold rounded-xl hover:bg-background/90 transition-colors"
          >
            Get Premium Access
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </Layout>
  );
}
