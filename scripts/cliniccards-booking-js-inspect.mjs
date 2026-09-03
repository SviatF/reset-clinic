const apiBase = (process.env.CLINIC_BOOKING_API_BASE || "https://cliniccards.com/api").replace(/\/+$/, "");
const apiToken = (process.env.CLINIC_BOOKING_API_KEY || "").trim();
const jsUrl = "https://cliniccards.com/f/js/booking/booking.min.js";

function summarizeJson(value) {
  const paths = new Set();
  let objectCount = 0;
  let arrayCount = 0;
  const seen = new Set();
  const walk = (node, path = "root", depth = 0) => {
    if (!node || typeof node !== "object" || depth > 6 || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      arrayCount += 1;
      for (const item of node.slice(0, 120)) walk(item, `${path}[]`, depth + 1);
      return;
    }
    objectCount += 1;
    for (const [key, child] of Object.entries(node)) {
      const next = `${path}.${key}`;
      if (paths.size < 140) paths.add(next);
      walk(child, next, depth + 1);
    }
  };
  walk(value);
  return {
    rootType: Array.isArray(value) ? "array" : value && typeof value === "object" ? "object" : typeof value,
    topLevelKeys: value && typeof value === "object" && !Array.isArray(value) ? Object.keys(value).slice(0, 30) : [],
    objectCount,
    arrayCount,
    keyPaths: [...paths],
  };
}

function contexts(text, terms, before = 300, after = 500) {
  const compact = text.replace(/\s+/g, " ");
  const lower = compact.toLowerCase();
  const found = [];
  const seen = new Set();
  for (const term of terms) {
    let at = 0;
    while ((at = lower.indexOf(term.toLowerCase(), at)) !== -1 && found.length < 24) {
      const start = Math.max(0, at - before);
      const end = Math.min(compact.length, at + term.length + after);
      const snippet = compact.slice(start, end).slice(0, 1100);
      if (!seen.has(snippet)) {
        seen.add(snippet);
        found.push({ term, snippet });
      }
      at += term.length;
    }
  }
  return found;
}

async function getBookingLink() {
  const response = await fetch(`${apiBase}/booking-settings`, {
    headers: { Accept: "application/json", Token: apiToken },
    cache: "no-store",
  });
  const json = await response.json();
  return String(json?.data?.booking_link || "").trim();
}

function possibleSubclinicIds(html) {
  const found = new Set(["0"]);
  const patterns = [
    /subclinicId\s*=\s*["']([^"']*)["']/gi,
    /subclinicId\s*=\s*(\d+)/gi,
    /subclinic[_-]?id["']?\s*[:=]\s*["']?(\d+)["']?/gi,
    /[?&]sid=(\d+)/gi,
  ];
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) found.add(match[1] || "0");
  }
  return [...found].slice(0, 8);
}

function safeShiftSample(json) {
  const shifts = json && typeof json === "object" ? json.scheduleShifts : null;
  const samples = [];
  const walk = (node, path = "scheduleShifts", depth = 0) => {
    if (samples.length >= 10 || node == null || depth > 6) return;
    if (Array.isArray(node)) {
      for (const item of node.slice(0, 30)) walk(item, `${path}[]`, depth + 1);
      return;
    }
    if (typeof node !== "object") return;
    const record = node;
    const keys = Object.keys(record);
    const looksShift = keys.some((k) => /(start|end|from|to|date|time|cabinet|member|doctor|shift)/i.test(k));
    if (looksShift) {
      const sample = {};
      for (const [key, value] of Object.entries(record)) {
        if (value == null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
          if (/(start|end|from|to|date|time|cabinet|member|doctor|shift|id)/i.test(key)) sample[key] = value;
        }
      }
      if (Object.keys(sample).length) samples.push({ path, sample });
    }
    for (const [key, value] of Object.entries(record)) walk(value, `${path}.${key}`, depth + 1);
  };
  walk(shifts);
  return samples;
}

try {
  const jsResponse = await fetch(jsUrl, { cache: "no-store" });
  const jsText = await jsResponse.text();
  console.log(`[cliniccards-booking-js-trace] ${JSON.stringify({
    status: jsResponse.status,
    bodyBytes: Buffer.byteLength(jsText),
    contexts: contexts(jsText, ["/booking/filter-data/", "scheduleShifts", "fetch(", "Request failed"]),
  })}`);

  if (!apiToken) throw new Error("CLINIC_BOOKING_API_KEY missing");
  const bookingLink = await getBookingLink();
  if (!bookingLink) throw new Error("booking_link missing");
  const pageResponse = await fetch(bookingLink, { cache: "no-store", redirect: "follow" });
  const html = await pageResponse.text();
  const ids = possibleSubclinicIds(html);
  const token = new URL(bookingLink).pathname.split("/").filter(Boolean).at(-1) || "";
  console.log(`[cliniccards-booking-page-vars] ${JSON.stringify({ status: pageResponse.status, tokenPresent: Boolean(token), subclinicCandidates: ids })}`);

  const origin = new URL(bookingLink).origin;
  const selectedData = { doctor: {}, service: {}, time: null };
  for (const sid of ids) {
    const endpoint = `${origin}/booking/filter-data/${encodeURIComponent(token)}?sid=${encodeURIComponent(sid)}`;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(selectedData),
        cache: "no-store",
      });
      const text = await response.text();
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch {}
      console.log(`[cliniccards-filter-data] ${JSON.stringify({
        sid,
        status: response.status,
        contentType: response.headers.get("content-type") || "",
        bodyBytes: Buffer.byteLength(text),
        ...(json ? {
          shape: summarizeJson(json),
          membersCount: Array.isArray(json.members) ? json.members.length : null,
          priceItemsCount: Array.isArray(json.priceItems) ? json.priceItems.length : null,
          scheduleShiftYears: json.scheduleShifts && typeof json.scheduleShifts === "object" ? Object.keys(json.scheduleShifts).slice(0, 10) : [],
          shiftSamples: safeShiftSample(json),
        } : { nonJson: true }),
      })}`);
    } catch (error) {
      console.log(`[cliniccards-filter-data] ${JSON.stringify({ sid, error: error instanceof Error ? error.message.slice(0, 220) : String(error).slice(0, 220) })}`);
    }
  }
} catch (error) {
  console.log(`[cliniccards-booking-js-trace] ${JSON.stringify({ error: error instanceof Error ? error.message.slice(0, 220) : String(error).slice(0, 220) })}`);
}
