import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './auth-store';
import { StarMark } from './foundation';
import { safeReturnPath } from '@/lib/auth-flow';
import { isNativeBuild } from '@/lib/native/client';
import { loadLocal } from '@/lib/native/offline';

/** Whether setup is done: asks the backend, or (phone app, offline) the copy saved on the phone. */
async function setupComplete(userId: string): Promise<boolean | null> {
  const { data, error } = await supabase.from('profiles').select('setup_complete').eq('id', userId).single();
  if (!error) return data.setup_complete;
  if (isNativeBuild) { const cached = await loadLocal<{ setup_complete?: boolean }>('profile', userId); if (cached) return !!cached.setup_complete; }
  return null;
}

export function AuthEntry() {
  const { user, ready } = useAuth(); const navigate = useNavigate();
  useEffect(() => {
    if (!ready) return;
    if (window.location.hash.includes('type=recovery')) { void navigate({ to: '/reset-password', hash: window.location.hash.slice(1) }); return; }
    if (!user) { void navigate({ to: '/onboarding', replace: true }); return; }
    let active = true;
    const destination = safeReturnPath(sessionStorage.getItem('fitrah-return'));
    void setupComplete(user.id).catch(() => null).then(done => {
      if (!active) return;
      if (done === null) { void navigate({ to: '/setup', replace: true }); return; }
      sessionStorage.removeItem('fitrah-return');
      void navigate({ to: done ? destination : '/setup', replace: true });
    });
    return () => { active = false; };
  }, [user,ready,navigate]);
  return <main className="splash-screen"><StarMark className="text-primary"/><h1>fitrah<span className="text-gold">.</span></h1><p>Align your day with purpose.</p><Loader2 className="mt-10 animate-spin text-primary" aria-label="Loading"/></main>;
}