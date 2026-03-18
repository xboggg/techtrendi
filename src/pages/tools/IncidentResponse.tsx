import { useState, useCallback } from "react";
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
  Phone,
  MessageCircle,
  Link,
  KeyRound,
  CreditCard,
  Mail,
  CheckCircle,
  AlertTriangle,
  Copy,
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
  Lightbulb,
  ArrowLeft,
} from "lucide-react";

type IncidentType =
  | "momo"
  | "whatsapp"
  | "suspicious-link"
  | "otp"
  | "personal-details"
  | "email";

interface Contact {
  name: string;
  value: string;
  type: "phone" | "email" | "url";
}

interface Step {
  title: string;
  description: string;
  urgency: "first" | "next" | "today";
}

interface Incident {
  id: IncidentType;
  label: string;
  emoji: string;
  icon: React.ElementType;
  color: string;
  headerBg: string;
  steps: Step[];
  contacts: Contact[];
  preventionTip: string;
}

const incidents: Incident[] = [
  {
    id: "momo",
    label: "My MoMo was drained",
    emoji: "\ud83d\udcf1",
    icon: Phone,
    color: "text-red-600 dark:text-red-400",
    headerBg: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
    steps: [
      {
        title: "Call your network provider immediately",
        description:
          "Dial 100 from any phone. Tell them your MoMo has been compromised and request an immediate freeze on your account. Do NOT hang up until they confirm the freeze.",
        urgency: "first",
      },
      {
        title: "Go to a network store in person",
        description:
          "Visit the nearest MTN, Vodafone, or AirtelTigo store with your Ghana Card. Request a full account audit and new SIM if your number was ported.",
        urgency: "first",
      },
      {
        title: "Report to Cyber & Financial Crime (CARF)",
        description:
          "Call the toll-free line 0800-111-000 to report the incident. They can trace transactions and coordinate with banks and telcos to recover funds.",
        urgency: "next",
      },
      {
        title: "Screenshot all evidence",
        description:
          "Take screenshots of your MoMo transaction history, any suspicious SMS messages, and call logs. Save these in a separate folder -- you will need them for police reports.",
        urgency: "next",
      },
      {
        title: "Change your MoMo PIN",
        description:
          "Once your account is restored, change your PIN immediately. Use a PIN that is NOT your birthday, phone number, or any easily guessed number.",
        urgency: "today",
      },
    ],
    contacts: [
      { name: "MTN / Vodafone / AirtelTigo", value: "100", type: "phone" },
      { name: "CERT-GH (Cyber Security)", value: "0800-111-000", type: "phone" },
      { name: "Ghana Police CID", value: "0302-773-906", type: "phone" },
    ],
    preventionTip:
      "Never share your MoMo PIN with anyone, not even someone claiming to be from the network. Legitimate agents will never ask for your PIN over the phone.",
  },
  {
    id: "whatsapp",
    label: "My WhatsApp was hijacked",
    emoji: "\ud83d\udcac",
    icon: MessageCircle,
    color: "text-green-600 dark:text-green-400",
    headerBg:
      "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
    steps: [
      {
        title: "Re-register your phone number on WhatsApp",
        description:
          "Open WhatsApp on your phone, enter your number, and request a new verification code via SMS. This will kick the hacker out of your account.",
        urgency: "first",
      },
      {
        title: "Message your contacts with a warning",
        description:
          "Use SMS, calls, or another app to warn your contacts that your WhatsApp was compromised. Tell them to ignore any messages asking for money or OTPs.",
        urgency: "first",
      },
      {
        title: "Enable 2-step verification",
        description:
          "Go to Settings > Account > Two-step verification > Enable. Set a 6-digit PIN. This prevents anyone from re-registering your number without this PIN.",
        urgency: "next",
      },
      {
        title: "Check linked devices",
        description:
          "Go to Settings > Linked Devices and remove any devices you do not recognize. The hacker may have linked a computer to read your messages.",
        urgency: "next",
      },
      {
        title: "Review sent messages",
        description:
          "Check your chat history for any messages sent by the hacker, especially requests for money or links. Report these chats and warn affected contacts.",
        urgency: "today",
      },
    ],
    contacts: [
      {
        name: "WhatsApp Support",
        value: "support@whatsapp.com",
        type: "email",
      },
      { name: "CERT-GH (Cyber Security)", value: "0800-111-000", type: "phone" },
      { name: "Ghana Police CID", value: "0302-773-906", type: "phone" },
    ],
    preventionTip:
      "Never share your WhatsApp verification code with anyone. WhatsApp will never call or message you asking for your code. Enable 2-step verification now.",
  },
  {
    id: "suspicious-link",
    label: "I clicked a suspicious link",
    emoji: "\ud83d\udd17",
    icon: Link,
    color: "text-orange-600 dark:text-orange-400",
    headerBg:
      "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800",
    steps: [
      {
        title: "Did you enter a password? Change it NOW",
        description:
          "If you typed any password on the page, change that password immediately from a different device. If you use the same password elsewhere, change those too.",
        urgency: "first",
      },
      {
        title: "Did you install anything? Factory reset",
        description:
          "If you downloaded or installed any file or app from the link, back up your important data and do a factory reset on your device. The app could be spyware.",
        urgency: "first",
      },
      {
        title: "Run antivirus scan",
        description:
          "If you only viewed the page, run a full antivirus scan on your device. Use a trusted antivirus app like Malwarebytes, Avast, or your device's built-in security.",
        urgency: "next",
      },
      {
        title: "Clear your browser data",
        description:
          "Clear cookies, cache, and browsing history in your browser settings. This removes any tracking cookies or session data the malicious site may have planted.",
        urgency: "next",
      },
      {
        title: "Monitor accounts if you only viewed the page",
        description:
          "If you only viewed the page without entering any information, monitor your accounts for unusual activity over the next few days. You are likely safe.",
        urgency: "today",
      },
    ],
    contacts: [
      { name: "MTN / Vodafone / AirtelTigo", value: "100", type: "phone" },
      { name: "Ecobank Ghana", value: "0800-100-100", type: "phone" },
      { name: "GCB Bank", value: "0302-673-980", type: "phone" },
      { name: "CERT-GH (Cyber Security)", value: "0800-111-000", type: "phone" },
    ],
    preventionTip:
      "Before clicking any link, hover over it to see the actual URL. Look for misspellings (e.g., 'g00gle.com'). When in doubt, go directly to the website by typing the address yourself.",
  },
  {
    id: "otp",
    label: "I gave someone an OTP",
    emoji: "\ud83d\udd22",
    icon: KeyRound,
    color: "text-purple-600 dark:text-purple-400",
    headerBg:
      "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800",
    steps: [
      {
        title: "Identify which account the OTP was for",
        description:
          "Check the SMS or app notification that sent the OTP. It will say which service it was for -- MoMo, WhatsApp, your bank, or email. This determines your next step.",
        urgency: "first",
      },
      {
        title: "MoMo OTP: Call your provider immediately",
        description:
          "Dial 100 and request an immediate freeze on your MoMo account. The scammer may already be transferring money. Every second counts.",
        urgency: "first",
      },
      {
        title: "WhatsApp OTP: Re-register your number",
        description:
          "Open WhatsApp and re-register with your phone number. Request a new SMS code. This will log the scammer out. Then enable 2-step verification.",
        urgency: "next",
      },
      {
        title: "Bank OTP: Call your bank",
        description:
          "Call your bank's fraud hotline immediately. Request a temporary block on your account and cards. Ask them to reverse any unauthorized transactions.",
        urgency: "next",
      },
      {
        title: "Email OTP: Secure your email account",
        description:
          "Log in to your email from a trusted device and change your password. Enable 2-factor authentication. Check for any forwarding rules the attacker may have set up.",
        urgency: "today",
      },
    ],
    contacts: [
      { name: "MTN / Vodafone / AirtelTigo", value: "100", type: "phone" },
      { name: "Ecobank Ghana", value: "0800-100-100", type: "phone" },
      { name: "GCB Bank", value: "0302-673-980", type: "phone" },
      { name: "CERT-GH (Cyber Security)", value: "0800-111-000", type: "phone" },
    ],
    preventionTip:
      "OTPs are like digital keys -- they unlock your accounts. No legitimate company, bank, or network provider will ever ask you to share an OTP. If someone asks, it is a scam.",
  },
  {
    id: "personal-details",
    label: "I shared personal details",
    emoji: "\ud83e\udea3",
    icon: CreditCard,
    color: "text-blue-600 dark:text-blue-400",
    headerBg:
      "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
    steps: [
      {
        title: "Ghana Card shared: Report to NIA",
        description:
          "Call the National Identification Authority at 0302-770-424. Report that your Ghana Card details were compromised. They can flag your ID against fraudulent use.",
        urgency: "first",
      },
      {
        title: "Bank details shared: Call your bank",
        description:
          "Call your bank immediately and inform them your account details were shared with an unauthorized person. Request enhanced monitoring or a new account number.",
        urgency: "first",
      },
      {
        title: "MoMo details shared: Call 100",
        description:
          "Dial 100 and request a PIN change and account review. If you shared your PIN as well, request a temporary freeze while you secure your account.",
        urgency: "next",
      },
      {
        title: "Name and photo shared: Monitor social media",
        description:
          "Search for your name and image on social media platforms. Scammers may create fake profiles using your identity. Report any fake accounts you find.",
        urgency: "next",
      },
      {
        title: "File a police report",
        description:
          "Visit your nearest police station or call CID at 0302-773-906. A police report creates an official record and can help if the scammer uses your identity for fraud.",
        urgency: "today",
      },
    ],
    contacts: [
      {
        name: "National Identification Authority (NIA)",
        value: "0302-770-424",
        type: "phone",
      },
      { name: "GCB Bank", value: "0302-673-980", type: "phone" },
      { name: "Ecobank Ghana", value: "0800-100-100", type: "phone" },
      { name: "Ghana Police CID", value: "0302-773-906", type: "phone" },
      { name: "CERT-GH (Cyber Security)", value: "0800-111-000", type: "phone" },
    ],
    preventionTip:
      "Be very careful about who you share your Ghana Card number, date of birth, or bank details with. Legitimate organizations already have your details on file and will not ask you to send them via chat or phone.",
  },
  {
    id: "email",
    label: "My email was hacked",
    emoji: "\ud83d\udce7",
    icon: Mail,
    color: "text-yellow-600 dark:text-yellow-400",
    headerBg:
      "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800",
    steps: [
      {
        title: "Try to recover your account",
        description:
          "Go to your email provider's account recovery page (e.g., accounts.google.com/signin/recovery for Gmail). Use your recovery phone or backup email to regain access.",
        urgency: "first",
      },
      {
        title: "Change your password from a clean device",
        description:
          "Once you regain access, change your password immediately. Use a device you trust -- not the one that may have been compromised. Use a strong, unique password.",
        urgency: "first",
      },
      {
        title: "Check accounts linked to your email",
        description:
          "Your email is the key to many accounts (MoMo, banking apps, social media). Check each one for unauthorized activity. Change passwords for critical accounts.",
        urgency: "next",
      },
      {
        title: "Remove unauthorized apps and forwarding rules",
        description:
          "Check Settings > Security > Third-party apps and revoke access to any apps you do not recognize. Also check for email forwarding rules that send copies to the attacker.",
        urgency: "next",
      },
      {
        title: "Enable 2-factor authentication and warn contacts",
        description:
          "Turn on 2FA using an authenticator app (not just SMS). Then email your contacts warning them to ignore any suspicious messages that came from your account.",
        urgency: "today",
      },
    ],
    contacts: [
      {
        name: "Google Account Recovery",
        value: "accounts.google.com/signin/recovery",
        type: "url",
      },
      { name: "CERT-GH (Cyber Security)", value: "0800-111-000", type: "phone" },
      { name: "Ghana Police CID", value: "0302-773-906", type: "phone" },
    ],
    preventionTip:
      "Use a unique, strong password for your email -- it is the master key to your digital life. Enable 2-factor authentication and never use public Wi-Fi to log in without a VPN.",
  },
];

