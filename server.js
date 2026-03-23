import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "dist");
const indexFilePath = path.join(distDir, "index.html");

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";
const appBasePath = normalizeBasePath(
  process.env.APP_BASE_PATH || process.env.VITE_BASE_PATH || "/"
);

function normalizeBasePath(rawBasePath) {
  if (!rawBasePath || rawBasePath === "/") {
    return "/";
  }

  const withLeadingSlash = rawBasePath.startsWith("/")
    ? rawBasePath
    : `/${rawBasePath}`;

  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}

function isPathInside(parent, child) {
  const relative = path.relative(parent, child);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

function resolveRequestFile(pathname) {
  let decodedPathname;

  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const absolutePath = path.resolve(distDir, `.${decodedPathname}`);

  if (!isPathInside(distDir, absolutePath)) {
    return null;
  }

  return absolutePath;
}

function writeHeaders(res, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || "application/octet-stream";
  const isHtml = extension === ".html";
  const isAsset = filePath.includes(`${path.sep}assets${path.sep}`);

  res.setHeader("Content-Type", contentType);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader(
    "Cache-Control",
    isAsset ? "public, max-age=31536000, immutable" : "public, max-age=0"
  );

  if (isHtml) {
    res.setHeader("Cache-Control", "no-cache");
  }
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-cache",
  });
  res.end(text);
}

async function serveFile(req, res, filePath) {
  const fileStats = await stat(filePath);

  if (!fileStats.isFile()) {
    return false;
  }

  writeHeaders(res, filePath);
  res.statusCode = 200;

  if (req.method === "HEAD") {
    res.end();
    return true;
  }

  const stream = createReadStream(filePath);
  stream.on("error", () => sendText(res, 500, "Error interno del servidor."));
  stream.pipe(res);
  return true;
}

async function handler(req, res) {
  const method = req.method || "GET";

  if (method !== "GET" && method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    sendText(res, 405, "Metodo no permitido.");
    return;
  }

  const requestUrl = new URL(req.url || "/", "http://localhost");
  const { pathname } = requestUrl;
  const healthPath = appBasePath === "/" ? "/health" : `${appBasePath}health`;

  if (pathname === "/health" || pathname === healthPath) {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (appBasePath !== "/" && pathname === "/") {
    res.writeHead(302, { Location: appBasePath });
    res.end();
    return;
  }

  let appPathname = pathname;

  if (appBasePath !== "/") {
    const baseWithoutTrailingSlash = appBasePath.slice(0, -1);

    if (pathname === baseWithoutTrailingSlash) {
      res.writeHead(302, { Location: appBasePath });
      res.end();
      return;
    }

    if (!pathname.startsWith(appBasePath)) {
      sendText(res, 404, "Ruta no encontrada.");
      return;
    }

    appPathname = pathname.slice(appBasePath.length - 1) || "/";
  }

  if (!existsSync(indexFilePath)) {
    sendText(
      res,
      503,
      "No existe dist/index.html. Ejecuta 'npm run build' antes de iniciar la app."
    );
    return;
  }

  const requestedPath = resolveRequestFile(appPathname);

  if (!requestedPath) {
    sendText(res, 400, "Ruta invalida.");
    return;
  }

  let filePath = requestedPath;

  try {
    const requestedStats = await stat(requestedPath);

    if (requestedStats.isDirectory()) {
      filePath = path.join(requestedPath, "index.html");
    }

    const served = await serveFile(req, res, filePath);
    if (served) {
      return;
    }
  } catch {
    // Continue with SPA fallback below.
  }

  if (path.extname(appPathname)) {
    sendText(res, 404, "Archivo no encontrado.");
    return;
  }

  await serveFile(req, res, indexFilePath);
}

const server = createServer((req, res) => {
  handler(req, res).catch(() =>
    sendText(res, 500, "Error interno del servidor.")
  );
});

server.listen(port, host, () => {
  // Keep this log simple for Hostinger app logs.
  console.log(`Servidor listo en http://${host}:${port}${appBasePath}`);
});
