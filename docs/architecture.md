# SonTool v3.0: direction and bootstrap boundaries

Status: confirmed product direction plus experimental implementation choices. Updated 2026-11-03.

## Intent

People and AI should be able to develop the same creative work across tools without tying its identity to an AI provider or editor. SonTool is a new public AI-native creative engine, separate from SonETool. Public development code and private creative data have different lifecycles and storage boundaries.

## Confirmed product direction

- A common, portable `.sjg` work shared by SonTool GPT and SonTool App.
- SonTool GPT is optimized for ChatGPT. SonTool App permits multiple AI providers and connection to the Sonjapgo app.
- Work → page → scene → block, with content, layout, timing, behavior and state as modular concerns.
- People and AI read and change selected parts; stable IDs, revisions, conflict detection and recovery protect one another's changes.
- Skill and Template capabilities connect through references to their owning systems.
- Sonjapgo connection provides private preview before a separately approved publication.
- Renderers and adapters can later extend to Remotion, FilmCraft and other creative tools.

These are direction and requirements, not evidence that an integration already works.

## Boundaries

| Boundary | Responsibility | Bootstrap status |
| --- | --- | --- |
| Document core | Work identity, format validation, future edit/revision semantics | Draft envelope and parse/serialize only |
| Module contract | Data schema, capabilities, editor/runtime hooks, fallback | Requirements only |
| Renderer | Translate supported content, layout, time and behavior to a medium | Not implemented |
| SonTool GPT / App | Creation experience and provider-specific interaction | Not implemented |
| Service adapters | Authorized storage, Skill/Template resolution, private preview and publication | Not implemented |
| Export adapters | Renderer/tool-specific transformations and loss reports | Not implemented |

Dependencies should point from hosts and adapters toward core contracts. Core must not import provider SDKs, service credentials or a particular renderer. Shared work data does not promise identical interactive behavior in a static video and a website.

## Bootstrap choices

Use a single small Node ESM project and a JSON Schema validator. This makes the document experiment executable without accounts or a UI. Avoid empty application packages, speculative servers, a new database and a custom DSL. See [decision 0001](decisions/0001-bootstrap.md).

Three synthetic fixtures explore landing, scroll and choice structures. They test structural representation and JSON-value restoration only. Behavior references, timing units and layout fields are opaque examples; no renderer interprets them.

## Alternatives left open

Plain JSON is convenient for inspection and initial tests. A ZIP container may better bundle assets; it needs path, size and resource validation. Markdown may be a useful content representation but does not alone express complete timing and interaction. The next phase must compare these using real round-trip examples before stabilizing `.sjg`.

The next phase also compares existing editors and reusable assets against a small purpose-built layer. No framework, CRDT, storage service, renderer or external editor is selected by this bootstrap.

## Acceptance boundaries

Structural validation does not certify module payload meaning, execution safety, reference access, revision freshness or playback. A stored revision integer is not conflict detection. A documented adapter is not a working connection. See the [next-phase acceptance gates](foundation-engineering.md).
