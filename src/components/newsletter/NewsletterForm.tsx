import { useState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NewsletterFormProps {
  variant?: "default" | "footer" | "inline";
  className?: string;
}

export function NewsletterForm({ variant = "default", className }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from("newsletter_subscribers")
        .select("id, status")
        .eq("email", email)
        .single();

      if (existing) {
        if (existing.status === "active") {
          toast.error("You're already subscribed!");
          setLoading(false);
          return;
        } else {
          await supabase
            .from("newsletter_subscribers")
            .update({ status: "active", subscribed_at: new Date().toISOString() })
            .eq("email", email);
        }
      } else {
        const { error } = await supabase
          .from("newsletter_subscribers")
          .insert({ email, status: "active" });

        if (error) throw error;
      }

      setSubscribed(true);
      setEmail("");
      toast.success("Successfully subscribed! 🎉");
    } catch (error) {
      console.error("Error subscribing:", error);
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className={cn("flex items-center gap-2 text-green-600", className)}>
        <CheckCircle2 className="w-5 h-5" />
        <span className="text-sm font-medium">Thanks for subscribing!</span>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <form onSubmit={handleSubmit} className={cn("flex gap-2", className)}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="flex-1 px-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={loading}
        />
        <Button type="submit" disabled={loading}>
          {loading ? "..." : "Subscribe"}
        </Button>
      </form>
    );
  }

  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit} className={cn("w-full", className)}>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="flex-1 px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={loading}
          />
          <Button type="submit" size="lg" disabled={loading} className="gap-2">
            <Mail className="w-4 h-4" />
            {loading ? "Subscribing..." : "Subscribe"}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className={cn("p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20", className)}>
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-primary/10">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-foreground mb-1">Get Weekly Tech Tips</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Join 10,000+ readers getting expert tech insights delivered to their inbox.
          </p>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            />
            <Button type="submit" disabled={loading}>
              {loading ? "..." : "Subscribe"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
