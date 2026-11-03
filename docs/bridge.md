# Stateless host bridge

Status: local implementation and subprocess tests. This is not a deployed service, a storage engine or proof of any external account's authorization.

The Node bridge lets another host reuse the public core's exact `.sjg` validation and revision semantics. It reads one UTF-8 JSON request from standard input, writes one JSON response to standard output and exits. It opens no files, starts no server, fetches no URLs and loads no document-selected modules. Build and invoke it with Node.js 22.12.0 or newer:

```sh
npm ci --ignore-scripts
npm run build
node dist/cli.js < request.json
```

Use a configured executable and script path with subprocess arguments, never a shell command assembled from work content. The host owns process timeouts and cancellation. The bridge reads at most 20 MiB of input; the work itself retains the core's 8 MiB limit. UTF-8 decoding is strict and duplicate JSON keys reject. The envelope permits only known fields, and each payload independently satisfies the core's bounded JSON depth/value rules, so wrapping a valid work does not reduce its allowed depth or size. Errors contain fixed messages rather than work values, filesystem paths or stack traces.

## Requests

Import takes the original `.sjg` JSON **string**, so duplicate document keys can be rejected before they are lost by another parser:

```json
{"operation":"import","data":"{\"schemaVersion\":\"0.1.0-draft.1\",\"id\":\"sample\",\"revision\":0,\"title\":\"Example\",\"pages\":[]}"}
```

Read and patch take an already loaded `work` object. The examples below abbreviate that object; the actual request must contain the complete work.

| Operation | Fields besides `operation` | Result |
| --- | --- | --- |
| `import` | `data`: original `.sjg` JSON string | Validated work and module issues |
| `read` | `work`: work object; optional `element_id`: stable ID | Whole work, or only the requested element |
| `patch` | `work`: current work; `patch`: `{baseRevision, operations:[{id, changes}]}` | Complete updated work at the next revision |

Unknown command fields reject to prevent misspelled commands from becoming silent no-ops. Unknown fields **inside a work** remain preserved by the core.

## Controlled edit surface

The bridge is narrower than the trusted low-level `applyPatch` API:

- A work may change `title` and `intent`. Intent merges one level and preserves omitted siblings.
- A registered block may change only `content` properties listed by its installed module's `editableFields`. Content merges one level. The registry is the built-in public registry; imported module declarations never install code.
- A scene may change only `layout.background`, as a solid six-digit hex color such as `#AABBCC`. The bridge merges that field into the current layout, preserving unknown layout siblings. The browser player recognizes the same value and ignores all other imported CSS.
- Page mutations, structure and module changes, unknown-module edits, behavior changes and arbitrary style properties reject. Such features require an explicit later contract.

A batch succeeds atomically or returns no work. `baseRevision` must exactly match the supplied work. The returned revision increases once for the complete batch. A human title edit followed by a fresh AI background edit keeps the title; a background request based on the older revision rejects. No automatic retry or merge hides the conflict.

Known modules with invalid content reject imports and final patch results. Unknown module versions preserve all data and appear as unsupported issues. Reads may inspect an invalid known-module payload and report it, allowing a host to diagnose or repair it. A successful import is not a claim that every module renders.

## Responses and exit status

Success exits `0`:

```json
{"ok":true,"result":{"work_id":"sample","work_revision":0,"module_issues":[],"work":{"schemaVersion":"0.1.0-draft.1","id":"sample","revision":0,"title":"Example","pages":[]}}}
```

A targeted read replaces `work` with `element`; it does not return the complete work. Module issues are `{id,status}` with `status` equal to `unsupported` or `invalid`.

Failure exits `1` and returns no partial result:

```json
{"ok":false,"error":{"code":"conflict","message":"Revision changed; read the current work before editing"}}
```

Codes are `invalid_request`, `invalid_document`, `invalid_patch`, `invalid_module`, `conflict` and `not_found`. Malformed or oversized transport data uses `invalid_request`. Errors deliberately avoid detailed imported values; use local synthetic fixtures to debug a failed contract.

## Host responsibilities

The bridge is stateless. Before invoking it, a host must authenticate the caller, authorize access and load the authoritative current work. After a successful patch it must atomically compare that stored revision again before saving. Checking a client-supplied work's revision alone does not protect concurrent storage writes.

Keep ownership, credentials, approval and publication policy outside `.sjg`. Saving or previewing must not publish. Targeted reads should be used when an AI needs only one element, with host policy also controlling the returned module-issue metadata. The bridge does not establish live Sonjapgo, ChatGPT file-handler or native-app acceptance.

`src/adapters/node-bridge.ts` also exposes the data-only handler for trusted in-process callers. `src/cli.ts` supplies bounded transport. The original structural `scripts/validate.mjs` CLI remains unchanged.
