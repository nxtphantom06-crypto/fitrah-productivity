// Environment-free rules for handing a Google sign-in from the hosted site back into the Android app.
export const NATIVE_AUTH_SCHEME = 'com.fitrah.app';
export const NATIVE_AUTH_HOST = 'auth-callback';
/** Hosted page that runs Google sign-in in the phone's browser and returns to the app. */
export const NATIVE_AUTH_PATH = '/native-auth';
export const NATIVE_AUTH_ERROR_EVENT = 'fitrah-native-auth-error';

const STATE_PATTERN = /^[a-f0-9]{32}$/;
export function isValidNativeState(state: string | null | undefined): state is string {
 return !!state && STATE_PATTERN.test(state);
}

export function buildNativeAuthCallback(params: { state: string; access_token?: string; refresh_token?: string; error?: string }): string {
 const values = new URLSearchParams();
 for (const [key, value] of Object.entries(params)) if (value) values.set(key, value);
 return `${NATIVE_AUTH_SCHEME}://${NATIVE_AUTH_HOST}#${values.toString()}`;
}

export type NativeAuthCallback =
 | { kind: 'ignore' }
 | { kind: 'error'; message: string }
 | { kind: 'tokens'; access_token: string; refresh_token: string };

/** Accepts only our own callback link, and only when it carries the state this app instance created. */
export function parseNativeAuthCallback(url: string, expectedState: string | null): NativeAuthCallback {
 let parsed: URL;
 try { parsed = new URL(url); } catch { return { kind: 'ignore' }; }
 if (parsed.protocol !== `${NATIVE_AUTH_SCHEME}:` || parsed.host !== NATIVE_AUTH_HOST) return { kind: 'ignore' };
 const params = new URLSearchParams(parsed.hash.replace(/^#/, ''));
 if (!isValidNativeState(expectedState) || params.get('state') !== expectedState) {
  return { kind: 'error', message: 'This sign-in link has expired. Please try Google sign-in again.' };
 }
 const error = params.get('error');
 if (error) return { kind: 'error', message: error };
 const access_token = params.get('access_token');
 const refresh_token = params.get('refresh_token');
 if (!access_token || !refresh_token) return { kind: 'error', message: 'Google sign-in did not finish. Please try again.' };
 return { kind: 'tokens', access_token, refresh_token };
}
