import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalRepository } from "../src/adapters/local-repository.js";
import { createPreviewServer } from "../src/adapters/http.js";
import { landing } from "../src/examples.js";
test("private HTTP preview roundtrip requires host identity; stale writes and other users denied", async () => {
  const dir = mkdtempSync(join(tmpdir(), "sjg-http-"));
  const server = createPreviewServer(new LocalRepository(dir), (req) =>
    req.headers.authorization === "Bearer test-alice"
      ? "alice"
      : req.headers.authorization === "Bearer test-bob"
        ? "bob"
        : null,
  );
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port;
  const base = `http://127.0.0.1:${port}`;
  const call = (path: string, token: string, method = "GET", body?: unknown) =>
    fetch(base + path, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  try {
    assert.equal((await call("/works/landing", "missing")).status, 401);
    assert.equal(
      (await call("/works", "test-alice", "POST", landing)).status,
      201,
    );
    assert.equal((await call("/works/landing", "test-bob")).status, 404);
    const res = await call("/works/landing", "test-alice");
    assert.deepEqual(await res.json(), landing);
    assert.match(res.headers.get("cache-control")!, /no-store/);
    const patch = {
      baseRevision: 0,
      elementId: "title",
      content: { text: "Human" },
    };
    assert.equal(
      (await call("/works/landing", "test-alice", "PATCH", patch)).status,
      200,
    );
    assert.equal(
      (await call("/works/landing", "test-alice", "PATCH", patch)).status,
      409,
    );
    assert.equal(
      (
        await call("/works/landing", "test-bob", "PATCH", {
          ...patch,
          baseRevision: 1,
        })
      ).status,
      404,
    );
    const read = await (await call("/works/landing", "test-alice")).json();
    assert.equal(read.pages[0].scenes[0].blocks[0].content.text, "Human");
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((e) => (e ? reject(e) : resolve())),
    );
    rmSync(dir, { recursive: true, force: true });
  }
});
