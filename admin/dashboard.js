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
const GMAIL_ENDPOINT = window.STEADFAST_EMAIL_CONFIG?.endpoint || '';
const GMAIL_ADMIN = window.STEADFAST_EMAIL_CONFIG?.adminEmail || 'yahhclffjnd@gmail.com';
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
let quoteStore = new Map();

function renderQuoteRows(rows, target) {
  if (!target) return;
  rows.forEach(q => quoteStore.set(q.id, q));
  if (!rows.length) { target.innerHTML = '<tr><td colspan="8" class="muted">No quotations yet.</td></tr>'; return; }
  target.innerHTML = rows.map(q => `<tr><td>${esc(q.customerName)}</td><td>${esc(q.customerEmail)}</td><td>${esc(q.service)}</td><td>${esc(q.estimate)}</td><td>${esc(q.currency)}</td><td><span class="status-pill status-${String(q.status||'New').toLowerCase().replace(/[^a-z]+/g,'-')}">${esc(q.status||'New')}</span></td><td>${esc(quoteDate(q.createdAt))}</td><td><button class="table-email-btn" type="button" data-email-quote="${esc(q.id)}">Email</button></td></tr>`).join('');
  target.querySelectorAll('[data-email-quote]').forEach(btn => btn.addEventListener('click', () => openEmailComposer(btn.dataset.emailQuote)));
}

function openEmailComposer(id) {
  const q = quoteStore.get(id);
  if (!q) return;
  showSection('email');
  const to = document.getElementById('emailTo');
  const subject = document.getElementById('emailSubject');
  const body = document.getElementById('emailBody');
  if (to) to.value = q.customerEmail || '';
  if (subject) subject.value = `Regarding your STEADFAST website quotation`;
  if (body) body.value = `Hi ${q.customerName || 'there'},\n\nThank you for your website quotation request. I’ve reviewed the information you submitted and would be happy to discuss the next steps.\n\nWebsite: ${q.service || 'Website project'}\nEstimate: ${q.estimate || 'To be confirmed'}\n\nHUGE DISCOUNT AVAILABLE: Your project may qualify for UP TO 50% OFF, subject to final review and eligibility.\n\nPlease let me know if you would like to continue by email or schedule a meeting.\n\nThank you,\nCliff Jandee Medrano\nSTEADFAST` ;
}

function setGmailStatus() {
  const el = document.getElementById('gmailStatus');
  if (!el) return;
  if (GMAIL_ENDPOINT) { el.textContent = 'GMAIL READY'; el.style.color = '#8ee6b2'; }
  else { el.textContent = 'SETUP REQUIRED'; el.style.color = '#f7bd69'; }
}

async function sendAdminEmail() {
  const to = document.getElementById('emailTo')?.value.trim();
  const subject = document.getElementById('emailSubject')?.value.trim();
  const body = document.getElementById('emailBody')?.value.trim();
  if (!to || !/^\S+@\S+\.\S+$/.test(to)) { alert('Please enter a valid customer email address.'); return; }
  if (!subject || !body) { alert('Please enter a subject and message.'); return; }
  if (!GMAIL_ENDPOINT) { alert('Gmail is not connected yet. Add your Google Apps Script Web App URL to email-config.js first.'); return; }
  const btn = document.getElementById('sendEmailBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
  try {
    await fetch(GMAIL_ENDPOINT, { method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({ action:'sendEmail', to, subject, body, replyTo:GMAIL_ADMIN }) });
    alert('Email sent to the Gmail bridge. Check Sent in Gmail to confirm delivery.');
    if (btn) btn.textContent = 'Sent via Gmail';
  } catch (err) {
    console.error(err);
    alert('The email could not be queued. Please check the Gmail bridge URL.');
    if (btn) btn.textContent = 'Send via Gmail';
  } finally { if (btn) btn.disabled = false; }
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
document.getElementById('sendEmailBtn')?.addEventListener('click', sendAdminEmail);
document.getElementById('clearEmailBtn')?.addEventListener('click', () => { ['emailTo','emailSubject','emailBody'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; }); });
document.getElementById('useQuoteTemplate')?.addEventListener('click', () => {
  const name = document.getElementById('emailTo')?.value ? '' : 'there';
  const body = document.getElementById('emailBody');
  if (body) body.value = `Hi ${name},\n\nThank you for your STEADFAST website quotation request. I’ve reviewed your requirements and would be happy to discuss the next steps.\n\nYour project may qualify for UP TO 50% OFF, subject to final review and eligibility.\n\nPlease let me know if you would like to continue by email or schedule a meeting.\n\nThank you,\nCliff Jandee Medrano\nSTEADFAST`;
});
setGmailStatus();

startQuoteListener();
