import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Link } from "react-router-dom";
import { AlertCircle, DollarSign, Link2, Shield, FileText, Heart } from "lucide-react";

const affiliatePartners = [
  {
    name: "Amazon Associates",
    category: "E-commerce",
    description: "We may earn commissions from qualifying purchases made through Amazon links.",
  },
  {
    name: "VPN Services",
    category: "Security & Privacy",
    description: "Partnerships with VPN providers like NordVPN, ExpressVPN, and Surfshark.",
  },
  {
    name: "Password Managers",
    category: "Security Tools",
    description: "Affiliate relationships with 1Password, Dashlane, and Bitwarden.",
  },
  {
    name: "Web Hosting",
    category: "Web Services",
    description: "Referral partnerships with hosting providers for website-related content.",
  },
  {
    name: "Software & Apps",
    category: "Productivity",
    description: "Affiliate links to productivity tools and software we recommend.",
  },
];

const disclosurePrinciples = [
  {
    icon: Shield,
    title: "Editorial Independence",
    description: "Our reviews and recommendations are based solely on merit. Affiliate relationships never influence our editorial decisions or product ratings.",
  },
  {
    icon: FileText,
    title: "Honest Reviews",
    description: "We test products ourselves and provide honest assessments. We'll tell you about both pros and cons, regardless of affiliate status.",
  },
  {
    icon: Heart,
    title: "Reader First",
    description: "Your trust is our priority. We only recommend products we believe will genuinely help you, and we clearly disclose when we may earn a commission.",
  },
  {
    icon: DollarSign,
    title: "No Extra Cost",
    description: "Using our affiliate links costs you nothing extra. The price you pay is the same whether you use our link or go directly to the retailer.",
  },
];

