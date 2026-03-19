import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { URLParser as URLParserComponent } from "@/components/tools/URLParser";
import { Link2 } from "lucide-react";

export default function URLParserPage() {
  return (
    <Layout>
      <SEOHead
        title="URL Parser"
        description="Break down any URL into its parts — protocol, domain, path, query params, and more. Handy for debugging and dev work."
        canonical="/tools/url-parser"
        keywords={["url parser", "url analyzer", "query string parser", "url decoder", "url breakdown"]}
      />
      <div className="container py-12 md:py-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6">
              <Link2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              URL Parser
            </h1>
            <p className="text-muted-foreground text-lg">
              Parse and analyze URLs to extract all components and parameters.
            </p>
          </div>

          <URLParserComponent />

          <div className="mt-10 p-6 rounded-2xl bg-muted/50">
            <h3 className="font-semibold text-foreground mb-4">URL Anatomy</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <strong>Protocol:</strong> http, https, ftp - defines how data is transferred
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <strong>Hostname:</strong> The domain name or IP address of the server
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <strong>Path:</strong> Location of the resource on the server
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <strong>Query Parameters:</strong> Key-value pairs for passing data
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
