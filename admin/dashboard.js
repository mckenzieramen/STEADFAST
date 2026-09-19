import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "PASTE_FIREBASE_API_KEY",
  authDomain: "PASTE_FIREBASE_AUTH_DOMAIN",
  projectId: "PASTE_FIREBASE_PROJECT_ID",
  storageBucket: "PASTE_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "PASTE_FIREBASE_MESSAGING_SENDER_ID",
  appId: "PASTE_FIREBASE_APP_ID"
};

const AUTHORIZED_EMAILS = [
  "yahhclffjnd@gmail.com"
];

const configured = Object.values(firebaseConfig).every(
  value => value && !String(value).startsWith("PASTE_")
);

if (!configured) {
  window.location.replace("./index.html");
} else {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.replace("./index.html");
      return;
    }

    const email = (user.email || "").toLowerCase().trim();
    if (!AUTHORIZED_EMAILS.map(v => v.toLowerCase()).includes(email)) {
      signOut(auth).finally(() => window.location.replace("./index.html"));
      return;
    }

    document.getElementById("adminEmail").textContent = email;
  });

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOut(auth);
    window.location.replace("./index.html");
  });
}

const sections = [...document.querySelectorAll(".section")];
const navItems = [...document.querySelectorAll(".nav-item")];
const title = document.getElementById("pageTitle");
const sidebar = document.getElementById("sidebar");

function showSection(id) {
  sections.forEach(section => section.classList.toggle("active", section.id === id));
  navItems.forEach(item => item.classList.toggle("active", item.dataset.section === id));
  const active = navItems.find(item => item.dataset.section === id);
  title.textContent = active ? active.textContent.trim() : "Dashboard";
  sidebar.classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

navItems.forEach(item => item.addEventListener("click", () => showSection(item.dataset.section)));
document.querySelectorAll("[data-section-link]").forEach(btn => {
  btn.addEventListener("click", () => showSection(btn.dataset.sectionLink));
});
document.getElementById("mobileMenu").addEventListener("click", () => sidebar.classList.toggle("open"));
