import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Only the NEW articles (11-35) that haven't been published yet
const newArticles = [
  {
    slug: 'iphone-vs-android-honest-comparison',
    file: 'iphone-vs-android-honest-comparison.md',
    category: 'Phones',
    readTime: 13,
    tags: ['iPhone vs Android', 'smartphone comparison', 'iOS vs Android', 'best phone', 'mobile OS']
  },
  {
    slug: 'two-factor-authentication-guide',
    file: 'two-factor-authentication-guide.md',
    category: 'Security',
    readTime: 12,
    tags: ['2FA guide', 'two-factor authentication', 'account security', 'authentication apps', 'security keys']
  },
  {
    slug: 'online-privacy-protection-guide',
    file: 'online-privacy-protection-guide.md',
    category: 'Security',
    readTime: 15,
    tags: ['online privacy', 'privacy protection', 'digital privacy', 'data tracking', 'privacy tips']
  },
  {
    slug: 'signs-you-need-new-phone',
    file: 'signs-you-need-new-phone.md',
    category: 'Phones',
    readTime: 11,
    tags: ['phone upgrade', 'when to upgrade phone', 'phone battery life', 'slow phone', 'new phone signs']
  },
  {
    slug: 'boost-laptop-battery-life',
    file: 'boost-laptop-battery-life.md',
    category: 'How-To',
    readTime: 14,
    tags: ['laptop battery life', 'extend battery', 'battery optimization', 'laptop settings', 'power management']
  },
  {
    slug: 'best-antivirus-2026-tested',
    file: 'best-antivirus-2026-tested.md',
    category: 'Security',
    readTime: 15,
    tags: ['best antivirus', 'antivirus comparison', 'malware protection', 'Windows Defender', 'antivirus test']
  },
  {
    slug: 'smartphone-camera-tips-pro-photos',
    file: 'smartphone-camera-tips-pro-photos.md',
    category: 'Phones',
    readTime: 14,
    tags: ['smartphone photography', 'phone camera tips', 'mobile photography', 'better phone photos', 'camera settings']
  },
  {
    slug: 'chatgpt-prompts-better-results',
    file: 'chatgpt-prompts-better-results.md',
    category: 'AI Tech',
    readTime: 14,
    tags: ['ChatGPT prompts', 'AI prompts', 'ChatGPT tips', 'AI productivity', 'prompt engineering']
  },
  {
    slug: 'smartphone-data-privacy-guide',
    file: 'smartphone-data-privacy-guide.md',
    category: 'Security',
    readTime: 13,
    tags: ['smartphone privacy', 'mobile privacy', 'app permissions', 'phone tracking', 'data privacy']
  },
  {
    slug: 'work-from-home-productivity-guide',
    file: 'work-from-home-productivity-guide.md',
    category: 'How-To',
    readTime: 14,
    tags: ['work from home', 'remote work', 'productivity tips', 'home office setup', 'WFH tips']
  },
  {
    slug: 'cloud-storage-comparison-guide',
    file: 'cloud-storage-comparison-guide.md',
    category: 'How-To',
    readTime: 13,
    tags: ['cloud storage', 'cloud backup', 'Google Drive', 'Dropbox', 'cloud comparison']
  },
  {
    slug: 'gaming-laptop-vs-desktop-guide',
    file: 'gaming-laptop-vs-desktop-guide.md',
    category: 'Gaming',
    readTime: 12,
    tags: ['gaming laptop', 'gaming desktop', 'PC gaming', 'laptop vs desktop', 'gaming PC']
  },
  {
    slug: 'mechanical-keyboard-guide',
    file: 'mechanical-keyboard-guide.md',
    category: 'Accessories',
    readTime: 11,
    tags: ['mechanical keyboard', 'keyboard switches', 'gaming keyboard', 'typing keyboard', 'keyboard guide']
  },
  {
    slug: 'video-editing-pc-build-guide',
    file: 'video-editing-pc-build-guide.md',
    category: 'How-To',
    readTime: 13,
    tags: ['video editing PC', 'PC build', 'DaVinci Resolve', 'Premiere Pro', '4K editing']
  },
  {
    slug: 'smart-home-security-guide',
    file: 'smart-home-security-guide.md',
    category: 'Security',
    readTime: 14,
    tags: ['smart home security', 'IoT security', 'smart device security', 'home automation', 'privacy']
  },
  {
    slug: 'password-manager-guide',
    file: 'password-manager-guide.md',
    category: 'Security',
    readTime: 13,
    tags: ['password manager', 'Bitwarden', '1Password', 'password security', 'credential management']
  },
  {
    slug: 'router-security-guide',
    file: 'router-security-guide.md',
    category: 'Security',
    readTime: 12,
    tags: ['router security', 'WiFi security', 'home network', 'router settings', 'network security']
  },
  {
    slug: 'vpn-comparison-guide',
    file: 'vpn-comparison-guide.md',
    category: 'Security',
    readTime: 15,
    tags: ['VPN comparison', 'best VPN', 'VPN speed test', 'VPN privacy', 'Mullvad']
  },
  {
    slug: 'email-security-guide',
    file: 'email-security-guide.md',
    category: 'Security',
    readTime: 13,
    tags: ['email security', 'email hacking', 'ProtonMail', '2FA email', 'phishing protection']
  },
  {
    slug: 'windows-vs-mac-security',
    file: 'windows-vs-mac-security.md',
    category: 'Security',
    readTime: 14,
    tags: ['Windows vs Mac', 'OS security', 'macOS security', 'Windows security', 'operating system']
  },
  {
    slug: 'linux-for-beginners-guide',
    file: 'linux-for-beginners-guide.md',
    category: 'How-To',
    readTime: 13,
    tags: ['Linux for beginners', 'Ubuntu', 'Linux Mint', 'Pop!_OS', 'switching to Linux']
  },
  {
    slug: 'monitor-buying-guide',
    file: 'monitor-buying-guide.md',
    category: 'Accessories',
    readTime: 12,
    tags: ['best monitor', 'gaming monitor', '4K vs 1440p', 'monitor guide', 'display']
  },
  {
    slug: 'ssd-upgrade-guide',
    file: 'ssd-upgrade-guide.md',
    category: 'How-To',
    readTime: 11,
    tags: ['SSD upgrade', 'HDD to SSD', 'computer upgrade', 'NVMe SSD', 'SATA SSD']
  },
  {
    slug: 'browser-privacy-guide',
    file: 'browser-privacy-guide.md',
    category: 'Security',
    readTime: 12,
    tags: ['browser privacy', 'private browser', 'Firefox', 'Brave', 'Chrome privacy']
  },
  {
    slug: 'smartphone-buying-guide',
    file: 'smartphone-buying-guide.md',
    category: 'Phones',
    readTime: 13,
    tags: ['best smartphone', 'phone buying guide', 'iPhone vs Android', 'budget phones', 'flagship phones']
  },
  {
    slug: 'usb-flash-drive-guide',
    file: 'usb-flash-drive-guide.md',
    category: 'Accessories',
    readTime: 11,
    tags: ['USB flash drive', 'best USB drive', 'USB speed test', 'portable storage', 'USB-C drive']
  },
  {
    slug: 'wireless-earbuds-guide',
    file: 'wireless-earbuds-guide.md',
    category: 'Accessories',
    readTime: 12,
    tags: ['wireless earbuds', 'AirPods', 'best earbuds', 'noise cancellation', 'earbud comparison']
  },
  {
    slug: 'external-hard-drive-guide',
    file: 'external-hard-drive-guide.md',
    category: 'Accessories',
    readTime: 12,
    tags: ['external hard drive', 'backup drive', 'HDD vs SSD', 'portable SSD', 'data storage']
  }
];

