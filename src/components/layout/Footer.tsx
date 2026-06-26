import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";

// Custom social icons as SVG components
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

// `brand` is each platform's own hover color/gradient (applied on hover).
const socialLinks = [
  { icon: FacebookIcon, href: "https://facebook.com/techtrendi", label: "Facebook", brand: "#1877F2" },
  { icon: XIcon, href: "https://twitter.com/techtrendi", label: "X (Twitter)", brand: "#000000" },
  { icon: InstagramIcon, href: "https://instagram.com/techtrendi", label: "Instagram", brand: "linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)" },
  { icon: WhatsAppIcon, href: "https://whatsapp.com/channel/0029VbCB3R6H5JLt1aJYIT2d", label: "WhatsApp", brand: "#25D366" },
  { icon: TikTokIcon, href: "https://tiktok.com/@tech.trendi", label: "TikTok", brand: "linear-gradient(135deg,#25F4EE,#000000 45%,#FE2C55)" },
];

const footerLinks = {
  explore: [
    { label: "TechTrendi News", href: "/news" },
    { label: "TechTrendi Blog", href: "/blog" },
    { label: "TechTrendi Tools", href: "/tools" },
    { label: "TechTrendi DigiStore", href: "/store" },
    { label: "Reading List", href: "/reading-list" },
  ],
  topics: [
    { label: "Online Safety", href: "/security" },
    { label: "AI Tech", href: "/ai-tech" },
    { label: "How-To", href: "/how-to" },
    { label: "Smart Income", href: "/smart-income" },
    { label: "Productivity", href: "/productivity" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Terms", href: "/terms" },
    { label: "Disclosure", href: "/disclosure" },
    { label: "Sitemap", href: "/sitemap.xml" },
  ],
};

// Floating particle component
function FloatingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number; hue: number }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Create particles
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.3 + 0.1,
        hue: Math.random() * 60 + 200, // blue to purple range
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${p.opacity})`;
        ctx.fill();
      });

      // Draw connections between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `hsla(220, 70%, 60%, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* Animated gradient top bar */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x" />

      {/* Main Footer */}
      <div className="relative bg-gradient-to-b from-background via-background to-muted/30 border-t border-border">
        {/* Particle canvas */}
        <FloatingParticles />

        {/* Decorative blurred orbs */}
        <div className="absolute top-10 left-[10%] w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
        <div className="absolute bottom-10 right-[10%] w-72 h-72 bg-purple-500/5 rounded-full blur-3xl animate-pulse-slow pointer-events-none" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/3 rounded-full blur-3xl pointer-events-none" />

        <div className="container relative z-10 py-12">
          {/* ===== Compact 4-column footer ===== */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand + social + newsletter (compact) */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="inline-flex items-center gap-2 mb-2.5 group">
                <img
                  src="/logo-t.png"
                  alt="TechTrendi"
                  className="h-9 w-auto transition-transform duration-300 group-hover:scale-110"
                />
                <span className="text-xl font-bold leading-none">
                  <span className="text-foreground">Tech</span>
                  <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Trendi</span>
                </span>
              </Link>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                <span className="inline-flex items-center gap-1 align-middle">
                  <span aria-hidden="true">🇬🇭</span> Ghana&apos;s tech hub —
                </span>{" "}
                tech tips, tools &amp; online-safety help that make digital life easier.
              </p>
              <div className="flex items-center gap-2 flex-wrap mb-4">
                {socialLinks.map((social, i) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative w-8 h-8 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-white hover:border-transparent transition-all duration-300 hover:scale-110"
                    aria-label={social.label}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    {/* Each icon glows in its own brand color on hover */}
                    <span
                      className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: social.brand }}
                    />
                    <span
                      className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-40 blur-lg transition-opacity duration-300"
                      style={{ background: social.brand }}
                    />
                    <social.icon className="w-3.5 h-3.5 relative z-10" />
                  </a>
                ))}
              </div>
              {/* Animated newsletter CTA */}
              <Link to="/newsletter" className="newsletter-cta group" aria-label="Subscribe to the TechTrendi newsletter">
                <span className="newsletter-cta-shine" aria-hidden="true" />
                <span className="newsletter-cta-icon" aria-hidden="true">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <span className="newsletter-cta-label">Newsletter</span>
                <svg className="newsletter-cta-arrow w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Explore */}
            <div>
              <h4 className="footer-head">
                <span className="footer-head-bar bg-gradient-to-r from-blue-500 to-purple-500" />
                EXPLORE
              </h4>
              <ul className="space-y-2.5">
                {footerLinks.explore.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="footer-link">
                      <span className="footer-link-dot" aria-hidden="true" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Topics */}
            <div>
              <h4 className="footer-head">
                <span className="footer-head-bar bg-gradient-to-r from-purple-500 to-pink-500" />
                TOPICS
              </h4>
              <ul className="space-y-2.5">
                {footerLinks.topics.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="footer-link">
                      <span className="footer-link-dot" aria-hidden="true" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="footer-head">
                <span className="footer-head-bar bg-gradient-to-r from-pink-500 to-orange-500" />
                COMPANY
              </h4>
              <ul className="space-y-2.5">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('http') || link.href.endsWith('.xml') ? (
                      <a
                        href={link.href}
                        target={link.href.startsWith('http') ? '_blank' : undefined}
                        rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="footer-link"
                      >
                        <span className="footer-link-dot" aria-hidden="true" />
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.href} className="footer-link">
                        <span className="footer-link-dot" aria-hidden="true" />
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Bottom bar */}
          <div className="relative mt-10 pt-6 border-t border-border/50">
            <div className="absolute left-1/2 -translate-x-1/2 top-0 w-32 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                <span className="text-border">|</span>
                <Link to="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link>
                <span className="text-border">|</span>
                <span>&copy; {new Date().getFullYear()} TechTrendi. All rights reserved.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Designed by</span>
                <a
                  href="https://novastreamdigital.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent hover:from-cyan-300 hover:via-blue-400 hover:to-purple-500 transition-all duration-300"
                >
                  NovaStream
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for custom animations */}
      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }

        /* ===== Animated Newsletter CTA ===== */
        .newsletter-cta {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.7rem 1.4rem 0.7rem 1rem;
          border-radius: 9999px;
          font-size: 0.9rem;
          font-weight: 600;
          color: #fff;
          isolation: isolate;
          overflow: hidden;
          background-size: 200% 200%;
          background-image: linear-gradient(110deg, #2563eb 0%, #7c3aed 35%, #db2777 70%, #2563eb 100%);
          animation: newsletter-flow 6s ease infinite;
          box-shadow: 0 6px 18px -6px rgba(124, 58, 237, 0.6);
          transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s ease;
        }
        .newsletter-cta:hover {
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 12px 26px -6px rgba(124, 58, 237, 0.75);
        }
        /* breathing glow ring */
        .newsletter-cta::before {
          content: "";
          position: absolute;
          inset: -2px;
          z-index: -2;
          border-radius: 9999px;
          background: inherit;
          background-image: linear-gradient(110deg, #2563eb, #7c3aed, #db2777, #2563eb);
          background-size: 200% 200%;
          filter: blur(10px);
          opacity: 0.5;
          animation: newsletter-flow 6s ease infinite;
          transition: opacity 0.3s ease;
        }
        .newsletter-cta:hover::before { opacity: 0.85; }
        /* shine sweep */
        .newsletter-cta-shine {
          position: absolute;
          top: 0; left: -75%;
          z-index: -1;
          width: 50%; height: 100%;
          transform: skewX(-20deg);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
          animation: newsletter-shine 3.6s ease-in-out infinite;
        }
        .newsletter-cta-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1.65rem; height: 1.65rem;
          border-radius: 9999px;
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(4px);
          animation: newsletter-bob 2.6s ease-in-out infinite;
        }
        .newsletter-cta-label { letter-spacing: 0.01em; }
        .newsletter-cta-arrow {
          transition: transform 0.3s cubic-bezier(.34,1.56,.64,1);
        }
        .newsletter-cta:hover .newsletter-cta-arrow { transform: translateX(4px); }

        @keyframes newsletter-flow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes newsletter-shine {
          0% { left: -75%; }
          55%, 100% { left: 130%; }
        }
        @keyframes newsletter-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .newsletter-cta,
          .newsletter-cta::before,
          .newsletter-cta-shine,
          .newsletter-cta-icon { animation: none; }
        }

        /* ===== Footer column headers + links ===== */
        .footer-head {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: hsl(var(--foreground));
          margin-bottom: 1.25rem;
        }
        .footer-head-bar {
          display: inline-block;
          width: 1.25rem;
          height: 2px;
          border-radius: 9999px;
          transition: width 0.3s ease;
        }
        .footer-head:hover .footer-head-bar { width: 2rem; }

        .footer-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.875rem;
          color: hsl(var(--muted-foreground));
          transition: color 0.2s ease, transform 0.2s ease;
        }
        .footer-link:hover {
          color: hsl(var(--primary));
          transform: translateX(3px);
        }
        .footer-link-dot {
          width: 0;
          height: 6px;
          border-radius: 9999px;
          background: linear-gradient(90deg, #3b82f6, #a855f7);
          opacity: 0;
          transition: width 0.25s ease, opacity 0.25s ease;
        }
        .footer-link:hover .footer-link-dot {
          width: 6px;
          opacity: 1;
        }
      `}</style>
    </footer>
  );
}
