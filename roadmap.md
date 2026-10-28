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

Phase 3 originally used temporary data; Phase 6 replaces it with saved account activity. Streaks remain placeholders until the streak phase.

## Phase 4 — Progress, profile, settings & 404 UI
- [x] Add sample analytics, month comparison and prayer heatmap.
- [x] Add temporary profile editing, appearance and reminder settings.
- [x] Add branded missing-page screen and verify Phase 4 journeys.

## Phase 5 — Authentication
- [x] Connect email/password and Google sign-in.
- [x] Add session management, guarded screens and password recovery.
- [x] Verify real email sign-in, saved profile/avatar, session reload, password change/recovery and logout with a temporary account.

Google is enabled and connected; its external account-consent round trip and actual email delivery remain unverified.

## Phase 6 — Database & core data layer
- [x] Create private prayer, to-do, task and subtask storage with validated owner-only access.
- [x] Connect existing screens to authenticated reads and reliable saved changes.
- [x] Verify automated date/input/save-failure tests, installed policies/grants and signed-out routing.
- [ ] Verify signed-in reloads, task deep links, reorder and account isolation in the UI — blocked until the user signs in or selects an existing account for testing.

Later phases: real streak calculations, account deletion and notification delivery remain out of scope.