import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, collection, onSnapshot, updateDoc, doc, arrayUnion, writeBatch } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

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
// IMPORTANT: the login page owns Firebase Auth initialization/persistence.
// The dashboard must attach to that same default Auth instance instead of
// calling initializeAuth() a second time. This avoids the Cloudflare/Chrome
// dashboard getting stuck on "Authenticating…" while the login session is
// already valid. Firebase Auth's default persistence is local in supported
// browsers, so getAuth() is the safest shared-session path here.
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
const emailTo = document.getElementById("emailTo");
const emailSubject = document.getElementById("emailSubject");
const emailBody = document.getElementById("emailBody");
const sendEmailBtn = document.getElementById("sendEmailBtn");
const clearEmailBtn = document.getElementById("clearEmailBtn");
const useQuoteTemplate = document.getElementById("useQuoteTemplate");
const gmailStatus = document.getElementById("gmailStatus");
const gmailEmailStatus = document.getElementById("gmailEmailStatus");
const logout = document.getElementById("logoutBtn");

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
let stopQuotationListener = null;
let ticketFilter = "all";
let ticketSort = "desc";
let ticketNumberingRunning = false;
let suppressScrollAfterOpen = false;

const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#039;"}[ch]));
const formatDate = (value) => {
  if (!value) return "Just now";
  const d = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString([], {month:"short", day:"numeric", hour:"numeric", minute:"2-digit"});
};
const formatDateLong = (value) => {
  if (!value) return "—";
  const d = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString([], {month:"short", day:"numeric", year:"numeric", hour:"numeric", minute:"2-digit"});
};
const toMillis = (value) => value?.toMillis ? value.toMillis() : new Date(value || 0).getTime() || 0;
const initials = (name="STEADFAST") => name.trim().split(/\s+/).slice(0,2).map(v=>v[0]).join("").toUpperCase() || "ST";
const ticketNumber = (q) => q?.ticketNumber || "ST-001";
const ticketLabel = (q) => `#${ticketNumber(q)}`;
const normalizeStatus = (q) => {
  const s = String(q?.ticketStatus || "").trim();
  if (s === "Merged") return "Merged";
  if (["Open","Pending","On Hold","Solved"].includes(s)) return s;
  if (q?.status === "Completed") return "Solved";
  if (q?.status === "Declined") return "Solved";
  if (["Reviewing","Proposal Sent"].includes(q?.status)) return "Pending";
  return "Open";
};
const statusClass = (s) => s === "On Hold" ? "hold" : s.toLowerCase().replace(/\s+/g,"-");
const ticketSubject = (q) => q?.ticketSubject || (q?.service ? `${q.service} quotation inquiry` : "Website quotation inquiry");
const previewText = (q) => {
  const messages = Array.isArray(q?.ticketMessages) ? q.ticketMessages : [];
  const last = messages[messages.length - 1];
  return last?.text || q?.requirements || "New website quotation submitted.";
};

