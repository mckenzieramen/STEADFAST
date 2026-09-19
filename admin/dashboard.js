import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, collection, onSnapshot, updateDoc, doc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

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
const db = getFirestore(app);
const emailCfg = window.STEADFAST_EMAIL_CONFIG || {};

const adminEmail = document.getElementById("adminEmail");
const adminName = document.getElementById("adminName");
const avatar = document.getElementById("adminAvatar");
const logoutBtn = document.getElementById("logoutBtn");
const quotationRows = document.getElementById("quotationRows");
const quoteDetail = document.getElementById("quoteDetail");
const closeQuoteDetail = document.getElementById("closeQuoteDetail");
const detailName = document.getElementById("detailName");
const detailEmail = document.getElementById("detailEmail");
const detailService = document.getElementById("detailService");
const detailEstimate = document.getElementById("detailEstimate");
const detailCountry = document.getElementById("detailCountry");
const detailNextStep = document.getElementById("detailNextStep");
const detailRequirements = document.getElementById("detailRequirements");
const detailAddons = document.getElementById("detailAddons");
const adminReply = document.getElementById("adminReply");
const detailStatus = document.getElementById("detailStatus");
const sendAdminReply = document.getElementById("sendAdminReply");
const emailStatus = document.getElementById("emailStatus");
const emailTo = document.getElementById("emailTo");
const emailSubject = document.getElementById("emailSubject");
const emailBody = document.getElementById("emailBody");
const sendEmailBtn = document.getElementById("sendEmailBtn");
const clearEmailBtn = document.getElementById("clearEmailBtn");
const useQuoteTemplate = document.getElementById("useQuoteTemplate");
const gmailStatus = document.getElementById("gmailStatus");
const gmailEmailStatus = document.getElementById("gmailEmailStatus");

let quotationMap = new Map();
let activeQuotationId = null;
let stopQuotationListener = null;

const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#039;"}[ch]));
const formatDate = (value) => {
  if (!value) return "Just now";
  const d = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString([], {month:"short", day:"numeric", hour:"numeric", minute:"2-digit"});
};

