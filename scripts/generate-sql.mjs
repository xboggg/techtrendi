import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articles = [
  {
    slug: 'slow-computer-fix-guide',
    file: 'slow-computer-fix-guide.md',
    category: 'How-To',
    readTime: 13,
    tags: ['speed up computer', 'slow PC fix', 'computer performance', 'Windows optimization', 'SSD upgrade']
  },
  {
    slug: 'improve-home-wifi-guide',
    file: 'improve-home-wifi-guide.md',
    category: 'How-To',
    readTime: 14,
    tags: ['improve WiFi speed', 'WiFi problems', 'router setup', 'mesh network', 'WiFi troubleshooting']
  },
  {
    slug: 'phone-battery-optimization-guide',
    file: 'phone-battery-optimization-guide.md',
    category: 'Phones',
    readTime: 13,
    tags: ['phone battery life', 'battery optimization', 'extend battery', 'phone settings', 'battery drain fix']
  },
  {
    slug: 'ai-tools-save-time-guide',
    file: 'ai-tools-save-time-guide.md',
    category: 'AI Tech',
    readTime: 13,
    tags: ['best AI tools', 'AI productivity', 'ChatGPT alternatives', 'AI for work', 'time-saving tools']
  },
  {
    slug: 'backup-data-complete-guide',
    file: 'backup-data-complete-guide.md',
    category: 'How-To',
    readTime: 11,
    tags: ['data backup', 'backup strategy', 'ransomware protection', '3-2-1 backup', 'cloud backup']
  },
  {
    slug: 'password-security-complete-guide',
    file: 'password-security-complete-guide.md',
    category: 'Security',
    readTime: 11,
    tags: ['password security', 'password manager', 'strong passwords', '2FA', 'cybersecurity']
  },
  {
    slug: 'best-vpn-services-tested',
    file: 'best-vpn-services-tested.md',
    category: 'Security',
    readTime: 11,
    tags: ['best VPN', 'VPN comparison', 'VPN speed test', 'streaming VPN', 'secure VPN']
  },
  {
    slug: 'best-budget-phones-under-300',
    file: 'best-budget-phones-under-300.md',
    category: 'Phones',
    readTime: 11,
    tags: ['budget phones', 'cheap smartphones', 'phone camera test', 'best value phones']
  },
  {
    slug: 'free-up-storage-space-guide',
    file: 'free-up-storage-space-guide.md',
    category: 'How-To',
    readTime: 12,
    tags: ['free up storage', 'delete temporary files', 'storage cleanup', 'disk space', 'computer storage']
  },
  {
    slug: 'ai-side-hustles-make-money',
    file: 'ai-side-hustles-make-money.md',
    category: 'AI Tech',
    readTime: 16,
    tags: ['AI side hustles', 'make money with AI', 'ChatGPT income', 'AI freelancing', 'passive income']
  },
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
  // Extract title
  const titleMatch = fileContent.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : '';

  // Find where actual article content starts (after all metadata and image specs)
  const lines = fileContent.split('\n');
  let contentStartIndex = -1;
  let foundFirstHeading = false;

  // Skip past title, metadata, and image specifications
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip the title
    if (line.startsWith('# ') && !foundFirstHeading) {
      foundFirstHeading = true;
      continue;
    }

    // Skip metadata lines
    if (line.startsWith('**') || line.startsWith('---') || line.match(/^\*.*:\*/)) {
      continue;
    }

    // Skip image specification blocks
    if (line.includes('*Description:*') || line.includes('*Alt Text:*') ||
        line.includes('*Dimensions:*') || line.includes('*File Name:*') ||
        line.startsWith('**Image')) {
      continue;
    }

    // Skip SEO sections
    if (line.includes('## SEO') || line.includes('## Featured Image')) {
      continue;
    }

    // Found first paragraph of actual content
    if (line.trim() && !line.startsWith('#') && !line.startsWith('*') && !line.startsWith('**')) {
      contentStartIndex = i;
      break;
    }
  }

  // Extract everything from content start to before Schema Markup
  let content = '';
  if (contentStartIndex !== -1) {
    const contentLines = [];
    for (let i = contentStartIndex; i < lines.length; i++) {
      const line = lines[i];

      // Stop at Schema Markup section
      if (line.includes('## Schema Markup') || line.includes('```json')) {
        break;
      }

      contentLines.push(line);
    }
    content = contentLines.join('\n').trim();
  }

  // Extract excerpt (first meaningful paragraph)
  const paragraphs = content.split('\n\n').filter(p => {
    return p.trim() &&
           !p.startsWith('#') &&
           !p.startsWith('---') &&
           !p.startsWith('*') &&
           !p.startsWith('**Image') &&
           p.length > 50;
  });

  let excerpt = '';
  if (paragraphs.length > 0) {
    excerpt = paragraphs[0].substring(0, 200).replace(/\*\*/g, '').replace(/\*/g, '').trim();
    if (excerpt.length >= 200) excerpt += '...';
  }

  return { title, content: content.trim(), excerpt };
}

function escapeSQLString(str) {
  // Escape single quotes for SQL
  return str.replace(/'/g, "''");
}

function generateSQL() {
  console.log('📝 Generating SQL for all 35 articles...\n');

  let sql = `-- TechTrendi Articles - Complete Import
-- Generated: ${new Date().toISOString()}
-- Run this in Supabase SQL Editor

-- Delete existing articles if any (optional - remove this line to keep existing)
-- DELETE FROM public.articles;

`;

  const articlesDir = path.join(__dirname, '../content/articles');

  articles.forEach((article, index) => {
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

    sql += `-- Article ${index + 1}: ${title}
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

  const outputPath = path.join(__dirname, 'PUBLISH_ALL_35_ARTICLES.sql');
  fs.writeFileSync(outputPath, sql);

  console.log(`\n✅ SQL file created: scripts/PUBLISH_ALL_35_ARTICLES.sql`);
  console.log(`📊 Total articles: ${articles.length}`);
  console.log(`📏 File size: ${(sql.length / 1024).toFixed(2)} KB`);
  console.log(`\n🚀 Next steps:`);
  console.log(`   1. Open https://studio.techtrendi.com`);
  console.log(`   2. Go to SQL Editor`);
  console.log(`   3. Copy content from scripts/PUBLISH_ALL_35_ARTICLES.sql`);
  console.log(`   4. Paste and Run`);
  console.log(`   5. All 35 articles published! ✨`);
}

generateSQL();
