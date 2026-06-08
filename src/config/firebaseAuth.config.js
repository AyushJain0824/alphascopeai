/**
 * Firebase Authentication (Google Sign-In / Phone OTP) — optional wiring.
 *
 * 1. Create a Firebase project: https://console.firebase.google.com/
 * 2. Enable Authentication → Sign-in method → Google (and/or Phone).
 * 3. Add a Web app and copy the config values into `.env` (Vite exposes only VITE_*):
 *
 *    VITE_FIREBASE_API_KEY=
 *    VITE_FIREBASE_AUTH_DOMAIN=
 *    VITE_FIREBASE_PROJECT_ID=
 *    VITE_FIREBASE_APP_ID=
 *
 * 4. Install the SDK when you are ready to enable real Google sign-in:
 *    npm install firebase
 *
 * 5. Implement sign-in in `src/context/AuthContext.jsx` (signInWithGoogle) using
 *    `initializeApp` + `getAuth` + `GoogleAuthProvider` + `signInWithPopup`.
 *
 * Until then, the "Continue with Google" button shows a clear configuration message.
 */

export const FIREBASE_ENV_KEYS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
];

export function isFirebaseConfigPresent() {
  return FIREBASE_ENV_KEYS.every((k) => {
    const v = import.meta.env?.[k];
    return typeof v === "string" && v.trim().length > 0;
  });
}