function postToGmailBridge(payload) {
  if (!emailCfg.webAppUrl) return false;
  try {
    const frameName = `steadfastAdminMail_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const iframe = document.createElement('iframe');
    iframe.name = frameName;
    iframe.style.display = 'none';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = emailCfg.webAppUrl;
    form.target = frameName;
    form.style.display = 'none';
    Object.entries(payload).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden'; input.name = key; input.value = String(value ?? '');
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
    setTimeout(() => { iframe.remove(); form.remove(); }, 12000);
    return true;
  } catch (e) {
    console.error('Gmail bridge error:', e);
    return false;
  }
}

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.replace("./index.html"); return; }
  const email = (user.email || "").toLowerCase().trim();
  if (!isAuthorized(email)) { await signOut(auth); window.location.replace("./index.html"); return; }
  const displayName = user.displayName || "Cliff Jandee";
  if (adminName) adminName.textContent = displayName;
  if (adminEmail) adminEmail.textContent = email;
  if (avatar) {
    if (user.photoURL) { avatar.src = user.photoURL; avatar.alt = displayName; avatar.classList.add("has-photo"); }
    else avatar.classList.remove("has-photo");
  }
  if (gmailStatus) gmailStatus.textContent = emailCfg.webAppUrl ? 'CONNECTED' : 'SETUP REQUIRED';
  if (stopQuotationListener) stopQuotationListener();
  stopQuotationListener = subscribeToQuotations();
});

function renderQuotations(items) {
  if (!quotationRows) return;
  if (!items.length) { quotationRows.innerHTML = '<tr><td colspan="6">No quotations received yet.</td></tr>'; return; }
  quotationRows.innerHTML = items.map(q => `<tr><td><strong>${escapeHtml(q.customerName || "Unknown")}</strong><small>${escapeHtml(q.customerEmail || "")}</small></td><td>${escapeHtml(q.service || "—")}</td><td>${escapeHtml(q.estimate || "—")}</td><td><span class="pill ${String(q.status || "New").toLowerCase().replace(/\s+/g,'-')}">${escapeHtml(q.status || "New")}</span></td><td>${formatDate(q.createdAt || q.created)}</td><td><button class="text-btn view-quote" data-id="${escapeHtml(q.id)}">View</button></td></tr>`).join("");
  quotationRows.querySelectorAll('.view-quote').forEach(btn => btn.addEventListener('click', () => openQuotation(btn.dataset.id)));
}

function openQuotation(id) {
  const q = quotationMap.get(id);
  if (!q || !quoteDetail) return;
  activeQuotationId = id;
  quoteDetail.hidden = false;
  detailName.textContent = q.customerName || "Unknown client";
  detailEmail.textContent = q.customerEmail || "";
  detailService.textContent = q.service || "—";
  detailEstimate.textContent = `${q.estimate || "—"}${q.currency ? ` ${q.currency}` : ''}`;
  detailCountry.textContent = q.country || "—";
  detailNextStep.textContent = q.preferredNextStep || "Email discussion";
  detailRequirements.textContent = q.requirements || "—";
  detailAddons.textContent = Array.isArray(q.addons) && q.addons.length ? q.addons.join(' • ') : "None";
  detailStatus.value = q.status || "New";
  adminReply.value = "";
  emailStatus.textContent = "";
  if (emailTo) emailTo.value = q.customerEmail || "";
  if (emailSubject) emailSubject.value = `Regarding your STEADFAST website quotation`;
  if (emailBody) emailBody.value = `Hello ${q.customerName || 'there'},\n\nThank you for your website quotation request. I have reviewed your requirements and would be happy to discuss the next steps with you.\n\nYour estimated starting point is ${q.estimate || '—'} ${q.currency || ''}.\n\nYour project may qualify for UP TO 75% OFF, subject to final review and eligibility.\n\nPlease let me know if you would like to continue by email or schedule a meeting.\n\nThank you,\nCliff Jandee Medrano\nSTEADFAST`;
  quoteDetail.scrollIntoView({behavior:"smooth", block:"start"});
}

closeQuoteDetail?.addEventListener('click', () => { if (quoteDetail) quoteDetail.hidden = true; activeQuotationId = null; });

function subscribeToQuotations() {
  return onSnapshot(collection(db, 'quotations'), snapshot => {
    const items = snapshot.docs.map(snap => ({id:snap.id, ...snap.data()}));
    items.sort((a,b) => {
      const av = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.parse(a.created || '') || 0;
      const bv = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.parse(b.created || '') || 0;
      return bv - av;
    });
    quotationMap = new Map(items.map(q => [q.id,q]));
    renderQuotations(items);
    const metrics = document.querySelectorAll('.metrics article strong');
    if (metrics[0]) metrics[0].textContent = items.filter(q => (q.status || 'New') === 'New').length;
    if (metrics[1]) metrics[1].textContent = items.filter(q => ['New','Reviewing','Proposal Sent'].includes(q.status || 'New')).length;
    if (metrics[2]) metrics[2].textContent = items.filter(q => q.status === 'Contacted').length;
    if (metrics[3]) metrics[3].textContent = items.filter(q => q.status === 'In Development').length;
    if (metrics[4]) metrics[4].textContent = items.filter(q => q.status === 'Approved' || q.status === 'Completed').length;
  }, error => {
    console.error('Quotation listener failed:', error);
    if (quotationRows) quotationRows.innerHTML = '<tr><td colspan="6">Could not load quotations. Check Firestore Rules.</td></tr>';
  });
}

async function updateQuotationStatus() {
  if (!activeQuotationId) return;
  await updateDoc(doc(db, 'quotations', activeQuotationId), { status: detailStatus.value, updatedAt: new Date() });
}

detailStatus?.addEventListener('change', async () => {
  try { await updateQuotationStatus(); emailStatus.textContent = 'Status updated.'; }
  catch (e) { console.error(e); emailStatus.textContent = 'Could not update status.'; }
});

async function sendGmail(to, subject, body, statusEl, button) {
  if (!emailCfg.webAppUrl) { if (statusEl) statusEl.textContent = 'Gmail is not connected yet. Add the Google Apps Script Web App URL to email-config.js.'; return false; }
  if (!to || !/^\S+@\S+\.\S+$/.test(to)) { if (statusEl) statusEl.textContent = 'Please enter a valid recipient email.'; return false; }
  if (!subject || !body) { if (statusEl) statusEl.textContent = 'Subject and message are required.'; return false; }
  if (button) { button.disabled = true; button.textContent = 'Sending…'; }
  const sent = postToGmailBridge({ action:'sendEmail', to, subject, body });
  if (statusEl) statusEl.textContent = sent ? 'Email sent through Gmail.' : 'Gmail request could not be started.';
  if (button) { button.disabled = false; button.textContent = 'Send via Gmail'; }
  return sent;
}

sendAdminReply?.addEventListener('click', async () => {
  const q = quotationMap.get(activeQuotationId);
  const message = adminReply?.value.trim() || '';
  if (!q || !message) { if (emailStatus) emailStatus.textContent = 'Write a reply first.'; return; }
  const subject = `Re: Your STEADFAST website quotation`;
  const sent = await sendGmail(q.customerEmail, subject, message, emailStatus, sendAdminReply);
  if (sent) {
    try { await updateDoc(doc(db, 'quotations', activeQuotationId), { status:'Contacted', lastAdminReply:message, lastReplyAt:new Date() }); }
    catch (e) { console.warn('Could not update quotation status after email:', e); }
    adminReply.value = '';
    if (detailStatus) detailStatus.value = 'Contacted';
    emailStatus.textContent = 'Reply sent through Gmail. The customer can reply to your Gmail address.';
  }
});

sendEmailBtn?.addEventListener('click', async () => {
  await sendGmail(emailTo?.value.trim(), emailSubject?.value.trim(), emailBody?.value.trim(), gmailEmailStatus, sendEmailBtn);
});
clearEmailBtn?.addEventListener('click', () => {
  if (emailTo) emailTo.value = '';
  if (emailSubject) emailSubject.value = 'Regarding your STEADFAST website quotation';
  if (emailBody) emailBody.value = '';
  if (gmailEmailStatus) gmailEmailStatus.textContent = '';
});
useQuoteTemplate?.addEventListener('click', () => {
  if (emailSubject) emailSubject.value = 'Regarding your STEADFAST website quotation';
  if (emailBody) emailBody.value = `Hello there,\n\nThank you for your website quotation request. I have reviewed your requirements and would be happy to discuss the next steps with you.\n\nYour project may qualify for UP TO 75% OFF, subject to final review and eligibility.\n\nPlease let me know if you would like to continue by email or schedule a meeting.\n\nThank you,\nCliff Jandee Medrano\nSTEADFAST`;
  if (gmailEmailStatus) gmailEmailStatus.textContent = 'Template loaded.';
});

logoutBtn?.addEventListener("click", async () => {
  logoutBtn.disabled = true; logoutBtn.textContent = "Signing out…";
  try { await signOut(auth); } finally { window.location.replace("./index.html"); }
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
  window.scrollTo({ top:0, behavior:"smooth" });
}
navItems.forEach(item => item.addEventListener("click", () => showSection(item.dataset.section)));
document.querySelectorAll("[data-section-link]").forEach(btn => btn.addEventListener("click", () => showSection(btn.dataset.sectionLink)));
document.getElementById("mobileMenu")?.addEventListener("click", () => sidebar?.classList.toggle("open"));
