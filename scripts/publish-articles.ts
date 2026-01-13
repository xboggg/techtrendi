import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface ArticleMetadata {
  title: string;
  slug: string;
  primaryKeyword: string;
  metaTitle: string;
  metaDescription: string;
  targetWordCount: string;
  readingTime: string;
  category: string;
  excerpt: string;
  tags: string[];
  images: ImageSpec[];
  schema: any[];
}

interface ImageSpec {
  filename: string;
  dimensions: string;
  description: string;
  altText: string;
}

function parseArticleFile(filePath: string): { metadata: ArticleMetadata; content: string } {
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  // Extract title (first # heading)
  const titleMatch = fileContent.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : 'Untitled';

  // Generate slug from title
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  // Extract SEO Metadata section
  const seoMatch = fileContent.match(/## SEO Metadata\n([\s\S]*?)\n---/);
  let primaryKeyword = '';
  let metaTitle = '';
  let metaDescription = '';
  let readingTime = '5-10 minutes';
  let category = 'How-To';
  let tags: string[] = [];

  if (seoMatch) {
    const seoContent = seoMatch[1];

    const pkMatch = seoContent.match(/- \*\*Primary Keyword:\*\* (.+)/);
    primaryKeyword = pkMatch ? pkMatch[1] : '';

    const mtMatch = seoContent.match(/- \*\*Meta Title:\*\* (.+)/);
    metaTitle = mtMatch ? mtMatch[1] : title;

    const mdMatch = seoContent.match(/- \*\*Meta Description:\*\* (.+)/);
    metaDescription = mdMatch ? mdMatch[1] : '';

    const rtMatch = seoContent.match(/- \*\*Reading Time:\*\* (.+)/);
    readingTime = rtMatch ? rtMatch[1] : '5-10 minutes';

    const skMatch = seoContent.match(/- \*\*Secondary Keywords:\*\* (.+)/);
    if (skMatch) {
      tags = skMatch[1].split(',').map(t => t.trim());
    }
  }

  // Determine category from filename or content
  const fileName = path.basename(filePath).toLowerCase();
  if (fileName.includes('phone') || fileName.includes('budget')) {
    category = 'Phones';
  } else if (fileName.includes('security') || fileName.includes('password') || fileName.includes('vpn')) {
    category = 'Security';
  } else if (fileName.includes('ai') || fileName.includes('side-hustle')) {
    category = 'AI Tech';
  } else if (fileName.includes('productivity') || fileName.includes('tools')) {
    category = 'Productivity';
  } else if (fileName.includes('wifi') || fileName.includes('computer') || fileName.includes('storage') || fileName.includes('battery')) {
    category = 'How-To';
  }

  // Extract first paragraph as excerpt
  const contentMatch = fileContent.match(/\n---\n\n## Article Content\n\n([\s\S]*?)\n\n---/);
  let excerpt = '';
  if (contentMatch) {
    const firstPara = contentMatch[1].split('\n\n')[0];
    excerpt = firstPara.substring(0, 200).replace(/\*/g, '').trim();
    if (excerpt.length >= 200) excerpt += '...';
  }

  // Extract images
  const images: ImageSpec[] = [];
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

  // Extract schema markup
  const schema: any[] = [];
  const schemaMatches = fileContent.matchAll(/```json\n({[\s\S]*?})\n```/g);
  for (const match of schemaMatches) {
    try {
      const schemaObj = JSON.parse(match[1]);
      schema.push(schemaObj);
    } catch (e) {
      console.error('Failed to parse schema JSON');
    }
  }

  // Get the main article content (between Article Content and FAQ)
  const mainContentMatch = fileContent.match(/## Article Content\n\n([\s\S]*?)\n## Frequently Asked Questions/);
  let mainContent = mainContentMatch ? mainContentMatch[1] : '';

  // Add FAQ section
  const faqMatch = fileContent.match(/## Frequently Asked Questions\n\n([\s\S]*?)\n---\n\n## Schema Markup/);
  if (faqMatch) {
    mainContent += '\n\n## Frequently Asked Questions\n\n' + faqMatch[1];
  }

  // Calculate reading time in minutes
  const words = mainContent.split(/\s+/).length;
  const readTimeMinutes = Math.ceil(words / 200); // Average reading speed

  return {
    metadata: {
      title,
      slug,
      primaryKeyword,
      metaTitle,
      metaDescription,
      targetWordCount: `${words}`,
      readingTime: `${readTimeMinutes}`,
      category,
      excerpt,
      tags,
      images,
      schema
    },
    content: mainContent.trim()
  };
}

async function publishArticle(filePath: string) {
  try {
    console.log(`\nProcessing: ${path.basename(filePath)}`);

    const { metadata, content } = parseArticleFile(filePath);

    console.log(`  Title: ${metadata.title}`);
    console.log(`  Slug: ${metadata.slug}`);
    console.log(`  Category: ${metadata.category}`);
    console.log(`  Word Count: ${metadata.targetWordCount}`);
    console.log(`  Reading Time: ${metadata.readingTime} minutes`);
    console.log(`  Images: ${metadata.images.length} specified`);
    console.log(`  Schema: ${metadata.schema.length} blocks`);

    // Add image placeholders to content
    let contentWithImages = content;

    // Add featured image at the top
    if (metadata.images.length > 0) {
      const featuredImage = metadata.images[0];
      contentWithImages = `![${featuredImage.altText}](/images/articles/${featuredImage.filename})\n\n${contentWithImages}`;
    }

    // Insert additional images throughout the content
    if (metadata.images.length > 1) {
      const sections = contentWithImages.split('\n## ');
      const imagesPerSection = Math.floor(metadata.images.length / sections.length);

      sections.forEach((section, index) => {
        if (index > 0 && index < metadata.images.length) {
          const img = metadata.images[index];
          sections[index] = `${section}\n\n![${img.altText}](/images/articles/${img.filename})\n`;
        }
      });

      contentWithImages = sections.join('\n## ');
    }

    // Add schema markup as a comment at the end
    if (metadata.schema.length > 0) {
      contentWithImages += '\n\n<!-- Schema Markup:\n' + JSON.stringify(metadata.schema, null, 2) + '\n-->';
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('articles')
      .upsert({
        slug: metadata.slug,
        title: metadata.title,
        content: contentWithImages,
        excerpt: metadata.excerpt,
        category: metadata.category,
        tags: metadata.tags,
        read_time_minutes: parseInt(metadata.readingTime),
        author: 'TechTrendi Team',
        is_published: true,
        is_premium: false,
        cover_image: metadata.images.length > 0 ? `/images/articles/${metadata.images[0].filename}` : null,
        views: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'slug'
      });

    if (error) {
      console.error(`  ❌ Error:`, error.message);
      return false;
    }

    console.log(`  ✅ Published successfully!`);

    // Write image manifest
    const imageManifest = {
      article: metadata.slug,
      images: metadata.images
    };

    const manifestPath = path.join(
      path.dirname(filePath),
      `../image-manifests/${metadata.slug}.json`
    );

    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify(imageManifest, null, 2));

    console.log(`  📸 Image manifest created`);

    return true;
  } catch (error) {
    console.error(`  ❌ Error processing article:`, error);
    return false;
  }
}

async function publishAllArticles() {
  const articlesDir = path.join(__dirname, '../content/articles');

  if (!fs.existsSync(articlesDir)) {
    console.error(`Articles directory not found: ${articlesDir}`);
    return;
  }

  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));

  console.log(`Found ${files.length} articles to publish\n`);
  console.log('='.repeat(60));

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

  console.log('\n' + '='.repeat(60));
  console.log(`\nPublishing complete!`);
  console.log(`  ✅ Success: ${successCount}`);
  console.log(`  ❌ Failed: ${failCount}`);
  console.log(`  📊 Total: ${files.length}`);
}

// Run the script
publishAllArticles().catch(console.error);
