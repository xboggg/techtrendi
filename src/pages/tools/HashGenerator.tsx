import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { HashGenerator as HashGeneratorComponent } from "@/components/tools/HashGenerator";
import { Hash } from "lucide-react";

export default function HashGeneratorPage() {
  return (
    <Layout>
      <SEOHead
        title="Hash Generator"
        description="Generate MD5, SHA-1, SHA-256, and other cryptographic hashes from any text. Useful for verifying file integrity."
        canonical="/tools/hash-generator"
        keywords={["hash generator", "sha256", "md5 hash", "sha1", "cryptographic hash", "checksum"]}
      />
      <div className="container py-12 md:py-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6">
              <Hash className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Hash Generator
            </h1>
            <p className="text-muted-foreground text-lg">
              Generate secure cryptographic hashes using SHA algorithms.
            </p>
          </div>

          <HashGeneratorComponent />

          <div className="mt-10 p-6 rounded-2xl bg-muted/50">
            <h3 className="font-semibold text-foreground mb-4">Understanding Hash Functions</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Hash functions are one-way: you can't reverse a hash to get the original text
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Same input always produces the same hash (deterministic)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Used for password storage, file integrity, and digital signatures
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                SHA-256 is widely used; SHA-1 is deprecated for security purposes
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
