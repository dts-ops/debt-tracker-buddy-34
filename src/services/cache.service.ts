const PREFIX = "cn.cache.";

function key(name: string) {
  return PREFIX + name;
}

export const cacheService = {
  get<T>(name: string): T | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(key(name));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { at: number; data: T };
      return parsed.data;
    } catch {
      return null;
    }
  },
  getMeta(name: string): number | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(key(name));
      if (!raw) return null;
      return (JSON.parse(raw) as { at: number }).at ?? null;
    } catch {
      return null;
    }
  },
  set<T>(name: string, data: T) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key(name), JSON.stringify({ at: Date.now(), data }));
    } catch {
      /* quota */
    }
  },
  remove(name: string) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key(name));
  },
  clearAll() {
    if (typeof window === "undefined") return;
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => window.localStorage.removeItem(k));
  },
};

export const CACHE_KEYS = {
  people: "people",
  transactions: "transactions",
  profile: "profile",
  summary: "summary",
} as const;
