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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Shield,
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
} from "lucide-react";

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
    emoji: "💸",
    title: "Mobile Money Fraud",
    description:
      "Scammers pretend to be MTN, Vodafone, or AirtelTigo agents and ask you to dial codes that transfer your money. They may claim you've won a promo or need to 'verify' your account.",
    tip: "Never dial codes given to you by strangers. Your mobile money provider will never ask for your PIN.",
    gradient: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/30",
  },
  {
    emoji: "📱",
    title: "WhatsApp Impersonation",
    description:
      "Someone hacks or clones a friend's WhatsApp and messages you urgently asking for money. The profile picture and name look real.",
    tip: "Always call the person directly on their phone number before sending any money.",
    gradient: "from-green-500/20 to-emerald-500/20",
    border: "border-green-500/30",
  },
  {
    emoji: "🏦",
    title: "Fake Bank Alerts",
    description:
      "You receive an SMS or email claiming your bank account has been compromised and you need to click a link to 'secure' it. The link leads to a fake website.",
    tip: "Banks never send links via SMS. Visit your bank's official app or branch directly.",
    gradient: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/30",
  },
  {
    emoji: "🎁",
    title: "Fake Job & Lottery Offers",
    description:
      "You're told you've won a lottery you never entered, or offered a high-paying job. They ask for 'processing fees' or personal documents upfront.",
    tip: "Legitimate employers and lotteries never ask for money upfront. If it sounds too good to be true, it is.",
    gradient: "from-purple-500/20 to-pink-500/20",
    border: "border-purple-500/30",
  },
  {
    emoji: "🔗",
    title: "Phishing Links on Social Media",
    description:
      "Posts or DMs on Facebook, Instagram, or TikTok offering free data, giveaways, or shocking news. Clicking the link steals your login credentials.",
    tip: "Never click suspicious links. Check the URL carefully -- scam sites often misspell the real website name.",
    gradient: "from-red-500/20 to-rose-500/20",
    border: "border-red-500/30",
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
        title: form.title.trim(),
        description: form.description.trim(),
        source: form.source.trim() || null,
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <Layout>
      <Helmet>
        <title>Report a Scam | TechTrendi</title>
        <meta
          name="description"
          content="Report scams you've encountered to help protect others in Ghana and beyond. Your report makes the internet safer for everyone."
        />
      </Helmet>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/40 via-orange-900/30 to-yellow-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />

        <div className="relative max-w-4xl mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/25 mb-6"
          >
            <ShieldAlert className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent mb-4"
          >
            Report a Scam
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="text-lg text-gray-300 max-w-2xl mx-auto"
          >
            Have you been targeted by a scam? Your report helps us warn others and keep the community safe.
            You can report anonymously -- no account needed.
          </motion.p>
        </div>
      </section>

      {/* Form Section */}
      <section className="relative max-w-3xl mx-auto px-4 py-12 -mt-4">
        <AnimatePresence mode="wait">
          {isSubmitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="text-center py-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/25 mb-6"
              >
                <CheckCircle2 className="w-12 h-12 text-white" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold text-white mb-3"
              >
                Thank You!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-300 text-lg mb-2"
              >
                Your report has been submitted successfully.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 mb-8"
              >
                <Heart className="w-4 h-4" />
                <span>Your report helps protect others from falling victim</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <Button
                  onClick={() => {
                    setIsSubmitted(false);
                    setForm(emptyForm);
                  }}
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
                >
                  Report Another Scam
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <motion.div
                variants={itemVariants}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm p-6 md:p-8"
              >
                <h2 className="text-xl font-semibold text-white mb-1">Your Information</h2>
                <p className="text-sm text-gray-400 mb-5">Optional -- you can report anonymously</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reporter_name" className="text-gray-300">
                      Your Name
                    </Label>
                    <Input
                      id="reporter_name"
                      placeholder="e.g. Kwame"
                      value={form.reporter_name}
                      onChange={(e) => handleChange("reporter_name", e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50 focus:ring-orange-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reporter_email" className="text-gray-300">
                      Email Address
                    </Label>
                    <Input
                      id="reporter_email"
                      type="email"
                      placeholder="e.g. kwame@email.com"
                      value={form.reporter_email}
                      onChange={(e) => handleChange("reporter_email", e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50 focus:ring-orange-500/20"
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm p-6 md:p-8"
              >
                <h2 className="text-xl font-semibold text-white mb-1">Scam Details</h2>
                <p className="text-sm text-gray-400 mb-5">
                  Tell us what happened -- every detail helps
                </p>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-gray-300">
                      Type of Scam <span className="text-red-400">*</span>
                    </Label>
                    <Select
                      value={form.scam_type}
                      onValueChange={(val) => handleChange("scam_type", val)}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-orange-500/20">
                        <SelectValue placeholder="How did the scam reach you?" />
                      </SelectTrigger>
                      <SelectContent>
                        {scamTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <span className="flex items-center gap-2">
                              <type.icon className="w-4 h-4" />
                              {type.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-gray-300">
                      Brief Title <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder='e.g. "MTN promo" SMS asking me to send money'
                      value={form.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50 focus:ring-orange-500/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-gray-300">
                      Full Description <span className="text-red-400">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describe exactly what happened. Include any messages you received, what they asked you to do, and what happened next."
                      value={form.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      rows={5}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50 focus:ring-orange-500/20 resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="source" className="text-gray-300">
                      Scam Source
                    </Label>
                    <Input
                      id="source"
                      placeholder="Phone number, email address, or website URL of the scammer"
                      value={form.source}
                      onChange={(e) => handleChange("source", e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-orange-500/50 focus:ring-orange-500/20"
                    />
                    <p className="text-xs text-gray-500">
                      This helps us track and identify repeat scammers
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="lg"
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-500/20 px-8"
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
              </motion.div>
            </motion.form>
          )}
        </AnimatePresence>
      </section>

      {/* Common Scams Section */}
      <section className="relative max-w-5xl mx-auto px-4 py-16">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-900/5 to-transparent pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium mb-4">
            <AlertTriangle className="w-4 h-4" />
            Stay Informed
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Common Scams in Ghana
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            These are the most reported scams targeting people in Ghana. Learn to recognise them
            so you don't fall victim.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-5"
        >
          {commonScams.map((scam, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ scale: 1.01, y: -2 }}
              className={cn(
                "rounded-2xl border backdrop-blur-sm p-6 bg-gradient-to-r transition-shadow hover:shadow-lg",
                scam.gradient,
                scam.border
              )}
            >
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <span className="text-4xl flex-shrink-0">{scam.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-2">{scam.title}</h3>
                  <p className="text-gray-300 mb-3 leading-relaxed">{scam.description}</p>
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-black/20">
                    <Shield className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-400 font-medium">{scam.tip}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-10"
        >
          <a
            href="/scam-alerts"
            className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 font-medium transition-colors"
          >
            View Active Scam Alerts
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </section>
    </Layout>
  );
}
