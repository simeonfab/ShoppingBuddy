# SmartShop permanent build history

This is an append-only record. Run numbers identify Craft Anything runs; application versions identify meaningful verified releases. Historical entries reconstructed in Run 4 distinguish claims from evidence and do not turn unverified claims into facts.

## Run 1 — Initial SmartShop build

- **Date and time:** 2026-11-08 00:37:56 UTC
- **Application version before:** None
- **Application version after:** 0.1.0 (assigned retrospectively in Run 4)
- **Release status:** Development preview
- **Exact request:** Not preserved in `build-activity.log`; the log only says the product request required a React and TypeScript installable web app. This missing source request cannot be reconstructed exactly.
- **Intended objectives:** Build the first mobile-first SmartShop experience with lists, branch ordering, Shopping Mode, local persistence, corrections, planning, offline support, and honest preview boundaries.
- **Actually changed — builder-reported claims:** The builder reported persistent lists, autocomplete, branch-specific ordering, corrections, Undo, Shopping Mode, planning, dark mode, offline PWA support, a Windows launcher, screenshot/self-test support, and build metadata.
- **Actually changed — source-code evidence available in Run 4:** React/TypeScript UI, list/item/store flows, shopping flow, example data, service worker, web manifest, Rust launcher, and wrapper metadata exist in source. Source presence alone does not prove runtime behaviour.
- **Files created, modified, or removed:** The log does not preserve a complete per-operation list. Current source shows the initial app created the `package.json`, TypeScript/React source, CSS, PWA public files, Rust launcher, `mechanics.json`, and related lock/configuration files inside `app/`.
- **Data-schema or storage migrations:** Used `smartshop-state-v1` local storage. No independently recorded migration test.
- **Tests executed:** Production build passed. Craft rebuild checks initially failed to find a desktop program; after a wrapper was added, the final wrapper build, screenshot, self-test, and mechanics checks passed.
- **Individual test results:** Build — passed. Final 1280×720 launcher screenshot — passed. Launcher self-test — passed according to its then-current JSON. Mechanics check — passed. Genuine browser interaction suite — not run.
- **Real UI verification:** No preserved evidence of real browser interactions. The reported launcher screenshot is not proof of the shopping interactions.
- **Features not tested:** End-to-end list editing, persistence across a real browser restart, service-worker offline reload, mobile widths, accessibility, account flows, and household sharing.
- **Failed attempts and errors:** Initial rebuild checks could not find a runnable desktop program. Several launcher screenshot attempts timed out or failed before the wrapper contract passed.
- **Known bugs and limitations:** Household/community/account features were not backed by a live service. Store layouts were demonstration data. The 1.0.0 values in package and Cargo files were inaccurate and were corrected in Run 4.
- **Features still presented as previews:** Household sharing, community verification, live store accuracy, and accounts.
- **Synthetic or wrapper-only checks:** The Windows launcher screenshot and self-test were wrapper-oriented; they did not establish genuine browser behaviour.
- **Recommended next task:** Add genuine browser tests and repair Shopping Mode gaps.

## Run 2 — Mobile, offline, Shopping Mode, and browser verification

