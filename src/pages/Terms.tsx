import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { FileText, Mail } from "lucide-react";

export default function Terms() {
  const lastUpdated = "January 9, 2026";

  return (
    <Layout>
      <SEOHead
        title="Terms of Service"
        description="Terms and conditions for using TechTrendi. Read our terms of service."
        canonical="/terms"
      />

      <div className="bg-gradient-hero py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>
        </div>
      </div>

      <div className="container py-12">
        <div className="max-w-3xl mx-auto prose prose-lg dark:prose-invert">
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Agreement to Terms</h2>
            <p className="text-muted-foreground mb-4">
              Welcome to TechTrendi. These Terms of Service ("Terms") govern your use of our website located at techtrendi.com (the "Service") operated by TechTrendi ("us," "we," or "our").
            </p>
            <p className="text-muted-foreground mb-4">
              By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
            </p>
            <p className="text-muted-foreground">
              Our Privacy Policy also governs your use of our Service and explains how we collect, safeguard, and disclose information that results from your use of our web pages. Please read it at{" "}
              <a href="/privacy" className="text-primary hover:underline">techtrendi.com/privacy</a>.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Use License</h2>
            <p className="text-muted-foreground mb-4">
              Permission is granted to temporarily access the materials (information or software) on TechTrendi's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to decompile or reverse engineer any software contained on our website</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              This license shall automatically terminate if you violate any of these restrictions and may be terminated by TechTrendi at any time.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">User Accounts</h2>
            <p className="text-muted-foreground mb-4">
              When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
            </p>
            <p className="text-muted-foreground mb-4">
              You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party.
            </p>
            <p className="text-muted-foreground">
              You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Premium Subscriptions</h2>
            <p className="text-muted-foreground mb-4">
              Some parts of the Service are billed on a subscription basis ("Subscription(s)"). You will be billed in advance on a recurring and periodic basis ("Billing Cycle"). Billing cycles are set on a monthly basis.
            </p>
            <p className="text-muted-foreground mb-4">
              At the end of each Billing Cycle, your Subscription will automatically renew under the exact same conditions unless you cancel it or TechTrendi cancels it. You may cancel your Subscription renewal through your account settings page.
            </p>
            <p className="text-muted-foreground mb-4">
              A valid payment method, including credit card, is required to process the payment for your Subscription. Payment processing is handled securely by Stripe.
            </p>
            <p className="text-muted-foreground">
              TechTrendi reserves the right to modify subscription fees upon 30 days' notice. Such notice may be provided at any time by posting the changes to the TechTrendi website.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Free Tools and Services</h2>
            <p className="text-muted-foreground mb-4">
              TechTrendi provides various free tools including but not limited to password generators, QR code generators, image compressors, and other utilities. These tools are provided "as is" without warranty of any kind.
            </p>
            <p className="text-muted-foreground">
              We reserve the right to modify, suspend, or discontinue any free tool or service at any time without prior notice.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">User-Generated Content</h2>
            <p className="text-muted-foreground mb-4">
              Our Service may allow you to post, link, store, share, and otherwise make available certain information, text, graphics, or other material ("Content"). You are responsible for the Content that you post on or through the Service.
            </p>
            <p className="text-muted-foreground mb-4">
              By posting Content on or through the Service, you represent and warrant that:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>The Content is yours or you have the right to use it and grant us the rights and license as provided in these Terms</li>
              <li>The posting of your Content does not violate the privacy rights, publicity rights, copyrights, contract rights, or any other rights of any person or entity</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              We reserve the right to remove any Content that violates these Terms or that we deem inappropriate without prior notice.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Prohibited Uses</h2>
            <p className="text-muted-foreground mb-4">
              You may use the Service only for lawful purposes and in accordance with these Terms. You agree not to use the Service:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>In any way that violates any applicable national or international law or regulation</li>
              <li>To transmit any advertising or promotional material, including "junk mail," "chain letters," "spam," or any other similar solicitation</li>
              <li>To impersonate or attempt to impersonate TechTrendi, a TechTrendi employee, another user, or any other person or entity</li>
              <li>To engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Service</li>
              <li>To use any robot, spider, or other automatic device to access the Service for any purpose</li>
              <li>To introduce any viruses, trojan horses, worms, or other material that is malicious or technologically harmful</li>
              <li>To attempt to gain unauthorized access to any portion of the Service</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Intellectual Property</h2>
            <p className="text-muted-foreground mb-4">
              The Service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of TechTrendi and its licensors. The Service is protected by copyright, trademark, and other laws.
            </p>
            <p className="text-muted-foreground">
              Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of TechTrendi.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Affiliate Links and Advertising</h2>
            <p className="text-muted-foreground mb-4">
              TechTrendi may contain links to third-party websites or services that are not owned or controlled by us. These include affiliate links through which we may earn commissions on purchases made.
            </p>
            <p className="text-muted-foreground mb-4">
              We display third-party advertisements through Google AdSense and other advertising networks. These ads may use cookies to track user behavior for advertising purposes.
            </p>
            <p className="text-muted-foreground">
              For more information about our affiliate relationships and advertising practices, please see our{" "}
              <a href="/disclosure" className="text-primary hover:underline">Advertising Disclosure</a>.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Links to Other Websites</h2>
            <p className="text-muted-foreground mb-4">
              Our Service may contain links to third-party websites or services that are not owned or controlled by TechTrendi.
            </p>
            <p className="text-muted-foreground">
              TechTrendi has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third-party websites or services. You further acknowledge and agree that TechTrendi shall not be responsible or liable for any damage or loss caused by use of any such content, goods, or services.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Disclaimer</h2>
            <p className="text-muted-foreground mb-4">
              THE MATERIALS ON TECHTRENDI'S WEBSITE ARE PROVIDED ON AN "AS IS" BASIS. TECHTRENDI MAKES NO WARRANTIES, EXPRESSED OR IMPLIED, AND HEREBY DISCLAIMS AND NEGATES ALL OTHER WARRANTIES INCLUDING, WITHOUT LIMITATION, IMPLIED WARRANTIES OR CONDITIONS OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT OF INTELLECTUAL PROPERTY OR OTHER VIOLATION OF RIGHTS.
            </p>
            <p className="text-muted-foreground">
              Further, TechTrendi does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its website or otherwise relating to such materials.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Limitation of Liability</h2>
            <p className="text-muted-foreground">
              IN NO EVENT SHALL TECHTRENDI, NOR ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES, BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Indemnification</h2>
            <p className="text-muted-foreground">
              You agree to defend, indemnify, and hold harmless TechTrendi and its licensors, employees, contractors, agents, officers, and directors from and against any and all claims, damages, obligations, losses, liabilities, costs, or debt, and expenses arising from your use of and access to the Service, or your violation of these Terms.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms shall be governed and construed in accordance with the laws applicable in your jurisdiction, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="text-foreground font-semibold mb-2">TechTrendi</p>
              <a href="mailto:legal@techtrendi.com" className="text-muted-foreground hover:text-primary flex items-center gap-2">
                <Mail className="w-4 h-4" />
                legal@techtrendi.com
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
