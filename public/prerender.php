<?php
// Prerender proxy - serves pre-rendered HTML to search engine bots
$path = isset($_GET['path']) ? $_GET['path'] : '/';
$url = 'https://techtrendi.com' . $path;

// Fetch from prerender service on VPS via HTTPS
$prerender_url = 'https://db.techtrendi.com/prerender/' . $url;

$ch = curl_init($prerender_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 20);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

$html = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($code === 200 && $html && strlen($html) > 500) {
    header('Content-Type: text/html; charset=utf-8');
    echo $html;
} else {
    // Fallback to normal SPA
    include('index.html');
}
