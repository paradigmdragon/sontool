import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
// The bootstrap API remains JavaScript, independently validating the public envelope.
// @ts-expect-error Legacy module has no declaration file.
import { validateDocument } from "../src/document.mjs";
import {
  applyPatch,
  CoreError,
  exportSjg,
  getElement,
  importSjg,
  MAX_FILE_BYTES,
  restoreRevision,
  validateWork,
  type Work,
} from "../src/core/index.js";

function work(mode = "flow"): Work {
  return {
    schemaVersion: "0.1.0-draft.1",
    title: "기억",
    id: "work-1",
    revision: 0,
    intent: {
      title: "기억",
      purpose: "이웃이 서로의 기억을 이해한다",
      audience: "neighbors",
    },
    pages: [
      {
        id: "page-1",
        scenes: [
          {
            id: "scene-1",
            mode,
            blocks: [
              {
                id: "block-1",
                module: { id: "sontool/text", version: "0.1.0-draft.1" },
                content: { text: "Human text", future: { a: 1 } },
                fallback: "Human text",
              },
            ],
          },
        ],
      },
    ],
    future: { timeline: [1, false, null, "새 필드"] },
  };
}
const code = (value: string) => (error: unknown) =>
  error instanceof CoreError && error.code === value;

test("landing, scrolling and choice structure keep identity and intent across portable .sjg roundtrips", () => {
  for (const mode of ["flow", "scroll", "choice"]) {
    const original = work(mode);
    const restored = importSjg(exportSjg(original));
    assert.deepEqual(restored, original);
    assert.equal(restored.id, "work-1");
    assert.equal(restored.intent!.purpose, original.intent!.purpose);
    assert.notEqual(restored, original);
  }
});

test("unknown fields, module versions and future scene modes survive without normalization", () => {
  const original = work("spatial-future");
  original.pages[0]!.scenes[0]!.blocks[0]!.module.id = "third-party/future";
  original.pages[0]!.scenes[0]!.blocks[0]!.module.version = "9.0.0";
  original.pages[0]!.scenes[0]!.blocks[0]!.future = { timelines: [0, 0.5, 1] };
  assert.deepEqual(importSjg(exportSjg(original)), original);
});

test("partial edits preserve human work and opaque properties; stale AI edit rejected", () => {
  const initial = work();
  const human = applyPatch(initial, {
    baseRevision: 0,
    operations: [
      { id: "block-1", changes: { content: { text: "Human revised" } } },
    ],
  });
  assert.throws(
    () =>
      applyPatch(human, {
        baseRevision: 0,
        operations: [
          { id: "block-1", changes: { content: { color: "#112233" } } },
        ],
      }),
    code("conflict"),
  );
  const ai = applyPatch(human, {
    baseRevision: 1,
    operations: [{ id: "block-1", changes: { content: { color: "#112233" } } }],
  });
  assert.equal(
    (getElement(ai, "block-1") as any).content.text,
    "Human revised",
  );
  assert.deepEqual((getElement(ai, "block-1") as any).content.future, { a: 1 });
  assert.equal(ai.revision, 2);
  assert.equal(
    (getElement(initial, "block-1") as any).content.text,
    "Human text",
  );
});

test("patch batches are atomic and cannot modify identity, hierarchy, or module identity", () => {
  for (const changes of [
    { id: "renamed" },
    { blocks: [] },
    { module: "other" },
    { revision: 20 },
    { pages: [] },
  ]) {
    assert.throws(
      () =>
        applyPatch(work(), {
          baseRevision: 0,
          operations: [{ id: "block-1", changes }],
        }),
      code("invalid_patch"),
    );
  }
  const original = work();
  assert.throws(
    () =>
      applyPatch(original, {
        baseRevision: 0,
        operations: [
          { id: "block-1", changes: { fallback: "changed" } },
          { id: "missing", changes: { fallback: "missing" } },
        ],
      }),
    code("not_found"),
  );
  assert.deepEqual(original, work());
  assert.throws(
    () => applyPatch(original, { baseRevision: 0, operations: [] }),
    code("invalid_patch"),
  );
});

