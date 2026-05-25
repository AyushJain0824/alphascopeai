import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { hashPassword, verifyPassword } from "../utils/passwordCrypto";
import {
  findUserByIdentifier,
  isUserIdTaken,
  loadUsers,
  normalizeUserId,
  saveUsers,
  validateUserIdFormat,
} from "../utils/localAccounts";
import { isFirebaseConfigPresent } from "../config/firebaseAuth.config";

const STORAGE_PASSWORD = "alphascope_password_record_v1";
const STORAGE_SESSION = "alphascope_session_v1";
const STORAGE_PROFILE = "alphascope_user_profile_v1";

const AuthContext = createContext(null);

function loadPasswordRecord() {
  try {
    const raw = localStorage.getItem(STORAGE_PASSWORD);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (o && typeof o.salt === "string" && typeof o.hash === "string" && typeof o.iterations === "number") return o;
  } catch {
    /* ignore */
  }
  return null;
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_PROFILE);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (o && typeof o.name === "string") return { name: o.name, email: o.email || "", plan: o.plan || "pro" };
  } catch {
    /* ignore */
  }
  return null;
}

function saveProfile(profile) {
  try {
    localStorage.setItem(STORAGE_PROFILE, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

/** @returns {{ type: 'legacy' } | { type: 'account', userId: string } | null} */
function readSession() {
  try {
    const s = localStorage.getItem(STORAGE_SESSION);
    if (!s) return null;
    if (s === "1") return { type: "legacy" };
    const o = JSON.parse(s);
    if (o && o.v === 2 && typeof o.userId === "string") return { type: "account", userId: o.userId };
  } catch {
    /* ignore */
  }
  return null;
}

function writeSessionLegacy() {
  localStorage.setItem(STORAGE_SESSION, "1");
}

function writeSessionAccount(userId) {
  localStorage.setItem(STORAGE_SESSION, JSON.stringify({ v: 2, userId }));
}

function clearSessionStorage() {
  try {
    localStorage.removeItem(STORAGE_SESSION);
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }) {
  const [passwordRecord, setPasswordRecord] = useState(() => loadPasswordRecord());
  const [accounts, setAccounts] = useState(() => loadUsers());
  const [session, setSession] = useState(() => readSession());
  const [profile, setProfile] = useState(() => loadProfile());

  const refreshAccounts = useCallback(() => {
    setAccounts(loadUsers());
  }, []);

  useEffect(() => {
    setPasswordRecord(loadPasswordRecord());
    setSession(readSession());
  }, []);

  useEffect(() => {
    try {
      if (!loadPasswordRecord() && localStorage.getItem(STORAGE_SESSION) === "1") {
        localStorage.removeItem(STORAGE_SESSION);
        setSession(null);
      }
      if (loadUsers().length > 0 && localStorage.getItem(STORAGE_SESSION) === "1") {
        localStorage.removeItem(STORAGE_SESSION);
        setSession(null);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const hasAccounts = accounts.length > 0;
  const hasLegacyPassword = Boolean(passwordRecord);
  const hasPassword = hasLegacyPassword || hasAccounts;

  const isAuthenticated = useMemo(() => {
    const sess = session;
    if (!sess) return false;
    if (hasAccounts) {
      if (sess.type !== "account") return false;
      return accounts.some((u) => u.userId === sess.userId);
    }
    if (sess.type === "legacy" && hasLegacyPassword) return true;
    return false;
  }, [session, hasAccounts, accounts, hasLegacyPassword]);

  const persistLegacyRecord = useCallback((rec) => {
    try {
      localStorage.setItem(STORAGE_PASSWORD, JSON.stringify(rec));
    } catch {
      /* ignore */
    }
    setPasswordRecord(rec);
  }, []);

  const activateLegacySession = useCallback((userProfile) => {
    writeSessionLegacy();
    setSession({ type: "legacy" });
    const p =
      (userProfile && typeof userProfile.name === "string" ? userProfile : null) ||
      loadProfile() ||
      { name: "AlphaScope User", email: "", plan: "pro" };
    saveProfile(p);
    setProfile(p);
  }, []);

  const activateAccountSession = useCallback((userId, userProfile) => {
    writeSessionAccount(userId);
    setSession({ type: "account", userId });
    const p = userProfile || { name: "AlphaScope User", email: "", plan: "pro" };
    saveProfile(p);
    setProfile(p);
  }, []);

  /** Legacy: create single app password (no accounts yet). */
  const createPassword = useCallback(
    async (plainPassword, displayName) => {
      if (loadUsers().length > 0) {
        throw new Error("Accounts already exist. Sign in with your User ID instead.");
      }
      const rec = await hashPassword(plainPassword);
      persistLegacyRecord(rec);
      const userProfile = {
        name: (displayName && displayName.trim()) || "AlphaScope User",
        email: "",
        plan: "pro",
      };
      activateLegacySession(userProfile);
    },
    [activateLegacySession, persistLegacyRecord]
  );

  /** Legacy: login with app password only. */
  const login = useCallback(
    async (plainPassword) => {
      if (loadUsers().length > 0) {
        return { ok: false, error: "Use User ID or username with your account password." };
      }
      const rec = loadPasswordRecord();
      if (!rec) return { ok: false, error: "No password configured." };
      const ok = await verifyPassword(plainPassword, rec);
      if (!ok) return { ok: false, error: "Incorrect password." };
      activateLegacySession(loadProfile() || { name: "AlphaScope User", email: "", plan: "pro" });
      return { ok: true };
    },
    [activateLegacySession]
  );

  /** Account: sign in with User ID or username + password. */
  const loginWithAccount = useCallback(
    async (identifier, plainPassword) => {
      const users = loadUsers();
      if (!users.length) return { ok: false, error: "No registered accounts on this device." };
      const id = String(identifier || "").trim();
      if (!id) return { ok: false, error: "Enter your User ID or username." };
      if (!plainPassword) return { ok: false, error: "Enter your password." };
      const u = findUserByIdentifier(users, id);
      if (!u) return { ok: false, error: "No account matches that User ID or username." };
      const ok = await verifyPassword(plainPassword, u.passwordRecord);
      if (!ok) return { ok: false, error: "Incorrect password." };
      activateAccountSession(u.userId, { name: u.username, email: u.email || "", plan: "pro" });
      setAccounts(loadUsers());
      return { ok: true };
    },
    [activateAccountSession]
  );

  /**
   * Complete signup after OTP. Persists hashed password + profile; clears legacy app password if present.
   */
  const completeSignup = useCallback(
    async ({ username, userId, password }) => {
      const name = String(username || "").trim();
      const uid = normalizeUserId(userId);
      const fmtErr = validateUserIdFormat(uid);
      if (fmtErr) throw new Error(fmtErr);
      if (name.length < 2) throw new Error("Full name must be at least 2 characters.");
      if (password.length < 8) throw new Error("Password must be at least 8 characters.");
      const users = loadUsers();
      if (isUserIdTaken(users, uid)) throw new Error("This User ID is already taken. Choose another.");
      const rec = await hashPassword(password);
      const row = {
        userId: uid,
        username: name,
        passwordRecord: rec,
        loginMethod: "local",
        email: "",
      };
      const next = [...users, row];
      saveUsers(next);
      setAccounts(next);
      try {
        localStorage.removeItem(STORAGE_PASSWORD);
      } catch {
        /* ignore */
      }
      setPasswordRecord(null);
      activateAccountSession(uid, { name, email: "", plan: "pro" });
      return { ok: true };
    },
    [activateAccountSession]
  );

  const logout = useCallback(() => {
    clearSessionStorage();
    setSession(null);
  }, []);

  const changePassword = useCallback(
    async (currentPlain, newPlain) => {
      const sess = readSession();
      const users = loadUsers();

      if (users.length > 0 && sess?.type === "account") {
        const u = users.find((x) => x.userId === sess.userId);
        if (!u) return { ok: false, error: "Session invalid. Sign in again." };
        const ok = await verifyPassword(currentPlain, u.passwordRecord);
        if (!ok) return { ok: false, error: "Current password is incorrect." };
        const nextRec = await hashPassword(newPlain);
        const nextUsers = users.map((x) => (x.userId === u.userId ? { ...x, passwordRecord: nextRec } : x));
        saveUsers(nextUsers);
        setAccounts(nextUsers);
        return { ok: true };
      }

      const rec = loadPasswordRecord();
      if (!rec) return { ok: false, error: "No password on file." };
      const ok = await verifyPassword(currentPlain, rec);
      if (!ok) return { ok: false, error: "Current password is incorrect." };
      const next = await hashPassword(newPlain);
      persistLegacyRecord(next);
      return { ok: true };
    },
    [persistLegacyRecord]
  );

  const signInWithGoogle = useCallback(async () => {
    if (!isFirebaseConfigPresent()) {
      return {
        ok: false,
        error:
          "Google sign-in is not configured. Add VITE_FIREBASE_* keys in `.env` and wire Firebase in AuthContext (see src/config/firebaseAuth.config.js).",
      };
    }
    return {
      ok: false,
      error:
        "Firebase env keys are present, but the Google provider is not wired yet. Install `firebase` and implement signInWithPopup in AuthContext.",
    };
  }, []);

  const user = profile || { name: "AlphaScope User", email: "", plan: "pro" };

  const value = useMemo(
    () => ({
      hasPassword,
      hasLegacyPassword,
      hasAccounts,
      accounts,
      isAuthenticated,
      user,
      profile: user,
      session,
      createPassword,
      login,
      loginWithAccount,
      completeSignup,
      logout,
      changePassword,
      signInWithGoogle,
      refreshAccounts,
      updateDisplayName: (name) => {
        const next = { ...user, name: name || user.name };
        saveProfile(next);
        setProfile(next);
      },
    }),
    [
      hasPassword,
      hasLegacyPassword,
      hasAccounts,
      accounts,
      isAuthenticated,
      user,
      session,
      createPassword,
      login,
      loginWithAccount,
      completeSignup,
      logout,
      changePassword,
      signInWithGoogle,
      refreshAccounts,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
