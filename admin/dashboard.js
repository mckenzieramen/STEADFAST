import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

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

const adminEmail = document.getElementById("adminEmail");
const adminName = document.getElementById("adminName");
const avatar = document.getElementById("adminAvatar");
const logoutBtn = document.getElementById("logoutBtn");

let unsubscribeQuotes = null;
let quoteCache = [];

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[char]));
}

function formatDate(value) {
  if (!value) return "—";
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function statusClass(status = "New") {
  const key = status.toLowerCase();
  if (key === "new" || key === "pending") return "pending";
  if (key === "contacted" || key === "proposal sent" || key === "negotiation") return "contacted";
  if (key === "approved" || key === "completed") return "progress";
  return "pending";
}

function renderMetrics(quotes) {
  const count = status => quotes.filter(q => String(q.status || "").toLowerCase() === status).length;
  document.getElementById("metricNewQuotes")?.replaceChildren(document.createTextNode(String(count("new"))));
  document.getElementById("metricPending")?.replaceChildren(document.createTextNode(String(count("pending"))));
  document.getElementById("metricContacted")?.replaceChildren(document.createTextNode(String(count("contacted"))));
  document.getElementById("metricInProgress")?.replaceChildren(document.createTextNode(String(count("in development"))));
  document.getElementById("metricConverted")?.replaceChildren(document.createTextNode(String(count("approved"))));
}

function renderRows(bodyId, quotes, limit = null) {
  const body = document.getElementById(bodyId);
  if (!body) return;

  const rows = limit ? quotes.slice(0, limit) : quotes;

  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="5">No quotation submissions yet.</td></tr>';
    return;
  }

  body.innerHTML = rows.map(quote => `
    <tr data-quote-id="${escapeHtml(quote.id)}" tabindex="0" role="button">
      <td>${escapeHtml(quote.customerName || "Unknown")}</td>
      <td>${escapeHtml(quote.service || "—")}</td>
      <td>${escapeHtml(quote.estimate || "—")}</td>
      <td><span class="pill ${statusClass(quote.status)}">${escapeHtml(quote.status || "New")}</span></td>
      <td>${escapeHtml(formatDate(quote.createdAt))}</td>
    </tr>
  `).join("");

  body.querySelectorAll("[data-quote-id]").forEach(row => {
    const open = () => openQuoteDetail(row.dataset.quoteId);
    row.addEventListener("click", open);
    row.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });
}

function openQuoteDetail(id) {
  const quote = quoteCache.find(item => item.id === id);
  if (!quote) return;

  const panel = document.getElementById("quoteDetailPanel");
  const title = document.getElementById("quoteDetailTitle");
  const subtitle = document.getElementById("quoteDetailSubtitle");
  const content = document.getElementById("quoteDetailContent");
  if (!panel || !content) return;

  title.textContent = quote.customerName || "Quotation";
  subtitle.textContent = `${quote.customerEmail || "No email"} · ${formatDate(quote.createdAt)}`;

  const addons = Array.isArray(quote.addons) && quote.addons.length
    ? `<ul>${quote.addons.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "<p>No add-ons selected.</p>";

  const mail = quote.customerEmail
    ? `<a class="primary" href="mailto:${encodeURIComponent(quote.customerEmail)}?subject=${encodeURIComponent("STEADFAST Website Quote Follow-up")}">Email customer</a>`
    : "";

  content.innerHTML = `
    <div class="quote-detail-grid">
      <div><span>Website</span><strong>${escapeHtml(quote.service || "—")}</strong></div>
      <div><span>Project size</span><strong>${escapeHtml(quote.scope || "—")}</strong></div>
      <div><span>Estimate</span><strong>${escapeHtml(quote.estimate || "—")}</strong></div>
      <div><span>Preferred next step</span><strong>${escapeHtml(quote.preferredNextStep || "—")}</strong></div>
      <div><span>Phone</span><strong>${escapeHtml(quote.phone || "—")}</strong></div>
      <div><span>Company / brand</span><strong>${escapeHtml(quote.company || "—")}</strong></div>
    </div>
    <div class="quote-detail-block"><span>Requirements</span><p>${escapeHtml(quote.requirements || "No additional requirements provided.")}</p></div>
    <div class="quote-detail-block"><span>Add-ons</span>${addons}</div>
    <div class="quote-detail-actions">
      ${mail}
      <label class="status-control">Status
        <select id="quoteStatusSelect">
          ${["New","Reviewing","Contacted","Proposal Sent","Negotiation","Approved","In Development","Completed","Declined"]
            .map(status => `<option value="${status}" ${quote.status === status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
      </label>
      <button class="primary" id="saveQuoteStatus" type="button">Save status</button>
    </div>
  `;

  document.getElementById("saveQuoteStatus")?.addEventListener("click", async () => {
    const nextStatus = document.getElementById("quoteStatusSelect")?.value;
    if (!nextStatus) return;

    const button = document.getElementById("saveQuoteStatus");
    button.disabled = true;
    button.textContent = "Saving…";

    try {
      await updateDoc(doc(db, "quotations", quote.id), {
        status: nextStatus,
        updatedAt: new Date()
      });
      button.textContent = "Saved";
    } catch (error) {
      console.error("Status update failed:", error);
      button.disabled = false;
      button.textContent = "Save status";
      alert("Could not update this quotation. Check Firestore Rules.");
    }
  });

  panel.hidden = false;
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function startQuotationListener() {
  if (unsubscribeQuotes) unsubscribeQuotes();

  const quotesQuery = query(
    collection(db, "quotations"),
    orderBy("createdAt", "desc")
  );

  unsubscribeQuotes = onSnapshot(quotesQuery, snapshot => {
    quoteCache = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
    renderMetrics(quoteCache);
    renderRows("recentQuotesBody", quoteCache, 5);
    renderRows("quotesBody", quoteCache);
  }, error => {
    console.error("Quotation listener failed:", error);
    const message = '<tr><td colspan="5">Unable to load quotations. Check Firestore Rules.</td></tr>';
    document.getElementById("recentQuotesBody")?.replaceChildren();
    document.getElementById("recentQuotesBody")?.insertAdjacentHTML("beforeend", message);
    document.getElementById("quotesBody")?.replaceChildren();
    document.getElementById("quotesBody")?.insertAdjacentHTML("beforeend", message);
  });
}

// Protect the dashboard itself.
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

  startQuotationListener();
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
document.getElementById("closeQuoteDetail")?.addEventListener("click", () => {
  const panel = document.getElementById("quoteDetailPanel");
  if (panel) panel.hidden = true;
});
document.getElementById("refreshQuotesBtn")?.addEventListener("click", () => startQuotationListener());
