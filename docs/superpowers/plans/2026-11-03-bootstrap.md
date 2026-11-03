# SonTool v3.0 Bootstrap Implementation Plan

> For agentic workers: execute this limited bootstrap task by task in this session. The user has explicitly requested implementation and upload. Future foundation engineering is a separate phase.

**Goal:** Commit a public, verifiable starting point without importing private code or claiming a complete engine.

**Architecture:** A host-independent JSON document experiment, with a local validator and synthetic fixtures. GPT, App, renderers and service adapters remain outside the experiment.

**Tech stack:** ECMAScript modules, Node.js >=22.12.0, Ajv 8.20.0, Node test runner, npm lockfile.

**Spec:** Current user bootstrap request, captured in `docs/architecture.md`; the next engineering phase is specified in `docs/foundation-engineering.md`.

## Global constraints

- Preserve the existing Apache-2.0 LICENSE byte for byte and all existing Git history.
- SonTool v3.0 is independent of SonETool. No private source, user works, credentials or service data.
- Product direction is confirmed; the JSON representation and draft schema are bootstrap engineering choices, not a stable .sjg standard.
- No application, AI provider, publication, deployment, new database or package release in this phase.

## Review focus

- Invalid versions and malformed hierarchy must fail explicitly.
- IDs must be unique across the complete work, not just one sibling array.
- Unknown fields and module data must survive a JSON-value round trip without execution.
- Invalid input must not be silently coerced, repaired or stripped.
- CLI failures must return nonzero and never echo private document contents.

This file is a pre-publication checklist snapshot. Remote commit/readback receipts are recorded in the owning work report and final user report after publication.

## Task 1: Runnable document experiment

**Files:** `package.json`, `package-lock.json`, `schemas/sjg-draft.schema.json`, `src/document.mjs`, `scripts/validate.mjs`, `test/document.test.mjs`, `test/cli.test.mjs`, `examples/*.sjg`.

**Interfaces:** `validateDocument(value) -> {valid, errors}`, `parseDocument(text) -> document`, `serializeDocument(document) -> text`. These are experimental local functions, not MCP operations.

- [x] Write behavioral tests for the review focus and the three fixture families.
- [x] Run `npm test`; observe missing implementation failures.
- [x] Implement schema validation, document-wide unique IDs, parse/serialize and the read-only CLI.
- [x] Run `npm run check`; all tests and all three fixtures must pass.

## Task 2: Documentation and engineering handoff

**Files:** `README.md`, `README.ko.md`, `AGENTS.md`, `CONTRIBUTING.md`, `docs/architecture.md`, `docs/sjg-format.md`, `docs/integrations.md`, `docs/decisions/0001-bootstrap.md`, `docs/foundation-engineering.md`.

**Interfaces:** Documentation links describe Task 1 accurately; deferred features have explicit acceptance criteria.

- [x] Capture confirmed direction, current capabilities, privacy boundaries and open decisions.
- [x] Specify the next Astra engineering phase, including real adapter discovery and acceptance evidence.
- [x] Review local links and the full publication file list; preserve LICENSE.

## Task 3: Publish and read back

**Interfaces:** Existing GitHub `main` head is the parent; no force update or history replacement.

- [x] Run the full local checks and independent review before publishing. Node 22.23.4 and 25.7.0: 23 tests and three fixtures passed; one review finding fixed with a failing-then-passing regression test.
- [ ] Build a Git tree on the existing base tree; include only reviewed files.
- [ ] Create a single commit and fast-forward `main` with an expected-head check.
- [ ] Read the branch, commit and complete file tree back; compare Git blob hashes with local files.
- [ ] Record the result in the existing Sonjapgo project with Task/Work state preserved.
