const url = "https://cliniccards.com/f/js/booking/booking.min.js";

function snippets(text, terms) {
  const compact = text.replace(/\s+/g, " ");
  const found = [];
  const seen = new Set();
  for (const term of terms) {
    let at = 0;
    const lower = compact.toLowerCase();
    while ((at = lower.indexOf(term.toLowerCase(), at)) !== -1 && found.length < 50) {
      const start = Math.max(0, at - 180);
      const end = Math.min(compact.length, at + term.length + 320);
      const snippet = compact.slice(start, end).replace(/[\r\n\t]/g, " ");
      const safe = snippet.replace(/([?&](?:token|key|secret|phone|firstname|lastname)=)[^&"' ]+/gi, "$1[redacted]");
      if (!seen.has(safe)) {
        seen.add(safe);
        found.push(safe);
      }
      at += term.length;
    }
  }
  return found;
}

try {
  const response = await fetch(url, { cache: "no-store" });
  const text = await response.text();
  console.log(`[cliniccards-booking-js-source] ${JSON.stringify({ status: response.status, bodyBytes: Buffer.byteLength(text), snippets: snippets(text, ["ajax", "url:", "schedule", "slot", "available", "doctor", "service", "visit", "booking/"]) })}`);
} catch (error) {
  console.log(`[cliniccards-booking-js-source] ${JSON.stringify({ error: error instanceof Error ? error.message.slice(0, 220) : String(error).slice(0, 220) })}`);
}
