import { motion } from "framer-motion";
import { Heart, MessageCircle, Mail, Copy, Check, Users, Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShareWithFamilyProps {
  tipText?: string;
  articleTitle?: string;
  shareUrl?: string;
  className?: string;
}

export function ShareWithFamily({ tipText, articleTitle, shareUrl, className }: ShareWithFamilyProps) {
  const [copied, setCopied] = useState(false);

  const defaultText = tipText || "Check out these online safety tips to protect yourself and your family!";
  const url = shareUrl || "https://techtrendi.com/security";
  const title = articleTitle || "Stay Safe Online";

  const shareMessage = `${defaultText}\n\nLearn more: ${url}`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
  const smsUrl = `sms:?body=${encodeURIComponent(shareMessage)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(`${title} - Stay Safe Online`)}&body=${encodeURIComponent(shareMessage)}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const channels = [
    { label: "WhatsApp", icon: MessageCircle, href: whatsappUrl, color: "from-green-500 to-green-600", hoverColor: "hover:shadow-green-500/25" },
    { label: "SMS", icon: MessageCircle, href: smsUrl, color: "from-blue-500 to-blue-600", hoverColor: "hover:shadow-blue-500/25" },
    { label: "Email", icon: Mail, href: emailUrl, color: "from-purple-500 to-purple-600", hoverColor: "hover:shadow-purple-500/25" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border border-pink-500/20 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 p-5 md:p-6",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <motion.div
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Heart className="w-5 h-5 text-white" />
        </motion.div>
        <div>
          <h3 className="font-bold text-foreground text-sm">Share With Family</h3>
          <p className="text-xs text-muted-foreground">Help someone you care about stay safe</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {channels.map((channel, i) => {
          const Icon = channel.icon;
          return (
            <motion.a
              key={channel.label}
              href={channel.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white dark:bg-white/5 border border-border/50 hover:shadow-lg transition-all duration-200",
                channel.hoverColor
              )}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={cn("w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center", channel.color)}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-medium text-foreground">{channel.label}</span>
            </motion.a>
          );
        })}

        <motion.button
          onClick={copyToClipboard}
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white dark:bg-white/5 border border-border/50 hover:shadow-lg transition-all duration-200"
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
            {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
          </div>
          <span className="text-xs font-medium text-foreground">{copied ? "Copied!" : "Copy"}</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
