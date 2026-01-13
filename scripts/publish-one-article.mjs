import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

console.log(`\n🔐 Connecting to: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    }
  }
});

// Test article data
const testArticle = {
  slug: 'slow-computer-fix-guide',
  title: 'Slow Computer? I Fixed 50 in One Month - These 5 Things Were Always the Problem',
  category: 'How-To',
  read_time_minutes: 13,
  author: 'TechTrendi Team',
  is_published: true,
  is_premium: false,
  views: 0,
  tags: ['speed up computer', 'slow PC fix', 'computer performance', 'Windows optimization', 'SSD upgrade'],
  excerpt: 'My laptop was taking 8 minutes to start. Eight. Minutes. I\'d turn it on, go make coffee, check my phone, and come back to find it still loading. The worst part? Task Manager showed my CPU at 98% when I hadn\'t even opened anything yet.',
  cover_image: '/images/articles/slow-computer-task-manager-startup.webp',
  content: `My laptop was taking 8 minutes to start. Eight. Minutes.

I'd turn it on, go make coffee, check my phone, and come back to find it still loading. The worst part? Task Manager showed my CPU at 98% when I hadn't even opened anything yet.

Sound familiar?

Last month, I helped 50 people fix their slow computers. Friends, family, random people from Facebook groups asking for help. And here's what shocked me: the same 5 issues caused 90% of slow computer problems.

Not viruses. Not age. Not "needing more RAM."

## Why Your Computer is Actually Slow (It's Probably Not What You Think)

Before I started my fix-50-computers experiment, I thought slow computers were complicated. Maybe the hard drive was dying. Maybe the processor was outdated. Maybe it needed a fresh Windows install.

Wrong.

In 47 out of 50 cases, the computer was slow because of preventable software issues. Not hardware failures. Not age. Just bad digital hygiene.

The average computer I worked on had:
- 23 startup programs running at boot
- 18 browser extensions installed (most unused)
- 47GB of temp files
- Windows updates from 6 months ago still pending

## Frequently Asked Questions

**Q: Will this delete any of my files?**

A: No. The cleanup process only removes temporary files and cache. Your documents, photos, and programs stay untouched.

**Q: How often should I do this cleanup?**

A: I do mine monthly. Takes 10 minutes now that I know the process. Set a phone reminder for the first Sunday of each month.

**Q: What if my computer is still slow after this?**

A: Three possibilities:
1. You have an HDD → Consider SSD upgrade
2. Your computer is 7+ years old → Hardware is genuinely outdated
3. You have a virus/malware → Run Malwarebytes (free scan)`
};

async function testConnection() {
  try {
    console.log('📡 Testing Supabase connection...\n');

    // Test 1: Try to query the articles table
    const { data: existingArticles, error: queryError } = await supabase
      .from('articles')
      .select('slug, title')
      .limit(5);

    if (queryError) {
      console.log('❌ Query test failed:', queryError.message);
      console.log('   Details:', queryError);
      return false;
    }

    console.log('✅ Query test passed');
    console.log(`   Found ${existingArticles?.length || 0} existing articles\n`);

    // Test 2: Try to insert the test article
    console.log('📝 Attempting to insert test article...\n');

    const { data, error } = await supabase
      .from('articles')
      .upsert(testArticle, {
        onConflict: 'slug'
      })
      .select();

    if (error) {
      console.log('❌ Insert failed:', error.message);
      console.log('   Details:', error);
      return false;
    }

    console.log('✅ Test article inserted successfully!');
    console.log('   Slug:', testArticle.slug);
    console.log('   Title:', testArticle.title);
    console.log('\n🎉 Supabase connection is working!\n');

    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

testConnection();
