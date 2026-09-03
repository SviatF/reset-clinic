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
    keyPaths: [],
  };

  if (value && typeof value === "object" && !Array.isArray(value)) {
    summary.topLevelKeys = Object.keys(value).slice(0, 30);
  }

  const seen = new Set();
  const paths = new Set();
  const walk = (node, path = "root", depth = 0) => {
    if (!node || typeof node !== "object" || depth > 5 || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      summary.arrayCount += 1;
      for (const item of node.slice(0, 100)) walk(item, `${path}[]`, depth + 1);
      return;
    }
    summary.objectCount += 1;
    for (const [key, child] of Object.entries(node)) {
      const next = `${path}.${key}`;
      if (paths.size < 100) paths.add(next);
      walk(child, next, depth + 1);
    }
  };
  walk(value);
  summary.keyPaths = [...paths];
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

const from = kyivDate(0);
const to = kyivDate(7);
const range = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
console.log(`[cliniccards-preflight] ${JSON.stringify({ configured: true, baseHost: new URL(base).host, from, to })}`);

await Promise.all([
  probe("booking-settings", "/booking-settings"),
  probe("staff", "/staff"),
  probe("visits", `/visits?${range}`),
  probe("schedule", `/schedule?${range}`),
  probe("schedules", `/schedules?${range}`),
  probe("appointments", `/appointments?${range}`),
  probe("slots", `/slots?${range}`),
  probe("booking-slots", `/booking-slots?${range}`),
  probe("available-slots", `/available-slots?${range}`),
  probe("schedule-data", `/schedule-data?${range}`),
  probe("online-booking-slots", `/online-booking/slots?${range}`),
]);
