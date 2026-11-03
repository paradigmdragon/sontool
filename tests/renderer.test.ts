import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import {
  mountWork,
  scrollProgress,
  defaultWebRenderers,
} from "../src/web/renderer.js";
import { defaultRegistry, moduleKey } from "../src/modules.js";
import { landing, scrollStory, choiceStory } from "../src/examples.js";
import { exportSjg, importSjg } from "../src/core/index.js";
function host() {
  const dom = new JSDOM("<main></main>");
  return { dom, root: dom.window.document.querySelector("main")! };
}
test("scene background paints only a six-digit hex color while retaining title and source layout", () => {
  const w = structuredClone(landing);
  w.title = "Human title";
  w.pages[0]!.scenes[0]!.layout = { background: "#AABBCC", vendor: { preserve: true } };
  const before = exportSjg(w);
  const { root } = host();
  mountWork(root, w, defaultRegistry());
  assert.equal(root.querySelector<HTMLElement>("[data-scene-id=welcome]")!.style.backgroundColor, "rgb(170, 187, 204)");
  assert.equal(root.querySelector("h1")!.textContent, "Human title");
  assert.equal(exportSjg(w), before);
});
test("scene background does not execute imported CSS URLs or general style properties", () => {
  const w = structuredClone(landing);
  w.pages[0]!.scenes[0]!.layout = { background: "url(https://example.invalid/private)", color: "red" };
  const { root } = host();
  mountWork(root, w, defaultRegistry());
  const scene = root.querySelector<HTMLElement>("[data-scene-id=welcome]")!;
  assert.equal(scene.style.background, "");
  assert.equal(scene.style.color, "");
});
test("all fixtures render after file roundtrip with stable IDs and intent", () => {
  for (const w of [landing, scrollStory, choiceStory]) {
    const { root } = host();
    const p = mountWork(root, importSjg(exportSjg(w)), defaultRegistry());
    assert.equal(root.querySelector("h1")?.textContent, w.title);
    assert.equal(
      root.querySelectorAll("[data-block-id]").length,
      w.pages.flatMap((p) => p.scenes.flatMap((s) => s.blocks)).length,
    );
    p.destroy();
  }
});
test("choice action changes visible scene and session state without changing artifact", () => {
  const { root, dom } = host();
  const before = exportSjg(choiceStory);
  const player = mountWork(root, choiceStory, defaultRegistry());
  assert.equal(
    root.querySelector<HTMLElement>("[data-scene-id=plant]")?.hidden,
    true,
  );
  root
    .querySelector("button")!
    .dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  assert.equal(
    root.querySelector<HTMLElement>("[data-scene-id=plant]")?.hidden,
    false,
  );
  assert.equal(player.state.currentSceneId, "plant");
  assert.equal(exportSjg(choiceStory), before);
});
test("unknown module and unsafe text produce inert fallback", () => {
  const w = structuredClone(landing);
  const b = w.pages[0]!.scenes[0]!.blocks[0]!;
  b.module = { id: "unknown.module", version: "1" };
  b.fallback = "<img src=x onerror=alert(1)>";
  const { root } = host();
  mountWork(root, w, defaultRegistry());
  assert.equal(root.querySelector("img"), null);
  assert.ok(root.textContent?.includes(b.fallback));
});
test("scroll position clamps and reduced motion keeps narrative order", () => {
  assert.equal(scrollProgress(10, 100), 0);
  assert.equal(scrollProgress(-50, 100), 0.5);
  assert.equal(scrollProgress(-200, 100), 1);
  const { root } = host();
  mountWork(root, scrollStory, defaultRegistry(), { reducedMotion: true });
  assert.equal(
    root.querySelector(".sjg-scroll")?.classList.contains("sjg-reduced"),
    true,
  );
});

test("choice groups do not hide flow introductions or other pages", () => {
  const w = structuredClone(choiceStory);
  w.pages[0]!.scenes.unshift({
    id: "intro",
    blocks: [
      {
        id: "intro-text",
        module: { id: "sontool/text", version: "0.1.0-draft.1" },
        content: { text: "Before the choice" },
      },
    ],
  });
  w.pages.push({ id: "footer", scenes: [{ id: "footer-scene", blocks: [] }] });
  const { root, dom } = host();
  mountWork(root, w, defaultRegistry());
  assert.equal(
    root.querySelector<HTMLElement>("[data-scene-id=intro]")!.hidden,
    false,
  );
  assert.equal(
    root.querySelector<HTMLElement>("[data-scene-id=question]")!.hidden,
    false,
  );
  root
    .querySelector("button")!
    .dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  assert.equal(
    root.querySelector<HTMLElement>("[data-scene-id=question]")!.hidden,
    true,
  );
  assert.equal(
    root.querySelector<HTMLElement>("[data-scene-id=plant]")!.hidden,
    false,
  );
  assert.equal(
    root.querySelector<HTMLElement>("[data-scene-id=footer-scene]")!.hidden,
    false,
  );
});

test("installed custom module adds playback without changing the core and receives one frozen work", () => {
  const w = structuredClone(landing);
  const r = defaultRegistry();
  r.register({
    id: "example/badge",
    version: "1",
    fields: { label: { type: "string" } },
    editableFields: ["label"],
    capabilities: [],
    fallback: "Badge",
    validate: (c) => typeof c.label === "string",
  });
  w.pages[0]!.scenes[0]!.blocks = [
    {
      id: "badge1",
      module: { id: "example/badge", version: "1" },
      content: { label: "Hello" },
    },
    {
      id: "badge2",
      module: { id: "example/badge", version: "1" },
      content: { label: "Again" },
    },
  ];
  const renderers = defaultWebRenderers();
  const seen: unknown[] = [];
  renderers.set(
    moduleKey("example/badge", "1"),
    (block, { document, work }) => {
      seen.push(work);
      assert.ok(Object.isFrozen(work));
      assert.ok(Object.isFrozen(work.pages));
      const node = document.createElement("strong");
      node.textContent = String(block.content.label);
      return node;
    },
  );
  const { root } = host();
  mountWork(root, importSjg(exportSjg(w)), r, { renderers });
  assert.deepEqual(
    [...root.querySelectorAll("strong")].map((e) => e.textContent),
    ["Hello", "Again"],
  );
  assert.equal(seen[0], seen[1]);
});
