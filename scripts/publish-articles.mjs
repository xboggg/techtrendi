import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
// Use service role key for publishing (has more permissions)
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('   Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log(`\n🔐 Using Supabase at: ${supabaseUrl}`);
console.log(`🔑 Key type: ${supabaseKey.includes('service_role') ? 'Service Role' : 'Anon'}\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

function parseArticleFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath, '.md');

  // Extract title (first # heading)
  const titleMatch = fileContent.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : 'Untitled';

  // Generate slug from filename
  const slug = fileName;

  // Extract SEO Metadata section
  const seoMatch = fileContent.match(/## SEO Metadata[\s\S]*?- \*\*Primary Keyword:\*\* (.+)/);
  const primaryKeyword = seoMatch ? seoMatch[1] : '';

  const metaTitleMatch = fileContent.match(/- \*\*Meta Title:\*\* (.+)/);
  const metaTitle = metaTitleMatch ? metaTitleMatch[1] : title;

  const metaDescMatch = fileContent.match(/- \*\*Meta Description:\*\* (.+)/);
  const metaDescription = metaDescMatch ? metaDescMatch[1] : '';

  const readingTimeMatch = fileContent.match(/- \*\*Reading Time:\*\* (.+)/);
  const readingTimeText = readingTimeMatch ? readingTimeMatch[1] : '5-10 minutes';
  const readTimeMinutes = parseInt(readingTimeText.match(/\d+/)?.[0] || '5');

  const secondaryKeywordsMatch = fileContent.match(/- \*\*Secondary Keywords:\*\* (.+)/);
  const tags = secondaryKeywordsMatch ? secondaryKeywordsMatch[1].split(',').map(t => t.trim()) : [];

  // Determine category from filename
  let category = 'How-To';
  if (fileName.includes('phone') || fileName.includes('budget')) {
    category = 'Phones';
  } else if (fileName.includes('security') || fileName.includes('password') || fileName.includes('vpn')) {
    category = 'Security';
  } else if (fileName.includes('ai') || fileName.includes('side-hustle')) {
    category = 'AI Tech';
  } else if (fileName.includes('productivity') || fileName.includes('tools')) {
    category = 'Productivity';
  }

  // Extract first meaningful paragraph as excerpt
  const contentMatch = fileContent.match(/## Article Content\n\n([\s\S]*?)\n\n---/);
  let excerpt = '';
  if (contentMatch) {
    const paragraphs = contentMatch[1].split('\n\n').filter(p => p.trim() && !p.startsWith('#'));
    if (paragraphs.length > 0) {
      excerpt = paragraphs[0].substring(0, 200).replace(/\*\*/g, '').replace(/\*/g, '').trim();
      if (excerpt.length >= 200) excerpt += '...';
    }
  }

  // Get the main article content
  const mainContentMatch = fileContent.match(/## Article Content\n\n([\s\S]*?)\n## Schema Markup/);
  let mainContent = mainContentMatch ? mainContentMatch[1] : fileContent;

  // Extract images
  const images = [];
  const imageSection = fileContent.match(/## Image Suggestions\n\n([\s\S]*?)\n---/);
  if (imageSection) {
    const imageLines = imageSection[1].split('\n').filter(line => line.match(/^\d+\./));
    imageLines.forEach(line => {
      const match = line.match(/\*\*(.+?)\*\* \((.+?)\) - (.+?) - Alt: "(.+?)"/);
      if (match) {
        images.push({
          filename: match[1],
          dimensions: match[2],
          description: match[3],
          altText: match[4]
        });
      }
    });
  }

  return {
    metadata: {
      title,
      slug,
      primaryKeyword,
      metaTitle,
      metaDescription,
      readTimeMinutes,
      category,
      excerpt,
      tags,
      images
    },
    content: mainContent.trim()
  };
}

async function publishArticle(filePath) {
  try {
    const fileName = path.basename(filePath);
    console.log(`\n📄 Processing: ${fileName}`);

    const { metadata, content } = parseArticleFile(filePath);

    console.log(`   Title: ${metadata.title}`);
    console.log(`   Slug: ${metadata.slug}`);
    console.log(`   Category: ${metadata.category}`);
    console.log(`   Reading Time: ${metadata.readTimeMinutes} minutes`);
    console.log(`   Images: ${metadata.images.length} specified`);
    console.log(`   Tags: ${metadata.tags.length} tags`);

    // Insert into Supabase
    const { data, error } = await supabase
      .from('articles')
      .upsert({
        slug: metadata.slug,
        title: metadata.title,
        content: content,
        excerpt: metadata.excerpt,
        category: metadata.category,
        tags: metadata.tags,
        read_time_minutes: metadata.readTimeMinutes,
        author: 'TechTrendi Team',
        is_published: true,
        is_premium: false,
        cover_image: metadata.images.length > 0 ? `/images/articles/${metadata.images[0].filename}` : null,
        views: 0
      }, {
        onConflict: 'slug'
      });

    if (error) {
      console.error(`   ❌ Error: ${error.message}`);
      return false;
    }

    console.log(`   ✅ Published successfully!`);

    // Write image manifest for reference
    if (metadata.images.length > 0) {
      const manifestDir = path.join(__dirname, '../content/image-manifests');
      if (!fs.existsSync(manifestDir)) {
        fs.mkdirSync(manifestDir, { recursive: true });
      }

      const imageManifest = {
        article: metadata.slug,
        title: metadata.title,
        images: metadata.images
      };

      const manifestPath = path.join(manifestDir, `${metadata.slug}.json`);
      fs.writeFileSync(manifestPath, JSON.stringify(imageManifest, null, 2));
      console.log(`   📸 Image manifest: content/image-manifests/${metadata.slug}.json`);
    }

    return true;
  } catch (error) {
    console.error(`   ❌ Error processing article:`, error.message);
    return false;
  }
}

async function publishAllArticles() {
  const articlesDir = path.join(__dirname, '../content/articles');

  if (!fs.existsSync(articlesDir)) {
    console.error(`❌ Articles directory not found: ${articlesDir}`);
    return;
  }

  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));

  console.log(`\n${'='.repeat(70)}`);
  console.log(`📚 Found ${files.length} articles to publish`);
  console.log(`${'='.repeat(70)}`);

  let successCount = 0;
  let failCount = 0;

  for (const file of files) {
    const filePath = path.join(articlesDir, file);
    const success = await publishArticle(filePath);

    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`\n📊 Publishing Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📚 Total: ${files.length}`);
  console.log(`\n${'='.repeat(70)}\n`);

  if (successCount > 0) {
    console.log(`\n💡 Next Steps:`);
    console.log(`   1. Check image manifests in content/image-manifests/`);
    console.log(`   2. Create/source images according to specifications`);
    console.log(`   3. Place images in public/images/articles/`);
    console.log(`   4. Articles are live at: http://localhost:5173/blog/[slug]\n`);
  }
}

// Run the script
publishAllArticles().catch(console.error);
