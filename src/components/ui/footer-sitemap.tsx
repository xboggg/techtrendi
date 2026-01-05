import React from 'react';
import { cn } from '@/lib/utils';
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  platform: string;
  href: string;
  icon: React.ReactNode;
}

interface FooterSitemapProps {
  columns?: FooterColumn[];
  socialLinks?: SocialLink[];
  logo?: React.ReactNode;
  description?: string;
  newsletter?: boolean;
  className?: string;
}

const defaultColumns: FooterColumn[] = [
  {
    title: 'Content',
    links: [
      { label: 'Reviews', href: '/reviews' },
      { label: 'Guides', href: '/guides' },
      { label: 'Blog', href: '/blog' },
      { label: 'News', href: '/news' },
    ],
  },
  {
    title: 'Tools',
    links: [
      { label: 'Password Generator', href: '/tools/password-generator' },
      { label: 'Password Checker', href: '/tools/password-checker' },
      { label: 'QR Code Generator', href: '/tools/qr-generator' },
      { label: 'Image Compressor', href: '/tools/image-compressor' },
      { label: 'Phone Comparison', href: '/tools/phone-comparison' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press Kit', href: '/press' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'DMCA', href: '/dmca' },
    ],
  },
];

const defaultSocialLinks: SocialLink[] = [
  { platform: 'Facebook', href: '#', icon: <Facebook className="w-5 h-5" /> },
  { platform: 'Twitter', href: '#', icon: <Twitter className="w-5 h-5" /> },
  { platform: 'Instagram', href: '#', icon: <Instagram className="w-5 h-5" /> },
  { platform: 'YouTube', href: '#', icon: <Youtube className="w-5 h-5" /> },
  { platform: 'LinkedIn', href: '#', icon: <Linkedin className="w-5 h-5" /> },
];

/**
 * Comprehensive Footer with Sitemap
 */
export function FooterSitemap({
  columns = defaultColumns,
  socialLinks = defaultSocialLinks,
  logo,
  description = 'AI-Powered Tech Guides, Reviews & Free Tools. Your trusted source for technology insights.',
  newsletter = true,
  className,
}: FooterSitemapProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        'bg-gray-900 text-gray-300',
        className
      )}
    >
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            {/* Logo */}
            <div className="mb-4">
              {logo || (
                <a href="/" className="text-2xl font-bold text-white">
                  Tech<span className="text-primary">Trendi</span>
                </a>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-400 mb-6 max-w-sm">
              {description}
            </p>

            {/* Contact Info */}
            <div className="space-y-2 text-sm">
              <a
                href="mailto:hello@techtrendi.com"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4" />
                hello@techtrendi.com
              </a>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Accra, Ghana
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.platform}
                  href={social.href}
                  className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all"
                  aria-label={social.platform}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-white font-semibold mb-4">{column.title}</h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Section */}
        {newsletter && (
          <div className="mt-12 pt-8 border-t border-gray-800">
            <div className="max-w-xl">
              <h3 className="text-white font-semibold mb-2">
                Subscribe to our newsletter
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Get the latest tech news, reviews, and deals delivered to your inbox weekly.
              </p>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                >
                  Subscribe
                </button>
              </form>
              <p className="text-xs text-gray-500 mt-2">
                By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © {currentYear} TechTrendi. All rights reserved.
            </p>

            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="/terms" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="/sitemap.xml" className="hover:text-white transition-colors">
                Sitemap
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Simple Footer for minimal pages
 */
export function SimpleFooter({ className }: { className?: string }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn('py-8 border-t border-gray-200 dark:border-gray-800', className)}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {currentYear} TechTrendi. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <a href="/privacy" className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              Privacy
            </a>
            <a href="/terms" className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              Terms
            </a>
            <a href="/contact" className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default FooterSitemap;
