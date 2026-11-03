# SonTool v3 Foundation Implementation Plan

Goal: prove a portable, identity-preserving .sjg core with three executable examples.
Spec: user-approved Foundation Engineering scope, captured in docs/architecture.md.
Architecture: browser-safe TypeScript core, JSON .sjg envelope, pure command operations, opt-in module registry; storage/auth and rendering stay in adapters. No production writes/deployment.

- [x] Inspect P9/T121, source/license and current platform capabilities; record measured vs unverified evidence.
- [x] RED then GREEN: model validation, stable IDs/references, unknown-field preservation, roundtrip and revision conflict/undo.
- [x] RED then GREEN: module registry, three fixtures, DOM renderer (landing/scroll/choice), unsupported fallback.
- [x] RED then GREEN: private local store, caller identity checks, import/save/load; publication compatibility plan without live publication.
- [x] Build local example and measure Node/browser interchange; test partial edits without overwriting human changes.
- [x] Independent review and defect correction.
- [x] Commit/push/[draft PR #1](https://github.com/paradigmdragon/sontool/pull/1); final remote branch/main verification recorded in the task report. Full merge gate remains blocked by absent real private `.sjg` service acceptance.

Review focus: unknown modules/fields; hostile file input; cross-user access; stale mutation/undo; lossy publication claims.
Initial root contained only LICENSE at f2423f271d9ab0ff476a08a58e14913125109f94; refreshed main bbd95dcd4794c39590b0041f264d41f1a4820506 added bootstrap files, which were integrated and preserved. Preserve it unchanged. P9/T121 historical scope does not supersede this user's explicit v3 foundation authorization; do not mark the legacy task complete.
