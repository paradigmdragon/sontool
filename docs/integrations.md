# Integration boundaries

Status: requirements and discovery notes; **no service adapter is implemented**.

## Current evidence

On 2026-11-03 the connected Sonjapgo tool catalog exposed `sontool_create`, `sontool_update` and `sontool_publish`. This bootstrap inspected the published input schemas only. The create input was empty, update accepted a broad object, and publish described a session, title and `sceneplay`/`post` target. Those schemas do not establish file transport, response shape, authentication behavior, approval enforcement or deployed .sjg support. No create, update or publish command was executed.

The catalog is a discovery lead, not a copied API specification. The next engineer must reread its current guide and full tool contract, inspect the authorized owning implementation if available, and verify behavior with explicit test-account scope. Older SonTool/SonETool source has not been imported or audited by this bootstrap. Do not infer a license or a working capability from a name.

## SonTool GPT and SonTool App

Both hosts should use the same versioned work model and core editing semantics. Provider-specific prompts, SDKs, sessions and UI belong outside the core. File access and interactive UI support must be verified in each actual host; this repository does not claim current ChatGPT Sites, MCP Apps or any provider can already open this draft.

Adapter discovery must answer: which calls exist, their inputs and outputs, supported schema/module versions, authorization requirements, error/conflict behavior and account-specific limitations. Treat an unsupported capability as explicit unavailability; never silently drop a scene or replace a user's work.

## Skill and Template references

Prefer references resolved by their owning system, rather than copying private bodies into a portable file. Define stable identity, requested revision, resolution provenance and access requirements before implementing a resolver. Missing or unauthorized references must remain visible and preserved; a resolver must not turn a read failure into an empty replacement. Do not include access tokens, session IDs or private lookup results in public fixtures.

Names and exact wire fields are not fixed by this document. Use the current owning Skill/Template contract and preserve Meaning/Skill/Template relationships when available. A referenced skill is not authorization to execute it.

## Private storage, preview and approved publication

The future Sonjapgo adapter should validate and save a private draft, return a preview tied to the exact revision, and use a separate, explicitly approved publication operation. Implement these as capabilities of existing services wherever possible; these are not proposed new MCP tool names.

Acceptance must demonstrate:

1. The authorized owner can save, reread and preview the same revision.
2. A different account and an anonymous caller cannot read or mutate the private work under the applicable service policy.
3. A stale write is rejected without partial changes.
4. Supported, converted and unsupported module features appear in a capability/loss report.
5. Saving or previewing does not publish. Approval is checked by the server against actor, target and reviewed revision; a changed revision needs fresh approval.

This phase contains no endpoint calls, credentials, server or publication implementation. A `.sjg` field such as `approved: true` cannot grant authority. Public-code upload is separate from publishing a creative work.

## Module and export contracts to investigate

A module should identify its version, data schema, optional editor/runtime entry points, dependencies, capabilities, allowed edit surface and fallback. Imported data must not automatically install or execute a module. Test unknown-module retention and an explicit inactive fallback before adding remote module loading.

Remotion, FilmCraft and other tools should receive an authorized, versioned snapshot through an adapter and return artifacts plus provenance, source revision and conversion/loss information. A rendered MP4 cannot preserve every interactive choice. Verify actual tool existence, licensing, accepted formats and read/write support before implementing an adapter or promising a round trip.
