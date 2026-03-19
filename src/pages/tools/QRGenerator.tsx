import { useState, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Download, Link as LinkIcon, Type, QrCode } from "lucide-react";
import { toast } from "sonner";

export default function QRGenerator() {
  const [input, setInput] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [inputType, setInputType] = useState<"url" | "text">("url");
  const [size, setSize] = useState(256);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQR = async () => {
    if (!input.trim()) {
      toast.error("Please enter a URL or text");
      return;
    }

    try {
      // Use QR Code API
      const encodedData = encodeURIComponent(input);
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}`;
      setQrDataUrl(qrUrl);
      toast.success("QR Code generated!");
    } catch (error) {
      toast.error("Failed to generate QR code");
    }
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;

    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = "qrcode.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR Code downloaded!");
  };

  return (
    <Layout>
      <SEOHead
        title="QR Code Generator"
        description="Turn any URL or text into a scannable QR code. Customize the size and download it as an image for free."
        canonical="/tools/qr-generator"
        keywords={["qr code generator", "qr maker", "create qr code", "qr code free", "url to qr"]}
      />
      <div className="container py-12 md:py-20">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6">
              <QrCode className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              QR Code Generator
            </h1>
            <p className="text-muted-foreground text-lg">
              Create QR codes for URLs, text, or any data instantly.
            </p>
          </div>

          {/* Generator Card */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8">
            {/* Input Type Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setInputType("url")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${
                  inputType === "url"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                URL
              </button>
              <button
                onClick={() => setInputType("text")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${
                  inputType === "text"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Type className="w-4 h-4" />
                Text
              </button>
            </div>

            {/* Input Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                {inputType === "url" ? "Enter URL" : "Enter Text"}
              </label>
              {inputType === "url" ? (
                <input
                  type="url"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              ) : (
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter any text..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                />
              )}
            </div>

            {/* Size Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                QR Code Size
              </label>
              <div className="flex gap-2">
                {[128, 256, 512].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                      size === s
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s}x{s}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <Button variant="hero" size="xl" onClick={generateQR} className="w-full mb-6">
              <QrCode className="w-5 h-5 mr-2" />
              Generate QR Code
            </Button>

            {/* QR Code Display */}
            {qrDataUrl && (
              <div className="text-center">
                <div className="inline-block p-6 bg-background rounded-2xl border border-border">
                  <img
                    src={qrDataUrl}
                    alt="Generated QR Code"
                    className="mx-auto"
                    width={size}
                    height={size}
                  />
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={downloadQR}
                  className="mt-6"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download PNG
                </Button>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Tips Section */}
          <div className="mt-10 p-6 rounded-2xl bg-muted/50">
            <h3 className="font-semibold text-foreground mb-4">QR Code Tips</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Use larger sizes for print materials
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Test your QR code before sharing
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Keep URLs short for better scanning
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                QR codes can store URLs, text, emails, phone numbers, and more
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
