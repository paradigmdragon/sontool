import { validateWork, type Work, type Block } from "../core/index.js";
import {
  checkModules,
  moduleKey,
  freezeData,
  type ModuleRegistry,
} from "../modules.js";
export type WebModuleRenderer = (
  block: Block,
  context: {
    document: Document;
    work: Work;
    navigate: (sceneId: string) => void;
  },
) => HTMLElement;
export type WebRenderers = Map<string, WebModuleRenderer>;
export function scrollProgress(top: number, travel: number): number {
  return travel > 0 ? Math.min(1, Math.max(0, -top / travel)) : 0;
}
export function defaultWebRenderers(): WebRenderers {
  return new Map<string, WebModuleRenderer>([
    [
      moduleKey("sontool/text", "0.1.0-draft.1"),
      (b, { document: d }) => {
        const e = d.createElement("p");
        e.textContent = String(b.content.text);
        return e;
      },
    ],
    [
      moduleKey("sontool/image", "0.1.0-draft.1"),
      (b, { document: d, work }) => {
        const a = work.assets?.[String(b.content.assetId)];
        if (
          !a ||
          !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
            a.mime,
          )
        )
          throw new Error("Unsupported image");
        const e = d.createElement("img");
        e.src = `data:${a.mime};base64,${a.data}`;
        e.alt = String(b.content.alt);
        return e;
      },
    ],
    [
      moduleKey("sontool/choice", "0.1.0-draft.1"),
      (b, { document: d, navigate }) => {
        const e = d.createElement("div");
        for (const o of b.content.options as Array<{
          label: string;
          targetSceneId: string;
        }>) {
          const button = d.createElement("button");
          button.type = "button";
          button.textContent = o.label;
          button.onclick = () => navigate(o.targetSceneId);
          e.append(button);
        }
        return e;
      },
    ],
  ]);
}
export function mountWork(
  root: HTMLElement,
  work: Work,
  registry: ModuleRegistry,
  options: { reducedMotion?: boolean; renderers?: WebRenderers } = {},
) {
  validateWork(work);
  work = freezeData(structuredClone(work));
  const d = root.ownerDocument;
  const win = d.defaultView;
  const renderers = options.renderers ?? defaultWebRenderers();
  const reduced =
    options.reducedMotion ??
    win?.matchMedia?.("(prefers-reduced-motion: reduce)").matches ??
    false;
  const invalid = new Set(checkModules(work, registry).map((i) => i.id));
  const scenes = work.pages.flatMap((p) => p.scenes);
  const state = { currentSceneId: scenes[0]?.id ?? "" };
  // Each connected choice graph switches independently. Ordinary flow scenes stay visible.
  const groups = new Map<string, Set<string>>();
  const incoming = new Set<string>();
  for (const scene of scenes)
    for (const block of scene.blocks) {
      if (
        block.module.id !== "sontool/choice" ||
        block.module.version !== "0.1.0-draft.1" ||
        invalid.has(block.id)
      )
        continue;
      for (const option of block.content.options as Array<{
        targetSceneId: string;
      }>) {
        const target = option.targetSceneId;
        incoming.add(target);
        const joined = new Set([
          scene.id,
          target,
          ...(groups.get(scene.id) ?? []),
          ...(groups.get(target) ?? []),
        ]);
        for (const id of joined) groups.set(id, joined);
      }
    }
  const active = new Set<string>();
  for (const group of new Set(groups.values()))
    active.add([...group].find((id) => !incoming.has(id)) ?? [...group][0]!);
  const sceneElements = new Map<string, HTMLElement>();
  const cleanups: Array<() => void> = [];
  root.replaceChildren();
  const heading = d.createElement("h1");
  heading.textContent = work.title;
  root.append(heading);
  const navigate = (id: string) => {
    const target = sceneElements.get(id);
    if (!target) return;
    state.currentSceneId = id;
    const group = groups.get(id);
    if (group)
      for (const key of group) {
        const e = sceneElements.get(key);
        if (e) e.hidden = key !== id;
      }
    target.focus();
  };
  for (const page of work.pages) {
    const pageNode = d.createElement("article");
    pageNode.dataset.pageId = page.id;
    root.append(pageNode);
    for (const scene of page.scenes) {
      const section = d.createElement("section");
      section.dataset.sceneId = scene.id;
      section.tabIndex = -1;
      section.className = "sjg-scene";
      sceneElements.set(scene.id, section);
      pageNode.append(section);
      if (groups.has(scene.id)) section.hidden = !active.has(scene.id);
      if (!["flow", "scroll", "choice"].includes(scene.mode ?? "flow")) {
        const note = d.createElement("p");
        note.textContent = `Unsupported scene mode: ${scene.mode}. Showing content in reading order.`;
        section.append(note);
      }
      const track = d.createElement("div");
      track.className = "sjg-track";
      section.append(track);
      for (const block of scene.blocks) {
        let node: HTMLElement;
        const renderer = renderers.get(
          moduleKey(block.module.id, block.module.version),
        );
        try {
          if (invalid.has(block.id) || !renderer)
            throw new Error("Unsupported module");
          node = renderer(structuredClone(block), {
            document: d,
            work,
            navigate,
          });
        } catch {
          node = d.createElement("p");
          node.textContent =
            block.fallback ??
            registry.get(block.module.id, block.module.version)?.fallback ??
            `Unsupported module: ${block.module.id}`;
          node.dataset.fallback = "true";
        }
        node.dataset.blockId = block.id;
        track.append(node);
      }
      if (scene.mode === "scroll") {
        section.classList.add("sjg-scroll");
        if (reduced) section.classList.add("sjg-reduced");
        const cfg = scene.scroll as
          | { axis?: string; distance?: number }
          | undefined;
        if (!reduced && cfg?.axis === "horizontal") {
          const distance =
            typeof cfg.distance === "number" && Number.isFinite(cfg.distance)
              ? Math.min(5, Math.max(1, cfg.distance))
              : 2;
          section.style.height = `${(distance + 1) * 100}vh`;
          track.classList.add("sjg-horizontal");
          const update = () => {
            const bounds = section.getBoundingClientRect();
            const progress = scrollProgress(
              bounds.top,
              bounds.height - (win?.innerHeight ?? 0),
            );
            const overflow = Math.max(0, track.scrollWidth - track.clientWidth);
            track.style.transform = `translateX(${-overflow * progress}px)`;
            section.dataset.progress = String(progress);
          };
          win?.addEventListener("scroll", update, { passive: true });
          win?.addEventListener("resize", update);
          cleanups.push(() => {
            win?.removeEventListener("scroll", update);
            win?.removeEventListener("resize", update);
          });
          update();
        }
      }
    }
  }
  return {
    state,
    navigate,
    destroy: () => {
      cleanups.forEach((f) => f());
      root.replaceChildren();
    },
  };
}
