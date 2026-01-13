import { useState, useEffect } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface BookmarkButtonProps {
  articleId: string;
  articleTitle: string;
  variant?: "default" | "icon";
  className?: string;
}

export function BookmarkButton({ articleId, articleTitle, variant = "default", className }: BookmarkButtonProps) {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkBookmarkStatus();
    }
  }, [articleId, user]);

  const checkBookmarkStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", user.id)
        .eq("article_id", articleId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setIsBookmarked(!!data);
    } catch (error) {
      console.error("Error checking bookmark:", error);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      toast.error("Please log in to bookmark articles");
      return;
    }

    setLoading(true);
    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("article_id", articleId);

        if (error) throw error;

        setIsBookmarked(false);
        toast.success("Removed from bookmarks");
      } else {
        const { error } = await supabase
          .from("bookmarks")
          .insert({
            user_id: user.id,
            article_id: articleId,
            collection_name: "default",
          });

        if (error) throw error;

        await supabase.rpc("award_xp", { user_uuid: user.id, xp_amount: 5 });

        await supabase.from("user_activity").insert({
          user_id: user.id,
          activity_type: "bookmark",
          article_id: articleId,
          xp_earned: 5,
        });

        setIsBookmarked(true);
        toast.success("Bookmarked! +5 XP", { icon: "🔖" });
      }
    } catch (error) {
      console.error("Error bookmarking:", error);
      toast.error("Failed to bookmark");
    } finally {
      setLoading(false);
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleBookmark}
        disabled={loading}
        className={cn(
          "p-2 rounded-lg border border-border hover:border-primary/50 transition-all duration-200",
          "hover:scale-110 active:scale-95",
          isBookmarked && "bg-primary/10 border-primary text-primary",
          loading && "opacity-50 cursor-not-allowed",
          className
        )}
        title={isBookmarked ? "Remove bookmark" : "Bookmark article"}
      >
        {isBookmarked ? (
          <BookmarkCheck className="w-5 h-5" />
        ) : (
          <Bookmark className="w-5 h-5" />
        )}
      </button>
    );
  }

  return (
    <Button
      onClick={handleBookmark}
      disabled={loading}
      variant={isBookmarked ? "default" : "outline"}
      className={cn("gap-2", className)}
    >
      {isBookmarked ? (
        <>
          <BookmarkCheck className="w-4 h-4" />
          Bookmarked
        </>
      ) : (
        <>
          <Bookmark className="w-4 h-4" />
          Bookmark
        </>
      )}
    </Button>
  );
}