function extractContent(fileContent) {
  const titleMatch = fileContent.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : '';

  const lines = fileContent.split('\n');
  let contentStartIndex = -1;
  let foundFirstHeading = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('# ') && !foundFirstHeading) {
      foundFirstHeading = true;
      continue;
    }
    if (line.startsWith('**') || line.startsWith('---') || line.match(/^\*.*:\*/)) continue;
    if (line.includes('*Description:*') || line.includes('*Alt Text:*') ||
        line.includes('*Dimensions:*') || line.includes('*File Name:*') ||
        line.startsWith('**Image')) continue;
    if (line.includes('## SEO') || line.includes('## Featured Image')) continue;

    if (line.trim() && !line.startsWith('#') && !line.startsWith('*') && !line.startsWith('**')) {
      contentStartIndex = i;
      break;
    }
  }

  let content = '';
  if (contentStartIndex !== -1) {
    const contentLines = [];
    for (let i = contentStartIndex; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('## Schema Markup') || line.includes('```json')) break;
      contentLines.push(line);
    }
    content = contentLines.join('\n').trim();
  }

  const paragraphs = content.split('\n\n').filter(p => {
    return p.trim() && !p.startsWith('#') && !p.startsWith('---') &&
           !p.startsWith('*') && !p.startsWith('**Image') && p.length > 50;
  });

  let excerpt = '';
  if (paragraphs.length > 0) {
    excerpt = paragraphs[0].substring(0, 200).replace(/\*\*/g, '').replace(/\*/g, '').trim();
    if (excerpt.length >= 200) excerpt += '...';
  }

  return { title, content: content.trim(), excerpt };
}

