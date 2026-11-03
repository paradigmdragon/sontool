# Phase 2: portable host boundary

The foundation Draft PR remains unchanged. This branch adds a stateless bridge so an authenticated host can reuse the exact public parser, module checks and atomic edits. It does not introduce a database, upload service or hosted editor.

## Implemented

- `node dist/cli.js`: bounded stdin/stdout import, full/element read and controlled partial edit.
- Stable work identity and work revision retained across import/read/patch/export.
- Duplicate keys, malformed UTF-8, malformed known modules and excessive inputs rejected.
- Unknown module data retained without loading code; unsupported status returned.
- Text edits and a scene's solid hex background can be changed independently. Stale revisions reject; omitted content/layout siblings survive.
- The browser renderer displays that same safe background value. Other imported CSS remains inert.
- Selected portable sources compile with ES2020 library types for host integration; the CLI runtime remains Node 22.12 or newer.

See [bridge.md](bridge.md) for the wire contract and host responsibilities. The bridge alone cannot authorize a user, lock persisted state or prove account isolation. The receiver must do those things using its existing storage and authentication.

## Verification on 2026-11-03

`npm run check`: **70 tests passed, zero failures/skips** (23 original structural tests and 47 runtime/bridge tests), typecheck, build, and all six example files validated. Subprocess tests exercise the actual CLI. Regressions cover malformed transport, unknown fields/modules, rejected code/style surfaces, targeted reads, preserved human edits, conflicts, and depth/value boundaries shared with the original core.

An independent review identified a bridge-envelope budget mismatch that could reject a valid maximum-depth work when wrapped for reading. Payloads now retain the original core budget; regression tests pass.

Host integration is tracked separately from this public repository. Local host tests are not evidence that a deployed Sonjapgo receiver, a ChatGPT conversation or a ChatGPT file handler is available. No production database was changed and no work was publicly published for this verification. The original Draft PR is not merged.

## Preserved limits

This is still `0.1.0-draft.1` JSON, with the foundation's bounded runtime profile. Importing a valid file does not mean every module can execute. Host storage may have additional representability limits; it must explicitly reject unsupported values without stripping or silently transforming them. Ownership and credentials must never be inferred from work content.

Next acceptance requires a separately authorized installation of the receiver, real account/private-preview checks, and an actual ChatGPT MCP invocation. Sites file storage and conversation file permissions are separate capabilities; neither is assumed from the existence of this CLI.