- **Date and time:** 2026-11-08 01:19:31 UTC
- **Application version before:** 0.1.0 (retrospectively assigned)
- **Application version after:** 0.2.0 (retrospectively assigned)
- **Release status:** Development preview
- **Exact request:** Not preserved in `build-activity.log`. The log records a priority list covering real browser tests, Shopping Mode/mobile foundations, offline persistence, voice entry, and account feasibility, but not the verbatim builder request.
- **Intended objectives:** Repair Shopping Mode, test real UI behaviour at Android widths, add durable/offline storage, add reviewed voice input, and determine whether real account integration was possible.
- **Actually changed — builder-reported claims:** The builder reported genuine Chrome E2E coverage, repaired Shopping Mode overlays and item actions, IndexedDB/offline persistence, Android layouts, reviewed push-to-talk input, and explicit wrapper-only labels.
- **Actually changed — source-code evidence available in Run 4:** `tests/e2e.mjs` drives Chrome through its debugging protocol; `storage.ts` uses IndexedDB version 2 and migrates valid `smartshop-state-v1` data; Shopping Mode renders shared sheets/toasts; service-worker cache is versioned; household controls remain disabled.
- **Files created, modified, or removed:** Known current evidence includes modifications to `src/App.tsx`, `src/styles.css`, `src/storage.ts`, `public/sw.js`, `src/main.rs`, `package.json`, lockfiles, and creation of `src/voice.ts` and `tests/e2e.mjs`. The log does not preserve an authoritative complete list.
- **Data-schema or storage migrations:** Added IndexedDB schema version 2 and migration from valid legacy local-storage state. No destructive migration was intended.
- **Tests executed:** TypeScript no-emit check, production build, genuine Chrome E2E, and Craft `rebuild_check`.
- **Individual test results:** Final TypeScript check — passed. Final production build — passed. Final Chrome E2E — passed according to the run log. Offline reload/edit persistence — passed. 320, 360, 390, 412, and 430px overflow checks — passed. Close/reopen IndexedDB persistence — passed. Final rebuild check — all four checks passed.
- **Real UI verification:** Automated Chrome interacted with list creation/rename/duplicate/switching, item add/edit, store switching and route difference, Shopping Mode correction/Undo/restore/add/edit, mocked voice recognition review, offline reload, and persistence. This was automated browser verification, not a manual human review.
- **Features not tested:** Real speech microphone capture, real account/login/synchronisation, household sharing across devices, community moderation, live supermarket data, and iOS/Safari.
- **Failed attempts and errors:** Two patch applications failed; multiple early Chrome launches/tests failed while debugging; one temporary-directory removal command was blocked; Microsoft Edge computer-use approval was denied; one build was blocked by a running launcher locking the executable.
- **Known bugs and limitations:** Account synchronisation unavailable without browser-safe backend configuration. Store data remains illustrative. Chrome test depends on a fixed local Chrome path and debugging port.
- **Features still presented as previews:** Household sharing, accounts, community/live store verification.
- **Synthetic or wrapper-only checks:** Craft’s launcher self-test was deliberately rewritten to state it was wrapper-only. Mock speech recognition verified parsing/review UI but not a real microphone.
- **Recommended next task:** Add durable version/build tracking and an in-app version history before more features.

## Run 3 — Stopped run

- **Date and time:** 2026-11-08 01:37:30 UTC
- **Application version before:** 0.2.0
- **Application version after:** 0.2.0
- **Release status:** Failed/incomplete run; not a release
- **Exact request:** Not recorded before the run was stopped.
- **Intended objectives:** Unknown; the log only records “Improving the build”.
- **What was actually changed:** Nothing recorded; the builder stopped with zero tokens used.
- **Files created, modified, or removed:** None recorded.
- **Data-schema or storage migrations:** None.
- **Tests executed:** None.
- **Individual test results:** All tests — skipped because the run stopped.
- **Real UI verification:** None.
- **Features not tested:** Entire application.
- **Failed attempts and errors:** Run stopped four seconds after start.
- **Known bugs and limitations:** Same as Run 2.
- **Features still presented as previews:** Household sharing, accounts, and live/community store data.
- **Synthetic or wrapper-only checks:** None.
- **Recommended next task:** Resume with a fully recorded request and create the missing permanent tracking system.

## Run 4 — Permanent version tracking and in-app history

