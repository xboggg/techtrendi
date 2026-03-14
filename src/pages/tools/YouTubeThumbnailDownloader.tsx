import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Youtube, Download, Copy, Image, ExternalLink } from "lucide-react";

interface ThumbnailSize {
  label: string;
  key: string;
  resolution: string;
  width: number;
  height: number;
}

const THUMBNAIL_SIZES: ThumbnailSize[] = [
  { label: "Max Resolution", key: "maxresdefault", resolution: "1280x720", width: 1280, height: 720 },
  { label: "SD Quality", key: "sddefault", resolution: "640x480", width: 640, height: 480 },
  { label: "HQ Quality", key: "hqdefault", resolution: "480x360", width: 480, height: 360 },
  { label: "MQ Quality", key: "mqdefault", resolution: "320x180", width: 320, height: 180 },
  { label: "Default", key: "default", resolution: "120x90", width: 120, height: 90 },
];

function extractVideoId(url: string): string | null {
  const trimmed = url.trim();

  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // youtu.be/VIDEO_ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // youtube.com/shorts/VIDEO_ID
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  // youtube.com/embed/VIDEO_ID
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  // Bare video ID (11 chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  return null;
}

export default function YouTubeThumbnailDownloader() {
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleExtract = () => {
    setError("");
    setFailedImages(new Set());

    if (!url.trim()) {
      setError("Please enter a YouTube URL");
      toast.error("Please enter a YouTube URL");
      return;
    }

    const id = extractVideoId(url);
    if (!id) {
      setError("Invalid YouTube URL. Please enter a valid YouTube video link.");
      toast.error("Invalid YouTube URL");
      return;
    }

    setVideoId(id);
    toast.success("Thumbnails extracted!");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleExtract();
  };

  const getThumbnailUrl = (id: string, key: string) =>
    `https://img.youtube.com/vi/${id}/${key}.jpg`;

  const handleCopyUrl = async (id: string, key: string) => {
    const thumbUrl = getThumbnailUrl(id, key);
    try {
      await navigator.clipboard.writeText(thumbUrl);
      toast.success("URL copied to clipboard!");
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  const handleDownload = async (id: string, size: ThumbnailSize) => {
    const thumbUrl = getThumbnailUrl(id, size.key);
    try {
      const response = await fetch(thumbUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `youtube-thumbnail-${id}-${size.key}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success(`${size.label} thumbnail downloaded!`);
    } catch {
      // Fallback: open in new tab
      window.open(thumbUrl, "_blank");
      toast.info("Opened thumbnail in new tab");
    }
  };

  const handleOpenInNewTab = (id: string, key: string) => {
    window.open(getThumbnailUrl(id, key), "_blank");
  };

  const handleImageError = (key: string) => {
    setFailedImages((prev) => new Set(prev).add(key));
  };

  return (
    <Layout>
      <SEOHead
        title="YouTube Thumbnail Downloader | TechTrendi"
        description="Download YouTube video thumbnails in all available resolutions. Extract and save high-quality thumbnails from any YouTube video for free."
      />
      <div className="container py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6">
              <Youtube className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              YouTube Thumbnail Downloader
            </h1>
            <p className="text-muted-foreground text-lg">
              Extract and download thumbnails from any YouTube video in all
              available resolutions.
            </p>
          </div>

          {/* Input Section */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Paste YouTube URL here (e.g., https://youtube.com/watch?v=...)"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (error) setError("");
                    }}
                    onKeyDown={handleKeyDown}
                    className={cn(
                      "h-12 text-base",
                      error && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {error && (
                    <p className="text-sm text-red-500 mt-2">{error}</p>
                  )}
                </div>
                <Button
                  onClick={handleExtract}
                  className="h-12 px-6 bg-gradient-primary hover:opacity-90"
                >
                  <Image className="w-4 h-4 mr-2" />
                  Extract Thumbnails
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Supports youtube.com/watch, youtu.be, youtube.com/shorts, and
                embed links.
              </p>
            </CardContent>
          </Card>

          {/* Thumbnails Grid */}
          {videoId && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-foreground">
                Available Thumbnails
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {THUMBNAIL_SIZES.map((size) => {
                  const isFailed = failedImages.has(size.key);
                  return (
                    <Card
                      key={size.key}
                      className={cn(
                        "overflow-hidden",
                        isFailed && "opacity-60"
                      )}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>{size.label}</span>
                          <span className="text-sm font-normal text-muted-foreground">
                            {size.resolution}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="relative rounded-lg overflow-hidden bg-muted aspect-video flex items-center justify-center">
                          {isFailed ? (
                            <div className="text-center text-muted-foreground p-4">
                              <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">
                                Not available for this video
                              </p>
                            </div>
                          ) : (
                            <img
                              src={getThumbnailUrl(videoId, size.key)}
                              alt={`${size.label} thumbnail`}
                              className="w-full h-full object-cover"
                              onError={() => handleImageError(size.key)}
                              loading="lazy"
                            />
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleDownload(videoId, size)}
                            disabled={isFailed}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleCopyUrl(videoId, size.key)}
                            disabled={isFailed}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy URL
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            onClick={() =>
                              handleOpenInNewTab(videoId, size.key)
                            }
                            disabled={isFailed}
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Info Section */}
          <Card className="mt-10">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-foreground mb-3">
                How It Works
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  1. Paste any YouTube video URL into the input field above.
                </li>
                <li>
                  2. Click "Extract Thumbnails" to fetch all available sizes.
                </li>
                <li>
                  3. Preview thumbnails and download the resolution you need.
                </li>
                <li>
                  4. Max Resolution (1280x720) is the best quality — ideal for
                  blog posts, social media, and presentations.
                </li>
              </ul>
              <p className="text-xs text-muted-foreground mt-4">
                Note: Max Resolution and SD thumbnails may not be available for
                all videos. Older or low-quality videos might only have HQ,
                MQ, or Default thumbnails.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
