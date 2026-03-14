import { useState } from 'react';
import { Share2, Copy, Check, Twitter, Linkedin, Link2, Mail, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ShareResultsProps {
  toolName: string;
  result?: string;
  url?: string;
  imageData?: string;
  className?: string;
}

export function ShareResults({ toolName, result, url, imageData, className }: ShareResultsProps) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentUrl = url || window.location.href;
  const shareText = result
    ? `Check out my result from ${toolName} on TechTrendi: ${result.slice(0, 100)}${result.length > 100 ? '...' : ''}`
    : `I just used ${toolName} on TechTrendi - try it yourself!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleCopyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      toast.success('Result copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy result');
    }
  };

  const handleDownloadImage = () => {
    if (!imageData) return;

    const link = document.createElement('a');
    link.download = `${toolName.toLowerCase().replace(/\s+/g, '-')}-result.png`;
    link.href = imageData;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Image downloaded!');
  };

  const shareToTwitter = () => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`;
    window.open(tweetUrl, '_blank', 'width=600,height=400');
  };

  const shareToLinkedin = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
    window.open(linkedinUrl, '_blank', 'width=600,height=400');
  };

  const shareByEmail = () => {
    const subject = `Check out ${toolName} on TechTrendi`;
    const body = `${shareText}\n\n${currentUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${toolName} - TechTrendi`,
          text: shareText,
          url: currentUrl,
        });
      } catch (err) {
        // User cancelled or error
        if ((err as Error).name !== 'AbortError') {
          setShowModal(true);
        }
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleNativeShare}
        className={cn("gap-2", className)}
      >
        <Share2 className="w-4 h-4" />
        Share
      </Button>

      {/* Share Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          <div className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Share {toolName}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Copy Link */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Share Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentUrl}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm bg-muted rounded-lg border border-border truncate"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Social Share */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Share on Social</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={shareToTwitter}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <Twitter className="w-6 h-6 text-[#1DA1F2]" />
                    <span className="text-xs">Twitter</span>
                  </button>
                  <button
                    onClick={shareToLinkedin}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <Linkedin className="w-6 h-6 text-[#0A66C2]" />
                    <span className="text-xs">LinkedIn</span>
                  </button>
                  <button
                    onClick={shareByEmail}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <Mail className="w-6 h-6 text-muted-foreground" />
                    <span className="text-xs">Email</span>
                  </button>
                </div>
              </div>

              {/* Copy Result (if applicable) */}
              {result && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Copy Result</label>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleCopyResult}
                  >
                    <Copy className="w-4 h-4" />
                    Copy Result to Clipboard
                  </Button>
                </div>
              )}

              {/* Download Image (if applicable) */}
              {imageData && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Download</label>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleDownloadImage}
                  >
                    <Download className="w-4 h-4" />
                    Download as Image
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Compact inline share buttons
export function ShareButtons({ toolName, className }: { toolName: string; className?: string }) {
  const currentUrl = window.location.href;
  const shareText = `I just used ${toolName} on TechTrendi - try it yourself!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      toast.success('Link copied!');
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        onClick={handleCopyLink}
        className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
        title="Copy link"
      >
        <Link2 className="w-4 h-4" />
      </button>
      <button
        onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`, '_blank')}
        className="p-2 rounded-lg bg-muted hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] transition-colors"
        title="Share on Twitter"
      >
        <Twitter className="w-4 h-4" />
      </button>
      <button
        onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`, '_blank')}
        className="p-2 rounded-lg bg-muted hover:bg-[#0A66C2]/10 hover:text-[#0A66C2] transition-colors"
        title="Share on LinkedIn"
      >
        <Linkedin className="w-4 h-4" />
      </button>
    </div>
  );
}

export default ShareResults;
