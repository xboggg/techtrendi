import { useState, useMemo, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Shield,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Lock,
  Home,
  Plane,
  UserCheck,
} from "lucide-react";

const PER_PAGE = 10;

interface PlaybookItem {
  id: number;
  title: string;
  category: string;
  summary: string;
  explanation: string;
  defence: string;
  articleSlug: string;
}

const CATEGORIES = [
  { name: "All", icon: Shield, color: "bg-gradient-to-r from-blue-500 to-purple-600" },
  { name: "Scam Teardowns", icon: ShieldAlert, color: "bg-red-500" },
  { name: "Password & Accounts", icon: Lock, color: "bg-blue-500" },
  { name: "Smart Home & Physical", icon: Home, color: "bg-green-500" },
  { name: "Travel & Public Safety", icon: Plane, color: "bg-purple-500" },
  { name: "Identity & Data", icon: UserCheck, color: "bg-amber-500" },
];

const CATEGORY_STYLES: Record<string, string> = {
  "Scam Teardowns": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "Password & Accounts": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Smart Home & Physical": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "Travel & Public Safety": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "Identity & Data": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const ARTICLE_LINKS: Record<string, string> = {
  "Scam Teardowns": "/blog/real-life-scam-teardowns-ghana-cybersecurity-guide",
  "Password & Accounts": "/blog/password-account-mistakes-cybersecurity-guide-2026",
  "Smart Home & Physical": "/blog/smart-home-physical-security-risks-cybersecurity-guide",
  "Travel & Public Safety": "/blog/travel-public-space-cybersecurity-traps-2026",
  "Identity & Data": "/blog/identity-data-protection-cybersecurity-guide-2026",
};

