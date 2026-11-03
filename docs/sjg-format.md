# Experimental .sjg envelope

Status: **draft experiment**, version `0.1.0-draft.1`. Product name v3.0 does not mean format version 3.0.

## Representation

For this bootstrap, `.sjg` is UTF-8 JSON. It is not a ZIP container and embeds no media. Plain JSON, ZIP plus a manifest, and content-oriented forms remain candidates for the future stable format.

```json
{
  "schemaVersion": "0.1.0-draft.1",
  "id": "example-work",
  "revision": 0,
  "title": "A work",
  "pages": [{
    "id": "example-page",
    "scenes": [{
      "id": "example-scene",
      "blocks": [{
        "id": "example-text",
        "module": { "id": "sontool/text", "version": "0.1.0-draft.1" },
        "content": { "text": "Hello" }
      }]
    }]
  }]
}
```

The [JSON Schema](../schemas/sjg-draft.schema.json) defines the structural rules. A work has `id`, `schemaVersion`, nonnegative safe-integer `revision`, nonempty `title` and `pages`. Pages contain scenes; scenes contain blocks. Empty collections are permitted for drafts. IDs are 1–128 characters, start with an ASCII letter or digit, and then allow letters, digits, `.`, `_`, `:` and `-`. IDs are unique across the work, its pages, scenes and blocks. This draft does not prescribe how IDs are generated or how copies receive new IDs.

A block requires a versioned module reference and an object `content`. Scenes and blocks may also contain object-valued `layout`, `timing`, `behavior` and `state`. Those payloads are intentionally not a new behavior language. Their semantics, reference rules, timing units and validation belong to the future module contract.

## Local API

`src/document.mjs` exports:

- `validateDocument(value)` → `{ valid: boolean, errors: Array<{ path, keyword, message }> }`; validates without coercing, stripping or repairing input.
- `parseDocument(text)` → document; JSON syntax errors throw `SyntaxError`, structural errors throw `TypeError` with `.errors`.
- `serializeDocument(document)` → formatted JSON text; invalid or non-JSON data throws `TypeError`.

The API rejects unsupported schema versions. Within the supported draft, unknown fields and module payloads are preserved as inert JSON data. Validation does not load modules, fetch references, render HTML or execute behavior.

Restoration means JSON data equality, not byte equality: formatting, key representation and numeric spelling may change. Numbers use JavaScript's finite-number precision; arbitrary-precision decimal or large-integer fidelity is not promised. Do not use this experiment for archival or production import. Strict resource limits, hostile-input handling and signed/hashed manifests remain next-phase work.

## Not implemented

Module-payload validation, dangling-reference checks, media packaging, import limits, migration, history, partial updates, revision comparison, conflict resolution, undo and publication. In particular, accepting an unknown module means preserving its data, not supporting its playback.

## Implementation references

The schema uses [JSON Schema 2020-12 through Ajv](https://ajv.js.org/json-schema.html). Tests use the [Node.js test runner](https://nodejs.org/api/test.html). Ajv is pinned in `package.json`; install exact transitive versions with `npm ci`.