export default function Disclosure() {
  return (
    <Layout>
      <SEOHead
        title="Advertising & Affiliate Disclosure"
        description="Learn about how TechTrendi earns revenue through advertising and affiliate partnerships while maintaining editorial independence."
        canonical="/disclosure"
      />

      <div className="py-12 md:py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-6">
                <AlertCircle className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Advertising & Affiliate Disclosure
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Transparency is important to us. Here's how TechTrendi earns revenue while maintaining our commitment to honest, unbiased content.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Last Updated: May 2026
              </p>
            </div>

            {/* FTC Compliance Notice */}
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary" />
                FTC Disclosure Compliance
              </h2>
              <p className="text-muted-foreground">
                In accordance with the Federal Trade Commission's guidelines concerning the use of endorsements and testimonials in advertising (16 CFR Part 255), TechTrendi makes the following disclosures regarding our material connections with advertisers and affiliate partners.
              </p>
            </div>

            {/* AdSense + AI Disclosure */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-6 mb-12">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-600" />
                Advertising & AI Content Notice
              </h2>
              <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
                <p>
                  <strong className="text-foreground">Google AdSense:</strong> TechTrendi participates in Google AdSense, a display advertising programme operated by Google LLC. Google AdSense serves ads on this website based on your browsing behaviour and interests. Revenue from these ads supports the continued operation of TechTrendi and allows us to provide free content, tools, and resources to our readers at no charge. You can opt out of personalised advertising by visiting <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Ad Settings</a>.
                </p>
                <p>
                  <strong className="text-foreground">AI-Assisted Content:</strong> TechTrendi uses artificial intelligence writing tools as part of our editorial workflow to maintain the volume and timeliness of our tech news and article coverage. All AI-assisted content is reviewed, edited, and approved by our editorial team before publication. We do not publish automatically generated content without human oversight. Where AI assistance is used, it serves as a drafting and research tool — not a replacement for editorial judgement.
                </p>
                <p>
                  <strong className="text-foreground">Content Accuracy:</strong> While we make every effort to ensure accuracy, technology information can change rapidly. If you believe any content contains an error, please <Link to="/contact" className="text-primary hover:underline">contact us</Link> and we will review and correct it promptly.
                </p>
              </div>
            </div>

            {/* How We Earn Revenue */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                How TechTrendi Earns Revenue
              </h2>
              <div className="space-y-6">
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-primary" />
                    Affiliate Links
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Some of the links on TechTrendi are affiliate links. This means that if you click on a link and make a purchase, we may receive a small commission at no additional cost to you. These commissions help us maintain the website and continue producing free content.
                  </p>
                  <p className="text-muted-foreground">
                    Affiliate links are typically found in:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                    <li>Product reviews and comparisons</li>
                    <li>Buying guides and recommendations</li>
                    <li>Tool recommendations within our guides</li>
                    <li>"Best of" lists and roundups</li>
                  </ul>
                </div>

                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Display Advertising
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    TechTrendi displays advertisements through Google AdSense and other advertising networks. These ads are served based on:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>The content of the page you're viewing</li>
                    <li>Your browsing history and interests (with your consent)</li>
                    <li>General demographic information</li>
                  </ul>
                  <p className="text-muted-foreground mt-4">
                    You can manage your ad preferences through our <Link to="/cookies" className="text-primary hover:underline">Cookie Settings</Link> or through Google's ad settings.
                  </p>
                </div>

                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Premium Subscriptions
                  </h3>
                  <p className="text-muted-foreground">
                    We offer optional premium subscriptions that provide access to exclusive content, advanced tools, and an ad-free experience. Premium subscriptions are a way to directly support our work while getting additional value.
                  </p>
                </div>
              </div>
            </section>

            {/* Our Principles */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Our Editorial Principles
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {disclosurePrinciples.map((principle) => (
                  <div
                    key={principle.title}
                    className="bg-card rounded-xl border border-border p-6"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4">
                      <principle.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {principle.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {principle.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Affiliate Partners */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Our Affiliate Partners
              </h2>
              <p className="text-muted-foreground mb-6">
                We maintain affiliate relationships with the following types of companies. This list is not exhaustive and may change over time:
              </p>
              <div className="space-y-4">
                {affiliatePartners.map((partner) => (
                  <div
                    key={partner.name}
                    className="bg-card rounded-xl border border-border p-4 flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Link2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {partner.name}
                      </h3>
                      <p className="text-xs text-primary mb-1">{partner.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {partner.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Product Reviews */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                How We Review Products
              </h2>
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Testing:</strong> Whenever possible, we test products ourselves. Our reviews are based on hands-on experience, not just manufacturer specifications.
                  </p>
                  <p>
                    <strong className="text-foreground">Research:</strong> We conduct thorough research, including analyzing user reviews, expert opinions, and technical specifications.
                  </p>
                  <p>
                    <strong className="text-foreground">Updates:</strong> We regularly update our reviews and recommendations to reflect new products, price changes, and updated information.
                  </p>
                  <p>
                    <strong className="text-foreground">Disclosure:</strong> Products we receive for free or at a discount for review purposes are clearly disclosed in the relevant content.
                  </p>
                </div>
              </div>
            </section>

            {/* Amazon Associates Disclosure */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Amazon Associates Disclosure
              </h2>
              <div className="bg-muted/50 rounded-xl p-6">
                <p className="text-muted-foreground">
                  TechTrendi is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com. As an Amazon Associate, we earn from qualifying purchases.
                </p>
              </div>
            </section>

            {/* Contact for Questions */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Questions About Our Disclosures?
              </h2>
              <div className="bg-gradient-primary rounded-2xl p-6 text-center">
                <p className="text-primary-foreground mb-4">
                  If you have questions about our affiliate relationships or advertising practices, we're happy to explain.
                </p>
                <Link
                  to="/contact"
                  className="inline-flex items-center px-6 py-3 bg-background text-foreground font-semibold rounded-xl hover:bg-background/90 transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </section>

            {/* Related Pages */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Related Policies
              </h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <Link
                  to="/privacy"
                  className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 transition-colors"
                >
                  <h3 className="font-semibold text-foreground mb-1">Privacy Policy</h3>
                  <p className="text-sm text-muted-foreground">How we handle your data</p>
                </Link>
                <Link
                  to="/terms"
                  className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 transition-colors"
                >
                  <h3 className="font-semibold text-foreground mb-1">Terms of Service</h3>
                  <p className="text-sm text-muted-foreground">Rules for using our site</p>
                </Link>
                <Link
                  to="/cookies"
                  className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 transition-colors"
                >
                  <h3 className="font-semibold text-foreground mb-1">Cookie Policy</h3>
                  <p className="text-sm text-muted-foreground">How we use cookies</p>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
