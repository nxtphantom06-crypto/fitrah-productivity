// Packaged app only: keeps an on-device copy of the account's data, queues changes made offline
// and sends them to the backend, in order, whenever a connection is available.
import type { QueryClient } from '@tanstack/react-query';
import { readFeatures, writePrayer, writeTodo, removeTodo, reorderTodos, writeTask, removeTask } from '../features.functions';
import { savePreferences } from '../notifications.functions';
import { supabase } from '@/integrations/supabase/client';
import { dateInTimezone } from '../feature-model';
import { withPending, type FeatureData, type SyncOp } from '../sync-model';
import { loadLocal, saveLocal, looksOffline, withTimeout } from './offline';

export type SyncStatus = { online: boolean; syncing: boolean; pending: number; rejected: number };
let status: SyncStatus = { online: typeof navigator === 'undefined' ? true : navigator.onLine, syncing: false, pending: 0, rejected: 0 };
const listeners = new Set<() => void>();
function setStatus(patch: Partial<SyncStatus>) { status = { ...status, ...patch }; listeners.forEach(l => l()); }
export const syncStatus = { get: () => status, subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; } };
export function dismissRejected() { setStatus({ rejected: 0 }); }

let client: QueryClient | null = null;
export function configureSync(queryClient: QueryClient) { client = queryClient; }
export const featureKey = (userId: string) => ['features', userId] as const;

const FEATURES = 'features', OUTBOX = 'outbox';
async function outbox(userId: string) { return (await loadLocal<SyncOp[]>(OUTBOX, userId)) ?? []; }
let outboxLock: Promise<unknown> = Promise.resolve();
/** Serialises outbox edits so a change made during sending is never lost. */
function editOutbox(userId: string, edit: (ops: SyncOp[]) => SyncOp[]) {
 const next = outboxLock.then(async () => { const ops = edit(await outbox(userId)); await saveLocal(OUTBOX, userId, ops); setStatus({ pending: ops.length }); return ops; });
 outboxLock = next.catch(() => undefined);
 return next;
}

function nowParts(data: FeatureData) { const now = new Date(); return { today: dateInTimezone(now, data.timezone), now: now.toISOString() }; }

async function send(op: SyncOp, userId: string) {
 switch (op.kind) {
  case 'prayer': return writePrayer({ data: { date: op.date, name: op.name, patch: op.patch } });
  case 'todo': return writeTodo({ data: op.todo });
  case 'deleteTodo': return removeTodo({ data: { id: op.todoId } });
  case 'reorder': return reorderTodos({ data: { ids: op.ids } });
  case 'task': return writeTask({ data: op.task });
  case 'deleteTask': return removeTask({ data: { id: op.taskId } });
  case 'preferences': return savePreferences({ data: op.preferences });
  case 'profile': {
   const { error } = await supabase.from('profiles').update({ full_name: op.name, timezone: op.timezone, prayer_language: op.language, setup_complete: true }).eq('id', userId);
   if (error) throw error;
   return true;
  }
 }
}

/** Reads the phone's copy first; only the very first load on a phone needs the internet. */
export async function loadFeaturesLocalFirst(userId: string): Promise<FeatureData> {
 const cached = await loadLocal<FeatureData>(FEATURES, userId);
 if (cached) {
  setStatus({ pending: (await outbox(userId)).length });
  queueMicrotask(() => { void syncNow(userId); });
  return cached;
 }
 const fresh = await withTimeout(readFeatures() as Promise<FeatureData>, 15000);
 await saveLocal(FEATURES, userId, fresh);
 return fresh;
}

/** Saves a change on the phone immediately, then tries to send it. */
export async function recordChange(userId: string, op: SyncOp) {
 const key = featureKey(userId);
 const current = client?.getQueryData<FeatureData>(key) ?? (await loadLocal<FeatureData>(FEATURES, userId));
 if (!current) return false;
 const { today, now } = nowParts(current);
 const next = withPending(current, [op], today, now);
 client?.setQueryData(key, next);
 await saveLocal(FEATURES, userId, next);
 await editOutbox(userId, ops => [...ops, op]);
 void syncNow(userId);
 return true;
}

const running = new Map<string, Promise<void>>();
export function syncNow(userId: string): Promise<void> {
 const active = running.get(userId);
 if (active) return active;
 const job = runSync(userId).finally(() => { running.delete(userId); setStatus({ syncing: false }); });
 running.set(userId, job);
 return job;
}

async function runSync(userId: string) {
 if (typeof navigator !== 'undefined' && navigator.onLine === false) { setStatus({ online: false }); return; }
 setStatus({ syncing: true });
 let rejected = 0;
 for (;;) {
  const [op] = await outbox(userId);
  if (!op) break;
  try {
   await withTimeout(Promise.resolve(send(op, userId)), 15000);
  } catch (error) {
   if (looksOffline(error)) { setStatus({ online: false }); return; }
   rejected++; // The backend refused this change (for example, it is no longer valid); drop it and reload.
  }
  await editOutbox(userId, ops => ops.filter(o => o.id !== op.id));
 }
 try {
  const fresh = await withTimeout(readFeatures() as Promise<FeatureData>, 15000);
  const pending = await outbox(userId);
  const { today, now } = nowParts(fresh);
  const merged = withPending(fresh, pending, today, now);
  await saveLocal(FEATURES, userId, merged);
  client?.setQueryData(featureKey(userId), merged);
  setStatus({ online: true, pending: pending.length, rejected: status.rejected + rejected });
  if (pending.length) queueMicrotask(() => { void syncNow(userId); });
 } catch (error) {
  setStatus({ online: !looksOffline(error), rejected: status.rejected + rejected });
 }
}

/** Keeps the online flag current and syncs as soon as the phone reconnects. */
export function watchConnection(userId: string) {
 const online = () => { setStatus({ online: true }); void syncNow(userId); };
 const offline = () => setStatus({ online: false });
 window.addEventListener('online', online);
 window.addEventListener('offline', offline);
 const timer = setInterval(() => { if (status.pending && navigator.onLine) void syncNow(userId); }, 60000);
 return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); clearInterval(timer); };
}
