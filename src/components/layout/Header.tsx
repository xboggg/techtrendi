import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Sun, Moon, ChevronDown, User, LogOut, Crown, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { SearchButton } from "@/components/ui/search-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  {
    label: "Guides",
    href: "/guides",
    submenu: [
      { label: "Phone Guides", href: "/guides/phones" },
      { label: "Productivity Apps", href: "/guides/productivity" },
      { label: "Security Basics", href: "/guides/security" },
      { label: "How-To Tutorials", href: "/guides/tutorials" },
    ],
  },
  { label: "AI Tools", href: "/tools" },
  { label: "Reviews", href: "/reviews" },
  { label: "Blog", href: "/blog" },
  {
    label: "Resources",
    href: "#",
    isDropdownOnly: true,
    submenu: [
      { label: "Free Tools", href: "/tools" },
      { label: "Premium Content", href: "/premium" },
    ],
  },
  { label: "About", href: "/about" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
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

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + "/");

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/80 backdrop-blur-xl shadow-sm border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto">
        <nav className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-sm group-hover:shadow-glow transition-shadow duration-300">
              <span className="text-primary-foreground font-bold text-lg">T</span>
            </div>
            <span className="text-xl font-bold text-foreground">
              Tech<span className="text-gradient">Trendi</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => link.submenu && setOpenDropdown(link.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                {link.isDropdownOnly ? (
                  <button
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      openDropdown === link.label
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    onClick={() => setOpenDropdown(openDropdown === link.label ? null : link.label)}
                  >
                    {link.label}
                    {link.submenu && <ChevronDown className="w-4 h-4" />}
                  </button>
                ) : (
                  <Link
                    to={link.href}
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(link.href)
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {link.label}
                    {link.submenu && <ChevronDown className="w-4 h-4" />}
                  </Link>
                )}

                {link.submenu && openDropdown === link.label && (
                  <div className="absolute top-full left-0 pt-2 animate-fade-in">
                    <div className="bg-card border border-border rounded-xl shadow-elevated p-2 min-w-[200px]">
                      {link.submenu.map((sublink) => (
                        <Link
                          key={sublink.label}
                          to={sublink.href}
                          className="block px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
          <div className="flex items-center gap-3">
            <SearchButton className="hidden md:flex" />

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-sm font-medium">
                        {user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {subscription.subscribed && (
                      <Crown className="w-4 h-4 text-primary" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                    {subscription.subscribed ? (
                      <p className="text-xs text-primary flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Premium Member
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Free Plan</p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/premium" className="cursor-pointer">
                      <Crown className="w-4 h-4 mr-2" />
                      {subscription.subscribed ? "Manage Subscription" : "Upgrade to Premium"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button variant="hero" size="sm" asChild className="hidden md:inline-flex">
                  <Link to="/premium">Get Premium</Link>
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-background border-t border-border animate-slide-up">
          <div className="container py-4 space-y-2">
            {navLinks.map((link) => (
              <div key={link.label}>
                {link.isDropdownOnly ? (
                  <div
                    className="block px-4 py-3 rounded-lg font-medium text-foreground"
                  >
                    {link.label}
                  </div>
                ) : (
                  <Link
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                      isActive(link.href)
                        ? "text-primary bg-primary/10"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {link.label}
                  </Link>
                )}
                {link.submenu && (
                  <div className="ml-4 mt-1 space-y-1">
                    {link.submenu.map((sublink) => (
                      <Link
                        key={sublink.label}
                        to={sublink.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {sublink.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-4 space-y-2">
              {user ? (
                <>
                  <div className="px-4 py-2">
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {subscription.subscribed && (
                      <p className="text-xs text-primary flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Premium Member
                      </p>
                    )}
                  </div>
                  {isAdmin && (
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Panel
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/premium" onClick={() => setIsMobileMenuOpen(false)}>
                      {subscription.subscribed ? "Manage Subscription" : "Upgrade to Premium"}
                    </Link>
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button variant="hero" className="w-full" asChild>
                    <Link to="/premium" onClick={() => setIsMobileMenuOpen(false)}>
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
