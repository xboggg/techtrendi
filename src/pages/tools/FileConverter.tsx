import { useState, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FileText, ArrowRightLeft, Download, Copy, Upload, Trash2 } from "lucide-react";

type Format = "json" | "csv" | "tsv" | "yaml" | "markdown" | "html" | "plaintext";

interface ConversionPath {
  from: Format;
  to: Format;
  label: string;
}

const CONVERSIONS: ConversionPath[] = [
  { from: "json", to: "csv", label: "JSON → CSV" },
  { from: "csv", to: "json", label: "CSV → JSON" },
  { from: "json", to: "yaml", label: "JSON → YAML" },
  { from: "yaml", to: "json", label: "YAML → JSON" },
  { from: "csv", to: "tsv", label: "CSV → TSV" },
  { from: "tsv", to: "csv", label: "TSV → CSV" },
  { from: "markdown", to: "html", label: "Markdown → HTML" },
  { from: "html", to: "plaintext", label: "HTML → Plain Text" },
];

const FORMAT_EXTENSIONS: Record<Format, string> = {
  json: ".json",
  csv: ".csv",
  tsv: ".tsv",
  yaml: ".yaml",
  markdown: ".md",
  html: ".html",
  plaintext: ".txt",
};

const FORMAT_MIME: Record<Format, string> = {
  json: "application/json",
  csv: "text/csv",
  tsv: "text/tab-separated-values",
  yaml: "text/yaml",
  markdown: "text/markdown",
  html: "text/html",
  plaintext: "text/plain",
};

// --- Simple parsers (no external libraries) ---

function csvToArray(csv: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    const next = csv[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(current);
        current = "";
      } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
        row.push(current);
        current = "";
        if (row.some((c) => c.trim() !== "") || row.length > 1) rows.push(row);
        row = [];
        if (ch === "\r") i++;
      } else {
        current += ch;
      }
    }
  }
  row.push(current);
  if (row.some((c) => c.trim() !== "") || row.length > 1) rows.push(row);
  return rows;
}

function arrayToCsv(data: string[][]): string {
  return data
    .map((row) =>
      row
        .map((cell) => {
          if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
            return '"' + cell.replace(/"/g, '""') + '"';
          }
          return cell;
        })
        .join(",")
    )
    .join("\n");
}

function arrayToTsv(data: string[][]): string {
  return data.map((row) => row.join("\t")).join("\n");
}

function tsvToArray(tsv: string): string[][] {
  return tsv
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map((line) => line.split("\t"));
}

function jsonToCsv(jsonStr: string): string {
  const parsed = JSON.parse(jsonStr);
  const arr = Array.isArray(parsed) ? parsed : [parsed];
  if (arr.length === 0) return "";
  const headers = Object.keys(arr[0]);
  const rows: string[][] = [headers];
  for (const obj of arr) {
    rows.push(headers.map((h) => String(obj[h] ?? "")));
  }
  return arrayToCsv(rows);
}

function csvToJson(csvStr: string): string {
  const rows = csvToArray(csvStr);
  if (rows.length < 2) return JSON.stringify([], null, 2);
  const headers = rows[0];
  const result = rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? "";
    });
    return obj;
  });
  return JSON.stringify(result, null, 2);
}

function jsonToYaml(jsonStr: string): string {
  const parsed = JSON.parse(jsonStr);
  return toYaml(parsed, 0);
}

function toYaml(value: unknown, indent: number): string {
  const prefix = "  ".repeat(indent);
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    if (
      value.includes("\n") ||
      value.includes(":") ||
      value.includes("#") ||
      value.includes("'") ||
      value.includes('"') ||
      value.trim() !== value
    ) {
      return JSON.stringify(value);
    }
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value
      .map((item) => {
        const inner = toYaml(item, indent + 1);
        if (typeof item === "object" && item !== null) {
          return prefix + "- " + inner.trimStart();
        }
        return prefix + "- " + inner;
      })
      .join("\n");
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    return entries
      .map(([key, val]) => {
        if (typeof val === "object" && val !== null) {
          return prefix + key + ":\n" + toYaml(val, indent + 1);
        }
        return prefix + key + ": " + toYaml(val, indent);
      })
      .join("\n");
  }
  return String(value);
}

function yamlToJson(yamlStr: string): string {
  const parsed = parseYaml(yamlStr);
  return JSON.stringify(parsed, null, 2);
}

function parseYaml(yaml: string): unknown {
  const lines = yaml.split(/\r?\n/);
  const result = parseYamlLines(lines, 0, 0);
  return result.value;
}

function getIndent(line: string): number {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
}

