/** Local multi-user account storage (browser only). */

export const ACCOUNTS_STORAGE_KEY = "alphascope_accounts_v1";

/** Demo OTP for signup verification (replace with Firebase or email OTP when wired). */
export const SIGNUP_DEMO_OTP = "0000";

export function normalizeUserId(raw) {
  return String(raw || "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 32);
}

export function validateUserIdFormat(id) {
  if (!id || id.length < 3) return "User ID must be at least 3 characters.";
  if (!/^[a-zA-Z0-9_]+$/.test(id)) return "User ID may only contain letters, numbers, and underscores.";
  if (id.length > 32) return "User ID must be 32 characters or fewer.";
  return null;
}

export function loadUsers() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (u) =>
        u &&
        typeof u.userId === "string" &&
        typeof u.username === "string" &&
        u.passwordRecord &&
        typeof u.passwordRecord.salt === "string" &&
        typeof u.passwordRecord.hash === "string" &&
        typeof u.passwordRecord.iterations === "number"
    );
  } catch {
    return [];
  }
}

export function saveUsers(users) {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(users));
  } catch {
    /* ignore */
  }
}

export function findUserByIdentifier(users, identifier) {
  const q = String(identifier || "").trim();
  if (!q) return null;
  const byId = users.find((u) => u.userId === q);
  if (byId) return byId;
  const lower = q.toLowerCase();
  return users.find((u) => u.username.trim().toLowerCase() === lower) || null;
}

export function isUserIdTaken(users, userId) {
  return users.some((u) => u.userId === userId);
}
