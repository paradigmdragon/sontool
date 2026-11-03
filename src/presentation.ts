/** The initial presentation profile permits solid colors, never general CSS. */
export function isBackgroundColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}