function parseYamlLines(
  lines: string[],
  start: number,
  baseIndent: number
): { value: unknown; nextIndex: number } {
  if (start >= lines.length) return { value: null, nextIndex: start };

  const firstLine = lines[start];
  const trimmed = firstLine.trim();

  // Skip empty lines and comments
  if (trimmed === "" || trimmed.startsWith("#")) {
    return parseYamlLines(lines, start + 1, baseIndent);
  }

  // Array item
  if (trimmed.startsWith("- ")) {
    const arr: unknown[] = [];
    let i = start;
    while (i < lines.length) {
      const line = lines[i];
      if (line.trim() === "" || line.trim().startsWith("#")) {
        i++;
        continue;
      }
      const indent = getIndent(line);
      if (indent < baseIndent) break;
      if (indent === baseIndent && line.trim().startsWith("- ")) {
        const rest = line.trim().substring(2).trim();
        if (rest.includes(": ") || rest.endsWith(":")) {
          // Inline mapping after dash
          const innerLines = [" ".repeat(baseIndent + 2) + rest];
          let j = i + 1;
          while (j < lines.length) {
            const nextLine = lines[j];
            if (nextLine.trim() === "" || nextLine.trim().startsWith("#")) {
              j++;
              continue;
            }
            const nextIndent = getIndent(nextLine);
            if (nextIndent <= baseIndent) break;
            innerLines.push(nextLine);
            j++;
          }
          const parsed = parseYamlLines(innerLines, 0, baseIndent + 2);
          arr.push(parsed.value);
          i = j;
        } else {
          arr.push(parseScalar(rest));
          i++;
        }
      } else {
        break;
      }
    }
    return { value: arr, nextIndex: i };
  }

  // Object
  if (trimmed.includes(":")) {
    const obj: Record<string, unknown> = {};
    let i = start;
    while (i < lines.length) {
      const line = lines[i];
      if (line.trim() === "" || line.trim().startsWith("#")) {
        i++;
        continue;
      }
      const indent = getIndent(line);
      if (indent < baseIndent) break;
      if (indent > baseIndent) break;

      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) break;

      const key = line.substring(indent, colonIdx).trim();
      const afterColon = line.substring(colonIdx + 1).trim();

      if (afterColon === "" || afterColon === "|" || afterColon === ">") {
        // Value is on next lines
        let childIndent = -1;
        let j = i + 1;
        while (j < lines.length && (lines[j].trim() === "" || lines[j].trim().startsWith("#"))) j++;
        if (j < lines.length) childIndent = getIndent(lines[j]);

        if (childIndent > baseIndent) {
          const parsed = parseYamlLines(lines, j, childIndent);
          obj[key] = parsed.value;
          i = parsed.nextIndex;
        } else {
          obj[key] = null;
          i++;
        }
      } else {
        obj[key] = parseScalar(afterColon);
        i++;
      }
    }
    return { value: obj, nextIndex: i };
  }

  return { value: parseScalar(trimmed), nextIndex: start + 1 };
}

function parseScalar(s: string): unknown {
  if (s === "null" || s === "~") return null;
  if (s === "true") return true;
  if (s === "false") return false;
  if (s === "[]") return [];
  if (s === "{}") return {};
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  const num = Number(s);
  if (!isNaN(num) && s !== "") return num;
  return s;
}

function markdownToHtml(md: string): string {
  let html = md;

  // Code blocks (fenced) — must come before inline code
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const cls = lang ? ` class="language-${lang}"` : "";
    return `<pre><code${cls}>${escapeHtml(code.trimEnd())}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Headings
  html = html.replace(/^######\s+(.*)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#####\s+(.*)$/gm, "<h5>$1</h5>");
  html = html.replace(/^####\s+(.*)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.*)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.*)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.*)$/gm, "<h1>$1</h1>");

  // Bold & italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Links & images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Horizontal rule
  html = html.replace(/^---$/gm, "<hr />");

  // Blockquote
  html = html.replace(/^>\s+(.*)$/gm, "<blockquote>$1</blockquote>");

  // Unordered list items
  html = html.replace(/^[-*]\s+(.*)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>\n${match}</ul>\n`);

  // Paragraphs: wrap remaining plain lines
  html = html.replace(/^(?!<[a-z/])(.*\S.*)$/gm, "<p>$1</p>");

  // Clean up extra newlines
  html = html.replace(/\n{3,}/g, "\n\n");

  return html.trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlToPlainText(html: string): string {
  // Remove script/style blocks
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, "");

  // Block-level elements get newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|blockquote|pre)>/gi, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<hr\s*\/?>/gi, "\n---\n");

  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, "");

  // Decode common entities
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, " ");

  // Collapse multiple blank lines
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

// --- Conversion dispatch ---

function convert(input: string, from: Format, to: Format): string {
  if (from === "json" && to === "csv") return jsonToCsv(input);
  if (from === "csv" && to === "json") return csvToJson(input);
  if (from === "json" && to === "yaml") return jsonToYaml(input);
  if (from === "yaml" && to === "json") return yamlToJson(input);
  if (from === "csv" && to === "tsv") return arrayToTsv(csvToArray(input));
  if (from === "tsv" && to === "csv") return arrayToCsv(tsvToArray(input));
  if (from === "markdown" && to === "html") return markdownToHtml(input);
  if (from === "html" && to === "plaintext") return htmlToPlainText(input);
  throw new Error(`Unsupported conversion: ${from} → ${to}`);
}

function getAvailableTargets(from: Format): Format[] {
  return CONVERSIONS.filter((c) => c.from === from).map((c) => c.to);
}

