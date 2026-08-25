process.env.NODE_ENV = process.env.NODE_ENV || "production";

const fs = require("fs");
const http = require("http");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

function listenTarget() {
  const raw = process.env.PORT || "3000";
  const numeric = Number(raw);
  if (Number.isFinite(numeric) && String(numeric) === String(raw).trim()) {
    return { target: numeric, isSocket: false };
  }
  return { target: raw, isSocket: true };
}

app.prepare().then(() => {
  const { target, isSocket } = listenTarget();
  if (isSocket && fs.existsSync(target)) fs.unlinkSync(target);

  const server = http.createServer((req, res) => handle(req, res));
  server.listen(target, isSocket ? undefined : "0.0.0.0", () => {
    if (isSocket) {
      try {
        fs.chmodSync(target, "0777");
      } catch (error) {
        console.warn("Could not chmod Node.js socket:", error instanceof Error ? error.message : error);
      }
    }
    console.log(`RESET Clinic Next.js server listening on ${isSocket ? `socket ${target}` : `port ${target}`}`);
  });
});
