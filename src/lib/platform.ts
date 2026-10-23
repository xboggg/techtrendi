/** True on Apple platforms (Mac, iPhone, iPad), where the search shortcut is ⌘K; elsewhere it
 *  is Ctrl K. Reads navigator.userAgentData.platform, else navigator.platform. Pure, so it can
 *  be tested without a browser; pass `undefined` on the server. */
export function isApplePlatform(nav: { platform?: string; userAgentData?: { platform?: string } } | undefined): boolean {
  if (!nav) return false;
  const p = nav.userAgentData?.platform || nav.platform || "";
  return /mac|iphone|ipad|ipod/i.test(p);
}
