import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { landing } from "../src/examples.js";
import { type Work } from "../src/core/index.js";
import { handleBridgeRequest } from "../src/adapters/node-bridge.js";

interface Reply {
  ok: boolean;
  result?: {
    work?: Work;
    element?: Record<string, unknown>;
    work_id: string;
    work_revision: number;
    module_issues: Array<{ id: string; status: string }>;
  };
  error?: { code: string; message: string };
}
function run(input: unknown, raw = false) {
  const child = spawnSync(process.execPath, ["--import", "tsx", "src/cli.ts"], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    input: raw ? input as string | Buffer : JSON.stringify(input),
    encoding: "utf8",
    maxBuffer: 24 * 1024 * 1024,
    timeout: 10_000,
  });
  assert.match(child.stdout ?? "", /^\{/, "CLI must return one JSON response");
  return { ...child, reply: JSON.parse(child.stdout) as Reply };
}
function success(input: unknown) {
  const child = run(input);
  assert.equal(child.status, 0, child.stdout);
  assert.equal(child.reply.ok, true);
  assert.equal(child.stderr, "");
  return child.reply.result!;
}

test("bridge imports strict .sjg and reports unknown modules without changing source identity or data", () => {
  const work = structuredClone(landing);
  work.future = { source: "synthetic" };
  const block = work.pages[0]!.scenes[0]!.blocks[0]!;
  block.module = { id: "future/remote", version: "9" };
  block.content = { assetId: "vendor-123", future: { enabled: false } };
  const result = success({ operation: "import", data: JSON.stringify(work) });
  assert.deepEqual(result.work, work);
  assert.equal(result.work_id, "landing");
  assert.equal(result.work_revision, 0);
  assert.deepEqual(result.module_issues, [{ id: "title", status: "unsupported" }]);
});

test("targeted bridge read returns only the requested element and full read retains the work", () => {
  const result = success({ operation: "read", work: landing, element_id: "body" });
  assert.equal(result.element?.id, "body");
  assert.equal(Object.hasOwn(result, "work"), false);
  assert.deepEqual(success({ operation: "read", work: landing }).work, landing);
  const missing = run({ operation: "read", work: landing, element_id: "missing" });
  assert.equal(missing.status, 1);
  assert.equal(missing.reply.error?.code, "not_found");
});

test("bridge background edit preserves human title, intent, opaque layout siblings and revision CAS", () => {
  const work = structuredClone(landing);
  work.pages[0]!.scenes[0]!.layout = { background: "#112233", vendor: { depth: 3 } };
  const human = success({ operation: "patch", work, patch: {
    baseRevision: 0,
    operations: [{ id: "landing", changes: { title: "Human title", intent: { audience: "neighbors" } } }],
  } }).work!;
  const result = success({ operation: "patch", work: human, patch: {
    baseRevision: 1,
    operations: [{ id: "welcome", changes: { layout: { background: "#AABBCC" } } }],
  } });
  assert.equal(result.work_revision, 2);
  assert.equal(result.work!.title, "Human title");
  assert.deepEqual(result.work!.intent, { purpose: "Invite neighbors to make a shared garden", audience: "neighbors" });
  assert.deepEqual(result.work!.pages[0]!.scenes[0]!.layout, { background: "#AABBCC", vendor: { depth: 3 } });
  assert.deepEqual(result.work!.pages[0]!.scenes[0]!.blocks, work.pages[0]!.scenes[0]!.blocks);
  const stale = run({ operation: "patch", work: human, patch: {
    baseRevision: 0,
    operations: [{ id: "welcome", changes: { layout: { background: "#000000" } } }],
  } });
  assert.equal(stale.status, 1);
  assert.equal(stale.reply.error?.code, "conflict");
  assert.equal(Object.hasOwn(stale.reply, "result"), false);
});

test("bridge content edits respect the installed module edit surface and preserve opaque siblings", () => {
  const work = structuredClone(landing);
  work.pages[0]!.scenes[0]!.blocks[0]!.content.vendor = { note: "keep" };
  const result = success({ operation: "patch", work, patch: {
    baseRevision: 0, operations: [{ id: "title", changes: { content: { text: "Updated" } } }],
  } });
  assert.deepEqual(result.work!.pages[0]!.scenes[0]!.blocks[0]!.content, { text: "Updated", vendor: { note: "keep" } });
  for (const changes of [{ content: { vendor: "overwrite" } }, { behavior: { execute: "no" } }, { module: { id: "unknown", version: "1" } }]) {
    const child = run({ operation: "patch", work, patch: { baseRevision: 0, operations: [{ id: "title", changes }] } });
    assert.equal(child.status, 1);
    assert.equal(child.reply.error?.code, "invalid_patch");
  }
  work.pages[0]!.scenes[0]!.blocks[0]!.module.id = "future/unknown";
  const unknown = run({ operation: "patch", work, patch: { baseRevision: 0, operations: [{ id: "title", changes: { content: { text: "Changed" } } }] } });
  assert.equal(unknown.reply.error?.code, "invalid_patch");
});

