import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";
import { Link } from "react-router-dom";
import { Mail, Rss, Bell, ArrowRight } from "lucide-react";

export default function NewsletterArchive() {
  return (
    <Layout>
      <SEOHead
        title="Africa Tech Brief — Ghana's Weekly Tech Newsletter"
        description="Join thousands of Ghanaians and Africans who read the Africa Tech Brief every week. Top tech stories, scam alerts, free tools, and Ghana-specific insights — free every Friday."
        canonical="/newsletter"
        keywords={["Ghana tech newsletter", "Africa tech brief", "weekly tech news Ghana", "tech newsletter Africa", "Ghana cybersecurity newsletter"]}
      />

      <div className="container max-w-3xl mx-auto px-4 py-16 md:py-24">

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-4">
            Free Every Friday
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Africa Tech Brief
          </h1>
          <p className="text-sm font-medium text-muted-foreground mb-2">by TechTrendi</p>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            The weekly newsletter for Ghanaians and Africans who want to stay ahead of technology — without wading through content made for someone else. Top stories, scam alerts, free tools, and one thing worth knowing every week.
          </p>
        </div>

        {/* Subscribe form */}
        <div className="mb-16">
          <NewsletterForm variant="default" />
        </div>

        {/* What you get */}
        <div className="mb-16">
          <h2 className="text-xl font-bold text-foreground mb-6 text-center">What subscribers receive</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: Rss,
                title: "🌍 Top 5 Africa Tech Stories",
                desc: "The week's most important Ghana and Africa tech news — curated, summarised, and explained clearly.",
                color: "bg-blue-500/10 text-blue-500",
              },
              {
                icon: Bell,
                title: "🚨 Ghana Scam Alert",
                desc: "Active scams targeting Ghanaians right now — MoMo fraud, fake job offers, phishing, and investment cons.",
                color: "bg-red-500/10 text-red-500",
              },
              {
                icon: ArrowRight,
                title: "🔧 Free Tool of the Week",
                desc: "One free tool that saves you time or money — handpicked from the 130+ tools on TechTrendi.",
                color: "bg-green-500/10 text-green-500",
              },
            ].map((item) => (
              <div key={item.title} className="p-5 bg-card border border-border rounded-xl">
                <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center mb-3`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stay up to date links */}
        <div className="bg-muted/30 border border-border rounded-2xl p-6 text-center">
          <h3 className="font-semibold text-foreground mb-3">Other ways to stay updated</h3>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/news" className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full text-sm hover:border-primary hover:text-primary transition-all">
              <Rss className="w-3.5 h-3.5" /> Latest News
            </Link>
            <Link to="/blog" className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full text-sm hover:border-primary hover:text-primary transition-all">
              <Mail className="w-3.5 h-3.5" /> Blog Articles
            </Link>
            <a href="https://whatsapp.com/channel/0029VbCB3R6H5JLt1aJYIT2d" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full text-sm hover:border-primary hover:text-primary transition-all">
              WhatsApp Channel
            </a>
          </div>
        </div>

      </div>
    </Layout>
  );
}
