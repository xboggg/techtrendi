import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LinkIcon, Plus, Trash2, GripVertical, Copy, Check, ExternalLink,
  Instagram, Twitter, Youtube, Github, Linkedin, Globe, Mail, Phone,
  Palette, Eye, Share2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Link {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

interface Profile {
  name: string;
  bio: string;
  avatar: string;
  theme: string;
  links: Link[];
}

const themes = [
  { name: "Default", bg: "bg-gradient-to-br from-purple-600 to-blue-600", card: "bg-white/90" },
  { name: "Dark", bg: "bg-gray-900", card: "bg-gray-800" },
  { name: "Sunset", bg: "bg-gradient-to-br from-orange-500 to-pink-500", card: "bg-white/90" },
  { name: "Ocean", bg: "bg-gradient-to-br from-cyan-500 to-blue-500", card: "bg-white/90" },
  { name: "Forest", bg: "bg-gradient-to-br from-green-600 to-emerald-600", card: "bg-white/90" },
  { name: "Minimal", bg: "bg-gray-100", card: "bg-white" },
];

const iconOptions = [
  { name: "globe", icon: Globe },
  { name: "instagram", icon: Instagram },
  { name: "twitter", icon: Twitter },
  { name: "youtube", icon: Youtube },
  { name: "github", icon: Github },
  { name: "linkedin", icon: Linkedin },
  { name: "mail", icon: Mail },
  { name: "phone", icon: Phone },
];

export default function LinkInBio() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>({
    name: "Your Name",
    bio: "Creator • Designer • Developer",
    avatar: "",
    theme: "Default",
    links: [
      { id: "1", title: "My Website", url: "https://example.com", icon: "globe" },
      { id: "2", title: "Follow on Twitter", url: "https://twitter.com", icon: "twitter" },
    ],
  });
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("techtrendi_linkinbio");
    if (saved) {
      setProfile(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("techtrendi_linkinbio", JSON.stringify(profile));
  }, [profile]);

  const addLink = () => {
    setProfile({
      ...profile,
      links: [
        ...profile.links,
        { id: Date.now().toString(), title: "New Link", url: "", icon: "globe" },
      ],
    });
  };

  const updateLink = (id: string, field: keyof Link, value: string) => {
    setProfile({
      ...profile,
      links: profile.links.map((link) =>
        link.id === id ? { ...link, [field]: value } : link
      ),
    });
  };

  const deleteLink = (id: string) => {
    setProfile({
      ...profile,
      links: profile.links.filter((link) => link.id !== id),
    });
  };

  const moveLink = (id: string, direction: "up" | "down") => {
    const index = profile.links.findIndex((l) => l.id === id);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === profile.links.length - 1)
    ) {
      return;
    }

    const newLinks = [...profile.links];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newLinks[index], newLinks[newIndex]] = [newLinks[newIndex], newLinks[index]];
    setProfile({ ...profile, links: newLinks });
  };

  const copyLink = () => {
    const url = `https://techtrendi.com/bio/${user?.id || "preview"}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const currentTheme = themes.find((t) => t.name === profile.theme) || themes[0];

  const getIcon = (iconName?: string) => {
    const iconConfig = iconOptions.find((i) => i.name === iconName);
    return iconConfig ? iconConfig.icon : Globe;
  };

  return (
    <Layout>
      <SEOHead
        title="Link in Bio - Free Bio Link Page Creator | TechTrendi"
        description="Create a beautiful link page for your social profiles. Free alternative to Linktree with custom themes and unlimited links."
        canonicalUrl="https://techtrendi.com/tools/link-in-bio"
      />

      <div className="container py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Free + Account
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Link in <span className="text-primary">Bio</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Create a beautiful link page for your social profiles. Free forever.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Editor */}
          <div className="space-y-6">
            {/* Profile Section */}
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <Label>Bio</Label>
                  <Textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="A short bio about yourself"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Avatar URL (optional)</Label>
                  <Input
                    value={profile.avatar}
                    onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Theme Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Theme
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {themes.map((theme) => (
                    <button
                      key={theme.name}
                      onClick={() => setProfile({ ...profile, theme: theme.name })}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all",
                        profile.theme === theme.name
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-transparent hover:border-muted"
                      )}
                    >
                      <div className={cn("w-full h-12 rounded-lg mb-2", theme.bg)} />
                      <span className="text-xs">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Links */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="w-5 h-5" />
                    Links
                  </CardTitle>
                  <Button onClick={addLink} size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Link
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {profile.links.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No links yet. Add your first link above!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {profile.links.map((link, index) => (
                      <div
                        key={link.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
                      >
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveLink(link.id, "up")}
                            disabled={index === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveLink(link.id, "down")}
                            disabled={index === profile.links.length - 1}
                          >
                            ↓
                          </Button>
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex gap-2">
                            <select
                              value={link.icon}
                              onChange={(e) => updateLink(link.id, "icon", e.target.value)}
                              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                            >
                              {iconOptions.map((opt) => (
                                <option key={opt.name} value={opt.name}>
                                  {opt.name.charAt(0).toUpperCase() + opt.name.slice(1)}
                                </option>
                              ))}
                            </select>
                            <Input
                              value={link.title}
                              onChange={(e) => updateLink(link.id, "title", e.target.value)}
                              placeholder="Link title"
                              className="flex-1"
                            />
                          </div>
                          <Input
                            value={link.url}
                            onChange={(e) => updateLink(link.id, "url", e.target.value)}
                            placeholder="https://..."
                          />
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteLink(link.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Share */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Input
                    value={`techtrendi.com/bio/${user?.id || "yourname"}`}
                    readOnly
                    className="flex-1"
                  />
                  <Button onClick={copyLink}>
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    Copy
                  </Button>
                </div>
                {!user && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Sign in to get your custom URL and save your page
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-24 h-fit">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Preview
                  </CardTitle>
                  <Badge variant="outline">Live Preview</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Phone Frame */}
                <div className="mx-auto max-w-[320px]">
                  <div className="border-[8px] border-gray-800 rounded-[32px] overflow-hidden shadow-2xl">
                    {/* Phone Notch */}
                    <div className="bg-gray-800 h-6 flex justify-center">
                      <div className="w-20 h-4 bg-gray-900 rounded-b-xl" />
                    </div>

                    {/* Page Content */}
                    <div className={cn("min-h-[500px] p-6", currentTheme.bg)}>
                      {/* Avatar */}
                      <div className="flex flex-col items-center mb-6">
                        {profile.avatar ? (
                          <img
                            src={profile.avatar}
                            alt={profile.name}
                            className="w-20 h-20 rounded-full object-cover border-4 border-white/50 mb-3"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center text-3xl font-bold text-white mb-3">
                            {profile.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <h2 className={cn(
                          "font-bold text-lg",
                          currentTheme.name === "Minimal" ? "text-gray-900" : "text-white"
                        )}>
                          {profile.name}
                        </h2>
                        <p className={cn(
                          "text-sm text-center",
                          currentTheme.name === "Minimal" ? "text-gray-600" : "text-white/80"
                        )}>
                          {profile.bio}
                        </p>
                      </div>

                      {/* Links */}
                      <div className="space-y-3">
                        {profile.links.map((link) => {
                          const IconComponent = getIcon(link.icon);
                          return (
                            <a
                              key={link.id}
                              href={link.url || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02]",
                                currentTheme.card,
                                currentTheme.name === "Dark" ? "text-white" : "text-gray-800"
                              )}
                            >
                              <IconComponent className="w-5 h-5" />
                              <span className="flex-1 font-medium text-sm">{link.title}</span>
                              <ExternalLink className="w-4 h-4 opacity-50" />
                            </a>
                          );
                        })}
                      </div>

                      {/* Footer */}
                      <div className="mt-8 text-center">
                        <p className={cn(
                          "text-xs",
                          currentTheme.name === "Minimal" ? "text-gray-400" : "text-white/50"
                        )}>
                          Made with TechTrendi
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {!user && (
              <Card className="mt-6 border-primary/30 bg-primary/5">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm">
                    <strong>Sign in</strong> to publish your page and get your custom URL!
                  </p>
                  <Button className="mt-4" asChild>
                    <a href="/auth">Sign In Free</a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
