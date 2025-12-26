import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Star, Zap, Shield, Download, Clock, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const benefits = [
  {
    icon: Shield,
    title: "Ad-Free Experience",
    description: "Browse without interruptions or distractions",
  },
  {
    icon: Zap,
    title: "Premium Tools",
    description: "Access exclusive tools not available to free users",
  },
  {
    icon: Download,
    title: "Downloadable Content",
    description: "Download guides and articles as PDFs",
  },
  {
    icon: Clock,
    title: "Early Access",
    description: "Be the first to try new features and content",
  },
];

export default function Premium() {
  const { user, subscription, checkSubscription } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isManaging, setIsManaging] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to subscribe to Premium",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsManaging(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast({
        title: "Error",
        description: "Failed to open subscription management. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsManaging(false);
    }
  };

  return (
    <Layout>
      <section className="py-20 bg-gradient-hero">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Crown className="w-4 h-4" />
              Premium Membership
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Unlock the Full{" "}
              <span className="text-gradient">TechTrendi</span> Experience
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Get unlimited access to premium tools, ad-free browsing, downloadable content, and early access to new features.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            {/* Pricing Card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary opacity-10 blur-3xl rounded-3xl" />
              <div className="relative bg-card border-2 border-primary rounded-2xl shadow-elevated overflow-hidden">
                {subscription.subscribed && (
                  <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Your Plan
                  </div>
                )}
                <div className="p-8 md:p-12">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                        TechTrendi Premium
                      </h2>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl md:text-5xl font-bold text-gradient">$4.99</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      {subscription.subscribed && subscription.subscriptionEnd && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Renews on {new Date(subscription.subscriptionEnd).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-3">
                      {!user ? (
                        <Button variant="hero" size="xl" asChild>
                          <Link to="/auth">Sign in to Subscribe</Link>
                        </Button>
                      ) : subscription.subscribed ? (
                        <Button
                          variant="outline"
                          size="xl"
                          onClick={handleManageSubscription}
                          disabled={isManaging}
                        >
                          {isManaging ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            "Manage Subscription"
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="hero"
                          size="xl"
                          onClick={handleSubscribe}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <Star className="w-5 h-5 mr-2" />
                              Subscribe Now
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={checkSubscription}
                        className="text-muted-foreground"
                      >
                        Refresh Status
                      </Button>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-border">
                    <h3 className="font-semibold text-foreground mb-4">
                      Everything included:
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {benefits.map((benefit) => (
                        <div key={benefit.title} className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <benefit.icon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{benefit.title}</h4>
                            <p className="text-sm text-muted-foreground">{benefit.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-foreground text-center mb-8">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold text-foreground mb-2">
                    Can I cancel anytime?
                  </h3>
                  <p className="text-muted-foreground">
                    Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
                  </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold text-foreground mb-2">
                    What payment methods do you accept?
                  </h3>
                  <p className="text-muted-foreground">
                    We accept all major credit cards, debit cards, and various local payment methods through our secure payment provider.
                  </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold text-foreground mb-2">
                    Is there a free trial?
                  </h3>
                  <p className="text-muted-foreground">
                    Our free tier gives you access to basic tools and content. Premium unlocks additional features and ad-free browsing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
