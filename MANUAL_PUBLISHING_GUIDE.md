# Manual Article Publishing Guide

## Access Supabase Studio Dashboard

**URL:** https://studio.techtrendi.com
**Username:** admin
**Password:** 0dyEV4XW5NtKm1iO

---

## Step-by-Step Publishing Process

### 1. Open the Articles Table

1. Log into https://studio.techtrendi.com
2. Click on **Table Editor** in the left sidebar
3. Select the **articles** table

### 2. Insert Each Article

For each of the 10 articles, click **Insert row** and fill in the following fields:

---

## Article 1: Slow Computer Fix Guide

**Copy the content from:** `content/articles/slow-computer-fix-guide.md`

### Database Fields:

```
slug: slow-computer-fix-guide

title: Slow Computer? I Fixed 50 in One Month - These 5 Things Were Always the Problem

category: How-To

read_time_minutes: 13

author: TechTrendi Team

is_published: true

is_premium: false

views: 0

tags: ["speed up computer", "slow PC fix", "computer performance", "Windows optimization", "SSD upgrade"]

excerpt: My laptop was taking 8 minutes to start. Eight. Minutes. I'd turn it on, go make coffee, check my phone, and come back to find it still loading. The worst part? Task Manager showed my CPU at 98% when I hadn't even opened anything yet.

cover_image: /images/articles/slow-computer-task-manager-startup.webp

content: [See below for content extraction]
```

**How to get the content:**
1. Open `content/articles/slow-computer-fix-guide.md`
2. Copy everything **AFTER** the "## Article Content" line
3. Copy everything **BEFORE** the "## Schema Markup" line
4. Paste into the `content` field

**Image Specifications:** See `content/image-manifests/slow-computer-fix-guide.json`

---

## Article 2: Home WiFi Improvement

```
slug: improve-home-wifi-guide
title: Why Your WiFi Sucks (And How I Fixed Mine After 3 Years of Frustration)
category: How-To
read_time_minutes: 14
author: TechTrendi Team
is_published: true
is_premium: false
views: 0
tags: ["improve WiFi speed", "WiFi problems", "router setup", "mesh network", "WiFi troubleshooting"]
excerpt: My WiFi died. Again. For the third time that week. I was in the middle of a video call when the little spinning wheel of death appeared. My video froze mid-sentence. The call dropped. I sat there staring at my laptop, wondering if I should just move my desk next to the router.
cover_image: /images/articles/wifi-router-placement-heatmap.webp
content: [From improve-home-wifi-guide.md]
```

---

## Article 3: Phone Battery Optimization

```
slug: phone-battery-optimization-guide
title: I Extended My Phone Battery Life by 4 Hours a Day - Here's Exactly How
category: Phones
read_time_minutes: 13
author: TechTrendi Team
is_published: true
is_premium: false
views: 0
tags: ["phone battery life", "battery optimization", "extend battery", "phone settings", "battery drain fix"]
excerpt: My phone was dying by 2 PM. Every. Single. Day. I'd wake up at 7 AM with 100% battery, and by lunchtime I was desperately searching for outlets like some kind of digital nomad in withdrawal.
cover_image: /images/articles/phone-battery-drain-analysis.webp
content: [From phone-battery-optimization-guide.md]
```

---

## Article 4: AI Tools Guide

```
slug: ai-tools-save-time-guide
title: AI Tools That Actually Save Time: I Used 30 for a Week and These 5 Survived
category: AI Tech
read_time_minutes: 13
author: TechTrendi Team
is_published: true
is_premium: false
views: 0
tags: ["best AI tools", "AI productivity", "ChatGPT alternatives", "AI for work", "time-saving tools"]
excerpt: I wasted 2 hours on Tuesday. Not on social media or YouTube. On an AI tool that promised to "revolutionize my workflow." It didn't. It crashed three times, lost my work twice, and by the time I gave up, I could have done the task manually in 30 minutes.
cover_image: /images/articles/ai-tools-comparison-chart.webp
content: [From ai-tools-save-time-guide.md]
```

---

## Article 5: Data Backup Guide

```
slug: backup-data-complete-guide
title: The Backup Strategy That Saved Me From Ransomware (And How to Set Up Your Own)
category: How-To
read_time_minutes: 11
author: TechTrendi Team
is_published: true
is_premium: false
views: 0
tags: ["data backup", "backup strategy", "ransomware protection", "3-2-1 backup", "cloud backup"]
excerpt: The email looked real. Like, really real. It had my company's logo, the CFO's name, and a subject line about "Urgent: Q4 Expenses Review." I clicked the attachment. That single click cost me 6 hours of panic, nearly lost 4 years of work, and taught me why everyone tells you to back up your data.
cover_image: /images/articles/ransomware-attack-timeline.webp
content: [From backup-data-complete-guide.md]
```

---

## Article 6: Password Security

```
slug: password-security-complete-guide
title: Your Passwords Are Probably Terrible: I Hired a Hacker to Prove It
category: Security
read_time_minutes: 11
author: TechTrendi Team
is_published: true
is_premium: false
views: 0
tags: ["password security", "password manager", "strong passwords", "2FA", "cybersecurity"]
excerpt: I hired a pentester to crack my passwords. Seven of twelve fell in under an hour. My banking password? Four minutes. My email that I've used for 8 years? Forty-seven seconds.
cover_image: /images/articles/password-strength-test-results.webp
content: [From password-security-complete-guide.md]
```

