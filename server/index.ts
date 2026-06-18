import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { runScore } from "../src/run-score.js";
import { ASSETS } from "../src/assets.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");
const PORT = Number(process.env.PORT ?? 3000);
const IS_PROD = process.env.NODE_ENV === "production";

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function json(res: import("node:http").ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(body));
}

function serveStatic(pathname: string, res: import("node:http").ServerResponse): boolean {
  if (!IS_PROD || !existsSync(DIST)) return false;
  const safe = pathname === "/" ? "/index.html" : pathname;
  const file = join(DIST, safe);
  if (!file.startsWith(DIST) || !existsSync(file)) return false;
  const ext = extname(file);
  res.writeHead(200, { "Content-Type": MIME[ext] ?? "application/octet-stream" });
  res.end(readFileSync(file));
  return true;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (url.pathname === "/api/assets") {
    const list = Object.values(ASSETS).map((a) => ({
      id: a.id,
      symbol: a.symbol,
      name: a.name,
      assetClass: a.assetClass,
      channel: a.distributionChannel,
      imageUrl: a.imageUrl,
      issuer: a.issuer,
      issuerImageUrl: a.issuerImageUrl,
    }));
    return json(res, 200, list);
  }

  const scoreMatch = url.pathname.match(/^\/api\/score\/([a-z0-9]+)$/);
  if (scoreMatch && req.method === "GET") {
    try {
      const report = await runScore(scoreMatch[1]);
      return json(res, 200, report);
    } catch (err) {
      return json(res, 400, {
        error: err instanceof Error ? err.message : "Score failed",
      });
    }
  }

  if (req.method === "GET" && serveStatic(url.pathname, res)) return;

  if (req.method === "GET" && url.pathname === "/") {
    return json(res, 200, {
      name: "Mantle Distribution Friction Agent API",
      ui: IS_PROD ? "/" : "http://localhost:5000",
      endpoints: ["/api/assets", "/api/score/:assetId"],
    });
  }

  json(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`API server http://localhost:${PORT}`);
  if (IS_PROD && existsSync(DIST)) {
    console.log(`Serving UI from ${DIST}`);
  } else {
    console.log(`Dev UI: vite on http://localhost:5000 (proxies /api here)`);
  }
});