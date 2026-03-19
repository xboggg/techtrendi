import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { SpeedTest as SpeedTestComponent } from "@/components/tools/SpeedTest";
import { Gauge } from "lucide-react";

export default function SpeedTestPage() {
  return (
    <Layout>
      <SEOHead
        title="Internet Speed Test"
        description="Find out how fast your internet really is. Test download speed, upload speed, and latency in under a minute."
        canonical="/tools/speed-test"
        keywords={["speed test", "internet speed test", "bandwidth test", "download speed", "upload speed"]}
      />
      <div className="container py-12 md:py-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6">
              <Gauge className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Internet Speed Test
            </h1>
            <p className="text-muted-foreground text-lg">
              Test your internet connection speed and performance.
            </p>
          </div>

          <SpeedTestComponent />

          <div className="mt-10 p-6 rounded-2xl bg-muted/50">
            <h3 className="font-semibold text-foreground mb-4">Understanding Your Results</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <strong>Download Speed:</strong> How fast data is transferred to your device (streaming, downloads)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <strong>Upload Speed:</strong> How fast you can send data (uploads, video calls)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <strong>Ping/Latency:</strong> Response time for your connection (lower is better for gaming)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Results may vary based on network congestion and server distance
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
