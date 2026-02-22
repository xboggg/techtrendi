import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Link2, Copy, Check, Trash2, ExternalLink, BarChart3, MousePointer,
  Globe, Smartphone, Monitor, Clock, QrCode
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface ShortenedURL {
  id: string;
  originalUrl: string;
  shortCode: string;
  customAlias?: string;
  clicks: number;
  createdAt: string;
  lastClicked?: string;
}

const STORAGE_KEY = "techtrendi_urls_data";

const generateShortCode = () => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function URLShortener() {
  const { user } = useAuth();

  const [urls, setUrls] = useState<ShortenedURL[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (saved) {
        setUrls(JSON.parse(saved));
      }
    }
  }, [user]);

  // Save data
  useEffect(() => {
    if (user) {
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(urls));
    }
  }, [urls, user]);

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  const shortenUrl = () => {
    if (!newUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    let urlToShorten = newUrl.trim();
    if (!urlToShorten.startsWith("http://") && !urlToShorten.startsWith("https://")) {
      urlToShorten = "https://" + urlToShorten;
    }

    if (!isValidUrl(urlToShorten)) {
      toast.error("Please enter a valid URL");
      return;
    }

    if (customAlias) {
      const aliasExists = urls.some((u) => u.shortCode === customAlias || u.customAlias === customAlias);
      if (aliasExists) {
        toast.error("This alias is already taken");
        return;
      }
      if (!/^[a-zA-Z0-9-_]+$/.test(customAlias)) {
        toast.error("Alias can only contain letters, numbers, hyphens, and underscores");
        return;
      }
    }

    const shortCode = customAlias || generateShortCode();

    const newShortenedUrl: ShortenedURL = {
      id: Date.now().toString(),
      originalUrl: urlToShorten,
      shortCode,
      customAlias: customAlias || undefined,
      clicks: 0,
      createdAt: new Date().toISOString(),
    };

    setUrls((prev) => [newShortenedUrl, ...prev]);
    setNewUrl("");
    setCustomAlias("");
    toast.success("URL shortened!");
  };

  const copyToClipboard = (url: ShortenedURL) => {
    const shortUrl = `techtrendi.com/s/${url.shortCode}`;
    navigator.clipboard.writeText(`https://${shortUrl}`);
    setCopiedId(url.id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteUrl = (id: string) => {
    setUrls((prev) => prev.filter((u) => u.id !== id));
    toast.success("URL deleted");
  };

  const simulateClick = (id: string) => {
    setUrls((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, clicks: u.clicks + 1, lastClicked: new Date().toISOString() }
          : u
      )
    );
  };

  const totalClicks = urls.reduce((sum, u) => sum + u.clicks, 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!user) {
    return (
      <Layout>
        <SEOHead
          title="URL Shortener - Shorten Links & Track Clicks | TechTrendi"
          description="Shorten long URLs and track clicks. Create custom aliases and see analytics for your links."
          canonicalUrl="https://techtrendi.com/tools/url-shortener"
        />
        <div className="container py-12 md:py-20 max-w-2xl">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <Link2 className="w-16 h-16 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">URL Shortener</h1>
              <p className="text-muted-foreground mb-6">
                Shorten URLs, track clicks, and create custom aliases. Sign in to get started.
              </p>
              <Button asChild size="lg">
                <a href="/auth">Sign In to Continue</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title="URL Shortener - Shorten Links & Track Clicks | TechTrendi"
        description="Shorten long URLs and track clicks. Create custom aliases and see analytics for your links."
        canonicalUrl="https://techtrendi.com/tools/url-shortener"
      />

      <div className="container py-12 md:py-20 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Free + Account
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            URL <span className="text-primary">Shortener</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Shorten long URLs, track clicks, and create custom aliases
          </p>
        </div>

        {/* URL Input */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label>Long URL</Label>
                <Input
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://example.com/very/long/url/that/needs/shortening"
                  className="text-lg"
                  onKeyDown={(e) => e.key === "Enter" && shortenUrl()}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Custom Alias (optional)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">techtrendi.com/s/</span>
                    <Input
                      value={customAlias}
                      onChange={(e) => setCustomAlias(e.target.value.toLowerCase())}
                      placeholder="my-custom-link"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <Button onClick={shortenUrl} size="lg">
                    <Link2 className="w-4 h-4 mr-2" />
                    Shorten
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Link2 className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-3xl font-bold">{urls.length}</p>
              <p className="text-sm text-muted-foreground">Links Created</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <MousePointer className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-3xl font-bold">{totalClicks}</p>
              <p className="text-sm text-muted-foreground">Total Clicks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <BarChart3 className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-3xl font-bold">
                {urls.length > 0 ? (totalClicks / urls.length).toFixed(1) : 0}
              </p>
              <p className="text-sm text-muted-foreground">Avg. Clicks</p>
            </CardContent>
          </Card>
        </div>

        {/* URL List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Links</CardTitle>
            <CardDescription>
              Click on a short link to simulate a click (for demo purposes)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {urls.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Link2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No shortened URLs yet</p>
                <p className="text-sm">Shorten your first URL above!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {urls.map((url) => (
                  <div
                    key={url.id}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Short URL */}
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            onClick={() => simulateClick(url.id)}
                            className="text-primary font-medium hover:underline flex items-center gap-1"
                          >
                            <Link2 className="w-4 h-4" />
                            techtrendi.com/s/{url.shortCode}
                          </button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(url)}
                            className="h-7"
                          >
                            {copiedId === url.id ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowQR(showQR === url.id ? null : url.id)}
                            className="h-7"
                          >
                            <QrCode className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Original URL */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{url.originalUrl}</span>
                        </div>

                        {/* QR Code (simple placeholder) */}
                        {showQR === url.id && (
                          <div className="mt-4 p-4 bg-white rounded-lg inline-block">
                            <div className="w-32 h-32 bg-gray-100 flex items-center justify-center border">
                              <div className="text-center">
                                <QrCode className="w-8 h-8 mx-auto text-gray-400 mb-1" />
                                <p className="text-xs text-gray-500">QR Code</p>
                                <p className="text-xs text-gray-400">(Demo)</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Stats Row */}
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MousePointer className="w-3 h-3" />
                            {url.clicks} clicks
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Created {formatDate(url.createdAt)}
                          </span>
                          {url.lastClicked && (
                            <span className="flex items-center gap-1">
                              Last clicked {formatDate(url.lastClicked)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Click Count & Delete */}
                      <div className="flex items-center gap-2">
                        <div className="text-center px-3 py-2 bg-primary/10 rounded-lg">
                          <p className="text-2xl font-bold text-primary">{url.clicks}</p>
                          <p className="text-xs text-muted-foreground">clicks</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteUrl(url.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-8 bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">How it works</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-xs">1</span>
                </div>
                <p>Paste any long URL you want to shorten</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-xs">2</span>
                </div>
                <p>Optionally add a custom alias for your link</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-xs">3</span>
                </div>
                <p>Share your short link and track clicks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
