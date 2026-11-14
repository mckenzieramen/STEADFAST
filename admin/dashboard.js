import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, collection, onSnapshot, updateDoc, doc, arrayUnion } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

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
const dashboardRecentRows = document.getElementById("dashboardRecentRows");
const quoteDetail = document.getElementById("quoteDetail");
const closeQuoteDetail = document.getElementById("closeQuoteDetail");
const detailName = document.getElementById("detailName");
const detailEmail = document.getElementById("detailEmail");
const detailTicket = document.getElementById("detailTicket");
const detailService = document.getElementById("detailService");
const detailEstimate = document.getElementById("detailEstimate");
const detailCountry = document.getElementById("detailCountry");
const detailNextStep = document.getElementById("detailNextStep");
const detailRequirements = document.getElementById("detailRequirements");
const detailAddons = document.getElementById("detailAddons");
const gmailStatus = document.getElementById("gmailStatus");
const ticketList = document.getElementById("ticketList");
const ticketSearch = document.getElementById("ticketSearch");
const clearTicketSearch = document.getElementById("clearTicketSearch");
const ticketFilters = [...document.querySelectorAll(".status-filter")];
const conversationEmpty = document.getElementById("conversationEmpty");
const conversationShell = document.getElementById("conversationShell");
const conversationFeed = document.getElementById("conversationFeed");
const conversationScroll = document.getElementById("conversationScroll");
const activeTicketNumber = document.getElementById("activeTicketNumber");
const activeTicketBadge = document.getElementById("activeTicketBadge");
const activeTicketSubject = document.getElementById("activeTicketSubject");
const activeTicketMeta = document.getElementById("activeTicketMeta");
const activeTicketStatus = document.getElementById("activeTicketStatus");
const customerProfile = document.getElementById("customerProfile");
const adminReply = document.getElementById("adminReply");
const replyAnnotation = document.getElementById("replyAnnotation");
const ticketStatusMessage = document.getElementById("ticketStatusMessage");
const internalNote = document.getElementById("internalNote");
const saveInternalNote = document.getElementById("saveInternalNote");
const composerTabs = [...document.querySelectorAll(".composer-tab")];
const replyComposer = document.getElementById("replyComposer");
const noteComposer = document.getElementById("noteComposer");
const refreshTickets = document.getElementById("refreshTickets");
const newTicketBtn = document.getElementById("newTicketBtn");
const sortTicketsBtn = document.getElementById("sortTicketsBtn");
const navTicketCount = document.getElementById("navTicketCount");

let quotationMap = new Map();
let activeTicketId = null;
let activeQuoteId = null;
let quotationState = "loading";
let stopQuotationListener = null;
let ticketFilter = "all";
let ticketSort = "desc";
let ticketNumberingRunning = false;
let suppressScrollAfterOpen = false;

