import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Copy, Check, Download, Bold, Italic, Strikethrough,
  List, ListOrdered, Link2, Image, Code, Quote, Minus, Eye, Edit
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const sampleMarkdown = `# Welcome to Markdown Editor

This is a **live preview** markdown editor. You can write markdown on the left and see the rendered output on the right.

## Features

- **Bold** and *italic* text
- ~~Strikethrough~~ text
- [Links](https://techtrendi.com)
- Images and more!

### Code Blocks

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

### Lists

1. First item
2. Second item
3. Third item

- Unordered item
- Another item

### Blockquote

> This is a blockquote. It's great for highlighting important text.

### Table

| Feature | Status |
|---------|--------|
| Bold | ✅ |
| Italic | ✅ |
| Links | ✅ |

---

Happy writing!
`;

export default function MarkdownEditor() {
  const [markdown, setMarkdown] = useState(sampleMarkdown);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"split" | "edit" | "preview">("split");

  const insertText = (before: string, after: string = "", placeholder: string = "") => {
    const textarea = document.getElementById("markdown-input") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdown.substring(start, end) || placeholder;

    const newText =
      markdown.substring(0, start) +
      before +
      selectedText +
      after +
      markdown.substring(end);

    setMarkdown(newText);

    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + before.length + selectedText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const toolbarButtons = [
    { icon: Bold, action: () => insertText("**", "**", "bold"), title: "Bold" },
    { icon: Italic, action: () => insertText("*", "*", "italic"), title: "Italic" },
    { icon: Strikethrough, action: () => insertText("~~", "~~", "strikethrough"), title: "Strikethrough" },
    { icon: Code, action: () => insertText("`", "`", "code"), title: "Inline Code" },
    { icon: Link2, action: () => insertText("[", "](url)", "link text"), title: "Link" },
    { icon: Image, action: () => insertText("![alt](", ")", "image-url"), title: "Image" },
    { icon: Quote, action: () => insertText("\n> ", "", "quote"), title: "Blockquote" },
    { icon: List, action: () => insertText("\n- ", "", "list item"), title: "Bullet List" },
    { icon: ListOrdered, action: () => insertText("\n1. ", "", "list item"), title: "Numbered List" },
    { icon: Minus, action: () => insertText("\n---\n", ""), title: "Horizontal Rule" },
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    toast.success("Markdown copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.md";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Markdown downloaded!");
  };

  const downloadHTML = () => {
    const html = parseMarkdown(markdown);
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Markdown Document</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    pre { background: #f4f4f4; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 3px; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 1rem; color: #666; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
    th { background: #f4f4f4; }
    hr { border: none; border-top: 1px solid #ddd; margin: 2rem 0; }
  </style>
</head>
<body>
${html}
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.html";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("HTML downloaded!");
  };

  // Simple markdown parser
  const parseMarkdown = (md: string): string => {
    let html = md;

    // Escape HTML
    html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Code blocks (before other replacements)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');

    // Headers
    html = html.replace(/^######\s+(.*)$/gm, "<h6>$1</h6>");
    html = html.replace(/^#####\s+(.*)$/gm, "<h5>$1</h5>");
    html = html.replace(/^####\s+(.*)$/gm, "<h4>$1</h4>");
    html = html.replace(/^###\s+(.*)$/gm, "<h3>$1</h3>");
    html = html.replace(/^##\s+(.*)$/gm, "<h2>$1</h2>");
    html = html.replace(/^#\s+(.*)$/gm, "<h1>$1</h1>");

    // Bold and italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>");
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Strikethrough
    html = html.replace(/~~(.*?)~~/g, "<del>$1</del>");

    // Inline code
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%;">');

    // Blockquotes
    html = html.replace(/^&gt;\s+(.*)$/gm, "<blockquote>$1</blockquote>");

    // Horizontal rule
    html = html.replace(/^---$/gm, "<hr>");

    // Tables
    html = html.replace(/^\|(.+)\|$/gm, (match, content) => {
      const cells = content.split("|").map((c: string) => c.trim());
      const isHeader = cells.every((c: string) => /^-+$/.test(c));
      if (isHeader) return "";
      const cellTag = "td";
      return "<tr>" + cells.map((c: string) => `<${cellTag}>${c}</${cellTag}>`).join("") + "</tr>";
    });
    html = html.replace(/(<tr>.*<\/tr>\n?)+/g, "<table>$&</table>");

    // Unordered lists
    html = html.replace(/^-\s+(.*)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");

    // Ordered lists
    html = html.replace(/^\d+\.\s+(.*)$/gm, "<li>$1</li>");

    // Paragraphs
    html = html.replace(/\n\n/g, "</p><p>");
    html = "<p>" + html + "</p>";
    html = html.replace(/<p><\/p>/g, "");
    html = html.replace(/<p>(<h[1-6]>)/g, "$1");
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, "$1");
    html = html.replace(/<p>(<ul>)/g, "$1");
    html = html.replace(/(<\/ul>)<\/p>/g, "$1");
    html = html.replace(/<p>(<pre>)/g, "$1");
    html = html.replace(/(<\/pre>)<\/p>/g, "$1");
    html = html.replace(/<p>(<blockquote>)/g, "$1");
    html = html.replace(/(<\/blockquote>)<\/p>/g, "$1");
    html = html.replace(/<p>(<hr>)<\/p>/g, "$1");
    html = html.replace(/<p>(<table>)/g, "$1");
    html = html.replace(/(<\/table>)<\/p>/g, "$1");

    return html;
  };

  return (
    <Layout>
      <SEOHead
        title="Markdown Editor - Live Preview Editor | TechTrendi"
        description="Write and preview markdown in real-time. Free online markdown editor with live preview, toolbar, and export options."
        canonicalUrl="https://techtrendi.com/tools/markdown-editor"
      />

      <div className="container py-12 md:py-20 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Badge className="mb-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Free Tool
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Markdown <span className="text-primary">Editor</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Write markdown with live preview
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={downloadMarkdown}>
              <Download className="w-4 h-4 mr-1" />
              .md
            </Button>
            <Button variant="outline" size="sm" onClick={downloadHTML}>
              <Download className="w-4 h-4 mr-1" />
              .html
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <Card className="mb-4">
          <CardContent className="py-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1">
                {toolbarButtons.map((btn, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    onClick={btn.action}
                    title={btn.title}
                  >
                    <btn.icon className="w-4 h-4" />
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant={view === "edit" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setView("edit")}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant={view === "split" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setView("split")}
                >
                  Split
                </Button>
                <Button
                  variant={view === "preview" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setView("preview")}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Editor and Preview */}
        <div className={cn(
          "grid gap-4",
          view === "split" && "md:grid-cols-2",
          view === "edit" && "grid-cols-1",
          view === "preview" && "grid-cols-1"
        )}>
          {/* Editor */}
          {(view === "edit" || view === "split") && (
            <Card className="h-[600px]">
              <CardHeader className="py-3 border-b">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Markdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-48px)]">
                <Textarea
                  id="markdown-input"
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  className="h-full resize-none rounded-none border-0 font-mono text-sm focus-visible:ring-0"
                  placeholder="Write your markdown here..."
                />
              </CardContent>
            </Card>
          )}

          {/* Preview */}
          {(view === "preview" || view === "split") && (
            <Card className="h-[600px]">
              <CardHeader className="py-3 border-b">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-48px)] overflow-y-auto">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(markdown) }}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Cheat Sheet */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Markdown Cheat Sheet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Text Formatting</h4>
                <div className="space-y-1 font-mono text-xs">
                  <p>**bold** → <strong>bold</strong></p>
                  <p>*italic* → <em>italic</em></p>
                  <p>~~strike~~ → <del>strike</del></p>
                  <p>`code` → <code className="bg-muted px-1">code</code></p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Headers</h4>
                <div className="space-y-1 font-mono text-xs">
                  <p># Header 1</p>
                  <p>## Header 2</p>
                  <p>### Header 3</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Links & Images</h4>
                <div className="space-y-1 font-mono text-xs">
                  <p>[text](url)</p>
                  <p>![alt](image-url)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
