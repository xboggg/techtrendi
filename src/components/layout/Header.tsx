import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, User, LogOut, Crown, Shield, Sparkles, Flame, Smartphone, Lock, Cpu, Lightbulb, BookOpen, DollarSign, ShoppingBag, LayoutDashboard, Newspaper, Gamepad2, Watch, Briefcase, HeartPulse, Wifi, Leaf } from "lucide-react";
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
  { label: "Side Hustles", href: "/make-money", icon: DollarSign, description: "Earn money online & passive income" },
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "glass-nav shadow-glass"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto">
        <nav className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-card group-hover:shadow-glow group-hover:scale-105 transition-all duration-300">
              <span className="text-primary-foreground font-bold text-lg">T</span>
              <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Tech<span className="text-gradient">Trendi</span>
            </span>
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
                      ? "text-primary bg-primary/10 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/5"
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
            <SearchButton className="hidden md:flex" />

            <ThemeToggle />

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
                <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex rounded-xl hover:bg-white/50 dark:hover:bg-white/5">
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
              className="lg:hidden p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-200"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden glass-strong border-t border-white/10 animate-scale-in">
          <div className="container py-6 space-y-2">
            {navLinks.map((link) => (
              <div key={link.label}>
                <Link
                  to={link.href}
                  onClick={() => !link.isMegaMenu && setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isActive(link.href)
                      ? "text-primary bg-primary/10 shadow-sm"
                      : "text-foreground hover:bg-white/50 dark:hover:bg-white/5"
                  }`}
                >
                  {link.icon && <link.icon className="w-4 h-4 text-orange-500" />}
                  {link.label}
                  {link.isHot && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full">
                      HOT
                    </span>
                  )}
                  {link.isMegaMenu && <ChevronDown className="w-4 h-4 ml-auto" />}
                </Link>
                {/* Mobile Mega Menu Categories */}
                {link.isMegaMenu && (
                  <div className="ml-4 mt-1 space-y-1">
                    {exploreCategories.map((category) => (
                      <Link
                        key={category.label}
                        to={category.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all duration-200"
                      >
                        <category.icon className="w-4 h-4 text-primary" />
                        {category.label}
                      </Link>
                    ))}
                  </div>
                )}
                {/* Regular submenu */}
                {link.submenu && (
                  <div className="ml-4 mt-1 space-y-1">
                    {link.submenu.map((sublink) => (
                      <Link
                        key={sublink.label}
                        to={sublink.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all duration-200"
                      >
                        {sublink.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-6 space-y-3">
              {user ? (
                <>
                  <div className="px-4 py-3 glass rounded-2xl">
                    <p className="text-sm font-semibold text-foreground">{user.email}</p>
                    {subscription.subscribed && (
                      <p className="text-xs text-gradient-accent font-medium flex items-center gap-1 mt-1">
                        <Crown className="w-3 h-3" /> Premium Member
                      </p>
                    )}
                  </div>
                  {isAdmin && (
                    <Button variant="outline" className="w-full rounded-xl glass border-white/20" asChild>
                      <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Panel
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" className="w-full rounded-xl glass border-white/20" asChild>
                    <Link to="/premium" onClick={() => setIsMobileMenuOpen(false)}>
                      {subscription.subscribed ? "Manage Subscription" : "Upgrade to Premium"}
                    </Link>
                  </Button>
                  <Button variant="ghost" className="w-full rounded-xl" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="w-full rounded-xl glass border-white/20" asChild>
                    <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button className="w-full btn-premium rounded-xl text-white shadow-card" asChild>
                    <Link to="/premium" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Get Premium
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
