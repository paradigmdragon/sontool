import { CoreError, MAX_FILE_BYTES, type Work } from "./model.js";
import { validateWork } from "./validation.js";

/** .sjg bounded runtime profile is UTF-8 JSON, including unknown fields and embedded asset bytes. */
export function importSjg(text: string): Work {
  if (
    typeof text !== "string" ||
    new TextEncoder().encode(text).byteLength > MAX_FILE_BYTES
  ) {
    throw new CoreError("invalid_document", "File exceeds .sjg size limit");
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new CoreError("invalid_document", "File is not valid JSON");
  }
  rejectDuplicateKeys(text);
  validateWork(value);
  return value;
}
export function exportSjg(work: Work): string {
  validateWork(work);
  // Compact output keeps the exact same byte limit on import and export.
  return JSON.stringify(work);
}

/** JSON.parse accepts duplicate keys. Reject them (including escaped aliases)
 * rather than silently replacing author intent. Syntax was validated above.
 */
function rejectDuplicateKeys(text: string): void {
  const stack: Array<{
    object: boolean;
    expectingKey: boolean;
    keys: Set<string>;
  }> = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{" || ch === "[")
      stack.push({
        object: ch === "{",
        expectingKey: ch === "{",
        keys: new Set(),
      });
    else if (ch === "}" || ch === "]") stack.pop();
    else if (ch === ",") {
      const frame = stack.at(-1);
      if (frame?.object) frame.expectingKey = true;
    } else if (ch === '"') {
      const start = i;
      i++;
      while (i < text.length && text[i] !== '"') {
        if (text[i] === "\\") i++;
        i++;
      }
      const frame = stack.at(-1);
      if (frame?.object && frame.expectingKey) {
        const key: string = JSON.parse(text.slice(start, i + 1));
        if (frame.keys.has(key))
          throw new CoreError("invalid_document", "Duplicate JSON object key");
        frame.keys.add(key);
        frame.expectingKey = false;
      }
    }
  }
}
