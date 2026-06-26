import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Link } from "react-router-dom";
import { Bookmark, Clock, Trash2, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Matches the shape saved by <BookmarkButton> (src/components/ui/bookmark-system.tsx).
interface SavedArticle {
  id: string;
  type: "article" | "review" | "tool" | "news" | "blog";
  title: string;
  url: string;
  excerpt?: string;
  image?: string;
  savedAt: string;
}

// SAME localStorage key the bookmark button writes to. (Previously this page
// read a different key — 'tt:reading-list' — so it was always empty.)
const STORAGE_KEY = "techtrendi_bookmarks";

export default function ReadingList() {
  const [saved, setSaved] = useState<SavedArticle[]>([]);

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setSaved(Array.isArray(data) ? data.sort((a: SavedArticle, b: SavedArticle) =>
        new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      ) : []);
    } catch {
      setSaved([]);
    }
  }, []);

  const remove = (id: string) => {
    const updated = saved.filter(a => a.id !== id);
    setSaved(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const clearAll = () => {
    setSaved([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <Layout>
      <SEOHead
        title="My Reading List"
        description="Your saved TechTrendi articles and news items for reading later."
        canonical="/reading-list"
      />

      <div className="container max-w-3xl mx-auto px-4 py-16 md:py-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bookmark className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Reading List</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              {saved.length > 0 ? `${saved.length} saved article${saved.length === 1 ? "" : "s"}` : "No saved articles yet"}
            </p>
          </div>
          {saved.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll} className="text-destructive hover:text-destructive gap-2">
              <Trash2 className="w-4 h-4" /> Clear all
            </Button>
          )}
        </div>

        {saved.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Your reading list is empty</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              Save articles while browsing by clicking the bookmark icon on any article or news item.
            </p>
            <div className="flex justify-center gap-3">
              <Button asChild variant="default">
                <Link to="/blog">Browse Articles <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/news">Latest News</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {saved.map((article) => (
              <div key={article.id} className="flex items-start gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-all group">
                {article.image && (
                  <Link to={article.url} className="shrink-0 w-20 h-16 rounded-lg overflow-hidden bg-muted hidden sm:block">
                    <img src={article.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </Link>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full capitalize">{article.type}</span>
                  </div>
                  <Link
                    to={article.url}
                    className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 block"
                  >
                    {article.title}
                  </Link>
                  {article.excerpt && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{article.excerpt}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Saved {new Date(article.savedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => remove(article.id)}
                  className="shrink-0 p-1.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove from reading list"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
