import { createServer, type IncomingMessage } from "node:http";
import { LocalRepository } from "./local-repository.js";
import { importSjg, exportSjg } from "../core/index.js";
import { defaultRegistry, patchBlockContent } from "../modules.js";
/** Demonstration transport. Host must supply verified identity; never read actor from document/body. */
export function createPreviewServer(
  repository: LocalRepository,
  authenticate: (request: IncomingMessage) => string | null,
) {
  return createServer(async (req, res) => {
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Content-Type", "application/json");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const reply = (status: number, value: unknown) => {
      res.statusCode = status;
      res.end(JSON.stringify(value));
    };
    try {
      const actor = authenticate(req);
      if (!actor) {
        reply(401, { error: "Authentication required" });
        return;
      }
      // Cross-site browser requests cannot mutate through this local adapter.
      if (
        req.headers.origin &&
        req.headers.origin !== `http://${req.headers.host}`
      ) {
        reply(403, { error: "Origin rejected" });
        return;
      }
      const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] !== "works" || parts.length > 2) {
        reply(404, { error: "Not found" });
        return;
      }
      if (req.method === "GET" && parts[1]) {
        reply(200, repository.read(actor, decodeURIComponent(parts[1])));
        return;
      }
      if (!["POST", "PATCH"].includes(req.method ?? "")) {
        reply(405, { error: "Method not allowed" });
        return;
      }
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 8 * 1024 * 1024) {
          reply(413, { error: "File too large" });
          return;
        }
        chunks.push(chunk);
      }
      const text = Buffer.concat(chunks).toString("utf8");
      if (req.method === "POST" && parts.length === 1) {
        const work = importSjg(text);
        repository.create(actor, work);
        reply(201, { id: work.id, revision: work.revision });
        return;
      }
      if (req.method === "PATCH" && parts[1]) {
        const id = decodeURIComponent(parts[1]);
        const work = repository.read(actor, id);
        const input = JSON.parse(text);
        const next = patchBlockContent(
          work,
          input.elementId,
          input.content,
          input.baseRevision,
          defaultRegistry(),
        );
        repository.save(actor, next, input.baseRevision);
        reply(200, JSON.parse(exportSjg(next)));
        return;
      }
      reply(404, { error: "Not found" });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Invalid request";
      const code = (error as { code?: string })?.code;
      reply(
        code === "conflict" || /Conflict|already exists|Busy/.test(msg)
          ? 409
          : msg === "Not found"
            ? 404
            : 400,
        { error: msg },
      );
    }
  });
}
