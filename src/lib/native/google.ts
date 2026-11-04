// Packaged app only: Google sign-in runs in the phone's browser on the hosted site, then returns here by deep link.
import { Browser } from '@capacitor/browser';
import { supabase } from '@/integrations/supabase/client';
import { nativeServerOrigin } from './client';
import { NATIVE_AUTH_ERROR_EVENT, NATIVE_AUTH_PATH, parseNativeAuthCallback } from './auth-callback';

const STATE_KEY = 'fitrah-native-auth-state';

export async function startNativeGoogleSignIn() {
 const state = [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
 localStorage.setItem(STATE_KEY, state);
 await Browser.open({ url: `${nativeServerOrigin}${NATIVE_AUTH_PATH}?state=${state}`, presentationStyle: 'fullscreen' });
}

function reportError(message: string) { window.dispatchEvent(new CustomEvent(NATIVE_AUTH_ERROR_EVENT, { detail: message })); }

/** Handles com.fitrah.app://auth-callback links. Returns true when the user is now signed in. */
export async function handleNativeAuthUrl(url: string): Promise<boolean> {
 const result = parseNativeAuthCallback(url, localStorage.getItem(STATE_KEY));
 if (result.kind === 'ignore') return false;
 localStorage.removeItem(STATE_KEY);
 try { await Browser.close(); } catch { /* already closed */ }
 if (result.kind === 'error') { reportError(result.message); return false; }
 const { error } = await supabase.auth.setSession({ access_token: result.access_token, refresh_token: result.refresh_token });
 if (error) { reportError('Google sign-in could not be completed. Please try again.'); return false; }
 return true;
}
