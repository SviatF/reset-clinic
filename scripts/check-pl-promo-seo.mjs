import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const localized = read("lib/promo-data-pl.ts");
const pairs = read("lib/promo-locale-pairs.ts");
const polishPage = read("app/pl/promo/[service]/page.tsx");
const ukPage = read("app/promo/[service]/page.tsx");
const seo = read("lib/seo-compliance.ts");
const sitemap = read("app/sitemap.ts");
const quiz = read("app/pl/promo/[service]/quiz/page.tsx");
const landing = read("components/PromoLandingPagePl.tsx");

const slugs = [
  "botoks-lwow",
  "modelowanie-ust-lwow",
  "ipl-twarz-lwow",
  "oczyszczanie-twarzy-lwow",
  "kontrola-wagi-lwow",
  "dietetyk-lwow",
];

for (const slug of slugs) {
  assert(localized.includes('"' + slug + '"'), `Missing PL route ${slug}`);
  assert(pairs.includes("/pl/promo/" + slug + "/"), `Missing language pair for ${slug}`);
}

const titles = [...localized.matchAll(/metaTitle:\s*"([^"]+)"/g)].map((x) => x[1]);
const h1 = [...localized.matchAll(/heroTitle:\s*"([^"]+)"/g)].map((x) => x[1]);
assert.equal(titles.length, 6);
assert.equal(h1.length, 6);
assert.equal(new Set(titles).size, 6, "Duplicate PL meta titles");
assert.equal(new Set(h1).size, 6, "Duplicate PL H1 values");
assert(h1.every((s) => /we Lwowie/.test(s)), "All PL H1s should explain the local service intent");
assert(titles.every((s) => s.length <= 72), "Review excessively long Polish titles");

assert(pairs.includes('uk: "/promo/biopatid/"'), "Weight control must pair to the live Ukrainian promo");
assert(!pairs.includes('uk: "/nutrition/medical-weight-loss/"'), "Retired URL in hreflang mapping");
assert(polishPage.includes('PROMO_LOCALE_PAIRS[config.slug].uk'), "PL alternates not sourced from canonical pairs");
assert(ukPage.includes("weightAlternate"), "Reciprocal Ukrainian weight-control alternate missing");
assert(seo.includes("alternateForUkrainianCorePath"), "Ukrainian core pages must advertise PL alternates");

for (const code of [localized, read("lib/promo-data.ts")]) {
  const start = code.indexOf("  biopatid: {");
  const end = code.indexOf("\n  nutrition: {", start);
  assert(start >= 0 && end > start, "BIOPATID config not found");
  const body = code.slice(start, end);
  assert(!/price:\s*"0 ₴"/.test(body), "Unverified 0 ₴ medical price");
  assert(!/bezpłatn|darmow|Безкоштовн|безкоштовн|безоплатн/.test(body), "Unverified free-consultation claim");
}

assert(!sitemap.includes('url: `${SITE_URL}/booking/`'), "noindex booking should not be in sitemap");
assert(!sitemap.includes("/quiz/"), "Conversion quizzes should stay out of sitemap");
assert(quiz.includes("index: false") && quiz.includes("canonical: landingPath"), "PL quizzes must stay noindex");
assert(landing.includes("promo-doctor-profile-link"), "Missing physician profile links");
assert(landing.includes("promo-related-pl-links"), "Missing Polish topical crosslinks");

console.log("PL promo SEO source checks passed: 6 indexed landings + 6 noindex quizzes, canonical locale pairs, medical-price safeguards, topical links.");
