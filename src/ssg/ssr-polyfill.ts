/**
 * SSG server-build polyfill (no-op in the browser).
 *
 * Many components read localStorage/sessionStorage during render (e.g. a
 * useState initializer). On the Node SSG build those globals don't exist and
 * throw "localStorage is not defined". This provides a harmless in-memory
 * implementation so such reads return null/empty during pre-render. The browser
 * always has the real ones, so client behavior is unchanged.
 *
 * NOTE: we intentionally do NOT polyfill window/document — components use
 * `typeof window !== 'undefined'` to detect the browser, and defining them on
 * the server would break those guards.
 */
if (typeof window === "undefined") {
  const memStorage = (): Storage => {
    const store = new Map<string, string>();
    return {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => {
        store.set(k, String(v));
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      clear: () => {
        store.clear();
      },
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      get length() {
        return store.size;
      },
    } as Storage;
  };
  const g = globalThis as Record<string, unknown>;
  if (typeof g.localStorage === "undefined") g.localStorage = memStorage();
  if (typeof g.sessionStorage === "undefined") g.sessionStorage = memStorage();
}
