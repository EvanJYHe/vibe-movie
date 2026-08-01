const STORAGE_KEY = "vibemovie.geminiApiKey";

function normalizeKey(value: string) {
  return value.trim();
}

export const geminiKeyStorage = {
  load(): string {
    try {
      return normalizeKey(sessionStorage.getItem(STORAGE_KEY) ?? "");
    } catch {
      return "";
    }
  },

  save(value: string): string {
    const key = normalizeKey(value);
    if (!key) return "";

    try {
      sessionStorage.setItem(STORAGE_KEY, key);
    } catch {
      // The in-memory value still works when session storage is unavailable.
    }

    return key;
  },

  clear() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // There is nothing else to clear when storage access is unavailable.
    }
  },
};
