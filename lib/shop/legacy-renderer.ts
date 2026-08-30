import { readFile } from "node:fs/promises";
import path from "node:path";
import { brotliDecompressSync } from "node:zlib";

const ARCHIVE_ROOT = path.join(process.cwd(), "shop.resetclinic.org 3");
const COMPACT_ARCHIVE = path.join(ARCHIVE_ROOT, "shop-pages-compact.br");

type CompactShopPage = {
  title: string;
  bodyClass: string;
  styles: string;
  main: string;
};

let compactArchivePromise: Promise<Record<string, CompactShopPage>> | null = null;

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

  next = next.replace(/index\.html(?=([?#].*)?$)/i, "");
  return next || "./";
}

export function rewriteLegacyShopMarkup(html: string) {
  let result = html;

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

  result = result.replace(/\b(href|action)=(['"])([^'"]*)\2/gi, (_match, attr, quote, value) => {
    return `${attr}=${quote}${rewriteNavigationUrl(value)}${quote}`;
  });

  // Vamtam hides the native pointer when these classes are present and relies
  // on JavaScript to render #mouseDot/#mouseCircle. The legacy JS is removed,
  // therefore the classes have to go as well.
  result = result.replace(/(<body\b[^>]*\bclass=(['"]))(.*?)(\2)/i, (_match, prefix, _quote, classes, suffix) => {
    const clean = classes
      .split(/\s+/)
      .filter((name: string) => name && name !== "has-mouse-dot" && name !== "has-mouse-circle")
      .join(" ");
    return `${prefix}${clean}${suffix}`;
  });

  const cursorFix = [
    '<style id="reset-next-cursor-fix">',
    'html,body,body *{cursor:default!important}',
    'a,button,[role="button"],label,select,summary,input[type="button"],input[type="submit"],input[type="reset"]{cursor:pointer!important}',
    'input,textarea{cursor:text!important}',
    '#mouseDot,#mouseCircle{display:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important}',
    '</style>',
  ].join("");
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

function replaceMainElement(shell: string, replacement: string) {
  const startMatch = /<div\b[^>]*\bid=(['"])main\1[^>]*>/i.exec(shell);
  if (!startMatch || startMatch.index == null) throw new Error("Archive shell main element not found");

  const start = startMatch.index;
  const tags = /<\/?div\b[^>]*>/gi;
  tags.lastIndex = start;
  let depth = 0;
  let end = -1;
  let match: RegExpExecArray | null;

  while ((match = tags.exec(shell))) {
    if (/^<\/div/i.test(match[0])) depth -= 1;
    else depth += 1;
    if (depth === 0) {
      end = tags.lastIndex;
      break;
    }
  }

  if (end === -1) throw new Error("Archive shell main element is malformed");
  return `${shell.slice(0, start)}${replacement}${shell.slice(end)}`;
}

async function loadCompactArchive() {
  if (!compactArchivePromise) {
    compactArchivePromise = readFile(COMPACT_ARCHIVE)
      .then((compressed) => brotliDecompressSync(compressed).toString("utf8"))
      .then((json) => JSON.parse(json) as Record<string, CompactShopPage>)
      .catch((error) => {
        compactArchivePromise = null;
        throw error;
      });
  }
  return compactArchivePromise;
}

export async function loadCompactShopDocument(segments: string[]) {
  const normalized = segments
    .map((segment) => decodeURIComponent(segment).trim())
    .filter(Boolean);
  if (normalized.at(-1)?.toLowerCase() === "index.html") normalized.pop();

  const key = normalized.join("/");
  const pages = await loadCompactArchive();
  const page = pages[key];
  if (!page) throw new Error(`Compact shop page not found: ${key}`);

  let shell = await readFile(path.join(ARCHIVE_ROOT, "index.html"), "utf8");
  shell = replaceMainElement(shell, page.main);
  shell = shell.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, `<title>${page.title}</title>`);
  if (page.bodyClass) {
    shell = shell.replace(/(<body\b[^>]*\bclass=(['"]))(.*?)(\2)/i, `$1${page.bodyClass}$4`);
  }
  if (page.styles) shell = shell.replace(/<\/head>/i, `${page.styles}</head>`);

  return rewriteLegacyShopMarkup(shell);
}

export async function loadLegacyShopDocument(segments: string[] = []) {
  const source = await readFile(resolveDocumentPath(segments), "utf8");
  return rewriteLegacyShopMarkup(source);
}
