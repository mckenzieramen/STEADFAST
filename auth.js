import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

/*
  STEADFAST ADMIN AUTH
  Replace the firebaseConfig values below with the Firebase Web App configuration
  for the STEADFAST project before deployment.
*/
const firebaseConfig = {
  apiKey: "PASTE_FIREBASE_API_KEY",
  authDomain: "PASTE_FIREBASE_AUTH_DOMAIN",
  projectId: "PASTE_FIREBASE_PROJECT_ID",
  storageBucket: "PASTE_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "PASTE_FIREBASE_MESSAGING_SENDER_ID",
  appId: "PASTE_FIREBASE_APP_ID"
};

// Authorized STEADFAST owner/admin account:
const AUTHORIZED_EMAILS = [
  "yahhclffjnd@gmail.com"
];

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

const button = document.getElementById("googleLogin");
const status = document.getElementById("status");

function setStatus(message, type="") {
  status.textContent = message;
  status.className = "status " + type;
}

button.addEventListener("click", async () => {
  setStatus("Opening secure Google sign-in…");
  button.disabled = true;
  try {
    const result = await signInWithPopup(auth, provider);
    const email = (result.user.email || "").toLowerCase();
    if (!AUTHORIZED_EMAILS.includes(email)) {
      await signOut(auth);
      setStatus("Access denied. This Google account is not authorized.", "error");
      return;
    }
    setStatus("Access approved. Opening dashboard…", "success");
    // Dashboard page will be added after Firebase project configuration is supplied.
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error(error);
    setStatus(error.code === "auth/popup-closed-by-user"
      ? "Sign-in cancelled."
      : "Google sign-in could not be completed. Check your Firebase Authentication setup.", "error");
  } finally {
    button.disabled = false;
  }
});

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  const email = (user.email || "").toLowerCase();
  if (!AUTHORIZED_EMAILS.includes(email)) {
    await signOut(auth);
    return;
  }
  // If already authorized, go straight to the dashboard.
  window.location.href = "dashboard.html";
});