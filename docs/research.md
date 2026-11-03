# Foundation research and integration boundaries

Reviewed 2026-11-03. This is evidence for the initial architecture, not a claim that every integration has been executed. The new repository started at `f2423f271d9ab0ff476a08a58e14913125109f94` with an Apache-2.0 license and no implementation. A later refresh found bootstrap `bbd95dcd4794c39590b0041f264d41f1a4820506`; it was integrated and its existing draft assets/tests preserved before this branch was prepared. The inspected Sonjapgo source snapshot was `39abde2aa09ff7d33d110ac511eeca65acd92b92`. Its working tree was read only. Private project contents, account identifiers, credentials and operating data are deliberately excluded.

## Evidence levels

- **Exists**: file, declared capability or accessible service was found.
- **Implemented**: the owning source contains the behavior.
- **Measured**: a named operation was actually run in this investigation.
- **Design only**: an integration or behavior is proposed but has no execution evidence.
- **Unverified**: access, dependencies or the required acceptance environment did not establish the behavior. This does not mean it is absent.

| Asset | Evidence | Result and reuse boundary |
| --- | --- | --- |
| Existing project/task/work context | Measured read | The designated project/task and current reports were retrieved before implementation. Historical reports are context, not current acceptance evidence; task-wide completion is not inferred from this foundation. |
| SonEditor | Exists / implemented | Document stores, templates, sequence helpers, publication helpers and tests exist under `frontend/src/SonEditor`. Preserve these and use an explicit migration adapter if needed. |
| SonMode | Exists / implemented | MCP schemas, ACL and service modules exist under `backend/app/modules/sonjapgo_gpt_mcp/sonmode_*`. They operate on existing content/snapshot contracts, not `.sjg`. |
| ScenePlay | Exists / implemented | Frontend work contracts and backend service/router exist. `registerSceneplayPublication.ts` creates public post/meta-page records; it is a publication step, not a private-preview API. It was not called. |
| `@sone/tool` | Exists / implemented; build unverified | Private package version 0.1.0 exports core, React, document, express and transitions. Logical runtime ideas can be reused; the package is not yet proven to be a portable v3 core. |
| SonTool create/update/publish | Exists / implemented | Session ownership, revisions, media ownership, scene source hashes and publication adapters exist. No `.sjg` import contract was found in the inspected service. |
| Private SonTool preview | Exists / implemented; live acceptance unverified | Owner-only preview route and no-store responses exist. This investigation did not create a server draft or prove two-account access. |
| Skill/Template references | Exists / implemented | Canonical semantic lookup and execution-guide traversal return referenced skills/templates and unavailable tools. Asset references should be retained as provenance, not replaced with copied private definitions. |
| Sites | Measured discovery; hosting integration unverified | A read-only site-list request succeeded. Installed platform references describe storage, identity and MCP hosting. No Site was created or deployed for this work. |
| MCP Apps / file editing | Officially documented; `.sjg` integration design only | Official file entrypoints and resource read/write contracts exist. A SonTool handler has not been installed and exercised in ChatGPT. |
| Remotion / Motion provider | Exists / implemented; render unverified | Existing desktop provider invokes an isolated Node renderer. An adapter target is available; no video was rendered for this investigation. |
| FilmCraft | Measured command discovery | Read-only discovery returned 498 enabled command definitions. Export/edit definitions do not prove remote execution authority or `.sjg` import. |
| Puck / GrapesJS | Official docs and licenses reviewed | Both can supply editor UI. Neither has been integrated or benchmarked against a custom SonTool editor. |
| Reverse Engineering Anything | Unverified / optional | No verified executable integration was established. It is not a foundation dependency. |

## Existing SonTool: reuse contracts before copying code

`packages/sone-tool/package.json` declares React 18 and Zustand peers. Its core exports include reveal planning, slot registration/resolution, soft-fail handling and node projections. The React surface contains `BlockRenderer` and `SonEToolSurface`; transitions have reduced-motion handling. These are useful existing behaviors to compare with future renderers.

The existing `ActionDocument` contains document ID, title, blocks and metadata. Its block kinds include paragraph, heading, list, choice and action, with link and presentation/transition metadata. It is not already the proposed work/page/scene/block format. Some core types describe DOM drivers using `HTMLElement`; extracting a host-neutral package requires a deliberate boundary. Existing cross-surface and transition test files were found, but their presence is not a passing run.

One baseline check was attempted: `npm run typecheck` in `packages/sone-tool` exited 127 because `tsc` was unavailable. Dependencies were not installed into the preserved checkout. This is an environment block, not a diagnosed source defect. No package/root reuse license was identified in the inspected paths. Consequently this foundation uses newly written code in the explicitly Apache-2.0 repository and reuses known contracts and design lessons; it does not transplant private implementation into a public repository.

