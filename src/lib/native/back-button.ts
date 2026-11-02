// What the Android back button does in the packaged app.
export type BackAction = 'close-dialog' | 'exit' | 'back' | 'home';

/** Screens where back leaves the app, like the first screen of any Android app. */
const EXIT_PATHS = new Set(['/', '/dashboard', '/login', '/auth', '/onboarding', '/splash']);

export function backButtonAction({ path, canGoBack, dialogOpen }: { path: string; canGoBack: boolean; dialogOpen: boolean }): BackAction {
 if (dialogOpen) return 'close-dialog';
 const normalized = path.length > 1 ? path.replace(/\/+$/, '') : path;
 if (EXIT_PATHS.has(normalized)) return 'exit';
 if (canGoBack) return 'back';
 return 'home';
}
