import { useState, useMemo, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Share2,
  MessageSquare,
  Mail,
  Smartphone,
  Clock,
  Eye,
  Lightbulb,
  HelpCircle,
  Trophy,
} from "lucide-react";

interface QuizMessage {
  id: number;
  type: "SMS" | "WhatsApp" | "Email";
  from: string;
  text: string;
  time: string;
  isScam: boolean;
  explanation: string;
  verdictEmoji: string;
}

type Screen = "intro" | "quiz" | "results";

const allQuestions: QuizMessage[] = [
  {
    id: 1,
    type: "SMS",
    from: "MTN-PROMO",
    text: "Congratulations! Your MTN MoMo number has been selected for our Loyalty Cashback of GHS 2,500.00. To claim, dial *170# and enter your MoMo PIN when prompted. Ref: MTN/CB/2026. Expires today!",
    time: "9:14 AM",
    isScam: true,
    explanation:
      "MTN will never ask you to enter your MoMo PIN via an unsolicited message. Legitimate promotions never require your PIN. This is a classic phishing scam designed to steal your mobile money.",
    verdictEmoji: "\u{1F6A8}",
  },
  {
    id: 2,
    type: "SMS",
    from: "Ecobank",
    text: "Debit Alert: GHS 150.00 debited from your account ending 4821 on 18/03/2026 at SHOPRITE ACCRA MALL. Bal: GHS 1,230.45. Ref: ECB90234871.",
    time: "2:35 PM",
    isScam: false,
    explanation:
      "This is a standard debit notification from Ecobank. It contains a valid reference number, specific merchant details, and your masked account number. It does not ask for any personal information or action.",
    verdictEmoji: "\u2705",
  },
  {
    id: 3,
    type: "WhatsApp",
    from: "+1 (650) 555-0199",
    text: "WhatsApp Support: Your account has been flagged for unusual activity. To prevent suspension, please reply with your 6-digit verification code sent to your phone. Failure to respond within 1 hour will result in permanent ban.",
    time: "11:02 AM",
    isScam: true,
    explanation:
      "WhatsApp never contacts users via WhatsApp messages from random numbers. They will never ask for your verification code. Sharing your 6-digit code gives attackers full access to your account.",
    verdictEmoji: "\u{1F6A8}",
  },
  {
    id: 4,
    type: "Email",
    from: "no-reply@gra.gov.gh",
    text: "Dear Taxpayer, this is to confirm that your 2025 Annual Tax Filing (TIN: P00XXXXX89) has been received by the Ghana Revenue Authority. Your assessment will be processed within 15 working days. For enquiries, visit gra.gov.gh or call 0800-100-110.",
    time: "8:00 AM",
    isScam: false,
    explanation:
      "This is a legitimate informational email from GRA. It references your masked TIN, provides official contact information, and does not ask for personal details, payments, or clicks on suspicious links.",
    verdictEmoji: "\u2705",
  },
  {
    id: 5,
    type: "SMS",
    from: "SSNIT-GH",
    text: "URGENT: Your SSNIT pension record shows a GHS 4,200 discrepancy. To correct this before the March deadline, send GHS 85 processing fee via MoMo to 0244-XXX-XXX. Reference your SSNIT number.",
    time: "10:47 AM",
    isScam: true,
    explanation:
      "SSNIT never requests payments via mobile money to personal numbers. Government agencies use official payment channels. The urgency and request for mobile money transfer are classic scam tactics.",
    verdictEmoji: "\u{1F6A8}",
  },
  {
    id: 6,
    type: "WhatsApp",
    from: "Boss (New Number)",
    text: "Hi, this is Mr. Mensah. I changed my number. I'm in a meeting and need you to buy 3 MTN scratch cards of GHS 100 each urgently. Send the codes here. I'll reimburse you after the meeting.",
    time: "1:23 PM",
    isScam: true,
    explanation:
      "This is a 'boss fraud' or CEO impersonation scam. Scammers pretend to be your boss from a new number, create urgency with a meeting, and ask for scratch cards or mobile money. Always verify through the original known number.",
    verdictEmoji: "\u{1F6A8}",
  },
  {
    id: 7,
    type: "SMS",
    from: "GCB-BANK",
    text: "Transfer Alert: GHS 500.00 CR to your GCB account ending 3156 from JOHN K MENSAH on 18/03/2026 14:22. New Bal: GHS 2,780.00. Ref: GCB78456123.",
    time: "2:22 PM",
    isScam: false,
    explanation:
      "This is a legitimate credit alert from GCB Bank. It includes proper formatting, masked account number, sender name, timestamp, and a reference number. It does not request any action from you.",
    verdictEmoji: "\u2705",
  },
  {
    id: 8,
    type: "Email",
    from: "careers@shell-ghana-hiring.com",
    text: "Shell Ghana is hiring remote Data Entry Clerks! Earn GHS 8,000/month working from home. No experience needed. Send your CV, full name, date of birth, Ghana Card number, and MoMo details to apply. Limited slots available!",
    time: "6:15 AM",
    isScam: true,
    explanation:
      "Shell would never use a non-official domain like 'shell-ghana-hiring.com'. The unrealistic salary, no experience requirement, and request for sensitive personal information (Ghana Card, MoMo details) are all major red flags.",
    verdictEmoji: "\u{1F6A8}",
  },
  {
    id: 9,
    type: "Email",
    from: "billing@vodafone.com.gh",
    text: "Dear Customer, your Vodafone postpaid bill for March 2026 is ready. Amount due: GHS 89.50. Payment deadline: 28 March 2026. View your bill at My Vodafone App or visit any Vodafone shop. Thank you.",
    time: "7:30 AM",
    isScam: false,
    explanation:
      "This is a legitimate billing notification from Vodafone. It comes from the official domain, references a specific billing period and amount, and directs you to official channels (app or shop) rather than suspicious links.",
    verdictEmoji: "\u2705",
  },
  {
    id: 10,
    type: "SMS",
    from: "PASSPORT-GH",
    text: "Ghana Passport Office: Your passport application GHP-2026-XXXX is ready for collection. Pay the GHS 150 expedited fee via MoMo to 0553-XXX-XXX to schedule priority pickup. Reply YES to proceed.",
    time: "3:45 PM",
    isScam: true,
    explanation:
      "The Ghana Passport Office does not collect payments via MoMo to personal numbers. Official fees are paid through designated bank channels. The personal mobile money number is a clear sign of a scam.",
    verdictEmoji: "\u{1F6A8}",
  },
  {
    id: 11,
    type: "SMS",
    from: "AirtelTigo",
    text: "You have received GHS 50 in your AirtelTigo Money wallet from AKOSUA D. New Balance: GHS 173.20. Dial *110# for help. Thank you for choosing AirtelTigo Money.",
    time: "9:41 AM",
    isScam: false,
    explanation:
      "This is a standard mobile money credit alert. It names the sender, states the exact new balance, and provides the official help shortcode. It asks for no action or information from you.",
    verdictEmoji: "✅",
  },
  {
    id: 12,
    type: "WhatsApp",
    from: "+233 55 XXX XXXX",
    text: "Good day. I am Mrs. Patricia from the Bank of Ghana Unclaimed Funds Dept. Records show you are owed an inheritance of $850,000 USD from a deceased account holder with your surname. Contact me directly with your full name, ID, and a processing fee of GHS 300 to release the funds.",
    time: "4:12 PM",
    isScam: true,
    explanation:
      "The Bank of Ghana does not manage 'unclaimed inheritance' payouts or contact people over WhatsApp. Any message asking for an upfront 'processing fee' before releasing a large sum is the classic advance-fee (419) scam.",
    verdictEmoji: "\u{1F6A8}",
  },
  {
    id: 13,
    type: "Email",
    from: "no-reply@jumia.com.gh",
    text: "Your Jumia order #GH-88213-A (Samsung Earbuds) has been shipped and is expected to arrive within 2-3 business days. Track your order in the Jumia App under 'My Orders'. Thank you for shopping with Jumia.",
    time: "11:20 AM",
    isScam: false,
    explanation:
      "This is a routine shipping confirmation from an official Jumia domain. It references a specific order number and item, and directs you to check status inside the official app rather than an external link.",
    verdictEmoji: "✅",
  },
  {
    id: 14,
    type: "SMS",
    from: "DHL-EXPRESS",
    text: "DHL: Your parcel is on hold at customs due to unpaid clearance fee of GHS 45. Pay now via link to avoid return: dhl-gh-clearance.info/pay Failure to pay within 24hrs will result in disposal.",
    time: "12:03 PM",
    isScam: true,
    explanation:
      "DHL does not collect customs clearance fees through random short links with unofficial domains. The fake urgency ('24hrs or disposal') combined with a non-DHL domain (dhl-gh-clearance.info) is a textbook parcel/delivery phishing scam.",
    verdictEmoji: "\u{1F6A8}",
  },
  {
    id: 15,
    type: "WhatsApp",
    from: "Ama ❤️",
    text: "Hey love, it's so good talking to you these past weeks. I finally got my visa approved to visit you in Ghana! I just need help with a GHS 1,200 flight booking fee, I'll pay you back the moment I land. You're the only one I can ask.",
    time: "8:55 PM",
    isScam: true,
    explanation:
      "This is a classic romance scam pattern: an online-only relationship, a sudden travel plan, and an urgent request for money for something that 'requires' your help before they can meet you in person. Never send money to someone you haven't met face-to-face.",
    verdictEmoji: "\u{1F6A8}",
  },
  {
    id: 16,
    type: "SMS",
    from: "ECG-GH",
    text: "Dear Customer, your prepaid meter (Acct: 041XXXXX) balance is low: GHS 8.50 remaining. Top up via ECG Power App, *880#, or any GT Bank/Momo agent to avoid disconnection.",
    time: "6:00 AM",
    isScam: false,
    explanation:
      "This is a standard low-balance reminder from ECG's automated system. It gives official top-up channels (the ECG app, USSD code, and known bank/agent networks), not a personal number or suspicious link.",
    verdictEmoji: "✅",
  },
  {
    id: 17,
    type: "Email",
    from: "support@binance-ghana-bonus.net",
    text: "Congratulations! You've been selected in our Binance Ghana Community Airdrop. Claim your free 0.5 BTC bonus now by connecting your wallet and verifying with a small gas fee of GHS 120. Offer expires in 6 hours.",
    time: "2:47 AM",
    isScam: true,
    explanation:
      "Binance does not run 'community airdrops' requiring you to pay a gas fee to claim free Bitcoin, and this email doesn't come from Binance's real domain. Any crypto giveaway that asks you to pay first to receive a bigger reward is a scam.",
    verdictEmoji: "\u{1F6A8}",
  },
  {
    id: 18,
    type: "SMS",
    from: "NLA-GH",
    text: "National Lottery Authority Notice: NLA licenses are renewed annually for registered lotto operators. For verification of your operator license, visit any NLA regional office with your documents. No online renewal available.",
    time: "10:15 AM",
    isScam: false,
    explanation:
      "This reads like a genuine administrative notice from the National Lottery Authority directing people to a physical office for verification, with no request for payment, PINs, or personal banking details.",
    verdictEmoji: "✅",
  },
  {
    id: 19,
    type: "WhatsApp",
    from: "Ghana Police Cyber Unit",
    text: "ALERT: This number has been reported for cybercrime activity under investigation ref GPS/CID/2026/0091. To avoid arrest, you must clear your name by paying a GHS 500 verification bond via MoMo within 2 hours.",
    time: "3:30 PM",
    isScam: true,
    explanation:
      "The Ghana Police Service does not investigate or notify suspects over WhatsApp, and never asks for a 'bond' payment via mobile money to 'avoid arrest'. This impersonation scam relies purely on fear and urgency.",
    verdictEmoji: "\u{1F6A8}",
  },
  {
    id: 20,
    type: "SMS",
    from: "MTN-GH",
    text: "Your MTN data bundle (2GB, 30 days) purchase of GHS 15.00 was successful. Balance: GHS 3.20. Dial *138# to buy more bundles. Enjoy!",
    time: "1:05 PM",
    isScam: false,
    explanation:
      "This is a routine, automated purchase confirmation with a specific bundle size, amount, remaining balance, and an official USSD shortcode. There is nothing asking you to click, reply, or share information.",
    verdictEmoji: "✅",
  },
  {
    id: 21,
    type: "Email",
    from: "hr@vodafone-ghana-recruitment.com",
    text: "Your CV has been shortlisted for a Customer Service role at Vodafone Ghana (Remote, GHS 6,500/month). To confirm your interview slot, complete the attached form with your Ghana Card number, bank account, and a GHS 250 'training kit' fee.",
    time: "5:40 PM",
    isScam: true,
    explanation:
      "Legitimate employers never charge candidates a fee for a 'training kit' before hiring, and this comes from a lookalike domain, not vodafone.com.gh. Combined with a request for your Ghana Card and bank details upfront, this is a job scam.",
    verdictEmoji: "\u{1F6A8}",
  },
  {
    id: 22,
    type: "SMS",
    from: "GhanaCard-NIA",
    text: "Reminder: Your Ghana Card renewal appointment is scheduled for 22/04/2026 at the East Legon NIA office. Bring your old card and proof of address. Visit nia.gov.gh for full requirements.",
    time: "7:15 AM",
    isScam: false,
    explanation:
      "This is a plausible appointment reminder that directs you to the real NIA domain and a physical office for verification, without asking for payment, PINs, or personal data over SMS.",
    verdictEmoji: "✅",
  },
  {
    id: 23,
    type: "WhatsApp",
    from: "Unknown",
    text: "\u{1F3B0} MEGA BETTING TIP: Our insider at SportyBet has leaked tonight's fixed match odds. Guaranteed win! Pay GHS 100 to unlock the code and multiply your stake 10x before kickoff. Slots limited!",
    time: "6:50 PM",
    isScam: true,
    explanation:
      "There is no such thing as a legitimate 'insider leak' or guaranteed fixed betting odds. This is a common betting scam that gets you to pay for a worthless 'code' by promising an impossible guaranteed win.",
    verdictEmoji: "\u{1F6A8}",
  },
  {
    id: 24,
    type: "Email",
    from: "noreply@waec.gov.gh",
    text: "Dear Candidate, your WASSCE 2026 results checker PIN and Serial Number have been sent to your registered phone number. Use them at ghana.waecdirect.org to check your results. Do not share your PIN with anyone.",
    time: "9:00 AM",
    isScam: false,
    explanation:
      "This is a standard WAEC notification directing candidates to the real, well-known results-checking domain, and it explicitly warns you not to share your PIN — the opposite behavior of a scam.",
    verdictEmoji: "✅",
  },
  {
    id: 25,
    type: "SMS",
    from: "WAEC-RESULTS",
    text: "WAEC: Your ward's result shows an irregularity that can be cleared before publication. Send GHS 200 to Agent Kofi on 024-XXX-XXXX today to avoid cancellation of the entire result.",
    time: "8:20 AM",
    isScam: true,
    explanation:
      "WAEC does not clear 'irregularities' via SMS or accept payments to a personal agent's mobile money number. This preys on parents' anxiety around exam results and is a well-known WASSCE season scam.",
    verdictEmoji: "\u{1F6A8}",
  },
  {
    id: 26,
    type: "WhatsApp",
    from: "School Bursar's Office",
    text: "Good afternoon parents, kindly note the new school fees payment account has changed due to a bank migration. Please send this term's fees to the new MoMo number 054-XXX-XXXX (Mr. Boateng) instead of the usual bank account.",
    time: "3:00 PM",
    isScam: true,
    explanation:
      "A sudden 'account has changed, pay to this MoMo number instead' message is a very common scam targeting parents, especially via hacked or spoofed school WhatsApp groups. Always verify fee payment changes by calling the school directly on a known number.",
    verdictEmoji: "\u{1F6A8}",
  },
  {
    id: 27,
    type: "Email",
    from: "statements@stanbicbank.com.gh",
    text: "Dear Customer, your Stanbic Bank monthly e-statement for March 2026 is now available. Log in to Stanbic Online Banking or the mobile app to view and download it. This is an automated message; please do not reply.",
    time: "6:30 AM",
    isScam: false,
    explanation:
      "This is a routine e-statement notice from a legitimate bank domain, directing you to log in through the official app or website rather than clicking an embedded link, and not requesting any information.",
    verdictEmoji: "✅",
  },
  {
    id: 28,
    type: "SMS",
    from: "+233 20 XXX XXXX",
    text: "CONGRATULATIONS! Your number has WON GHS 15,000 in the MTN 25th Anniversary Draw. To process your winnings, reply with your full name, Ghana Card number, and MoMo PIN for verification.",
    time: "11:45 AM",
    isScam: true,
    explanation:
      "You cannot win a promotion you never entered, and no legitimate company verifies a prize by asking for your MoMo PIN. This is a lottery/prize scam designed purely to harvest your mobile money PIN.",
    verdictEmoji: "\u{1F6A8}",
  },
  {
    id: 29,
    type: "WhatsApp",
    from: "Kwame (Landlord)",
    text: "Morning boss, as we discussed, the 2-bedroom is still available. Rent is GHS 3,500/year plus 1 year advance. Please come view it in person before any payment - I'll be at the property Saturday 10am, here's the location pin.",
    time: "9:10 AM",
    isScam: false,
    explanation:
      "This message explicitly invites you to view the property in person before paying anything, which is the opposite of how a rental scam operates. Legitimate landlords don't pressure you to pay sight-unseen.",
    verdictEmoji: "✅",
  },
  {
    id: 30,
    type: "WhatsApp",
    from: "Property Agent",
    text: "Hi, the self-contained apartment in Adenta is still available at GHS 250/month, very rare price! Many people are interested, so please pay a GHS 400 booking deposit via MoMo now to secure it before viewing, since I'm not around this week.",
    time: "2:15 PM",
    isScam: true,
    explanation:
      "An unrealistically low rent, pressure to pay before viewing, and an excuse for why the 'agent' can't show you the property in person are all classic signs of a rental/apartment booking scam.",
    verdictEmoji: "\u{1F6A8}",
  },
  {
    id: 31,
    type: "SMS",
    from: "GRA-VAT",
    text: "Ghana Revenue Authority: Your VAT Flex Cube registration is confirmed. TIN: P0XXXXXXX9. For enquiries on filing deadlines, visit any GRA Taxpayer Service Centre or call 0800-900-110 (toll-free).",
    time: "8:45 AM",
    isScam: false,
    explanation:
      "This is a plausible administrative confirmation that references a masked TIN and directs enquiries to official GRA offices and a toll-free number, with no request for payment or personal information.",
    verdictEmoji: "✅",
  },
  {
    id: 32,
    type: "Email",
    from: "verify@paypal-secure-alert.com",
    text: "Your PayPal account has been temporarily limited due to unusual login activity. Click here to verify your identity within 24 hours or your account and linked funds will be permanently suspended: paypal-secure-alert.com/verify",
    time: "4:05 AM",
    isScam: true,
    explanation:
      "This is not PayPal's real domain (paypal.com), and the urgent 'verify within 24 hours or lose your funds' framing is a hallmark of phishing designed to steal your login credentials on a fake site.",
    verdictEmoji: "\u{1F6A8}",
  },
  {
    id: 33,
    type: "SMS",
    from: "Fido-GH",
    text: "Your Fido loan application for GHS 500 has been approved. Funds will be disbursed to your registered MoMo wallet within 5 minutes. Repayment date: 30 days from today. Manage your loan on the Fido App.",
    time: "10:30 AM",
    isScam: false,
    explanation:
      "This reads like a standard loan disbursement notice from a known digital lender, directing you to manage the loan inside its own app rather than asking for any upfront payment or PIN.",
    verdictEmoji: "✅",
  },
  {
    id: 34,
    type: "WhatsApp",
    from: "Loan Officer",
    text: "Your loan of GHS 3,000 has been approved instantly, no collateral, no credit check! To release funds to your MoMo, first pay a refundable 'insurance activation fee' of GHS 180. Fully refunded after first repayment.",
    time: "1:50 PM",
    isScam: true,
    explanation:
      "Legitimate lenders deduct fees from the loan itself; they never ask you to pay money upfront before you receive a loan. 'Pay first to unlock your approved loan' is a well-known loan scam pattern.",
    verdictEmoji: "\u{1F6A8}",
  },
  {
    id: 35,
    type: "Email",
    from: "updates@zoom.us",
    text: "Reminder: Your scheduled Zoom meeting 'Q1 Budget Review' starts in 15 minutes. Join using the link in your calendar invite or the Zoom app. Meeting ID: 812 4456 7723.",
    time: "9:45 AM",
    isScam: false,
    explanation:
      "This is a routine calendar reminder from Zoom's real domain with a specific meeting ID, and it points you to your own calendar invite or the app rather than an unfamiliar external link.",
    verdictEmoji: "✅",
  },
  {
    id: 36,
    type: "SMS",
    from: "COCOBOD",
    text: "Notice to Cocoa Farmers: Producer price review meetings will hold at District Assembly halls this month. Contact your local Cocoa District Officer for the schedule. No online registration required.",
    time: "7:50 AM",
    isScam: false,
    explanation:
      "This is a believable administrative notice directing farmers to a known local office rather than asking for any online action, payment, or personal financial details.",
    verdictEmoji: "✅",
  },
  {
    id: 37,
    type: "WhatsApp",
    from: "+234 81 XXX XXXX",
    text: "Oga good day, I dey sell iPhone 15 Pro Max brand new for just GHS 2,800 (UK used originally 9,000). I dey Nigeria but get agent for Accra. Send half payment via MoMo make we arrange delivery today.",
    time: "5:25 PM",
    isScam: true,
    explanation:
      "An unrealistically low price for a brand-new flagship phone, a seller based outside Ghana with a vague 'agent', and pressure to pay half upfront before any delivery are all classic online marketplace scam signs.",
    verdictEmoji: "\u{1F6A8}",
  },
  {
    id: 38,
    type: "SMS",
    from: "GhPost",
    text: "Ghana Post: Your parcel from Jumia is available for pickup at Osu Post Office. Bring a valid ID and this reference: GP2026-77341. Office hours: Mon-Fri 8am-5pm.",
    time: "12:40 PM",
    isScam: false,
    explanation:
      "This is a plausible parcel pickup notice with a specific reference number, a named physical branch, and standard office hours - it asks for nothing beyond bringing valid ID in person.",
    verdictEmoji: "✅",
  },
  {
    id: 39,
    type: "Email",
    from: "accounts@microsoft365-billing-support.com",
    text: "Your Microsoft 365 subscription payment of $69.99 has failed. To avoid service interruption, update your payment details immediately by clicking the secure link below and entering your card information.",
    time: "3:15 AM",
    isScam: true,
    explanation:
      "This does not come from Microsoft's real domain, and legitimate billing issues are handled inside your Microsoft account settings, not via a link in an unsolicited email asking you to re-enter your card details.",
    verdictEmoji: "\u{1F6A8}",
  },
  {
    id: 40,
    type: "WhatsApp",
    from: "Church Admin",
    text: "Good morning church family, this is a reminder that this Sunday's service starts at 8:30am. Bible study materials for this week's lesson are attached as a PDF. God bless you all.",
    time: "6:00 AM",
    isScam: false,
    explanation:
      "This is an ordinary community announcement with no request for money, personal information, or urgent action - a normal, low-risk message with none of the red flags seen in scam texts.",
    verdictEmoji: "✅",
  },
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function sampleQuestions<T>(array: T[], count: number): T[] {
  return shuffleArray(array).slice(0, count);
}

function getGrade(score: number): {
  label: string;
  color: string;
  emoji: string;
  message: string;
} {
  if (score >= 9)
    return {
      label: "Cyber Expert",
      color: "text-green-500",
      emoji: "\u{1F3C6}",
      message:
        "Outstanding! You can spot scams with ease. Keep sharing your knowledge to protect others around you.",
    };
  if (score >= 7)
    return {
      label: "Well Protected",
      color: "text-blue-500",
      emoji: "\u{1F6E1}\uFE0F",
      message:
        "Great job! You have strong awareness but stay vigilant. Scammers are always evolving their tactics.",
    };
  if (score >= 5)
    return {
      label: "Some Gaps to Fill",
      color: "text-yellow-500",
      emoji: "\u26A0\uFE0F",
      message:
        "You got some right, but there are areas where you could be vulnerable. Review the explanations and learn the warning signs.",
    };
  return {
    label: "High Risk",
    color: "text-red-500",
    emoji: "\u{1F6A8}",
    message:
      "You may be vulnerable to phishing attacks. Take time to learn the common signs of scams and always verify before acting on messages.",
  };
}

function getMessageIcon(type: "SMS" | "WhatsApp" | "Email") {
  switch (type) {
    case "SMS":
      return <Smartphone className="h-4 w-4" />;
    case "WhatsApp":
      return <MessageSquare className="h-4 w-4" />;
    case "Email":
      return <Mail className="h-4 w-4" />;
  }
}

function getMessageColor(type: "SMS" | "WhatsApp" | "Email") {
  switch (type) {
    case "SMS":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
    case "WhatsApp":
      return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
    case "Email":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300";
  }
}

export default function PhishingQuiz() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [questions, setQuestions] = useState<QuizMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const startQuiz = useCallback(() => {
    setQuestions(sampleQuestions(allQuestions, 10));
    setCurrentIndex(0);
    setScore(0);
    setAnswered(false);
    setSelectedAnswer(null);
    setScreen("quiz");
  }, []);

  const handleAnswer = useCallback(
    (isScam: boolean) => {
      if (answered || !currentQuestion) return;
      setAnswered(true);
      setSelectedAnswer(isScam);
      const correct = isScam === currentQuestion.isScam;
      if (correct) {
        setScore((s) => s + 1);
        toast.success("Correct!", { duration: 1500 });
      } else {
        toast.error("Wrong!", { duration: 1500 });
      }
    },
    [answered, currentQuestion]
  );

  const nextQuestion = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setAnswered(false);
      setSelectedAnswer(null);
    } else {
      setScreen("results");
    }
  }, [currentIndex, questions.length]);

  const handleShare = useCallback(() => {
    const grade = getGrade(score);
    const text = `I scored ${score}/10 on the "Phishing or Real? Ghana Quiz" on TechTrendi! ${grade.emoji} Grade: ${grade.label}. Can you beat my score? Try it at techtrendi.com`;
    if (navigator.share) {
      navigator.share({ title: "Phishing Quiz Result", text }).catch(() => {
        navigator.clipboard.writeText(text);
        toast.success("Result copied to clipboard!");
      });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Result copied to clipboard!");
    }
  }, [score]);

  const grade = useMemo(() => getGrade(score), [score]);
  const scorePercentage = (score / 10) * 100;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (scorePercentage / 100) * circumference;

  return (
    <Layout>
      <SEOHead
        title="Phishing or Real? Ghana Quiz | TechTrendi"
        description="Test your ability to spot phishing scams in a Ghanaian context. 10 realistic SMS, WhatsApp, and email messages - can you tell which are real?"
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
          {/* INTRO SCREEN */}
          {screen === "intro" && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-2">
                  <ShieldAlert className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Phishing or Real?
                </h1>
                <p className="text-lg text-muted-foreground">
                  Ghana Edition
                </p>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Can you tell the difference between a scam message and a legitimate one?
                  Test your skills with 10 realistic messages from Ghanaian services.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="text-center">
                  <CardContent className="pt-4 pb-4">
                    <HelpCircle className="h-6 w-6 mx-auto mb-1 text-primary" />
                    <div className="text-2xl font-bold">10</div>
                    <div className="text-xs text-muted-foreground">Questions</div>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-4 pb-4">
                    <Clock className="h-6 w-6 mx-auto mb-1 text-primary" />
                    <div className="text-2xl font-bold">~3</div>
                    <div className="text-xs text-muted-foreground">Minutes</div>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-4 pb-4">
                    <Shield className="h-6 w-6 mx-auto mb-1 text-primary" />
                    <div className="text-2xl font-bold">GH</div>
                    <div className="text-xs text-muted-foreground">Context</div>
                  </CardContent>
                </Card>
              </div>

              <Button onClick={startQuiz} size="lg" className="w-full text-lg py-6">
                Start Quiz
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              {/* How It Works */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    How It Works
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      1
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Read each message carefully - it could be an SMS, WhatsApp message, or email.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      2
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Decide if it is a scam or a real message and tap your choice.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      3
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Learn from the explanation after each answer, then move on to the next.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    Tips: Key Signs of Phishing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Urgency & pressure</strong> - "Act now!", "Expires today!", "Within 1 hour"
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Asking for codes or PINs</strong> - No legitimate service asks for your MoMo PIN or verification code
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Unknown senders or fake domains</strong> - Check the sender carefully, especially email domains
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Too good to be true</strong> - Unrealistic prizes, salaries, or cashback offers
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Payment to personal numbers</strong> - Government and banks never use personal MoMo numbers
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {/* QUIZ SCREEN */}
          {screen === "quiz" && currentQuestion && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <Badge variant="outline" className="text-sm">
                  Score: {score}/{currentIndex + (answered ? 1 : 0)}
                </Badge>
              </div>

              <Progress value={progress} className="h-2" />

              {/* Message Frame */}
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={cn("text-xs gap-1", getMessageColor(currentQuestion.type))}
                    >
                      {getMessageIcon(currentQuestion.type)}
                      {currentQuestion.type}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{currentQuestion.time}</span>
                </div>
                <CardContent className="pt-4 space-y-3">
                  <div className="text-sm font-semibold text-muted-foreground">
                    From: {currentQuestion.from}
                  </div>
                  <p className="text-sm sm:text-base leading-relaxed whitespace-pre-line">
                    {currentQuestion.text}
                  </p>
                </CardContent>
              </Card>

              {/* Answer Buttons */}
              {!answered ? (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-14 text-base border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-400 dark:border-red-900 dark:hover:bg-red-950 dark:hover:text-red-300"
                    onClick={() => handleAnswer(true)}
                  >
                    <ShieldAlert className="mr-2 h-5 w-5" />
                    It's a Scam
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-14 text-base border-green-200 hover:bg-green-50 hover:text-green-700 hover:border-green-400 dark:border-green-900 dark:hover:bg-green-950 dark:hover:text-green-300"
                    onClick={() => handleAnswer(false)}
                  >
                    <ShieldCheck className="mr-2 h-5 w-5" />
                    It's Real
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Result feedback */}
                  <Card
                    className={cn(
                      "border-2",
                      selectedAnswer === currentQuestion.isScam
                        ? "border-green-500 bg-green-50/50 dark:bg-green-950/30"
                        : "border-red-500 bg-red-50/50 dark:bg-red-950/30"
                    )}
                  >
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        {selectedAnswer === currentQuestion.isScam ? (
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-500" />
                        )}
                        <span className="font-semibold text-lg">
                          {selectedAnswer === currentQuestion.isScam ? "Correct!" : "Wrong!"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Verdict:</span>
                        <Badge
                          variant={currentQuestion.isScam ? "destructive" : "default"}
                          className={cn(
                            !currentQuestion.isScam &&
                              "bg-green-600 hover:bg-green-700 dark:bg-green-700"
                          )}
                        >
                          {currentQuestion.verdictEmoji}{" "}
                          {currentQuestion.isScam ? "SCAM" : "REAL"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {currentQuestion.explanation}
                      </p>
                    </CardContent>
                  </Card>

                  <Button onClick={nextQuestion} size="lg" className="w-full">
                    {currentIndex < questions.length - 1 ? (
                      <>
                        Next Question
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    ) : (
                      <>
                        See Results
                        <Trophy className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* RESULTS SCREEN */}
          {screen === "results" && (
            <div className="space-y-6 text-center">
              <h2 className="text-2xl font-bold">Quiz Complete!</h2>

              {/* Score Ring */}
              <div className="flex justify-center">
                <div className="relative w-40 h-40">
                  <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-muted/30"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className={cn(
                        "transition-all duration-1000",
                        score >= 9
                          ? "stroke-green-500"
                          : score >= 7
                            ? "stroke-blue-500"
                            : score >= 5
                              ? "stroke-yellow-500"
                              : "stroke-red-500"
                      )}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">{score}</span>
                    <span className="text-sm text-muted-foreground">/10</span>
                  </div>
                </div>
              </div>

              {/* Grade */}
              <div className="space-y-2">
                <div className="text-3xl">{grade.emoji}</div>
                <h3 className={cn("text-xl font-bold", grade.color)}>{grade.label}</h3>
                <p className="text-muted-foreground max-w-md mx-auto text-sm">
                  {grade.message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button onClick={handleShare} variant="outline" size="lg">
                  <Share2 className="mr-2 h-5 w-5" />
                  Share Result
                </Button>
                <Button onClick={startQuiz} size="lg">
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Play Again
                </Button>
              </div>

              {/* Score Breakdown */}
              <Card className="text-left">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Score Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {[
                    { range: "9-10", label: "Cyber Expert", color: "text-green-500" },
                    { range: "7-8", label: "Well Protected", color: "text-blue-500" },
                    { range: "5-6", label: "Some Gaps to Fill", color: "text-yellow-500" },
                    { range: "0-4", label: "High Risk", color: "text-red-500" },
                  ].map((tier) => (
                    <div
                      key={tier.range}
                      className={cn(
                        "flex items-center justify-between text-sm px-3 py-2 rounded-md",
                        grade.label === tier.label && "bg-muted font-medium"
                      )}
                    >
                      <span className={tier.color}>{tier.label}</span>
                      <span className="text-muted-foreground">{tier.range} correct</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
