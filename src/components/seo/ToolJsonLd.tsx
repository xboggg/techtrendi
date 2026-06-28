import { useEffect } from "react";
import { Tool } from "@/data/tools";

interface ToolJsonLdProps {
  tool: Tool;
}

export function ToolJsonLd({ tool }: ToolJsonLdProps) {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "tool-jsonld";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: tool.title,
      description: tool.description,
      url: `https://techtrendi.com${tool.href}`,
      applicationCategory: "WebApplication",
      operatingSystem: "Any",
      isAccessibleForFree: true,
      author: {
        "@type": "Organization",
        name: "TechTrendi",
        url: "https://techtrendi.com",
      },
    });

    // Remove existing one first
    const existing = document.getElementById("tool-jsonld");
    if (existing) existing.remove();

    document.head.appendChild(script);

    return () => {
      const el = document.getElementById("tool-jsonld");
      if (el) el.remove();
    };
  }, [tool]);

  return null;
}