function getAvailableSources(): Format[] {
  return [...new Set(CONVERSIONS.map((c) => c.from))];
}

const FORMAT_LABELS: Record<Format, string> = {
  json: "JSON",
  csv: "CSV",
  tsv: "TSV",
  yaml: "YAML",
  markdown: "Markdown",
  html: "HTML",
  plaintext: "Plain Text",
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// --- Component ---

export default function FileConverter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [fromFormat, setFromFormat] = useState<Format | "">("");
  const [toFormat, setToFormat] = useState<Format | "">("");
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableSources = getAvailableSources();
  const availableTargets = fromFormat ? getAvailableTargets(fromFormat as Format) : [];

  const inputSize = new Blob([input]).size;
  const outputSize = new Blob([output]).size;

  const handleFileRead = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setInput(text);
      setOutput("");

      // Auto-detect format from extension
      const ext = file.name.split(".").pop()?.toLowerCase();
      const formatMap: Record<string, Format> = {
        json: "json",
        csv: "csv",
        tsv: "tsv",
        yaml: "yaml",
        yml: "yaml",
        md: "markdown",
        html: "html",
        htm: "html",
        txt: "plaintext",
      };
      if (ext && formatMap[ext]) {
        setFromFormat(formatMap[ext]);
        setToFormat("");
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileRead(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
  };

  const handleConvert = () => {
    if (!input.trim()) {
      toast.error("Please provide input text or upload a file.");
      return;
    }
    if (!fromFormat || !toFormat) {
      toast.error("Please select both source and target formats.");
      return;
    }
    try {
      const result = convert(input, fromFormat as Format, toFormat as Format);
      setOutput(result);
      toast.success("Conversion complete!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Conversion failed";
      toast.error(message);
      setOutput("");
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy.");
    }
  };

  const handleDownload = () => {
    if (!output || !toFormat) return;
    const fmt = toFormat as Format;
    const blob = new Blob([output], { type: FORMAT_MIME[fmt] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const baseName = fileName ? fileName.replace(/\.[^.]+$/, "") : "converted";
    a.download = baseName + FORMAT_EXTENSIONS[fmt];
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setFromFormat("");
    setToFormat("");
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Layout>
      <SEOHead
        title="File Converter | TechTrendi"
        description="Convert files between JSON, CSV, TSV, YAML, Markdown, HTML and plain text entirely in your browser. No uploads, no server — 100% client-side."
      />

      <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">File Converter</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Convert between common text-based file formats entirely in your browser.
              No data leaves your device.
            </p>
          </div>

          {/* Format selectors */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 w-full">
                  <Label className="mb-1.5 block">Convert From</Label>
                  <Select
                    value={fromFormat}
                    onValueChange={(v) => {
                      setFromFormat(v as Format);
                      setToFormat("");
                      setOutput("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Source format" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSources.map((f) => (
                        <SelectItem key={f} value={f}>
                          {FORMAT_LABELS[f]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <ArrowRightLeft className="h-5 w-5 text-muted-foreground mt-5 shrink-0" />

                <div className="flex-1 w-full">
                  <Label className="mb-1.5 block">Convert To</Label>
                  <Select
                    value={toFormat}
                    onValueChange={(v) => {
                      setToFormat(v as Format);
                      setOutput("");
                    }}
                    disabled={!fromFormat}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={fromFormat ? "Target format" : "Select source first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTargets.map((f) => (
                        <SelectItem key={f} value={f}>
                          {FORMAT_LABELS[f]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Input area */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Input</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {fileName && <span className="truncate max-w-[200px]">{fileName}</span>}
                  {input && <span>{formatBytes(inputSize)}</span>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Drag & drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                )}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag & drop a file here, or click to browse
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".json,.csv,.tsv,.yaml,.yml,.md,.html,.htm,.txt"
                  onChange={handleFileInput}
                />
              </div>

              <div className="relative">
                <Label className="mb-1.5 block text-sm">Or paste text directly:</Label>
                <textarea
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setOutput("");
                    setFileName("");
                  }}
                  placeholder="Paste your content here..."
                  className="w-full min-h-[200px] rounded-md border bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                  spellCheck={false}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              size="lg"
              onClick={handleConvert}
              disabled={!input.trim() || !fromFormat || !toFormat}
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Convert
            </Button>
            <Button size="lg" variant="outline" onClick={handleClear}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          {/* Output area */}
          {output && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Output{toFormat ? ` (${FORMAT_LABELS[toFormat as Format]})` : ""}
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">{formatBytes(outputSize)}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <pre className="w-full min-h-[200px] max-h-[400px] overflow-auto rounded-md border bg-muted/50 px-3 py-2 text-sm font-mono whitespace-pre-wrap break-words">
                  {output}
                </pre>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleCopy}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Supported conversions reference */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Supported Conversions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CONVERSIONS.map((c) => (
                  <button
                    key={c.label}
                    onClick={() => {
                      setFromFormat(c.from);
                      setToFormat(c.to);
                      setOutput("");
                    }}
                    className="text-sm px-3 py-2 rounded-md border hover:bg-muted transition-colors text-center"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
