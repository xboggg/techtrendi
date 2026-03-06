import { Layout } from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";
import { Shield, Mail } from "lucide-react";

export default function Privacy() {
  const lastUpdated = "January 9, 2026";

  return (
    <Layout>
      <Helmet>
        <title>Privacy Policy | TechTrendi</title>
        <meta name="description" content="TechTrendi's Privacy Policy explains how we collect, use, and protect your personal information when you use our website and services." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://techtrendi.com/privacy" />
      </Helmet>

      <div className="bg-gradient-hero py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>
        </div>
      </div>

      <div className="container py-12">
        <div className="max-w-3xl mx-auto prose prose-lg dark:prose-invert">
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Introduction</h2>
            <p className="text-muted-foreground mb-4">
              TechTrendi ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website techtrendi.com, including any other media form, media channel, mobile website, or mobile application related or connected thereto.
            </p>
            <p className="text-muted-foreground">
              Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Information We Collect</h2>

            <h3 className="text-xl font-semibold text-foreground mb-3">Personal Data</h3>
            <p className="text-muted-foreground mb-4">
              We may collect personally identifiable information that you voluntarily provide to us when you:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>Register for an account</li>
              <li>Subscribe to our newsletter</li>
              <li>Fill out a contact form</li>
              <li>Purchase a premium subscription</li>
              <li>Participate in forums or comment sections</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              This information may include:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
              <li>Name and email address</li>
              <li>Username and password</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Profile information and preferences</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3">Automatically Collected Data</h3>
            <p className="text-muted-foreground mb-4">
              When you visit our website, we automatically collect certain information about your device, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>IP address and browser type</li>
              <li>Operating system</li>
              <li>Access times and pages viewed</li>
              <li>Referring website addresses</li>
              <li>Device identifiers</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send promotional communications (with your consent)</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>Detect, prevent, and address technical issues</li>
              <li>Personalize your experience and deliver relevant content</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Advertising and Analytics</h2>
            <p className="text-muted-foreground mb-4">
              We may use third-party advertising companies to serve ads when you visit our website. These companies may use information about your visits to this and other websites to provide advertisements about goods and services of interest to you.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3">Google AdSense</h3>
            <p className="text-muted-foreground mb-4">
              We use Google AdSense to display advertisements. Google, as a third-party vendor, uses cookies to serve ads on our site. Google's use of the DART cookie enables it to serve ads based on your visit to our site and other sites on the Internet. You may opt out of the use of the DART cookie by visiting the Google Ad and Content Network privacy policy at{" "}
              <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                https://policies.google.com/technologies/ads
              </a>
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3">Google Analytics</h3>
            <p className="text-muted-foreground">
              We use Google Analytics to analyze the use of our website. Google Analytics gathers information about website use by means of cookies. The information gathered is used to create reports about the use of our website. You can opt out of Google Analytics by installing the Google Analytics opt-out browser add-on.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Affiliate Disclosures</h2>
            <p className="text-muted-foreground mb-4">
              TechTrendi participates in affiliate marketing programs, which means we may earn commissions on products purchased through our links to retailer sites. This does not affect the price you pay or our editorial independence.
            </p>
            <p className="text-muted-foreground">
              Our affiliate partners include but are not limited to Amazon Associates, VPN providers, software companies, and technology retailers. For more details, see our{" "}
              <a href="/disclosure" className="text-primary hover:underline">Advertising Disclosure</a>.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Cookies and Tracking Technologies</h2>
            <p className="text-muted-foreground mb-4">
              We use cookies and similar tracking technologies to track activity on our website and hold certain information. For detailed information about the cookies we use and your choices regarding cookies, please see our{" "}
              <a href="/cookies" className="text-primary hover:underline">Cookie Policy</a>.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Data Sharing and Disclosure</h2>
            <p className="text-muted-foreground mb-4">
              We may share your information in the following situations:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Service Providers:</strong> With third parties that perform services for us (payment processing, email delivery, analytics)</li>
              <li><strong>Legal Requirements:</strong> If required by law or in response to valid requests by public authorities</li>
              <li><strong>Business Transfers:</strong> In connection with any merger, sale, or acquisition of our business</li>
              <li><strong>With Your Consent:</strong> In any other case with your explicit consent</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Data Security</h2>
            <p className="text-muted-foreground">
              We use administrative, technical, and physical security measures to protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that no security measures are perfect or impenetrable. We cannot guarantee that information about you will not be accessed, disclosed, altered, or destroyed.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Your Rights</h2>
            <p className="text-muted-foreground mb-4">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Access:</strong> Request access to your personal data</li>
              <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
              <li><strong>Erasure:</strong> Request deletion of your personal data</li>
              <li><strong>Portability:</strong> Request transfer of your data</li>
              <li><strong>Opt-out:</strong> Opt out of marketing communications</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              To exercise these rights, please contact us at privacy@techtrendi.com.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Children's Privacy</h2>
            <p className="text-muted-foreground">
              Our website is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us so we can delete such information.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">International Data Transfers</h2>
            <p className="text-muted-foreground">
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that are different from the laws of your country. By using our website, you consent to the transfer of information to countries outside your country of residence.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have questions or comments about this Privacy Policy, please contact us:
            </p>
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="text-foreground font-semibold mb-2">TechTrendi</p>
              <a href="mailto:privacy@techtrendi.com" className="text-muted-foreground hover:text-primary flex items-center gap-2">
                <Mail className="w-4 h-4" />
                privacy@techtrendi.com
              </a>
              <p className="text-muted-foreground mt-2">
                You can also reach us through our{" "}
                <a href="/contact" className="text-primary hover:underline">Contact Page</a>.
              </p>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
