// Packaged app only: status bar, splash screen, Android back button, deep links and notification taps.
import type { AnyRouter } from '@tanstack/react-router';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { LocalNotifications } from '@capacitor/local-notifications';
import { backButtonAction } from './back-button';
import { handleNativeAuthUrl } from './google';
import { safeReturnPath } from '../auth-flow';

export async function applyStatusBar(dark: boolean) {
 try {
  await StatusBar.setOverlaysWebView({ overlay: false });
  await StatusBar.setBackgroundColor({ color: dark ? '#0E1A24' : '#FAFAF7' });
  await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
 } catch { /* not running inside the app */ }
}

let started = false;
export async function initNativeShell(router: AnyRouter) {
 if (started) return;
 started = true;
 document.documentElement.classList.add('native-app');
 await applyStatusBar(document.documentElement.classList.contains('dark'));

 await App.addListener('backButton', ({ canGoBack }) => {
  const dialogOpen = !!document.querySelector('[role="dialog"],[role="alertdialog"]');
  const action = backButtonAction({ path: router.state.location.pathname, canGoBack, dialogOpen });
  if (action === 'close-dialog') document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  else if (action === 'exit') void App.minimizeApp();
  else if (action === 'back') router.history.back();
  else void router.navigate({ to: '/dashboard', replace: true });
 });

 await App.addListener('appUrlOpen', ({ url }) => {
  void handleNativeAuthUrl(url).then(signedIn => { if (signedIn) void router.navigate({ to: '/', replace: true }); });
 });

 await LocalNotifications.addListener('localNotificationActionPerformed', ({ notification }) => {
  const path = safeReturnPath(typeof notification.extra?.path === 'string' ? notification.extra.path : '/dashboard');
  void router.navigate({ to: path });
 });

 try { await SplashScreen.hide({ fadeOutDuration: 250 }); } catch { /* already hidden */ }
}