test("getElement and restored snapshots are isolated; undo retains monotonically increasing revision", () => {
  const original = work();
  const element = getElement(original, "block-1") as any;
  element.content.text = "not saved";
  assert.equal(
    (getElement(original, "block-1") as any).content.text,
    "Human text",
  );
  const next = applyPatch(original, {
    baseRevision: 0,
    operations: [{ id: "block-1", changes: { fallback: "next" } }],
  });
  const restored = restoreRevision(next, original, 1);
  assert.deepEqual({ ...restored, revision: 0 }, original);
  assert.equal(restored.revision, 2);
  assert.throws(() => restoreRevision(next, original, 0), code("conflict"));
  assert.throws(
    () => restoreRevision(next, { ...original, id: "other" }, 1),
    code("invalid_document"),
  );
  assert.throws(() => getElement(original, "missing"), code("not_found"));
});

test("validates identity, required structure and supported envelope without losing unknown data", () => {
  for (const value of [
    null,
    {},
    { ...work(), schemaVersion: "future" },
    { ...work(), revision: -1 },
    { ...work(), revision: Number.MAX_SAFE_INTEGER + 1 },
  ]) {
    assert.throws(() => validateWork(value), code("invalid_document"));
  }
  const duplicate = work();
  duplicate.pages[0]!.id = duplicate.id;
  assert.throws(() => validateWork(duplicate), code("invalid_document"));
  const missing = work();
  delete (missing.pages[0]!.scenes[0]!.blocks[0]! as any).content;
  assert.throws(() => validateWork(missing), code("invalid_document"));
});

test("rejects non-JSON values, cycles, prototype-bearing objects, accessors and sparse arrays", () => {
  const circular: any = {};
  circular.self = circular;
  const getter = Object.defineProperty({}, "value", {
    enumerable: true,
    get() {
      throw Error("must not execute");
    },
  });
  const sparse = Array(2);
  sparse[1] = 1;
  for (const invalid of [
    undefined,
    NaN,
    Infinity,
    1n,
    () => 0,
    new Date(),
    circular,
    getter,
    sparse,
  ]) {
    assert.throws(
      () => exportSjg({ ...work(), extra: invalid }),
      code("invalid_document"),
    );
  }
});

test("rejects hostile keys, malformed input and excessive size/depth", () => {
  assert.throws(() => importSjg("{broken"), code("invalid_document"));
  for (const key of ["__proto__", "constructor", "prototype"]) {
    assert.throws(
      () =>
        importSjg(
          JSON.stringify(work()).replace('"future":{', '"' + key + '":{'),
        ),
      code("invalid_document"),
    );
  }
  assert.throws(
    () => importSjg(" ".repeat(MAX_FILE_BYTES + 1)),
    code("invalid_document"),
  );
  let deep: any = {};
  const root = deep;
  for (let i = 0; i < 70; i++) {
    deep.child = {};
    deep = deep.child;
  }
  assert.throws(
    () => exportSjg({ ...work(), extra: root }),
    code("invalid_document"),
  );
});

test("embedded assets roundtrip while module-specific references remain opaque in core", () => {
  const original = work();
  original.assets = { "asset-1": { mime: "image/png", data: "aGVsbG8=" } };
  original.pages[0]!.scenes[0]!.blocks[0]!.content.assetId = "asset-1";
  assert.deepEqual(importSjg(exportSjg(original)), original);
  original.pages[0]!.scenes[0]!.blocks[0]!.module = {
    id: "vendor/remote-media",
    version: "future",
  };
  original.pages[0]!.scenes[0]!.blocks[0]!.content.assetId = "vendor-123";
  assert.deepEqual(importSjg(exportSjg(original)), original);
});

test("rejects duplicate JSON keys including escape aliases instead of silently changing intent", () => {
  const json = exportSjg(work());
  const duplicate = json.replace(
    '"title":"기억"',
    '"title":"original","ti\\u0074le":"replacement"',
  );
  assert.throws(() => importSjg(duplicate), code("invalid_document"));
});

