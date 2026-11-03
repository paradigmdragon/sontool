import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalRepository } from "../src/adapters/local-repository.js";
import { landing } from "../src/examples.js";
import { patchBlockContent, defaultRegistry } from "../src/modules.js";
import { importSjg, exportSjg } from "../src/core/index.js";
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "sjg-test-"));
  return {
    dir,
    repo: new LocalRepository(dir),
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}
test("private save/load persists across repository instances, blocks other users and anonymous", () => {
  const f = fixture();
  try {
    f.repo.create("alice", landing);
    assert.deepEqual(
      new LocalRepository(f.dir).read("alice", landing.id),
      landing,
    );
    assert.throws(() => f.repo.read("bob", landing.id), /Not found/);
    assert.throws(() => f.repo.read("", landing.id), /Authentication/);
    assert.throws(() => f.repo.create("bob", landing), /exists/);
    assert.equal(
      statSync(join(f.dir, readdirSync(f.dir)[0]!)).mode & 0o777,
      0o600,
    );
  } finally {
    f.cleanup();
  }
});
test("stale save cannot overwrite human edit and imported ownership cannot grant access", () => {
  const f = fixture();
  try {
    f.repo.create("alice", landing);
    const human = patchBlockContent(
      landing,
      "title",
      { text: "human" },
      0,
      defaultRegistry(),
    );
    f.repo.save("alice", human, 0);
    assert.throws(() => f.repo.save("alice", human, 0), /Conflict/);
    const forged = importSjg(exportSjg({ ...human, owner: "bob" }));
    assert.throws(() => f.repo.save("bob", forged, 1), /Not found/);
    assert.equal(
      f.repo.read("alice", landing.id).pages[0]!.scenes[0]!.blocks[0]!.content
        .text,
      "human",
    );
  } finally {
    f.cleanup();
  }
});