test("bridge rejects invalid known modules on import and invalid atomic patch batches", () => {
  const work = structuredClone(landing);
  work.pages[0]!.scenes[0]!.blocks[0]!.content.text = 42;
  const imported = run({ operation: "import", data: JSON.stringify(work) });
  assert.equal(imported.status, 1);
  assert.equal(imported.reply.error?.code, "invalid_module");
  const patched = run({ operation: "patch", work: landing, patch: {
    baseRevision: 0, operations: [
      { id: "landing", changes: { title: "Must not escape" } },
      { id: "title", changes: { content: { text: 42 } } },
    ],
  } });
  assert.equal(patched.status, 1);
  assert.equal(patched.reply.error?.code, "invalid_module");
  assert.equal(Object.hasOwn(patched.reply, "result"), false);
});

test("bridge background edit rejects CSS URLs, non-scene targets and extra layout changes", () => {
  for (const [id, layout] of [
    ["welcome", { background: "url(https://example.invalid/private)" }],
    ["welcome", { background: "#123" }],
    ["welcome", { background: "#112233", width: 100 }],
    ["title", { background: "#112233" }],
    ["landing-page", { background: "#112233" }],
  ]) {
    const child = run({ operation: "patch", work: landing, patch: {
      baseRevision: 0, operations: [{ id, changes: { layout } }],
    } });
    assert.equal(child.status, 1);
    assert.equal(child.reply.error?.code, "invalid_patch");
  }
});

test("bridge rejects duplicate keys in both raw works and transport without echoing private content", () => {
  const sentinel = "PRIVATE_SENTINEL_DO_NOT_ECHO";
  for (const text of [
    `{\"operation\":\"import\",\"operation\":\"read\",\"secret\":\"${sentinel}\"}`,
    `{\"operation\":\"import\",\"data\":${JSON.stringify(JSON.stringify(landing).replace('"revision":0', '"revision":0,"revision":1'))}}`,
    `{\"operation\":\"read\",\"work\":${JSON.stringify(landing).replace('"title":"A garden together"', '"title":"A garden together","title":"' + sentinel + '"')}}`,
    `{\"operation\":\"read\",\"work\":\"${sentinel}\"}`,
    `not json ${sentinel}`,
  ]) {
    const child = run(text, true);
    assert.equal(child.status, 1);
    assert.equal(child.reply.ok, false);
    assert.ok(child.stdout.length < 300);
    assert.equal((child.stdout + child.stderr).includes(sentinel), false);
  }
});

test("bridge rejects malformed commands and invalid UTF-8 as bounded machine-readable failures", () => {
  for (const input of [null, { operation: "fetch", url: "https://example.invalid" }, { operation: "read", work: landing, elemnt_id: "title" }, { operation: "patch", work: landing, patch: { baseRevision: 0, operations: [] } }]) {
    const child = run(input);
    assert.equal(child.status, 1);
    assert.equal(child.reply.ok, false);
    assert.ok(child.stdout.length < 300);
  }
  const invalidUtf8 = run(Buffer.from([0xff, 0xfe]), true);
  assert.equal(invalidUtf8.status, 1);
  assert.equal(invalidUtf8.reply.error?.code, "invalid_request");
});

test("bridge bounds transport bytes before processing oversized requests", () => {
  const child = run(" ".repeat(20 * 1024 * 1024 + 1), true);
  assert.equal(child.status, 1);
  assert.equal(child.reply.error?.code, "invalid_request");
  assert.ok(child.stdout.length < 300);
});

test("bridge import then read and patch retain the core work depth and value-count boundaries", () => {
  let nested: unknown = null;
  for (let i = 0; i < 63; i++) nested = { child: nested };
  for (const future of [nested, Array.from({ length: 99_993 }, () => null)]) {
    const work: Work = { schemaVersion: "0.1.0-draft.1", id: "boundary", revision: 0, title: "Boundary", pages: [], future };
    assert.deepEqual(success({ operation: "import", data: JSON.stringify(work) }).work, work);
    assert.deepEqual(success({ operation: "read", work }).work, work);
    const changed = success({ operation: "patch", work, patch: { baseRevision: 0, operations: [{ id: "boundary", changes: { title: "Changed" } }] } }).work!;
    assert.equal(changed.revision, 1);
    assert.equal(changed.title, "Changed");
    assert.deepEqual(changed.future, future);
  }
});

test("in-process bridge rejects request accessors without invoking them", () => {
  let called = false;
  const request = { get operation() { called = true; return "read"; }, work: landing };
  const response = handleBridgeRequest(request);
  assert.equal(response.ok, false);
  assert.equal(called, false);
});
