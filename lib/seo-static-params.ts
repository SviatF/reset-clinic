import { ALL_SEO_LANDINGS } from "./seo-page-resolver";

export type SeoNamespace =
  | "/dermatology/"
  | "/cosmetology/"
  | "/nutrition/"
  | "/skin-problems/";

/**
 * Build-time params for the code-defined SEO landing architecture.
 *
 * Every landing in these namespaces is pre-rendered during `next build`.
 * The route-level `revalidate` value then turns the generated HTML into ISR,
 * so related editorial content can refresh without returning to runtime SSR.
 */
export function seoStaticParams(namespace: SeoNamespace) {
  return ALL_SEO_LANDINGS
    .filter((landing) => landing.path === namespace || landing.path.startsWith(namespace))
    .map((landing) => {
      const remainder = landing.path
        .slice(namespace.length)
        .replace(/^\/+|\/+$/g, "");

      return {
        slug: remainder ? remainder.split("/") : [],
      };
    });
}
