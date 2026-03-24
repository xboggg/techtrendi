import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ShieldAlert,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  MessageCircle,
  Mail,
  Phone,
  Globe,
  Banknote,
  Users,
  HelpCircle,
  ArrowRight,
  Heart,
  ShieldCheck,
  Eye,
  FileWarning,
  Lock,
} from "lucide-react";
import { Link } from "react-router-dom";

interface ScamReportForm {
  reporter_name: string;
  reporter_email: string;
  scam_type: string;
  title: string;
  description: string;
  source: string;
}

const scamTypes = [
  { value: "sms", label: "SMS / Text Message", icon: Smartphone },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "email", label: "Email", icon: Mail },
  { value: "phone_call", label: "Phone Call", icon: Phone },
  { value: "website", label: "Fake Website", icon: Globe },
  { value: "mobile_money", label: "Mobile Money", icon: Banknote },
  { value: "social_media", label: "Social Media", icon: Users },
  { value: "other", label: "Other", icon: HelpCircle },
];

const commonScams = [
  {
    icon: Banknote,
    title: "Mobile Money Fraud",
    description:
      "Scammers pretend to be MTN, Vodafone, or AirtelTigo agents and ask you to dial codes that transfer your money.",
    tip: "Never dial codes given to you by strangers. Your provider will never ask for your PIN.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Impersonation",
    description:
      "Someone hacks or clones a friend's WhatsApp and messages you urgently asking for money.",
    tip: "Always call the person directly on their phone number before sending any money.",
  },
  {
    icon: FileWarning,
    title: "Fake Bank Alerts",
    description:
      "You receive an SMS or email claiming your bank account has been compromised with a link to 'secure' it.",
    tip: "Banks never send links via SMS. Visit your bank's official app or branch directly.",
  },
  {
    icon: Globe,
    title: "Fake Job & Lottery Offers",
    description:
      "You're told you've won a lottery you never entered, or offered a high-paying job that asks for fees upfront.",
    tip: "Legitimate employers never ask for money upfront. If it sounds too good to be true, it is.",
  },
  {
    icon: Eye,
    title: "Phishing Links on Social Media",
    description:
      "Posts or DMs on Facebook, Instagram, or TikTok offering free data, giveaways, or shocking news that steal credentials.",
    tip: "Never click suspicious links. Check the URL carefully — scam sites misspell real website names.",
  },
];

const emptyForm: ScamReportForm = {
  reporter_name: "",
  reporter_email: "",
  scam_type: "",
  title: "",
  description: "",
  source: "",
};

const stats = [
  { label: "Reports this month", value: "120+" },
  { label: "Scams identified", value: "45" },
  { label: "People protected", value: "8K+" },
];

