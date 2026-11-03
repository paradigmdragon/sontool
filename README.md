# SonTool v3.0

**A shared creative foundation for people and AI to build portable works.**

[한국어](README.ko.md) · [Architecture](docs/architecture.md) · [Research](docs/research.md) · [Verification and open gates](docs/verification.md)

SonTool is a separate public project from the existing SonETool. Its direction is a common creative core used by SonTool GPT, SonTool App and independent media adapters. A work's identity and source data should survive moving between those environments. Different renderers do not promise identical experiences.

## Current status: experimental foundation, external acceptance open

This branch extends the original `0.1.0-draft.1` JSON envelope. It is not a stable format release or a deployed creative service.

| Implemented and locally tested | Not established |
| --- | --- |
| Bounded `.sjg` import/export, stable IDs, unknown-data preservation | Large-media packaging or stable migration policy |
| Atomic partial edits, exact revision checks, snapshot undo | Persistent edit history or concurrent automatic merging |
| Module registry, text/image/choice modules, inactive fallback | Untrusted plugin sandbox or a full visual editor |
| Landing, horizontal scroll and choice playback in a browser | Native app, Remotion or FilmCraft acceptance |
| Local private store and HTTP identity/CAS tests | Real Sonjapgo OAuth/private `.sjg` receiver |
| Browser edit/export/import lab | Installed ChatGPT file handler or hosted Sites workspace |

The original validator, CLI and three bootstrap fixtures remain available. Runtime examples are separate. [Execution-profile restrictions](docs/sjg-format.md#bounded-foundation-execution-profile) can reject a file that passes the original structural validator; rejection never silently repairs the file. The existing timing/behavior hints are preserved, not automatically reinterpreted as supported playback.

## Run locally

Use Node.js 22.12.0 or newer and npm. No AI account, API key or external service is needed.

```sh
git clone https://github.com/paradigmdragon/sontool.git
cd sontool
npm ci --ignore-scripts
npm run check
npm run demo
```

Open `http://127.0.0.1:4173`. The lab edits in memory and exports `.sjg` files. It has no cloud persistence or publication action. Refreshing without exporting loses those local edits.

`npm run check` runs type checking, original and runtime behavioral tests, a library/browser build and validation of all six fixtures. `npm run validate -- /path/to/work.sjg` retains the original **structural** CLI; it is not a playback or authorization check.

## Structure

```text
src/document.mjs       Preserved bootstrap validator and codec
schemas/               Original experimental structural schema
src/core/              Portable bounded codec, validation, IDs, edits and undo
src/modules.ts         Trusted installed module contracts and permitted edits
src/web/renderer.ts    Framework-independent DOM player
src/adapters/          Local test storage/HTTP; Sonjapgo capability report
examples/              Original fixtures; runtime/ adds playable examples
demo/                  Small local editing and playback lab
test/, tests/          Bootstrap compatibility and runtime behavior tests
docs/                  Decisions, research, module guide and acceptance evidence
```

See [module development](docs/modules.md), [runtime decision](docs/decisions/0002-foundation-runtime.md), [integration boundaries](docs/integrations.md) and [remaining engineering criteria](docs/foundation-engineering.md). Unknown modules retain their data without running downloaded code. Service credentials and access policy belong to hosts, never to imported works.

## License and contribution

[Apache-2.0](LICENSE), unchanged from repository creation. Dependencies are installed from npm with their own licenses. No private SonETool implementation was copied. Read [AGENTS.md](AGENTS.md) and [contribution rules](CONTRIBUTING.md). Only synthetic works belong in this repository.
