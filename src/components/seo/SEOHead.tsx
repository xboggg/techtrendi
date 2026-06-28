// vite-react-ssg's <Head> injects into the static HTML at build time (its own
// Helmet-based head manager). react-helmet-async's <Helmet> is NOT captured by
// the SSG build, which is why per-page titles were generic. Same JSX children.
import { Head } from 'vite-react-ssg';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  canonicalUrl?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  category?: string;
  tags?: string[];
  locale?: string;
  alternateLocales?: string[];
  /** Q&A pairs that appear VISIBLY on the page (parsed from article content);
   *  emitted as FAQPage structured data. Must match on-page content. */
  faqs?: { question: string; answer: string }[];
  /** Breadcrumb trail (label + path); emitted as BreadcrumbList. */
  breadcrumbs?: { name: string; path: string }[];
}

const SITE_NAME = 'TechTrendi';
const SITE_URL = 'https://techtrendi.com';
const DEFAULT_IMAGE = '/og-image.jpg';
const TWITTER_HANDLE = '@techtrendi';

export function SEOHead({
  title,
  description,
  canonical,
  canonicalUrl,
  image,
  type = 'website',
  noindex = false,
  keywords = [],
  author = 'TechTrendi Team',
  publishedTime,
  modifiedTime,
  category,
  tags = [],
  locale = 'en_US',
  alternateLocales = [],
  faqs = [],
  breadcrumbs = [],
}: SEOHeadProps) {
  // Some pages pass a title that already ends in "| TechTrendi"; strip it so we
  // never emit "... | TechTrendi | TechTrendi".
  const baseTitle = title.replace(/\s*\|\s*TechTrendi\s*$/i, '').trim();
  const fullTitle = `${baseTitle} | ${SITE_NAME}`;
  const canonicalPath = canonical || canonicalUrl;
  const fullUrl = canonicalPath
    ? (canonicalPath.startsWith('http') ? canonicalPath : `${SITE_URL}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`)
    : SITE_URL;
  const imageUrl = image ? (image.startsWith('http') ? image : `${SITE_URL}${image}`) : `${SITE_URL}${DEFAULT_IMAGE}`;
  const allKeywords = [...new Set([...keywords, ...tags, 'tech', 'technology', 'guide', 'review'])].join(', ');

  // Tool pages get SoftwareApplication structured data (free web utility).
  const { pathname } = useLocation();
  const toolSchema = pathname.startsWith('/tools/')
    ? {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: baseTitle,
        description,
        url: `${SITE_URL}${pathname}`,
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Web',
        isAccessibleForFree: true,
        // No `offers` block: free tools, not products. A bare Offer(price:0)
        // triggers Google's Merchant/Product-snippet "missing field" errors.
        publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      }
    : null;

  // Article/guide pages get Article structured data (helps Google understand
  // author, publish date, publisher, and surface rich results). Emitted at SSG
  // build time so it's present in the server HTML, not only after hydration.
  const articleSchema = type === 'article'
    ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: baseTitle,
        description,
        image: [imageUrl],
        author: { '@type': 'Person', name: author },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_URL,
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon-512.png` },
        },
        ...(publishedTime ? { datePublished: publishedTime } : {}),
        dateModified: modifiedTime || publishedTime || undefined,
        ...(category ? { articleSection: category } : {}),
        ...(allKeywords ? { keywords: allKeywords } : {}),
        mainEntityOfPage: { '@type': 'WebPage', '@id': fullUrl },
        inLanguage: 'en',
        isAccessibleForFree: true,
      }
    : null;

  // FAQPage — only emitted when the page actually shows these Q&As (the caller
  // parses them from the visible article content, so schema matches on-page).
  const faqSchema = faqs.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }
    : null;

  // BreadcrumbList — matches the visible breadcrumb trail on article pages.
  const breadcrumbSchema = breadcrumbs.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((b, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: b.name,
          item: b.path.startsWith('http') ? b.path : `${SITE_URL}${b.path.startsWith('/') ? b.path : `/${b.path}`}`,
        })),
      }
    : null;

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {allKeywords && <meta name="keywords" content={allKeywords} />}
      <meta name="author" content={author} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'} />
      <meta name="googlebot" content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'} />
      <meta name="bingbot" content={noindex ? 'noindex, nofollow' : 'index, follow'} />

      {/* Canonical URL */}
      {(canonical || canonicalUrl) && <link rel="canonical" href={fullUrl} />}

      {/* Language */}
      <meta property="og:locale" content={locale} />
      {alternateLocales.map((loc) => (
        <meta key={loc} property="og:locale:alternate" content={loc} />
      ))}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Article specific meta */}
      {type === 'article' && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {author && <meta property="article:author" content={author} />}
          {category && <meta property="article:section" content={category} />}
          {tags.map((tag) => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={title} />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:creator" content={TWITTER_HANDLE} />

      {/* Additional SEO */}
      <meta name="theme-color" content="#0f172a" />
      <meta name="msapplication-TileColor" content="#0f172a" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
      <meta name="format-detection" content="telephone=no" />

      {/* Verification tags are set in index.html */}

      {/* Preconnect to important third-party domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      <link rel="dns-prefetch" href="https://www.google-analytics.com" />

      {/* Tool pages: SoftwareApplication structured data */}
      {toolSchema && (
        <script type="application/ld+json">{JSON.stringify(toolSchema)}</script>
      )}

      {/* Article/guide pages: Article structured data */}
      {articleSchema && (
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
      )}

      {/* FAQ pages: FAQPage structured data (matches visible on-page Q&A) */}
      {faqSchema && (
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      )}

      {/* Breadcrumb trail structured data */}
      {breadcrumbSchema && (
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      )}
    </Head>
  );
}

export default SEOHead;
