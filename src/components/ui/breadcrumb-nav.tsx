import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items?: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  separator?: React.ReactNode;
}

// Auto-generate breadcrumbs from current path
export function BreadcrumbNav({
  items,
  className,
  showHome = true,
  separator = <ChevronRight className="w-4 h-4 text-muted-foreground" />,
}: BreadcrumbNavProps) {
  const location = useLocation();

  // Auto-generate breadcrumbs if not provided
  const breadcrumbs = items || generateBreadcrumbs(location.pathname);

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-sm', className)}>
      <ol className="flex items-center gap-2">
        {showHome && (
          <>
            <li>
              <Link
                to="/"
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="sr-only">Home</span>
              </Link>
            </li>
            {breadcrumbs.length > 0 && <li className="flex items-center">{separator}</li>}
          </>
        )}

        {breadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {item.href && index < breadcrumbs.length - 1 ? (
              <Link
                to={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{item.label}</span>
            )}
            {index < breadcrumbs.length - 1 && separator}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label = formatSegment(segment);
    breadcrumbs.push({
      label,
      href: index < segments.length - 1 ? currentPath : undefined,
    });
  });

  return breadcrumbs;
}

function formatSegment(segment: string): string {
  // Handle special cases
  const specialCases: Record<string, string> = {
    'blog': 'Blog',
    'reviews': 'Reviews',
    'tools': 'Tools',
    'guides': 'Guides',
    'about': 'About',
    'admin': 'Admin',
    'profile': 'Profile',
    'premium': 'Premium',
    'auth': 'Sign In',
  };

  if (specialCases[segment]) return specialCases[segment];

  // Convert slug to title case
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Structured data for SEO
export function BreadcrumbStructuredData({ items }: { items: BreadcrumbItem[] }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? `https://techtrendi.com${item.href}` : undefined,
    })),
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
  );
}

export default BreadcrumbNav;
