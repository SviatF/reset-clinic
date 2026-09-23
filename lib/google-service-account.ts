import { createSign } from "node:crypto";

function base64url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function normalizePrivateKey(rawKey: string) {
  let value = rawKey.trim();

  // Accept an accidentally pasted JSON service-account object as well as the
  // intended GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY value.
  if (value.startsWith("{")) {
    try {
      const parsed = JSON.parse(value) as { private_key?: string };
      if (parsed.private_key) value = parsed.private_key;
    } catch {
      // Fall through to the validation below for a clear error message.
    }
  }

  // Some hosting panels preserve surrounding JSON-style quotes. Decode them
  // when possible before turning escaped newlines into real PEM line breaks.
  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      value = JSON.parse(value) as string;
    } catch {
      value = value.slice(1, -1);
    }
  }

  value = value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .trim();

  const pem = value.match(/-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA )?PRIVATE KEY-----/)?.[0] || value;
  if (!pem.startsWith("-----BEGIN ") || !pem.includes("PRIVATE KEY-----") || !pem.includes("-----END ")) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is not a valid PEM private key");
  }
  return pem;
}

export function isGoogleSeoConfigured() {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY &&
      (process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || process.env.GA4_PROPERTY_ID),
  );
}

export async function getGoogleAccessToken(scopes: string[]) {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !rawKey) throw new Error("Google service account is not configured");

  const privateKey = normalizePrivateKey(rawKey);
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iss: email,
      scope: scopes.join(" "),
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = base64url(signer.sign(privateKey));
  const assertion = `${unsigned}.${signature}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth-grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });

  const data = (await response.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || `Google OAuth ${response.status}`);
  }
  return data.access_token;
}