function postToGmailBridge(payload) {
  if (!emailCfg.webAppUrl) return false;
  try {
    const frameName = `steadfastAdminMail_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const iframe = document.createElement('iframe');
    iframe.name = frameName; iframe.style.display='none'; iframe.setAttribute('aria-hidden','true');
    document.body.appendChild(iframe);
    const form = document.createElement('form');
    form.method='POST'; form.action=emailCfg.webAppUrl; form.target=frameName; form.style.display='none';
    Object.entries(payload).forEach(([key,value])=>{const input=document.createElement('input');input.type='hidden';input.name=key;input.value=String(value??'');form.appendChild(input);});
    document.body.appendChild(form); form.submit();
    setTimeout(()=>{iframe.remove();form.remove();},12000);
    return true;
  } catch(e){console.error('Gmail bridge error:',e);return false;}
}

async function ensureTicketNumbers(items){
  if(ticketNumberingRunning) return;
  const missing = items.filter(q=>!/^ST-\d{3,}$/.test(String(q.ticketNumber||""))).sort((a,b)=>toMillis(a.createdAt||a.created)-toMillis(b.createdAt||b.created));
  if(!missing.length) return;
  ticketNumberingRunning = true;
  try{
    let max = items.reduce((m,q)=>{const hit=String(q.ticketNumber||"").match(/^ST-(\d+)$/);return hit?Math.max(m,Number(hit[1])):m;},0);
    for(const q of missing){
      max += 1;
      await updateDoc(doc(db,'quotations',q.id),{ticketNumber:`ST-${String(max).padStart(3,'0')}`,ticketStatus:normalizeStatus(q),ticketUpdatedAt:new Date()});
    }
  }catch(e){console.warn('Could not assign ticket numbers',e)}
  finally{ticketNumberingRunning=false;}
}

function sortQuotations(items){
  return [...items].sort((a,b)=>(ticketSort === 'desc' ? 1 : -1)*(toMillis(a.createdAt||a.created)-toMillis(b.createdAt||b.created)));
}

function renderRecent(items){
  if(!dashboardRecentRows)return;
  const recent = sortQuotations(items).slice(0,5);
  if(!recent.length){dashboardRecentRows.innerHTML='<tr><td colspan="5">No quotations received yet.</td></tr>';return;}
  dashboardRecentRows.innerHTML=recent.map(q=>`<tr><td><strong>${escapeHtml(q.customerName||'Unknown')}</strong><small>${escapeHtml(q.customerEmail||'')}</small></td><td>${escapeHtml(q.service||'—')}</td><td>${escapeHtml(q.estimate||'—')} ${escapeHtml(q.currency||'')}</td><td><span class="pill ${statusClass(normalizeStatus(q))}">${escapeHtml(normalizeStatus(q))}</span></td><td>${formatDate(q.createdAt||q.created)}</td></tr>`).join('');
}

function renderQuotations(items){
  if(!quotationRows)return;
  const rows=sortQuotations(items);
  if(!rows.length){quotationRows.innerHTML='<tr><td colspan="7">No quotations received yet.</td></tr>';return;}
  quotationRows.innerHTML=rows.map(q=>`<tr><td><strong>${escapeHtml(ticketLabel(q))}</strong></td><td><strong>${escapeHtml(q.customerName||'Unknown')}</strong><small>${escapeHtml(q.customerEmail||'')}</small></td><td>${escapeHtml(q.service||'—')}</td><td>${escapeHtml(q.estimate||'—')} ${escapeHtml(q.currency||'')}</td><td><span class="pill ${statusClass(normalizeStatus(q))}">${escapeHtml(normalizeStatus(q))}</span></td><td>${formatDate(q.createdAt||q.created)}</td><td><button class="text-btn view-quote" data-id="${escapeHtml(q.id)}">View</button></td></tr>`).join('');
  quotationRows.querySelectorAll('.view-quote').forEach(btn=>btn.addEventListener('click',()=>openQuotation(btn.dataset.id)));
}

function updateDashboardMetrics(items){
  const values={
    new:items.filter(q=>!q.ticketNumber || normalizeStatus(q)==='Open').length,
    pending:items.filter(q=>normalizeStatus(q)==='Pending').length,
    open:items.filter(q=>normalizeStatus(q)==='Open').length,
    hold:items.filter(q=>normalizeStatus(q)==='On Hold').length,
    solved:items.filter(q=>normalizeStatus(q)==='Solved').length
  };
  ['metricNew','metricPending','metricOpen','metricHold','metricSolved'].forEach((id,i)=>{const el=document.getElementById(id);if(el)el.textContent=[values.new,values.pending,values.open,values.hold,values.solved][i];});
  if(navTicketCount) navTicketCount.textContent=items.filter(q=>normalizeStatus(q)!=='Solved').length;
  const ids={all:'countAll',Open:'countOpen',Pending:'countPending','On Hold':'countHold',Solved:'countSolved'};
  const counts={all:items.length,Open:0,Pending:0,'On Hold':0,Solved:0};
  items.forEach(q=>counts[normalizeStatus(q)]++);
  Object.entries(ids).forEach(([key,id])=>{const el=document.getElementById(id);if(el)el.textContent=counts[key]??0;});
}

function filterTickets(items){
  const query=(ticketSearch?.value||'').trim().toLowerCase();
  return sortQuotations(items).filter(q=>{
    const statusOk=ticketFilter==='all'||normalizeStatus(q)===ticketFilter;
    if(!statusOk)return false;
    if(!query)return true;
    const hay=[ticketLabel(q),q.customerName,q.customerEmail,q.company,q.service,ticketSubject(q),q.requirements,q.country].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(query);
  });
}

function renderTickets(items){
  if(!ticketList)return;
  const rows=filterTickets(items);
  if(!rows.length){ticketList.innerHTML='<div class="list-empty"><strong>No matching tickets</strong><span>Try another status or search.</span></div>';return;}
  ticketList.innerHTML=rows.map(q=>{
    const st=normalizeStatus(q);
    return `<button class="ticket-card ${activeTicketId===q.id?'active':''}" data-ticket-id="${escapeHtml(q.id)}"><span class="ticket-avatar">${escapeHtml(initials(q.customerName||'ST'))}</span><span class="ticket-main"><span class="ticket-card-head"><strong>${escapeHtml(ticketLabel(q))}</strong><span class="status-mini ${statusClass(st)}">${escapeHtml(st)}</span></span><span class="ticket-card-subject">${escapeHtml(ticketSubject(q))}</span><span class="ticket-card-preview">${escapeHtml(previewText(q))}</span><span class="ticket-card-foot"><span>${escapeHtml(q.customerName||'Unknown')}</span><span>${escapeHtml(formatDate(q.createdAt||q.created))}</span></span></span></button>`;
  }).join('');
  ticketList.querySelectorAll('.ticket-card').forEach(btn=>btn.addEventListener('click',()=>openTicket(btn.dataset.ticketId)));
}

function renderMessageRow(msg){
  const isAdmin=msg.sender==='admin';
  const isNote=msg.type==='note';
  const isMerge=msg.type==='merge';
  if(isMerge){
    return `<div class="message-row note merge-record"><div class="message-block"><div class="message-meta"><span class="note-label">Merged Ticket</span><span>${escapeHtml(formatDateLong(msg.createdAt))}</span></div><div class="message-bubble">${escapeHtml(msg.text||'')}</div></div></div>`;
  }
  if(isNote){
    return `<div class="message-row note"><div class="message-block"><div class="message-meta"><span class="note-label">Internal Note</span><span>${escapeHtml(formatDateLong(msg.createdAt))}</span></div><div class="message-bubble">${escapeHtml(msg.text||'')}</div></div></div>`;
  }
  return `<div class="message-row ${isAdmin?'admin':'customer'}">${isAdmin?`<div class="message-block"><div class="message-meta"><span>${escapeHtml(formatDateLong(msg.createdAt))}</span><span class="message-name">STEADFAST</span></div><div class="message-bubble">${escapeHtml(msg.text||'')}</div></div><span class="message-avatar"><img src="../assets/steadfast-mark.png" alt="STEADFAST"></span>`:`<span class="message-avatar">${escapeHtml(initials(msg.name||'Client'))}</span><div class="message-block"><div class="message-meta"><span class="message-name">${escapeHtml(msg.name||'Customer')}</span><span>${escapeHtml(formatDateLong(msg.createdAt))}</span></div><div class="message-bubble">${escapeHtml(msg.text||'')}</div></div>`}</div>`;
}

function renderConversation(q){
  if(!conversationFeed)return;
  const firstMessage={sender:'customer',name:q.customerName||'Customer',text:q.requirements||'Submitted a website quotation request.',createdAt:q.createdAt||q.created};
  const messages=[firstMessage,...(Array.isArray(q.ticketMessages)?q.ticketMessages:[])];
  conversationFeed.innerHTML=messages.map(renderMessageRow).join('');
  requestAnimationFrame(()=>{if(conversationScroll&&!suppressScrollAfterOpen)conversationScroll.scrollTop=conversationScroll.scrollHeight; suppressScrollAfterOpen=false;});
}

function renderProfile(q){
  if(!customerProfile)return;
  customerProfile.innerHTML=`<div class="profile-avatar-wrap"><div class="profile-avatar">${escapeHtml(initials(q.customerName||'ST'))}</div><div class="profile-main"><strong>${escapeHtml(q.customerName||'Unknown client')}</strong><span>${escapeHtml(q.customerEmail||'No email')}</span></div></div><div class="profile-meta"><div class="profile-field"><label>Phone</label><strong>${escapeHtml(q.phone||'Not provided')}</strong></div><div class="profile-field"><label>Company</label><strong>${escapeHtml(q.company||'Not provided')}</strong></div><div class="profile-field"><label>Country</label><strong>${escapeHtml(q.country||'Not provided')}</strong></div><div class="profile-field"><label>Last activity</label><span>${escapeHtml(formatDateLong(q.ticketUpdatedAt||q.lastReplyAt||q.createdAt||q.created))}</span></div></div><div class="profile-card"><div class="profile-card-title">Ticket details</div><div class="profile-card-row"><span>Ticket</span><strong>${escapeHtml(ticketLabel(q))}</strong></div><div class="profile-card-row"><span>Website</span><strong>${escapeHtml(q.service||'—')}</strong></div><div class="profile-card-row"><span>Estimate</span><strong>${escapeHtml(q.estimate||'—')} ${escapeHtml(q.currency||'')}</strong></div><div class="profile-card-row"><span>Status</span><strong><span class="mini-pill">${escapeHtml(normalizeStatus(q))}</span></strong></div><div class="profile-card-row"><span>Next step</span><strong>${escapeHtml(q.preferredNextStep||'Email')}</strong></div></div><div class="profile-card"><div class="profile-card-title">Quotation</div><div class="profile-card-row"><span>Reference</span><strong>${escapeHtml(q.id||'—')}</strong></div><div class="profile-card-row"><span>Submitted</span><strong>${escapeHtml(formatDate(q.createdAt||q.created))}</strong></div></div><div class="profile-actions"><button class="profile-action" type="button" data-profile-action="email">Email</button><button class="profile-action" type="button" data-profile-action="quote">Quotation</button></div>`;
  customerProfile.querySelectorAll('[data-profile-action="email"]').forEach(btn=>btn.addEventListener('click',()=>{emailTo.value=q.customerEmail||'';showSection('email');}));
  customerProfile.querySelectorAll('[data-profile-action="quote"]').forEach(btn=>btn.addEventListener('click',()=>openQuotation(q.id)));
}

function openTicket(id){
  const q=quotationMap.get(id); if(!q)return;
  activeTicketId=id;
  conversationEmpty.hidden=true; conversationShell.hidden=false;
  activeTicketNumber.textContent=ticketLabel(q);
  activeTicketSubject.textContent=ticketSubject(q);
  activeTicketMeta.textContent=q.mergedIntoTicketNumber ? `Merged into ${q.mergedIntoTicketNumber}` : `Created ${formatDateLong(q.createdAt||q.created)}`;
  setActiveTicketBadge(normalizeStatus(q));
  activeTicketStatus.value=normalizeStatus(q);
  activeTicketStatus.disabled=normalizeStatus(q)==='Merged';
  adminReply.disabled=normalizeStatus(q)==='Merged';
  replyAnnotation.disabled=normalizeStatus(q)==='Merged';
  internalNote.disabled=normalizeStatus(q)==='Merged';
  adminReply.value=''; replyAnnotation.value=''; internalNote.value=''; ticketStatusMessage.textContent='';
  renderConversation(q); renderProfile(q); renderTickets([...quotationMap.values()]);
  if(conversationScroll){suppressScrollAfterOpen=true;conversationScroll.scrollTop=0;}
}

function setActiveTicketBadge(status){if(!activeTicketBadge)return;activeTicketBadge.textContent=status;activeTicketBadge.className=`ticket-status-badge ${statusClass(status)}`;}

function openQuotation(id){
  const q=quotationMap.get(id);if(!q||!quoteDetail)return;
  quoteDetail.hidden=false;activeTicketId=id;
  detailName.textContent=q.customerName||'Unknown client';detailEmail.textContent=q.customerEmail||'';detailTicket.textContent=ticketLabel(q);detailService.textContent=q.service||'—';detailEstimate.textContent=`${q.estimate||'—'}${q.currency?` ${q.currency}`:''}`;detailCountry.textContent=q.country||'—';detailNextStep.textContent=q.preferredNextStep||'Email discussion';detailRequirements.textContent=q.requirements||'—';detailAddons.textContent=Array.isArray(q.addons)&&q.addons.length?q.addons.join(' • '):'None';
  document.getElementById('openTicketFromQuote')?.addEventListener('click',()=>{showSection('support');openTicket(id);quoteDetail.hidden=true;},{once:true});
}
closeQuoteDetail?.addEventListener('click',()=>{quoteDetail.hidden=true;});

function buildMergeSummary(primary, secondary, mergedAt){
  const secondaryMessages=Array.isArray(secondary.ticketMessages)?secondary.ticketMessages:[];
  const customerTexts=secondaryMessages.filter(m=>m?.type!=='note' && m?.sender!=='admin').map(m=>String(m.text||'').trim()).filter(Boolean);
  const lastCustomer=customerTexts[customerTexts.length-1] || secondary.requirements || 'No customer message was recorded.';
  const subject=ticketSubject(secondary);
  return `Ticket ${ticketNumber(secondary)} was merged into ${ticketNumber(primary)} on ${formatDateLong(mergedAt)}.\n\nMerged conversation summary: Customer ${secondary.customerName||'the customer'} contacted STEADFAST regarding “${subject}”. The ticket concern was: ${String(secondary.requirements||lastCustomer).trim()}${lastCustomer && lastCustomer!==secondary.requirements ? ` Latest customer message: ${lastCustomer}` : ''}\n\nOriginal ticket: ${ticketLabel(secondary)}\nOriginal customer email: ${secondary.customerEmail||'Not provided'}`;
}

async function mergeActiveTicket(){
  const primary=quotationMap.get(activeTicketId);
  if(!primary)return;
  if(normalizeStatus(primary)==='Merged'){ticketStatusMessage.textContent='This ticket is already merged and cannot be merged again.';return;}
  const entered=window.prompt(`Merge which ticket into ${ticketNumber(primary)}?\n\nEnter the ticket number to merge into this ticket, for example: ST-002`,'');
  if(entered===null)return;
  const targetNumber=String(entered||'').trim().replace(/^#/,'').toUpperCase();
  if(!/^ST-\d{3,}$/.test(targetNumber)){ticketStatusMessage.textContent='Enter a valid ticket number such as ST-002.';activeTicketStatus.value=normalizeStatus(primary);return;}
  if(targetNumber===ticketNumber(primary).toUpperCase()){ticketStatusMessage.textContent='A ticket cannot be merged into itself.';activeTicketStatus.value=normalizeStatus(primary);return;}
  const secondary=[...quotationMap.values()].find(q=>ticketNumber(q).toUpperCase()===targetNumber);
  if(!secondary){ticketStatusMessage.textContent=`Ticket ${targetNumber} was not found.`;activeTicketStatus.value=normalizeStatus(primary);return;}
  if(normalizeStatus(secondary)==='Merged'){ticketStatusMessage.textContent=`${targetNumber} is already merged and cannot be selected.`;activeTicketStatus.value=normalizeStatus(primary);return;}
  const confirmed=window.confirm(`Merge ${ticketLabel(secondary)} into ${ticketLabel(primary)}?\n\nThis keeps ${ticketLabel(primary)} as the primary ticket and automatically marks ${ticketLabel(secondary)} as Merged.\n\n${ticketSubject(secondary)}\n${secondary.customerName||'Unknown customer'}\n${secondary.customerEmail||'No email'}\n\n${ticketLabel(secondary)} will automatically be marked Merged.`);
  if(!confirmed){activeTicketStatus.value=normalizeStatus(primary);return;}
  try{
    activeTicketStatus.disabled=true;
    ticketStatusMessage.textContent='Merging tickets…';
    const now=new Date();
    const summary=buildMergeSummary(primary,secondary,now);
    const secondaryMessages=Array.isArray(secondary.ticketMessages)?secondary.ticketMessages:[];
    const importedMessages=secondaryMessages.map(msg=>({...msg,mergedFromTicket:ticketNumber(secondary)}));
    const mergeRecord={sender:'system',type:'merge',name:'STEADFAST',text:summary,createdAt:now,mergedTicketNumber:ticketNumber(secondary),mergedTicketId:secondary.id};
    const batch=writeBatch(db);
    batch.update(doc(db,'quotations',primary.id),{
      ticketMessages:arrayUnion(mergeRecord,...importedMessages),
      mergedTicketNumbers:arrayUnion(ticketNumber(secondary)),
      mergedTicketIds:arrayUnion(secondary.id),
      ticketUpdatedAt:now
    });
    batch.update(doc(db,'quotations',secondary.id),{
      ticketStatus:'Merged',
      mergedIntoTicketNumber:ticketNumber(primary),
      mergedIntoTicketId:primary.id,
      mergedAt:now,
      mergeSummary:summary,
      ticketUpdatedAt:now
    });
    await batch.commit();
    activeTicketStatus.value=normalizeStatus(primary);
    ticketStatusMessage.textContent=`${ticketLabel(secondary)} merged into ${ticketLabel(primary)}.`;
    activeTicketStatus.disabled=false;
  }catch(e){
    console.error('Ticket merge failed:',e);
    activeTicketStatus.value=normalizeStatus(primary);
    activeTicketStatus.disabled=false;
    ticketStatusMessage.textContent='Could not merge the tickets. Please try again.';
  }
}

async function setTicketStatus(status){
  if(!activeTicketId)return;
  if(status==='__merge__'){activeTicketStatus.value=normalizeStatus(quotationMap.get(activeTicketId));await mergeActiveTicket();return;}
  if(status==='Merged')return;
  try{await updateDoc(doc(db,'quotations',activeTicketId),{ticketStatus:status,ticketUpdatedAt:new Date()});setActiveTicketBadge(status);ticketStatusMessage.textContent=`Status set to ${status}.`;}catch(e){console.error(e);ticketStatusMessage.textContent='Could not update ticket status.';}
}
activeTicketStatus?.addEventListener('change',()=>setTicketStatus(activeTicketStatus.value));

async function sendTicketReply(){
  const q=quotationMap.get(activeTicketId);const message=adminReply?.value.trim()||'';const annotation=replyAnnotation?.value.trim()||'';
  if(!q||!message){ticketStatusMessage.textContent='Write a reply first.';return;}
  const button=document.getElementById('sendAdminReply');button.disabled=true;button.textContent='Sending…';ticketStatusMessage.textContent='';
  const sent=postToGmailBridge({action:'sendEmail',to:q.customerEmail,subject:`Re: ${ticketSubject(q)}`,body:message});
  if(sent){
    try{
      const update={ticketMessages:arrayUnion({sender:'admin',name:'STEADFAST',text:message,createdAt:new Date()}),ticketStatus:'Open',lastAdminReply:message,lastReplyAt:new Date(),ticketUpdatedAt:new Date()};
      if(annotation)update.ticketAnnotations=arrayUnion({text:annotation,createdAt:new Date(),author:'Cliff Jandee',source:'reply'});
      await updateDoc(doc(db,'quotations',activeTicketId),update);
      adminReply.value='';replyAnnotation.value='';activeTicketStatus.value='Open';setActiveTicketBadge('Open');ticketStatusMessage.textContent='Reply queued through Gmail and saved to the ticket.';
    }catch(e){console.warn('Could not persist ticket reply',e);ticketStatusMessage.textContent='Reply sent, but the ticket history could not be saved.';}
  }else{ticketStatusMessage.textContent='Gmail is not connected.';}
  button.disabled=false;button.innerHTML='<svg viewBox="0 0 24 24"><path d="m4 4 17 8-17 8 3-8-3-8Zm3 8h14"/></svg>Send Reply';
}
document.getElementById('sendAdminReply')?.addEventListener('click',sendTicketReply);

saveInternalNote?.addEventListener('click',async()=>{
  const note=internalNote?.value.trim()||'';if(!activeTicketId||!note)return;
  saveInternalNote.disabled=true;saveInternalNote.textContent='Saving…';
  try{await updateDoc(doc(db,'quotations',activeTicketId),{ticketMessages:arrayUnion({sender:'admin',name:'Cliff Jandee',text:note,createdAt:new Date(),type:'note'}),ticketAnnotations:arrayUnion({text:note,createdAt:new Date(),author:'Cliff Jandee',source:'internal-note'}),ticketUpdatedAt:new Date()});internalNote.value='';ticketStatusMessage.textContent='Internal note saved.';}catch(e){console.error(e);ticketStatusMessage.textContent='Could not save internal note.';}
  saveInternalNote.disabled=false;saveInternalNote.innerHTML='<svg viewBox="0 0 24 24"><path d="M5 4h14v16H5zM8 4v5h8V4M8 13h8M8 17h5"/></svg>Save Internal Note';
});

composerTabs.forEach(tab=>tab.addEventListener('click',()=>{
  composerTabs.forEach(t=>t.classList.toggle('active',t===tab));const noteMode=tab.dataset.composeMode==='note';replyComposer.hidden=noteMode;noteComposer.hidden=!noteMode;ticketStatusMessage.textContent='';
}));

function subscribeToQuotations(){
  return onSnapshot(collection(db,'quotations'),snapshot=>{
    const items=snapshot.docs.map(s=>({id:s.id,...s.data()}));
    quotationMap=new Map(items.map(q=>[q.id,q]));
    updateDashboardMetrics(items);renderRecent(items);renderQuotations(items);renderTickets(items);
    if(activeTicketId&&quotationMap.has(activeTicketId)){const q=quotationMap.get(activeTicketId);activeTicketNumber.textContent=ticketLabel(q);activeTicketSubject.textContent=ticketSubject(q);activeTicketMeta.textContent=q.mergedIntoTicketNumber?`Merged into ${q.mergedIntoTicketNumber}`:`Created ${formatDateLong(q.createdAt||q.created)`};setActiveTicketBadge(normalizeStatus(q));activeTicketStatus.value=normalizeStatus(q);activeTicketStatus.disabled=normalizeStatus(q)==='Merged';adminReply.disabled=normalizeStatus(q)==='Merged';replyAnnotation.disabled=normalizeStatus(q)==='Merged';internalNote.disabled=normalizeStatus(q)==='Merged';renderConversation(q);renderProfile(q);}
    else if(items.length){
      const first=sortQuotations(items)[0];
      if(first)openTicket(first.id);
    }
    ensureTicketNumbers(items);
  },error=>{console.error('Quotation listener failed:',error);if(quotationRows)quotationRows.innerHTML='<tr><td colspan="7">Could not load quotations. Check Firestore Rules.</td></tr>';if(ticketList)ticketList.innerHTML='<div class="list-empty"><strong>Could not load tickets</strong><span>Check Firestore Rules.</span></div>';});
}

function sendGmail(to,subject,body,statusEl,button){
  if(!emailCfg.webAppUrl){if(statusEl)statusEl.textContent='Gmail is not connected yet. Add the Google Apps Script Web App URL to email-config.js.';return false;}
  if(!to||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)){if(statusEl)statusEl.textContent='Please enter a valid recipient email.';return false;}
  if(!subject||!body){if(statusEl)statusEl.textContent='Subject and message are required.';return false;}
  if(button){button.disabled=true;button.textContent='Sending…';}
  const sent=postToGmailBridge({action:'sendEmail',to,subject,body});
  if(statusEl)statusEl.textContent=sent?'Email queued through Gmail.':'Gmail request could not be started.';
  if(button)button.textContent='Send via Gmail',button.disabled=false;
  return sent;
}
sendEmailBtn?.addEventListener('click',()=>sendGmail(emailTo?.value.trim(),emailSubject?.value.trim(),emailBody?.value.trim(),gmailEmailStatus,sendEmailBtn));
clearEmailBtn?.addEventListener('click',()=>{emailTo.value='';emailSubject.value='Regarding your STEADFAST website quotation';emailBody.value='';gmailEmailStatus.textContent='';});
useQuoteTemplate?.addEventListener('click',()=>{emailSubject.value='Regarding your STEADFAST website quotation';emailBody.value='Hello there,\n\nThank you for your website quotation request. I have reviewed your requirements and would be happy to discuss the next steps with you.\n\nYour project may qualify for UP TO 75% OFF, subject to final review and eligibility.\n\nPlease let me know if you would like to continue by email or schedule a meeting.\n\nThank you,\nCliff Jandee Medrano\nSTEADFAST';gmailEmailStatus.textContent='Template loaded.';});

const sections=[...document.querySelectorAll('.section')];
const navItems=[...document.querySelectorAll('.nav-item')];
const title=document.getElementById('pageTitle');
const sidebar=document.getElementById('sidebar');
function showSection(id){sections.forEach(s=>s.classList.toggle('active',s.id===id));navItems.forEach(i=>i.classList.toggle('active',i.dataset.section===id));const active=navItems.find(i=>i.dataset.section===id);if(title)title.textContent=active?active.textContent.trim():'Dashboard';sidebar?.classList.remove('open');if(id!=='support')window.scrollTo({top:0,behavior:'smooth'});}
navItems.forEach(item=>item.addEventListener('click',()=>showSection(item.dataset.section)));
document.querySelectorAll('[data-section-link]').forEach(btn=>btn.addEventListener('click',()=>showSection(btn.dataset.sectionLink)));
document.getElementById('mobileMenu')?.addEventListener('click',()=>sidebar?.classList.toggle('open'));

function applyTicketFilter(filter){ticketFilter=filter;ticketFilters.forEach(btn=>btn.classList.toggle('active',btn.dataset.ticketFilter===filter));renderTickets([...quotationMap.values()]);}
ticketFilters.forEach(btn=>btn.addEventListener('click',()=>applyTicketFilter(btn.dataset.ticketFilter)));
ticketSearch?.addEventListener('input',()=>renderTickets([...quotationMap.values()]));
clearTicketSearch?.addEventListener('click',()=>{ticketSearch.value='';renderTickets([...quotationMap.values()]);ticketSearch.focus();});
sortTicketsBtn?.addEventListener('click',()=>{ticketSort=ticketSort==='desc'?'asc':'desc';renderTickets([...quotationMap.values()]);});
refreshTickets?.addEventListener('click',()=>{renderTickets([...quotationMap.values()]);if(activeTicketId&&quotationMap.has(activeTicketId))openTicket(activeTicketId);});
newTicketBtn?.addEventListener('click',()=>{showSection('quotations');});

let authHandled = false;
let authResolved = false;
let authTimeoutId = null;

function showAuthState(name, email){
  if(adminName) adminName.textContent=name;
  if(adminEmail) adminEmail.textContent=email;
}

function showAuthFailure(message){
  if(adminName) adminName.textContent = 'Authentication error';
  if(adminEmail) adminEmail.textContent = message;
}

// The HTML page already provides a zero-dependency logout fallback. Keep the
// same handler here so logout remains available after this module loads.
window.steadfastLogout = window.steadfastLogout || function(){
  try{sessionStorage.clear();}catch(e){}
  window.location.replace('./index.html?loggedOut=1');
  return false;
};
logoutBtn?.addEventListener('click',(event)=>{
  event.preventDefault();
  window.steadfastLogout();
});

function finishAdminAuth(user){
  if(authResolved) return;
  authResolved = true;
  if(authTimeoutId) window.clearTimeout(authTimeoutId);
  if(!user){
    showAuthState('Session expired','Redirecting to sign in…');
    window.setTimeout(()=>window.location.replace('./index.html?loggedOut=1'),250);
    return;
  }
  const email=(user.email||'').toLowerCase().trim();
  if(!isAuthorized(email)){
    showAuthState('Access denied','Unauthorized account');
    signOut(auth).finally(()=>window.location.replace('./index.html?loggedOut=1'));
    return;
  }
  authHandled=true;
  const displayName=user.displayName||'Cliff Jandee';
  showAuthState(displayName,email);
  if(avatar){
    if(user.photoURL){avatar.src=user.photoURL;avatar.alt=displayName;avatar.classList.add('has-photo')}
    else{avatar.src='../assets/steadfast-mark.png';avatar.alt='STEADFAST';avatar.classList.remove('has-photo')}
  }
  if(gmailStatus)gmailStatus.textContent=emailCfg.webAppUrl?'CONNECTED':'SETUP REQUIRED';
  const dashboardGmailStatus=document.getElementById('dashboardGmailStatus');
  if(dashboardGmailStatus)dashboardGmailStatus.textContent=emailCfg.webAppUrl?'Connected':'Setup required';
  if(stopQuotationListener)stopQuotationListener();
  stopQuotationListener=subscribeToQuotations();
}

// Attach to the existing Firebase Auth session. Do not initialize Auth a second
// time on this page. The listener is registered immediately so a valid Google
// session can open the dashboard and start Firestore without an auth deadlock.
try{
  const unsubscribeAuth = onAuthStateChanged(auth,(user)=>finishAdminAuth(user),(error)=>{
    console.error('STEADFAST Firebase Auth state error:',error);
    showAuthFailure(`Firebase Auth error: ${error?.code || error?.message || 'unknown error'}`);
    if(authTimeoutId) window.clearTimeout(authTimeoutId);
  });
  authTimeoutId = window.setTimeout(()=>{
    if(authResolved) return;
    console.error('STEADFAST Firebase Auth restore timed out. currentUser=',auth.currentUser);
    try { unsubscribeAuth(); } catch(e) {}
    showAuthFailure('Firebase session could not be restored. Please sign in again.');
    window.setTimeout(()=>window.location.replace('./index.html?loggedOut=1'),1500);
  },12000);
}catch(error){
  console.error('STEADFAST auth listener failed:',error);
  showAuthFailure(`Firebase Auth failed: ${error?.code || error?.message || 'unknown error'}`);
  window.setTimeout(()=>window.location.replace('./index.html?loggedOut=1'),1500);
}
