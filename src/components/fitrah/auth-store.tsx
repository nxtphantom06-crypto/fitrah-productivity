import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const AuthContext = createContext<{ user: User | null; ready: boolean; signOut: () => Promise<void> } | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => { if (active) { setUser(data.user); setReady(true); } });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!['SIGNED_IN','SIGNED_OUT','USER_UPDATED','PASSWORD_RECOVERY'].includes(event)) return;
      setUser(session?.user ?? null); setReady(true);
      if (event === 'SIGNED_OUT') { void queryClient.cancelQueries(); queryClient.clear(); }
      queueMicrotask(() => { void router.invalidate(); if (event !== 'SIGNED_OUT') void queryClient.invalidateQueries(); });
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [queryClient,router]);
  const signOut = async () => {
    await queryClient.cancelQueries(); queryClient.clear();
    const { error } = await supabase.auth.signOut(); if (error) throw error;
    setUser(null);
    await router.navigate({ to: '/login', replace: true });
  };
  return <AuthContext.Provider value={{ user, ready, signOut }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('AuthProvider is required'); return value; }