test("rejects integers and negative zero that cannot be safely carried through JSON", () => {
  assert.throws(
    () => exportSjg({ ...work(), future: { number: -0 } }),
    code("invalid_document"),
  );
  assert.throws(
    () =>
      importSjg(
        exportSjg(work()).replace(
          '"revision":0',
          '"revision":0,"big":9007199254740993',
        ),
      ),
    code("invalid_document"),
  );
});

test("rejects JSON objects whose apparent data would be changed or ignored by serialization", () => {
  const nonEnumerable = Object.defineProperty({}, "secret", { value: 1 });
  const symbol = { [Symbol("hidden")]: 1 };
  const extraArray: any = [1];
  extraArray.extra = 2;
  for (const extra of [nonEnumerable, symbol, extraArray]) {
    assert.throws(
      () => exportSjg({ ...work(), extra }),
      code("invalid_document"),
    );
  }
});

test("bootstrap draft compatibility preserves empty works/scenes, optional extensions and module metadata", () => {
  const draft: Work = {
    schemaVersion: "0.1.0-draft.1",
    title: "Draft",
    id: "empty-work",
    revision: 0,
    pages: [],
  };
  assert.deepEqual(importSjg(exportSjg(draft)), draft);
  draft.pages.push({ id: "empty-page", scenes: [] });
  assert.deepEqual(importSjg(exportSjg(draft)), draft);
  draft.pages[0]!.scenes.push({ id: "empty-scene", blocks: [] });
  draft.pages[0]!.scenes[0]!.blocks.push({
    id: "opaque",
    module: { id: "third-party/name", version: "future", source: "inert" },
    content: { opaque: [1, 2] },
  });
  assert.deepEqual(importSjg(exportSjg(draft)), draft);
  const revised = applyPatch(draft, {
    baseRevision: 0,
    operations: [
      { id: draft.id, changes: { intent: { purpose: "A new purpose" } } },
    ],
  });
  assert.equal(revised.intent!.purpose, "A new purpose");
});

test("draft schema layout timing behavior and state extension fields require objects", () => {
  for (const field of ["layout", "timing", "behavior", "state"]) {
    const invalid = work();
    invalid.pages[0]!.scenes[0]![field] = "invalid";
    assert.throws(() => validateWork(invalid), code("invalid_document"));
  }
});

test("untouched bootstrap landing/scroll/choice files preserve all data through the bounded runtime codec", async () => {
  for (const name of ["landing", "scroll", "choice"]) {
    const text = await readFile(
      new URL(`../examples/${name}.sjg`, import.meta.url),
      "utf8",
    );
    const restored = importSjg(exportSjg(importSjg(text)));
    assert.deepEqual(restored, JSON.parse(text));
    assert.equal(validateDocument(restored).valid, true);
  }
});

test("runtime-created and partially edited works remain valid bootstrap draft envelopes", () => {
  for (const mode of ["flow", "scroll", "choice"]) {
    const original = work(mode);
    const revised = applyPatch(original, {
      baseRevision: 0,
      operations: [{ id: "block-1", changes: { content: { text: "Edited" } } }],
    });
    assert.equal(validateDocument(importSjg(exportSjg(revised))).valid, true);
  }
});

test("undo validates the final revision against the file-size limit without changing inputs", () => {
  const snapshot = work();
  snapshot.padding = "";
  const overhead = new TextEncoder().encode(exportSjg(snapshot)).byteLength;
  snapshot.padding = "x".repeat(MAX_FILE_BYTES - overhead);
  assert.equal(
    new TextEncoder().encode(exportSjg(snapshot)).byteLength,
    MAX_FILE_BYTES,
  );
  const current = { ...snapshot, revision: 9 };
  validateWork(current);
  assert.throws(
    () => restoreRevision(current, snapshot, 9),
    code("invalid_document"),
  );
  assert.equal(current.revision, 9);
  assert.equal(snapshot.revision, 0);
});