## `.sjg` is a work contract, not a ZIP requirement

| Representation | Strength | Cost | Initial decision |
| --- | --- | --- | --- |
| UTF-8 JSON | Native interchange across JavaScript/Python and AI tool arguments; inspectable diffs; unknown JSON fields can survive round trips | Embedded base64 increases binary size; external references are not self-contained | Use for the bounded foundation, with an explicit format/version and stable IDs. |
| ZIP containing manifest plus assets | Efficient binary packaging; natural multi-file bundle | Additional library and archive/path/size validation; no direct benefit for the small initial fixtures | Reserve for a separately versioned package profile when media sizes justify it. |
| Markdown plus front matter | Friendly prose editing | Layout, timeline, actions, IDs and extensions require an additional convention; source regeneration can lose intent | Use as an import/export module, not the canonical work model. |

The `.sjg` extension identifies the format; the internal version identifies its meaning. JSON serialization can preserve identity, topology, intent metadata, actions and unknown data. It cannot make every renderer implement the same behavior. Preservation must be tested separately from rendering support. A video adapter must state its branch/timing choices and losses; an unsupported module must retain data and show a safe fallback. Unsupported major format versions must not be silently interpreted as current documents.

The initial implementation bounds files to 8 MiB and supports embedded assets. That is a foundation limit, not a claim that video-sized works fit inside a JSON file. A later asset-package profile must preserve the same work and element IDs. Authentication claims and access tokens do not belong in the portable work.

## Private storage and publication boundary

Inspected owning sources: `sontool_public_mcp_service.py`, `backend/app/modules/sontool/preview.py` and its `routers.py`.

The existing MCP service creates owner-associated sessions and returns a revision plus preview URL. Update and publish lock the session row and check the actor. Updates accept commands/media references, or a dedicated scene input containing `post_id`, `source_sha256` and `snapshot`. Scene update requires a base revision, validates the source author's existing public non-magazine post and source hash, and prevents retargeting. Media IDs are checked against the actor. Publishing accepts the existing `sceneplay` or `post` destinations.

The private preview route is `GET /sontool/sessions/{sessionId}/preview`; it requires the owner, returns private visibility and sets `Cache-Control: private, no-store` with authorization/cookie variation. Source-bound previews reject changed source content. These controls are reusable server boundaries. The general command path's optional revision behavior must not weaken v3's mandatory compare-and-swap contract.

The minimum future connection is therefore: authenticate → validate `.sjg` and supported-feature report → create/update a private session using a dedicated importer or renderer reference → retain original file and work/revision mapping → owner-only preview → explicit publication through the existing adapter. Raw `.sjg` cannot simply be supplied to today's scene/command argument and be called supported. Source-hash checks and scene preconditions must not be bypassed by fabricating a legacy snapshot.

The inspected command parser accepts `111 "text" [attributes]` and `112 "background"`. The first replaces one text field; the second changes a background. Neither encodes stable work/page/scene/block IDs, navigation or choice behavior. Reducing all three v3 examples to these commands would be a lossy text preview, not the required work-preserving integration. The legacy scene route also requires an existing public source post, so it cannot serve as a general private-file importer unchanged.

A local owner/revision store test proves only that store's policy. It does not prove Sites identity, Sonjapgo OAuth, server persistence, cross-account denial or a real private draft. Those remain separate acceptance checks before this connection can be described as complete.

Existing `test_sontool_preview.py` covers owner denial, latest preview and source conflict with mocked database operations and an ASGI test app. The database-backed MCP service suite performs writes and cleanup; it must use an isolated disposable test database, never an ambient operating database. Neither suite was run as part of this read-only audit. Without a `.sjg` receiver, the existing private-pipeline acceptance gate remains open even when local foundation tests pass.

## GPT environment: verified contracts and remaining work

Installed Sites skill version 1.1.2 references were inspected: `identity-and-secrets.md`, `storage.md`, `site-mcp-server.md` and `app-integrations.md`. They describe D1 records, R2 objects and trusted hosted identity. The user identifier is stable within one Site and differs across Sites. Application code must authorize each record operation; platform authentication does not automatically give every visitor access to every work. Local and hosted databases differ. A service bearer credential is not a visitor identity or a user's connector grant. Sonjapgo's eligibility as a hosted integration must be discovered explicitly before relying on it.

Sites can host a stateless MCP endpoint and expose declared tools. This supplies a possible GPT workspace host, not a universal database belonging to the user's ChatGPT account. The foundation intentionally does not provision a new database or pretend browser-local storage is cloud persistence.

