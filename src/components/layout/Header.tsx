import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, User, LogOut, Crown, Shield, Sparkles, Flame, Smartphone, Lock, Cpu, Lightbulb, BookOpen, DollarSign, ShoppingBag, LayoutDashboard, Newspaper, Gamepad2, Watch, Briefcase, HeartPulse, Wifi, Leaf, Zap, Star, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { SearchButton } from "@/components/ui/search-modal";
import { ThemeToggleSimple as ThemeToggle } from "@/components/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mega menu categories
const exploreCategories = [
  { label: "Phones", href: "/phones", icon: Smartphone, description: "Latest smartphones & mobile tech" },
  { label: "Security", href: "/security", icon: Lock, description: "Cybersecurity tips & guides" },
  { label: "AI Tech", href: "/ai-tech", icon: Cpu, description: "Artificial intelligence trends" },
  { label: "Productivity", href: "/productivity", icon: Lightbulb, description: "Apps & tools to boost workflow" },
  { label: "How-To", href: "/how-to", icon: BookOpen, description: "Step-by-step tutorials" },
  { label: "Smart Income", href: "/smart-income", icon: DollarSign, description: "Digital skills & entrepreneurship" },
  { label: "Gaming", href: "/gaming", icon: Gamepad2, description: "Games, consoles & PC builds" },
  { label: "Accessories", href: "/accessories", icon: Watch, description: "Gadgets, wearables & peripherals" },
  { label: "Career in Tech", href: "/career-in-tech", icon: Briefcase, description: "Jobs, interviews & career growth" },
  { label: "Health Tech", href: "/health-tech", icon: HeartPulse, description: "Wellness devices & health apps" },
  { label: "Remote Work", href: "/remote-work", icon: Wifi, description: "WFH tools, tips & productivity" },
  { label: "Green Tech", href: "/green-tech", icon: Leaf, description: "Sustainable tech & eco innovation" },
];

interface NavLink {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  isHot?: boolean;
  isMegaMenu?: boolean;
  submenu?: { label: string; href: string }[];
}