- **Date and time:** 2026-11-08 01:38:55 UTC
- **Application version before:** 0.2.0
- **Application version after:** 0.3.0
- **Release status:** Development preview
- **Exact request:**

  ~~~text
  Add permanent, reliable version tracking and change documentation to SmartShop.

  From now on, every Craft Anything run must create a new build-history entry. Never overwrite or silently rewrite an earlier entry.

  ## Build runs versus application versions

  Keep these separate:

  - **Build run:** Every Craft Anything run gets a unique sequential run number.
  - **Application version:** Increase the public version only when the run produces a meaningful, verified change.

  Use semantic versioning:

  - Patch: bug fixes and small improvements, such as `0.1.1`.
  - Minor: meaningful new functionality, such as `0.2.0`.
  - Major: incompatible or production-level milestones, such as `1.0.0`.

  Do not mark SmartShop as version 1.0.0 until its core mobile, offline, account and shopping functionality is genuinely production-ready.

  ## Permanent build history

  Create and maintain:

  `docs/BUILD_HISTORY.md`

  Append one section for every run containing:

  - Sequential run number.
  - Date and time.
  - Application version before the run.
  - Application version after the run.
  - Exact request given to the builder.
  - Intended objectives.
  - What was actually changed.
  - Files created, modified or removed.
  - Data-schema or storage migrations.
  - Tests executed.
  - Individual test results.
  - Features verified through the real UI.
  - Features not tested.
  - Failed attempts and errors.
  - Known bugs and limitations.
  - Features still presented as previews.
  - Any synthetic or wrapper-only checks.
  - Recommended next task.

  Never describe a feature as completed merely because its files or controls exist.

  ## User-facing changelog

  Create and maintain:

  `CHANGELOG.md`

  Use clear sections such as:

  - Added.
  - Changed.
  - Fixed.
  - Removed.
  - Security.
  - Known issues.

  Only include meaningful user-facing changes. Do not fill it with internal retries or formatting changes.

  ## In-app “What’s new” page

  Add a small “What’s new” or “Version history” screen accessible from Settings or About.

  Display:

  - Current version.
  - Build number.
  - Release date.
  - Important additions.
  - Important fixes.
  - Known limitations.
  - Whether the version is a development preview, beta or stable release.

  Keep this page readable for ordinary users. Do not expose secrets, internal credentials, private file paths or raw technical logs.

  ## Version metadata

  Create one authoritative version-metadata source used by the application and build process.

  It should contain:

  - Application version.
  - Build number.
  - Build date.
  - Release channel: development, alpha, beta or stable.
  - Storage-schema version.
  - Minimum compatible data version.

  Do not maintain conflicting version numbers in multiple unrelated files.

  Show the current version and build number in the app’s About or Settings area.

  ## Verification requirements

  At the end of every run:

  1. Update the build history.
  2. Update the changelog if user-facing behaviour changed.
  3. Update the version only when appropriate.
  4. Run the genuine test suite.
  5. Record every test as passed, failed, skipped or blocked.
  6. Record any untested claims.
  7. Record remaining placeholder data and inactive controls.
  8. Confirm that the application still opens.
  9. Confirm that existing local data survives any migration.
  10. Report the new run number and version clearly.

  A failed or incomplete run must still receive a build-history entry, but it must not be presented as a successful release.

  ## Source-control history

  If this project is already a Git repository:

  - Preserve existing history.
  - Make one clear commit for each completed run where practical.
  - Use descriptive commit messages.
  - Tag verified application releases with their version.
  - Do not tag failed runs as releases.

  If the project is not a Git repository, report that fact. Do not pretend that rollback history exists.

  ## First task

  Inspect the existing project and reconstruct an honest initial history from the available build log and source code.

  Clearly distinguish:

  - Builder-reported claims.
  - Source-code evidence.
  - Real browser-tested behaviour.
  - Synthetic launcher checks.
  - Features that remain incomplete.

  Treat the current application as a development preview unless genuine verification supports a more advanced release status.

  After setting up version tracking, report:

  - Current run number.
  - Current application version.
  - Current release channel.
  - Location of the build history.
  - Location of the changelog.
  - How to open the in-app “What’s new” page.

  Make the change in app/, then build it again, fix any errors and check it with rebuild_check. Reply with 1-3 plain sentences on what changed.
  ~~~
