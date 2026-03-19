import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Braces, Copy, Check, Trash2, Download, Upload, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [indentSize, setIndentSize] = useState(2);

  const formatJson = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, indentSize));
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  };

  const validateJson = () => {
    try {
      JSON.parse(input);
      setError("");
      setOutput("✓ Valid JSON");
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  };

  const copyOutput = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJson = () => {
    const blob = new Blob([output || input], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formatted.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setInput(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const sampleJson = `{
  "name": "TechTrendi",
  "version": "1.0.0",
  "features": ["reviews", "tools", "guides"],
  "premium": true,
  "stats": {
    "users": 10000,
    "articles": 500
  }
}`;

  return (
    <Layout>
      <SEOHead
        title="JSON Formatter"
        description="Paste messy JSON and get it formatted, validated, and easy to read. Minify or pretty-print with custom indentation."
        canonical="/tools/json-formatter"
        keywords={["json formatter", "json validator", "json beautifier", "json minifier", "format json online"]}
      />
      <div className="container py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center mx-auto mb-4">
              <Braces className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">JSON Formatter</h1>
            <p className="text-muted-foreground">
              Format, validate, and minify JSON data
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Indent:</label>
              <select
                value={indentSize}
                onChange={(e) => setIndentSize(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border border-border bg-background"
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
                <option value={1}>1 tab</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <span className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                  <Upload className="w-4 h-4" />
                  Upload
                </span>
              </label>
              <Button variant="outline" onClick={() => setInput(sampleJson)}>
                Sample
              </Button>
            </div>
          </div>

          {/* Editor */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium">Input JSON</label>
                <button
                  onClick={() => setInput("")}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </button>
              </div>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste your JSON here..."
                className="min-h-[400px] font-mono text-sm"
              />
            </div>

            {/* Output */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium">Output</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyOutput}
                    disabled={!output}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 disabled:opacity-50"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={downloadJson}
                    disabled={!output && !input}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
              <div className="min-h-[400px] p-4 rounded-lg border border-border bg-muted/30 font-mono text-sm overflow-auto whitespace-pre-wrap">
                {error ? (
                  <span className="text-red-500">{error}</span>
                ) : output ? (
                  output
                ) : (
                  <span className="text-muted-foreground">Output will appear here...</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <Button onClick={formatJson} className="gap-2">
              <Maximize2 className="w-4 h-4" />
              Format / Beautify
            </Button>
            <Button onClick={minifyJson} variant="outline" className="gap-2">
              <Minimize2 className="w-4 h-4" />
              Minify
            </Button>
            <Button onClick={validateJson} variant="outline" className="gap-2">
              <Check className="w-4 h-4" />
              Validate
            </Button>
          </div>

          {/* Info */}
          <div className="mt-12 p-6 bg-muted/30 rounded-xl">
            <h2 className="font-semibold mb-4">About JSON Formatter</h2>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
              <div>
                <h3 className="font-medium text-foreground mb-2">Features</h3>
                <ul className="space-y-1">
                  <li>• Format/beautify JSON with custom indentation</li>
                  <li>• Minify JSON for production use</li>
                  <li>• Validate JSON syntax</li>
                  <li>• Upload JSON files</li>
                  <li>• Download formatted output</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">Use Cases</h3>
                <ul className="space-y-1">
                  <li>• API response debugging</li>
                  <li>• Configuration file formatting</li>
                  <li>• Data validation</li>
                  <li>• Code readability improvement</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
