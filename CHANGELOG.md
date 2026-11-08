# SmartShop changelog

SmartShop follows semantic versioning. It remains a development preview; versions below 1.0.0 are not production releases.

## 0.4.0 — 2026-11-08

### Added

- Added optional real email/password accounts, session restoration, password reset and sign-out through a configured Supabase Free project.
- Added an IndexedDB-backed outgoing sync queue, idempotent mutation IDs, automatic retry, remote pull, revision conflict detection and honest sync status/retry controls.
- Added an owner-only Supabase schema with RLS policies, Android/Capacitor project configuration and a free GitHub Actions debug-APK workflow.

### Changed

- Existing local lists remain the immediate source of truth and continue working without an account or network.
- Native Capacitor builds do not register the browser PWA service worker.

### Security

- Browser configuration accepts only the Supabase project URL and anonymous key; no service-role key is used.
- All user-data tables declare owner-only read/write policies and ownership checks.

### Known issues

- Live account, cross-device, and RLS tests are blocked until browser-safe Supabase project configuration is supplied.
- APK compilation and device testing are blocked on this workstation because Java, Android SDK and Gradle are unavailable; the workflow is present but could not be pushed or run while GitHub access was unavailable.

## 0.3.0 — 2026-11-08

### Added

- Added a readable “What’s new” page, opened from the Settings button on phone and desktop.
- Added visible application version, build number, release date, release channel, highlights, fixes, and known limitations.

### Changed

- Replaced the misleading 1.0.0 package label with the verified development-preview version 0.3.0.
- Made one metadata file authoritative for the app, build check, and storage-schema number.

### Known issues

- Accounts and live household sharing are unavailable.
- Supermarket routes are demonstration data and do not represent live stock or verified layouts.
- Voice entry depends on browser support.

## 0.2.0 — 2026-11-08

### Added

- Added genuine Chrome UI coverage for list management, store switching, Shopping Mode, offline reloads, saved data, voice review, and Android-width layouts.
- Added IndexedDB persistence and migration from the earlier local-storage format.
- Added reviewed voice entry with a typed fallback.

### Fixed

- Kept edit, correction, and Undo controls available while Shopping Mode is open.
- Made Shopping Mode item names edit items instead of incorrectly completing them.

### Known issues

- Account synchronisation remained unavailable because no browser-safe backend configuration was present.

## 0.1.0 — 2026-11-08

### Added

- Added the first SmartShop development preview with local shopping lists, item entry, store-route sorting, Shopping Mode, corrections, planning, dark mode, and an installable offline shell.
- Added clearly labelled preview areas for household features and example supermarket routes.

### Known issues

- The initial run did not execute genuine browser interaction tests.
- Household, community, and account features were previews only.

