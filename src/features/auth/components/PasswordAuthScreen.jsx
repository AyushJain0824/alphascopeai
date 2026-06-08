import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { buildThemeStylesheet } from "../../../theme/themeVariables";
import { passwordStrengthLabel, passwordStrengthScore } from "../../../utils/passwordCrypto";
import { useAuth } from "../../../hooks/useAuth";
import { SIGNUP_DEMO_OTP, validateUserIdFormat, normalizeUserId } from "../../../utils/localAccounts";

function IconZap({ size = 20, color = "white" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconEye({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function PasswordAuthScreen() {
  const {
    hasAccounts,
    hasLegacyPassword,
    login,
    loginWithAccount,
    createPassword,
    completeSignup,
    signInWithGoogle,
  } = useAuth();

  const [mainTab, setMainTab] = useState(() => (hasAccounts ? "signin" : "signup"));
  const [signupStep, setSignupStep] = useState(1);
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otp, setOtp] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [legacyPassword, setLegacyPassword] = useState("");
  const [legacyConfirm, setLegacyConfirm] = useState("");
  const [legacyDisplayName, setLegacyDisplayName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = passwordStrengthScore(password);
  const strengthLabel = passwordStrengthLabel(strength);
  const showLegacyTab = !hasAccounts;

  const resetSignup = () => {
    setSignupStep(1);
    setUsername("");
    setUserId("");
    setPassword("");
    setConfirm("");
    setOtp("");
    setError("");
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    const res = await signInWithGoogle();
    if (!res.ok) setError(res.error || "Google sign-in unavailable.");
    setLoading(false);
  };

  const goSignupNext = () => {
    setError("");
    if (!username.trim()) {
      setError("Enter your full name.");
      return;
    }
    const uid = normalizeUserId(userId);
    const idErr = validateUserIdFormat(uid);
    if (idErr) {
      setError(idErr);
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (passwordStrengthScore(password) < 2) {
      setError("Choose a stronger password (mix letters, numbers, symbols).");
      return;
    }
    setSignupStep(2);
  };

  const handleSignupVerify = async () => {
    setError("");
    if (String(otp).trim() !== SIGNUP_DEMO_OTP) {
      setError(`Invalid OTP. Demo code: ${SIGNUP_DEMO_OTP}`);
      return;
    }
    setLoading(true);
    try {
      await completeSignup({
        username: username.trim(),
        userId: normalizeUserId(userId),
        password,
      });
      resetSignup();
    } catch (e) {
      setError(e?.message || "Could not create account.");
    }
    setLoading(false);
  };

  const handleAccountSignIn = async () => {
    setError("");
    if (!identifier.trim() || !password) {
      setError("Enter User ID or username and password.");
      return;
    }
    setLoading(true);
    const res = await loginWithAccount(identifier, password);
    if (!res.ok) setError(res.error || "Sign in failed.");
    setLoading(false);
  };

  const handleLegacyCreate = async () => {
    setError("");
    if (legacyPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (legacyPassword !== legacyConfirm) {
      setError("Passwords do not match.");
      return;
    }
    if (passwordStrengthScore(legacyPassword) < 2) {
      setError("Please choose a stronger password.");
      return;
    }
    setLoading(true);
    try {
      await createPassword(legacyPassword, legacyDisplayName);
    } catch (e) {
      setError(e?.message || "Could not save password.");
    }
    setLoading(false);
  };

  const handleLegacyLogin = async () => {
    setError("");
    if (!legacyPassword) {
      setError("Enter your app password.");
      return;
    }
    setLoading(true);
    const res = await login(legacyPassword);
    if (!res.ok) setError(res.error || "Incorrect password.");
    setLoading(false);
  };

  return (
    <>
      <style>{buildThemeStylesheet()}</style>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background:
            "radial-gradient(ellipse at 20% 50%,rgba(0,212,255,0.08) 0%,transparent 50%), radial-gradient(ellipse at 80% 20%,rgba(124,58,237,0.08) 0%,transparent 50%), var(--bg)",
        }}
      >
        <motion.div
          key={mainTab + signupStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{ width: "100%", maxWidth: 440 }}
        >
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "linear-gradient(135deg,var(--accent),var(--accent2))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconZap size={22} color="white" />
              </div>
              <span
                style={{
                  fontSize: 26,
                  fontFamily: "var(--font-head)",
                  fontWeight: 700,
                  background: "linear-gradient(135deg,var(--gradient-text-from),var(--gradient-text-to))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                AlphaScope AI
              </span>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>Secure access · Local encryption</p>
          </div>

          <div className="glass" style={{ padding: 28 }}>
            <div className="tab-list" style={{ marginBottom: 22, flexWrap: "wrap" }}>
              <button
                type="button"
                className={`tab-item ${mainTab === "signin" ? "active" : ""}`}
                style={{ flex: 1, textAlign: "center", minWidth: 90 }}
                onClick={() => {
                  setMainTab("signin");
                  setError("");
                  setSignupStep(1);
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                className={`tab-item ${mainTab === "signup" ? "active" : ""}`}
                style={{ flex: 1, textAlign: "center", minWidth: 90 }}
                onClick={() => {
                  setMainTab("signup");
                  setError("");
                  setSignupStep(1);
                }}
              >
                Sign up
              </button>
              {showLegacyTab ? (
                <button
                  type="button"
                  className={`tab-item ${mainTab === "legacy" ? "active" : ""}`}
                  style={{ flex: 1, textAlign: "center", minWidth: 100 }}
                  onClick={() => {
                    setMainTab("legacy");
                    setError("");
                  }}
                >
                  App password
                </button>
              ) : null}
            </div>

            <AnimatePresence mode="wait">
              {error ? (
                <motion.div
                  key="err"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0 }}
                  style={{
                    color: "var(--red)",
                    fontSize: 12,
                    marginBottom: 14,
                    padding: "10px 12px",
                    background: "rgba(255,69,96,0.1)",
                    borderRadius: 8,
                    border: "1px solid rgba(255,69,96,0.2)",
                  }}
                >
                  {error}
                </motion.div>
              ) : null}
            </AnimatePresence>

            {mainTab === "signin" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
                {hasAccounts ? (
                  <>
                    <h2 style={{ fontFamily: "var(--font-head)", fontSize: 17, fontWeight: 600, marginBottom: 16, color: "var(--text)" }}>
                      Welcome back
                    </h2>
                    <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>
                      USER ID OR USERNAME
                    </label>
                    <input
                      placeholder="e.g. jain_pratik or Pratik Jain"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      autoComplete="username"
                      style={{ marginBottom: 14 }}
                    />
                    <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>PASSWORD</label>
                    <div style={{ position: "relative", marginBottom: 16 }}>
                      <input
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAccountSignIn()}
                        autoComplete="current-password"
                        style={{ paddingRight: 44 }}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost"
                        aria-label={showPw ? "Hide password" : "Show password"}
                        onClick={() => setShowPw((s) => !s)}
                        style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", padding: 6 }}
                      >
                        {showPw ? <IconEyeOff /> : <IconEye />}
                      </button>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: "100%", justifyContent: "center", padding: "12px", marginBottom: 12 }}
                      onClick={handleAccountSignIn}
                      disabled={loading}
                    >
                      {loading ? <div className="spinner" /> : "Sign in"}
                    </button>
                    <div style={{ position: "relative", margin: "16px 0", textAlign: "center" }}>
                      <div style={{ height: 1, background: "var(--border)", position: "absolute", inset: "50% 0 auto" }} />
                      <span style={{ position: "relative", background: "var(--bg2)", padding: "0 12px", color: "var(--muted)", fontSize: 12 }}>or</span>
                    </div>
                    <button type="button" className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", gap: 10 }} onClick={handleGoogle} disabled={loading}>
                      <svg width="16" height="16" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Continue with Google
                    </button>
                  </>
                ) : (
                  <>
                    <h2 style={{ fontFamily: "var(--font-head)", fontSize: 17, fontWeight: 600, marginBottom: 10, color: "var(--text)" }}>No account yet</h2>
                    <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
                      Register on the <strong style={{ color: "var(--text)" }}>Sign up</strong> tab, or use{" "}
                      <strong style={{ color: "var(--text)" }}>App password</strong> if you only use a device password.
                    </p>
                  </>
                )}
              </motion.div>
            )}

            {mainTab === "signup" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
                {signupStep === 1 ? (
                  <>
                    <h2 style={{ fontFamily: "var(--font-head)", fontSize: 17, fontWeight: 600, marginBottom: 16, color: "var(--text)" }}>Create account</h2>
                    <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>FULL NAME</label>
                    <input placeholder="Your display name" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="name" style={{ marginBottom: 12 }} />
                    <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>USER ID (UNIQUE)</label>
                    <input placeholder="letters, numbers, underscore" value={userId} onChange={(e) => setUserId(e.target.value)} autoComplete="off" style={{ marginBottom: 12 }} />
                    <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>PASSWORD</label>
                    <div style={{ position: "relative", marginBottom: 10 }}>
                      <input
                        type={showPw ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        style={{ paddingRight: 44 }}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setShowPw((s) => !s)}
                        style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", padding: 6 }}
                      >
                        {showPw ? <IconEyeOff /> : <IconEye />}
                      </button>
                    </div>
                    <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>CONFIRM PASSWORD</label>
                    <input type={showPw ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" style={{ marginBottom: 10 }} />
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>Strength</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)" }}>{strengthLabel}</span>
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            style={{
                              flex: 1,
                              height: 4,
                              borderRadius: 99,
                              background:
                                i <= strength ? (strength <= 1 ? "var(--red)" : strength === 2 ? "var(--yellow)" : "var(--green)") : "var(--border)",
                              opacity: i <= strength ? 1 : 0.35,
                              transition: "background 0.3s ease",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <button type="button" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "12px" }} onClick={goSignupNext}>
                      Continue to verification
                    </button>
                  </>
                ) : (
                  <>
                    <h2 style={{ fontFamily: "var(--font-head)", fontSize: 17, fontWeight: 600, marginBottom: 8, color: "var(--text)" }}>Verify OTP</h2>
                    <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
                      Demo OTP (local): <strong style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>{SIGNUP_DEMO_OTP}</strong>
                      <br />
                      Replace with Firebase Phone / Email OTP when configured.
                    </p>
                    <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>ENTER OTP</label>
                    <input
                      placeholder="0000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
                      inputMode="numeric"
                      style={{ marginBottom: 16, letterSpacing: "0.2em", fontFamily: "var(--font-mono)", fontSize: 18 }}
                    />
                    <div style={{ display: "flex", gap: 10 }}>
                      <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => setSignupStep(1)}>
                        Back
                      </button>
                      <button type="button" className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }} onClick={handleSignupVerify} disabled={loading}>
                        {loading ? <div className="spinner" /> : "Create account"}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {mainTab === "legacy" && showLegacyTab && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
                <h2 style={{ fontFamily: "var(--font-head)", fontSize: 17, fontWeight: 600, marginBottom: 8, color: "var(--text)" }}>Device app password</h2>
                <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 16, lineHeight: 1.6 }}>
                  Original single-password unlock. After you register an account, sign in with User ID + password instead.
                </p>
                {hasLegacyPassword ? (
                  <>
                    <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>APP PASSWORD</label>
                    <div style={{ position: "relative", marginBottom: 16 }}>
                      <input
                        type={showPw ? "text" : "password"}
                        value={legacyPassword}
                        onChange={(e) => setLegacyPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleLegacyLogin()}
                        style={{ paddingRight: 44 }}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setShowPw((s) => !s)}
                        style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", padding: 6 }}
                      >
                        {showPw ? <IconEyeOff /> : <IconEye />}
                      </button>
                    </div>
                    <button type="button" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "12px" }} onClick={handleLegacyLogin} disabled={loading}>
                      {loading ? <div className="spinner" /> : "Unlock with app password"}
                    </button>
                  </>
                ) : (
                  <>
                    <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>DISPLAY NAME (OPTIONAL)</label>
                    <input placeholder="Your name" value={legacyDisplayName} onChange={(e) => setLegacyDisplayName(e.target.value)} style={{ marginBottom: 12 }} />
                    <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>NEW APP PASSWORD</label>
                    <input
                      type={showPw ? "text" : "password"}
                      value={legacyPassword}
                      onChange={(e) => setLegacyPassword(e.target.value)}
                      style={{ marginBottom: 12 }}
                    />
                    <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>CONFIRM</label>
                    <input type={showPw ? "text" : "password"} value={legacyConfirm} onChange={(e) => setLegacyConfirm(e.target.value)} style={{ marginBottom: 16 }} />
                    <button type="button" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "12px" }} onClick={handleLegacyCreate} disabled={loading}>
                      {loading ? <div className="spinner" /> : "Create app password"}
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {mainTab === "signin" && hasAccounts ? (
              <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 11, marginTop: 18 }}>Passwords are hashed (PBKDF2). Data stays on this device.</p>
            ) : mainTab === "signup" ? (
              <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 11, marginTop: 18 }}>Duplicate User IDs are blocked. You can change password later in Settings.</p>
            ) : (
              <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 11, marginTop: 18 }}>Legacy mode uses the same secure hashing as accounts.</p>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}