const navLinks: NavLink[] = [
  {
    label: "Blog",
    href: "/blog",
    isMegaMenu: true,
  },
  { label: "Security", href: "/security", icon: Shield, isHot: true },
  { label: "Africa Tech", href: "/news?category=Africa Tech", icon: Globe },
  { label: "News", href: "/news", icon: Newspaper },
  { label: "Toolbox", href: "/tools" },
  { label: "Reviews", href: "/reviews" },
  { label: "DigiStore", href: "/store", icon: ShoppingBag },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, subscription, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const isHomepage = location.pathname === "/";
  const isOverHero = isHomepage && !isScrolled;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + "/");

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "glass-nav shadow-glass border-b border-white/10"
          : isHomepage
            ? "bg-transparent border-b border-transparent"
            : "glass-nav shadow-glass border-b border-white/10"
      }`}
    >
      <div className="container mx-auto">
        <nav className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-0.5 group" aria-label="TechTrendi — Ghana's Tech Hub">
            <img
              src="/logo-t.png"
              alt="TechTrendi"
              className="h-12 w-auto group-hover:scale-105 transition-transform duration-300"
            />
            <div className="flex flex-col leading-tight">
              <span className={`text-xl font-bold ${isOverHero ? "text-white" : "text-foreground"}`}>
                Tech<span className={isOverHero ? "text-purple-400" : "text-gradient"}>Trendi</span>
              </span>
              <span className={`hidden sm:block text-[10px] font-medium tracking-wide uppercase ${isOverHero ? "text-white/70" : "text-muted-foreground"}`}>
                Ghana's Tech Hub 🇬🇭
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => (link.isMegaMenu || link.submenu) && setOpenDropdown(link.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link
                  to={link.href}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(link.href)
                      ? isOverHero ? "text-white bg-white/20 shadow-sm" : "text-primary bg-primary/10 shadow-sm"
                      : isOverHero ? "text-white/80 hover:text-white hover:bg-white/10" : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/5"
                  } ${link.isHot ? "relative" : ""}`}
                >
                  {link.icon && <link.icon className="w-4 h-4 text-orange-500" />}
                  {link.label}
                  {link.isHot && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full animate-pulse">
                      HOT
                    </span>
                  )}
                  {(link.isMegaMenu || link.submenu) && <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openDropdown === link.label ? 'rotate-180' : ''}`} />}
                </Link>

                {/* Mega Menu for Explore */}
                {link.isMegaMenu && openDropdown === link.label && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 animate-scale-in">
                    <div className="glass-strong rounded-2xl shadow-elevated p-4 min-w-[700px] border border-white/20 dark:border-white/10">
                      <div className="grid grid-cols-3 gap-2">
                        {exploreCategories.map((category) => (
                          <Link
                            key={category.label}
                            to={category.href}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-primary/5 transition-all duration-200 group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-secondary/20 transition-all">
                              <category.icon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground group-hover:text-primary transition-colors">{category.label}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{category.description}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <Link
                          to="/blog"
                          className="flex items-center justify-center gap-2 py-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          View All Articles
                          <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Regular submenu */}
                {link.submenu && openDropdown === link.label && (
                  <div className="absolute top-full left-0 pt-2 animate-scale-in">
                    <div className="glass-strong rounded-2xl shadow-elevated p-2 min-w-[220px] border border-white/20 dark:border-white/10">
                      {link.submenu.map((sublink) => (
                        <Link
                          key={sublink.label}
                          to={sublink.href}
                          className="block px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all duration-200"
                        >
                          {sublink.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            <SearchButton className="hidden md:flex" isOverHero={isOverHero} />

            <ThemeToggle className={isOverHero ? "text-white hover:text-white/80 hover:bg-white/10" : ""} />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-200">
                    <div className="relative w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center shadow-sm">
                      <span className="text-primary-foreground text-sm font-semibold">
                        {user.email?.charAt(0).toUpperCase()}
                      </span>
                      {subscription.subscribed && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-gradient-accent flex items-center justify-center shadow-sm">
                          <Crown className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 glass-strong rounded-2xl border border-white/20 dark:border-white/10 p-2">
                  <div className="px-3 py-3 mb-1">
                    <p className="text-sm font-semibold text-foreground truncate">{user.email}</p>
                    {subscription.subscribed ? (
                      <p className="text-xs text-gradient-accent font-medium flex items-center gap-1 mt-1">
                        <Crown className="w-3 h-3" /> Premium Member
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">Free Plan</p>
                    )}
                  </div>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem asChild className="rounded-xl py-2.5 focus:bg-primary/5">
                    <Link to="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      My Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl py-2.5 focus:bg-primary/5">
                    <Link to="/profile" className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild className="rounded-xl py-2.5 focus:bg-primary/5">
                      <Link to="/admin" className="cursor-pointer">
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild className="rounded-xl py-2.5 focus:bg-primary/5">
                    <Link to="/premium" className="cursor-pointer">
                      <Crown className="w-4 h-4 mr-2" />
                      {subscription.subscribed ? "Manage Subscription" : "Upgrade to Premium"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive rounded-xl py-2.5 focus:bg-destructive/5">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className={`hidden md:inline-flex rounded-xl ${isOverHero ? "text-white hover:bg-white/10" : "hover:bg-white/50 dark:hover:bg-white/5"}`}>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button size="sm" asChild className="hidden md:inline-flex btn-premium rounded-xl text-white shadow-card">
                  <Link to="/premium" className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Get Premium
                  </Link>
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-2.5 rounded-xl transition-all duration-200 ${isOverHero ? "text-white hover:bg-white/10" : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/5"}`}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu — Colorful, Animated, Compact */}
      <div
        className={`lg:hidden fixed inset-0 top-16 z-40 transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ${isMobileMenuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Menu panel */}
        <div
          className={`relative h-[calc(100dvh-4rem)] overflow-y-auto bg-card/95 backdrop-blur-xl border-t border-border/50 transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
            isMobileMenuOpen ? "translate-y-0" : "-translate-y-4"
          }`}
        >
          <div className="container py-5 space-y-3">
            {/* Primary nav — colorful icon grid */}
            <div className="grid grid-cols-3 gap-2">
              {navLinks.map((link, i) => {
                const colors = [
                  "from-blue-500 to-indigo-600",
                  "from-orange-500 to-red-500",
                  "from-emerald-500 to-teal-600",
                  "from-purple-500 to-pink-500",
                  "from-amber-500 to-orange-500",
                ];
                return (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-300 ${
                      isActive(link.href)
                        ? "bg-primary/10 ring-1 ring-primary/30"
                        : "hover:bg-muted/60 active:scale-95"
                    }`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center shadow-md`}>
                      {link.icon ? (
                        <link.icon className="w-5 h-5 text-white" />
                      ) : link.label === "Blog" ? (
                        <BookOpen className="w-5 h-5 text-white" />
                      ) : link.label === "Toolbox" ? (
                        <Zap className="w-5 h-5 text-white" />
                      ) : link.label === "Reviews" ? (
                        <Star className="w-5 h-5 text-white" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <span className={`text-xs font-medium ${isActive(link.href) ? "text-primary" : "text-foreground"}`}>
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Explore categories — compact 2-column */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">Explore Topics</p>
              <div className="grid grid-cols-2 gap-1.5">
                {exploreCategories.map((category) => (
                  <Link
                    key={category.label}
                    to={category.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-muted/60 active:scale-[0.98] transition-all duration-200"
                  >
                    <category.icon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-foreground/80 truncate">{category.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* User actions */}
            <div className="space-y-2">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/40">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-sm">
                      <span className="text-white text-sm font-semibold">{user.email?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                      {subscription.subscribed && (
                        <p className="text-xs text-amber-500 font-medium flex items-center gap-1">
                          <Crown className="w-3 h-3" /> Premium
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-muted/50 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                        Admin
                      </Link>
                    )}
                    <Link
                      to="/premium"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-medium text-white shadow-sm"
                    >
                      <Crown className="w-4 h-4" />
                      Premium
                    </Link>
                  </div>
                  <button
                    onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors text-center"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/auth"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/premium"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-sm font-medium text-white shadow-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    Premium
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
