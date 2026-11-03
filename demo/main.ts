import { examples } from "../src/examples.js";
import {
  importSjg,
  exportSjg,
  restoreRevision,
  type Work,
  type Block,
} from "../src/core/index.js";
import { defaultRegistry, patchBlockContent } from "../src/modules.js";
import { mountWork } from "../src/web/renderer.js";
import { prepareSonjapgoPreview } from "../src/adapters/sonjapgo.js";
const byId = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
let work: Work = structuredClone(examples.landing);
let previous: Work | undefined;
let player: ReturnType<typeof mountWork> | undefined;
const registry = defaultRegistry();
const status = (message: string) => (byId("status").textContent = message);
const blocks = (): Block[] =>
  work.pages.flatMap((p) => p.scenes.flatMap((s) => s.blocks));
function render() {
  player?.destroy();
  player = mountWork(byId("player"), work, registry);
  const list = byId<HTMLSelectElement>("block");
  list.replaceChildren();
  for (const b of blocks().filter((b) => b.module.id === "sontool/text")) {
    const option = document.createElement("option");
    option.value = b.id;
    option.textContent = b.id;
    list.append(option);
  }
  selectBlock();
  byId("info").textContent = JSON.stringify(
    {
      id: work.id,
      revision: work.revision,
      intent: work.intent,
      publication: prepareSonjapgoPreview(work).issues,
    },
    null,
    2,
  );
}
function selectBlock() {
  const b = blocks().find(
    (b) => b.id === byId<HTMLSelectElement>("block").value,
  );
  byId<HTMLTextAreaElement>("text").value = String(b?.content.text ?? "");
}
byId("block").onchange = selectBlock;
byId("example").onchange = () => {
  work = structuredClone(
    examples[byId<HTMLSelectElement>("example").value as keyof typeof examples],
  );
  previous = undefined;
  render();
  status("Example opened.");
};
byId("apply").onclick = () => {
  try {
    const next = patchBlockContent(
      work,
      byId<HTMLSelectElement>("block").value,
      { text: byId<HTMLTextAreaElement>("text").value },
      work.revision,
      registry,
    );
    previous = work;
    work = next;
    render();
    status(
      `Saved in memory · revision ${work.revision}. Export to keep the file.`,
    );
  } catch (e) {
    status(String(e));
  }
};
byId("undo").onclick = () => {
  try {
    if (!previous) return;
    work = restoreRevision(work, previous, work.revision);
    previous = undefined;
    render();
    status(`Restored content · revision ${work.revision}.`);
  } catch (e) {
    status(String(e));
  }
};
byId("export").onclick = () => {
  const url = URL.createObjectURL(
    new Blob([exportSjg(work)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `${work.id}.sjg`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  status("Exported .sjg file.");
};
byId<HTMLInputElement>("import").onchange = async () => {
  try {
    const file = byId<HTMLInputElement>("import").files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) throw new Error("File exceeds 8 MiB");
    work = importSjg(await file.text());
    previous = undefined;
    render();
    status(`Imported ${work.id} · revision ${work.revision}.`);
  } catch (e) {
    status(String(e));
  }
};
render();
