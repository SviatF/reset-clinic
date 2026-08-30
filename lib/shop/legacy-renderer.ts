import { readFile } from "node:fs/promises";
import path from "node:path";

const ARCHIVE_ROOT = path.join(process.cwd(), "shop.resetclinic.org 3");

function rewriteAssetUrl(value: string) {
  if (!value) return value;
  return value
    .replace(/^https?:\/\/shop\.resetclinic\.org\//i, "/shop-archive/")
    .replace(/^\/\/?(?:wp-content|wp-includes)\//i, (match) => `/shop-archive/${match.replace(/^\/+/, "")}`);
}

function rewriteNavigationUrl(value: string) {
  if (!value || /^(?:#|mailto:|tel:|javascript:|data:)/i.test(value)) return value;

  let next = value;

  if (/^https?:\/\/shop\.resetclinic\.org(?:\/|$)/i.test(next)) {
    const rest = next.replace(/^https?:\/\/shop\.resetclinic\.org\/?/i, "");
    next = `/shop/${rest}`;
  } else if (
    next.startsWith("/") &&
    !next.startsWith("/shop/") &&
    next !== "/shop" &&
    !next.startsWith("/shop-archive/") &&
    !next.startsWith("/shop-media/") &&
    !next.startsWith("/_next/") &&
    !next.startsWith("/wp-content/") &&
    !next.startsWith("/wp-includes/")
  ) {
    next = `/shop${next}`;
  }

  // Browser-saved pages contain WordPress links such as
  // product-category/hair/index.html. Next routes are canonical directories.
  next = next.replace(/index\.html(?=([?#].*)?$)/i, "");
  return next || "./";
}

function rewriteMarkup(html: string) {
  let result = html;

  // Keep the downloaded Elementor/Vamtam document and CSS intact, but never
  // execute the old WordPress/WooCommerce runtime scripts. The shop now runs
  // inside Next.js and those scripts otherwise try to call a dead WP backend.
  result = result.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  result = result.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "");

  result = result.replace(/\b(src|poster)=(['"])([^'"]+)\2/gi, (_match, attr, quote, value) => {
    return `${attr}=${quote}${rewriteAssetUrl(value)}${quote}`;
  });

  result = result.replace(/\bsrcset=(['"])([^'"]+)\1/gi, (_match, quote, value) => {
    const rewritten = value
      .split(",")
      .map((candidate: string) => {
        const trimmed = candidate.trim();
        const firstSpace = trimmed.search(/\s/);
        if (firstSpace === -1) return rewriteAssetUrl(trimmed);
        return `${rewriteAssetUrl(trimmed.slice(0, firstSpace))}${trimmed.slice(firstSpace)}`;
      })
      .join(", ");
    return `srcset=${quote}${rewritten}${quote}`;
  });

  result = result.replace(/url\((['"]?)(https?:\/\/shop\.resetclinic\.org\/[^)'"\s]+)\1\)/gi, (_match, quote, value) => {
    return `url(${quote}${rewriteAssetUrl(value)}${quote})`;
  });

  result = result.replace(/\bhref=(['"])(https?:\/\/shop\.resetclinic\.org\/(?:wp-content|wp-includes)\/[^'"]+)\1/gi, (_match, quote, value) => {
    return `href=${quote}${rewriteAssetUrl(value)}${quote}`;
  });

  result = result.replace(/\b(src|poster|href)=(['"])(\.\.?\/)*(wp-content|wp-includes)\/([^'"]+)\2/gi, (_match, attr, quote, _dots, root, rest) => {
    return `${attr}=${quote}/shop-archive/${root}/${rest}${quote}`;
  });

  result = result.replace(/url\((['"]?)\/(wp-content|wp-includes)\/([^)'"\s]+)\1\)/gi, (_match, quote, root, rest) => {
    return `url(${quote}/shop-archive/${root}/${rest}${quote})`;
  });

  // Rewrite every navigation/form URL after media URLs have been handled.
  // This fixes both clean WordPress URLs and browser-saved */index.html links.
  result = result.replace(/\b(href|action)=(['"])([^'"]*)\2/gi, (_match, attr, quote, value) => {
    return `${attr}=${quote}${rewriteNavigationUrl(value)}${quote}`;
  });

  // The old theme hides the native mouse cursor because WordPress JS renders a
  // custom cursor. That JS is intentionally removed above, so restore the
  // browser cursor explicitly.
  const cursorFix = "<style id=\"reset-next-cursor-fix\">html,body,body *,a,button,input,select,textarea{cursor:auto!important}a,button,[role=\"button\"],input[type=\"submit\"]{cursor:pointer!important}</style>";
  if (/<\/head>/i.test(result)) result = result.replace(/<\/head>/i, `${cursorFix}</head>`);
  else result = `${cursorFix}${result}`;

  return result;
}

function resolveDocumentPath(segments: string[] = []) {
  const safeSegments = segments
    .map((segment) => decodeURIComponent(segment).trim())
    .filter(Boolean)
    .filter((segment) => segment !== "." && segment !== ".." && !segment.includes("/") && !segment.includes("\\"));

  if (safeSegments.at(-1)?.toLowerCase() === "index.html") safeSegments.pop();

  const relative = safeSegments.length ? path.join(...safeSegments, "index.html") : "index.html";
  const resolved = path.resolve(ARCHIVE_ROOT, relative);
  const root = path.resolve(ARCHIVE_ROOT);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) throw new Error("Invalid shop archive path");
  return resolved;
}

export async function loadLegacyShopDocument(segments: string[] = []) {
  const source = await readFile(resolveDocumentPath(segments), "utf8");
  return rewriteMarkup(source);
}
