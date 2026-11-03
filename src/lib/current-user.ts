import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { isNativeBuild } from './native/client';
import { looksOffline } from './native/offline';

/** The signed-in user saved on this phone, read straight from storage (works even when the access token has expired). */
export function storedSessionUser(): User | null {
 try {
  for (let i = 0; i < localStorage.length; i++) {
   const key = localStorage.key(i);
   if (!key || !/^sb-.+-auth-token$/.test(key)) continue;
   const parsed = JSON.parse(localStorage.getItem(key) ?? 'null') as { user?: User; currentSession?: { user?: User } } | null;
   const user = parsed?.user ?? parsed?.currentSession?.user;
   if (user?.id) return user;
  }
 } catch { /* unavailable */ }
 return null;
}

/** Signed-in user. In the packaged app, falls back to the session saved on the phone when there is no connection. */
export async function currentUser(): Promise<User | null> {
 if (isNativeBuild && typeof navigator !== 'undefined' && navigator.onLine === false) return storedSessionUser();
 try {
  const { data, error } = await supabase.auth.getUser();
  if (data.user) return data.user;
  if (isNativeBuild && error && looksOffline(error)) return storedSessionUser();
 } catch (error) {
  if (isNativeBuild && looksOffline(error)) return storedSessionUser();
  throw error;
 }
 return null;
}
