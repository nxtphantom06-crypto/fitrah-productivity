<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep TanStack Start file-based routes and the root Outlet; shared Fitrah providers wrap the Outlet so every screen uses the same theme.
- Keep UI-only phase screens separate from live authentication and persisted feature logic; static screens must never imply a successful account operation.
- Mount FeatureProvider explicitly around Outlet with identity-keyed TanStack Query data and Suspense; signed-out screens get no mutable feature state, preventing private data leakage.
- Core feature reads use shared protected-route query loaders and authenticated server functions; task/subtask saves and to-do ordering use invoker SQL transactions so partial writes cannot corrupt activity.
- Prayer dates use the saved account timezone; the UI edits only today while the database accepts up to 7 past days so offline phones can sync; date-keyed history needs no destructive midnight reset.
- Use unnested task content routes for create/detail/edit so task list and detail bodies never shadow child screens.
- Centralize Fitrah styling in semantic CSS tokens and shared primitives so light/dark appearance remains consistent.
- Analytics, streaks and reminder preferences come from saved account activity; saved account profiles use owner-scoped Cloud access and private avatar storage.
- Keep signed-in screens under the managed client-only authenticated layout, with a single root auth subscription and identity-keyed feature state; sign-out clears cached and temporary private state before replacing navigation with login.
- Register offline support only through the guarded client module; generate the service worker with vite-plugin-pwa into dist/client, never register in preview/dev, and use NetworkFirst for navigation.
- The Capacitor app is a separate static SPA build (`npm run build:native` → dist/client/index.html) that calls the hosted site's server functions via an allowlisted native-origin CORS/CSRF rule; the normal `vite build` stays SSR so the published site is unchanged.
- The phone app is local-first: data lives in IndexedDB, changes go through an ordered outbox (src/lib/native/sync.ts) replayed on reconnect, and reminders are on-device local notifications computed by src/lib/reminder-schedule.ts; the website keeps direct server calls.
- Android project tweaks (deep link, permissions, Android 12 splash, notification icon) live in scripts/android-setup.mjs, run by the workflow after `cap add android`, because android/ is generated in CI.