- **Intended objectives:** Reconstruct honest history, establish append-only run/version rules, create authoritative metadata, expose readable version history in Settings, correct inaccurate 1.0.0 labels, verify the app and data migration, and record all outcomes.
- **What was actually changed:** Added project-local run rules, authoritative `version.json`, build-time consistency validation, permanent history, changelog, and an in-app “What’s new” sheet. Connected the storage database version to the metadata. Corrected package/launcher version labels to 0.3.0. Extended the genuine Chrome suite to cover the version page and legacy-data migration. Fixed the launcher’s relative screenshot-path handling. Identified a promotional plugin instruction; deletion was attempted but blocked outside the writable workspace.
- **Files created:** `AGENTS.md`, `version.json`, `scripts/check-version.mjs`, `CHANGELOG.md`, `docs/BUILD_HISTORY.md`.
- **Files modified:** `package.json`, `package-lock.json`, `Cargo.toml`, `Cargo.lock`, `src/App.tsx`, `src/styles.css`, `src/storage.ts`, `src/main.rs`, `tests/e2e.mjs`.
- **Verification artifact created:** `shots/version-run-4.png` (real rendered launcher screenshot).
- **Files removed:** None.
- **Data-schema or storage migrations:** No schema increase; storage schema remains 2 and minimum compatible data version is 1. Existing IndexedDB data should not be rewritten solely by this run.
- **Tests executed:** `npm run check:version`; TypeScript as part of `npm run build`; Vite production build; Cargo release build; genuine Chrome `npm run test:e2e`; launcher screenshot; Craft `rebuild_check`.
- **Individual test results:** Version consistency — passed. TypeScript compilation — passed. Vite production bundle — passed. Cargo release build — passed after the old launcher process was closed. Legacy local-storage migration — passed. Settings/version page — passed through real Chrome. List create/rename/duplicate/switch — passed. Catalogue/custom add and duplicate combining — passed. Item quantity/unit/note editing — passed. Branch switching and distinct ordering — passed. Branch correction after reload — passed. Completion/Undo/restore — passed. Add/edit during Shopping Mode — passed. Shopping Mode enter/leave — passed. Mocked voice parsing/review — passed (synthetic speech source). IndexedDB refresh persistence — passed. 320/360/390/412/430px overflow checks — passed. Genuine offline reload and edit persistence — passed. Close/reopen persistence — passed. Launcher screenshot/app opens — passed at 390×844. Craft build/screenshot/wrapper self-test/mechanics checks — all passed.
- **Real UI verification:** Automated Chrome interacted with the Settings button and confirmed development channel, version 0.3.0, and build 4. The full existing shopping E2E suite also passed in rendered Chrome. The launcher produced a real 390×844 screenshot showing SmartShop open. No manual human usability review was performed.
- **Features not tested:** Real accounts, cross-device household sharing, live supermarket data, real microphone capture, iOS/Safari, and Git rollback/tagging because the workspace is not a Git repository.
- **Failed attempts and errors:** A combined patch failed because its context used a semicolon where the source used a comma; it made no partial change. The first two E2E runs failed only because CSS transformed “Development preview” to uppercase in rendered `innerText`; the assertion was corrected and the full suite then passed. The first Cargo rebuild failed because a prior SmartShop process locked the executable; a CIM process query was denied, then the exact workspace process was safely identified through `Get-Process`, stopped, and the build passed. The first relative-path launcher screenshot exposed an asynchronous/path-resolution failure; `src/main.rs` was fixed to pass an absolute path and the screenshot was then created. Deleting the promotional Web Design plugin was blocked because its cache path is outside the workspace’s writable area.
- **Known bugs and limitations:** Accounts and household sharing are unavailable; store layouts are examples; voice input needs browser support; the E2E harness uses a fixed Windows Chrome path and port.
- **Features still presented as previews:** The whole app remains a development preview; household sharing, accounts, community verification, and store layout data remain incomplete/preview features.
- **Synthetic or wrapper-only checks:** Craft’s launcher self-test remains explicitly wrapper-only and must not be treated as real UI interaction evidence. Mocked speech tested parsing and review UI, not microphone hardware. The launcher screenshot proves the rendered app opens but not that its controls work; control behaviour is covered separately by Chrome E2E.
- **Source control:** The workspace is not a Git repository, so no commit, tag, or rollback history was created or claimed.
- **Recommended next task:** Configure and verify real accounts plus cross-device household synchronisation without weakening offline/local data behaviour.

## Run 5 — Android, accounts, synchronisation, and source control