const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#039;"}[ch]));
const formatDate = (value) => { if (!value) return "Just now"; const d=value?.toDate?value.toDate():new Date(value); return Number.isNaN(d.getTime())?"—":d.toLocaleString([], {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}); };
const formatDateLong = (value) => { if (!value) return "—"; const d=value?.toDate?value.toDate():new Date(value); return Number.isNaN(d.getTime())?"—":d.toLocaleString([], {month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"}); };
const toMillis = (value) => value?.toMillis ? value.toMillis() : new Date(value || 0).getTime() || 0;
const initials = (name="STEADFAST") => name.trim().split(/\s+/).slice(0,2).map(v=>v[0]).join("").toUpperCase() || "ST";
const ticketNumber = q => q?.ticketNumber || "ST-001";
const ticketLabel = q => `#${ticketNumber(q)}`;
const normalizeStatus = q => { const s=String(q?.ticketStatus||"").trim(); if(s==="Merged")return "Merged"; if(["Open","Pending","On Hold","Solved"].includes(s))return s; if(q?.status==="Completed"||q?.status==="Declined")return "Solved"; if(["Reviewing","Proposal Sent"].includes(q?.status))return "Pending"; return "Open"; };
const statusClass = s => s === "On Hold" ? "hold" : s.toLowerCase().replace(/\s+/g,"-");
const ticketSubject = q => q?.ticketSubject || (q?.service ? `${q.service} quotation inquiry` : "Website quotation inquiry");
const previewText = q => { const messages=Array.isArray(q?.ticketMessages)?q.ticketMessages:[]; const last=messages[messages.length-1]; return last?.text||q?.requirements||"New website quotation submitted."; };

function postToGmailBridge(payload){ if(!emailCfg.webAppUrl)return false; try{const frameName=`steadfastAdminMail_${Date.now()}_${Math.random().toString(36).slice(2)}`;const iframe=document.createElement('iframe');iframe.name=frameName;iframe.style.display='none';iframe.setAttribute('aria-hidden','true');document.body.appendChild(iframe);const form=document.createElement('form');form.method='POST';form.action=emailCfg.webAppUrl;form.target=frameName;form.style.display='none';Object.entries(payload).forEach(([key,value])=>{const input=document.createElement('input');input.type='hidden';input.name=key;input.value=String(value??'');form.appendChild(input);});document.body.appendChild(form);form.submit();setTimeout(()=>{iframe.remove();form.remove();},12000);return true;}catch(e){console.error('Gmail bridge error:',e);return false;} }

async function ensureTicketNumbers(items){if(ticketNumberingRunning)return;const missing=items.filter(q=>!/^ST-\d{3,}$/.test(String(q.ticketNumber||""))).sort((a,b)=>toMillis(a.createdAt||a.created)-toMillis(b.createdAt||b.created));if(!missing.length)return;ticketNumberingRunning=true;try{let max=items.reduce((m,q)=>{const hit=String(q.ticketNumber||"").match(/^ST-(\d+)$/);return hit?Math.max(m,Number(hit[1])):m;},0);for(const q of missing){max+=1;await updateDoc(doc(db,'quotations',q.id),{ticketNumber:`ST-${String(max).padStart(3,'0')}`,ticketStatus:normalizeStatus(q),ticketUpdatedAt:new Date()});}}catch(e){console.warn('Could not assign ticket numbers',e)}finally{ticketNumberingRunning=false;}}
function sortQuotations(items){return [...items].sort((a,b)=>(ticketSort==='desc'?1:-1)*(toMillis(a.createdAt||a.created)-toMillis(b.createdAt||b.created)));}
function renderRecent(items){if(!dashboardRecentRows)return;const recent=[...items].sort((a,b)=>toMillis(b.createdAt||b.created)-toMillis(a.createdAt||a.created)).slice(0,5);if(!recent.length){dashboardRecentRows.innerHTML='<tr><td colspan="5">No quotations received yet.</td></tr>';return;}dashboardRecentRows.innerHTML=recent.map(q=>`<tr><td><strong><button type="button" class="text-btn" data-recent-quote="${escapeHtml(q.id)}">${escapeHtml(q.customerName||'Unknown')}</button></strong><small>${escapeHtml(q.customerEmail||'')}</small></td><td>${escapeHtml(q.service||'—')}</td><td>${escapeHtml(q.estimate||'—')} ${escapeHtml(q.currency||'')}</td><td><span class="pill ${statusClass(normalizeStatus(q))}">${escapeHtml(normalizeStatus(q))}</span></td><td>${formatDate(q.createdAt||q.created)}</td></tr>`).join('');}
function renderQuotations(items){if(!quotationRows)return;const rows=sortQuotations(items);if(!rows.length){quotationRows.innerHTML='<tr><td colspan="7">No quotations received yet.</td></tr>';return;}quotationRows.innerHTML=rows.map(q=>`<tr><td><strong>${escapeHtml(ticketLabel(q))}</strong></td><td><strong>${escapeHtml(q.customerName||'Unknown')}</strong><small>${escapeHtml(q.customerEmail||'')}</small></td><td>${escapeHtml(q.service||'—')}</td><td>${escapeHtml(q.estimate||'—')} ${escapeHtml(q.currency||'')}</td><td><span class="pill ${statusClass(normalizeStatus(q))}">${escapeHtml(normalizeStatus(q))}</span></td><td>${formatDate(q.createdAt||q.created)}</td><td><button class="text-btn view-quote" data-id="${escapeHtml(q.id)}">View</button></td></tr>`).join('');quotationRows.querySelectorAll('.view-quote').forEach(btn=>btn.addEventListener('click',()=>openQuotation(btn.dataset.id)));}
function updateDashboardMetrics(items) {
  const counts = { Open: 0, Pending: 0, "On Hold": 0, Solved: 0, Merged: 0 };
  for (const quote of items) counts[normalizeStatus(quote)]++;

  const values = {
    metricTotal: items.length, metricPending: counts.Pending, metricOpen: counts.Open,
    metricHold: counts["On Hold"], metricSolved: counts.Solved, countAll: items.length,
    countOpen: counts.Open, countPending: counts.Pending, countHold: counts["On Hold"],
    countSolved: counts.Solved, navTicketCount: counts.Open + counts.Pending + counts["On Hold"]
  };
  for (const [id, count] of Object.entries(values)) {
    const element = document.getElementById(id);
    if (element) element.textContent = count;
  }
  const badge = document.getElementById("quoteNotificationCount");
  badge.textContent = counts.Open;
  badge.hidden = counts.Open === 0;
}
function filterTickets(items){const query=(ticketSearch?.value||'').trim().toLowerCase();return sortQuotations(items).filter(q=>{const statusOk=ticketFilter==='all'||normalizeStatus(q)===ticketFilter;if(!statusOk)return false;if(!query)return true;return [ticketLabel(q),q.customerName,q.customerEmail,q.company,q.service,ticketSubject(q),q.requirements,q.country].filter(Boolean).join(' ').toLowerCase().includes(query);});}
function renderTickets(items){if(!ticketList||quotationState!=="ready")return;const rows=filterTickets(items);if(!rows.length){ticketList.innerHTML='<div class="list-empty"><strong>No matching tickets</strong><span>Try another status or search.</span></div>';return;}ticketList.innerHTML=rows.map(q=>{const st=normalizeStatus(q);return `<button class="ticket-card ${activeTicketId===q.id?'active':''}" data-ticket-id="${escapeHtml(q.id)}"><span class="ticket-avatar">${escapeHtml(initials(q.customerName||'ST'))}</span><span class="ticket-main"><span class="ticket-card-head"><strong>${escapeHtml(ticketLabel(q))}</strong><span class="status-mini ${statusClass(st)}">${escapeHtml(st)}</span></span><span class="ticket-card-subject">${escapeHtml(ticketSubject(q))}</span><span class="ticket-card-preview">${escapeHtml(previewText(q))}</span><span class="ticket-card-foot"><span>${escapeHtml(q.customerName||'Unknown')}</span><span>${escapeHtml(formatDate(q.createdAt||q.created))}</span></span></span></button>`;}).join('');ticketList.querySelectorAll('.ticket-card').forEach(btn=>btn.addEventListener('click',()=>openTicket(btn.dataset.ticketId)));}
function renderMessageRow(msg){const isAdmin=msg.sender==='admin',isNote=msg.type==='note',isMerge=msg.type==='merge';if(isMerge)return `<div class="message-row note merge-record"><div class="message-block"><div class="message-meta"><span class="note-label">Merged Ticket</span><span>${escapeHtml(formatDateLong(msg.createdAt))}</span></div><div class="message-bubble">${escapeHtml(msg.text||'')}</div></div></div>`;if(isNote)return `<div class="message-row note"><div class="message-block"><div class="message-meta"><span class="note-label">Internal Note</span><span>${escapeHtml(formatDateLong(msg.createdAt))}</span></div><div class="message-bubble">${escapeHtml(msg.text||'')}</div></div></div>`;return `<div class="message-row ${isAdmin?'admin':'customer'}">${isAdmin?`<div class="message-block"><div class="message-meta"><span>${escapeHtml(formatDateLong(msg.createdAt))}</span><span class="message-name">STEADFAST</span></div><div class="message-bubble">${escapeHtml(msg.text||'')}</div></div><span class="message-avatar"><img src="../assets/steadfast-mark.png" alt="STEADFAST"></span>`:`<span class="message-avatar">${escapeHtml(initials(msg.name||'Client'))}</span><div class="message-block"><div class="message-meta"><span class="message-name">${escapeHtml(msg.name||'Customer')}</span><span>${escapeHtml(formatDateLong(msg.createdAt))}</span></div><div class="message-bubble">${escapeHtml(msg.text||'')}</div></div>`}</div>`;}
function renderConversation(q){if(!conversationFeed)return;const firstMessage={sender:'customer',name:q.customerName||'Customer',text:q.requirements||'Submitted a website quotation request.',createdAt:q.createdAt||q.created};const messages=[firstMessage,...(Array.isArray(q.ticketMessages)?q.ticketMessages:[])];conversationFeed.innerHTML=messages.map(renderMessageRow).join('');requestAnimationFrame(()=>{if(conversationScroll&&!suppressScrollAfterOpen)conversationScroll.scrollTop=conversationScroll.scrollHeight;suppressScrollAfterOpen=false;});}
function renderProfile(q){if(!customerProfile)return;customerProfile.innerHTML=`<div class="profile-avatar-wrap"><div class="profile-avatar">${escapeHtml(initials(q.customerName||'ST'))}</div><div class="profile-main"><strong>${escapeHtml(q.customerName||'Unknown client')}</strong><span>${escapeHtml(q.customerEmail||'No email')}</span></div></div><div class="profile-meta"><div class="profile-field"><label>Phone</label><strong>${escapeHtml(q.phone||'Not provided')}</strong></div><div class="profile-field"><label>Company</label><strong>${escapeHtml(q.company||'Not provided')}</strong></div><div class="profile-field"><label>Country</label><strong>${escapeHtml(q.country||'Not provided')}</strong></div><div class="profile-field"><label>Last activity</label><span>${escapeHtml(formatDateLong(q.ticketUpdatedAt||q.lastReplyAt||q.createdAt||q.created))}</span></div></div>`;}
function openTicket(id){const q=quotationMap.get(id);if(!q)return;activeTicketId=id;conversationEmpty.hidden=true;conversationShell.hidden=false;activeTicketNumber.textContent=ticketLabel(q);activeTicketSubject.textContent=ticketSubject(q);activeTicketMeta.textContent=q.mergedIntoTicketNumber?`Merged into ${q.mergedIntoTicketNumber}`:`Created ${formatDateLong(q.createdAt||q.created)}`;setActiveTicketBadge(normalizeStatus(q));activeTicketStatus.value=normalizeStatus(q);activeTicketStatus.disabled=normalizeStatus(q)==='Merged';adminReply.disabled=normalizeStatus(q)==='Merged';replyAnnotation.disabled=normalizeStatus(q)==='Merged';internalNote.disabled=normalizeStatus(q)==='Merged';adminReply.value='';replyAnnotation.value='';internalNote.value='';ticketStatusMessage.textContent='';noteStatus.textContent='';renderConversation(q);renderProfile(q);renderTickets([...quotationMap.values()]);}
function setActiveTicketBadge(status){if(!activeTicketBadge)return;activeTicketBadge.textContent=status;activeTicketBadge.className=`ticket-status-badge ${statusClass(status)}`;}
function openQuotation(id){const q=quotationMap.get(id);if(!q||!quoteDetail)return;quoteDetail.hidden=false;activeQuoteId=id;detailName.textContent=q.customerName||'Unknown client';detailEmail.textContent=q.customerEmail||'';detailTicket.textContent=ticketLabel(q);detailService.textContent=q.service||'—';detailEstimate.textContent=`${q.estimate||'—'}${q.currency?` ${q.currency}`:''}`;detailCountry.textContent=q.country||'—';detailNextStep.textContent=q.preferredNextStep||'Email discussion';detailRequirements.textContent=q.requirements||'—';detailAddons.textContent=Array.isArray(q.addons)&&q.addons.length?q.addons.join(' • '):'None';}
closeQuoteDetail?.addEventListener('click',()=>{quoteDetail.hidden=true;});
document.getElementById("openTicketFromQuote").addEventListener("click", () => {
  if (!quotationMap.has(activeQuoteId)) return;
  showSection("support");
  if (activeTicketId !== activeQuoteId) openTicket(activeQuoteId);
  quoteDetail.hidden = true;
});

async function setTicketStatus(status) {
  const quote = quotationMap.get(activeTicketId);
  if (!quote || normalizeStatus(quote) === "Merged") return;
  if (!["Open", "Pending", "On Hold", "Solved"].includes(status)) return;
  try {
    await updateDoc(doc(db, "quotations", quote.id), { ticketStatus: status, ticketUpdatedAt: new Date() });
    if (activeTicketId === quote.id) ticketStatusMessage.textContent = `Status set to ${status}.`;
  } catch (error) {
    console.error("Ticket status update failed:", error);
    if (activeTicketId === quote.id) {
      activeTicketStatus.value = normalizeStatus(quotationMap.get(quote.id));
      ticketStatusMessage.textContent = "Could not update ticket status.";
    }
  }
}
activeTicketStatus.addEventListener("change", () => setTicketStatus(activeTicketStatus.value));

composerTabs.forEach(tab => tab.addEventListener("click", () => {
  composerTabs.forEach(button => button.classList.toggle("active", button === tab));
  const writingNote = tab.dataset.composeMode === "note";
  replyComposer.hidden = writingNote;
  noteComposer.hidden = !writingNote;
}));

saveInternalNote.addEventListener("click", async () => {
  const quote = quotationMap.get(activeTicketId);
  const text = internalNote.value.trim();
  if (!quote || normalizeStatus(quote) === "Merged" || !text) return;
  saveInternalNote.disabled = true;
  const createdAt = new Date();
  try {
    await updateDoc(doc(db, "quotations", quote.id), {
      ticketMessages: arrayUnion({ sender: "admin", name: "STEADFAST", text, createdAt, type: "note" }),
      ticketAnnotations: arrayUnion({ text, createdAt, author: "STEADFAST", source: "internal-note" }),
      ticketUpdatedAt: createdAt
    });
    if (activeTicketId === quote.id) {
      if (internalNote.value.trim() === text) internalNote.value = "";
      noteStatus.textContent = "Internal note saved.";
    }
  } catch (error) {
    console.error("Internal note save failed:", error);
    if (activeTicketId === quote.id) noteStatus.textContent = "Could not save internal note.";
  } finally {
    saveInternalNote.disabled = false;
  }
});
const noteStatus = document.getElementById("noteStatus");

function showQuotationState(state, message) {
  quotationState = state;
  for (const [rows, columns] of [[dashboardRecentRows, 5], [quotationRows, 7]]) {
    rows.replaceChildren();
    const row = rows.insertRow();
    const status = row.insertCell();
    status.colSpan = columns;
    status.textContent = message;
  }
  ticketList.textContent = message;
  document.getElementById("quotationStatus").textContent = state === "loading" ? "LOADING" : "UNAVAILABLE";
  document.getElementById("quoteNotificationCount").hidden = true;
  for (const id of ["metricTotal", "metricPending", "metricOpen", "metricHold", "metricSolved",
    "navTicketCount", "countAll", "countOpen", "countPending", "countHold", "countSolved"]) {
    document.getElementById(id).textContent = "—";
  }
  if (state === "error") {
    quotationMap.clear();
    activeTicketId = null;
    quoteDetail.hidden = true;
    conversationShell.hidden = true;
    customerProfile.textContent = "";
  }
}

function subscribeToQuotations() {
  stopQuotationListener?.();
  showQuotationState("loading", "Loading quotations…");
  const loadTimeout = setTimeout(() => {
    showQuotationState("error", "Quotations are taking too long to load. Check your connection and select Retry.");
  }, 15000);
  const unsubscribe = onSnapshot(collection(db, "quotations"), { includeMetadataChanges: true }, snapshot => {
    if (snapshot.metadata.fromCache && snapshot.empty) return;
    clearTimeout(loadTimeout);
    quotationState = "ready";
    document.getElementById("quotationStatus").textContent = snapshot.metadata.fromCache ? "CACHED" : "LIVE";
    const items = snapshot.docs.map(record => ({ ...record.data(), id: record.id }));
    quotationMap = new Map(items.map(quote => [quote.id, quote]));
    updateDashboardMetrics(items);
    renderRecent(items);
    renderQuotations(items);
    renderTickets(items);
    const active = quotationMap.get(activeTicketId);
    if (active) {
      const status = normalizeStatus(active);
      activeTicketNumber.textContent = ticketLabel(active);
      activeTicketSubject.textContent = ticketSubject(active);
      activeTicketMeta.textContent = active.mergedIntoTicketNumber
        ? `Merged into ${active.mergedIntoTicketNumber}` : `Created ${formatDateLong(active.createdAt || active.created)}`;
      setActiveTicketBadge(status);
      activeTicketStatus.value = status;
      activeTicketStatus.disabled = status === "Merged";
      internalNote.disabled = status === "Merged";
      renderConversation(active);
      renderProfile(active);
    } else if (items.length) {
      openTicket(sortQuotations(items)[0].id);
    } else {
      activeTicketId = null;
      conversationShell.hidden = true;
      customerProfile.textContent = "";
    }
    ensureTicketNumbers(items);
  }, error => {
    clearTimeout(loadTimeout);
    console.error("Quotation listener failed:", error);
    const message = error.code === "permission-denied"
      ? "Quotation access was denied. Check the deployed Firestore rules for the admin account."
      : "Could not load quotations. Select Retry to reconnect.";
    showQuotationState("error", message);
  });
  stopQuotationListener = () => {
    clearTimeout(loadTimeout);
    unsubscribe();
  };
}

const sidebar=document.getElementById('sidebar');
function showSection(id) { window.goAdminSection(id); }

document.querySelectorAll('[data-section-link]').forEach(btn=>btn.addEventListener('click',()=>showSection(btn.dataset.sectionLink)));
document.getElementById('mobileMenu')?.addEventListener('click',()=>sidebar?.classList.toggle('open'));
function applyTicketFilter(filter){ticketFilter=filter;ticketFilters.forEach(btn=>btn.classList.toggle('active',btn.dataset.ticketFilter===filter));renderTickets([...quotationMap.values()]);}
ticketFilters.forEach(btn=>btn.addEventListener('click',()=>applyTicketFilter(btn.dataset.ticketFilter)));
ticketSearch?.addEventListener('input',()=>renderTickets([...quotationMap.values()]));
clearTicketSearch?.addEventListener('click',()=>{ticketSearch.value='';renderTickets([...quotationMap.values()]);ticketSearch.focus();});
sortTicketsBtn?.addEventListener('click',()=>{ticketSort=ticketSort==='desc'?'asc':'desc';renderTickets([...quotationMap.values()]);});
for (const id of ["refreshTickets", "retryDashboardQuotations", "retryQuotationList"]) {
  document.getElementById(id).addEventListener("click", () => {
    if (isAuthorized(auth.currentUser?.email)) subscribeToQuotations();
  });
}
function showFilteredTickets(filter) {
  if (ticketSearch) ticketSearch.value = "";
  applyTicketFilter(filter);
  showSection("support");
}

document.querySelectorAll("[data-metric-filter]").forEach(button => {
  button.addEventListener("click", () => showFilteredTickets(button.dataset.metricFilter));
});
document.getElementById("quoteNotifications").addEventListener("click", () => showFilteredTickets("Open"));
dashboardRecentRows.addEventListener("click", event => {
  const button = event.target.closest("[data-recent-quote]");
  if (!button || !quotationMap.has(button.dataset.recentQuote)) return;
  showSection("quotations");
  openQuotation(button.dataset.recentQuote);
  quoteDetail.scrollIntoView({ block: "nearest" });
});
newTicketBtn?.addEventListener('click',()=>showSection('quotations'));

function showAuthState(name,email){if(adminName)adminName.textContent=name;if(adminEmail)adminEmail.textContent=email;}
function finishAdminAuth(user){if(!user){window.location.replace('./index.html?loggedOut=1');return;}const email=(user.email||'').toLowerCase().trim();if(!isAuthorized(email)){signOut(auth).finally(()=>window.location.replace('./index.html?loggedOut=1'));return;}showAuthState(user.displayName||'Cliff Jandee',email);if(avatar){avatar.src=user.photoURL||'../assets/steadfast-mark.png';}const gmailLabel = emailCfg.webAppUrl ? "Configured" : "Setup required";
  document.getElementById("dashboardGmailStatus").textContent = gmailLabel;
  document.getElementById("openGmail").href = `https://mail.google.com/mail/u/${encodeURIComponent(email)}/#inbox`;
  gmailStatus.textContent = "Select Refresh to load your inbox.";
  if (document.getElementById("email").classList.contains("active")) loadInbox();
  subscribeToQuotations();}
window.steadfastLogout=window.steadfastLogout||function(){try{sessionStorage.clear();}catch(e){}window.location.replace('./index.html?loggedOut=1');return false;};
logoutBtn?.addEventListener('click',event=>{event.preventDefault();window.steadfastLogout();});

const inboxList = document.getElementById("gmailMessages");
const inboxReader = document.getElementById("gmailReader");
const inboxMore = document.getElementById("gmailMore");
let inboxPage = "";
let inboxRequested = false;
let inboxLoading = false;
let activeMessageRequest = 0;

async function requestAdminMail(action, parameters = {}) {
  const user = auth.currentUser;
  if (!isAuthorized(user?.email)) throw new Error("Sign in with your admin account.");
  if (!emailCfg.webAppUrl) throw new Error("The Gmail bridge URL is missing.");
  const idToken = await user.getIdToken();
  const response = await fetch(emailCfg.webAppUrl, {
    method: "POST",
    body: new URLSearchParams({ action, idToken, ...parameters }),
    signal: AbortSignal.timeout(18000)
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.error || "Gmail could not be loaded.");
  return result;
}

function mailText(tag, value) {
  const element = document.createElement(tag);
  element.textContent = value;
  return element;
}

async function loadInbox(append = false) {
  if (inboxLoading || (append && !inboxPage)) return;
  inboxLoading = true;
  inboxRequested = true;
  inboxMore.disabled = true;
  gmailStatus.textContent = "Loading inbox…";
  try {
    const data = await requestAdminMail("adminInbox", append ? { page: inboxPage } : {});
    if (!append) inboxList.replaceChildren();
    for (const message of data.messages) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.unread = String(message.unread);
      button.append(mailText("strong", message.subject), mailText("span", message.from));
      button.addEventListener("click", () => showMailMessage(message.id, button));
      item.append(button);
      inboxList.append(item);
    }
    inboxPage = data.nextPage;
    inboxMore.hidden = !inboxPage;
    gmailStatus.textContent = inboxList.children.length ? `${inboxList.children.length} messages loaded` : "Your inbox is empty.";
  } catch (error) {
    gmailStatus.textContent = error.message === "Unknown action."
      ? "The Gmail bridge needs its inbox update. You can open Gmail directly."
      : "Could not load the inbox. Open Gmail or try Refresh.";
  } finally {
    inboxLoading = false;
    inboxMore.disabled = false;
  }
}

async function showMailMessage(id, button) {
  const request = ++activeMessageRequest;
  inboxList.querySelectorAll("[aria-current]").forEach(item => item.removeAttribute("aria-current"));
  button.setAttribute("aria-current", "true");
  inboxReader.textContent = "Loading message…";
  try {
    const { message, text } = await requestAdminMail("adminMailDetail", { id });
    if (request !== activeMessageRequest) return;
    inboxReader.replaceChildren(
      mailText("h3", message.subject),
      mailText("p", message.from),
      mailText("small", message.date ? new Date(message.date).toLocaleString() : ""),
      mailText("div", text || message.snippet || "Open Gmail to read the full message.")
    );
  } catch {
    if (request === activeMessageRequest) inboxReader.textContent = "Could not open this message. Open Gmail to read it.";
  }
}
document.getElementById("gmailRefresh").addEventListener("click", () => loadInbox());
inboxMore.addEventListener("click", () => loadInbox(true));
document.querySelector('[data-section="email"]').addEventListener("click", () => {
  if (!inboxRequested && isAuthorized(auth.currentUser?.email)) loadInbox();
});
onAuthStateChanged(auth,finishAdminAuth,error=>{console.error('STEADFAST Firebase Auth state error:',error);});
