import { Layout } from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";
import { Cookie, Mail, Settings, BarChart3, Target, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  advertising: boolean;
  functional: boolean;
}

export default function Cookies() {
  const lastUpdated = "January 9, 2026";
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: true,
    advertising: true,
    functional: true,
  });

  const handleSavePreferences = () => {
    localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
    // In production, would also update consent management platform
    alert('Your cookie preferences have been saved.');
  };

  return (
    <Layout>
      <Helmet>
        <title>Cookie Policy | TechTrendi</title>
        <meta name="description" content="Learn about how TechTrendi uses cookies and similar tracking technologies on our website, and how you can manage your preferences." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://techtrendi.com/cookies" />
      </Helmet>

      <div className="bg-gradient-hero py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6">
              <Cookie className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">Cookie Policy</h1>
            <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>
        </div>
      </div>

      <div className="container py-12">
        <div className="max-w-3xl mx-auto">
          {/* Cookie Preferences Panel */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-12">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Manage Cookie Preferences
            </h2>
            <p className="text-muted-foreground mb-6">
              You can customize your cookie preferences below. Essential cookies cannot be disabled as they are necessary for the website to function.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Essential Cookies</p>
                    <p className="text-sm text-muted-foreground">Required for basic site functionality</p>
                  </div>
                </div>
                <Switch checked={preferences.essential} disabled />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-foreground">Analytics Cookies</p>
                    <p className="text-sm text-muted-foreground">Help us improve our website</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, analytics: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-foreground">Advertising Cookies</p>
                    <p className="text-sm text-muted-foreground">Used for personalized ads</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.advertising}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, advertising: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-medium text-foreground">Functional Cookies</p>
                    <p className="text-sm text-muted-foreground">Enhanced features and preferences</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.functional}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, functional: checked })}
                />
              </div>
            </div>

            <Button onClick={handleSavePreferences} className="mt-6 w-full sm:w-auto">
              Save Preferences
            </Button>
          </div>

          {/* Cookie Policy Content */}
          <div className="prose prose-lg dark:prose-invert">
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">What Are Cookies?</h2>
              <p className="text-muted-foreground mb-4">
                Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the site owners.
              </p>
              <p className="text-muted-foreground">
                Cookies enable websites to remember your preferences, login status, and personalize your experience. They also help website owners understand how visitors interact with their sites.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">How We Use Cookies</h2>
              <p className="text-muted-foreground mb-4">
                TechTrendi uses cookies for several purposes, including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Keeping you signed in to your account</li>
                <li>Remembering your preferences (theme, language, etc.)</li>
                <li>Understanding how you use our website</li>
                <li>Improving our services based on user behavior</li>
                <li>Delivering personalized advertisements</li>
                <li>Measuring the effectiveness of our marketing campaigns</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">Types of Cookies We Use</h2>

              <h3 className="text-xl font-semibold text-foreground mb-3">Essential Cookies</h3>
              <p className="text-muted-foreground mb-4">
                These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you, such as setting your privacy preferences, logging in, or filling in forms.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-foreground">Cookie</th>
                      <th className="text-left py-2 text-foreground">Purpose</th>
                      <th className="text-left py-2 text-foreground">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-2">session_id</td>
                      <td className="py-2">Maintains user session</td>
                      <td className="py-2">Session</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2">auth_token</td>
                      <td className="py-2">Authentication</td>
                      <td className="py-2">7 days</td>
                    </tr>
                    <tr>
                      <td className="py-2">csrf_token</td>
                      <td className="py-2">Security</td>
                      <td className="py-2">Session</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-3">Analytics Cookies</h3>
              <p className="text-muted-foreground mb-4">
                These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us know which pages are the most and least popular and see how visitors move around the site.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-foreground">Cookie</th>
                      <th className="text-left py-2 text-foreground">Provider</th>
                      <th className="text-left py-2 text-foreground">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-2">_ga</td>
                      <td className="py-2">Google Analytics</td>
                      <td className="py-2">2 years</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2">_gid</td>
                      <td className="py-2">Google Analytics</td>
                      <td className="py-2">24 hours</td>
                    </tr>
                    <tr>
                      <td className="py-2">_gat</td>
                      <td className="py-2">Google Analytics</td>
                      <td className="py-2">1 minute</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-3">Advertising Cookies</h3>
              <p className="text-muted-foreground mb-4">
                These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-foreground">Cookie</th>
                      <th className="text-left py-2 text-foreground">Provider</th>
                      <th className="text-left py-2 text-foreground">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-2">__gads</td>
                      <td className="py-2">Google AdSense</td>
                      <td className="py-2">Ad personalization</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2">IDE</td>
                      <td className="py-2">Google DoubleClick</td>
                      <td className="py-2">Ad targeting</td>
                    </tr>
                    <tr>
                      <td className="py-2">NID</td>
                      <td className="py-2">Google</td>
                      <td className="py-2">Ad preferences</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-3">Functional Cookies</h3>
              <p className="text-muted-foreground mb-4">
                These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third party providers whose services we have added to our pages.
              </p>
              <div className="bg-muted/50 rounded-lg p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-foreground">Cookie</th>
                      <th className="text-left py-2 text-foreground">Purpose</th>
                      <th className="text-left py-2 text-foreground">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-2">theme</td>
                      <td className="py-2">Stores dark/light mode preference</td>
                      <td className="py-2">1 year</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2">language</td>
                      <td className="py-2">Stores language preference</td>
                      <td className="py-2">1 year</td>
                    </tr>
                    <tr>
                      <td className="py-2">font_size</td>
                      <td className="py-2">Accessibility settings</td>
                      <td className="py-2">1 year</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">Third-Party Cookies</h2>
              <p className="text-muted-foreground mb-4">
                In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the Service and deliver advertisements on and through the Service.
              </p>
              <p className="text-muted-foreground">
                Our third-party partners include:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mt-4 space-y-2">
                <li><strong>Google:</strong> Analytics, AdSense, and DoubleClick for advertising</li>
                <li><strong>Stripe:</strong> Secure payment processing</li>
                <li><strong>Supabase:</strong> Authentication and database services</li>
                <li><strong>Social Media Platforms:</strong> Share buttons and embedded content</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">Managing Cookies</h2>
              <p className="text-muted-foreground mb-4">
                You can control and manage cookies in several ways:
              </p>

              <h3 className="text-xl font-semibold text-foreground mb-3">Browser Settings</h3>
              <p className="text-muted-foreground mb-4">
                Most browsers allow you to refuse to accept cookies and to delete cookies. The methods for doing so vary from browser to browser:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Chrome</a></li>
                <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Firefox</a></li>
                <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Safari</a></li>
                <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Edge</a></li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">Opt-Out Links</h3>
              <p className="text-muted-foreground mb-4">
                You can opt out of specific third-party cookies:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Analytics Opt-out</a></li>
                <li><a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Ad Settings</a></li>
                <li><a href="https://optout.networkadvertising.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Network Advertising Initiative Opt-out</a></li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">Updates to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Cookie Policy from time to time in order to reflect changes to the cookies we use or for other operational, legal, or regulatory reasons. Please revisit this Cookie Policy regularly to stay informed about our use of cookies.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions about our use of cookies, please contact us:
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
      </div>
    </Layout>
  );
}
