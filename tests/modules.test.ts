import test from "node:test";
import assert from "node:assert/strict";
import {
  ModuleRegistry,
  defaultRegistry,
  checkModules,
  patchBlockContent,
} from "../src/modules.js";
import { landing, scrollStory, choiceStory } from "../src/examples.js";

test("three works have valid registered modules and references", () => {
  for (const work of [landing, scrollStory, choiceStory])
    assert.deepEqual(checkModules(work, defaultRegistry()), []);
});
test("registration is versioned; unknown module preserved and reported", () => {
  const r = new ModuleRegistry();
  const definition = {
    id: "custom.badge",
    version: "1",
    editableFields: ["label"],
    fields: { label: { type: "string" } },
    capabilities: [],
    fallback: "badge",
    validate: (p: Record<string, unknown>) => typeof p.label === "string",
  };
  r.register(definition);
  assert.ok(r.get("custom.badge", "1"));
  assert.equal(r.get("custom.badge", "2"), undefined);
  assert.throws(() => r.register(definition));
  const w = structuredClone(landing);
  w.pages[0]!.scenes[0]!.blocks[0]!.module = {
    id: "future.hologram",
    version: "1",
  };
  assert.equal(checkModules(w, r)[0]?.status, "unsupported");
});
test("AI edits only declared fields; stale edits reject; unknown siblings retained", () => {
  const r = defaultRegistry();
  const w = structuredClone(landing);
  w.pages[0]!.scenes[0]!.blocks[0]!.content.future = { color: "green" };
  const human = patchBlockContent(w, "title", { text: "human title" }, 0, r);
  assert.throws(() =>
    patchBlockContent(human, "body", { text: "stale AI" }, 0, r),
  );
  const ai = patchBlockContent(human, "body", { text: "AI body" }, 1, r);
  assert.equal(ai.pages[0]!.scenes[0]!.blocks[0]!.content.text, "human title");
  assert.deepEqual(ai.pages[0]!.scenes[0]!.blocks[0]!.content.future, {
    color: "green",
  });
  assert.throws(() => patchBlockContent(ai, "title", { future: 1 }, 2, r));
});
test("broken choice target is reported, not silently accepted", () => {
  const w = structuredClone(choiceStory);
  w.pages[0]!.scenes[0]!.blocks[1]!.content.options = [
    { label: "Broken", targetSceneId: "absent" },
  ];
  assert.equal(checkModules(w, defaultRegistry())[0]?.status, "invalid");
});

test("module identity cannot alias through separators and metadata cannot mutate registry", () => {
  const r = new ModuleRegistry();
  r.register({
    id: "custom@v",
    version: "1",
    editableFields: ["text"],
    fields: { text: { type: "string" } },
    capabilities: [],
    fallback: "custom",
    validate: () => true,
  });
  assert.equal(r.get("custom", "v@1"), undefined);
  assert.throws(() => {
    r.get("custom@v", "1")!.fields.text!.type = "number";
  });
});
test("known image reference is validated while opaque modules retain their own asset namespace", () => {
  const w = structuredClone(landing);
  const b = w.pages[0]!.scenes[0]!.blocks[0]!;
  b.module = { id: "sontool/image", version: "0.1.0-draft.1" };
  b.content = { assetId: "absent", alt: "image" };
  assert.equal(checkModules(w, defaultRegistry())[0]?.status, "invalid");
  w.assets = {};
  b.content.assetId = "toString";
  assert.equal(checkModules(w, defaultRegistry())[0]?.status, "invalid");
  b.module = { id: "future/remote", version: "9" };
  assert.equal(checkModules(w, defaultRegistry())[0]?.status, "unsupported");
});