const urgencyConfig = {
  first: {
    label: "Do this FIRST",
    className:
      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700",
  },
  next: {
    label: "Do this next",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700",
  },
  today: {
    label: "Do this today",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700",
  },
};

export default function IncidentResponse() {
  const [selectedIncident, setSelectedIncident] =
    useState<IncidentType | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [showContacts, setShowContacts] = useState(true);

  const activeIncident = incidents.find((i) => i.id === selectedIncident);

  const toggleStep = useCallback(
    (stepKey: string) => {
      setCompletedSteps((prev) => {
        const next = new Set(prev);
        if (next.has(stepKey)) {
          next.delete(stepKey);
        } else {
          next.add(stepKey);
          toast.success("Step marked as completed");
        }
        return next;
      });
    },
    []
  );

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text.replace(/-/g, ""));
    toast.success(`${label} copied to clipboard`);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedIncident(null);
    setCompletedSteps(new Set());
  }, []);

  const progressPercent = activeIncident
    ? (Array.from(completedSteps).filter((k) =>
        k.startsWith(activeIncident.id)
      ).length /
        activeIncident.steps.length) *
      100
    : 0;

  const completedCount = activeIncident
    ? Array.from(completedSteps).filter((k) =>
        k.startsWith(activeIncident.id)
      ).length
    : 0;

  return (
    <Layout>
      <SEOHead
        title="Cyber Incident Response Guide | TechTrendi"
        description="Been hacked? MoMo drained? WhatsApp hijacked? Follow our step-by-step guide to respond to cyber incidents in Ghana."
      />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Emergency Banner */}
        <div className="mb-8 rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-950/50 p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 animate-pulse" />
            <h1 className="text-2xl md:text-3xl font-bold text-red-700 dark:text-red-300">
              Cyber Incident Response Guide
            </h1>
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 animate-pulse" />
          </div>
          <p className="text-red-600 dark:text-red-400 text-lg">
            Think you've been hacked? Follow the steps below.
          </p>
        </div>

        {!selectedIncident ? (
          <>
            {/* Incident Type Selection Grid */}
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              What happened to you?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {incidents.map((incident) => {
                const Icon = incident.icon;
                return (
                  <Button
                    key={incident.id}
                    variant="outline"
                    className={cn(
                      "h-auto p-6 flex flex-col items-center gap-3 text-center",
                      "hover:scale-[1.02] transition-all duration-200",
                      "border-2 hover:border-gray-400 dark:hover:border-gray-500",
                      "bg-white dark:bg-gray-900"
                    )}
                    onClick={() => setSelectedIncident(incident.id)}
                  >
                    <span className="text-3xl">{incident.emoji}</span>
                    <Icon className={cn("h-6 w-6", incident.color)} />
                    <span className="font-medium text-sm">
                      {incident.label}
                    </span>
                  </Button>
                );
              })}
            </div>

            {/* How It Works & Tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Info className="h-5 w-5 text-blue-500" />
                    How It Works
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-bold text-blue-700 dark:text-blue-300">
                      1
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Select the incident type that matches what happened to you
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-bold text-blue-700 dark:text-blue-300">
                      2
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Follow the step-by-step response instructions in order of
                      urgency
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-bold text-blue-700 dark:text-blue-300">
                      3
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Mark each step as completed to track your progress
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    Important Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        The first 60 minutes are critical.
                      </span>{" "}
                      Act fast to minimize damage.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Always call your network provider or bank first -- they
                      can freeze your account immediately.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Screenshot everything -- messages, transactions, call
                      logs. You will need evidence for reports.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : activeIncident ? (
          <>
            {/* Back Button */}
            <Button
              variant="ghost"
              className="mb-4 gap-2"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to all incidents
            </Button>

            {/* Response Card */}
            <Card className="mb-6 overflow-hidden">
              {/* Color-coded alert header */}
              <div
                className={cn(
                  "p-5 border-b",
                  activeIncident.headerBg
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{activeIncident.emoji}</span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {activeIncident.label}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Follow these steps in order
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="px-5 pt-4 pb-2">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    Progress
                  </span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {completedCount} / {activeIncident.steps.length} steps
                    completed
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              {/* Steps */}
              <CardContent className="pt-4 space-y-4">
                {activeIncident.steps.map((step, index) => {
                  const stepKey = `${activeIncident.id}-${index}`;
                  const isCompleted = completedSteps.has(stepKey);
                  const urgency = urgencyConfig[step.urgency];

                  return (
                    <div
                      key={stepKey}
                      className={cn(
                        "rounded-lg border-2 p-4 transition-all duration-300",
                        isCompleted
                          ? "border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/30"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Clickable step number / checkmark */}
                        <button
                          onClick={() => toggleStep(stepKey)}
                          className={cn(
                            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                            "font-bold text-sm transition-all duration-300",
                            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                            isCompleted
                              ? "bg-green-500 text-white scale-110"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                          )}
                          title={
                            isCompleted ? "Mark as incomplete" : "Mark as done"
                          }
                        >
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            index + 1
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3
                              className={cn(
                                "font-semibold text-gray-900 dark:text-gray-100",
                                isCompleted && "line-through opacity-60"
                              )}
                            >
                              {step.title}
                            </h3>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs border",
                                urgency.className
                              )}
                            >
                              {urgency.label}
                            </Badge>
                          </div>
                          <p
                            className={cn(
                              "text-sm text-gray-600 dark:text-gray-400",
                              isCompleted && "opacity-60"
                            )}
                          >
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            <Card className="mb-6">
              <CardHeader
                className="cursor-pointer"
                onClick={() => setShowContacts((prev) => !prev)}
              >
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-red-500" />
                    Emergency Contacts
                  </div>
                  {showContacts ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </CardTitle>
              </CardHeader>
              {showContacts && (
                <CardContent className="pt-0 space-y-3">
                  {activeIncident.contacts.map((contact, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {contact.name}
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          {contact.type === "url"
                            ? contact.value
                            : contact.value}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        onClick={() =>
                          copyToClipboard(contact.value, contact.name)
                        }
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>

            {/* Prevention Tip */}
            <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-green-800 dark:text-green-300 mb-1">
                      Prevention Tip
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      {activeIncident.preventionTip}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </Layout>
  );
}
