import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD13MXR0ZQSjPJBxQKYPmsMKjl4yzU2hSs",
  authDomain: "steadfast-1d0e6.firebaseapp.com",
  projectId: "steadfast-1d0e6",
  storageBucket: "steadfast-1d0e6.firebasestorage.app",
  messagingSenderId: "488385339804",
  appId: "1:488385339804:web:0d2bcf3967a8f95ccfe859"
};

const AUTHORIZED_EMAILS = ["yahhclffjnd@gmail.com"];
const isAuthorized = (email) => AUTHORIZED_EMAILS.includes((email || "").toLowerCase().trim());

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const adminEmail = document.getElementById("adminEmail");
const adminName = document.getElementById("adminName");
const avatar = document.getElementById("adminAvatar");
const logoutBtn = document.getElementById("logoutBtn");

// Protect the dashboard itself. Anyone who is not signed in, or is not on the allowlist, is sent back to login.
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("./index.html");
    return;
  }

  const email = (user.email || "").toLowerCase().trim();
  if (!isAuthorized(email)) {
    await signOut(auth);
    window.location.replace("./index.html");
    return;
  }

  const displayName = user.displayName || "Cliff Jandee";
  if (adminName) adminName.textContent = displayName;
  if (adminEmail) adminEmail.textContent = email;
  if (avatar) {
    if (user.photoURL) {
      avatar.src = user.photoURL;
      avatar.alt = displayName;
      avatar.classList.add("has-photo");
    } else {
      avatar.classList.remove("has-photo");
    }
  }
});

logoutBtn?.addEventListener("click", async () => {
  logoutBtn.disabled = true;
  logoutBtn.textContent = "Signing out…";
  try {
    await signOut(auth);
  } finally {
    window.location.replace("./index.html");
  }
});

const sections = [...document.querySelectorAll(".section")];
const navItems = [...document.querySelectorAll(".nav-item")];
const title = document.getElementById("pageTitle");
const sidebar = document.getElementById("sidebar");

function showSection(id) {
  sections.forEach(section => section.classList.toggle("active", section.id === id));
  navItems.forEach(item => item.classList.toggle("active", item.dataset.section === id));
  const active = navItems.find(item => item.dataset.section === id);
  if (title) title.textContent = active ? active.textContent.trim() : "Dashboard";
  sidebar?.classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

navItems.forEach(item => item.addEventListener("click", () => showSection(item.dataset.section)));
document.querySelectorAll("[data-section-link]").forEach(btn => {
  btn.addEventListener("click", () => showSection(btn.dataset.sectionLink));
});
document.getElementById("mobileMenu")?.addEventListener("click", () => sidebar?.classList.toggle("open"));
