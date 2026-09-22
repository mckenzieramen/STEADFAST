import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, orderBy, limit, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD13MXR0ZQSjPJBxQKYPmsMKjl4yzU2hSs",
  authDomain: "steadfast-1d0e6.firebaseapp.com",
  projectId: "steadfast-1d0e6",
  storageBucket: "steadfast-1d0e6.firebasestorage.app",
  messagingSenderId: "488385339804",
  appId: "1:488385339804:web:0d2bcf3967a8f95ccfe859"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

const esc = (v="") => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = (v, currency="USD") => {
  const n = Number(v || 0);
  try { return new Intl.NumberFormat(undefined, {style:"currency", currency}).format(n); }
  catch { return `${currency} ${n.toFixed(2)}`; }
};

async function loadWorks(){
  const host = document.getElementById("steadfastWorksGrid");
  if (!host) return;
  const fallback = [{
    id:"mckenzie",
    title:"McKenzie Ramen House",
    category:"WEB · SYSTEMS · CUSTOMER EXPERIENCE",
    objective:"Build a complete restaurant website that connects the customer journey with practical business operations.",
    description:"A real restaurant website and admin system with ordering, accounts, reviews, support, product management, analytics and admin workflows.",
    previewUrl:"https://mckenzieramen.github.io/mckenzie-ramen-house/",
    visitUrl:"https://mckenzieramen.github.io/mckenzie-ramen-house/",
    image:"assets/mckenzie/customer-home.png",
    tag:"REAL PROJECT"
  }];
  try {
    const snap = await getDocs(collection(db,"portfolioProjects"));
    const remote = snap.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.published).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)).slice(0,12);
    const combined = remote.filter(p=>p.id!=="mckenzie"); renderWorks([fallback[0], ...combined], host);
  } catch(e) {
    console.warn("Works unavailable; using local featured project.", e);
    renderWorks(fallback, host);
  }
}
function renderWorks(items, host){
  host.innerHTML = items.map(p => `
    <article class="sf-work-card">
      <div class="sf-work-preview">
        <div class="sf-browser-bar"><i></i><i></i><i></i><span>${esc(p.previewUrl || p.visitUrl || "Live preview")}</span></div>
        ${p.previewUrl ? `<iframe src="${esc(p.previewUrl)}" loading="lazy" title="${esc(p.title)} live preview" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>` : `<img src="${esc(p.image||"assets/steadfast-mark.png")}" alt="${esc(p.title)}">`}
        <div class="sf-preview-fallback">Preview unavailable? <a href="${esc(p.visitUrl||p.previewUrl||"#")}" target="_blank" rel="noopener">Visit live ↗</a></div>
      </div>
      <div class="sf-work-body">
        <span class="sf-work-tag">${esc(p.tag || p.category || "PROJECT")}</span>
        <h3>${esc(p.title)}</h3>
        <p class="sf-objective"><b>Objective:</b> ${esc(p.objective || "Create a practical digital solution around the client's needs.")}</p>
        <p>${esc(p.description || "")}</p>
        <div class="sf-work-actions">
          <a class="btn primary" href="${esc(p.visitUrl||p.previewUrl||"#")}" target="_blank" rel="noopener">Visit <span>↗</span></a>
          ${p.detailsUrl ? `<a class="btn ghost dark-text" href="${esc(p.detailsUrl)}">Project Details <span>→</span></a>` : ""}
        </div>
      </div>
    </article>`).join("");
}

