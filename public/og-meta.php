<?php
/**
 * TechTrendi OG Meta Tag Renderer for Social Media Crawlers
 *
 * When WhatsApp, Facebook, Twitter etc. crawl a URL, they don't execute JS.
 * This script intercepts crawler requests, fetches article data from Supabase,
 * and returns minimal HTML with correct OG meta tags.
 * Regular users never see this — they get the normal React SPA.
 */

// Supabase config
$SUPABASE_URL = 'https://db.techtrendi.com';
$SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNjQxNzY5MjAwLCJleHAiOjE3OTk1MzU2MDB9.lbPqMemEL_VFnCma2zeuJ1MfFLNQ7_VXRgaacXeeReQ';
$SITE_URL = 'https://techtrendi.com';
$DEFAULT_IMAGE = 'https://techtrendi.com/og-default.jpg';
$SITE_NAME = 'TechTrendi';

// Get the request path
$path = isset($_GET['path']) ? trim($_GET['path'], '/') : '';
$parts = explode('/', $path);

// Handle single-segment pages (no slug needed)
$section = $parts[0];

// Static pages with custom OG tags
$static_pages = [
    'cyber-awareness' => [
        'title' => 'Cyber Awareness Tips — Protect Yourself Online',
        'description' => 'Quick, practical cybersecurity tips to keep you safe online. Learn about passwords, phishing, privacy, and more.',
        'image' => $DEFAULT_IMAGE,
    ],
    'creepy-tech' => [
        'title' => 'Creepy Tech — The Dark Side of Technology',
        'description' => 'Disturbing tech facts, surveillance stories, and privacy nightmares you need to know about. Technology isn\'t always your friend.',
        'image' => $DEFAULT_IMAGE,
    ],
];

if (isset($static_pages[$section])) {
    $page = $static_pages[$section];
    $og_url = $SITE_URL . '/' . $section;
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
        $fields = 'title,slug,excerpt,cover_image,category,author,tags,created_at,meta_title,meta_description';
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
    default:
        serve_default();
        exit;
}

// Fetch from Supabase REST API
$url = $SUPABASE_URL . '/rest/v1/' . $table . '?slug=eq.' . urlencode($slug) . '&select=' . urlencode($fields) . '&limit=1';

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 5,
    CURLOPT_HTTPHEADER => [
        'apikey: ' . $SUPABASE_ANON_KEY,
        'Authorization: Bearer ' . $SUPABASE_ANON_KEY,
        'Accept: application/json'
    ]
]);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code !== 200 || !$response) {
    serve_default();
    exit;
}

$data = json_decode($response, true);
if (empty($data) || !isset($data[0])) {
    serve_default();
    exit;
}

$item = $data[0];

// Build OG data
$og_title = htmlspecialchars($item['meta_title'] ?? $item[$title_field] ?? $SITE_NAME, ENT_QUOTES, 'UTF-8');
$og_description = htmlspecialchars($item['meta_description'] ?? $item[$desc_field] ?? '', ENT_QUOTES, 'UTF-8');
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

<!-- Redirect real users to the actual page -->
<meta http-equiv="refresh" content="0;url=' . htmlspecialchars($url, ENT_QUOTES, 'UTF-8') . '">
<link rel="canonical" href="' . htmlspecialchars($url, ENT_QUOTES, 'UTF-8') . '">
</head>
<body>
<h1>' . $title . '</h1>
<p>' . $description . '</p>
<p><a href="' . htmlspecialchars($url, ENT_QUOTES, 'UTF-8') . '">Read more on ' . $SITE_NAME . '</a></p>
</body>
</html>';
}

function serve_default() {
    global $SITE_URL, $DEFAULT_IMAGE, $SITE_NAME;

    $title = 'TechTrendi | Tech News, Expert Guides &amp; Free Tools';
    $desc = 'Get the latest in tech — breaking news, expert guides, honest reviews, and free tools to level up your digital life.';
    $url = $SITE_URL . '/' . ($_GET['path'] ?? '');

    serve_og($title, $desc, $DEFAULT_IMAGE, 'image/jpeg', $url, '', '', '', 'website');
}
