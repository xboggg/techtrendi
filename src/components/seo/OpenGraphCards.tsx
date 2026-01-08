import { Helmet } from 'react-helmet-async';

interface OpenGraphProps {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  siteName?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterCreator?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  locale?: string;
}

export function OpenGraphTags({
  title,
  description,
  url,
  image = 'https://techtrendi.com/og-default.jpg',
  type = 'website',
  siteName = 'TechTrendi',
  twitterCard = 'summary_large_image',
  twitterSite = '@techtrendi',
  twitterCreator,
  publishedTime,
  modifiedTime,
  author,
  section,
  tags = [],
  locale = 'en_US',
}: OpenGraphProps) {
  const fullUrl = url.startsWith('http') ? url : `https://techtrendi.com${url}`;
  const imageUrl = image.startsWith('http') ? image : `https://techtrendi.com${image}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title} | TechTrendi</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />

      {/* Article specific */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      {type === 'article' && section && (
        <meta property="article:section" content={section} />
      )}
      {type === 'article' && tags.map((tag, i) => (
        <meta key={i} property="article:tag" content={tag} />
      ))}

      {/* Twitter */}
      <meta property="twitter:card" content={twitterCard} />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={imageUrl} />
      {twitterSite && <meta property="twitter:site" content={twitterSite} />}
      {twitterCreator && <meta property="twitter:creator" content={twitterCreator} />}

      {/* Canonical */}
      <link rel="canonical" href={fullUrl} />
    </Helmet>
  );
}

// Article specific OG
interface ArticleOGProps {
  title: string;
  description: string;
  slug: string;
  image?: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  category: string;
  tags?: string[];
}

export function ArticleOG({
  title,
  description,
  slug,
  image,
  publishedAt,
  updatedAt,
  author,
  category,
  tags,
}: ArticleOGProps) {
  return (
    <OpenGraphTags
      title={title}
      description={description}
      url={`/blog/${slug}`}
      image={image}
      type="article"
      publishedTime={publishedAt}
      modifiedTime={updatedAt}
      author={author}
      section={category}
      tags={tags}
    />
  );
}

// Review specific OG
interface ReviewOGProps {
  title: string;
  description: string;
  slug: string;
  image?: string;
  rating: number;
  category: string;
  brand?: string;
}

export function ReviewOG({
  title,
  description,
  slug,
  image,
  rating,
  category,
  brand,
}: ReviewOGProps) {
  const enhancedDescription = `${description} Rating: ${rating}/10${brand ? ` | Brand: ${brand}` : ''}`;

  return (
    <OpenGraphTags
      title={`${title} Review`}
      description={enhancedDescription}
      url={`/reviews/${slug}`}
      image={image}
      type="article"
      section={category}
      tags={[category, 'review', brand].filter(Boolean) as string[]}
    />
  );
}

// Tool specific OG
interface ToolOGProps {
  name: string;
  description: string;
  slug: string;
}

export function ToolOG({ name, description, slug }: ToolOGProps) {
  return (
    <OpenGraphTags
      title={`${name} - Free Online Tool`}
      description={description}
      url={`/tools/${slug}`}
      type="website"
    />
  );
}

// Structured Data for SEO
interface StructuredDataProps {
  type: 'Article' | 'Review' | 'Product' | 'WebSite' | 'Organization' | 'BreadcrumbList';
  data: Record<string, unknown>;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}

// Article Structured Data
export function ArticleStructuredData({
  title,
  description,
  url,
  image,
  publishedAt,
  updatedAt,
  author,
}: {
  title: string;
  description: string;
  url: string;
  image?: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
}) {
  return (
    <StructuredData
      type="Article"
      data={{
        headline: title,
        description,
        image: image || 'https://techtrendi.com/og-default.jpg',
        datePublished: publishedAt,
        dateModified: updatedAt || publishedAt,
        author: {
          '@type': 'Person',
          name: author,
        },
        publisher: {
          '@type': 'Organization',
          name: 'TechTrendi',
          logo: {
            '@type': 'ImageObject',
            url: 'https://techtrendi.com/logo.png',
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': url,
        },
      }}
    />
  );
}

// Review Structured Data
export function ReviewStructuredData({
  name,
  description,
  rating,
  image,
  brand,
  price,
  url,
}: {
  name: string;
  description: string;
  rating: number;
  image?: string;
  brand?: string;
  price?: { value: number; currency: string };
  url: string;
}) {
  return (
    <StructuredData
      type="Review"
      data={{
        itemReviewed: {
          '@type': 'Product',
          name,
          description,
          image,
          brand: brand ? { '@type': 'Brand', name: brand } : undefined,
          offers: price ? {
            '@type': 'Offer',
            price: price.value,
            priceCurrency: price.currency,
          } : undefined,
        },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: rating,
          bestRating: 10,
          worstRating: 1,
        },
        author: {
          '@type': 'Organization',
          name: 'TechTrendi',
        },
        publisher: {
          '@type': 'Organization',
          name: 'TechTrendi',
        },
      }}
    />
  );
}

// Breadcrumb Structured Data
export function BreadcrumbStructuredData({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  return (
    <StructuredData
      type="BreadcrumbList"
      data={{
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: `https://techtrendi.com${item.url}`,
        })),
      }}
    />
  );
}

export default OpenGraphTags;
