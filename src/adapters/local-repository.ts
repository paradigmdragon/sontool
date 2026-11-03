import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  rmSync,
  existsSync,
} from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { join } from "node:path";
import { exportSjg, importSjg, type Work } from "../core/index.js";
/** Local trusted-host adapter, NOT an authentication server. Actor must come from verified host identity. */
export class LocalRepository {
  constructor(private directory: string) {
    mkdirSync(directory, { recursive: true, mode: 0o700 });
  }
  private path(id: string) {
    return join(
      this.directory,
      createHash("sha256").update(id).digest("hex") + ".json",
    );
  }
  private actor(actor: string) {
    if (typeof actor !== "string" || !actor.trim())
      throw new Error("Authentication required");
  }
  private locked<T>(id: string, operation: () => T): T {
    const lock = this.path(id) + ".lock";
    try {
      mkdirSync(lock, { mode: 0o700 });
    } catch {
      throw new Error("Busy: retry after reading latest revision");
    }
    try {
      return operation();
    } finally {
      rmSync(lock, { recursive: true });
    }
  }
  create(actor: string, work: Work): void {
    this.actor(actor);
    const text = exportSjg(work);
    this.locked(work.id, () => {
      if (existsSync(this.path(work.id)))
        throw new Error("Work already exists");
      writeFileSync(
        this.path(work.id),
        JSON.stringify({ owner: actor, work: JSON.parse(text) }),
        { flag: "wx", mode: 0o600 },
      );
    });
  }
  read(actor: string, id: string): Work {
    this.actor(actor);
    let record: { owner: string; work: unknown };
    try {
      record = JSON.parse(readFileSync(this.path(id), "utf8"));
    } catch {
      throw new Error("Not found");
    }
    if (record.owner !== actor) throw new Error("Not found");
    const work = importSjg(JSON.stringify(record.work));
    if (work.id !== id) throw new Error("Invalid stored identity");
    return work;
  }
  save(actor: string, next: Work, baseRevision: number): void {
    this.actor(actor);
    const text = exportSjg(next);
    this.locked(next.id, () => {
      const current = this.read(actor, next.id);
      if (
        current.revision !== baseRevision ||
        next.revision !== baseRevision + 1
      )
        throw new Error("Conflict: reread current revision");
      const temp = this.path(next.id) + "." + randomUUID() + ".tmp";
      try {
        writeFileSync(
          temp,
          JSON.stringify({ owner: actor, work: JSON.parse(text) }),
          { flag: "wx", mode: 0o600 },
        );
        renameSync(temp, this.path(next.id));
      } finally {
        rmSync(temp, { force: true });
      }
    });
  }
}
