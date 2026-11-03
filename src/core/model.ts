/** Portable data only. Unknown JSON fields survive reads, edits and exports. */
export interface Block {
  id: string;
  module: { id: string; version: string; [key: string]: unknown };
  content: Record<string, unknown>;
  fallback?: string;
  [key: string]: unknown;
}
export interface Scene {
  id: string;
  mode?: string;
  blocks: Block[];
  [key: string]: unknown;
}
export interface Page {
  id: string;
  scenes: Scene[];
  [key: string]: unknown;
}
export interface Asset {
  mime: string;
  /** Canonical padded base64 of the complete file, without a data: prefix. */
  data: string;
  [key: string]: unknown;
}
export interface Work {
  schemaVersion: "0.1.0-draft.1";
  title: string;
  id: string;
  revision: number;
  intent?: Record<string, unknown>;
  pages: Page[];
  assets?: Record<string, Asset>;
  [key: string]: unknown;
}
export type Element = Work | Page | Scene | Block;
export type CoreErrorCode =
  | "invalid_document"
  | "conflict"
  | "not_found"
  | "invalid_patch";
export class CoreError extends Error {
  constructor(
    public readonly code: CoreErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "CoreError";
  }
}
export const MAX_FILE_BYTES = 8 * 1024 * 1024;
export const MAX_DEPTH = 64;
export const MAX_JSON_VALUES = 100_000;
export const MAX_ELEMENTS = 10_000;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
export function* elements(work: Work): Generator<Element> {
  yield work;
  for (const page of work.pages) {
    yield page;
    for (const scene of page.scenes) {
      yield scene;
      yield* scene.blocks;
    }
  }
}
