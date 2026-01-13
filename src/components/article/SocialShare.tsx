import { useState } from "react";
import { Share2, Twitter, Facebook, Linkedin, Link2, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SocialShareProps {
  articleId: string;
  articleTitle: string;
  articleUrl: string;
  variant?: "default" | "compact";
  className?: string;
}

export function SocialShare({ articleId, articleTitle, articleUrl, variant = "default", className }: SocialShareProps) {
  const { user } = useAuth();
  const [showOptions, setShowOptions] = useState(false);

  const trackShare = async (platform: string) => {
    try {
      await supabase.from("article_shares").insert({
        article_id: articleId,
        user_id: user?.id || null,
        platform,
      });

      if (user) {
        await supabase.rpc("award_xp", { user_uuid: user.id, xp_amount: 15 });

        await supabase.from("user_activity").insert({
          user_id: user.id,
          activity_type: "share",
          article_id: articleId,
          xp_earned: 15,
          metadata: { platform },
        });
      }
    } catch (error) {
      console.error("Error tracking share:", error);
    }
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: articleTitle,
          url: articleUrl,
        });
        await trackShare("web_share");
        if (user) {
          toast.success("Shared! +15 XP", { icon: "📢" });
        } else {
          toast.success("Shared!");
        }
      } catch (error) {
        // User cancelled, no error toast needed
      }
    } else {
      setShowOptions(!showOptions);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      await trackShare("copy_link");
      if (user) {
        toast.success("Link copied! +15 XP", { icon: "🔗" });
      } else {
        toast.success("Link copied to clipboard!");
      }
      setShowOptions(false);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const shareToSocial = async (platform: string) => {
    const encodedTitle = encodeURIComponent(articleTitle);
    const encodedUrl = encodeURIComponent(articleUrl);

    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    };

    window.open(urls[platform as keyof typeof urls], "_blank", "width=600,height=400");
    await trackShare(platform);
    if (user) {
      toast.success(`Shared on ${platform}! +15 XP`, { icon: "📢" });
    }
    setShowOptions(false);
  };

  if (variant === "compact") {
    return (
      <div className={cn("relative", className)}>
        <Button
          onClick={handleWebShare}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>

        {showOptions && (
          <div className="absolute top-full mt-2 right-0 z-50 min-w-[200px] p-2 bg-card border border-border rounded-lg shadow-lg">
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary/10 transition-colors text-left"
            >
              <Link2 className="w-4 h-4" />
              <span className="text-sm">Copy Link</span>
            </button>
            <button
              onClick={() => shareToSocial("twitter")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary/10 transition-colors text-left"
            >
              <Twitter className="w-4 h-4" />
              <span className="text-sm">Twitter/X</span>
            </button>
            <button
              onClick={() => shareToSocial("facebook")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary/10 transition-colors text-left"
            >
              <Facebook className="w-4 h-4" />
              <span className="text-sm">Facebook</span>
            </button>
            <button
              onClick={() => shareToSocial("linkedin")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary/10 transition-colors text-left"
            >
              <Linkedin className="w-4 h-4" />
              <span className="text-sm">LinkedIn</span>
            </button>
            <button
              onClick={() => shareToSocial("whatsapp")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary/10 transition-colors text-left"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">WhatsApp</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Button onClick={handleWebShare} variant="outline" className="gap-2">
        <Share2 className="w-4 h-4" />
        Share Article
      </Button>

      <Button onClick={handleCopyLink} variant="outline" size="icon" title="Copy link">
        <Link2 className="w-4 h-4" />
      </Button>

      <Button
        onClick={() => shareToSocial("twitter")}
        variant="outline"
        size="icon"
        title="Share on Twitter"
      >
        <Twitter className="w-4 h-4" />
      </Button>

      <Button
        onClick={() => shareToSocial("facebook")}
        variant="outline"
        size="icon"
        title="Share on Facebook"
      >
        <Facebook className="w-4 h-4" />
      </Button>

      <Button
        onClick={() => shareToSocial("linkedin")}
        variant="outline"
        size="icon"
        title="Share on LinkedIn"
      >
        <Linkedin className="w-4 h-4" />
      </Button>

      <Button
        onClick={() => shareToSocial("whatsapp")}
        variant="outline"
        size="icon"
        title="Share on WhatsApp"
      >
        <MessageCircle className="w-4 h-4" />
      </Button>
    </div>
  );
}
