# SmartShop build-run rules

These rules apply to every Craft Anything run that touches this app.

1. Read `version.json`, `docs/BUILD_HISTORY.md`, and `CHANGELOG.md` before changing the app.
2. Increase `buildNumber` for every run, including stopped, failed, incomplete, documentation-only, and no-change runs. Never reuse a build number.
3. Append a new `## Run N` section to `docs/BUILD_HISTORY.md`. Never edit, reorder, delete, or silently rewrite an earlier run section. Corrections must be a new dated note in the current run.
4. Change `applicationVersion` only for a meaningful, verified application change. Use semantic versioning and keep the release channel conservative. Do not use `1.0.0` until mobile, offline, accounts, and shopping are production-ready.
5. Treat `version.json` as authoritative. Keep package and launcher versions aligned; `npm run check:version` enforces this.
6. Update `CHANGELOG.md` only for meaningful user-facing behaviour.
7. Before ending, run the genuine test suite, record each result, verify the real UI, confirm the app opens, and check saved local data survives. Label wrapper and synthetic checks honestly.
8. A failed run still gets a history entry and build number; it is not a release and must not be tagged.
9. Record placeholders, disabled controls, previews, untested claims, failed attempts, and known limitations explicitly.

