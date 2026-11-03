# 0002 — A bounded, portable runtime on the existing draft

Date: 2026-11-03. Status: implemented experiment; external acceptance remains open.

## Decision and compatibility

Extend the existing `0.1.0-draft.1` envelope rather than replace it. The branch was reconciled with bootstrap commit `bbd95dcd4794c39590b0041f264d41f1a4820506` before integration. Original schema, CLI, three fixtures, validator and 23 tests are retained. Runtime examples live separately in `examples/runtime/`.

Use TypeScript for the new host-neutral core and browser player. It imports neither Node services nor a UI framework. Node-only persistence and HTTP demonstration transport are separate adapters. The original Ajv validator remains the draft structural reference; runtime output is checked against it. The browser core adds bounded parsing and editing without dynamic schema compilation under the demo CSP. This is deliberate compatibility scaffolding, not a claim that two independently maintained validators are a permanent architecture.

The runtime is a **restricted execution profile**, not a new stable file standard. A structurally valid bootstrap file can exceed runtime limits or contain unsupported behaviors. Refusal retains the original file; there is no automatic migration or dropped data. All three existing fixtures roundtrip unchanged. Their opaque timing/choice hints are not silently promoted into newly defined executable semantics.

## Model and behavior

Work → page → scene → block remains the identity hierarchy. `title` and optional `intent` describe the work; `content` belongs to a versioned module. Layout, timing, behavior and initial state remain separate JSON objects. There is no executable script or expression language in imported data. Reader navigation state stays outside the saved artifact.

The experimental web profile uses optional scene `mode` (`flow`, `scroll`, `choice`) and `scroll: {axis: "horizontal", distance: 2}`. Distance is bounded to 1–5 viewport travel units; reduced-motion readers get ordinary flow. Known `sontool/choice` content declares labelled target scene IDs. Connected choice groups switch independently while ordinary flow scenes remain visible. Unknown scene modes fall back to reading order. Other timing/layout properties are retained but not interpreted.

Core operations address stable IDs, require an exact base revision, clone before applying a batch and validate before returning it. `content` and `intent` merge one level; omitted keys survive. Structural mutation, deletion, reordering and module replacement require future explicit commands. Undo restores an explicit snapshot at a new monotonic revision and rejects a stale base. It does not provide automatic conflict merging or persistent history by itself.

## Format comparison

UTF-8 JSON wins this small executable slice: inspectable fixtures and identical values in Node and browser, no archive library or path extraction. Embedded base64 assets demonstrate self-contained transport within an 8 MiB file cap. This is unsuitable for large videos. ZIP+manifest is deferred until media packaging warrants its path, compression and size rules. Markdown is a future content importer/exporter; it cannot independently represent all IDs, branches and module payloads.

## Editor and service choices

Puck and GrapesJS were reviewed, not benchmarked. Neither solves portable revision semantics; choosing a large UI before those semantics are tested adds mapping work. This phase implements only a small text-editing lab and modular player. No numerical efficiency advantage is claimed.

The local repository is a test adapter, not a new product database or authentication system. Trusted host identity is injected. A single-file work and owner record is saved with compare-and-swap. There is no hosted identity, backup policy, distributed lock service or multi-user deployment in this phase.

Sonjapgo's existing owner/revision/private-preview boundaries are appropriate reuse targets. Its current input cannot preserve the new artifact. The capability adapter therefore returns `ready: false` with conversion/unsupported reasons; it performs no network call or publication. A draft PR stays unmerged until the user's required actual private-service acceptance can be met or the user explicitly accepts a narrower merge scope.

## Extension direction

Module definitions, renderer maps and service adapters are separate. Installed code supplies module validation, field metadata, allowed AI edits, capability declarations and fallback. Imported files only reference IDs/versions. They cannot install code or grant permissions. A Remotion or FilmCraft adapter must retain source identity/revision and report branching/timing decisions and losses. Media-equivalent output is not promised.
