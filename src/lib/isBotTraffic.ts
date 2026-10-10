/**
 * Detect bot/crawler traffic so analytics counts people, not machines.
 *
 * 60% of page_views rows (2,314 of 3,886 over 30 days) were bots, because the
 * tracker recorded every view including crawlers that execute JavaScript.
 *
 * The one that did the most damage was **Mediapartners-Google**, the AdSense
 * crawler. It contributed 257 of 445 "United States" pageviews, which made US
 * traffic look like double Ghana's and nearly prompted a change to the site's
 * Ghana-focused positioning. With bots excluded, Ghana is the largest real
 * audience (243 views / 186 sessions) and the US drops to 170/129.
 *
 * Note that 'mediapartners' contains no "bot", "crawler" or "spider", so a
 * naive filter misses it entirely — which is exactly what happened. Hence the
 * explicit names below alongside the generic patterns.
 */

const BOT_PATTERN = new RegExp(
  [
    // Generic markers
    "bot\\b", "crawl", "spider", "headless", "slurp", "scrape",
    // Google's crawlers — mediapartners and adsbot match none of the above
    "mediapartners", "adsbot", "googlebot", "google-inspectiontool",
    "google favicon", "feedfetcher", "apis-google",
    // Other search engines
    "bingbot", "yandex", "baiduspider", "duckduckbot", "applebot",
    // AI crawlers
    "gptbot", "chatgpt", "claude", "anthropic", "perplexity", "deepseek",
    "ccbot", "bytespider", "amazonbot", "cohere",
    // Social / preview fetchers
    "facebookexternalhit", "whatsapp", "telegrambot", "twitterbot",
    "linkedinbot", "slackbot", "discordbot", "embedly", "quora link",
    // Monitoring and tooling
    "prerender", "lighthouse", "pagespeed", "gtmetrix", "pingdom",
    "uptimerobot", "statuscake", "newrelic", "datadog",
    // Generic HTTP clients
    "curl/", "wget", "python-requests", "axios/", "node-fetch",
    "go-http-client", "java/", "okhttp", "postman",
  ].join("|"),
  "i",
);

/** True when the user agent looks like a bot rather than a person. */
export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true; // No UA at all is far more likely a script than a person.
  return BOT_PATTERN.test(userAgent);
}

/**
 * PostgREST regex for excluding historical bot rows from analytics queries:
 *
 *   query.not("user_agent", "imatch", BOT_UA_SQL_PATTERN)
 *
 * The tracker no longer writes bot rows, but 2,314 of them are already in the
 * table. Those rows are kept — they are real crawler data, and deleting
 * analytics history to make a chart look nicer would be the wrong trade — so
 * the dashboard filters them out at read time instead.
 *
 * Kept deliberately shorter than BOT_PATTERN: it only needs the signatures
 * that actually appear in the stored data, and a very long regex makes the
 * query URL unwieldy.
 */
export const BOT_UA_SQL_PATTERN =
  "(bot|crawl|spider|headless|slurp|scrape|mediapartners|adsbot|google-inspectiontool|" +
  "gptbot|chatgpt|claude|anthropic|perplexity|deepseek|ccbot|bytespider|amazonbot|" +
  "facebookexternalhit|whatsapp|telegram|twitterbot|linkedinbot|slackbot|discordbot|" +
  "prerender|lighthouse|pagespeed|pingdom|uptimerobot|curl/|wget|python-requests|" +
  "axios/|node-fetch|go-http-client|okhttp|postman)";

/** True when the current browser session looks like a bot. */
export function isBotTraffic(): boolean {
  if (typeof navigator === "undefined") return true; // SSG build, not a visitor.
  if (isBotUserAgent(navigator.userAgent)) return true;
  // navigator.webdriver is set by Selenium, Playwright, Puppeteer and friends.
  if ((navigator as Navigator & { webdriver?: boolean }).webdriver === true) return true;
  return false;
}
