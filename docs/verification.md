# Foundation verification — 2026-11-03

Status: **local foundation verified; complete Foundation Engineering acceptance blocked**. Implementation, platform discovery and real-service acceptance are separate.

## Baseline and preservation

Remote `main` advanced from the license-only commit to `bbd95dcd4794c39590b0041f264d41f1a4820506` while work was in progress. The branch incorporated that commit before integration. Its `LICENSE`, original validator/schema, CLI, tests and original three fixtures remain unchanged. New runnable fixtures are under `examples/runtime/`. Existing repository instructions were read and applied. No private implementation was copied.

## Reproducible checks

macOS local environment: Node **25.7.0** and **22.23.4**, npm 11.10.1.

- Clean `npm ci --ignore-scripts` succeeded.
- `npm run check` passed on both Node versions: **57 tests, 0 failed, 0 skipped** (23 bootstrap + 34 runtime), TypeScript checking, library declarations/build, browser bundle and all six fixture validations.
- Tests exercise ID uniqueness, original fixture compatibility, intent/unknown-data roundtrip, partial human/AI edits, stale revision rejection, atomic invalid batches, undo, resource limits, duplicate JSON keys, unsafe objects/numbers and embedded assets.
- Registry/DOM tests exercise built-ins, added custom module without core changes, unsupported/invalid fallback, target validation, independent choice groups, reduced-motion reading order and isolated session state.
- Actual loopback HTTP requests exercise synthetic owner/non-owner/anonymous identities, persistent local save/reread and stale update rejection. Identity is injected by the test host. These are **not real Sonjapgo or ChatGPT account tests**.
- A GitHub Actions matrix is provided as `docs/ci-check.example.yml`. The connected GitHub credential lacks workflow-write scope, so the active workflow could not be pushed. No hosted CI result is claimed; local checks passed on both versions. Activating that sample requires an appropriately authorized repository maintainer.

## Browser measurement

The built demo was exercised in the actual in-app browser at a loopback URL:

1. Opened the landing work, changed `title` block to `Human title preserved`, then changed only `body` to `A precise change to this block.`. Both changes remained visible at revision 2.
2. Exported the browser file. The Node core read it and confirmed work ID `landing`, revision 2, schema version and both strings.
3. Reloaded the latest build and imported that file through the actual file picker. The same work ID/revision and both changes were visibly restored. This demonstrates browser → file → Node → browser portability for this artifact.
4. Opened the choice example and selected `Plant a seed`. The visible scene changed to its outcome and received focus.
5. Opened the scroll example and scrolled normally. The scene's measured progress reached approximately `0.494`, with horizontal transform approximately `-950px`. Keyboard/reduced-motion logic is covered locally; physical mobile-device acceptance is not claimed.

This is actual browser playback, not a native Sonjapgo app test. The screenshot is a local session artifact; no private file was uploaded to a public site.

## Independent review and corrections

A separate reviewing agent examined the code and reproduced defects before fixes:

- Global `assetId` validation incorrectly interpreted opaque future-module data. Validation moved to the known image module, including own-property checks.
- Delimiter-based module keys could alias distinct ID/version pairs. Keys now encode a tuple.
- A global choice mode hid unrelated flow scenes. Choice groups now switch independently, preserving ordinary flow scenes.
- Per-block cloning of the complete work caused quadratic rendering cost. Renderers now receive one frozen snapshot. A 2,000-block jsdom experiment improved from roughly 1,939ms to 32ms; this is a local synthetic measurement, not a product performance guarantee.
- Undo could increment an exactly-at-limit file beyond its byte cap. The final restored revision is now validated before returning.

Regression tests pass. Independent rerun of the final check found no unresolved important code findings in that reviewed scope.

## Open acceptance gates and merge disposition

The full user acceptance gate is **not met**, so this work is submitted as a **draft PR without merging**:

1. **Real private Sonjapgo storage/preview:** existing tools have no `.sjg` receiver. Reducing the file to legacy text commands would lose scene identity and branches; the source-post scene path also cannot serve as a generic private file importer. A receiver in the owning service and owner/non-owner/anonymous acceptance are needed. That repository/production change is outside this authorization.
2. **ChatGPT file handling/Sites identity:** official capability documentation and Sites discovery were checked, but no SonTool extension was installed, no Site deployed and no hosted identity/storage roundtrip was exercised. Host ETag and work revision must both be respected by a future adapter.
3. **Native App/media adapters:** shared browser-safe code is established; actual app, Remotion, FilmCraft and Premiere roundtrips remain unverified. Media conversion must report omitted interactions/timing decisions.
4. **Editor adoption cost:** Puck/GrapesJS were compared using their published contracts, not installed or benchmarked. The current tiny lab is not evidence that a full custom editor is more efficient.
5. **Legacy T121 flow:** this foundation does not complete the legacy real-node/template workflow. Its Task/Work state must remain unchanged.

The `.sjg` identity/intent claim is supported for the measured JSON/browser/Node examples. It is not generalized to every host or every unknown module's behavior. Required next work is one private receiver and one real GPT file handler acceptance path, using the existing service/account boundaries; no new product database is required by this design.

No production deployment, operating DB mutation, external work publication, package release or force push was performed.

## Repository disposition

Implementation is committed and pushed to `codex/sontool-v3-foundation`; [PR #1](https://github.com/paradigmdragon/sontool/pull/1) is open as a draft. It is deliberately unmerged because the actual private-service acceptance gate remains open. The initial workflow-scope push rejection was resolved by retaining only the inactive CI recipe; no credential permission was changed. Source code is the independently reviewed/tested implementation; subsequent edits record publication of this code branch and its limits.
