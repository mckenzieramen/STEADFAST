import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, collection, addDoc, updateDoc, getDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, runTransaction } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js";

const firebaseConfig={apiKey:"AIzaSyD13MXR0ZQSjPJBxQKYPmsMKjl4yzU2hSs",authDomain:"steadfast-1d0e6.firebaseapp.com",projectId:"steadfast-1d0e6",storageBucket:"steadfast-1d0e6.firebasestorage.app",messagingSenderId:"488385339804",appId:"1:488385339804:web:0d2bcf3967a8f95ccfe859"};
const AUTHORIZED_EMAILS=["yahhclffjnd@gmail.com"];
const app=getApps().length?getApps()[0]:initializeApp(firebaseConfig);
const auth=getAuth(app), db=getFirestore(app), storage=getStorage(app);
const $=id=>document.getElementById(id);
let productMap=new Map(), projectMap=new Map();

function authorized(u){return u && AUTHORIZED_EMAILS.includes((u.email||"").toLowerCase().trim());}
function setMsg(msg){const b=$("saveProductBtn");if(b){b.textContent=msg;setTimeout(()=>b.textContent="Publish Product",1600)}}
async function uploadImage(file,path){
  if(!file)return "";
  const safe=file.name.replace(/[^a-z0-9._-]/gi,"-");
  const r=ref(storage,`${path}/${Date.now()}-${safe}`);
  await uploadBytes(r,file,{contentType:file.type||"image/*"});
  return getDownloadURL(r);
}
function val(id){return ($(id)?.value||"").trim();}

async function saveProduct(e){
  e.preventDefault();
  if(!auth.currentUser || !authorized(auth.currentUser))return;
  const id=val("productId");
  const file=$("productPreviewFile")?.files?.[0];
  let image=val("productPreviewImage");
  try{
    if(file)image=await uploadImage(file,"store/previews");
    const data={name:val("productName"),description:val("productDescription"),price:Number(val("productPrice")||0),currency:val("productCurrency")||"USD",stock:Math.max(0,Number(val("productStock")||0)),paymentMethod:val("productPaymentMethod")||"Payment Link",previewUrl:val("productPreviewUrl"),previewImage:image,paymentUrl:val("productPaymentUrl"),mariBankLink:val("productMariBankLink"),unlockUrl:val("productUnlockUrl"),active:$("productActive")?.checked!==false,updatedAt:serverTimestamp()};
    if(id) await updateDoc(doc(db,"storeProducts",id),data); else await addDoc(collection(db,"storeProducts"),{...data,createdAt:serverTimestamp()});
    setMsg("Saved ✓");clearProduct();loadProducts();
  }catch(err){console.error(err);alert("Could not save product: "+(err.message||err));}
}
function clearProduct(){
  ["productId","productName","productDescription","productPrice","productPreviewUrl","productPreviewImage","productPaymentUrl","productMariBankLink","productUnlockUrl"].forEach(id=>{if($(id))$(id).value=""});
  if($("productStock"))$("productStock").value="1";
  if($("productPaymentMethod"))$("productPaymentMethod").value="Payment Link";
  if($("productActive"))$("productActive").checked=true;
  if($("productFormTitle"))$("productFormTitle").textContent="Create product";
}
function editProduct(p){
  $("productId").value=p.id;$("productName").value=p.name||"";$("productDescription").value=p.description||"";$("productPrice").value=p.price??"";$("productCurrency").value=p.currency||"USD";$("productStock").value=p.stock??0;$("productPaymentMethod").value=p.paymentMethod||"Payment Link";$("productPreviewUrl").value=p.previewUrl||"";$("productPreviewImage").value=p.previewImage||"";$("productPaymentUrl").value=p.paymentUrl||"";$("productMariBankLink").value=p.mariBankLink||"";$("productUnlockUrl").value=p.unlockUrl||"";$("productActive").checked=p.active!==false;$("productFormTitle").textContent="Edit product";window.goAdminSection?.("commerce");}