OpenAI's official extensions documentation includes file viewers/editors and conversation panels. A registered file entrypoint can receive the opened file's resource URI. Availability depends on host support and the installed plugin; a `.sjg` filename alone does not install a handler. [Official extension reference](https://developers.openai.com/plugins/build/extensions).

The official SDK demonstrates resource reads, subscriptions and writes. Resource metadata includes `writable` and `etag`; `ifMatch` supports conflict-aware saves, with `saved`, `conflict` and `too-large` outcomes. Extensions may be unavailable on a host, so feature detection and a download/import fallback are required. A future SonTool adapter should combine host ETag checks with the work revision, re-read on conflict, and never silently overwrite. This contract was read, not exercised against a SonTool file in ChatGPT. [OpenAI MCP Extensions TypeScript SDK](https://github.com/openai/mcp-extensions/blob/main/typescript/README.md#file-extension-handlers).

## Editor alternatives and actual adoption cost

Puck provides a React visual editor with configured components, editable fields, nesting and application-owned data. Its core is MIT licensed. It is a good candidate for a page-layout adapter if future UI work needs drag/drop and property panels. SonTool would still need stable-ID mapping, module fields, undo/conflict integration and preservation of unrecognized data. [Puck documentation](https://puckeditor.com/docs), [data model](https://puckeditor.com/docs/api-reference/data-model/data).

GrapesJS provides a broader HTML/CSS builder and storage abstraction. Its documentation explicitly treats project JSON as persistence; HTML/CSS alone may lose editor information. An adapter therefore must retain editor-specific data separately from the portable model or restrict supported components. The core license is BSD-3-Clause; this finding does not cover every plugin or commercial SDK. [Storage documentation](https://grapesjs.com/docs/modules/Storage.html), [core license](https://raw.githubusercontent.com/GrapesJS/grapesjs/dev/packages/core/LICENSE).

Neither editor was installed or measured. There is no evidence here for a numerical development-time or performance advantage. The initial need is a small renderer and exact partial-edit API, so adding a full editor now would introduce mapping work before its benefits can be measured. Keep editor UI optional; run a bounded three-fixture integration spike when choosing the first full editor.

## Video and local tools

The existing `com.sonjapgo.motion` desktop provider exposes template discovery, preview and render, invokes its owned Node CLI with JSON input and checks renderer dependencies. `packages/motion-renderer` pins Remotion 4.0.532. Its `motion_scene.v1` contract is concrete: bounded duration and layer count, text/card/image/icon/shape/connector layers, and fade/slide/scale/spring/draw animations. This is a useful initial projection target rather than a reason to make the work format a Remotion composition.

Remotion's rendering interface consumes a selected composition, bundled code and input props. A future adapter can produce props plus composition timing, preserving source IDs in its mapping report. Interactive choices and scroll progress require an explicit linearization policy. No full behavioral equivalence is promised. Remotion has conditional licensing for organizational and automated use; check the deployment's license rather than assuming every use is MIT. [Rendering API](https://www.remotion.dev/docs/renderer/render-media), [composition selection](https://www.remotion.dev/docs/renderer/select-composition), [licensing](https://www.remotion.dev/docs/license/pricing).

FilmCraft's live read-only command discovery returned 498 enabled definitions, including interchange export formats EDL/XML/FCPXML/OTIO/AAF/OMF, OTIO export, frame export and templates. No export/import command was executed. The inspected Sonjapgo remote policy permits only `command_list`, `project_inspect`, `sequence_inspect`, `doc_inspect` and `render_frame` for `com.sonjapgo.filmcraft.read`. Local command availability is not remote write permission. A future `.sjg` bridge needs a verified importer or an explicit OTIO/interchange translation with a loss report. Its write transport and acceptance remain unverified.

Premiere also has a distinct existing local provider/bridge. It belongs behind the same capability/adapter boundary; it is not part of the portable engine. No live creative project was modified by this investigation.

## Next acceptance work

1. Exercise the same `.sjg` fixtures through the foundation renderer and a desktop-hosted renderer; distinguish shared-code execution from a native-app acceptance test.
2. Build one optional MCP file handler and verify open, partial edit, ETag conflict, save and reopen using the real host.
3. Implement a dedicated private Sonjapgo importer with server authentication and feature reporting; test owner/non-owner, stale revision, missing media and changed source content before publishing anything.
4. Project one scene through the existing motion renderer and record IDs, timing decisions and omitted interactions. Test FilmCraft writes only after a supported write interface is available and within separately authorized scope.

Foundation tests, type checks and builds belong to the current repository's verification report. They do not retroactively convert the unverified external integrations above into measured success.
