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
- Mount FeatureProvider explicitly in the root route around Outlet, separate from FoundationProvider, and keep Phase 3 state in memory; this makes every route's shared prayer/to-do/task dependency explicit without adding persistence before the data phase.
- Use unnested task content routes for create/detail/edit so task list and detail bodies never shadow child screens.
- Centralize Fitrah styling in semantic CSS tokens and shared primitives so light/dark appearance remains consistent.
- Register offline support only through the guarded client module; generate the service worker with vite-plugin-pwa into dist/client, never register in preview/dev, and use NetworkFirst for navigation.
