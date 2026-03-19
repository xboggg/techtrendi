import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle, Lightbulb, ListChecks, Info } from "lucide-react";
import { toolContentData, type ToolContent } from "@/data/toolContent";

interface ToolContentSectionProps {
  toolId: string;
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="font-medium text-foreground pr-4">{question}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 text-muted-foreground text-sm leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

export function ToolContentSection({ toolId }: ToolContentSectionProps) {
  const content: ToolContent | undefined = toolContentData[toolId];
  if (!content) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 pb-12 mt-8 space-y-10">
      {/* About this tool */}
      {content.intro && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">About This Tool</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">{content.intro}</p>
        </section>
      )}

      {/* How to use */}
      {content.howTo && content.howTo.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">How to Use</h2>
          </div>
          <ol className="space-y-3">
            {content.howTo.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-muted-foreground leading-relaxed pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Why you need it */}
      {content.whyNeedIt && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Why Use This?</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">{content.whyNeedIt}</p>
        </section>
      )}

      {/* FAQ */}
      {content.faqs && content.faqs.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-2">
            {content.faqs.map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
