export const GENERAL_META_PIXEL_ID = "1847773375994923";

export const PROMO_META_PIXEL_IDS = {
  botulinotherapy: "940496765773976",
  lips: "1964139074220419",
  biopatid: "1984500745803856",
  nutrition: "921249847728828",
  "facial-cleaning": "1080403651070588",
  "ipl-face": "1739524103783402",
} as const;

export type PromoPixelSlug = keyof typeof PROMO_META_PIXEL_IDS;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    fbq?: (...args: unknown[]) => void;
    __resetInitializedPromoPixels?: Record<string, boolean>;
  }
}

const LEAD_FIRED_AT_KEY = "reset_meta_lead_fired_at";

export function getPromoPixelSlug(pathname: string): PromoPixelSlug | null {
  const match = pathname.match(/^\/promo\/([^/]+)(?:\/quiz)?\/?$/);
  if (!match) return null;
  const slug = match[1] as PromoPixelSlug;
  return slug in PROMO_META_PIXEL_IDS ? slug : null;
}

export function getPromoPixelId(pathname: string) {
  const slug = getPromoPixelSlug(pathname);
  return slug ? PROMO_META_PIXEL_IDS[slug] : null;
}

function ensureDataLayer() {
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

export function ensurePromoPixelInitialized(pathname = window.location.pathname) {
  const slug = getPromoPixelSlug(pathname);
  if (!slug || typeof window.fbq !== "function") return null;

  const pixelId = PROMO_META_PIXEL_IDS[slug];
  window.__resetInitializedPromoPixels = window.__resetInitializedPromoPixels || {};

  if (!window.__resetInitializedPromoPixels[pixelId]) {
    window.fbq("init", pixelId);
    window.__resetInitializedPromoPixels[pixelId] = true;
  }

  return { slug, pixelId };
}

function trackSingle(pixelId: string, eventName: string, payload?: Record<string, unknown>) {
  if (typeof window.fbq !== "function") return;
  if (payload && Object.keys(payload).length > 0) {
    window.fbq("trackSingle", pixelId, eventName, payload);
  } else {
    window.fbq("trackSingle", pixelId, eventName);
  }
}

function trackSingleCustom(pixelId: string, eventName: string, payload?: Record<string, unknown>) {
  if (typeof window.fbq !== "function") return;
  window.fbq("trackSingleCustom", pixelId, eventName, payload ?? {});
}

export function trackPageView(pathname = window.location.pathname, includeGeneral = true) {
  if (includeGeneral) trackSingle(GENERAL_META_PIXEL_ID, "PageView");
  const promo = ensurePromoPixelInitialized(pathname);
  if (promo) trackSingle(promo.pixelId, "PageView");
}

export function trackPromoCustomEvent(
  eventName: string,
  payload: Record<string, unknown>,
  pathname = window.location.pathname,
) {
  ensureDataLayer().push({ event: eventName, ...payload });
  trackSingleCustom(GENERAL_META_PIXEL_ID, eventName, payload);
  const promo = ensurePromoPixelInitialized(pathname);
  if (promo) trackSingleCustom(promo.pixelId, eventName, payload);
}

export function trackLeadConversion(
  payload: Record<string, unknown> = {},
  pathname = window.location.pathname,
) {
  const promo = ensurePromoPixelInitialized(pathname);
  const eventPayload = {
    lead_type: "website_application",
    page_path: pathname,
    page_location: window.location.href,
    ...payload,
    ...(promo ? { promo_service: promo.slug } : {}),
  };

  ensureDataLayer().push({ event: "generate_lead", ...eventPayload });
  trackSingle(GENERAL_META_PIXEL_ID, "Lead", eventPayload);
  if (promo) trackSingle(promo.pixelId, "Lead", eventPayload);

  window.sessionStorage.setItem(LEAD_FIRED_AT_KEY, String(Date.now()));
}

export function wasLeadTrackedRecently(maxAgeMs = 120_000) {
  const value = Number(window.sessionStorage.getItem(LEAD_FIRED_AT_KEY) || 0);
  return value > 0 && Date.now() - value <= maxAgeMs;
}

export function trackContactConversion(
  payload: Record<string, unknown> = {},
  pathname = window.location.pathname,
) {
  const promo = ensurePromoPixelInitialized(pathname);
  const eventPayload = {
    contact_method: "phone",
    page_path: pathname,
    page_location: window.location.href,
    ...payload,
    ...(promo ? { promo_service: promo.slug } : {}),
  };

  ensureDataLayer().push({ event: "contact_click", ...eventPayload });
  trackSingle(GENERAL_META_PIXEL_ID, "Contact", eventPayload);
  if (promo) trackSingle(promo.pixelId, "Contact", eventPayload);
}