async function loadProducts(){
  if(!auth.currentUser)return;
  onSnapshot(query(collection(db,"storeProducts"),orderBy("createdAt","desc")),snap=>{
    productMap.clear();snap.forEach(d=>productMap.set(d.id,{id:d.id,...d.data()}));
    const host=$("adminProductList");if(!host)return;
    if(!productMap.size){host.innerHTML='<div class="empty-state">No products yet.</div>';return;}
    host.innerHTML=[...productMap.values()].map(p=>`<div class="commerce-item"><div class="commerce-thumb">${p.previewImage?`<img src="${p.previewImage}" alt="">`:""}</div><div><strong>${escapeHtml(p.name||"Untitled")}</strong><small>${escapeHtml(p.currency||"USD")} ${Number(p.price||0).toFixed(2)} · Stock ${Number(p.stock||0)} · <span class="commerce-status ${p.active?"live":"off"}">${p.active?"Published":"Hidden"}</span></small></div><div class="commerce-item-actions"><button data-edit-product="${p.id}">Edit</button><button class="danger" data-delete-product="${p.id}">Delete</button></div></div>`).join("");
  });
}
async function deleteProduct(id){if(!confirm("Delete this product?"))return;await deleteDoc(doc(db,"storeProducts",id));}
async function saveProject(e){
  e.preventDefault();if(!authorized(auth.currentUser))return;
  const id=val("projectId"),file=$("projectImageFile")?.files?.[0];let image=val("projectImage");
  try{
    if(file)image=await uploadImage(file,"portfolio/previews");
    const data={title:val("projectTitle"),category:val("projectCategory"),objective:val("projectObjective"),description:val("projectDescription"),previewUrl:val("projectPreviewUrl"),visitUrl:val("projectVisitUrl"),image,detailsUrl:val("projectDetailsUrl"),published:$("projectPublished")?.checked!==false,updatedAt:serverTimestamp()};
    if(id)await updateDoc(doc(db,"portfolioProjects",id),data);else await addDoc(collection(db,"portfolioProjects"),{...data,createdAt:serverTimestamp()});
    clearProject();loadProjects();
  }catch(err){console.error(err);alert("Could not save project: "+(err.message||err));}
}
function clearProject(){["projectId","projectTitle","projectCategory","projectObjective","projectDescription","projectPreviewUrl","projectVisitUrl","projectImage","projectDetailsUrl"].forEach(id=>{if($(id))$(id).value=""});if($("projectPublished"))$("projectPublished").checked=true;if($("projectFormTitle"))$("projectFormTitle").textContent="Add project";}
function editProject(p){$("projectId").value=p.id;$("projectTitle").value=p.title||"";$("projectCategory").value=p.category||"";$("projectObjective").value=p.objective||"";$("projectDescription").value=p.description||"";$("projectPreviewUrl").value=p.previewUrl||"";$("projectVisitUrl").value=p.visitUrl||"";$("projectImage").value=p.image||"";$("projectDetailsUrl").value=p.detailsUrl||"";$("projectPublished").checked=p.published!==false;$("projectFormTitle").textContent="Edit project";window.goAdminSection?.("commerce");document.querySelector('[data-commerce-tab="projects"]')?.click();}
async function loadProjects(){if(!auth.currentUser)return;onSnapshot(query(collection(db,"portfolioProjects"),orderBy("createdAt","desc")),snap=>{projectMap.clear();snap.forEach(d=>projectMap.set(d.id,{id:d.id,...d.data()}));const host=$("adminProjectList");if(!host)return;if(!projectMap.size){host.innerHTML='<div class="empty-state">No projects yet.</div>';return}host.innerHTML=[...projectMap.values()].map(p=>`<div class="commerce-item"><div class="commerce-thumb">${p.image?`<img src="${p.image}" alt="">`:""}</div><div><strong>${escapeHtml(p.title||"Untitled")}</strong><small>${escapeHtml(p.category||"PROJECT")} · <span class="commerce-status ${p.published?"live":"off"}">${p.published?"Published":"Hidden"}</span></small></div><div class="commerce-item-actions"><button data-edit-project="${p.id}">Edit</button><button class="danger" data-delete-project="${p.id}">Delete</button></div></div>`).join("")});}
async function deleteProject(id){if(!confirm("Delete this project?"))return;await deleteDoc(doc(db,"portfolioProjects",id));}
function escapeHtml(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

function loadOrders(){
  if(!auth.currentUser)return;
  onSnapshot(query(collection(db,"storeOrders"),orderBy("createdAt","desc")),snap=>{
    const rows=$("storeOrderRows");if(!rows)return;
    if(snap.empty){rows.innerHTML='<tr><td colspan="7">No orders yet.</td></tr>';return}
    rows.innerHTML=snap.docs.map(d=>{const o=d.data();const date=o.createdAt?.toDate?o.createdAt.toDate().toLocaleString():"—";return `<tr><td><code>${d.id.slice(0,10)}</code></td><td>${escapeHtml(o.customerName||"—")}<br><small>${escapeHtml(o.customerEmail||"")}</small></td><td>${escapeHtml(o.productName||"—")}</td><td>${escapeHtml(o.currency||"USD")} ${Number(o.amount||0).toFixed(2)}</td><td><select class="order-status-select" data-order-status="${d.id}"><option value="pending" ${o.status==="pending"?"selected":""}>Pending</option><option value="verifying" ${o.status==="verifying"?"selected":""}>Verifying</option><option value="paid" ${o.status==="paid"?"selected":""}>Paid / Unlocked</option><option value="failed" ${o.status==="failed"?"selected":""}>Failed</option><option value="cancelled" ${o.status==="cancelled"?"selected":""}>Cancelled</option></select></td><td>${o.receiptUrl?`<a href="${escapeHtml(o.receiptUrl)}" target="_blank" rel="noopener">View proof</a>`:"—"}<br><small>${escapeHtml(date)}</small></td><td><button class="text-btn" data-open-order="${d.id}">Open</button></td></tr>`}).join("");
  });
}
async function updateOrderStatus(id,status){const orderRef=doc(db,"storeOrders",id);const before=await getDoc(orderRef);const prev=before.data()||{};await updateDoc(orderRef,{status,updatedAt:serverTimestamp()});const u=doc(db,"storeUnlocks",id);const snap=await getDoc(u);if(snap.exists())await updateDoc(u,{status,updatedAt:serverTimestamp()});if(status==="paid"&&prev.status!=="paid"&&prev.productId){const pRef=doc(db,"storeProducts",prev.productId);await runTransaction(db,async tx=>{const ps=await tx.get(pRef);if(!ps.exists())return;const current=Math.max(0,Number(ps.data().stock||0));tx.update(pRef,{stock:Math.max(0,current-1),updatedAt:serverTimestamp()});});sendPaymentEmail({action:"paymentVerified",customerEmail:prev.customerEmail,customerName:prev.customerName,productName:prev.productName,amount:prev.amount,currency:prev.currency,orderId:id,unlockUrl:prev.unlockUrl||""});}}

async function sendPaymentEmail(data){
  const cfg=window.STEADFAST_EMAIL_CONFIG||{};
  if(!cfg.webAppUrl||!data.customerEmail)return;
  try{const body=new URLSearchParams({action:data.action||"paymentSubmitted",...Object.fromEntries(Object.entries(data).map(([k,v])=>[k,String(v??"")]))});await fetch(cfg.webAppUrl,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},body});}catch(err){console.warn("Payment email bridge unavailable",err);}
}