async function loadStore(){
  const grid=document.getElementById("steadfastStoreGrid");
  if(!grid) return;
  try{
    const snap=await getDocs(collection(db,"storeProducts"));
    const products=snap.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.active).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)).slice(0,24);
    if(!products.length){
      grid.innerHTML=`<div class="sf-empty-store"><strong>Digital products coming soon.</strong><span>Products will appear here when they are published from the STEADFAST Admin.</span></div>`;
      return;
    }
    grid.innerHTML=products.map(productCard).join("");
    grid.querySelectorAll("[data-buy]").forEach(btn=>btn.addEventListener("click",()=>openCheckout(products.find(p=>p.id===btn.dataset.buy))));
  }catch(e){
    console.warn("Store unavailable",e);
    grid.innerHTML=`<div class="sf-empty-store"><strong>Store setup in progress.</strong><span>The storefront will appear once the STEADFAST store database is connected.</span></div>`;
  }
}
function productCard(p){
  const stock=Math.max(0,Number(p.stock||0));
  const out=stock<1;
  return `<article class="sf-product-card">
    <div class="sf-product-preview">${p.previewUrl ? `<iframe src="${esc(p.previewUrl)}" loading="lazy" title="${esc(p.name)} preview"></iframe>` : `<img src="${esc(p.previewImage||"assets/steadfast-mark.png")}" alt="${esc(p.name)} preview">`}<span class="sf-preview-label">PREVIEW</span></div>
    <div class="sf-product-body"><div class="sf-product-top"><span>${esc(p.category||"DIGITAL PRODUCT")}</span><strong>${money(p.price,p.currency||"USD")}</strong></div>
    <h3>${esc(p.name)}</h3><p>${esc(p.description||"")}</p>
    <div class="sf-product-meta"><span>${out?"Out of stock":`${stock} available`}</span><span>${esc(p.paymentMethod||"Online payment")}</span></div>
    <button class="btn primary full" type="button" data-buy="${esc(p.id)}" ${out?"disabled":""}>${out?"Sold Out":"Buy to Unlock"} <span>→</span></button></div>
  </article>`;
}

function openCheckout(p){
  if(!p) return;
  const modal=document.getElementById("sfCheckoutModal");
  const body=document.getElementById("sfCheckoutBody");
  if(!modal||!body)return;
  body.innerHTML=`<div class="sf-checkout-preview">${p.previewUrl?`<iframe src="${esc(p.previewUrl)}" title="Preview"></iframe>`:`<img src="${esc(p.previewImage||"assets/steadfast-mark.png")}" alt="">`}</div>
  <div class="sf-checkout-copy"><span class="sf-work-tag">${esc(p.category||"DIGITAL PRODUCT")}</span><h3>${esc(p.name)}</h3><p>${esc(p.description||"")}</p>
  <div class="sf-checkout-price"><span>Fixed price</span><strong>${money(p.price,p.currency||"USD")}</strong></div>
  <form id="sfOrderForm"><label>Name<input name="name" required placeholder="Your name"></label><label>Email<input name="email" required type="email" placeholder="you@example.com"></label><button class="btn primary full" type="submit">Continue to ${esc(p.paymentMethod||"Payment")} <span>→</span></button><small>Your order will be created with a fixed amount of ${money(p.price,p.currency||"USD")}.</small></form></div>`;
  modal.hidden=false;
  body.querySelector("#sfOrderForm").addEventListener("submit",async e=>{
    e.preventDefault();
    const fd=new FormData(e.currentTarget);
    const order={productId:p.id,productName:p.name,customerName:fd.get("name"),customerEmail:fd.get("email"),amount:Number(p.price||0),currency:p.currency||"USD",paymentMethod:p.paymentMethod||"Online payment",unlockUrl:p.unlockUrl||"",status:"pending",createdAt:serverTimestamp()};
    try{
      const ref=await addDoc(collection(db,"storeOrders"),order); await addDoc(collection(db,"storeUnlocks"),{orderId:ref.id,productId:p.id,productName:p.name,amount:Number(p.price||0),currency:p.currency||"USD",paymentMethod:p.paymentMethod||"Online payment",paymentUrl:p.paymentUrl||"",mariBankLink:p.mariBankLink||"",unlockUrl:p.unlockUrl||"",status:"pending",createdAt:serverTimestamp()});
      location.href=`pay.html?order=${encodeURIComponent(ref.id)}`;
    }catch(err){ alert("We couldn't create the order yet. Please try again."); console.error(err); }
  });
}
document.addEventListener("click",e=>{ if(e.target.matches("[data-close-store]")) document.getElementById("sfCheckoutModal")?.setAttribute("hidden",""); });
loadWorks(); loadStore();
