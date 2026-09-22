import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD13MXR0ZQSJpJBxQKYPmsMKjl4yzU2hSs",
  authDomain: "steadfast-1d0e6.firebaseapp.com",
  projectId: "steadfast-1d0e6",
  storageBucket: "steadfast-1d0e6.firebasestorage.app",
  messagingSenderId: "488385339804",
  appId: "1:488385339804:web:0d2bcf3967a8f95ccfe859"
};

const AUTHORIZED_EMAILS = ["yahhclffjnd@gmail.com"];
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
// Use Firebase's normal browser Auth instance. The previous initializeAuth()
// setup could produce auth/argument-error on the Cloudflare Pages admin URL.
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

async function finishLogin(user) {
  if (!user) return false;
  const email = (user.email || "").toLowerCase().trim();
  if (!isAuthorized(email)) {
    await signOut(auth).catch(() => {});
    setMessage(`Access denied for ${email}. This Google account is not authorized.`, "error");
    return false;
  }
  setMessage("Login successful. Opening Admin Dashboard…", "success");
  window.location.replace("./dashboard.html");
  return true;
}

const forcedLogout = new URLSearchParams(window.location.search).get("loggedOut") === "1";
if (forcedLogout) {
  signOut(auth).finally(() => {
    const clean = `${window.location.pathname}${window.location.hash || ""}`;
    window.history.replaceState({}, document.title, clean);
    setMessage("You have been signed out.", "success");
  });
}

// Restore a redirect-based Google sign-in if popup fallback was used.
getRedirectResult(auth).then(result => {
  if (result?.user) finishLogin(result.user);
}).catch(error => {
  console.error("STEADFAST redirect sign-in error:", error);
  if (error?.code === "auth/unauthorized-domain") {
    setMessage("Firebase does not allow this website domain yet. Add steadfast-cliffjandee.pages.dev to Firebase Authentication → Settings → Authorized domains.", "error");
  }
});

onAuthStateChanged(auth, async (user) => {
  if (forcedLogout || !user) return;
  await finishLogin(user);
});

button?.addEventListener("click", async () => {
  setMessage("");
  button.disabled = true;
  setButtonText("Signing in…");

  try {
    await setPersistence(auth, browserLocalPersistence);
    const result = await signInWithPopup(auth, provider);
    await finishLogin(result.user);
  } catch (error) {
    console.error("STEADFAST Google Sign-In Error:", error);

    if (error.code === "auth/popup-closed-by-user") {
      setMessage("Sign-in was cancelled.", "error");
    } else if (error.code === "auth/popup-blocked") {
      setMessage("Popup was blocked. Switching to secure Google sign-in…", "success");
      try {
        await signInWithRedirect(auth, provider);
      } catch (redirectError) {
        console.error("STEADFAST redirect fallback error:", redirectError);
        setMessage(redirectError.message || "Google sign-in could not be started.", "error");
      }
    } else if (error.code === "auth/unauthorized-domain") {
      setMessage("Firebase does not allow this website domain yet. Add steadfast-cliffjandee.pages.dev to Firebase Authentication → Settings → Authorized domains.", "error");
    } else if (error.code === "auth/operation-not-allowed") {
      setMessage("Google Sign-In is not enabled in Firebase Authentication. Enable the Google provider in Firebase Console.", "error");
    } else if (error.code === "auth/argument-error") {
      // Retry with redirect. This avoids the popup argument path that can fail
      // in some Chrome/Cloudflare Pages combinations.
      setMessage("Retrying secure Google sign-in…", "success");
      try {
        await signInWithRedirect(auth, provider);
      } catch (redirectError) {
        console.error("STEADFAST argument-error redirect fallback:", redirectError);
        setMessage("Google sign-in could not be started. Please check Firebase Authentication → Authorized domains and Google provider settings.", "error");
      }
    } else {
      setMessage(error.message || "Google sign-in could not be completed. Please try again.", "error");
    }
  } finally {
    button.disabled = false;
    setButtonText("Continue with Google");
  }
});
