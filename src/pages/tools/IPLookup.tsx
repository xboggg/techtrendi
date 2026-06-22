import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { IPLookup as IPLookupComponent } from "@/components/tools/IPLookup";
import { ToolContentSection } from "@/components/tools/ToolContentSection";
import { Globe, ShieldAlert } from "lucide-react";

export default function IPLookupPage() {
  return (
    <Layout>
      <SEOHead
        title="IP Address Lookup"
        description="Look up any IP address to find its location, ISP, and other geolocation details. Works with both IPv4 and IPv6."
        canonical="/tools/ip-lookup"
        keywords={["ip lookup", "ip geolocation", "ip address finder", "ip location", "whois lookup"]}
      />
      <div className="container py-12 md:py-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6">
              <Globe className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              IP Address Lookup
            </h1>
            <p className="text-muted-foreground text-lg">
              Get geolocation information for any IP address worldwide.
            </p>
          </div>

          <IPLookupComponent />

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              <strong>Use this responsibly.</strong> IP geolocation shows only an approximate city and ISP — never an exact address or a person's identity. It is meant for checking your own connection, network troubleshooting, and understanding a suspicious IP — not for tracking, profiling, or harassing anyone.
            </p>
          </div>

          <div className="mt-6 p-6 rounded-2xl bg-muted/50">
            <h3 className="font-semibold text-foreground mb-4">About IP Geolocation</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                IP addresses reveal approximate location, not exact addresses
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                VPN users may show different locations than their actual position
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                ISP and organization data helps identify network providers
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                This tool is useful for security analysis and network troubleshooting
              </li>
            </ul>
          </div>
        </div>
      </div>

      <ToolContentSection toolId="ip-lookup" />
    </Layout>
  );
}
