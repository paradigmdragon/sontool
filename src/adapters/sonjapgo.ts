import { validateWork, type Work } from "../core/index.js";
/** Capability report only: existing remote tools have no verified .sjg receiver. */
export function prepareSonjapgoPreview(work: Work) {
  validateWork(work);
  const issues = [
    {
      feature: "sjg-import",
      status: "unsupported",
      reason:
        "Current create/update/publish tools do not advertise a .sjg import contract. A server adapter and private preview acceptance are required.",
    },
  ];
  for (const page of work.pages)
    for (const scene of page.scenes) {
      if (scene.mode !== "flow")
        issues.push({
          feature: `scene:${scene.mode}`,
          status: "unsupported",
          reason: "No verified conversion to the existing player.",
        });
      for (const block of scene.blocks)
        issues.push({
          feature: block.module.id,
          status:
            block.module.id === "sontool/text"
              ? "conversion-required"
              : "unsupported",
          reason:
            block.module.id === "sontool/text"
              ? "Text is available, but conversion alone must not discard work identity/intent."
              : "No verified conversion.",
        });
    }
  return {
    ready: false as const,
    sourceWorkId: work.id,
    sourceRevision: work.revision,
    artifact: structuredClone(work),
    issues,
  };
}