export default function ReportScam() {
  const [form, setForm] = useState<ScamReportForm>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (field: keyof ScamReportForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.scam_type || !form.title || !form.description) {
      toast.error("Please fill in the required fields: Scam Type, Title, and Description.");
      return;
    }

    if (form.reporter_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.reporter_email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("security_scam_reports").insert({
        reporter_name: form.reporter_name || null,
        reporter_email: form.reporter_email || null,
        scam_type: form.scam_type,
        scam_title: form.title.trim(),
        scam_description: form.description.trim(),
        scam_source: form.source.trim() || null,
      });

      if (error) throw error;
      setIsSubmitted(true);
      toast.success("Report submitted successfully!");
    } catch (err) {
      console.error("Error submitting scam report:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>Report a Scam | TechTrendi</title>
        <meta
          name="description"
          content="Report scams you've encountered to help protect others in Ghana. Your report makes the internet safer for everyone."
        />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-red-50 via-orange-50/50 to-background dark:from-red-950/40 dark:via-orange-950/20 dark:to-background border-b border-border/50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmOTczMTYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMS41Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-60 dark:opacity-30" />

        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500 dark:bg-red-600 shadow-lg shadow-red-500/20 dark:shadow-red-600/30 mb-6"
          >
            <ShieldAlert className="w-8 h-8 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-3xl md:text-5xl font-bold text-foreground mb-4"
          >
            Report a Scam
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="text-lg text-muted-foreground max-w-xl mx-auto mb-8"
          >
            Been targeted by a scam? Your report helps warn others and keeps the community safe.
            Report anonymously — no account needed.
          </motion.p>

          {/* Trust stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="flex items-center justify-center gap-8 md:gap-12"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Form + Sidebar layout */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="grid lg:grid-cols-[1fr_340px] gap-8 lg:gap-12">
          {/* Form */}
          <AnimatePresence mode="wait">
            {isSubmitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center text-center py-16 lg:py-24"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/15 mb-6"
                >
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                </motion.div>

                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                  Thank You for Reporting
                </h2>
                <p className="text-muted-foreground text-lg mb-2 max-w-md">
                  Your report has been submitted successfully. Our team will review it shortly.
                </p>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm mb-8">
                  <Heart className="w-4 h-4" />
                  <span>Your report helps protect others from falling victim</span>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setIsSubmitted(false);
                      setForm(emptyForm);
                    }}
                    variant="outline"
                  >
                    Report Another Scam
                  </Button>
                  <Button asChild>
                    <Link to="/scam-alerts">View Scam Alerts</Link>
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {/* Your info card */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-foreground">Your Information</h2>
                      <p className="text-xs text-muted-foreground">Optional — you can report anonymously</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="reporter_name" className="text-sm text-foreground">
                        Your Name
                      </Label>
                      <Input
                        id="reporter_name"
                        placeholder="e.g. Kwame"
                        value={form.reporter_name}
                        onChange={(e) => handleChange("reporter_name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reporter_email" className="text-sm text-foreground">
                        Email Address
                      </Label>
                      <Input
                        id="reporter_email"
                        type="email"
                        placeholder="e.g. kwame@email.com"
                        value={form.reporter_email}
                        onChange={(e) => handleChange("reporter_email", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Scam details card */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/15 flex items-center justify-center">
                      <FileWarning className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-foreground">Scam Details</h2>
                      <p className="text-xs text-muted-foreground">Tell us what happened — every detail helps</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm text-foreground">
                        Type of Scam <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={form.scam_type}
                        onValueChange={(val) => handleChange("scam_type", val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="How did the scam reach you?" />
                        </SelectTrigger>
                        <SelectContent>
                          {scamTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <span className="flex items-center gap-2">
                                <type.icon className="w-4 h-4 text-muted-foreground" />
                                {type.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="title" className="text-sm text-foreground">
                        Brief Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        placeholder='e.g. "MTN promo" SMS asking me to send money'
                        value={form.title}
                        onChange={(e) => handleChange("title", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="description" className="text-sm text-foreground">
                        Full Description <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Describe exactly what happened. Include any messages you received, what they asked you to do, and what happened next."
                        value={form.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                        rows={5}
                        className="resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="source" className="text-sm text-foreground">
                        Scam Source
                      </Label>
                      <Input
                        id="source"
                        placeholder="Phone number, email address, or website URL of the scammer"
                        value={form.source}
                        onChange={(e) => handleChange("source", e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        This helps us track and identify repeat scammers
                      </p>
                    </div>
                  </div>
                </div>

                {/* Privacy note + Submit */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Your report is confidential and helps protect the community</span>
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="lg"
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white shadow-sm px-8"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Report
                      </>
                    )}
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Sidebar — visible alongside the form */}
          <div className="space-y-6">
            {/* How it works */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="rounded-xl border border-border bg-card p-5"
            >
              <h3 className="font-semibold text-foreground mb-4">How it works</h3>
              <div className="space-y-4">
                {[
                  { step: "1", text: "Fill in the scam details — be as specific as possible" },
                  { step: "2", text: "Our team reviews and verifies the report" },
                  { step: "3", text: "Verified scams become public alerts to warn others" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center text-sm font-bold text-red-600 dark:text-red-400 flex-shrink-0">
                      {item.step}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed pt-0.5">{item.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Safety tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="rounded-xl border border-border bg-emerald-50/50 dark:bg-emerald-500/5 p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-foreground text-sm">Quick Safety Tips</h3>
              </div>
              <ul className="space-y-2.5">
                {[
                  "Never share your PIN, OTP, or password with anyone",
                  "If it sounds too good to be true, it probably is",
                  "Verify offers by calling the company directly",
                  "Don't click links in unexpected messages",
                  "Report suspicious activity immediately",
                ].map((tip, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Common Scams Section */}
      <section className="border-t border-border bg-muted/30 dark:bg-muted/10">
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-700 dark:text-orange-400 text-sm font-medium mb-4">
              <AlertTriangle className="w-3.5 h-3.5" />
              Stay Informed
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Common Scams in Ghana
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              The most reported scams targeting people in Ghana. Learn to recognise them so you don't fall victim.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {commonScams.map((scam, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="group rounded-xl border border-border bg-card p-5 hover:shadow-md hover:border-border/80 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                  <scam.icon className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{scam.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{scam.description}</p>
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">{scam.tip}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center mt-10"
          >
            <Button asChild variant="outline" className="gap-2">
              <Link to="/scam-alerts">
                View Active Scam Alerts
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
