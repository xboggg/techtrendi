import CategoryPage from "./CategoryPage";
import { Shield } from "lucide-react";

export default function Security() {
  return (
    <CategoryPage
      categoryName="Security"
      categoryTitle="Security & Privacy"
      categoryDescription="Protect yourself online with our comprehensive guides on passwords, VPNs, two-factor authentication, and staying safe from scams."
      categoryTags={["security", "privacy", "password", "vpn", "encryption", "hack", "scam", "phishing", "2fa"]}
      heroIcon={<Shield className="w-8 h-8" />}
    />
  );
}
