import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { BookOpen, ArrowRight, Clock, User } from "lucide-react";

const categories = [
  {
    title: "Phone Guides",
    description: "Expert reviews and buying guides for smartphones",
    href: "/guides/phones",
    count: 12,
  },
  {
    title: "Productivity Apps",
    description: "The best apps to boost your workflow",
    href: "/guides/productivity",
    count: 8,
  },
  {
    title: "Security Basics",
    description: "Stay safe online with these essential tips",
    href: "/guides/security",
    count: 15,
  },
  {
    title: "How-To Tutorials",
    description: "Step-by-step guides for common tech tasks",
    href: "/guides/tutorials",
    count: 20,
  },
];

const featuredGuides = [
  {
    title: "Best Smartphones of 2025: Complete Buyer's Guide",
    excerpt: "We've tested the top smartphones of 2025 to help you find the perfect device for your needs and budget.",
    category: "Phone Guides",
    author: "Tech Team",
    readTime: "12 min read",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=400&fit=crop",
    href: "/guides/best-smartphones-2025",
  },
  {
    title: "How to Create Unbreakable Passwords in 2025",
    excerpt: "Learn the latest techniques for creating and managing passwords that hackers can't crack.",
    category: "Security",
    author: "Security Expert",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600&h=400&fit=crop",
    href: "/guides/password-security",
  },
  {
    title: "10 Productivity Apps That Will Transform Your Workflow",
    excerpt: "Discover the apps that successful professionals use to stay organized and efficient.",
    category: "Productivity",
    author: "Productivity Coach",
    readTime: "10 min read",
    image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600&h=400&fit=crop",
    href: "/guides/productivity-apps",
  },
  {
    title: "iPhone vs Android: The Ultimate Comparison for 2025",
    excerpt: "A comprehensive breakdown to help you choose between the two major mobile ecosystems.",
    category: "Phone Guides",
    author: "Tech Team",
    readTime: "15 min read",
    image: "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&h=400&fit=crop",
    href: "/guides/iphone-vs-android",
  },
  {
    title: "Complete Guide to Two-Factor Authentication",
    excerpt: "Protect your accounts with 2FA. Learn how to set it up on all your important services.",
    category: "Security",
    author: "Security Expert",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&h=400&fit=crop",
    href: "/guides/two-factor-auth",
  },
  {
    title: "How to Back Up Your Phone the Right Way",
    excerpt: "Never lose your photos, contacts, or data again with our comprehensive backup guide.",
    category: "Tutorials",
    author: "Tech Team",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=400&fit=crop",
    href: "/guides/phone-backup",
  },
];

export default function Guides() {
  return (
    <Layout>
      <div className="container py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tech Guides & Tutorials
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Expert-written guides to help you navigate the world of technology with confidence.
          </p>
        </div>

        {/* Categories */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {categories.map((category) => (
            <Link
              key={category.title}
              to={category.href}
              className="group p-6 bg-card rounded-xl border border-border hover:border-primary/20 hover:shadow-card transition-all"
            >
              <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                {category.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
              <span className="text-xs font-medium text-primary">{category.count} guides</span>
            </Link>
          ))}
        </div>

        {/* Featured Guides */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-8">Featured Guides</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredGuides.map((guide) => (
              <Link
                key={guide.title}
                to={guide.href}
                className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-elevated hover:border-primary/20 transition-all"
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
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {guide.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {guide.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {guide.readTime}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <button className="inline-flex items-center px-6 py-3 border border-border rounded-xl text-foreground font-medium hover:bg-muted transition-colors">
            Load More Guides
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </Layout>
  );
}
