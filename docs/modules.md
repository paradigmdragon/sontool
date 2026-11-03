# Developing a foundation module

The module registry contains **trusted installed application code**. It is not a sandbox or remote package loader. Files reference a module by `{id, version}`; unknown versions stay inert and retain their JSON payload.

```ts
import { ModuleRegistry, moduleKey } from '../src/modules.js';
const registry = new ModuleRegistry();
registry.register({
  id: 'example/badge', version: '1',
  fields: { label: { type: 'string', label: 'Label' } },
  editableFields: ['label'], capabilities: [], fallback: 'Badge',
  validate: content => typeof content.label === 'string'
});
```

`fields` describes potential editor controls; `validate` is authoritative for module content. There is no generic editor generator yet. `editableFields` constrains `patchBlockContent`; low-level `applyPatch` is a trusted structural operation and must not be exposed as an unrestricted AI tool. All calls still require the exact base revision. Failed validation returns no modified work.

Register web playback separately in a `WebRenderers` map using `moduleKey(id, version)`, then pass the map to `mountWork`. This tuple key avoids ambiguous IDs containing separators. A renderer receives its block, a frozen work snapshot, the DOM document and navigation callback. Use safe DOM construction (`textContent`); never treat imported text as HTML. Add custom entries to `defaultWebRenderers()` to retain built-ins. Missing or throwing renderers show inert fallback text without altering the source artifact.

The initial built-ins are `sontool/text`, `sontool/image`, and `sontool/choice` at version `0.1.0-draft.1`. Image playback allows embedded PNG/JPEG/WebP/GIF, not SVG or remote URLs. Choice validation checks each target exists. Reader state is separate from work data. The unknown-module fallback is explicit; accepting its envelope does not validate or execute its payload.

Capabilities are declarations for the host to review. They do not grant file, network, device or publication access. This phase has no external-dependency resolver, custom editor loading or module isolation. Such functions belong to a later host adapter, never automatic import side effects.

Module checks to add: valid/invalid payload, exact-version lookup, extra unknown fields retained, allowed/forbidden edits, missing renderer, fallback and roundtrip equality. Core code must not change to add a module. `tests/renderer.test.ts` exercises a custom badge with its own registry and renderer.
