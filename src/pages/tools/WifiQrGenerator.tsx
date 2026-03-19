import { useState, useRef, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wifi,
  Download,
  Copy,
  Printer,
  QrCode,
  Shield,
  Eye,
  EyeOff,
  Trash2,
  Clock,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type EncryptionType = "WPA" | "WEP" | "nopass";

interface SavedNetwork {
  ssid: string;
  password: string;
  encryption: EncryptionType;
  hidden: boolean;
  savedAt: number;
}

const STORAGE_KEY = "wifi-qr-recent-networks";

function getWifiString(
  ssid: string,
  password: string,
  encryption: EncryptionType,
  hidden: boolean
): string {
  // Escape special characters in SSID and password
  const escapeField = (val: string) =>
    val.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/:/g, "\\:").replace(/"/g, '\\"');

  const parts = [`WIFI:T:${encryption}`];
  parts.push(`S:${escapeField(ssid)}`);
  if (encryption !== "nopass" && password) {
    parts.push(`P:${escapeField(password)}`);
  }
  parts.push(`H:${hidden}`);
  return parts.join(";") + ";;";
}

function loadSavedNetworks(): SavedNetwork[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedNetwork[];
  } catch {
    return [];
  }
}

function saveNetwork(network: SavedNetwork) {
  const existing = loadSavedNetworks();
  // Remove duplicate SSIDs
  const filtered = existing.filter((n) => n.ssid !== network.ssid);
  // Keep most recent 10
  const updated = [network, ...filtered].slice(0, 10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

function removeSavedNetwork(ssid: string) {
  const existing = loadSavedNetworks();
  const updated = existing.filter((n) => n.ssid !== ssid);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export default function WifiQrGenerator() {
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [encryption, setEncryption] = useState<EncryptionType>("WPA");
  const [hidden, setHidden] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPrintCard, setShowPrintCard] = useState(false);
  const [savedNetworks, setSavedNetworks] = useState<SavedNetwork[]>([]);
  const qrRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSavedNetworks(loadSavedNetworks());
  }, []);

  const wifiString = ssid.trim()
    ? getWifiString(ssid, password, encryption, hidden)
    : "";

  const isValid = ssid.trim().length > 0 && (encryption === "nopass" || password.length > 0);

  const handleSaveNetwork = useCallback(() => {
    if (!isValid) return;
    const network: SavedNetwork = {
      ssid: ssid.trim(),
      password,
      encryption,
      hidden,
      savedAt: Date.now(),
    };
    saveNetwork(network);
    setSavedNetworks(loadSavedNetworks());
    toast.success("Network saved to recent list");
  }, [ssid, password, encryption, hidden, isValid]);

  const handleLoadNetwork = (network: SavedNetwork) => {
    setSsid(network.ssid);
    setPassword(network.password);
    setEncryption(network.encryption);
    setHidden(network.hidden);
    toast.success(`Loaded "${network.ssid}"`);
  };

  const handleRemoveNetwork = (ssidToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeSavedNetwork(ssidToRemove);
    setSavedNetworks(loadSavedNetworks());
    toast.success("Network removed");
  };

  const downloadQR = () => {
    if (!qrRef.current || !isValid) return;

    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    canvas.width = 512;
    canvas.height = 512;

    img.onload = () => {
      if (!ctx) return;
      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);

      const link = document.createElement("a");
      link.download = `wifi-${ssid.trim().replace(/\s+/g, "-")}-qr.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("QR code downloaded!");
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const copyDetails = () => {
    const details = [
      `Network: ${ssid}`,
      encryption !== "nopass" ? `Password: ${password}` : "Password: (none)",
      `Security: ${encryption === "nopass" ? "Open" : encryption}`,
      hidden ? "Hidden network: Yes" : "",
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(details).then(() => {
      toast.success("WiFi details copied to clipboard!");
    });
  };

  const handlePrint = () => {
    setShowPrintCard(true);
    // Small delay to let the print card render
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const encryptionLabel = (enc: EncryptionType) => {
    switch (enc) {
      case "WPA":
        return "WPA/WPA2/WPA3";
      case "WEP":
        return "WEP";
      case "nopass":
        return "None (Open)";
    }
  };

  return (
    <Layout>
      <SEOHead
        title="WiFi QR Code Generator"
        description="Create a QR code for your WiFi network so guests can connect by scanning — no need to share passwords out loud."
        canonical="/tools/wifi-qr-generator"
        keywords={["wifi qr code", "wifi qr generator", "share wifi", "wifi password qr", "wireless qr code"]}
      />
      {/* Print-only card */}
      <style>{`
        @media print {
          body > *:not(.print-card-wrapper) { display: none !important; }
          .print-card-wrapper { display: flex !important; }
        }
        .print-card-wrapper { display: none; }
      `}</style>

      {showPrintCard && (
        <div className="print-card-wrapper fixed inset-0 z-[9999] bg-white flex items-center justify-center print:flex">
          <div ref={printRef} className="w-[400px] p-8 text-center" style={{ fontFamily: "system-ui, sans-serif" }}>
            <div className="border-2 border-gray-200 rounded-2xl p-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                  <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                  <line x1="12" y1="20" x2="12.01" y2="20" />
                </svg>
                <h2 className="text-xl font-bold text-gray-900">WiFi Access</h2>
              </div>

              <div className="mb-4 inline-block">
                <QRCodeSVG value={wifiString} size={200} level="M" includeMargin />
              </div>

              <p className="text-sm text-gray-500 mb-4">Scan to connect</p>

              <div className="text-left space-y-2 bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Network</span>
                  <span className="text-sm font-semibold text-gray-900">{ssid}</span>
                </div>
                {encryption !== "nopass" && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Password</span>
                    <span className="text-sm font-mono font-semibold text-gray-900">{password}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Security</span>
                  <span className="text-sm text-gray-900">{encryptionLabel(encryption)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Close button (hidden in print) */}
          <button
            onClick={() => setShowPrintCard(false)}
            className="fixed top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 print:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="container py-12 md:py-20">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6">
              <Wifi className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              WiFi QR Code Generator
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Generate a QR code that lets guests instantly connect to your WiFi
              network. No more spelling out passwords!
            </p>
          </motion.div>

          <div className="grid md:grid-cols-5 gap-6">
            {/* Left: Input Form */}
            <motion.div
              className="md:col-span-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8 space-y-6">
                {/* Network Name */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Wifi className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    Network Name (SSID)
                  </label>
                  <input
                    type="text"
                    value={ssid}
                    onChange={(e) => setSsid(e.target.value)}
                    placeholder="e.g. MyHomeWiFi"
                    className="w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>

                {/* Encryption Type */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Shield className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    Encryption Type
                  </label>
                  <Select
                    value={encryption}
                    onValueChange={(val) => setEncryption(val as EncryptionType)}
                  >
                    <SelectTrigger className="w-full h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WPA">WPA/WPA2/WPA3 (Recommended)</SelectItem>
                      <SelectItem value="WEP">WEP</SelectItem>
                      <SelectItem value="nopass">None (Open Network)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Password */}
                <AnimatePresence>
                  {encryption !== "nopass" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter WiFi password"
                          className="w-full h-12 px-4 pr-12 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hidden Network Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">Hidden Network</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Enable if your network doesn't broadcast its SSID
                    </p>
                  </div>
                  <Switch checked={hidden} onCheckedChange={setHidden} />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={copyDetails}
                    disabled={!isValid}
                    className="flex-1 min-w-[120px]"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Details
                  </Button>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={downloadQR}
                    disabled={!isValid}
                    className="flex-1 min-w-[120px]"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PNG
                  </Button>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={handlePrint}
                    disabled={!isValid}
                    className="flex-1 min-w-[120px]"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print Card
                  </Button>
                </div>

                {/* Save Network */}
                <Button
                  variant="hero"
                  size="xl"
                  onClick={handleSaveNetwork}
                  disabled={!isValid}
                  className="w-full"
                >
                  <QrCode className="w-5 h-5 mr-2" />
                  Save to Recent Networks
                </Button>
              </div>
            </motion.div>

            {/* Right: QR Preview */}
            <motion.div
              className="md:col-span-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-card rounded-2xl border border-border shadow-card p-6 sticky top-24">
                <h3 className="text-sm font-medium text-muted-foreground text-center mb-4">
                  Live QR Preview
                </h3>

                <div
                  ref={qrRef}
                  className="flex items-center justify-center"
                >
                  <AnimatePresence mode="wait">
                    {isValid ? (
                      <motion.div
                        key={wifiString}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="p-4 bg-white rounded-2xl"
                      >
                        <QRCodeSVG
                          value={wifiString}
                          size={200}
                          level="M"
                          includeMargin
                          imageSettings={{
                            src: "",
                            height: 0,
                            width: 0,
                            excavate: false,
                          }}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-[232px] h-[232px] rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3"
                      >
                        <QrCode className="w-12 h-12 text-muted-foreground/30" />
                        <p className="text-xs text-muted-foreground text-center px-4">
                          Enter your network details to see the QR code
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {isValid && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-center"
                  >
                    <p className="text-sm font-medium text-foreground">{ssid}</p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {encryptionLabel(encryption)}
                      </Badge>
                      {hidden && (
                        <Badge variant="outline" className="text-xs">
                          Hidden
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Scan with your phone's camera to connect
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Recent Networks */}
          <AnimatePresence>
            {savedNetworks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mt-8"
              >
                <div className="bg-card rounded-2xl border border-border shadow-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground">Recent Networks</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {savedNetworks.map((network) => (
                      <motion.button
                        key={network.ssid}
                        onClick={() => handleLoadNetwork(network)}
                        className="group relative flex items-center gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted text-left transition-colors"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Wifi className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {network.ssid}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {encryptionLabel(network.encryption)}
                            {network.hidden ? " / Hidden" : ""}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleRemoveNetwork(network.ssid, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/10 hover:text-destructive transition-all"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tips Section */}
          <motion.div
            className="mt-8 p-6 rounded-2xl bg-muted/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="font-semibold text-foreground mb-4">WiFi QR Code Tips</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">&#8226;</span>
                Most modern phones can scan WiFi QR codes with their built-in camera app
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">&#8226;</span>
                WPA/WPA2 is the most common and recommended encryption type
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">&#8226;</span>
                Use the Print Card feature to create a nice guest WiFi card for your home or office
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">&#8226;</span>
                Your WiFi credentials are never sent to any server &mdash; everything happens in your browser
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">&#8226;</span>
                Works with iPhone (iOS 11+), Android phones, and most QR code scanner apps
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
