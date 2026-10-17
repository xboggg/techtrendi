<?php
/**
 * Fallback for /blog/<slug> and /news/<slug> when no prerendered .html exists.
 *
 * Every article gets a static page from the build, but the build only runs
 * once a day (and GitHub delays scheduled runs by hours). Articles published
 * in the morning -- The Rundown at 03:00 UTC, the daily article, Africa Tech --
 * had no page file until the afternoon build. nginx returned a hard 404 for
 * that whole window, so a link shared to WhatsApp, or a Google crawl, hit a
 * dead page for up to 17 hours.
 *
 * So when the file is missing, ask the database instead:
 *   - published article -> serve the SPA shell with 200; the app renders it
 *   - anything else     -> serve the shell with 404; the app shows its
 *                          not-found screen and crawlers get a real 404
 *
 * Reads with the anon key, so row-level security hides drafts exactly as it
 * does for og-meta.php. If the database cannot be reached the page is served
 * as 200: a real article 404ing during an outage is worse than a dead URL
 * briefly returning 200.
 */

$SUPABASE_URL = 'http://localhost:8000';
$SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNjQxNzY5MjAwLCJleHAiOjE3OTk1MzU2MDB9.lbPqMemEL_VFnCma2zeuJ1MfFLNQ7_VXRgaacXeeReQ';
$SHELL = __DIR__ . '/index.html';

$path = isset($_GET['path']) ? trim($_GET['path'], '/') : '';
$status = 404;
$reason = 'bad-path';

if (preg_match('#^(blog|news)/([a-z0-9][a-z0-9-]{0,199})$#', $path, $m)) {
    $table = $m[1] === 'blog' ? 'articles' : 'news';
    $url = $SUPABASE_URL . '/rest/v1/' . $table
         . '?slug=eq.' . rawurlencode($m[2]) . '&select=slug&limit=1';

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
            'Accept-Profile: techtrendi',
        ],
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code === 200) {
        $rows = json_decode($body, true);
        if (is_array($rows) && count($rows) > 0) {
            $status = 200;
            $reason = 'published-awaiting-build';
        } else {
            $reason = 'not-found';
        }
    } else {
        // Database unreachable: fail open rather than 404 a real article.
        $status = 200;
        $reason = 'db-unavailable';
    }
}

http_response_code($status);
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');
header('X-Article-Fallback: ' . $reason);
readfile($SHELL);
