import openNextWorker from "./.open-next/worker.js";

const HOURLY_CRON = "0 * * * *";
const FALLBACK_SITE_URL = "https://resetclinic.org";

function siteUrl(env) {
  return env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL;
}

function exposeRuntimeBindings(env) {
  globalThis.__RESET_DATA_R2 = env.RESET_DATA_R2;
}

async function invokeProtectedCron(pathname, env, ctx) {
  const secret = env.SEO_CRON_SECRET;
  if (!secret) {
    throw new Error("SEO_CRON_SECRET is not configured on the Cloudflare Worker.");
  }

  const url = new URL(pathname, siteUrl(env));
  const response = await openNextWorker.fetch(
    new Request(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${secret}`,
        "content-type": "application/json",
        "x-reset-scheduled-source": "cloudflare-cron",
      },
      body: "{}",
    }),
    env,
    ctx,
  );

  const body = await response.text();
  if (!response.ok) {
    console.error(JSON.stringify({ pathname, status: response.status, body }));
    throw new Error(`${pathname} returned HTTP ${response.status}`);
  }

  console.log(JSON.stringify({ pathname, status: response.status, body }));
}

export default {
  fetch(request, env, ctx) {
    exposeRuntimeBindings(env);
    return openNextWorker.fetch(request, env, ctx);
  },

  async scheduled(controller, env, ctx) {
    if (controller.cron !== HOURLY_CRON) return;
    exposeRuntimeBindings(env);

    const results = await Promise.allSettled([
      invokeProtectedCron("/api/cron/seo-sync/", env, ctx),
      invokeProtectedCron("/api/cron/seo-report/", env, ctx),
    ]);

    const failed = results.find((result) => result.status === "rejected");
    if (failed?.status === "rejected") throw failed.reason;
  },
};
