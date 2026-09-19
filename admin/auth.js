import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

/*
  STEADFAST ADMIN AUTH
  1. Replace the Firebase values below with your real Firebase Web App config.
  2. Enable Authentication > Sign-in method > Google in Firebase Console.
  3. Add your real admin email to AUTHORIZED_EMAILS.
*/

const firebaseConfig = {
  apiKey: "PASTE_FIREBASE_API_KEY",
  authDomain: "PASTE_FIREBASE_AUTH_DOMAIN",
  projectId: "PASTE_FIREBASE_PROJECT_ID",
  storageBucket: "PASTE_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "PASTE_FIREBASE_MESSAGING_SENDER_ID",
  appId: "PASTE_FIREBASE_APP_ID"
};

// Only these exact Google accounts are allowed through this frontend gate.
const AUTHORIZED_EMAILS = [
  "yahhclffjnd@gmail.com"
];

const message = document.getElementById("authMessage");
const button = document.getElementById("googleSignIn");

function setMessage(text = "", type = "") {
  message.textContent = text;
  message.className = `auth-message ${type}`.trim();
}

function configIsReady() {
  return Object.values(firebaseConfig).every(
    value => value && !String(value).startsWith("PASTE_")
  );
}

if (!configIsReady()) {
  setMessage("Google sign-in is not configured yet. Add your Firebase Web App configuration in auth.js.");
  button.disabled = true;
} else {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();

  provider.setCustomParameters({
    prompt: "select_account"
  });

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const email = (user.email || "").toLowerCase().trim();

    if (!AUTHORIZED_EMAILS.map(v => v.toLowerCase()).includes(email)) {
      setMessage(`Access denied for ${email}. This Google account is not authorized.`);
      await signOut(auth);
      return;
    }

    window.location.replace("./dashboard.html");
  });

  button.addEventListener("click", async () => {
    setMessage("");
    button.disabled = true;
    button.querySelector("span:last-child").textContent = "Signing in…";

    try {
      const result = await signInWithPopup(auth, provider);
      const email = (result.user.email || "").toLowerCase().trim();

      if (!AUTHORIZED_EMAILS.map(v => v.toLowerCase()).includes(email)) {
        await signOut(auth);
        throw new Error("This Google account is not authorized for STEADFAST Admin.");
      }

      window.location.replace("./dashboard.html");
    } catch (error) {
      console.error(error);

      if (error.code === "auth/popup-closed-by-user") {
        setMessage("Sign-in was cancelled.");
      } else if (error.code === "auth/unauthorized-domain") {
        setMessage("This website domain is not authorized in Firebase Authentication.");
      } else if (error.code === "auth/popup-blocked") {
        setMessage("Your browser blocked the Google sign-in popup. Please allow popups and try again.");
      } else {
        setMessage(error.message || "Google sign-in could not be completed. Check your Firebase Authentication setup.");
      }
    } finally {
      button.disabled = false;
      button.querySelector("span:last-child").textContent = "Continue with Google";
    }
  });
}
