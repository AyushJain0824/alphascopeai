/**
 * PBKDF2-SHA256 password hashing for client-side storage.
 * No plaintext password is persisted; only salt + iterations + derived key.
 */

const ITERATIONS = 150_000;
const KEY_LEN = 32;

function bufToB64(buf) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function b64ToBuf(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

function randomSalt() {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return salt.buffer;
}

async function deriveKey(password, saltBuffer, iterations) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: new Uint8Array(saltBuffer), iterations, hash: "SHA-256" },
    keyMaterial,
    KEY_LEN * 8
  );
  return bits;
}

export async function hashPassword(plain) {
  const salt = randomSalt();
  const bits = await deriveKey(plain, salt, ITERATIONS);
  return {
    salt: bufToB64(salt),
    hash: bufToB64(bits),
    iterations: ITERATIONS,
  };
}

export async function verifyPassword(plain, record) {
  if (!record?.salt || !record?.hash || !record.iterations) return false;
  try {
    const saltBuf = b64ToBuf(record.salt);
    const expectedBuf = b64ToBuf(record.hash);
    const bits = await deriveKey(plain, saltBuf, record.iterations);
    const actual = new Uint8Array(bits);
    const expected = new Uint8Array(expectedBuf);
    if (actual.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
    return diff === 0;
  } catch {
    return false;
  }
}

/** Simple strength score 0–4 for UI meter */
export function passwordStrengthScore(plain) {
  if (!plain || plain.length < 6) return 0;
  let s = 0;
  if (plain.length >= 10) s++;
  if (plain.length >= 14) s++;
  if (/[a-z]/.test(plain) && /[A-Z]/.test(plain)) s++;
  if (/\d/.test(plain)) s++;
  if (/[^A-Za-z0-9]/.test(plain)) s++;
  return Math.min(4, s);
}

export function passwordStrengthLabel(score) {
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  return labels[score] ?? "Weak";
}
