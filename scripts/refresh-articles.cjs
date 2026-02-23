/**
 * Refresh Articles Script
 *
 * This script fetches the latest articles from Supabase and updates the static JSON file.
 * Run this whenever you add new articles, then rebuild and deploy.
 *
 * Usage: node scripts/refresh-articles.cjs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://db.techtrendi.com';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlY2h0cmVuZGkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.placeholder';

async function fetchArticles() {
  return new Promise((resolve, reject) => {
    const url = `${SUPABASE_URL}/rest/v1/articles?select=*&order=created_at.desc`;

    const options = {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const articles = JSON.parse(data);
          resolve(articles);
        } catch (e) {
          reject(new Error('Failed to parse articles JSON'));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching latest articles from Supabase...');

  try {
    const articles = await fetchArticles();

    if (!Array.isArray(articles)) {
      console.error('Error: Invalid response from Supabase');
      process.exit(1);
    }

    const outputPath = path.join(__dirname, '..', 'src', 'data', 'articles.json');
    fs.writeFileSync(outputPath, JSON.stringify(articles, null, 2));

    console.log(`Success! Updated ${articles.length} articles in src/data/articles.json`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: npm run build');
    console.log('2. Run: npm run deploy');
  } catch (error) {
    console.error('Error fetching articles:', error.message);
    process.exit(1);
  }
}

main();
