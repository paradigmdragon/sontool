import {
  CoreError,
  isRecord,
  MAX_DEPTH,
  MAX_ELEMENTS,
  MAX_FILE_BYTES,
  MAX_JSON_VALUES,
  type Work,
} from "./model.js";

const forbidden = new Set(["__proto__", "constructor", "prototype"]);
const idPattern = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const fail = (message: string): never => {
  throw new CoreError("invalid_document", message);
};
const requireValue: (
  condition: unknown,
  message: string,
) => asserts condition = (condition, message) => {
  if (!condition) fail(message);
};

/** Reject values JSON would silently discard or change; never invoke getters/toJSON. */
export function validateJson(value: unknown): void {
  const ancestors = new Set<object>();
  let count = 0;
  function visit(item: unknown, depth: number): void {
    requireValue(++count <= MAX_JSON_VALUES, "Too many JSON values");
    requireValue(depth <= MAX_DEPTH, "JSON nesting limit exceeded");
    if (item === null || typeof item === "string" || typeof item === "boolean")
      return;
    if (typeof item === "number") {
      requireValue(
        Number.isFinite(item) &&
          !Object.is(item, -0) &&
          (!Number.isInteger(item) || Number.isSafeInteger(item)),
        "Non-portable number",
      );
      return;
    }
    requireValue(typeof item === "object", "Only JSON data is supported");
    const object = item as object;
    requireValue(!ancestors.has(object), "Cyclic data is not supported");
    const array = Array.isArray(object);
    const proto = Object.getPrototypeOf(object);
    requireValue(
      array
        ? proto === Array.prototype
        : proto === Object.prototype || proto === null,
      "Only plain JSON objects are supported",
    );
    ancestors.add(object);
    const keys = Reflect.ownKeys(object);
    if (array)
      requireValue(
        keys.length === (object as unknown[]).length + 1,
        "Sparse arrays or extra array properties are not supported",
      );
    for (const key of keys) {
      if (array && key === "length") continue;
      requireValue(
        typeof key === "string" && !forbidden.has(key),
        "Unsafe object key",
      );
      if (array)
        requireValue(/^(0|[1-9][0-9]*)$/.test(key), "Invalid array property");
      const descriptor = Object.getOwnPropertyDescriptor(object, key)!;
      requireValue(
        descriptor.enumerable && "value" in descriptor,
        "Only enumerable data properties are supported",
      );
      visit(descriptor.value, depth + 1);
    }
    ancestors.delete(object);
  }
  visit(value, 0);
}

export function validateWork(value: unknown): asserts value is Work {
  validateJson(value);
  requireValue(isRecord(value), "Work must be an object");
  requireValue(
    value.schemaVersion === "0.1.0-draft.1",
    "Unsupported .sjg envelope/version; retain original file",
  );
  requireValue(
    Number.isSafeInteger(value.revision) && (value.revision as number) >= 0,
    "Revision must be a nonnegative safe integer",
  );
  requireValue(
    typeof value.title === "string" && value.title.length > 0,
    "Work requires a nonempty title",
  );
  if (value.intent !== undefined)
    requireValue(isRecord(value.intent), "Work intent must be an object");
  const ids = new Set<string>();
  function element(item: unknown): asserts item is Record<string, unknown> {
    requireValue(
      isRecord(item) && typeof item.id === "string" && idPattern.test(item.id),
      "Element requires a portable stable ID",
    );
    requireValue(!ids.has(item.id), `Duplicate element ID: ${item.id}`);
    ids.add(item.id);
    requireValue(ids.size <= MAX_ELEMENTS, "Too many elements");
  }
  element(value);
  requireValue(Array.isArray(value.pages), "Work requires pages");
  for (const page of value.pages) {
    element(page);
    requireValue(Array.isArray(page.scenes), "Page requires scenes");
    for (const scene of page.scenes) {
      element(scene);
      if (scene.mode !== undefined)
        requireValue(
          typeof scene.mode === "string" && scene.mode.length > 0,
          "Scene mode must be a nonempty string",
        );
      extensionObjects(scene);
      requireValue(Array.isArray(scene.blocks), "Scene requires blocks");
      for (const block of scene.blocks) {
        element(block);
        requireValue(
          isRecord(block.module) &&
            typeof block.module.id === "string" &&
            block.module.id.length > 0 &&
            typeof block.module.version === "string" &&
            block.module.version.length > 0,
          "Block requires module ID and version",
        );
        requireValue(isRecord(block.content), "Block requires content object");
        if (block.fallback !== undefined)
          requireValue(
            typeof block.fallback === "string",
            "Block fallback must be text",
          );
        extensionObjects(block);
      }
    }
  }
  if (value.assets !== undefined) {
    requireValue(isRecord(value.assets), "Assets must be an object");
    for (const [id, asset] of Object.entries(value.assets)) {
      requireValue(idPattern.test(id) && isRecord(asset), "Invalid asset");
      requireValue(
        typeof asset.mime === "string" &&
          /^[a-zA-Z0-9!#$&^_.+-]+\/[a-zA-Z0-9!#$&^_.+-]+$/.test(asset.mime),
        "Invalid asset MIME type",
      );
      requireValue(
        typeof asset.data === "string" &&
          /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
            asset.data,
          ),
        "Asset data must be padded base64",
      );
    }
  }
  requireValue(
    new TextEncoder().encode(JSON.stringify(value)).byteLength <=
      MAX_FILE_BYTES,
    "Work exceeds .sjg file size limit",
  );
}

function extensionObjects(item: Record<string, unknown>): void {
  for (const field of ["layout", "timing", "behavior", "state"]) {
    if (item[field] !== undefined)
      requireValue(isRecord(item[field]), `${field} must be an object`);
  }
}
