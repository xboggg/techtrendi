// vite-react-ssg's <Head> injects into the static HTML at build time (its own
// Helmet-based head manager). react-helmet-async's <Helmet> is NOT captured by
// the SSG build, which is why per-page titles were generic. Same JSX children.
import { Head } from 'vite-react-ssg';

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
    </Head>
  );
}

export default SEOHead;
