import {
  applyPatch,
  CoreError,
  elements,
  exportSjg,
  getElement,
  importSjg,
  isRecord,
  validateJson,
  validateWork,
  type Element,
  type Patch,
  type PatchOperation,
  type Work,
} from "../core/index.js";
import { checkModules, defaultRegistry, type ModuleRegistry } from "../modules.js";
import { isBackgroundColor } from "../presentation.js";

export const MAX_BRIDGE_BYTES = 20 * 1024 * 1024;
type BridgeErrorCode =
  | "invalid_request"
  | "invalid_document"
  | "invalid_patch"
  | "invalid_module"
  | "conflict"
  | "not_found";
const messages: Record<BridgeErrorCode, string> = {
  invalid_request: "Invalid or oversized bridge request",
  invalid_document: "Work does not satisfy the bounded .sjg profile",
  invalid_patch: "Patch exceeds the permitted edit surface",
  invalid_module: "A known module contains invalid data",
  conflict: "Revision changed; read the current work before editing",
  not_found: "Requested element was not found",
};
class BridgeError extends Error {
  constructor(readonly code: BridgeErrorCode) {
    super(messages[code]);
  }
}
export interface BridgeResult {
  work?: Work;
  element?: Element;
  work_id: string;
  work_revision: number;
  module_issues: ReturnType<typeof checkModules>;
}
export type BridgeResponse =
  | { ok: true; result: BridgeResult }
  | { ok: false; error: { code: BridgeErrorCode; message: string } };

/** Failures intentionally contain no imported values, file paths or stack traces. */
export function bridgeFailure(code: BridgeErrorCode): BridgeResponse {
  return { ok: false, error: { code, message: messages[code] } };
}
function exactKeys(
  value: Record<string, unknown>,
  allowed: string[],
  code: BridgeErrorCode = "invalid_request",
): void {
  if (Object.keys(value).some((key) => !allowed.includes(key)))
    throw new BridgeError(code);
}
/** Envelope overhead must not reduce the portable work's own depth/value budget. */
export function validateBridgeEnvelope(request: unknown): asserts request is Record<string, unknown> {
  if (!isRecord(request)) throw new BridgeError("invalid_request");
  const descriptors = Object.getOwnPropertyDescriptors(request);
  const shell = Object.create(Object.getPrototypeOf(request)) as Record<string, unknown>;
  for (const key of Reflect.ownKeys(descriptors)) {
    const descriptor = Object.getOwnPropertyDescriptor(request, key)!;
    Object.defineProperty(shell, key, "value" in descriptor
      ? { ...descriptor, value: null }
      : descriptor);
  }
  // Preserved descriptors let the core reject getters without ever evaluating one.
  validateJson(shell);
  exactKeys(shell, ["operation", "data", "work", "patch", "element_id"]);
  for (const descriptor of Object.values(descriptors)) validateJson(descriptor.value);
}
function controlledPatch(work: Work, input: unknown, registry: ModuleRegistry): Work {
  if (!isRecord(input)) throw new BridgeError("invalid_patch");
  exactKeys(input, ["baseRevision", "operations"], "invalid_patch");
  if (
    !Array.isArray(input.operations) ||
    input.operations.length === 0 ||
    input.operations.length > 1000
  ) throw new BridgeError("invalid_patch");
  const ids = new Set([...elements(work)].map((element) => element.id));
  const scenes = new Map(work.pages.flatMap((page) => page.scenes).map((scene) => [scene.id, scene]));
  const blocks = new Map(work.pages.flatMap((page) => page.scenes.flatMap((scene) => scene.blocks)).map((block) => [block.id, block]));
  const operations: PatchOperation[] = [];
  for (const operation of input.operations) {
    if (
      !isRecord(operation) ||
      typeof operation.id !== "string" ||
      !isRecord(operation.changes) ||
      Object.keys(operation.changes).length === 0
    ) throw new BridgeError("invalid_patch");
    exactKeys(operation, ["id", "changes"], "invalid_patch");
    // Index once; bounded batches must not revalidate the complete work per operation.
    if (!ids.has(operation.id)) throw new BridgeError("not_found");
    const changes = operation.changes;
    if (operation.id === work.id) {
      exactKeys(changes, ["title", "intent"], "invalid_patch");
      operations.push({ id: operation.id, changes });
      continue;
    }
    const scene = scenes.get(operation.id);
    if (scene) {
      exactKeys(changes, ["layout"], "invalid_patch");
      if (!isRecord(changes.layout)) throw new BridgeError("invalid_patch");
      exactKeys(changes.layout, ["background"], "invalid_patch");
      if (!isBackgroundColor(changes.layout.background)) throw new BridgeError("invalid_patch");
      operations.push({ id: scene.id, changes: {
        layout: { ...(scene.layout as Record<string, unknown> | undefined), background: changes.layout.background },
      } });
      continue;
    }
    const block = blocks.get(operation.id);
    if (!block) throw new BridgeError("invalid_patch");
    exactKeys(changes, ["content"], "invalid_patch");
    const definition = registry.get(block.module.id, block.module.version);
    if (
      !definition ||
      !isRecord(changes.content) ||
      Object.keys(changes.content).length === 0 ||
      Object.keys(changes.content).some((key) => !definition.editableFields.includes(key))
    ) throw new BridgeError("invalid_patch");
    operations.push({ id: block.id, changes });
  }
  return applyPatch(work, { baseRevision: input.baseRevision, operations } as Patch);
}

/** Stateless, data-only boundary. Hosts own authentication, persistence and final CAS. */
export function handleBridgeRequest(request: unknown): BridgeResponse {
  try {
    // Validate before reading fields, including direct in-process calls with accessors.
    try { validateBridgeEnvelope(request); } catch { throw new BridgeError("invalid_request"); }
    const registry = defaultRegistry();
    let work: Work;
    switch (request.operation) {
      case "import":
        exactKeys(request, ["operation", "data"]);
        if (typeof request.data !== "string") throw new BridgeError("invalid_request");
        work = importSjg(request.data);
        break;
      case "read":
      case "patch":
        exactKeys(request, request.operation === "read"
          ? ["operation", "work", "element_id"]
          : ["operation", "work", "patch"]);
        validateWork(request.work);
        work = importSjg(exportSjg(request.work));
        if (request.operation === "patch") work = controlledPatch(work, request.patch, registry);
        break;
      default:
        throw new BridgeError("invalid_request");
    }
    const module_issues = checkModules(work, registry);
    if (request.operation !== "read" && module_issues.some((issue) => issue.status === "invalid"))
      throw new BridgeError("invalid_module");
    const result: BridgeResult = { work_id: work.id, work_revision: work.revision, module_issues };
    if (request.operation === "read" && request.element_id !== undefined) {
      if (typeof request.element_id !== "string") throw new BridgeError("invalid_request");
      result.element = getElement(work, request.element_id);
    } else result.work = work;
    return { ok: true, result };
  } catch (error) {
    return bridgeFailure(error instanceof BridgeError || error instanceof CoreError
      ? error.code
      : "invalid_request");
  }
}
