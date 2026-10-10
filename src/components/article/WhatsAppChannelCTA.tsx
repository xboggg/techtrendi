import { MessageCircle } from "lucide-react";

/**
 * "Follow on WhatsApp" box for the end of articles and news posts.
 *
 * The channel link previously appeared only in the footer, on /contact and in
 * the newsletter archive — places a reader who just finished an article never
 * looks. Readers here are overwhelmingly on WhatsApp, so this is the most
 * realistic way to turn a one-off visit into a returning one. The newsletter
 * has 17 subscribers; the channel costs a reader one tap.
 */

// Same channel used in Footer.tsx, Contact.tsx and NewsletterArchive.tsx.
export const WHATSAPP_CHANNEL_URL =
  "https://whatsapp.com/channel/0029VbCB3R6H5JLt1aJYIT2d";

interface WhatsAppChannelCTAProps {
  className?: string;
}

export function WhatsAppChannelCTA({ className = "" }: WhatsAppChannelCTAProps) {
  return (
    <aside
      className={`rounded-2xl border border-[#25D366]/25 bg-[#25D366]/5 p-5 sm:p-6 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="shrink-0 grid place-items-center w-11 h-11 rounded-xl bg-[#25D366]/15">
            <MessageCircle className="w-5 h-5 text-[#25D366]" />
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground leading-snug">
              Get this on WhatsApp
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Daily tech news, scam alerts and tools built for Ghana.
            </p>
          </div>
        </div>

        <a
          href={WHATSAPP_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] text-white font-medium text-sm hover:bg-[#1ebe5a] transition-colors focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 focus:ring-offset-background"
        >
          <MessageCircle className="w-4 h-4" />
          Follow the channel
        </a>
      </div>
    </aside>
  );
}

export default WhatsAppChannelCTA;
