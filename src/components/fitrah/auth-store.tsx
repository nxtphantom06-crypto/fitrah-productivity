import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { currentUser } from '@/lib/current-user';
import { isNativeBuild } from '@/lib/native/client';

/** Removes everything the phone app keeps for an account: its on-device copy and scheduled reminders. */
async function clearDeviceData() {
  if (!isNativeBuild) return;
  const [{ clearLocal }, { clearLocalReminders }] = await Promise.all([import('@/lib/native/offline'), import('@/lib/native/reminders')]);
  await Promise.all([clearLocal(), clearLocalReminders()]);
}

const AuthContext = createContext<{ user: User | null; ready: boolean; signOut: () => Promise<void> } | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => {
    let active = true;
    void currentUser().catch(() => null).then(found => { if (active) { setUser(found); setReady(true); } });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!['SIGNED_IN','SIGNED_OUT','USER_UPDATED','PASSWORD_RECOVERY'].includes(event)) return;
      setUser(session?.user ?? null); setReady(true);
      if (event === 'SIGNED_OUT') { void queryClient.cancelQueries(); queryClient.clear(); void clearDeviceData(); }
      queueMicrotask(() => { void router.invalidate(); if (event !== 'SIGNED_OUT') void queryClient.invalidateQueries(); });
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [queryClient,router]);
  const signOut = async () => {
    if (isNativeBuild && navigator.onLine === false) throw new Error('You’re offline. Connect to the internet to log out, so changes saved on this phone aren’t lost.');
    await queryClient.cancelQueries(); queryClient.clear();
    const { error } = await supabase.auth.signOut(); if (error) throw error;
    await clearDeviceData();
    setUser(null);
    await router.navigate({ to: '/login', replace: true });
  };
  return <AuthContext.Provider value={{ user, ready, signOut }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('AuthProvider is required'); return value; }
