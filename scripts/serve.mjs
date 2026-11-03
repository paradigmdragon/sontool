import { createServer } from "node:http";
import { readFileSync } from "node:fs";
const files = {
  "/": ["index.html", "text/html"],
  "/main.js": ["main.js", "text/javascript"],
  "/style.css": ["style.css", "text/css"],
};
createServer((req, res) => {
  const file = files[new URL(req.url, "http://localhost").pathname];
  if (!file) {
    res.writeHead(404).end();
    return;
  }
  try {
    res.writeHead(200, {
      "Content-Type": file[1],
      "Cache-Control": "no-store",
      "Content-Security-Policy":
        "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; connect-src 'none'",
    });
    res.end(readFileSync(`dist/demo/${file[0]}`));
  } catch {
    res.writeHead(500).end("Run npm run build first");
  }
}).listen(4173, "127.0.0.1", () =>
  console.log("Local foundation lab: http://127.0.0.1:4173"),
);
