import { DEFAULT_NATIVE_SERVER_ORIGIN, toServerUrl } from './origins';

/** True only in the Capacitor build (`npm run build:native`); the published website is unaffected. */
export const isNativeBuild = import.meta.env.VITE_FITRAH_NATIVE === 'true';
export const nativeServerOrigin = (import.meta.env.VITE_FITRAH_SERVER_ORIGIN || DEFAULT_NATIVE_SERVER_ORIGIN).replace(/\/+$/, '');

/** Origin used in emailed links: the hosted site inside the packaged app, otherwise the current site. */
export function publicAppOrigin(): string {
 return isNativeBuild ? nativeServerOrigin : window.location.origin;
}

export const nativeServerFnFetch: typeof fetch = (input, init) => {
 const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
 return fetch(toServerUrl(url, nativeServerOrigin), init);
};