document.addEventListener("click",e=>{
  const ep=e.target.closest("[data-edit-product]");if(ep){editProduct(productMap.get(ep.dataset.editProduct));return}
  const dp=e.target.closest("[data-delete-product]");if(dp){deleteProduct(dp.dataset.deleteProduct);return}
  const epr=e.target.closest("[data-edit-project]");if(epr){editProject(projectMap.get(epr.dataset.editProject));return}
  const dpr=e.target.closest("[data-delete-project]");if(dpr){deleteProject(dpr.dataset.deleteProject);return}
});
document.addEventListener("change",e=>{if(e.target.matches("[data-order-status]"))updateOrderStatus(e.target.dataset.orderStatus,e.target.value);});
document.querySelectorAll(".commerce-tab").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".commerce-tab").forEach(x=>x.classList.toggle("active",x===btn));document.querySelectorAll(".commerce-panel").forEach(x=>x.hidden=x.id!==`commerce-${btn.dataset.commerceTab}`);}));
$("productForm")?.addEventListener("submit",saveProduct);$("clearProductForm")?.addEventListener("click",clearProduct);$("projectForm")?.addEventListener("submit",saveProject);$("clearProjectForm")?.addEventListener("click",clearProject);

onAuthStateChanged(auth,user=>{if(authorized(user)){loadProducts();loadProjects();loadOrders();}});
