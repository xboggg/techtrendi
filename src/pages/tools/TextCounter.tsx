import { Layout } from "@/components/layout/Layout";
import { TextCounter as TextCounterComponent } from "@/components/tools/TextCounter";
import { AlignJustify } from "lucide-react";

export default function TextCounterPage() {
  return (
    <Layout>
      <div className="container py-12 md:py-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6">
              <AlignJustify className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Text Counter
            </h1>
            <p className="text-muted-foreground text-lg">
              Count characters, words, sentences, and estimate reading time.
            </p>
          </div>

          <TextCounterComponent />

          <div className="mt-10 p-6 rounded-2xl bg-muted/50">
            <h3 className="font-semibold text-foreground mb-4">Writing Guidelines</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Twitter posts: Maximum 280 characters
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Meta descriptions: 150-160 characters for SEO
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Blog posts: 1,500-2,500 words for comprehensive content
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Average reading speed: 200-250 words per minute
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
