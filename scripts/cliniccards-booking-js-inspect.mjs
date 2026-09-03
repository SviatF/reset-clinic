const url = "https://cliniccards.com/f/js/booking/booking.min.js";

function contexts(text, terms, before = 420, after = 620) {
  const compact = text.replace(/\s+/g, " ");
  const lower = compact.toLowerCase();
  const found = [];
  const seen = new Set();
  for (const term of terms) {
    let at = 0;
    while ((at = lower.indexOf(term.toLowerCase(), at)) !== -1 && found.length < 36) {
      const start = Math.max(0, at - before);
      const end = Math.min(compact.length, at + term.length + after);
      const snippet = compact.slice(start, end)
        .replace(/([?&](?:token|key|secret|phone|firstname|lastname)=)[^&"' ]+/gi, "$1[redacted]")
        .slice(0, 1400);
      if (!seen.has(snippet)) {
        seen.add(snippet);
        found.push({ term, snippet });
      }
      at += term.length;
    }
  }
  return found;
}

function literalCandidates(text) {
  const found = new Set();
  for (const match of text.matchAll(/["'`]([^"'`]{1,240})["'`]/g)) {
    const value = match[1];
    if (/(book|sched|shift|slot|avail|doctor|member|service|price|visit|calendar|time)/i.test(value) && /[\/_-]/.test(value)) {
      found.add(value.slice(0, 260));
    }
    if (found.size >= 100) break;
  }
  return [...found];
}

try {
  const response = await fetch(url, { cache: "no-store" });
  const text = await response.text();
  console.log(`[cliniccards-booking-js-source] ${JSON.stringify({
    status: response.status,
    bodyBytes: Buffer.byteLength(text),
    literals: literalCandidates(text),
    contexts: contexts(text, ["fetch(", "$.ajax", ".ajax(", "Request failed", "scheduleShifts", "bookingData", "priceItems", "members" ]),
  })}`);
} catch (error) {
  console.log(`[cliniccards-booking-js-source] ${JSON.stringify({ error: error instanceof Error ? error.message.slice(0, 220) : String(error).slice(0, 220) })}`);
}
