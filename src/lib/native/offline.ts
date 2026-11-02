// Offline helpers for the packaged app: a per-account saved copy of the last loaded data on this phone.
const PREFIX = 'fitrah-offline:';
export const OFFLINE_SAVE_MESSAGE = 'You’re offline. Connect to the internet to save this change.';
export const OFFLINE_ACTION_MESSAGE = 'You’re offline. Connect to the internet to continue.';

export function isOffline(): boolean {
 return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export function looksOffline(error: unknown): boolean {
 if (isOffline()) return true;
 const text = error instanceof Error
  ? `${error.name} ${error.message}`
  : error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : String(error);
 return /failed to fetch|networkerror|network request failed|load failed|AuthRetryableFetchError|ERR_INTERNET_DISCONNECTED/i.test(text);
}

export function saveOffline(kind: string, userId: string, value: unknown): void {
 try { localStorage.setItem(`${PREFIX}${kind}:${userId}`, JSON.stringify(value)); } catch { /* storage full or unavailable */ }
}

export function loadOffline<T>(kind: string, userId: string): T | null {
 try {
  const raw = localStorage.getItem(`${PREFIX}${kind}:${userId}`);
  return raw ? (JSON.parse(raw) as T) : null;
 } catch { return null; }
}

/** Removes every saved copy (used on sign-out so the next account never sees it). */
export function clearOffline(): void {
 try {
  for (let i = localStorage.length - 1; i >= 0; i--) {
   const key = localStorage.key(i);
   if (key?.startsWith(PREFIX)) localStorage.removeItem(key);
  }
 } catch { /* unavailable */ }
}
