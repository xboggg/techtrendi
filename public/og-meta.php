<?php
/**
 * TechTrendi OG Meta Tag Renderer for Search Engine & Social Media Crawlers
 *
 * Serves pre-rendered HTML with correct meta tags to:
 * - Googlebot, Bingbot, and other search engine crawlers
 * - WhatsApp, Facebook, Twitter, and other social media crawlers
 * Regular users get the normal React SPA via index.html.
 */

// Supabase config — use localhost to avoid Cloudflare caching issues
$SUPABASE_URL = 'http://localhost:8000';
$SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNjQxNzY5MjAwLCJleHAiOjE3OTk1MzU2MDB9.lbPqMemEL_VFnCma2zeuJ1MfFLNQ7_VXRgaacXeeReQ';
$SITE_URL = 'https://techtrendi.com';
$DEFAULT_IMAGE = 'https://techtrendi.com/og-image.jpg';
$SITE_NAME = 'TechTrendi';

// File-based cache to survive Supabase timeouts
$CACHE_DIR = __DIR__ . '/og-cache';
$CACHE_TTL = 86400; // 24 hours

if (!is_dir($CACHE_DIR)) {
    @mkdir($CACHE_DIR, 0755, true);
}

function cache_key($section, $slug) {
    return preg_replace('/[^a-z0-9_-]/', '', $section . '_' . $slug);
}

function get_cache($section, $slug) {
    global $CACHE_DIR, $CACHE_TTL;
    $file = $CACHE_DIR . '/' . cache_key($section, $slug) . '.json';
    if (file_exists($file) && (time() - filemtime($file)) < $CACHE_TTL) {
        $data = json_decode(file_get_contents($file), true);
        if ($data) return $data;
    }
    return null;
}

function set_cache($section, $slug, $data) {
    global $CACHE_DIR;
    $file = $CACHE_DIR . '/' . cache_key($section, $slug) . '.json';
    @file_put_contents($file, json_encode($data));
}

// Get the request path
$path = isset($_GET['path']) ? trim($_GET['path'], '/') : '';
$parts = explode('/', $path);

// Handle single-segment pages (no slug needed)
$section = $parts[0];

// Static pages with custom OG tags — unique title/description per page
$static_pages = [
    'books/think-before-you-click' => [
        'title' => 'Think Before You Click - Cyber Safety Ebook for Ghana',
        'description' => 'The complete guide to staying safe online in Ghana. Learn to protect your MoMo, passwords, and family from scams. 20 chapters, 25 real scams exposed.',
        'image' => 'https://techtrendi.com/images/books/think-before-you-click-og.jpg',
    ],
    'tools' => [
        'title' => '125+ Free Online Tools - No Signup Required',
        'description' => 'Free online tools for everyone: password generators, QR codes, resume builders, calculators, and more. No signup needed.',
        'image' => $DEFAULT_IMAGE,
    ],
    'store' => [
        'title' => 'DigiStore - Digital Products, Ebooks and Templates',
        'description' => 'Ebooks, templates, spreadsheets, and tools built by TechTrendi. Designed to help you work smarter.',
        'image' => $DEFAULT_IMAGE,
    ],
    'start-here' => [
        'title' => 'Start Here - Your Guide to TechTrendi',
        'description' => 'New to TechTrendi? Start here. 125+ free tools, expert articles, daily tech news, and honest reviews.',
        'image' => $DEFAULT_IMAGE,
    ],
    'security' => [
        'title' => 'Security Hub - Protect Yourself Online',
        'description' => 'Your cybersecurity command center. Threat alerts, scam warnings, security tools, and expert advice to keep you safe online.',
        'image' => $DEFAULT_IMAGE,
    ],
    'blog' => [
        'title' => 'TechTrendi Blog - Expert Tech Guides and Articles',
        'description' => 'In-depth technology articles covering smartphones, AI, cybersecurity, productivity, and more. Written for real people, not experts.',
        'image' => $DEFAULT_IMAGE,
    ],
    'news' => [
        'title' => 'Tech News - Latest Technology Headlines',
        'description' => 'Daily tech news from Ghana and around the world. Smartphones, AI, cybersecurity, gadgets, and more.',
        'image' => $DEFAULT_IMAGE,
    ],
    'reviews' => [
        'title' => 'Product Reviews - Honest Tech Reviews',
        'description' => 'Honest, no-nonsense product reviews. Phones, laptops, gadgets, software, and more.',
        'image' => $DEFAULT_IMAGE,
    ],
    'guides' => [
        'title' => 'Tech Guides and Tutorials - TechTrendi',
        'description' => 'Practical technology guides for everyday people. From setting up devices to staying safe online.',
        'image' => $DEFAULT_IMAGE,
    ],
    'about' => [
        'title' => 'About TechTrendi - Technology Made Simple',
        'description' => 'TechTrendi is a Ghana-based technology education platform helping everyday people stay safe, productive, and informed in the digital age.',
        'image' => $DEFAULT_IMAGE,
    ],
    'contact' => [
        'title' => 'Contact Us - TechTrendi',
        'description' => 'Have questions, feedback, or want to partner with us? Get in touch with the TechTrendi team.',
        'image' => $DEFAULT_IMAGE,
    ],
    'privacy' => [
        'title' => 'Privacy Policy - TechTrendi',
        'description' => 'How TechTrendi collects, uses, and protects your personal information.',
        'image' => $DEFAULT_IMAGE,
    ],
    'terms' => [
        'title' => 'Terms of Service - TechTrendi',
        'description' => 'Terms and conditions for using TechTrendi website and services.',
        'image' => $DEFAULT_IMAGE,
    ],
    'cookies' => [
        'title' => 'Cookie Policy - TechTrendi',
        'description' => 'How TechTrendi uses cookies and similar technologies.',
        'image' => $DEFAULT_IMAGE,
    ],
    'disclosure' => [
        'title' => 'Affiliate Disclosure - TechTrendi',
        'description' => 'How TechTrendi earns revenue and our commitment to honest, unbiased content.',
        'image' => $DEFAULT_IMAGE,
    ],
    'cyber-awareness' => [
        'title' => 'Cyber Awareness Tips - Protect Yourself Online',
        'description' => 'Quick, practical cybersecurity tips to keep you safe online. Learn about passwords, phishing, privacy, and more.',
        'image' => $DEFAULT_IMAGE,
    ],
    'creepy-tech' => [
        'title' => 'Creepy Tech - The Dark Side of Technology',
        'description' => 'Disturbing tech facts, surveillance stories, and privacy nightmares you need to know about.',
        'image' => $DEFAULT_IMAGE,
    ],
];