- **Date and time:** 2026-11-08 08:29 UTC
- **Application version before:** 0.3.0
- **Application version after:** 0.4.0
- **Release status:** Development preview; partial build run with explicitly blocked cloud and Android-toolchain verification.
- **Exact request:** Continue SmartShop as the next recorded run; preserve existing functionality, migrations, Android-sized UI, voice work, tests and history; initialise and safely push `app/` to the empty `https://github.com/simeonfab/ShoppingBuddy` repository; use `main` then `feature/android-accounts-sync`; create a genuine Capacitor Android APK and free GitHub Actions artifact; implement real optional Supabase email accounts, owner-only RLS schema and offline-first cross-device synchronisation; use only free/open-source tools and free tiers; update version/history/changelog; run all stated checks, `rebuild_check`, and report completed, partial, blocked and untested work without invented success. The full verbatim multi-section request is preserved in this Craft Anything run record.
- **Intended objectives:** Establish safe Git history, publish source, package and verify Android, add optional real accounts and secure offline sync, provide free CI distribution, and verify every supported claim.
- **What was actually changed:** Added comprehensive exclusions and free-only policy; real Supabase Auth REST integration; session restore; password reset; local-list preservation; durable snapshot mutation queue; mutation UUIDs; reconnection retry; backend-confirmed sync status; remote pulls; conflict status; owner-only versioned SQL migration; static policy checker; Capacitor/native service-worker detection; Android source/configuration; a standard-runner Actions workflow; setup/install documentation; and cross-platform Chrome discovery in the browser suite.
- **Files created:** `.gitignore`, `.env.example`, `.github/workflows/android-debug.yml`, `capacitor.config.ts`, Android project source/resources, `src/auth.ts`, `src/sync.ts`, `scripts/check-rls.mjs`, `supabase/migrations/202611080001_initial_sync.sql`, `docs/FREE_ONLY_POLICY.md`, `docs/SUPABASE_SETUP.md`, and `docs/ANDROID_TESTING.md`.
- **Files modified:** `package.json`, `package-lock.json`, `Cargo.toml`, `Cargo.lock`, `version.json`, `CHANGELOG.md`, `docs/BUILD_HISTORY.md`, `src/App.tsx`, `src/main.tsx`, `src/storage.ts`, `src/styles.css`, `src/types.ts`, `tests/e2e.mjs`, and `scripts/check-version.mjs`.
- **Data-schema or storage migrations:** IndexedDB schema 2 to 3 assigns stable sync UUIDs and revision/timestamp metadata while preserving lists. The Supabase migration creates profiles, shopping lists, grocery items, product corrections and mutation receipts with tombstones, revisions and owner-only RLS.
- **Repository and branches:** Intended remote `https://github.com/simeonfab/ShoppingBuddy`; local `main` and `feature/android-accounts-sync`. Commit SHAs and push result are recorded in the final run note after commits.
- **Android packaging:** Application ID `com.simeonfab.shoppingbuddy`, display name SmartShop, version 0.4.0/build 5, Capacitor 8.5.3 with minimum SDK 24/target SDK 36, bundled `dist` via Capacitor sync, cleartext disabled, adjust-resize keyboard behavior, launcher/splash resources, Internet and microphone permissions only. Microphone access remains initiated by the existing user-pressed voice button.
- **APK path and artifact:** Expected local path `android/app/build/outputs/apk/debug/app-debug.apk`; workflow artifact `smartshop-android-debug-build-<run-number>`. No APK was produced locally because the required JDK/SDK/Gradle/dependencies were unavailable.
- **Supabase status:** No `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` was available. UI honestly shows setup required and leaves offline use unblocked. A separate Supabase management token present in the environment was not used, read into the app, or committed.
- **RLS policies:** Static coverage check passed. Live database execution and hostile-user policy tests were blocked without a configured project.
- **Account status:** Integration code implemented; unconfigured-state UI browser-tested. Live signup/sign-in/reset/session/sign-out were blocked without browser-safe credentials.
- **Synchronisation status:** Durable queue/retry/pull/conflict implementation compiled. Cross-device correctness remains blocked and is not claimed as passed.
- **Tests passed:** TypeScript no-emit; static RLS policy coverage. Production build, browser suite, version check, launcher build and rebuild check results are recorded in the final note below.
- **Tests failed:** Initial production build stopped correctly because this Run 5 history entry had not yet been appended; the entry was then added before rerun.
- **Tests blocked:** Local APK/Gradle, emulator/device install, microphone hardware, live account/cross-device sync, live RLS, Actions artifact download, and GitHub push/workflow run.
- **Free-tier services/tools:** Supabase Free Plan design only, public-repository standard GitHub Actions runner configuration, open-source Capacitor/React/Vite/TypeScript/Rust/Gradle components; no trial, payment method, paid add-on, larger runner, domain, or Play publication was used.
- **Remaining limitations:** The committed dependency lock could not be regenerated for newly declared Capacitor packages while npm network access was denied; CI must refresh/verify it once network access is restored. Android wrapper binaries could not be generated without Gradle. Household sharing remains a preview and is not implied by private per-user sync.
- **Recommended next task:** Restore GitHub authentication/network and supply a dedicated Supabase Free project URL/anon key, then run the migration, live two-user RLS tests, isolated two-device sync test and Android workflow/device test before promoting the preview.

