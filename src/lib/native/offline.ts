// Offline helpers for the packaged app: an on-device (IndexedDB) copy per account, plus connection checks.
import { createStore, get, set, del, clear } from 'idb-keyval';

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
 return /failed to fetch|networkerror|network request failed|load failed|AuthRetryableFetchError|ERR_INTERNET_DISCONNECTED|timed out|aborted/i.test(text);
}

let store: ReturnType<typeof createStore> | null = null;
function db() {
 store ??= createStore('fitrah-local', 'kv');
 return store;
}

export async function loadLocal<T>(kind: string, userId: string): Promise<T | null> {
 try { return ((await get(`${kind}:${userId}`, db())) as T | undefined) ?? null; } catch { return null; }
}

export async function saveLocal(kind: string, userId: string, value: unknown): Promise<void> {
 try { await set(`${kind}:${userId}`, value, db()); } catch { /* storage full or unavailable */ }
}

export async function removeLocal(kind: string, userId: string): Promise<void> {
 try { await del(`${kind}:${userId}`, db()); } catch { /* unavailable */ }
}

/** Removes every on-device copy (used on sign-out so the next account never sees it). */
export async function clearLocal(): Promise<void> {
 try { await clear(db()); } catch { /* unavailable */ }
}

/** Rejects when a request takes too long, so a weak signal falls back to the phone's copy. */
export function withTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
 return new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('Request timed out')), ms);
  promise.then(v => { clearTimeout(timer); resolve(v); }, e => { clearTimeout(timer); reject(e); });
 });
}
