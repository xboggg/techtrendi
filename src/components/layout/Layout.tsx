import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isHomepage = location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip">
      <Header />
      <main className={`flex-1 ${isHomepage ? "" : "pt-16 md:pt-20"}`}>{children}</main>
      <Footer />
    </div>
  );
}
