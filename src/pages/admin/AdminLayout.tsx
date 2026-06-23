import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { LayoutDashboard, FileText, MessageSquare, Users, ArrowLeft, Loader2, PenSquare, Mail, Package, Newspaper, BarChart3, Ghost, Shield, ShieldAlert, Lightbulb, Activity, Flag, Wrench, LogOut, MessageCircle, Megaphone, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "News", href: "/admin/news", icon: Newspaper },
  { label: "Articles", href: "/admin/articles", icon: PenSquare },
  { label: "WhatsApp Queue", href: "/admin/whatsapp-queue", icon: MessageCircle },
  { label: "Reviews", href: "/admin/reviews", icon: FileText },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Comments", href: "/admin/comments", icon: MessageSquare },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Messages", href: "/admin/messages", icon: Mail },
  { label: "Creepy Tech", href: "/admin/creepy-tech", icon: Ghost },
  { label: "Cyber Awareness", href: "/admin/cyber-awareness", icon: Shield },
  { label: "Scam Alerts", href: "/admin/scam-alerts", icon: ShieldAlert },
  { label: "Daily Tips", href: "/admin/daily-tips", icon: Lightbulb },
  { label: "Ticker", href: "/admin/ticker", icon: Megaphone },
  { label: "Threat Level", href: "/admin/threat-level", icon: Activity },
  { label: "Scam Reports", href: "/admin/scam-reports", icon: Flag },
  { label: "Tool Feedback", href: "/admin/tool-feedback", icon: Wrench },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close the mobile drawer whenever the route changes
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to access this area.</p>
          <Link to="/" className="text-primary hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile top bar with hamburger (lg: hidden) */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center gap-3 px-4 h-14 bg-card border-b border-border">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open admin menu"
          className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-bold text-foreground">Admin Panel</span>
      </div>

      {/* Backdrop (mobile only, when drawer open) */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed on desktop; off-canvas drawer on mobile */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-card border-r border-border flex flex-col z-50 transition-transform duration-300",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between mb-4">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back to site
            </Link>
            {/* Close button (mobile only) */}
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close admin menu"
              className="lg:hidden p-1.5 -mr-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out Button */}
        <div className="p-4 border-t border-border">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content — full width on mobile, offset by sidebar on desktop.
          min-w-0 + overflow-x-hidden so wide children (long titles, tables)
          can't force horizontal page scroll on small screens. */}
      <main className="lg:ml-64 min-w-0 overflow-x-hidden p-4 md:p-6 lg:p-8">{children}</main>
    </div>
  );
}
