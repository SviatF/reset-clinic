const base = (process.env.CLINIC_BOOKING_API_BASE || "https://cliniccards.com/api").replace(/\/+$/, "");
const token = (process.env.CLINIC_BOOKING_API_KEY || "").trim();

function kyivDate(offsetDays = 0) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const baseDate = new Date(Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day) + offsetDays, 12));
  return baseDate.toISOString().slice(0, 10);
}

function summarizeJson(value) {
  const summary = {
    rootType: Array.isArray(value) ? "array" : value && typeof value === "object" ? "object" : typeof value,
    topLevelKeys: [],
    topLevelLength: Array.isArray(value) ? value.length : undefined,
    objectCount: 0,
    arrayCount: 0,
    dateLikeFields: 0,
    timeLikeFields: 0,
    doctorLikeFields: 0,
    cabinetLikeFields: 0,
    availabilityLikeFields: 0,
  };

  if (value && typeof value === "object" && !Array.isArray(value)) {
    summary.topLevelKeys = Object.keys(value).slice(0, 30);
  }

  const seen = new Set();
  const walk = (node, depth = 0) => {
    if (!node || typeof node !== "object" || depth > 8 || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      summary.arrayCount += 1;
      for (const item of node.slice(0, 2000)) walk(item, depth + 1);
      return;
    }
    summary.objectCount += 1;
    for (const [key, child] of Object.entries(node)) {
      const lower = key.toLowerCase();
      if (/(^|_)(date|day)(_|$)/.test(lower)) summary.dateLikeFields += 1;
      if (/(time|start|end|from|to)/.test(lower)) summary.timeLikeFields += 1;
      if (/(doctor|staff|specialist|employee)/.test(lower)) summary.doctorLikeFields += 1;
      if (/(cabinet|room)/.test(lower)) summary.cabinetLikeFields += 1;
      if (/(available|free|busy|status|slot|schedule)/.test(lower)) summary.availabilityLikeFields += 1;
      walk(child, depth + 1);
    }
  };
  walk(value);
  return summary;
}

async function probe(name, path) {
  const started = Date.now();
  try {
    const response = await fetch(`${base}${path}`, {
      headers: { Accept: "application/json", Token: token },
      cache: "no-store",
    });
    const text = await response.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch {}

    const result = {
      name,
      ok: response.ok,
      status: response.status,
      ms: Date.now() - started,
      contentType: response.headers.get("content-type") || "",
      bodyBytes: Buffer.byteLength(text),
      ...(json !== null ? { shape: summarizeJson(json) } : { nonJson: true }),
    };

    if (!response.ok) {
      const errorRecord = json && typeof json === "object" && !Array.isArray(json) ? json : null;
      result.error = String(errorRecord?.message || errorRecord?.error || `HTTP ${response.status}`).slice(0, 300);
    }

    console.log(`[cliniccards-preflight] ${JSON.stringify(result)}`);
    return result;
  } catch (error) {
    const result = {
      name,
      ok: false,
      networkError: error instanceof Error ? error.message.slice(0, 300) : String(error).slice(0, 300),
      ms: Date.now() - started,
    };
    console.log(`[cliniccards-preflight] ${JSON.stringify(result)}`);
    return result;
  }
}

if (!token) {
  console.log('[cliniccards-preflight] {"configured":false,"reason":"CLINIC_BOOKING_API_KEY missing in this deployment environment"}');
  process.exit(0);
}

console.log(`[cliniccards-preflight] ${JSON.stringify({ configured: true, baseHost: new URL(base).host, from: kyivDate(0), to: kyivDate(7) })}`);
await Promise.all([
  probe("schedule", `/schedule?from=${encodeURIComponent(kyivDate(0))}&to=${encodeURIComponent(kyivDate(7))}`),
  probe("booking-settings", "/booking-settings"),
  probe("staff", "/staff"),
]);
