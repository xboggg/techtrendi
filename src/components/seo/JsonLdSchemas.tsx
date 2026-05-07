import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://techtrendi.com';
const SITE_NAME = 'TechTrendi';
const LOGO_URL = `${SITE_URL}/logo.png`;

// Organization Schema - Use on every page
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      '@id': `${SITE_URL}/#logo`,
      url: LOGO_URL,
      contentUrl: LOGO_URL,
      width: 512,
      height: 512,
      caption: SITE_NAME,
    },
    image: { '@id': `${SITE_URL}/#logo` },
    sameAs: [
      'https://twitter.com/techtrendi',
      'https://facebook.com/techtrendi',
      'https://linkedin.com/company/techtrendi',
      'https://github.com/techtrendi',
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '',
        contactType: 'customer service',
        email: 'hello@techtrendi.com',
        availableLanguage: ['English'],
      },
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// WebSite Schema - Use on homepage
export function WebSiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: 'Your AI-powered guide to technology. Expert advice, smart tools, and comprehensive reviews.',
    publisher: { '@id': `${SITE_URL}/#organization` },
    potentialAction: [
      {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    ],
    inLanguage: 'en-US',
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// Article Schema
interface ArticleSchemaProps {
  title: string;
  description: string;
  url: string;
  image?: string;
  publishedTime: string;
  modifiedTime?: string;
  author?: string;
  category?: string;
  tags?: string[];
  wordCount?: number;
}

export function ArticleSchema({
  title,
  description,
  url,
  image,
  publishedTime,
  modifiedTime,
  author = 'Edmund A.',
  category,
  tags = [],
  wordCount,
}: ArticleSchemaProps) {
  const fullUrl = url.startsWith('http') ? url : `${SITE_URL}${url}`;
  const imageUrl = image || `${SITE_URL}/og-default.jpg`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${fullUrl}#article`,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    author: {
      '@type': 'Person',
      name: author,
      url: `${SITE_URL}/about`,
    },
    headline: title,
    description,
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    mainEntityOfPage: { '@id': `${fullUrl}#webpage` },
    wordCount,
    publisher: { '@id': `${SITE_URL}/#organization` },
    image: {
      '@type': 'ImageObject',
      '@id': `${fullUrl}#primaryimage`,
      url: imageUrl,
      contentUrl: imageUrl,
    },
    thumbnailUrl: imageUrl,
    keywords: tags.join(', '),
    articleSection: category,
    inLanguage: 'en-US',
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// Review/Product Schema
interface ProductReviewSchemaProps {
  name: string;
  description: string;
  url: string;
  image?: string;
  brand?: string;
  rating: number;
  ratingCount?: number;
  price?: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  pros?: string[];
  cons?: string[];
  category?: string;
}

export function ProductReviewSchema({
  name,
  description,
  url,
  image,
  brand,
  rating,
  ratingCount = 1,
  price,
  currency = 'USD',
  availability = 'InStock',
  pros = [],
  cons = [],
  category,
}: ProductReviewSchemaProps) {
  const fullUrl = url.startsWith('http') ? url : `${SITE_URL}${url}`;
  const imageUrl = image || `${SITE_URL}/og-default.jpg`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${fullUrl}#product`,
    name,
    description,
    image: imageUrl,
    brand: brand ? { '@type': 'Brand', name: brand } : undefined,
    category,
    review: {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: rating,
        bestRating: 10,
        worstRating: 1,
      },
      author: { '@id': `${SITE_URL}/#organization` },
      reviewBody: description,
      positiveNotes: pros.length > 0 ? {
        '@type': 'ItemList',
        itemListElement: pros.map((pro, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: pro,
        })),
      } : undefined,
      negativeNotes: cons.length > 0 ? {
        '@type': 'ItemList',
        itemListElement: cons.map((con, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: con,
        })),
      } : undefined,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: rating,
      reviewCount: ratingCount,
      bestRating: 10,
      worstRating: 1,
    },
    offers: price ? {
      '@type': 'Offer',
      price,
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      url: fullUrl,
    } : undefined,
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// FAQ Schema
interface FAQSchemaProps {
  questions: { question: string; answer: string }[];
}

export function FAQSchema({ questions }: FAQSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// HowTo Schema (for guides/tutorials)
interface HowToSchemaProps {
  name: string;
  description: string;
  image?: string;
  totalTime?: string; // ISO 8601 duration format
  steps: { name: string; text: string; image?: string }[];
  tools?: string[];
  supplies?: string[];
}

export function HowToSchema({
  name,
  description,
  image,
  totalTime,
  steps,
  tools = [],
  supplies = [],
}: HowToSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    image: image || `${SITE_URL}/og-default.jpg`,
    totalTime,
    tool: tools.map((tool) => ({ '@type': 'HowToTool', name: tool })),
    supply: supplies.map((supply) => ({ '@type': 'HowToSupply', name: supply })),
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      image: step.image,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// SoftwareApplication Schema (for tools)
interface SoftwareSchemaProps {
  name: string;
  description: string;
  url: string;
  category?: string;
  operatingSystem?: string;
  applicationCategory?: string;
  price?: number;
  rating?: number;
  ratingCount?: number;
}

export function SoftwareSchema({
  name,
  description,
  url,
  category = 'UtilitiesApplication',
  operatingSystem = 'Web Browser',
  applicationCategory = 'WebApplication',
  price = 0,
  rating,
  ratingCount,
}: SoftwareSchemaProps) {
  const fullUrl = url.startsWith('http') ? url : `${SITE_URL}${url}`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    url: fullUrl,
    applicationCategory,
    operatingSystem,
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: 'USD',
    },
    aggregateRating: rating ? {
      '@type': 'AggregateRating',
      ratingValue: rating,
      ratingCount: ratingCount || 1,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// Breadcrumb Schema
interface BreadcrumbSchemaProps {
  items: { name: string; url: string }[];
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// VideoObject Schema
interface VideoSchemaProps {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string; // ISO 8601 duration format
  contentUrl?: string;
  embedUrl?: string;
}

export function VideoSchema({
  name,
  description,
  thumbnailUrl,
  uploadDate,
  duration,
  contentUrl,
  embedUrl,
}: VideoSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name,
    description,
    thumbnailUrl,
    uploadDate,
    duration,
    contentUrl,
    embedUrl,
    publisher: { '@id': `${SITE_URL}/#organization` },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// ItemList Schema (for category/listing pages)
interface ItemListSchemaProps {
  name: string;
  description: string;
  items: { name: string; url: string; position: number }[];
}

export function ItemListSchema({ name, description, items }: ItemListSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    description,
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      url: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export default {
  OrganizationSchema,
  WebSiteSchema,
  ArticleSchema,
  ProductReviewSchema,
  FAQSchema,
  HowToSchema,
  SoftwareSchema,
  BreadcrumbSchema,
  VideoSchema,
  ItemListSchema,
};
