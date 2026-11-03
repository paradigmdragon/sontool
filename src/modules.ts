import {
  applyPatch,
  getElement,
  validateWork,
  type Work,
  type Block,
} from "./core/index.js";
/** Collision-free module identity, shared by definitions and renderer maps. */
export const moduleKey = (id: string, version: string): string =>
  JSON.stringify([id, version]);
export function freezeData<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) freezeData(child);
    Object.freeze(value);
  }
  return value;
}
export interface ModuleDefinition {
  id: string;
  version: string;
  fields: Record<string, { type: string; label?: string }>;
  editableFields: readonly string[];
  capabilities: readonly string[];
  fallback: string;
  validate: (content: Record<string, unknown>, work: Work) => boolean;
}
export class ModuleRegistry {
  #definitions = new Map<string, ModuleDefinition>();
  register(definition: ModuleDefinition): void {
    if (!definition.id || !definition.version)
      throw new Error("Invalid module definition");
    const key = moduleKey(definition.id, definition.version);
    if (this.#definitions.has(key))
      throw new Error("Module version already registered");
    this.#definitions.set(
      key,
      Object.freeze({
        ...definition,
        fields: freezeData(structuredClone(definition.fields)),
        editableFields: Object.freeze([...definition.editableFields]),
        capabilities: Object.freeze([...definition.capabilities]),
      }),
    );
  }
  get(id: string, version: string): ModuleDefinition | undefined {
    return this.#definitions.get(moduleKey(id, version));
  }
  list() {
    return [...this.#definitions.values()];
  }
}
export function defaultRegistry(): ModuleRegistry {
  const r = new ModuleRegistry();
  r.register({
    id: "sontool/text",
    version: "0.1.0-draft.1",
    fields: { text: { type: "string", label: "Text" } },
    editableFields: ["text"],
    capabilities: [],
    fallback: "Text",
    validate: (p) => typeof p.text === "string",
  });
  r.register({
    id: "sontool/image",
    version: "0.1.0-draft.1",
    fields: { assetId: { type: "string" }, alt: { type: "string" } },
    editableFields: ["assetId", "alt"],
    capabilities: [],
    fallback: "Image",
    validate: (p, w) =>
      typeof p.alt === "string" &&
      typeof p.assetId === "string" &&
      Boolean(w.assets && Object.hasOwn(w.assets, p.assetId)),
  });
  r.register({
    id: "sontool/choice",
    version: "0.1.0-draft.1",
    fields: { options: { type: "array" } },
    editableFields: ["options"],
    capabilities: ["navigation"],
    fallback: "Choices",
    validate: (p, w) =>
      Array.isArray(p.options) &&
      p.options.length > 0 &&
      p.options.every(
        (o) =>
          o &&
          typeof o === "object" &&
          typeof o.label === "string" &&
          typeof o.targetSceneId === "string" &&
          w.pages.some((page) =>
            page.scenes.some((s) => s.id === o.targetSceneId),
          ),
      ),
  });
  return r;
}
export function checkModules(
  work: Work,
  registry: ModuleRegistry,
): Array<{ id: string; status: "unsupported" | "invalid" }> {
  validateWork(work);
  const snapshot = freezeData(structuredClone(work));
  const issues: Array<{ id: string; status: "unsupported" | "invalid" }> = [];
  for (const p of snapshot.pages)
    for (const s of p.scenes)
      for (const b of s.blocks) {
        const m = registry.get(b.module.id, b.module.version);
        if (!m) issues.push({ id: b.id, status: "unsupported" });
        else {
          try {
            if (!m.validate(b.content, snapshot))
              issues.push({ id: b.id, status: "invalid" });
          } catch {
            issues.push({ id: b.id, status: "invalid" });
          }
        }
      }
  return issues;
}
export function patchBlockContent(
  work: Work,
  id: string,
  content: Record<string, unknown>,
  baseRevision: number,
  registry: ModuleRegistry,
): Work {
  const block = getElement(work, id) as Block;
  const m = registry.get(block.module.id, block.module.version);
  if (!m || Object.keys(content).some((key) => !m.editableFields.includes(key)))
    throw new Error("Property is not editable by this module");
  const next = applyPatch(work, {
    baseRevision,
    operations: [{ id, changes: { content } }],
  });
  if (checkModules(next, registry).some((i) => i.status === "invalid"))
    throw new Error("Invalid module properties");
  return next;
}