const ITEMS: PlaybookItem[] = [
  // ── SCAM TEARDOWNS ────────────────────────────────────────────────────────
  {
    id: 1, category: "Scam Teardowns",
    title: "The AI Voice Clone Scam",
    summary: "Criminals clone your voice from a 3-second video clip and call your family pretending to be you in an emergency.",
    explanation: "AI voice cloning tools can replicate anyone's voice from as little as 3 seconds of audio found in TikToks, voice notes, or public videos. The criminal calls a parent or spouse pretending to be you — claiming an accident, arrest, or medical emergency — and demands urgent mobile money. The voice sounds exactly like you.",
    defence: "Agree on a family safe word today. Anyone claiming to be a family member in an emergency must say it. If they cannot, hang up and call the person directly on their known number.",
    articleSlug: "real-life-scam-teardowns-ghana-cybersecurity-guide",
  },
  {
    id: 2, category: "Scam Teardowns",
    title: "The Wrong Number Long Con (Pig Butchering)",
    summary: "A 'wrong number' text leads to weeks of friendship, then a crypto investment scam that takes everything.",
    explanation: "You reply to a 'wrong number' message. The stranger is warm, interesting, successful. Over days they build genuine rapport. Then they mention a crypto investment platform their 'uncle manages' with guaranteed returns. You invest small, watch profits grow on screen, invest more — then find you cannot withdraw. Every excuse delays you until you have sent everything.",
    defence: "Never respond to wrong number texts from unknown international numbers. The friendly conversation is the trap, not the investment pitch. Block and report immediately.",
    articleSlug: "real-life-scam-teardowns-ghana-cybersecurity-guide",
  },
  {
    id: 3, category: "Scam Teardowns",
    title: "The Fake Streaming Service Lock",
    summary: "A pixel-perfect Netflix or DStv email says your account is suspended — the link steals your card details.",
    explanation: "These emails match the real company's design exactly — same logo, colours, and font. They claim your account is suspended and direct you to update your payment method. The link goes to a convincing fake site (netflix-verify.ru, accounts-streaming.info) that captures your full card details the moment you submit.",
    defence: "Never click links in account suspension emails. Open a new browser tab, type the company's website address manually, and log in there directly. If there is a real problem, it will show on the official site.",
    articleSlug: "real-life-scam-teardowns-ghana-cybersecurity-guide",
  },
  {
    id: 4, category: "Scam Teardowns",
    title: "The Fake Tech Support Alarm",
    summary: "A loud alarm fills your screen declaring your computer is infected — calling the number connects you to criminals.",
    explanation: "While browsing, your screen is hijacked by a red alarm page with loud beeping. It claims your computer is infected and displays a phone number to call immediately. When you call, actors posing as Microsoft or Google technicians ask for remote access to 'fix' the non-existent problem — then steal files or charge hundreds of dollars.",
    defence: "Close the browser tab (Ctrl+W). If frozen, restart your computer. The 'virus' disappears because it never existed. No legitimate tech company will ever display a phone number on your screen asking you to call.",
    articleSlug: "real-life-scam-teardowns-ghana-cybersecurity-guide",
  },
  {
    id: 5, category: "Scam Teardowns",
    title: "The Mobile Money Reversal Trap",
    summary: "A 'mistaken' mobile money transfer to you — then asking for it back — is a scam that drains your own account.",
    explanation: "A stranger 'accidentally' sends you money and politely asks you to send it back. The original transfer was made using a stolen account. When that fraud is reported, the payment reverses and disappears from your balance — but the money you sent back came from your own valid account. You lose the full amount.",
    defence: "Never send money back to someone claiming to have sent it in error. Tell them to contact their mobile money provider directly to initiate a formal reversal. Mobile money transfers are treated like physical cash — almost never reversible once sent.",
    articleSlug: "real-life-scam-teardowns-ghana-cybersecurity-guide",
  },
  {
    id: 6, category: "Scam Teardowns",
    title: "The Fake Invoice Panic",
    summary: "A fake invoice for a subscription you never signed up for tricks you into calling criminals who drain your account.",
    explanation: "An email claims you owe money for a service renewal (Geek Squad, Norton, tech support). It provides a phone number to dispute or cancel. When you call, the agent asks for remote access to process your 'refund' — then transfers money from your account while keeping you distracted with conversation.",
    defence: "If you receive an invoice for something you never bought, do not call the number in the email. Check your actual bank statement first. If no charge exists, delete the email. If a charge does exist, call the company's number found independently on their official website.",
    articleSlug: "real-life-scam-teardowns-ghana-cybersecurity-guide",
  },
  {
    id: 7, category: "Scam Teardowns",
    title: "The Facebook Verification Badge Scam",
    summary: "A fake 'Meta Business Support' message threatens to delete your business page unless you verify — stealing your login.",
    explanation: "Small business owners receive Messenger messages from accounts impersonating Meta Support, warning their page will be deleted in 24–48 hours for policy violations. The link goes to a fake Facebook login page. With your credentials, criminals take over your page, change details, and may run fraudulent ads charged to your payment method.",
    defence: "Genuine Meta account warnings never come through Messenger. All authentic communications appear inside Meta Business Suite under Notifications. Enable two-factor authentication on Facebook and Instagram immediately.",
    articleSlug: "real-life-scam-teardowns-ghana-cybersecurity-guide",
  },
  {
    id: 8, category: "Scam Teardowns",
    title: "The Fake QR Code Over a Real One",
    summary: "Criminals stick fake QR code stickers over legitimate ones on payment points — redirecting you to a card-stealing site.",
    explanation: "A printed fake QR sticker placed over a real code on a restaurant menu, church offering board, or parking payment point routes you to a convincing payment portal that captures your card details. The business is unaware. By the time they discover the tampered code, many customers may have entered their information.",
    defence: "Physically inspect any QR code before scanning — look for sticker edges or misalignment. After scanning, check the URL in your browser before entering any payment details. A legitimate payment link uses a recognisable business domain.",
    articleSlug: "real-life-scam-teardowns-ghana-cybersecurity-guide",
  },
  {
    id: 9, category: "Scam Teardowns",
    title: "The Fake Delivery Fee SMS",
    summary: "A GHS 3.50 redelivery fee text is a pretext — what they actually want is your full card number.",
    explanation: "An SMS claims your parcel is held pending a small redelivery fee. The link goes to a professional-looking courier portal. The tiny fee is irrelevant — entering your card number, expiry, and CVV gives criminals everything they need to make much larger purchases on your account.",
    defence: "Legitimate couriers do not send unsolicited SMS links for unexpected fees. If you are expecting a package, go directly to the courier's official website and track it using your tracking number — do not follow any link from an SMS.",
    articleSlug: "real-life-scam-teardowns-ghana-cybersecurity-guide",
  },
  {
    id: 10, category: "Scam Teardowns",
    title: "The 'Look Who Died' / 'Is This You?' Message",
    summary: "A message from a friend's account with a shocking link either steals your password or installs malware.",
    explanation: "A message from a real friend says 'Oh my God, look who died' or 'Is this you in this video?' with a link. The friend's account was compromised by the same scam. Clicking leads to a fake login page that captures your password — then sends the same message to everyone in your contact list automatically.",
    defence: "Call the friend directly using their phone number before clicking anything. If their account is compromised, tell them immediately so they can begin recovery. Never log in via a link sent through a social media message — always navigate to the platform directly.",
    articleSlug: "real-life-scam-teardowns-ghana-cybersecurity-guide",
  },

  // ── PASSWORD & ACCOUNTS ───────────────────────────────────────────────────
  {
    id: 11, category: "Password & Accounts",
    title: "The 'I Use 3 Passwords' Habit",
    summary: "Reusing passwords means one old breach unlocks all your current accounts through automated credential stuffing.",
    explanation: "When any website is breached, criminals buy the leaked email/password combinations and automatically try them on Gmail, banking apps, and social media. If your password on a breached 2017 shopping site matches your Gmail today, your Gmail is compromised within minutes — without anyone guessing anything.",
    defence: "Use a unique password for every account. A free password manager like Bitwarden generates and remembers them all. You only need to remember one strong master password.",
    articleSlug: "password-account-mistakes-cybersecurity-guide-2026",
  },
  {
    id: 12, category: "Password & Accounts",
    title: "The Notebook vs. Password Manager Debate",
    summary: "A physical notebook at home is actually safer than reusing one password everywhere — but a password manager beats both.",
    explanation: "A notebook cannot be hacked remotely from another country. The threat of automated credential stuffing attacks is orders of magnitude more likely than someone breaking into your home specifically to find your password notebook. However, a reputable password manager like Bitwarden gives you unique passwords for every site, accessible anywhere, with strong encryption.",
    defence: "Download Bitwarden (free) and spend 30 minutes moving your most important accounts to unique generated passwords. That half hour may prevent years of account recovery problems.",
    articleSlug: "password-account-mistakes-cybersecurity-guide-2026",
  },
  {
    id: 13, category: "Password & Accounts",
    title: "Complexity vs. Length — Why 'Pa$$w0rd1!' Is Terrible",
    summary: "Modern computers crack 8-character complex passwords in under an hour. Length matters far more than complexity.",
    explanation: "Requirements for capital letters, numbers, and symbols are outdated. A graphics card costing less than a new phone can attempt billions of password combinations per second. An 8-character password — however complex it looks — falls quickly. What actually resists brute force is length: every additional character multiplies the combinations exponentially.",
    defence: "Use a passphrase — four random words like 'BlueHorseEatsGreenMango' (23 characters). It is exponentially harder to crack than 'Pa$$w0rd1!' and far easier to remember.",
    articleSlug: "password-account-mistakes-cybersecurity-guide-2026",
  },
  {
    id: 14, category: "Password & Accounts",
    title: "Using Real Answers for Security Questions",
    summary: "Your mother's maiden name, first school, and childhood pet are all findable online — making security questions useless.",
    explanation: "Banks and email providers use security questions as a backup identity check. The answers for most people — mother's maiden name, primary school, first pet — are visible in Facebook posts, LinkedIn profiles, and family WhatsApp group photos. A criminal who wants to reset your bank password does not need to hack anything; they need your public social media.",
    defence: "Treat security question answers as a second password. Use false, random answers only you know (e.g., mother's maiden name = 'YellowElephant2026') and store them in your password manager with a note of which fake answer you used where.",
    articleSlug: "password-account-mistakes-cybersecurity-guide-2026",
  },
  {
    id: 15, category: "Password & Accounts",
    title: "Thinking SMS Verification Codes Are Truly Secure",
    summary: "SIM swap attacks let criminals receive your SMS verification codes without ever touching your phone.",
    explanation: "A criminal calls your mobile network provider, impersonates you using personal information from your social media, and convinces a customer service agent to transfer your number to their SIM card. They now receive all your SMS verification codes. This attack has been used to drain cryptocurrency accounts worth millions.",
    defence: "For important accounts, switch from SMS codes to an authenticator app — Google Authenticator, Authy, or Microsoft Authenticator. These generate codes on your device without involving the phone network, making SIM swap attacks irrelevant.",
    articleSlug: "password-account-mistakes-cybersecurity-guide-2026",
  },
  {
    id: 16, category: "Password & Accounts",
    title: "Using Your Bank on Public Wi-Fi",
    summary: "Shared public networks let others on the same connection potentially intercept your traffic.",
    explanation: "On an unencrypted or poorly secured public network, someone with the right tools can intercept traffic, capture login sessions, and in some cases inject content into pages you load. Fake hotspots with names matching legitimate venues route all your traffic through the criminal's device first.",
    defence: "Use your mobile data for anything sensitive — banking, work email, medical platforms. Reserve public Wi-Fi for streaming and browsing. If you must use public Wi-Fi for sensitive work, a VPN (ProtonVPN, Mullvad) encrypts all your traffic.",
    articleSlug: "password-account-mistakes-cybersecurity-guide-2026",
  },
  {
    id: 17, category: "Password & Accounts",
    title: "Chaining Everything to 'Sign In with Google/Facebook'",
    summary: "One compromised Google or Facebook account unlocks every service you signed in with it simultaneously.",
    explanation: "Every app connected to your Google or Facebook account becomes part of a single chain. One phishing attack, one leaked password, one SIM swap on the recovery number — and the criminal has automatic access to every service in that chain simultaneously. Shopping platforms, food delivery, gaming accounts, productivity tools — all at once.",
    defence: "For anything involving payment methods, sensitive data, or work: create a standalone account with a unique email and password. Use 'Sign in with Google' only for low-stakes apps where a compromise would be inconvenient but not catastrophic.",
    articleSlug: "password-account-mistakes-cybersecurity-guide-2026",
  },
  {
    id: 18, category: "Password & Accounts",
    title: "The Forgotten Old Email Account Loophole",
    summary: "An abandoned Yahoo or Hotmail from 2008 may still be the recovery email for your current bank account.",
    explanation: "Old email accounts — created with weaker password requirements, no 2FA, and older infrastructure — may still be listed as recovery contacts for critical current accounts. A criminal who gains access to that forgotten old account can trigger password resets on everything linked to it, including your primary email and banking.",
    defence: "Log into every email account you have ever owned. Update recovery emails on all critical accounts to your current, secure address. Delete old accounts that have no ongoing value — a non-existent account cannot be compromised.",
    articleSlug: "password-account-mistakes-cybersecurity-guide-2026",
  },
  {
    id: 19, category: "Password & Accounts",
    title: "Treating Your Fingerprint as a Secret",
    summary: "Your fingerprint is an identifier, not a secret — you leave it on every surface you touch.",
    explanation: "Biometrics are convenient but not truly secret. You leave fingerprints on every surface you touch. Your face is recorded on cameras everywhere. In some jurisdictions, courts have ruled that you can be legally compelled to provide a fingerprint to unlock a device, while refusing to share a password is a protected right.",
    defence: "Set a strong numerical PIN or alphanumeric passcode as your primary device lock. Use biometrics as a fast shortcut on top of that security — not as the only barrier between your data and the world.",
    articleSlug: "password-account-mistakes-cybersecurity-guide-2026",
  },
  {
    id: 20, category: "Password & Accounts",
    title: "Saving Your Card on Every Shopping Site",
    summary: "Every site storing your card details is a future breach target — the more places, the bigger your exposure.",
    explanation: "When a shopping site is hacked — and thousands are annually — your stored card number, expiry date, and billing address are in the stolen database. Even sites you used once in 2022 and never returned to still hold your details. Each saved card is an attack surface you cannot monitor.",
    defence: "Disable 'save card for next time' on sites where you shop infrequently. For regular purchases, use a virtual card number if your bank offers one — it limits damage to a single merchant if breached. Check your card statements weekly for unrecognised transactions.",
    articleSlug: "password-account-mistakes-cybersecurity-guide-2026",
  },

  // ── SMART HOME & PHYSICAL ─────────────────────────────────────────────────
  {
    id: 21, category: "Smart Home & Physical",
    title: "The Default Router Password Danger",
    summary: "Your router ships with default credentials printed on its back — and those defaults are published online for anyone to find.",
    explanation: "Your router is the gateway to every device in your home. Default admin credentials ('admin/admin', 'admin/1234') are documented on public websites. Anyone who connects to your network can log into your router's admin panel, redirect your internet traffic, monitor everything flowing through, or use your connection for criminal activity.",
    defence: "Type 192.168.1.1 into your browser, log in with the default credentials on the sticker, and change the admin password to something unique. Also change your Wi-Fi password. Enable automatic firmware updates while you are there.",
    articleSlug: "smart-home-physical-security-risks-cybersecurity-guide",
  },
  {
    id: 22, category: "Smart Home & Physical",
    title: "The Smart Camera Peeping Tom",
    summary: "Cheap cameras with default passwords are indexed on public search engines — anyone can watch your live feed.",
    explanation: "Unbranded cameras often ship with default credentials never changed by owners. A search engine called Shodan indexes internet-connected devices including cameras with open default access. Anyone can search it and watch live feeds from strangers' homes — nurseries, living rooms, bedrooms — without any technical expertise.",
    defence: "Buy cameras only from established brands (Arlo, Ring, Nest, TP-Link Tapo). Change the admin password immediately. Enable two-factor authentication and automatic firmware updates. Never position cameras to view bedrooms or bathrooms.",
    articleSlug: "smart-home-physical-security-risks-cybersecurity-guide",
  },
  {
    id: 23, category: "Smart Home & Physical",
    title: "Your Smart TV Is Listening",
    summary: "Voice data collection is enabled by default on most smart TVs — turning it off takes under two minutes.",
    explanation: "Smart TVs from Samsung, LG, and Sony include voice recognition that is active by default, listening for wake words and transmitting audio snippets to manufacturer and third-party advertising servers. Samsung's privacy policy once explicitly acknowledged that spoken words near the TV may be captured by third parties.",
    defence: "Samsung: Settings → General → Voice → disable Voice Wake-up. LG: Settings → General → AI Service → Voice Recognition → disable. Sony: Settings → Device Preferences → Google → Activity Controls → disable Voice and Audio Activity.",
    articleSlug: "smart-home-physical-security-risks-cybersecurity-guide",
  },
  {
    id: 24, category: "Smart Home & Physical",
    title: "The Digital Door Lock Weakness",
    summary: "Smart locks that haven't received firmware updates since 2019 may have known vulnerabilities allowing keyless unlock.",
    explanation: "Many smart lock models — particularly older or budget versions — stopped receiving security updates years ago. Known vulnerabilities allow attackers within Bluetooth range to unlock the door without knowing the code by exploiting unpatched software. The lock appears and functions normally with no sign of tampering.",
    defence: "Verify your smart lock manufacturer still releases regular firmware updates. A lock from a company that shut down or stopped updating is a security liability. For high-security doors, a traditional physical deadbolt cannot be hacked remotely.",
    articleSlug: "smart-home-physical-security-risks-cybersecurity-guide",
  },
  {
    id: 25, category: "Smart Home & Physical",
    title: "The Car Key Fob Relay Attack",
    summary: "Two criminals with relay devices can unlock and start your keyless car from outside your home in under 60 seconds.",
    explanation: "Modern keyless cars unlock when the fob is nearby. Criminals work in pairs: one amplifies your key fob's signal through your wall, the other receives it next to your car. The car detects a 'nearby' fob and unlocks. No forced entry, no alarm triggered, no trace. The attack takes under 60 seconds and is documented widely across Europe and Africa.",
    defence: "Store your key fob in a Faraday signal-blocking pouch (under GHS 50 online). Alternatively, a metal tin or the microwave (switched off) blocks the signal. A visible physical steering wheel lock makes relay attacks pointless even if the door opens.",
    articleSlug: "smart-home-physical-security-risks-cybersecurity-guide",
  },
  {
    id: 26, category: "Smart Home & Physical",
    title: "AirTag Stalking — When Tracking Tools Become Weapons",
    summary: "An AirTag slipped into your bag or under your car can track your movements in real time without your knowledge.",
    explanation: "Apple AirTags designed for finding lost items have been misused by stalkers who place them in bags, under car bumpers, or in jacket pockets. Apple built in alerts for iPhone users, but Android users receive no automatic notification and are considerably more vulnerable to being tracked without awareness.",
    defence: "If your iPhone displays 'An AirTag is Found Moving With You,' take it seriously. Use the Find My app to locate it on your person. Go to a public space or police station before searching — the AirTag is evidence. Do not discard it.",
    articleSlug: "smart-home-physical-security-risks-cybersecurity-guide",
  },
  {
    id: 27, category: "Smart Home & Physical",
    title: "The Danger of Used Smart Devices",
    summary: "A second-hand smart bulb or plug may still be connected to the previous owner's account — or deliberately compromised.",
    explanation: "Used smart devices may retain connections to previous owners' accounts, allowing remote control after installation. In deliberate cases, a compromised device on your network can monitor traffic or scan for other vulnerable devices. You have no visibility into what software is running on a used smart device.",
    defence: "Factory reset every smart device before connecting it to your home network — regardless of the source. The reset procedure (usually holding a button for 10 seconds) is on the manufacturer's website. Do it before setup, every time, without exception.",
    articleSlug: "smart-home-physical-security-risks-cybersecurity-guide",
  },
  {
    id: 28, category: "Smart Home & Physical",
    title: "The Found USB Drive Trap",
    summary: "A USB drive found in a car park or office lobby is almost certainly a deliberate trap — plugging it in installs malware.",
    explanation: "Security researchers consistently find that most people plug in found USB drives out of curiosity. A malicious drive can install ransomware, keyloggers, or remote access tools within seconds of insertion — often before antivirus software can respond. 'BadUSB' devices present as keyboards and begin typing commands automatically the moment they connect.",
    defence: "If you find a USB drive and do not know where it came from, hand it to security, put it in a bin, or destroy it. There is no safe way to 'quickly check' what is on an unknown USB drive on any computer you care about.",
    articleSlug: "smart-home-physical-security-risks-cybersecurity-guide",
  },
  {
    id: 29, category: "Smart Home & Physical",
    title: "Modern Shoulder Surfing — The 10-Metre Camera",
    summary: "Criminals now film PIN entry from up to 10 metres away using phone zoom — covering your hand defeats this entirely.",
    explanation: "Traditional shoulder surfing has evolved. In ATM queues, mobile money lines, and market payment points, criminals use smartphone cameras with digital zoom to record PIN entry from significant distances. The footage is reviewed later to extract the PIN while card details are captured separately through a skimmer.",
    defence: "Cup your non-dominant hand over the keypad whenever entering any PIN — at every machine, every time, regardless of how empty the area appears. This single physical habit takes one second and defeats both traditional and camera-based shoulder surfing completely.",
    articleSlug: "smart-home-physical-security-risks-cybersecurity-guide",
  },
  {
    id: 30, category: "Smart Home & Physical",
    title: "Smart Speaker Accidental Purchases",
    summary: "TV advertisements and children have both been documented triggering voice assistant purchases on smart speakers.",
    explanation: "Smart speakers respond to voice commands from anyone in the room — including television characters, YouTube videos, and children. Researchers have demonstrated that certain TV advertisements can trigger purchase requests. Multiple parents have discovered unexpected deliveries after children discovered the device responds to their requests equally well.",
    defence: "Set a voice purchase confirmation PIN through the device's companion app. If the device does not need to make purchases independently, disable that feature entirely. The speaker remains fully functional for all other uses without shopping access.",
    articleSlug: "smart-home-physical-security-risks-cybersecurity-guide",
  },

  // ── TRAVEL & PUBLIC SAFETY ────────────────────────────────────────────────
  {
    id: 31, category: "Travel & Public Safety",
    title: "Public USB Charging Ports — Juice Jacking",
    summary: "Airport and mall USB ports can charge your device and steal data simultaneously — carry a power bank instead.",
    explanation: "The FBI formally warned about 'juice jacking' — compromised public USB charging stations that simultaneously charge devices and attempt to access files or install malware. The USB standard carries both power and data. In distracted environments, users often dismiss the 'trust this device?' prompt without reading it.",
    defence: "Carry a portable power bank (10,000 mAh, under GHS 100). If you must use a public USB port, a USB data blocker adapter (under GHS 30) allows power through while physically disconnecting the data pins. Standard AC wall outlets with your own charger are always safe.",
    articleSlug: "travel-public-space-cybersecurity-traps-2026",
  },
  {
    id: 32, category: "Travel & Public Safety",
    title: "Photographing Your Boarding Pass",
    summary: "Your boarding pass barcode encodes your confirmation code, frequent flyer number, and full routing — readable by anyone.",
    explanation: "The barcode on a boarding pass contains your full name, booking confirmation code, frequent flyer number, and flight routing. With a free barcode scanner app, anyone who sees your boarding pass photo can access your booking online, change your seat, cancel your return flight, or transfer your frequent flyer miles.",
    defence: "Never photograph or share your boarding pass before completing your journey. After travel, shred physical boarding passes — tear the barcode section into small pieces at minimum. Do not leave them in seat pockets, hotel bins, or airport lounges.",
    articleSlug: "travel-public-space-cybersecurity-traps-2026",
  },
  {
    id: 33, category: "Travel & Public Safety",
    title: "Fake Hotel Wi-Fi Login Pages",
    summary: "A criminal in the lobby creates a fake hotel Wi-Fi network with an identical captive portal to capture your credentials.",
    explanation: "An attacker sets up a hotspot with the same name as the hotel's legitimate network. The fake captive portal looks identical to the real one. You enter your room number and last name. More sophisticated attacks capture all your traffic, intercept unencrypted data, and inject malicious content into pages you load — all while you browse normally.",
    defence: "Verify the exact hotel Wi-Fi name at the front desk before connecting. When two similar networks appear, ask staff. Use your phone's mobile data hotspot for sensitive work. A VPN encrypts all traffic regardless of which network you use.",
    articleSlug: "travel-public-space-cybersecurity-traps-2026",
  },
  {
    id: 34, category: "Travel & Public Safety",
    title: "Getting Into the Wrong Rideshare Car",
    summary: "Criminals park matching cars at airport pickup zones and call out passenger names to intercept rideshare riders.",
    explanation: "At busy airport pickup points, criminals park vehicles matching popular rideshare car types near the legitimate pickup area. They know tired travellers often verify the car model but not the licence plate. They call out your name — observed by watching which passengers are scanning the area — and you get into the wrong vehicle.",
    defence: "Before opening any car door: confirm the licence plate against your app. Then ask the driver 'What is the name of the passenger you are picking up?' — do not volunteer your name first. A legitimate driver will have your name in their app.",
    articleSlug: "travel-public-space-cybersecurity-traps-2026",
  },
  {
    id: 35, category: "Travel & Public Safety",
    title: "The Malicious Charging Cable",
    summary: "The O.MG cable looks identical to a standard USB cable but contains a hidden keylogger — travel with your own cables only.",
    explanation: "The O.MG cable is a commercially available device that appears externally identical to any Lightning or USB-C cable. Inside, it contains a hidden microcontroller that logs every keystroke typed on a connected device and transmits that data wirelessly. Borrowing cables from Airbnb amenity kits, hotel USB sockets, or strangers carries a non-trivial risk.",
    defence: "Travel with your own cables purchased new from a reputable source. If you must borrow a cable, use it only to charge a locked device you are not actively typing on — this limits what any embedded keylogger can capture.",
    articleSlug: "travel-public-space-cybersecurity-traps-2026",
  },
  {
    id: 36, category: "Travel & Public Safety",
    title: "The ATM Skimmer — How to Check",
    summary: "Card skimming overlays are attached with adhesive — a firm pull on the card reader reveals tampering before it is too late.",
    explanation: "Skimming devices are thin overlays fitted over ATM card readers that copy your card data as you insert. A small hidden camera captures your PIN. The equipment is designed to look natural but is not bolted to the machine — it is glued on. An attacker retrieves it later and uses the data to clone your card.",
    defence: "Before inserting any card, grip the card reader firmly and try to wiggle it. A real card reader will not move. A skimmer overlay feels slightly loose or detaches. Look for anything appearing thicker or misaligned than normal. Always cover the keypad with your hand when entering your PIN.",
    articleSlug: "travel-public-space-cybersecurity-traps-2026",
  },
  {
    id: 37, category: "Travel & Public Safety",
    title: "Hidden Cameras in Airbnb and Short-Term Rentals",
    summary: "Hidden cameras are found in smoke detectors, alarm clocks, and USB chargers — a quick flashlight scan on arrival finds them.",
    explanation: "Hidden cameras in rental properties have been documented globally and have led to criminal prosecutions. They are commonly hidden in smoke detectors, alarm clocks, USB chargers, air purifiers, and picture frames in bedrooms and bathrooms. Most are wireless and stream footage directly to the criminal's device.",
    defence: "On arrival, turn off lights and slowly scan the room with your phone's flashlight at a low angle — camera lenses reflect light with a distinctive bright glint. Check smoke detectors (remove cover if concerned), digital clocks, and wall decorations closely. If you find a camera, document it, check out, and report to both the platform and police.",
    articleSlug: "travel-public-space-cybersecurity-traps-2026",
  },
  {
    id: 38, category: "Travel & Public Safety",
    title: "The Out-of-Office Reply Danger",
    summary: "Your standard out-of-office auto-reply is a social engineering script — it reveals your travel dates and who to impersonate.",
    explanation: "A standard out-of-office reply confirms your exact travel dates (home and office unattended), provides a trusted colleague's name and email to impersonate, and gives criminals a plausible business reason to contact your organisation claiming to be you or acting on your behalf. This is used to initiate wire transfer fraud and credential theft.",
    defence: "Set your out-of-office to: 'I have limited email access. For urgent matters, please contact our main office on [main number].' No colleague names, no exact dates, no details. Restrict auto-replies to known contacts only if your email platform supports it.",
    articleSlug: "travel-public-space-cybersecurity-traps-2026",
  },
  {
    id: 39, category: "Travel & Public Safety",
    title: "The RFID Wallet Reality",
    summary: "RFID skimming risk is very low compared to phishing and online breaches — invest your security budget wisely.",
    explanation: "RFID-blocking wallets are widely marketed as essential travel security. The actual risk of remote RFID skimming of contactless cards is very low — readers must be within centimetres, and most modern cards have PIN requirements for significant transactions. Biometric passport cryptographic protections make simple scanning without cooperation essentially useless.",
    defence: "An RFID wallet will not hurt you, but your security budget is better spent on: a VPN service (GHS 50/month), a USB data blocker (GHS 30 one-time), and a portable power bank (GHS 100 one-time). These protect against threats orders of magnitude more common.",
    articleSlug: "travel-public-space-cybersecurity-traps-2026",
  },
  {
    id: 40, category: "Travel & Public Safety",
    title: "Put an AirTag in Your Checked Luggage",
    summary: "A GHS 150 AirTag inside your bag proves exactly where your luggage is when airlines claim not to know.",
    explanation: "When an airline says your bag is 'on its way' while your tracker shows it stationary in a different city, you have indisputable real-time evidence to present at the baggage desk. Lost bags are located far faster when you can provide GPS coordinates directly to ground staff rather than waiting on airline tracking systems.",
    defence: "Place an Apple AirTag or similar GPS tracker inside every checked bag. Disclose it if asked — it is fully legal and permitted by most airlines. The one-time GHS 150–200 cost has recovered thousands of cedis worth of luggage for travellers who used them.",
    articleSlug: "travel-public-space-cybersecurity-traps-2026",
  },

  // ── IDENTITY & DATA ───────────────────────────────────────────────────────
  {
    id: 41, category: "Identity & Data",
    title: "Freeze Your Credit",
    summary: "A credit freeze prevents any new account being opened in your name — even if criminals have your full ID details.",
    explanation: "A credit freeze is the single most effective action for preventing credit fraud. It blocks new credit applications using your identity, even with your ID number, date of birth, and address. It does not affect existing accounts, your credit score, or your ability to use current cards. It can be temporarily thawed when you need to apply for something yourself.",
    defence: "Contact your primary bank and ask what protections are available against fraudulent credit applications in your name. In countries with established credit bureaus (South Africa, Nigeria, Kenya, USA), formal free freeze processes exist. In the USA: freeze at Equifax, Experian, and TransUnion — under 15 minutes total.",
    articleSlug: "identity-data-protection-cybersecurity-guide-2026",
  },
  {
    id: 42, category: "Identity & Data",
    title: "Opt Out of Data Broker Sites",
    summary: "Your home address, phone number, and family details are sold legally by data broker websites — you can opt out for free.",
    explanation: "Sites like WhitePages, Spokeo, and BeenVerified compile your personal information from public records and make it searchable for a small fee. Scammers use these to find home addresses. Stalkers use them to locate people. Social engineers use them to build convincing impersonation profiles. Most people have no idea this data is sitting there, accessible to anyone.",
    defence: "Each site has an opt-out form — search '[site name] opt out' to find it. Start with WhitePages.com, Spokeo.com, and BeenVerified.com. The service DeleteMe automates opt-outs across dozens of sites for an annual subscription fee.",
    articleSlug: "identity-data-protection-cybersecurity-guide-2026",
  },
  {
    id: 43, category: "Identity & Data",
    title: "Delete Your Zombie Accounts",
    summary: "Every account you abandoned after using once is a future breach target holding your real name, email, and old password.",
    explanation: "Old accounts from 2012, 2014, 2016 — photography sites, gaming platforms, one-off shopping registrations — each hold your email, password (even an old one), and sometimes your real name and address. Small platforms are breached constantly. That old data feeds credential stuffing attacks against your current accounts.",
    defence: "Search your email's sent folder for old registration confirmation emails. Log into each service and delete the account. Use JustDeleteMe.xyz — it lists direct deletion links for hundreds of services rated by difficulty. Delete, do not just abandon.",
    articleSlug: "identity-data-protection-cybersecurity-guide-2026",
  },
  {
    id: 44, category: "Identity & Data",
    title: "The Social Media Quiz Data Harvest",
    summary: "'What was your first pet?' — viral social media games are harvesting the answers to your bank security questions.",
    explanation: "Posts asking you to publicly share your first car, childhood street, primary school, or mother's maiden name are perfectly designed to harvest security question answers. These are the exact questions banks and email providers use as backup identity verification. Your answers go into comments visible to everyone, including criminals who may have shared or boosted the post.",
    defence: "Treat any social media prompt asking for biographical information as a potential data harvesting exercise. Scroll past it. If you have already answered such posts publicly, consider changing the security questions on your most important accounts to something that cannot be found socially.",
    articleSlug: "identity-data-protection-cybersecurity-guide-2026",
  },
  {
    id: 45, category: "Identity & Data",
    title: "The Sharenting Risk — Children's Information Online",
    summary: "A school name, classroom number, and pickup time in one excited post gives strangers a complete daily schedule.",
    explanation: "'First day of Primary 3 at St. Augustine's! Class teacher Mr. Owusu, Room 12, after-school care Gate C until 4:30pm!' A well-meaning post has publicly disclosed the child's school, teacher, classroom, pickup time, and gate. This information is useful to anyone with harmful intentions and visible to all followers — plus everyone they share with.",
    defence: "Apply the same test to children's information as to any sensitive data: what could a stranger do with this if they saw it? School names, daily schedules, pickup locations, and classroom details should never appear in publicly accessible posts. Restrict audience settings for anything involving children's routines.",
    articleSlug: "identity-data-protection-cybersecurity-guide-2026",
  },
  {
    id: 46, category: "Identity & Data",
    title: "What the Dark Web Actually Is",
    summary: "The dark web is mostly boring spreadsheets of leaked passwords being sold cheaply — not a secret criminal marketplace.",
    explanation: "The 'dark web' is dramatised as a shadowy, inaccessible criminal netherworld. The reality is mundane: it is largely enormous databases of leaked credentials — email addresses, passwords, phone numbers, card details — bought and sold in bulk for fractions of a cent per record. Your data may be there already, if any site you used was breached.",
    defence: "Your data being on the dark web becomes dangerous only if your current passwords match the leaked ones. Unique passwords and two-factor authentication make dark web data about you largely useless to anyone who finds it. The threat is neutralised by your practices, not by the data's location.",
    articleSlug: "identity-data-protection-cybersecurity-guide-2026",
  },
  {
    id: 47, category: "Identity & Data",
    title: "Delete Does Not Mean Gone — How to Actually Wipe a Device",
    summary: "Files in the Recycle Bin and factory resets leave data recoverable by free software — encryption before reset is the fix.",
    explanation: "Emptying the Recycle Bin or formatting a drive marks space as 'available' but leaves the data physically on the drive until overwritten. Free file recovery software can restore 'deleted' files from sold, donated, or factory-reset devices. Years of photos, financial documents, and saved passwords may be recoverable by the new owner.",
    defence: "iPhone: Settings → General → Transfer or Reset iPhone → Erase All Content (handles encryption and wipe). Android: Enable encryption in Settings → Security → Encryption first, then perform factory reset. For laptops, use a secure wipe tool (DBAN for Windows, built-in Erase on Mac) that overwrites all data.",
    articleSlug: "identity-data-protection-cybersecurity-guide-2026",
  },
  {
    id: 48, category: "Identity & Data",
    title: "Medical Identity Theft",
    summary: "Criminals use your health insurance details to receive medical procedures in your name — mixing their records with yours.",
    explanation: "Medical identity theft is among the fastest-growing fraud types. Criminals use your health insurance member ID to receive healthcare, prescriptions, and surgeries billed to your insurance. The consequences extend beyond financial loss — a criminal's blood type, allergies, or conditions may be recorded in your medical history, potentially affecting your future treatment.",
    defence: "Review your health insurance 'explanation of benefits' statements carefully whenever they arrive. Any listed service you do not recognise should be reported to your insurance provider immediately. Never share your insurance card or member ID number with anyone who did not provide you with healthcare.",
    articleSlug: "identity-data-protection-cybersecurity-guide-2026",
  },
  {
    id: 49, category: "Identity & Data",
    title: "Have I Been Pwned — Check Your Email Right Now",
    summary: "A free tool tells you exactly which breaches exposed your email address and what data was taken.",
    explanation: "Have I Been Pwned (haveibeenpwned.com) is a free, legitimate public service that tells you which known data breaches included your email address — the service that was breached, when, and exactly which data was exposed (passwords, phone numbers, addresses, dates of birth). It is built from the same breach data criminals use, made accessible to the public.",
    defence: "Go to haveibeenpwned.com and check every email address you use. If your email appears in a breach: change the password on that service immediately, change it on every other service where you used the same password, and enable two-factor authentication on the breached account.",
    articleSlug: "identity-data-protection-cybersecurity-guide-2026",
  },
  {
    id: 50, category: "Identity & Data",
    title: "The Five-Second Pause — The Most Powerful Security Tool",
    summary: "Every scam ever invented exploits urgency. A five-second pause before acting on any unsolicited urgent request defeats them all.",
    explanation: "Every attack described in this playbook succeeds by manufacturing urgency so powerful the target acts without thinking. Your account is deleted in 24 hours. Your family member needs help right now. The investment closes at midnight. Criminals know that a panicked person does not verify. Every technical security measure can be bypassed by someone panicked enough to hand over credentials voluntarily.",
    defence: "Before clicking, sending money, or sharing information in response to anything urgent and unsolicited: pause five seconds. Ask 'Did I initiate this, or did it come to me?' If it came to you — verify through a completely separate channel. Call on a number you already know. Visit the website by typing the address manually. Those five seconds cost nothing and stop everything.",
    articleSlug: "identity-data-protection-cybersecurity-guide-2026",
  },
];

