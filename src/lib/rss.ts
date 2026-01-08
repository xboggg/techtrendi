// RSS Feed Generator for TechTrendi

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  author?: string;
  category?: string;
  guid?: string;
  content?: string;
  image?: string;
}

interface RSSFeedOptions {
  title: string;
  description: string;
  link: string;
  language?: string;
  copyright?: string;
  managingEditor?: string;
  webMaster?: string;
  lastBuildDate?: string;
  ttl?: number;
  image?: {
    url: string;
    title: string;
    link: string;
    width?: number;
    height?: number;
  };
}

export function generateRSSFeed(items: RSSItem[], options: RSSFeedOptions): string {
  const escapeXML = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toUTCString();
  };

  let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXML(options.title)}</title>
    <description>${escapeXML(options.description)}</description>
    <link>${escapeXML(options.link)}</link>
    <atom:link href="${escapeXML(options.link)}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>${options.language || 'en-us'}</language>
    <lastBuildDate>${options.lastBuildDate || formatDate(new Date().toISOString())}</lastBuildDate>
    <ttl>${options.ttl || 60}</ttl>`;

  if (options.copyright) {
    rss += `\n    <copyright>${escapeXML(options.copyright)}</copyright>`;
  }

  if (options.managingEditor) {
    rss += `\n    <managingEditor>${escapeXML(options.managingEditor)}</managingEditor>`;
  }

  if (options.image) {
    rss += `
    <image>
      <url>${escapeXML(options.image.url)}</url>
      <title>${escapeXML(options.image.title)}</title>
      <link>${escapeXML(options.image.link)}</link>
      ${options.image.width ? `<width>${options.image.width}</width>` : ''}
      ${options.image.height ? `<height>${options.image.height}</height>` : ''}
    </image>`;
  }

  items.forEach((item) => {
    rss += `
    <item>
      <title>${escapeXML(item.title)}</title>
      <link>${escapeXML(item.link)}</link>
      <description><![CDATA[${item.description}]]></description>
      <pubDate>${formatDate(item.pubDate)}</pubDate>
      <guid isPermaLink="true">${item.guid || escapeXML(item.link)}</guid>`;

    if (item.author) {
      rss += `\n      <author>${escapeXML(item.author)}</author>`;
    }

    if (item.category) {
      rss += `\n      <category>${escapeXML(item.category)}</category>`;
    }

    if (item.content) {
      rss += `\n      <content:encoded><![CDATA[${item.content}]]></content:encoded>`;
    }

    if (item.image) {
      rss += `\n      <media:content url="${escapeXML(item.image)}" medium="image"/>`;
    }

    rss += `\n    </item>`;
  });

  rss += `
  </channel>
</rss>`;

  return rss;
}

// Generate Atom feed (alternative format)
export function generateAtomFeed(items: RSSItem[], options: RSSFeedOptions): string {
  const escapeXML = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toISOString();
  };

  let atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXML(options.title)}</title>
  <subtitle>${escapeXML(options.description)}</subtitle>
  <link href="${escapeXML(options.link)}" rel="alternate"/>
  <link href="${escapeXML(options.link)}/atom.xml" rel="self"/>
  <id>${escapeXML(options.link)}/</id>
  <updated>${options.lastBuildDate || formatDate(new Date().toISOString())}</updated>`;

  if (options.managingEditor) {
    atom += `
  <author>
    <name>${escapeXML(options.managingEditor)}</name>
  </author>`;
  }

  items.forEach((item) => {
    atom += `
  <entry>
    <title>${escapeXML(item.title)}</title>
    <link href="${escapeXML(item.link)}"/>
    <id>${item.guid || escapeXML(item.link)}</id>
    <updated>${formatDate(item.pubDate)}</updated>
    <summary><![CDATA[${item.description}]]></summary>`;

    if (item.content) {
      atom += `\n    <content type="html"><![CDATA[${item.content}]]></content>`;
    }

    if (item.author) {
      atom += `
    <author>
      <name>${escapeXML(item.author)}</name>
    </author>`;
    }

    if (item.category) {
      atom += `\n    <category term="${escapeXML(item.category)}"/>`;
    }

    atom += `\n  </entry>`;
  });

  atom += `
</feed>`;

  return atom;
}

// JSON Feed (modern alternative)
export function generateJSONFeed(items: RSSItem[], options: RSSFeedOptions): object {
  return {
    version: 'https://jsonfeed.org/version/1.1',
    title: options.title,
    home_page_url: options.link,
    feed_url: `${options.link}/feed.json`,
    description: options.description,
    language: options.language || 'en-US',
    items: items.map((item) => ({
      id: item.guid || item.link,
      url: item.link,
      title: item.title,
      content_html: item.content || item.description,
      summary: item.description,
      date_published: new Date(item.pubDate).toISOString(),
      authors: item.author ? [{ name: item.author }] : undefined,
      tags: item.category ? [item.category] : undefined,
      image: item.image,
    })),
  };
}

export default generateRSSFeed;