---

## Article 7: VPN Testing

```
slug: best-vpn-services-tested
title: Best VPN Services in 2025: I Tested 23 VPNs for 6 Months (Here's What Actually Works)
category: Security
read_time_minutes: 11
author: TechTrendi Team
is_published: true
is_premium: false
views: 0
tags: ["best VPN", "VPN comparison", "VPN speed test", "streaming VPN", "secure VPN"]
excerpt: My ISP was throttling my connection. Netflix kept showing different libraries depending on my location. And after the 2023 data breach that exposed my browsing history, I decided to take VPN selection seriously.
cover_image: /images/articles/vpn-speed-test-results-chart.webp
content: [From best-vpn-services-tested.md]
```

---

## Article 8: Budget Phones

```
slug: best-budget-phones-under-300
title: Best Budget Phones Under $300 in 2025: I Bought and Tested 17 Phones So You Don't Have To
category: Phones
read_time_minutes: 11
author: TechTrendi Team
is_published: true
is_premium: false
views: 0
tags: ["budget phones", "cheap smartphones", "phone camera test", "best value phones"]
excerpt: My nephew needed a phone for his 14th birthday. "Nothing too expensive," my sister said. "But it needs a good camera for TikTok and shouldn't die by lunchtime." That seemingly simple request sent me down a rabbit hole.
cover_image: /images/articles/budget-phones-comparison-2025.webp
content: [From best-budget-phones-under-300.md]
```

---

## Article 9: Storage Space Cleanup

```
slug: free-up-storage-space-guide
title: I Freed 487GB of Storage Without Deleting a Single Photo: Here's How
category: How-To
read_time_minutes: 12
author: TechTrendi Team
is_published: true
is_premium: false
views: 0
tags: ["free up storage", "delete temporary files", "storage cleanup", "disk space", "computer storage"]
excerpt: My laptop showed the dreaded "Your disk is almost full" warning. I had 2.1GB left out of 512GB. My phone had 800MB remaining. My external drive was at 98% capacity. I panicked.
cover_image: /images/articles/storage-before-after-comparison.webp
content: [From free-up-storage-space-guide.md]
```

---

## Article 10: AI Side Hustles

```
slug: ai-side-hustles-make-money
title: I Made $47,000 in 9 Months Using AI Side Hustles: Here's What Actually Works
category: AI Tech
read_time_minutes: 16
author: TechTrendi Team
is_published: true
is_premium: false
views: 0
tags: ["AI side hustles", "make money with AI", "ChatGPT income", "AI freelancing", "passive income"]
excerpt: I was skeptical when my friend claimed he'd made $12,000 in 3 months using ChatGPT. "Impossible," I thought. "Just another get-rich-quick scam." Then he showed me his Upwork earnings dashboard. Real clients. Real payments. Real work completed using AI tools.
cover_image: /images/articles/ai-side-hustle-income-breakdown.webp
content: [From ai-side-hustles-make-money.md]
```

---

## Important Tips

### Content Field
- **Remove** the "## SEO Metadata" section
- **Remove** the "## Schema Markup" section
- **Remove** the "## Image Suggestions" section
- **Keep** everything else including FAQ section
- **Keep** all markdown formatting (##, **, -, etc.)

### Tags Field
- This is a JSON array
- Format: `["tag1", "tag2", "tag3"]`
- Copy exactly as shown above

### Cover Image
- Path format: `/images/articles/filename.webp`
- Matches the first image in each article's specifications
- Images don't need to exist yet - you'll create them later

---

## After Publishing All Articles

### 1. Verify Articles Are Live

Visit these URLs (replace localhost with your domain if deployed):

```
http://localhost:5173/blog/slow-computer-fix-guide
http://localhost:5173/blog/improve-home-wifi-guide
http://localhost:5173/blog/phone-battery-optimization-guide
http://localhost:5173/blog/ai-tools-save-time-guide
http://localhost:5173/blog/backup-data-complete-guide
http://localhost:5173/blog/password-security-complete-guide
http://localhost:5173/blog/best-vpn-services-tested
http://localhost:5173/blog/best-budget-phones-under-300
http://localhost:5173/blog/free-up-storage-space-guide
http://localhost:5173/blog/ai-side-hustles-make-money
```

### 2. Create Images

See `IMAGE_CREATION_GUIDE.md` for detailed image requirements and creation instructions.

### 3. Check the Blog Homepage

Visit `http://localhost:5173/blog` - all 10 articles should appear

---

## Troubleshooting

**Articles not showing:**
- Ensure `is_published` is `true`
- Check slug doesn't have typos
- Verify category is one of: How-To, Phones, Security, AI Tech, Productivity

**Content not formatting:**
- Markdown is rendered by BlogArticle.tsx
- Ensure you copied the raw markdown (not HTML)

**Images not loading:**
- They won't load until you create them
- Create placeholder images or wait for image creation phase

---

## Time Estimate

- Per article: 5-10 minutes
- Total for 10 articles: 50-100 minutes

**Pro tip:** Keep the Supabase Studio and the markdown files open side-by-side for easy copy-paste.