// Check full path first (e.g. books/think-before-you-click), then section for hub pages (only if no slug)
$static_key = isset($static_pages[$path]) ? $path : null;
if ($static_key === null && count($parts) < 2 && isset($static_pages[$section])) {
    $static_key = $section;
}
if ($static_key !== null) {
    $page = $static_pages[$static_key];
    $og_url = $SITE_URL . '/' . $static_key;
    serve_og(
        htmlspecialchars($page['title'], ENT_QUOTES, 'UTF-8'),
        htmlspecialchars($page['description'], ENT_QUOTES, 'UTF-8'),
        $page['image'], 'image/jpeg', $og_url, '', '', '', 'website'
    );
    exit;
}

if (count($parts) < 2) {
    serve_default();
    exit;
}

$slug = $parts[1];

// Determine table and fields based on section
$table = '';
$fields = '';
$title_field = 'title';
$desc_field = 'excerpt';
$image_field = 'cover_image';
$type = 'article';

switch ($section) {
    case 'news':
        $table = 'news';
        $fields = 'title,slug,excerpt,cover_image,category,author,tags,created_at';
        break;
    case 'blog':
    case 'guides':
        $table = 'articles';
        $fields = 'title,slug,excerpt,cover_image,category,author,tags,created_at,content_type';
        break;
    case 'reviews':
        $table = 'reviews';
        $fields = 'title,slug,verdict,image,category,rating,price';
        $desc_field = 'verdict';
        $image_field = 'image';
        break;
    case 'tools':
        // Tools are not in DB — generate title from slug
        $tool_title = ucwords(str_replace('-', ' ', $slug));
        $og_url = $SITE_URL . '/tools/' . $slug;
        serve_og(
            htmlspecialchars($tool_title . ' - Free Online Tool', ENT_QUOTES, 'UTF-8'),
            htmlspecialchars($tool_title . ' - Free online tool by TechTrendi. No signup required.', ENT_QUOTES, 'UTF-8'),
            $DEFAULT_IMAGE, 'image/jpeg', $og_url, '', '', '', 'website'
        );
        exit;
    default:
        // Category pages (e.g. /ai-tech, /phones, /security)
        $cat_title = ucwords(str_replace('-', ' ', $section));
        if (count($parts) >= 2) {
            $cat_title .= ': ' . ucwords(str_replace('-', ' ', $slug));
        }
        $og_url = $SITE_URL . '/' . $path;
        serve_og(
            htmlspecialchars($cat_title . ' - TechTrendi', ENT_QUOTES, 'UTF-8'),
            htmlspecialchars($cat_title . ' articles, news, and guides on TechTrendi.', ENT_QUOTES, 'UTF-8'),
            $DEFAULT_IMAGE, 'image/jpeg', $og_url, '', '', '', 'website'
        );
        exit;
}

// Check cache FIRST (instant, avoids slow Supabase roundtrip)
$item = get_cache($section, $slug);

