# 0001 — A small executable document experiment

Date: 2026-11-03. Status: accepted **for bootstrap only**; proposed by the implementing AI within the user's authorized preparation scope.

## Context

The user created a separate public `paradigmdragon/sontool` repository for SonTool v3.0 and requested a minimal, verifiable foundation for the next engineering phase. The existing default branch contained only an Apache-2.0 LICENSE. The task is preparation, not the full creative engine or a service deployment.

## Decision

Preserve the existing LICENSE and history. Add bilingual READMEs, development rules, architectural boundaries, a next-phase engineering brief and a small draft document experiment.

Use ESM JavaScript on Node.js >=22.12.0, Ajv 8.20.0 with a lockfile, JSON Schema 2020-12 and the built-in Node test runner. The schema is the structural authority; handwritten checks add JSON-data admissibility and document-wide ID uniqueness. No duplicated type system, frontend framework, new database, provider SDK or monorepo scaffold.

Use UTF-8 JSON for experimental `.sjg` files, clearly versioned `0.1.0-draft.1`. Keep opaque module payloads and unknown fields. Do not implement arbitrary actions, publication or a speculative patch engine at bootstrap.

## Alternatives

- Documents only: small, but provides no executable development baseline.
- A full editor or server scaffold: increases unvalidated commitments before the format and adapters are investigated.
- ZIP/media packaging now: adds asset/path/resource rules before there is evidence for the container design.
- TypeScript/workspaces now: reasonable later, but unnecessary toolchain and package boundaries for this small experiment.

## Consequences

The next engineer has commands, behavioral checks and fixtures to extend. The draft's layout, timing, behavior and state data have no playback semantics yet. Ajv compilation in a browser/CSP-constrained host needs separate validation or a precompiled alternative. The framework, persistence, module API, stable container and revision protocol remain open.

No private SonETool/Sonjapgo source was reused. This reduces disclosure risk but does not settle the later reuse decision. Future reuse still requires functional and licensing inspection. The repository is private to npm publishing through `package.json`'s `private: true`; publishing a package needs a separate decision.
