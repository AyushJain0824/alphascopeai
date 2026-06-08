import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../hooks/useAuth";
import { passwordStrengthLabel, passwordStrengthScore } from "../../../utils/passwordCrypto";
import { ThemeToggleButton } from "../../../components/layout/ThemeToggleButton";

function IconClose({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconEye({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function SettingsModal({ open, onClose, onNotify }) {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState("");
  const [nextPw, setNextPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const strength = passwordStrengthScore(nextPw);
  const strengthLabel = passwordStrengthLabel(strength);

  useEffect(() => {
    if (!open) return;
    setCurrent("");
    setNextPw("");
    setConfirm("");
    setFormError("");
    setShow1(false);
    setShow2(false);
    setBusy(false);
  }, [open]);

  const resetForm = () => {
    setCurrent("");
    setNextPw("");
    setConfirm("");
    setFormError("");
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!current || !nextPw || !confirm) {
      setFormError("Fill all fields.");
      return;
    }
    if (nextPw.length < 8) {
      setFormError("New password must be at least 8 characters.");
      return;
    }
    if (nextPw !== confirm) {
      setFormError("New passwords do not match.");
      return;
    }
    if (passwordStrengthScore(nextPw) < 2) {
      setFormError("New password is too weak. Add mixed case, numbers, or symbols.");
      return;
    }
    setBusy(true);
    try {
      const res = await changePassword(current, nextPw);
      if (!res.ok) {
        setFormError(res.error || "Could not update password.");
        setBusy(false);
        return;
      }
      onNotify?.("Password updated successfully.", "success");
      resetForm();
      onClose?.();
    } catch (e) {
      setFormError(e?.message || "Update failed.");
    }
    setBusy(false);
  };

  return (
    <AnimatePresence>
      {open ? (
        <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={onClose}>
          <motion.div
            className="modal-box"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.28 }}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 480 }}
          >
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 id="settings-title" style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 700 }}>
                Settings
              </h2>
              <button type="button" className="btn btn-ghost" style={{ padding: 8 }} onClick={onClose} aria-label="Close settings">
                <IconClose />
              </button>
            </div>

            <div style={{ padding: 24 }}>
              <section style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 12, letterSpacing: "0.06em" }}>APPEARANCE</h3>
                <div className="glass" style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Theme</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>Switch dark / light. Saved on this device.</div>
                  </div>
                  <ThemeToggleButton />
                </div>
              </section>

              <section>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 12, letterSpacing: "0.06em" }}>SECURITY</h3>
                <div className="glass" style={{ padding: 20 }}>
                  <h4 style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Change password</h4>

                  {formError ? (
                    <div
                      style={{
                        color: "var(--red)",
                        fontSize: 12,
                        marginBottom: 14,
                        padding: "8px 12px",
                        background: "rgba(255,69,96,0.08)",
                        borderRadius: 8,
                        border: "1px solid rgba(255,69,96,0.2)",
                      }}
                    >
                      {formError}
                    </div>
                  ) : null}

                  <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>CURRENT PASSWORD</label>
                  <div style={{ position: "relative", marginBottom: 14 }}>
                    <input
                      type={show1 ? "text" : "password"}
                      value={current}
                      onChange={(e) => setCurrent(e.target.value)}
                      autoComplete="current-password"
                      style={{ paddingRight: 44 }}
                    />
                    <button type="button" className="btn btn-ghost" onClick={() => setShow1((s) => !s)} style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", padding: 6 }}>
                      {show1 ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>

                  <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>NEW PASSWORD</label>
                  <div style={{ position: "relative", marginBottom: 10 }}>
                    <input
                      type={show2 ? "text" : "password"}
                      value={nextPw}
                      onChange={(e) => setNextPw(e.target.value)}
                      autoComplete="new-password"
                      style={{ paddingRight: 44 }}
                    />
                    <button type="button" className="btn btn-ghost" onClick={() => setShow2((s) => !s)} style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", padding: 6 }}>
                      {show2 ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>

                  <div style={{ marginBottom: 14 }}>
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
                            background: i <= strength ? (strength <= 1 ? "var(--red)" : strength === 2 ? "var(--yellow)" : "var(--green)") : "var(--border)",
                            opacity: i <= strength ? 1 : 0.35,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>CONFIRM NEW PASSWORD</label>
                  <input type={show2 ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" style={{ marginBottom: 18 }} />

                  <button type="button" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={handleSubmit} disabled={busy}>
                    {busy ? <div className="spinner" /> : "Update password"}
                  </button>
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
