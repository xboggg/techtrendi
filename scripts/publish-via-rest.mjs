import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Article metadata mapping
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
  }
];

function extractContent(fileContent) {
  // Extract title
  const titleMatch = fileContent.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : '';

  // Extract content between "## Article Content" or after first ## and before "## Schema Markup"
  let content = '';
  const contentMatch = fileContent.match(/## Article Content\n\n([\s\S]*?)\n(?:## Schema Markup|## Frequently Asked Questions)/);

  if (contentMatch) {
    content = contentMatch[1];
  } else {
    // Fallback: get everything after the first real content paragraph
    const lines = fileContent.split('\n');
    let startCollecting = false;
    let contentLines = [];

    for (const line of lines) {
      if (line.startsWith('## Article Content')) {
        startCollecting = true;
        continue;
      }
      if (startCollecting && line.startsWith('## Schema Markup')) {
        break;
      }
      if (startCollecting && line.trim()) {
        contentLines.push(line);
      }
    }
    content = contentLines.join('\n');
  }

  // Add FAQ section
  const faqMatch = fileContent.match(/## Frequently Asked Questions\n\n([\s\S]*?)\n---\n\n## Schema Markup/);
  if (faqMatch) {
    content += '\n\n## Frequently Asked Questions\n\n' + faqMatch[1];
  }

  // Extract excerpt (first meaningful paragraph)
  const paragraphs = content.split('\n\n').filter(p => {
    return p.trim() && !p.startsWith('#') && !p.startsWith('---') && p.length > 50;
  });

  let excerpt = '';
  if (paragraphs.length > 0) {
    excerpt = paragraphs[0].substring(0, 200).replace(/\*\*/g, '').replace(/\*/g, '').trim();
    if (excerpt.length >= 200) excerpt += '...';
  }

  return { title, content: content.trim(), excerpt };
}

async function publishArticle(article) {
  try {
    const articlesDir = path.join(__dirname, '../content/articles');
    const filePath = path.join(articlesDir, article.file);

    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${article.file}`);
      return false;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { title, content, excerpt } = extractContent(fileContent);
    const coverImage = `/images/articles/${article.slug}-hero.webp`;

    console.log(`\n📄 Publishing: ${article.slug}`);
    console.log(`   Title: ${title}`);
    console.log(`   Words: ${content.split(/\s+/).length}`);

    // Use Supabase REST API with POST to /rest/v1/articles
    const response = await fetch(`${SUPABASE_URL}/rest/v1/articles`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        slug: article.slug,
        title: title,
        excerpt: excerpt,
        content: content,
        category: article.category,
        tags: article.tags,
        author: 'TechTrendi Team',
        read_time_minutes: article.readTime,
        cover_image: coverImage,
        is_premium: false,
        is_published: true,
        views: 0
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${response.status} - ${errorText}`);
      return false;
    }

    console.log(`   ✅ Published successfully!`);
    return true;

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function publishAll() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📚 Publishing ${articles.length} articles to ${SUPABASE_URL}`);
  console.log(`${'='.repeat(70)}`);

  let successCount = 0;
  let failCount = 0;

  for (const article of articles) {
    const success = await publishArticle(article);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`\n📊 Publishing Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📚 Total: ${articles.length}`);
  console.log(`\n${'='.repeat(70)}\n`);

  if (successCount > 0) {
    console.log(`\n🎉 Articles are now live at: https://techtrendi.com/blog\n`);
  }
}

// Run the script
publishAll().catch(console.error);
