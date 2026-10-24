# Phase 1 — Project foundation & UI shell

- [x] Establish Fitrah theme, reusable primitives and visual identity.
- [x] Build mobile navigation and five navigable shell screens; open dashboard at /.
- [x] Configure guarded PWA support, icons and metadata.
- [x] Verify navigation, theme switching, mobile layout and PWA guards.

## Phase 2 — Auth, onboarding & static UI
- [x] Add splash and three-step onboarding.
- [x] Add sign-up, login and forgot-password screens with local validation and honest static states.
- [x] Add profile setup with avatar preview, timezone and prayer-language preferences.
- [x] Verify onboarding navigation and form validation.

Offline support is configured and preview registration is verified disabled; published offline behavior cannot be exercised before publication.

## Phase 3 — Prayer, to-do & task feature UI
- [x] Shared temporary feature state and tested date/filter/progress rules.
- [x] Interactive prayer cards, notes, date strip, history and dashboard progress.
- [x] To-do add/edit/delete, completion, priority, due dates, filtering and reorder/swipe actions.
- [x] Task list, filters/sorting, create/edit/detail screens and subtask progress.
- [x] Verify real-input feature journeys on desktop and mobile.

Phase 3 data stays in memory across navigation and resets on page reload. Streaks remain placeholders until the streak phase.

## Phase 4 — Progress, profile, settings & 404 UI
- [ ] Add sample analytics, month comparison and prayer heatmap.
- [ ] Add temporary profile editing, appearance and reminder settings.
- [ ] Add branded missing-page screen and verify Phase 4 journeys.

Later phases: live authentication, stored prayer/task data, real streak calculations and notification delivery are not part of these phases.