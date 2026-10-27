import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './auth-store';
import { StarMark } from './foundation';
import { safeReturnPath } from '@/lib/auth-flow';

export function AuthEntry() {
  const { user, ready } = useAuth(); const navigate = useNavigate();
  useEffect(() => {
    if (!ready) return;
    if (window.location.hash.includes('type=recovery')) { void navigate({ to: '/reset-password' }); return; }
    if (!user) { void navigate({ to: '/onboarding', replace: true }); return; }
    let active = true;
    const destination = safeReturnPath(sessionStorage.getItem('fitrah-return'));
    void supabase.from('profiles').select('setup_complete').eq('id',user.id).single().then(({ data, error }) => {
      if (!active) return;
      if (error) { void navigate({ to: '/setup', replace: true }); return; }
      sessionStorage.removeItem('fitrah-return');
      void navigate({ to: data.setup_complete ? destination : '/setup', replace: true });
    });
    return () => { active = false; };
  }, [user,ready,navigate]);
  return <main className="splash-screen"><StarMark className="text-primary"/><h1>fitrah<span className="text-gold">.</span></h1><p>Align your day with purpose.</p><Loader2 className="mt-10 animate-spin text-primary" aria-label="Loading"/></main>;
}