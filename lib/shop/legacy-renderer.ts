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

  // Preserve the exact downloaded Elementor/Vamtam markup and CSS, but never
  // execute the old WordPress/WooCommerce runtime scripts.
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

  // On Vercel previews use /shop/*; middleware exposes these as clean URLs on
  // shop.resetclinic.org after deployment.
  result = result.replace(/\bhref=(['"])https?:\/\/shop\.resetclinic\.org(?:\/([^'"]*))?\1/gi, (_match, quote, rest = "") => {
    const suffix = String(rest).replace(/^\/+/, "");
    return `href=${quote}/shop/${suffix}${quote}`;
  });

  result = result.replace(/\b(src|poster|href)=(['"])(\.\.?\/)*(wp-content|wp-includes)\/([^'"]+)\2/gi, (_match, attr, quote, _dots, root, rest) => {
    return `${attr}=${quote}/shop-archive/${root}/${rest}${quote}`;
  });

  // CSS from the browser save can contain root-relative WordPress media URLs.
  result = result.replace(/url\((['"]?)\/(wp-content|wp-includes)\/([^)'"\s]+)\1\)/gi, (_match, quote, root, rest) => {
    return `url(${quote}/shop-archive/${root}/${rest}${quote})`;
  });

  return result;
}

export async function loadLegacyShopDocument() {
  const source = await readFile(path.join(ARCHIVE_ROOT, "index.html"), "utf8");
  return rewriteMarkup(source);
}
