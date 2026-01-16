-- Seed DigiStore Products: 10 Premium Excel Spreadsheet Products
-- TechTrendi.com DigiStore - January 2026
-- Run this migration to add all 10 spreadsheet products to the store

-- Note: Replace image_url and file_url with actual Supabase storage URLs after uploading files

-- ============================================
-- MONEY SHEETS CATEGORY
-- ============================================

-- 1. Financial Dashboard - FLAGSHIP PRODUCT
INSERT INTO products (
  name,
  description,
  price,
  original_price,
  image_url,
  category,
  type,
  file_url,
  is_featured,
  is_premium_only,
  is_published,
  download_count
) VALUES (
  'The Ultimate Financial Dashboard',
  'Take control of your finances with this all-in-one Excel dashboard. Track income, expenses, budgets, savings goals, net worth, and debt payoff in one beautiful spreadsheet. Includes 10 interconnected sheets with automated calculations, visual charts, and progress tracking. Finally understand where your money actually goes.',
  19.99,
  39.99,
  '/products/financial-dashboard.svg',
  'Finance',
  'excel',
  NULL,
  true,
  false,
  true,
  0
);

-- 2. Side Hustle Profit Tracker
INSERT INTO products (
  name,
  description,
  price,
  original_price,
  image_url,
  category,
  type,
  file_url,
  is_featured,
  is_premium_only,
  is_published,
  download_count
) VALUES (
  'Side Hustle Profit Tracker',
  'Track all your side hustles in one place. See real profit (not just revenue), calculate true hourly rates, set aside taxes automatically, and know which hustles are worth your time. Perfect for Etsy sellers, freelancers, YouTubers, and anyone with multiple income streams. Includes 11 sheets with profitability analysis.',
  14.99,
  29.99,
  '/products/sidehustle-tracker.svg',
  'Finance',
  'excel',
  NULL,
  true,
  false,
  true,
  0
);

-- ============================================
-- PRODUCTIVITY SHEETS CATEGORY
-- ============================================

-- 3. Life OS Dashboard
INSERT INTO products (
  name,
  description,
  price,
  original_price,
  image_url,
  category,
  type,
  file_url,
  is_featured,
  is_premium_only,
  is_published,
  download_count
) VALUES (
  'Life OS Dashboard',
  'Your entire life, beautifully organized. Track goals across 8 life areas (Health, Wealth, Relationships, Career, Growth, Fun, Environment, Contribution), build habits, manage projects, and run weekly reviews. 12 interconnected sheets including life area scorecard, habit tracker, goals tracker, and annual vision planner.',
  19.99,
  39.99,
  '/products/lifeos-dashboard.svg',
  'Productivity',
  'excel',
  NULL,
  true,
  false,
  true,
  0
);

-- 4. 12-Week Year Planner
INSERT INTO products (
  name,
  description,
  price,
  original_price,
  image_url,
  category,
  type,
  file_url,
  is_featured,
  is_premium_only,
  is_published,
  download_count
) VALUES (
  'The 12-Week Year Planner',
  'Accomplish more in 12 weeks than others do in 12 months. Based on the bestselling productivity methodology, this planner helps you set focused goals, break them into weekly tactics, and track execution with weekly scoring. Includes vision sheets, tactics breakdown, weekly scorecards, and accountability reviews.',
  12.99,
  24.99,
  '/products/12week-planner.svg',
  'Productivity',
  'excel',
  NULL,
  false,
  false,
  true,
  0
);

-- ============================================
-- BUSINESS SHEETS CATEGORY
-- ============================================

-- 5. Client & Project Command Center
INSERT INTO products (
  name,
  description,
  price,
  original_price,
  image_url,
  category,
  type,
  file_url,
  is_featured,
  is_premium_only,
  is_published,
  download_count
) VALUES (
  'Client & Project Command Center',
  'Replace expensive CRM software with this powerful Excel system. Track clients, projects, proposals, invoices, and follow-ups all in one place. Perfect for freelancers, consultants, and small agencies. Includes 12 sheets: client database, project pipeline, invoice tracker, proposal tracker, revenue analytics, and more.',
  24.99,
  49.99,
  '/products/client-center.svg',
  'Business',
  'excel',
  NULL,
  true,
  false,
  true,
  0
);

