import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Send, Loader2, Reply } from "lucide-react";

/**
 * Open (no-login) comments under news/blog articles.
 *
 * SECURITY (defence in depth):
 *  - DB enforces: anon can only SELECT (status='visible') + INSERT — no UPDATE/
 *    DELETE/TRUNCATE (see RLS policies). Only admin/service-role can moderate.
 *  - Length limits enforced both client-side AND by DB CHECK constraints.
 *  - Honeypot field catches naive bots (humans never fill it).
 *  - Comments with links/spam patterns are flagged for review (status set to
 *    'flagged' so they DON'T show publicly until the admin approves).
 *  - Rendered as PLAIN TEXT (React escapes) — never dangerouslySetInnerHTML —
 *    so a comment can't inject scripts/HTML (no stored XSS).
 *  - Simple client-side rate-limit via localStorage (last-post timestamp).
 */

interface CommentRow {
  id: string;
  name: string;
  comment: string;
  parent_id: string | null;
  created_at: string;
}

const NAME_MAX = 50;
const COMMENT_MAX = 1000;
const RATE_LIMIT_MS = 30_000; // one comment per 30s from this browser
const LINK_RE = /(https?:\/\/|www\.|\b\w+\.(com|net|org|info|xyz|click|shop|biz)\b)/i;
const SPAM_RE = /\b(viagra|casino|crypto.?giveaway|loan|forex|bet9ja|porn|nude|f\*?u?ck|\$\$\$)\b/i;

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function CommentsBox({ slug, type }: { slug: string; type: "blog" | "news" }) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — must stay empty
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("comments")
        .select("id, name, comment, parent_id, created_at")
        .eq("article_slug", slug)
        .eq("status", "visible")
        .order("created_at", { ascending: true })
        .limit(300);
      setComments((data as CommentRow[]) || []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);

    // Honeypot: a bot filled the hidden field — silently pretend success, drop it.
    if (website.trim()) {
      setNotice({ kind: "ok", msg: "Thanks! Your comment has been posted." });
      setName(""); setText(""); setReplyTo(null);
      return;
    }

    const n = name.trim();
    const c = text.trim();
    if (n.length < 1 || n.length > NAME_MAX) { setNotice({ kind: "err", msg: "Please enter a name (1–50 characters)." }); return; }
    if (c.length < 2 || c.length > COMMENT_MAX) { setNotice({ kind: "err", msg: `Comment must be 2–${COMMENT_MAX} characters.` }); return; }

    // Client-side rate limit
    const last = Number(localStorage.getItem("tt_last_comment") || 0);
    if (Date.now() - last < RATE_LIMIT_MS) {
      setNotice({ kind: "err", msg: "Please wait a moment before commenting again." });
      return;
    }

    // Comments with links or spam keywords are flagged (hidden until admin approves).
    const flagged = LINK_RE.test(c) || SPAM_RE.test(c) || SPAM_RE.test(n);
    const status = flagged ? "flagged" : "visible";

    setSubmitting(true);
    try {
      const { error } = await supabase.from("comments").insert({
        article_slug: slug,
        article_type: type,
        name: n,
        comment: c,
        parent_id: replyTo?.id || null,
        status,
      });
      if (error) throw error;
      localStorage.setItem("tt_last_comment", String(Date.now()));
      setName(""); setText(""); setReplyTo(null);
      if (flagged) {
        setNotice({ kind: "ok", msg: "Thanks! Your comment was submitted and will appear after a quick review." });
      } else {
        setNotice({ kind: "ok", msg: "Thanks! Your comment has been posted." });
        await load();
      }
    } catch {
      setNotice({ kind: "err", msg: "Sorry, something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const parents = comments.filter((c) => !c.parent_id);
  const repliesOf = (id: string) => comments.filter((c) => c.parent_id === id);

  return (
    <section className="mt-12 pt-8 border-t border-border">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">
          Comments {comments.length > 0 && <span className="text-muted-foreground font-normal">({comments.length})</span>}
        </h2>
      </div>

      {/* Comment form */}
      <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-4 md:p-5 mb-8">
        {replyTo && (
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Replying to <strong className="text-foreground">{replyTo.name}</strong></span>
            <button type="button" onClick={() => setReplyTo(null)} className="text-primary hover:underline">Cancel</button>
          </div>
        )}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={NAME_MAX}
          placeholder="Your name"
          className="w-full mb-3 px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Your name"
        />
        {/* Honeypot — hidden from humans, bots tend to fill it */}
        <input
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={COMMENT_MAX}
          rows={3}
          placeholder="Share your thoughts… (be respectful)"
          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
          aria-label="Your comment"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted-foreground">{text.length}/{COMMENT_MAX}</span>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {replyTo ? "Reply" : "Post comment"}
          </button>
        </div>
        {notice && (
          <p className={`mt-3 text-sm ${notice.kind === "ok" ? "text-emerald-600" : "text-red-600"}`}>{notice.msg}</p>
        )}
      </form>

      {/* Comment list */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin inline" /></div>
      ) : parents.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground text-sm">No comments yet. Be the first to share your thoughts.</p>
      ) : (
        <div className="space-y-5">
          {parents.map((c) => (
            <div key={c.id}>
              <CommentItem c={c} onReply={() => setReplyTo({ id: c.id, name: c.name })} />
              {repliesOf(c.id).length > 0 && (
                <div className="ml-6 md:ml-10 mt-3 space-y-3 border-l-2 border-border pl-4">
                  {repliesOf(c.id).map((r) => <CommentItem key={r.id} c={r} />)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CommentItem({ c, onReply }: { c: CommentRow; onReply?: () => void }) {
  const initial = c.name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {/* Rendered as plain text — React escapes, so no XSS from comment content */}
          <span className="font-semibold text-foreground text-sm">{c.name}</span>
          <span className="text-xs text-muted-foreground">· {timeAgo(c.created_at)}</span>
        </div>
        <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{c.comment}</p>
        {onReply && (
          <button onClick={onReply} className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
            <Reply className="w-3 h-3" /> Reply
          </button>
        )}
      </div>
    </div>
  );
}

export default CommentsBox;