export default function CybersecurityPlaybook() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return ITEMS.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.explanation.toLowerCase().includes(q) ||
        item.defence.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const goToPage = (p: number) => {
    setPage(p);
    setExpandedId(null);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const resetFilters = () => {
    setSearch("");
    setActiveCategory("All");
    setPage(1);
    setExpandedId(null);
  };

  const toggle = (id: number) => setExpandedId(expandedId === id ? null : id);

  return (
    <Layout>
      <SEOHead
        title="Cybersecurity Playbook — 50 Threats Every Person Needs to Know"
        description="An interactive guide to the 50 most important cybersecurity threats — scams, password mistakes, smart home risks, travel traps, and identity theft — with exact defences for each."
        canonical="/tools/cybersecurity-playbook"
        keywords={[
          "cybersecurity awareness Ghana",
          "scam prevention Africa",
          "online safety guide",
          "phishing protection",
          "identity theft prevention",
          "cybersecurity playbook",
          "digital security tips",
        ]}
      />

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 text-white py-16 md:py-24">
        <div className="container max-w-4xl mx-auto text-center px-4">
          <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <Shield className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            The Cybersecurity Playbook
          </h1>
          <p className="text-lg md:text-xl text-blue-200 max-w-2xl mx-auto mb-3">
            50 real threats. 50 exact defences. Written for everyone — no technical background required.
          </p>
          <p className="text-sm text-white/50">
            Based on the 5-part TechTrendi Security Series · Updated 2026
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 mt-10">
            {[
              { label: "Threats Covered", value: "50" },
              { label: "Categories", value: "5" },
              { label: "Min to Read All", value: "60" },
              { label: "Cost to Defend", value: "GHS 0" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-blue-300">{s.value}</div>
                <div className="text-xs text-white/60 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-10">

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search threats, scams, defences..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); setExpandedId(null); }}
            className="pl-11 h-12 text-base rounded-xl border-border bg-background"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(({ name, icon: Icon }) => (
            <button
              key={name}
              onClick={() => { setActiveCategory(name); setPage(1); setExpandedId(null); }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border",
                activeCategory === name
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {name}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div ref={listRef} className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {filtered.length === 50
              ? `All 50 threats`
              : `${filtered.length} of 50 threats`}
            {search && ` matching "${search}"`}
            {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
          </p>
          {(search || activeCategory !== "All") && (
            <button onClick={resetFilters} className="text-xs text-primary hover:underline">
              Clear filters
            </button>
          )}
        </div>

        {/* Items */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No threats match your search</p>
              <p className="text-sm mt-1">Try different keywords or clear the filters</p>
            </div>
          ) : (
            paginated.map((item) => {
              const isOpen = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-xl border transition-all duration-200",
                    isOpen
                      ? "border-primary/40 bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
                  )}
                >
                  {/* Header row */}
                  <button
                    onClick={() => toggle(item.id)}
                    className="w-full text-left px-5 py-4 flex items-start gap-4"
                  >
                    {/* Number badge */}
                    <span className={cn(
                      "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mt-0.5",
                      isOpen
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {item.id}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge className={cn("text-xs font-medium border-0", CATEGORY_STYLES[item.category])}>
                          {item.category}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-foreground text-base leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>

                    <span className="shrink-0 text-muted-foreground mt-1">
                      {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </span>
                  </button>

                  {/* Expanded content */}
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 ml-12 border-t border-border/50">
                      <div className="space-y-4 mt-4">
                        {/* How it works */}
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                            How It Works
                          </h4>
                          <p className="text-sm text-foreground leading-relaxed">
                            {item.explanation}
                          </p>
                        </div>

                        {/* Defence */}
                        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/40 rounded-lg p-4">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400 mb-2 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5" />
                            Your Defence
                          </h4>
                          <p className="text-sm text-green-900 dark:text-green-200 leading-relaxed">
                            {item.defence}
                          </p>
                        </div>

                        {/* Read full article */}
                        <a
                          href={`/blog/${item.articleSlug}`}
                          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                        >
                          Read full article — deep dive with examples
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className="w-9 h-9 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(p)}
                className="w-9 h-9 p-0 text-sm font-medium"
              >
                {p}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              className="w-9 h-9 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Article series links */}
        <div className="mt-14 rounded-2xl border border-border bg-muted/30 p-6 md:p-8">
          <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            The Full 5-Part Cybersecurity Series
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Each article goes deep on 10 threats — with real-world stories, Ghana-specific examples, and step-by-step defences.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { num: 1, cat: "Scam Teardowns", desc: "AI voice clones, wrong number cons, fake QR codes & more" },
              { num: 2, cat: "Password & Accounts", desc: "Credential stuffing, SIM swaps, security question flaws & more" },
              { num: 3, cat: "Smart Home & Physical", desc: "Router defaults, camera peeping, relay car theft & more" },
              { num: 4, cat: "Travel & Public Safety", desc: "Juice jacking, boarding pass barcodes, ATM skimmers & more" },
              { num: 5, cat: "Identity & Data", desc: "Credit freezes, data brokers, dark web myths & more" },
            ].map((a) => (
              <a
                key={a.num}
                href={ARTICLE_LINKS[a.cat]}
                className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <span className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  {a.num}
                </span>
                <div>
                  <div className="font-medium text-sm text-foreground">{a.cat}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{a.desc}</div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Share CTA */}
        <div className="mt-8 text-center p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-100 dark:border-blue-900/30">
          <h3 className="font-bold text-foreground mb-2">Share This Playbook</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            The person most likely to fall for one of these scams is not careless — they are simply unaware. Share this with someone who needs it.
          </p>
        </div>
      </div>
    </Layout>
  );
}
