import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Binary, Copy, Check, ArrowLeftRight, Trash2, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function Base64Encoder() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const encode = () => {
    try {
      const encoded = btoa(unescape(encodeURIComponent(input)));
      setOutput(encoded);
      setError("");
    } catch (e) {
      setError("Failed to encode. Make sure input is valid text.");
    }
  };

  const decode = () => {
    try {
      const decoded = decodeURIComponent(escape(atob(input)));
      setOutput(decoded);
      setError("");
    } catch (e) {
      setError("Failed to decode. Make sure input is valid Base64.");
    }
  };

  const process = () => {
    if (mode === "encode") {
      encode();
    } else {
      decode();
    }
  };

  const swapMode = () => {
    setMode(mode === "encode" ? "decode" : "encode");
    setInput(output);
    setOutput("");
    setError("");
  };

  const copyOutput = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      if (mode === "encode") {
        reader.onload = (e) => {
          const base64 = (e.target?.result as string).split(",")[1];
          setOutput(base64);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (e) => {
          setInput(e.target?.result as string);
        };
        reader.readAsText(file);
      }
    }
  };

  const downloadOutput = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === "encode" ? "encoded.txt" : "decoded.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <SEOHead
        title="Base64 Encoder & Decoder"
        description="Encode text to Base64 or decode Base64 strings back to plain text. Fast, free, and works right in your browser."
        canonical="/tools/base64-encoder"
        keywords={["base64 encoder", "base64 decoder", "text encoding", "data conversion", "online base64"]}
      />
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center mx-auto mb-4">
              <Binary className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Base64 Encoder/Decoder</h1>
            <p className="text-muted-foreground">
              Encode text to Base64 or decode Base64 to text
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center p-1 bg-muted rounded-lg">
              <button
                onClick={() => setMode("encode")}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  mode === "encode"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Encode
              </button>
              <button
                onClick={() => setMode("decode")}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  mode === "decode"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Decode
              </button>
            </div>
          </div>

          {/* Input */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium">
                {mode === "encode" ? "Text to Encode" : "Base64 to Decode"}
              </label>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Upload className="w-4 h-4" />
                  Upload
                </label>
                <button
                  onClick={() => {
                    setInput("");
                    setOutput("");
                    setError("");
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </button>
              </div>
            </div>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === "encode"
                  ? "Enter text to encode..."
                  : "Enter Base64 string to decode..."
              }
              className="min-h-[150px] font-mono"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mb-4">
            <Button onClick={process} size="lg" className="gap-2">
              {mode === "encode" ? "Encode to Base64" : "Decode from Base64"}
            </Button>
            <Button onClick={swapMode} variant="outline" size="lg" className="gap-2">
              <ArrowLeftRight className="w-4 h-4" />
              Swap
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Output */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium">
                {mode === "encode" ? "Base64 Output" : "Decoded Text"}
              </label>
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
                  onClick={downloadOutput}
                  disabled={!output}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
            <div className="min-h-[150px] p-4 rounded-lg border border-border bg-muted/30 font-mono text-sm overflow-auto whitespace-pre-wrap break-all">
              {output || (
                <span className="text-muted-foreground">
                  Output will appear here...
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="mt-12 p-6 bg-muted/30 rounded-xl">
            <h2 className="font-semibold mb-4">About Base64</h2>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
              <div>
                <h3 className="font-medium text-foreground mb-2">What is Base64?</h3>
                <p>
                  Base64 is a binary-to-text encoding scheme that represents binary
                  data in an ASCII string format. It's commonly used when you need
                  to encode binary data for storage or transfer over text-based
                  media.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">Common Uses</h3>
                <ul className="space-y-1">
                  <li>• Email attachments (MIME)</li>
                  <li>• Data URIs in HTML/CSS</li>
                  <li>• API authentication tokens</li>
                  <li>• Storing complex data in JSON</li>
                  <li>• Embedding images in code</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