// Only fetch from Supabase if cache miss
if (!$item) {
    $url = $SUPABASE_URL . '/rest/v1/' . $table . '?slug=eq.' . urlencode($slug) . '&select=' . urlencode($fields) . '&limit=1';

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 3,
        CURLOPT_CONNECTTIMEOUT => 2,
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $SUPABASE_ANON_KEY,
            'Authorization: Bearer ' . $SUPABASE_ANON_KEY,
            'Accept: application/json',
            'Accept-Profile: techtrendi'
        ]
    ]);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code === 200 && $response) {
        $data = json_decode($response, true);
        if (!empty($data) && isset($data[0])) {
            $item = $data[0];
            set_cache($section, $slug, $item);
        }
    }
}

if (!$item) {
    serve_default();
    exit;
}

// Build OG data
$og_title = htmlspecialchars($item[$title_field] ?? $SITE_NAME, ENT_QUOTES, 'UTF-8');
$og_description = htmlspecialchars($item[$desc_field] ?? '', ENT_QUOTES, 'UTF-8');
$og_image = $item[$image_field] ?? $DEFAULT_IMAGE;
$og_url = $SITE_URL . '/' . $section . '/' . $slug;
$author = htmlspecialchars($item['author'] ?? 'TechTrendi Team', ENT_QUOTES, 'UTF-8');
$category = htmlspecialchars($item['category'] ?? '', ENT_QUOTES, 'UTF-8');
$published_time = $item['created_at'] ?? '';

// For reviews, enhance description
if ($section === 'reviews' && isset($item['rating'])) {
    $rating = $item['rating'];
    $price = $item['price'] ?? '';
    $og_description = "Rating: {$rating}/5" . ($price ? " | Price: {$price}" : '') . ($og_description ? " — {$og_description}" : '');
}

// Ensure image is absolute URL
if ($og_image && strpos($og_image, 'http') !== 0) {
    $og_image = $SITE_URL . '/' . ltrim($og_image, '/');
}
if (!$og_image) {
    $og_image = $DEFAULT_IMAGE;
}

// Determine image type
$img_ext = strtolower(pathinfo(parse_url($og_image, PHP_URL_PATH) ?: '', PATHINFO_EXTENSION));
$img_type_map = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp', 'gif' => 'image/gif'];
$og_image_type = $img_type_map[$img_ext] ?? 'image/jpeg';

serve_og($og_title, $og_description, $og_image, $og_image_type, $og_url, $author, $category, $published_time, $type);

// ---- Functions ----

function serve_default() {
    global $SITE_URL, $DEFAULT_IMAGE, $SITE_NAME;

    $title = 'TechTrendi | Tech News, Expert Guides &amp; Free Tools';
    $desc = 'Get the latest in tech - breaking news, expert guides, honest reviews, and free tools to level up your digital life.';
    $url = $SITE_URL . '/' . ($_GET['path'] ?? '');

    serve_og($title, $desc, $DEFAULT_IMAGE, 'image/jpeg', $url, '', '', '', 'website');
}

function serve_og($title, $description, $image, $image_type, $url, $author, $category, $published, $type) {
    global $SITE_NAME, $SITE_URL;

    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: public, max-age=3600');

    echo '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>' . $title . ' | ' . $SITE_NAME . '</title>
<meta name="description" content="' . $description . '">

<!-- Allow indexing -->
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1">

<!-- Open Graph -->
<meta property="og:title" content="' . $title . '">
<meta property="og:description" content="' . $description . '">
<meta property="og:image" content="' . htmlspecialchars($image, ENT_QUOTES, 'UTF-8') . '">
<meta property="og:image:type" content="' . $image_type . '">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="' . $title . '">
<meta property="og:url" content="' . htmlspecialchars($url, ENT_QUOTES, 'UTF-8') . '">
<meta property="og:type" content="' . $type . '">
<meta property="og:site_name" content="' . $SITE_NAME . '">
<meta property="og:locale" content="en_US">';

    if ($published) {
        echo "\n" . '<meta property="article:published_time" content="' . htmlspecialchars($published, ENT_QUOTES, 'UTF-8') . '">';
    }
    if ($author) {
        echo "\n" . '<meta property="article:author" content="' . $author . '">';
    }
    if ($category) {
        echo "\n" . '<meta property="article:section" content="' . $category . '">';
    }

    echo '

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@techtrendi">
<meta name="twitter:title" content="' . $title . '">
<meta name="twitter:description" content="' . $description . '">
<meta name="twitter:image" content="' . htmlspecialchars($image, ENT_QUOTES, 'UTF-8') . '">
<meta name="twitter:image:alt" content="' . $title . '">

<link rel="canonical" href="' . htmlspecialchars($url, ENT_QUOTES, 'UTF-8') . '">
</head>
<body>
<h1>' . $title . '</h1>
<p>' . $description . '</p>
<p><a href="' . htmlspecialchars($url, ENT_QUOTES, 'UTF-8') . '">Visit this page on TechTrendi</a></p>
</body>
</html>';
    exit;
}