-- 6. Content Empire Planner
INSERT INTO products (
  name,
  description,
  price,
  original_price,
  image_url,
  category,
  type,
  file_url,
  is_featured,
  is_premium_only,
  is_published,
  download_count
) VALUES (
  'Content Empire Planner',
  'Plan 90 days of content in one sitting. The ultimate content planning system for YouTubers, bloggers, podcasters, and social media managers. Includes content calendar, idea bank, production tracker, platform analytics, repurposing matrix, collaboration tracker, and revenue tracking across all your platforms.',
  17.99,
  34.99,
  '/products/content-planner.svg',
  'Marketing',
  'excel',
  NULL,
  false,
  false,
  true,
  0
);

-- ============================================
-- LIFESTYLE SHEETS CATEGORY
-- ============================================

-- 7. Wedding Budget Master
INSERT INTO products (
  name,
  description,
  price,
  original_price,
  image_url,
  category,
  type,
  file_url,
  is_featured,
  is_premium_only,
  is_published,
  download_count
) VALUES (
  'Wedding Budget Master',
  'Plan your dream wedding without the financial nightmare. Complete wedding planning spreadsheet with budget tracker, guest list manager (500+ guests), vendor payments, seating chart, RSVP tracker, day-of timeline, and planning checklist. 12 sheets to keep you organized from engagement to honeymoon.',
  19.99,
  39.99,
  '/products/wedding-budget.svg',
  'Finance',
  'excel',
  NULL,
  false,
  false,
  true,
  0
);

-- 8. Travel Planner & Budget Tracker
INSERT INTO products (
  name,
  description,
  price,
  original_price,
  image_url,
  category,
  type,
  file_url,
  is_featured,
  is_premium_only,
  is_published,
  download_count
) VALUES (
  'Travel Planner & Budget Tracker',
  'Every trip, perfectly planned and budgeted. All-in-one travel planning system with trip budget, expense tracker with currency conversion, itinerary planner, booking management, packing lists, and travel document checklist. Know exactly what your trips cost and never forget important details.',
  12.99,
  24.99,
  '/products/travel-planner.svg',
  'Productivity',
  'excel',
  NULL,
  false,
  false,
  true,
  0
);

-- 9. Fitness & Body Transformation Tracker
INSERT INTO products (
  name,
  description,
  price,
  original_price,
  image_url,
  category,
  type,
  file_url,
  is_featured,
  is_premium_only,
  is_published,
  download_count
) VALUES (
  'Fitness & Body Transformation Tracker',
  'See your transformation in data, not just the mirror. Complete fitness tracking system with workout log, strength training tracker, cardio log, body measurements, weight tracker with moving averages, personal records board, and progress visualization. 13 sheets to track your entire fitness journey.',
  12.99,
  24.99,
  '/products/fitness-tracker.svg',
  'Productivity',
  'excel',
  NULL,
  false,
  false,
  true,
  0
);

-- 10. Job Hunt Command Center
INSERT INTO products (
  name,
  description,
  price,
  original_price,
  image_url,
  category,
  type,
  file_url,
  is_featured,
  is_premium_only,
  is_published,
  download_count
) VALUES (
  'Job Hunt Command Center',
  'Land your dream job with military precision. Complete job search management system with application tracker, company research database, interview prep (questions bank, STAR stories), networking tracker, offer comparison calculator, and salary negotiation prep. Never lose track of an application again.',
  14.99,
  29.99,
  '/products/jobhunt-center.svg',
  'Business',
  'excel',
  NULL,
  false,
  false,
  true,
  0
);

-- ============================================
-- SUMMARY
-- ============================================
-- Total Products Added: 10
-- Featured Products: 4 (Financial Dashboard, Side Hustle, Life OS, Client Command Center)
-- Category Distribution:
--   - Finance: 3 (Financial Dashboard, Side Hustle, Wedding)
--   - Productivity: 4 (Life OS, 12-Week, Travel, Fitness)
--   - Business: 2 (Client Center, Job Hunt)
--   - Marketing: 1 (Content Empire)
-- Price Range: $12.99 - $24.99
-- All products: Published, Not Premium-Only
