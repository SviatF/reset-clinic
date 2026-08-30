import { readFile } from "node:fs/promises";
import path from "node:path";

const ARCHIVE_ROOT = path.join(process.cwd(), "shop.resetclinic.org 3");

function rewriteAssetUrl(value: string) {
  if (!value) return value;

  return value
    .replace(/^https?:\/\/shop\.resetclinic\.org\//i, "/shop-archive/")
    .replace(/^\/\/?(?:wp-content|wp-includes)\//i, (match) => `/shop-archive/${match.replace(/^\/+/, "")}`);
}

function rewriteMarkup(html: string) {
  let result = html;

  // The Chrome archive contains the complete rendered Elementor/Vamtam page.
  // We keep the markup/styles, but never execute the old WordPress runtime JS.
  result = result.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  result = result.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "");

  // Static assets are served by the isolated Next.js archive route.
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

  // Stylesheets/fonts saved by the browser should also resolve locally.
  result = result.replace(/\bhref=(['"])(https?:\/\/shop\.resetclinic\.org\/(?:wp-content|wp-includes)\/[^'"]+)\1/gi, (_match, quote, value) => {
    return `href=${quote}${rewriteAssetUrl(value)}${quote}`;
  });

  // Navigation remains inside the Next storefront on previews. On the real
  // shop subdomain middleware exposes the same routes as clean root URLs.
  result = result.replace(/\bhref=(['"])https?:\/\/shop\.resetclinic\.org(?:\/([^'"]*))?\1/gi, (_match, quote, rest = "") => {
    const suffix = String(rest).replace(/^\/+/, "");
    return `href=${quote}/shop/${suffix}${quote}`;
  });

  // Saved Chrome pages often use local relative WordPress asset paths.
  result = result.replace(/\b(src|poster|href)=(['"])(\.\.?\/)*(wp-content|wp-includes)\/([^'"]+)\2/gi, (_match, attr, quote, _dots, root, rest) => {
    return `${attr}=${quote}/shop-archive/${root}/${rest}${quote}`;
  });

  return result;
}

function scopeStyles(styles: string) {
  return styles
    .replace(/\bhtml\s*,\s*body\b/gi, ".legacy-shop-root")
    .replace(/\bbody(?=[.#:\s>{[])/gi, ".legacy-shop-root")
    .replace(/\bhtml(?=[.#:\s>{[])/gi, ".legacy-shop-root");
}

export async function loadLegacyShopHome() {
  const source = await readFile(path.join(ARCHIVE_ROOT, "index.html"), "utf8");
  const bodyMatch = source.match(/<body\b([^>]*)>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) throw new Error("Archived RESET Shop page has no <body> element");

  const classMatch = bodyMatch[1].match(/\bclass=(['"])(.*?)\1/i);
  const bodyClass = classMatch?.[2] ?? "";

  const styleBlocks = [...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((match) => `<style>${scopeStyles(match[1])}</style>`)
    .join("\n");

  let body = bodyMatch[2].replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
  body = rewriteMarkup(body);

  return {
    bodyClass,
    html: `${styleBlocks}\n${body}`,
  };
}
