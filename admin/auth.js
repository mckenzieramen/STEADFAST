import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD13MXR0ZQSjPJBxQKYPmsMKjl4yzU2hSs",
  authDomain: "steadfast-1d0e6.firebaseapp.com",
  projectId: "steadfast-1d0e6",
  storageBucket: "steadfast-1d0e6.firebasestorage.app",
  messagingSenderId: "488385339804",
  appId: "1:488385339804:web:0d2bcf3967a8f95ccfe859"
};

const AUTHORIZED_EMAILS = ["yahhclifjnd@gmail.com"];
const message = document.getElementById("authMessage");
const button = document.getElementById("googleSignIn");

function setMessage(text = "", type = "") {
  if (!message) return;
  message.textContent = text;
  message.className = `auth-message ${type}`.trim();
}

function setButtonText(text) {
  const target = button?.querySelector("span:last-child");
  if (target) target.textContent = text;
}

function isAuthorized(email) {
  return AUTHORIZED_EMAILS.includes((email || "").toLowerCase().trim());
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn("STEADFAST auth persistence could not be enabled:", error);
});
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  const email = (user.email || "").toLowerCase().trim();
  if (!isAuthorized(email)) {
    setMessage(`Access denied for ${email}. This Google account is not authorized.`, "error");
    await signOut(auth);
    return;
  }
  window.location.replace("./dashboard.html");
});

button?.addEventListener("click", async () => {
  setMessage("");
  button.disabled = true;
  setButtonText("Signing in…");
  try {
    const result = await signInWithPopup(auth, provider);
    const email = (result.user.email || "").toLowerCase().trim();
    if (!isAuthorized(email)) {
      await signOut(auth);
      setMessage(`Access denied for ${email}. This Google account is not authorized.`, "error");
      return;
    }
    setMessage("Login successful. Opening Admin Dashboard…", "success");
    window.location.replace("./dashboard.html");
  } catch (error) {
    console.error("STEADFAST Google Sign-In Error:", error);
    if (error.code === "auth/popup-closed-by-user") {
      setMessage("Sign-in was cancelled.", "error");
    } else if (error.code === "auth/popup-blocked") {
      setMessage("Your browser blocked the Google sign-in popup. Please allow popups and try again.", "error");
    } else if (error.code === "auth/unauthorized-domain") {
      setMessage("This website domain is not authorized in Firebase Authentication.", "error");
    } else if (error.code === "auth/operation-not-allowed") {
      setMessage("Google Sign-In is not enabled in Firebase Authentication.", "error");
    } else {
      setMessage(error.message || "Google sign-in could not be completed. Please check the Firebase Authentication setup.", "error");
    }
  } finally {
    button.disabled = false;
    setButtonText("Continue with Google");
  }
});
