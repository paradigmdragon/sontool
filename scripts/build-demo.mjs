import { mkdirSync, copyFileSync, writeFileSync } from "node:fs";
import { examples } from "../dist/examples.js";
import { exportSjg } from "../dist/core/index.js";
mkdirSync("dist/demo", { recursive: true });
for (const name of ["index.html", "style.css"])
  copyFileSync(`demo/${name}`, `dist/demo/${name}`);
mkdirSync("examples/runtime", { recursive: true });
for (const [name, work] of Object.entries(examples))
  writeFileSync(`examples/runtime/${name}.sjg`, exportSjg(work));