function escapeSQLString(str) {
  return str.replace(/'/g, "''");
}

function generateSQL() {
  console.log('📝 Generating SQL for NEW articles only (11-35)...\n');

  let sql = `-- TechTrendi NEW Articles - Articles 11-35
-- Generated: ${new Date().toISOString()}
-- Run this in Supabase SQL Editor
-- This will add only the new articles without affecting existing ones

`;

  const articlesDir = path.join(__dirname, '../content/articles');

  newArticles.forEach((article, index) => {
    const filePath = path.join(articlesDir, article.file);

    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${article.file}`);
      return;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { title, content, excerpt } = extractContent(fileContent);

    const coverImage = `/images/articles/${article.slug}-hero.webp`;

    console.log(`${index + 1}. ✅ ${article.slug}`);
    console.log(`   Words: ${content.split(/\s+/).length}`);

    sql += `-- Article ${index + 11}: ${title}
INSERT INTO public.articles (
  slug,
  title,
  excerpt,
  content,
  category,
  tags,
  author,
  read_time_minutes,
  cover_image,
  is_premium,
  is_published,
  views
) VALUES (
  '${article.slug}',
  '${escapeSQLString(title)}',
  '${escapeSQLString(excerpt)}',
  '${escapeSQLString(content)}',
  '${article.category}',
  ARRAY[${article.tags.map(t => `'${t}'`).join(', ')}],
  'TechTrendi Team',
  ${article.readTime},
  '${coverImage}',
  false,
  true,
  0
);

`;
  });

  sql += `
-- Verify import
SELECT slug, title, read_time_minutes, category, is_published
FROM public.articles
ORDER BY created_at DESC;
`;

  const outputPath = path.join(__dirname, 'PUBLISH_NEW_ARTICLES_11-35.sql');
  fs.writeFileSync(outputPath, sql);

  console.log(`\n✅ SQL file created: scripts/PUBLISH_NEW_ARTICLES_11-35.sql`);
  console.log(`📊 Total NEW articles: ${newArticles.length}`);
  console.log(`📏 File size: ${(sql.length / 1024).toFixed(2)} KB`);
  console.log(`\n🚀 Next steps:`);
  console.log(`   1. Open https://studio.techtrendi.com`);
  console.log(`   2. Go to SQL Editor`);
  console.log(`   3. Copy content from scripts/PUBLISH_NEW_ARTICLES_11-35.sql`);
  console.log(`   4. Paste and Run`);
  console.log(`   5. 25 new articles added! (Total: 35) ✨`);
}

generateSQL();
