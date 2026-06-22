import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { PrivacyChecker as PrivacyCheckerComponent } from "@/components/tools/PrivacyChecker";
import { ToolContentSection } from "@/components/tools/ToolContentSection";
import { Eye } from "lucide-react";

export default function PrivacyCheckerPage() {
  return (
    <Layout>
      <SEOHead
        title="Privacy Checker"
        description="See what your browser reveals about you. Check for trackers, fingerprinting, and privacy leaks in seconds."
        canonical="/tools/privacy-checker"
        keywords={["privacy checker", "browser privacy", "tracking protection", "fingerprinting test", "online privacy"]}
      />
      <div className="container py-12 md:py-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6">
              <Eye className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Privacy Checker
            </h1>
            <p className="text-muted-foreground text-lg">
              Analyze your browser's privacy settings and identify potential vulnerabilities.
            </p>
          </div>

          <PrivacyCheckerComponent />

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/10 p-4">
            <Eye className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              <strong>This checks only your own browser.</strong> It reads what your browser already reveals to the sites you visit — nothing is uploaded to us or stored. Use it to understand and tighten your own privacy.
            </p>
          </div>

          <div className="mt-6 p-6 rounded-2xl bg-muted/50">
            <h3 className="font-semibold text-foreground mb-4">Privacy Best Practices</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Use a VPN to encrypt your internet traffic and hide your IP address
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Install browser extensions like uBlock Origin to block trackers
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Consider using privacy-focused browsers like Firefox or Brave
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Regularly clear cookies and browsing data
              </li>
            </ul>
          </div>
        </div>
      </div>

      <ToolContentSection toolId="privacy-checker" />
    </Layout>
  );
}
