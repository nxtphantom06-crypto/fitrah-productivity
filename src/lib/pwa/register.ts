import { shouldRegisterPwa } from './guards';
export async function initializePwa() {
 if (!('serviceWorker' in navigator)) return;
 if (!shouldRegisterPwa(import.meta.env.PROD, window.location.hostname, window.self !== window.top, window.location.search)) {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.filter(registration => [registration.active, registration.waiting, registration.installing].some(worker => worker && new URL(worker.scriptURL).pathname === '/sw.js')).map(registration => registration.unregister()));
  return;
 }
 const { registerSW } = await import('virtual:pwa-register');
 registerSW({ immediate: true });
}
