import {
  CoreError,
  elements,
  isRecord,
  type Element,
  type Work,
} from "./model.js";
import { validateJson, validateWork } from "./validation.js";
import { exportSjg, importSjg } from "./codec.js";

export interface PatchOperation {
  id: string;
  changes: Record<string, unknown>;
}
export interface Patch {
  baseRevision: number;
  operations: PatchOperation[];
}
const locked = new Set([
  "id",
  "format",
  "schemaVersion",
  "revision",
  "pages",
  "scenes",
  "blocks",
  "module",
  "assets",
]);
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
function locate(work: Work, id: string): Element {
  const target = [...elements(work)].find((element) => element.id === id);
  if (!target) throw new CoreError("not_found", `Element not found: ${id}`);
  return target;
}
function checkRevision(work: Work, baseRevision: number): void {
  if (!Number.isSafeInteger(baseRevision) || baseRevision !== work.revision)
    throw new CoreError(
      "conflict",
      "Revision changed; read current work before editing",
    );
  if (work.revision === Number.MAX_SAFE_INTEGER)
    throw new CoreError("conflict", "Revision limit reached");
}
export function getElement(work: Work, id: string): Element {
  validateWork(work);
  return clone(locate(work, id));
}
/** One atomic batch. content and intent merge one level; other fields replace exactly.
 * Missing fields never delete data. Structure/module identity and asset mutations
 * require future explicit commands rather than arbitrary nested JSON patches.
 */
export function applyPatch(work: Work, patch: Patch): Work {
  validateWork(work);
  try {
    validateJson(patch);
  } catch {
    throw new CoreError(
      "invalid_patch",
      "Patch must contain portable JSON data",
    );
  }
  if (!isRecord(patch))
    throw new CoreError("invalid_patch", "Patch must be an object");
  checkRevision(work, patch.baseRevision);
  if (
    !Array.isArray(patch.operations) ||
    patch.operations.length === 0 ||
    patch.operations.length > 1000
  )
    throw new CoreError("invalid_patch", "Patch requires 1–1000 operations");
  const next = importSjg(exportSjg(work));
  for (const operation of patch.operations) {
    if (
      !isRecord(operation) ||
      typeof operation.id !== "string" ||
      !isRecord(operation.changes) ||
      Object.keys(operation.changes).length === 0
    )
      throw new CoreError(
        "invalid_patch",
        "Operation requires an ID and changes",
      );
    const target = locate(next, operation.id);
    for (const [key, value] of Object.entries(operation.changes)) {
      if (locked.has(key))
        throw new CoreError(
          "invalid_patch",
          `Structural field is immutable in a partial edit: ${key}`,
        );
      if (key === "content" || key === "intent") {
        if (
          !isRecord(value) ||
          (target[key] !== undefined && !isRecord(target[key]))
        )
          throw new CoreError("invalid_patch", `${key} must be an object`);
        target[key] = {
          ...(target[key] as Record<string, unknown> | undefined),
          ...clone(value),
        };
      } else target[key] = clone(value);
    }
  }
  next.revision++;
  validateWork(next);
  return next;
}
/** Whole-work undo is revision-guarded; it cannot silently discard newer edits. */
export function restoreRevision(
  current: Work,
  snapshot: Work,
  baseRevision: number,
): Work {
  validateWork(current);
  validateWork(snapshot);
  checkRevision(current, baseRevision);
  if (current.id !== snapshot.id)
    throw new CoreError("invalid_document", "Snapshot belongs to another work");
  const restored = importSjg(exportSjg(snapshot));
  restored.revision = current.revision + 1;
  validateWork(restored);
  return restored;
}
