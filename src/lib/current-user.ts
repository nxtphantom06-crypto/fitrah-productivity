import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { isNativeBuild } from './native/client';
import { looksOffline } from './native/offline';

/** Signed-in user. In the packaged app, falls back to the session saved on the phone when there is no connection. */
export async function currentUser(): Promise<User | null> {
 const { data, error } = await supabase.auth.getUser();
 if (data.user) return data.user;
 if (isNativeBuild && error && looksOffline(error)) {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
 }
 return null;
}
