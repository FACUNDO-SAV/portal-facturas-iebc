// Sesión simple de un solo usuario. No usamos Supabase Auth: como el Portal
// lo usa solo Facundo por ahora, alcanza con una contraseña (PORTAL_PASSWORD)
// y una cookie firmada. El secreto de firma sale de la propia contraseña +
// una sal fija, así no hace falta una variable de entorno extra.
// Si más adelante se suman más personas, esto se reemplaza por Supabase Auth
// con Row Level Security de verdad.

const COOKIE_NAME = "portal_session";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

function encoder() {
  return new TextEncoder();
}

function bufToHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getSigningKey() {
  const password = process.env.PORTAL_PASSWORD;
  if (!password) {
    throw new Error(
      "Falta la variable de entorno PORTAL_PASSWORD (contraseña de acceso al Portal)."
    );
  }
  const secret = `portal-facturas-iebc::${password}`;
  return crypto.subtle.importKey(
    "raw",
    encoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function checkPassword(candidate: string) {
  const expected = process.env.PORTAL_PASSWORD;
  return Boolean(expected) && candidate === expected;
}

export async function createSessionToken(): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + THIRTY_DAYS;
  const key = await getSigningKey();
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder().encode(String(expiresAt))
  );
  return `${expiresAt}.${bufToHex(sig)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [expiresAtStr, sigHex] = token.split(".");
  if (!expiresAtStr || !sigHex) return false;
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
    return false;
  }
  try {
    const key = await getSigningKey();
    const expectedSig = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder().encode(expiresAtStr)
    );
    return bufToHex(expectedSig) === sigHex;
  } catch {
    return false;
  }
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_MAX_AGE = THIRTY_DAYS;