### Run 5 final verification note

- **Local Git:** `main` root commit `b741a120fbb6e6996d4e21f34d7580531ba115cd`; `feature/android-accounts-sync` implementation commit `8c0f934449a90ad9d7b317df1c4a48a51d403547`. Remote is `https://github.com/simeonfab/ShoppingBuddy.git`.
- **Push:** Failed/blocked. A normal non-force `git push -u origin main` could not connect to `github.com:443`; no remote content or Actions run could be verified, and no remote history was rewritten. The feature branch was therefore not claimed as published.
- **Intentionally excluded:** `node_modules/`, `dist/`, `target/`, `.chrome-test*/`, `.npm-cache/`, disposable screenshots and wrapper self-test output, environment files other than names-only `.env.example`, credentials, signing keys/keystores, Android `local.properties`, generated APK/AAB/build folders, editor/OS files, logs, reports and private-data folders. No selected file matched the staged secret/token/private-key scan; the intentional Run 4 PNG was the only committed binary.
- **Files unsafe to publish:** No source file was identified as unsafe. Local browser profiles and generated/private paths were excluded rather than published.
- **Passed:** `npm run check:version`; `npm run typecheck`; `npm run check:rls` static owner-policy coverage; `npm run build:web`; full `npm run build` including Rust launcher; genuine Chrome E2E covering migration, shopping flows, mocked voice parsing, 320–430 px layouts, service-worker offline reload/edit and IndexedDB close/reopen persistence; Craft `rebuild_check` build, 390×844 app screenshot, explicitly wrapper-only self-test and mechanics checks.
- **Failed then fixed:** The first post-change E2E run expected the previous offline status wording and timed out; the assertion was updated to the accurate new wording and the complete suite passed. TypeScript later detected a possibly missing active list after tombstone support; optional access fixed it and TypeScript/build passed.
- **Blocked/untested:** npm network access denied Capacitor package installation and lockfile regeneration; JDK, Android SDK and Gradle were absent; the Capacitor CLI sync/build could not complete; no real APK exists; package/version/activity/assets inside an APK, emulator/device install, restart/offline native launch, back behavior, hardware microphone permission/denial, Actions artifact upload/download, live account flows, two-profile cross-device sync and live hostile-user RLS tests remain unverified.
- **Android deviation:** Official Capacitor 8.5.3 requirements were used for the checked-in source (minimum SDK 24, target/compile SDK 36, AGP 8.13.0, Gradle 8.14.3 in CI), but the project could not be regenerated or compiled locally. The workflow uses a standard free runner and setup-provided Gradle because a genuine Gradle wrapper JAR could not be generated/committed without the blocked toolchain; this does not satisfy the requested committed-wrapper or real-APK completion requirements.
- **Completion classification:** Completed locally — Git repository/history, exclusions/secret inspection, free-only rule, auth/sync integration source, schema/policies, web regression verification, Android/CI source and documentation. Partial — Android packaging and lockfile. Blocked — GitHub publication/Actions, genuine APK and artifact, live Supabase/account/cross-device/security tests, emulator/device/hardware checks.

