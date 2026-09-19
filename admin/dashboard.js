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


// ---------- Live quotation inbox ----------
import { getFirestore, collection, onSnapshot, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const db = getFirestore(app);
const quoteTable = document.getElementById('quotationTableBody');
const recentQuoteTable = document.getElementById('recentQuoteTableBody');
const quoteCount = document.getElementById('quoteCount');
const pendingCount = document.getElementById('pendingCount');
const contactedCount = document.getElementById('contactedCount');
const convertedCount = document.getElementById('convertedCount');

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function quoteDate(ts) {
  try { return ts?.toDate ? ts.toDate().toLocaleString() : new Date(ts).toLocaleString(); } catch { return '—'; }
}
function renderQuoteRows(rows, target) {
  if (!target) return;
  if (!rows.length) { target.innerHTML = '<tr><td colspan="7" class="muted">No quotations yet.</td></tr>'; return; }
  target.innerHTML = rows.map(q => `<tr><td>${esc(q.customerName)}</td><td>${esc(q.customerEmail)}</td><td>${esc(q.service)}</td><td>${esc(q.estimate)}</td><td>${esc(q.currency)}</td><td><span class="status-pill status-${String(q.status||'New').toLowerCase().replace(/[^a-z]+/g,'-')}">${esc(q.status||'New')}</span></td><td>${esc(quoteDate(q.createdAt))}</td></tr>`).join('');
}
let unsubscribeQuotes;
function startQuoteListener() {
  try {
    const q = query(collection(db, 'quotations'), orderBy('createdAt', 'desc'), limit(100));
    unsubscribeQuotes = onSnapshot(q, snap => {
      const rows = snap.docs.map(d => ({ id:d.id, ...d.data() }));
      renderQuoteRows(rows, quoteTable);
      renderQuoteRows(rows.slice(0,5), recentQuoteTable);
      const pending = rows.filter(x => ['New','Reviewing','Contacted','Proposal Sent','Negotiation'].includes(x.status || 'New')).length;
      const contacted = rows.filter(x => ['Contacted','Proposal Sent','Negotiation'].includes(x.status || '')).length;
      const converted = rows.filter(x => ['Approved','In Development','Completed'].includes(x.status || '')).length;
      if (quoteCount) quoteCount.textContent = rows.length;
      if (pendingCount) pendingCount.textContent = pending;
      if (contactedCount) contactedCount.textContent = contacted;
      if (convertedCount) convertedCount.textContent = converted;
    }, err => {
      console.error('Quotation listener error:', err);
      if (quoteTable) quoteTable.innerHTML = `<tr><td colspan="7" class="muted">Could not load quotations. Check Firestore rules/indexes.</td></tr>`;
    });
  } catch (err) { console.error(err); }
}
startQuoteListener();
