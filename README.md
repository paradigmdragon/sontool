# SonTool v3.0

**An open, AI-native creative engine for people and AI to build portable works.**

[한국어](README.ko.md) · [Architecture](docs/architecture.md) · [Next engineering brief](docs/foundation-engineering.md)

SonTool is a new public project, separate from the existing **SonETool**. Its direction is a shared creative core for interactive stories, pages and multimedia experiences. A portable `.sjg` work should move between **SonTool GPT**, a ChatGPT-specific creation environment, and **SonTool App**, an environment for multiple AI providers and the Sonjapgo app.

## Current status: repository bootstrap

This repository is a small, working document experiment and an engineering handoff. **It is not a released SonTool v3.0 engine or editor.**

| Available now | Planned and not implemented |
| --- | --- |
| Experimental JSON `.sjg` envelope and validator | Stable portable format and migration policy |
| Parse/serialize with document-wide unique IDs | Targeted edits, revisions, conflict rejection and undo |
| Three synthetic fixtures and a read-only validation CLI | Web playback and modular editor/runtime |
| Behavioral tests and locked dependencies | GPT/App interfaces, Skill/Template lookup and service adapters |
| Architecture and engineering acceptance criteria | Private preview, approved publication, Remotion/FilmCraft integration |

The fixtures show candidate data shapes for landing, scroll and choice works. They do not demonstrate playback, navigation, layout fidelity or compatibility with any existing service.

## Run locally

Use Node.js **22.12.0 or newer** and npm. No AI account, API key, server or database is required.

```sh
git clone https://github.com/paradigmdragon/sontool.git
cd sontool
npm ci --ignore-scripts
npm run check
```

Validate your own local draft:

```sh
npm run validate -- /path/to/work.sjg
```

The command reads files locally, performs no uploads and returns a nonzero exit status on failure. `npm run check` runs the tests and validates all three public fixtures. There is no application build step yet.

## Structure

```text
src/document.mjs               Experimental parse, validate and serialize functions
schemas/sjg-draft.schema.json  Draft structural envelope
scripts/validate.mjs           Local validation CLI
examples/                     Synthetic, public .sjg fixtures
test/                         Behavioral and CLI checks
docs/                         Architecture, contracts, decisions and next-phase brief
```

The candidate model is **work → page → scene → block**, with separate content, layout, timing, behavior and state data. Core data must remain independent of AI providers, renderers and publication services. Unknown module payloads are preserved as inert data; support is never inferred from successful envelope validation.

## Start the foundation engineering phase

Read [AGENTS.md](AGENTS.md), [architecture](docs/architecture.md), [draft format](docs/sjg-format.md), [integration boundaries](docs/integrations.md) and the [foundation engineering brief](docs/foundation-engineering.md). The brief gives the next Codex Astra Ultra session concrete research, implementation and acceptance requirements. It does not depend on a model brand or claim that selecting a model completes any work.

Public code and private creative data are separate. Only synthetic works belong in this repository. See [contribution rules](CONTRIBUTING.md); `.gitignore` is a convenience, not a privacy guarantee.

## License

[Apache-2.0](LICENSE). The license selected when the repository was created is preserved unchanged. Third-party dependencies retain their own licenses; Ajv and the dependencies recorded in `package-lock.json` are installed through npm, not copied into this repository.
