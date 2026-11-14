import {initializeApp,getApps} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {getFirestore,collection,addDoc,updateDoc,deleteDoc,doc,onSnapshot,serverTimestamp} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import {getStorage,ref,uploadBytes,getDownloadURL} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js";
const cfg={apiKey:"AIzaSyD13MXR0ZQSjPJBxQKYPmsMKjl4yzU2hSs",authDomain:"steadfast-1d0e6.firebaseapp.com",projectId:"steadfast-1d0e6",storageBucket:"steadfast-1d0e6.firebasestorage.app",messagingSenderId:"488385339804",appId:"1:488385339804:web:0d2bcf3967a8f95ccfe859"};
const app=getApps().length?getApps()[0]:initializeApp(cfg),auth=getAuth(app),db=getFirestore(app),storage=getStorage(app),$=id=>document.getElementById(id),val=id=>($(id)?.value||"").trim();
const allowed=u=>!!u&&["yahhclffjnd@gmail.com"].includes((u.email||"").toLowerCase().trim());
let products=new Map(),projects=new Map();
const esc=(v="")=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

const productStyle=document.createElement("style");
productStyle.textContent=`
#adminProductList{display:grid;gap:12px}
#adminProductList .commerce-item{display:grid!important;grid-template-columns:58px minmax(0,1fr) auto!important;align-items:center!important;gap:14px!important;padding:14px!important;border:1px solid rgba(255,255,255,.08)!important;border-radius:15px!important;background:linear-gradient(135deg,rgba(255,255,255,.025),rgba(139,92,246,.025))!important;transition:.18s ease!important;min-height:86px!important}
#adminProductList .commerce-item:hover{border-color:rgba(167,139,250,.3)!important;background:linear-gradient(135deg,rgba(139,92,246,.08),rgba(255,255,255,.025))!important;transform:translateY(-1px)}
#adminProductList .product-thumb{width:58px;height:58px;border-radius:12px;overflow:hidden;border:1px solid rgba(167,139,250,.2);background:linear-gradient(145deg,#1b1728,#0d0d15);display:grid;place-items:center;color:#a78bfa;font-weight:900;font-size:18px}
#adminProductList .product-thumb img{width:100%;height:100%;object-fit:cover;display:block}
#adminProductList .product-copy{min-width:0;display:flex;flex-direction:column;gap:6px}
#adminProductList .product-copy strong{font-size:12px;line-height:1.35;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#adminProductList .product-meta{display:flex;flex-wrap:wrap;align-items:center;gap:7px;color:#8f8a9d;font-size:9px}
#adminProductList .product-price{color:#d8ccff;font-weight:800}
#adminProductList .product-stock{padding:3px 7px;border-radius:999px;background:rgba(97,223,160,.08);border:1px solid rgba(97,223,160,.16);color:#77e5ad;font-weight:700}
#adminProductList .product-status{padding:3px 7px;border-radius:999px;background:rgba(139,92,246,.1);border:1px solid rgba(167,139,250,.2);color:#c5b3ff;font-weight:700}
#adminProductList .commerce-item-actions{display:flex!important;align-items:center!important;gap:7px!important;margin:0!important}
#adminProductList .commerce-item-actions button{height:32px;padding:0 11px;border-radius:9px;border:1px solid rgba(167,139,250,.22);background:rgba(139,92,246,.08);color:#d7ccff;font:700 9px/1 inherit;cursor:pointer;transition:.16s ease}
#adminProductList .commerce-item-actions button:hover{background:rgba(139,92,246,.18);border-color:rgba(167,139,250,.45);color:#fff}
#adminProductList .commerce-item-actions button.danger{border-color:rgba(255,113,136,.18);background:rgba(255,113,136,.05);color:#ff91a3}
#adminProductList .commerce-item-actions button.danger:hover{background:rgba(255,113,136,.12);border-color:rgba(255,113,136,.35)}
@media(max-width:720px){#adminProductList .commerce-item{grid-template-columns:48px minmax(0,1fr)!important;gap:11px!important}#adminProductList .product-thumb{width:48px;height:48px}#adminProductList .commerce-item-actions{grid-column:1/-1!important;justify-content:flex-end!important;padding-top:3px}}
`;
document.head.appendChild(productStyle);

function timeout(p,ms,msg){return Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error(msg)),ms))]);}
function button(t,off=false){const b=$("saveProductBtn");if(b){b.textContent=t;b.disabled=off;}}
async function image(file, folder = "store/previews"){const safe=file.name.replace(/[^a-z0-9._-]/gi,"-");const r=ref(storage,`${folder}/${crypto.randomUUID()}-${safe}`);await timeout(uploadBytes(r,file,{contentType:file.type||"image/*"}),10000,"Preview image upload timed out");return timeout(getDownloadURL(r),7000,"Preview image URL timed out");}
async function hash(s){const h=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,"0")).join("");}
async function saveProduct(e){e.preventDefault();e.stopImmediatePropagation();const u=auth.currentUser;if(!allowed(u)){alert(u?`Unauthorized admin account: ${u.email}`:"Please sign in again before publishing.");button("Publish Product");return;}const name=val("productName"),price=Number(val("productPrice")||0);if(!name){alert("Please enter the Product name.");return;}button("Publishing…",true);try{const id=val("productId"),old=(products.get(id)||{}).previewImages||[],pics=[];let warning="";for(const f of [...($("productPreviewFiles")?.files||[])].slice(0,8)){button("Uploading preview…",true);try{pics.push(await image(f));}catch(err){console.warn(err);warning=err.message||"Preview upload failed";break;}}button("Saving product…",true);const code=val("productAccessCode"),data={name,description:val("productDescription"),price,currency:val("productCurrency")||"PHP",stock:Math.max(0,Number(val("productStock")||0)),paymentMethod:val("productPaymentMethod")||"GCash",previewUrl:val("productPreviewUrl"),previewImages:[...old,...pics].filter(Boolean).slice(0,8),paymentUrl:val("productPaymentUrl"),unlockUrl:val("productUnlockUrl"),accessUsername:val("productAccessUsername"),accessPassword:val("productAccessPassword"),active:$("productActive")?.checked!==false,updatedAt:serverTimestamp()};if(code)data.accessCodeHash=await hash(code);if(id)await timeout(updateDoc(doc(db,"storeProducts",id),data),12000,"Product save timed out");else await timeout(addDoc(collection(db,"storeProducts"),{...data,createdAt:serverTimestamp()}),12000,"Product publish timed out");button("Published ✓",true);clearProduct();setTimeout(()=>button("Publish Product"),1200);if(warning)alert(`Product published. The image was skipped because: ${warning}. You can edit it and retry the image later.`);}catch(err){console.error("Publish failed",err);button("Publish failed");alert("Could not publish product: "+(err.message||err));setTimeout(()=>button("Publish Product"),1800);}}
function clearProduct(){["productId","productName","productDescription","productPrice","productPreviewUrl","productPaymentUrl","productUnlockUrl","productAccessCode","productAccessUsername","productAccessPassword"].forEach(x=>{if($(x))$(x).value=""});if($("productPreviewFiles"))$("productPreviewFiles").value="";if($("productStock"))$("productStock").value="1";if($("productActive"))$("productActive").checked=true;if($("productFormTitle"))$("productFormTitle").textContent="Create product";}
function editProduct(p){if(!p)return;for(const [id,key] of [["productId","id"],["productName","name"],["productDescription","description"],["productPrice","price"],["productCurrency","currency"],["productStock","stock"],["productPaymentMethod","paymentMethod"],["productPreviewUrl","previewUrl"],["productPaymentUrl","paymentUrl"],["productUnlockUrl","unlockUrl"],["productAccessUsername","accessUsername"],["productAccessPassword","accessPassword"]])if($(id))$(id).value=p[key]??"";$("productFormTitle").textContent="Edit product";}
function loadProducts(){const host=$("adminProductList");if(!host)return;onSnapshot(collection(db,"storeProducts"),s=>{products.clear();s.forEach(d=>products.set(d.id,{id:d.id,...d.data()}));host.innerHTML=products.size?[...products.values()].map(p=>{const img=p.previewImages?.[0]||"";const initial=esc((p.name||"P").trim().charAt(0).toUpperCase());return `<div class="commerce-item"><div class="product-thumb">${img?`<img src="${esc(img)}" alt="${esc(p.name||"Product")}">`:initial}</div><div class="product-copy"><strong>${esc(p.name||"Untitled")}</strong><div class="product-meta"><span class="product-price">${esc(p.currency||"PHP")} ${Number(p.price||0).toFixed(2)}</span><span class="product-stock">Stock ${Number(p.stock||0)}</span><span class="product-status">${p.active===false?"Hidden":"Published"}</span></div></div><div class="commerce-item-actions"><button type="button" data-edit-product="${p.id}">Edit</button>${/^https?:\/\//i.test(p.previewUrl || "") ? `<button type="button" data-project-from-product="${esc(p.id)}">Add to Live Projects</button>` : ""}<button type="button" class="danger" data-delete-product="${p.id}">Delete</button></div></div>`;}).join(""):'<div class="empty-state">No products yet.</div>';},err=>host.innerHTML=`<div class="empty-state">${esc(err.message)}</div>`);}
const projectFields = {
  projectTitle: "title", projectCategory: "category", projectObjective: "objective",
  projectDescription: "description", projectPreviewUrl: "previewUrl",
  projectVisitUrl: "visitUrl", projectImage: "image", projectDetailsUrl: "detailsUrl"
};
const projectForm = $("projectForm");
const projectStatus = $("projectStatus");
const saveProjectButton = $("saveProjectBtn");

function fillProject(project = {}) {
  projectForm.reset();
  $("projectId").value = project.id || "";
  for (const [field, key] of Object.entries(projectFields)) $(field).value = project[key] || "";
  $("projectPublished").checked = project.id ? project.published === true : true;
  $("projectFormTitle").textContent = project.id ? "Edit project" : "Add project";
  saveProjectButton.textContent = project.id ? "Save project" : "Publish project";
  projectStatus.textContent = "";
}

async function saveProject(event) {
  event.preventDefault();
  if (!allowed(auth.currentUser) || saveProjectButton.disabled) return;
  const id = val("projectId");
  const data = Object.fromEntries(Object.entries(projectFields).map(([field, key]) => [key, val(field)]));
  if (!data.title || !/^https?:\/\//i.test(data.visitUrl)) {
    projectStatus.textContent = "Enter a project title and an HTTPS or HTTP website URL.";
    return;
  }
  data.published = $("projectPublished").checked;
  data.updatedAt = serverTimestamp();
  const file = $("projectImageFile").files[0];
  saveProjectButton.disabled = true;
  $("clearProjectForm").disabled = true;
  try {
    if (file) {
      projectStatus.textContent = "Uploading preview…";
      data.image = await image(file, "portfolio/previews");
    }
    projectStatus.textContent = "Saving project…";
    if (id) await updateDoc(doc(db, "portfolioProjects", id), data);
    else await addDoc(collection(db, "portfolioProjects"), { ...data, createdAt: serverTimestamp() });
    fillProject();
    projectStatus.textContent = data.published
      ? "Published in homepage Live Projects."
      : "Saved as a draft. Enable Publish in Live Projects when ready.";
  } catch (error) {
    console.error("Project publish failed:", error);
    projectStatus.textContent = `Could not save project: ${error.message}`;
  } finally {
    saveProjectButton.disabled = false;
    $("clearProjectForm").disabled = false;
  }
}

function loadProjects() {
  const host = $("adminProjectList");
  onSnapshot(collection(db, "portfolioProjects"), snapshot => {
    projects = new Map(snapshot.docs.map(record => [record.id, { ...record.data(), id: record.id }]));
    host.innerHTML = projects.size ? [...projects.values()].map(project => `
      <div class="commerce-item">
        <div><strong>${esc(project.title || "Untitled")}</strong>
          <small>${project.published === true ? "Published in Live Projects" : "Draft"}</small>
        </div>
        <button type="button" class="text-btn" data-edit-project="${esc(project.id)}">Edit</button>
      </div>`).join("") : '<div class="empty-state">No projects yet.</div>';
  }, error => {
    console.error("Could not load projects:", error);
    host.textContent = "Could not load projects. Refresh to retry.";
  });
}

$("adminProjectList").addEventListener("click", event => {
  const button = event.target.closest("[data-edit-project]");
  if (!button || saveProjectButton.disabled) return;
  const project = projects.get(button.dataset.editProject);
  if (!project) return;
  fillProject(project);
  $("projectTitle").focus();
});
$("clearProjectForm").addEventListener("click", () => fillProject());
$("adminProductList").addEventListener("click", event => {
  const button = event.target.closest("[data-project-from-product]");
  if (!button || saveProjectButton.disabled) return;
  const product = products.get(button.dataset.projectFromProduct);
  if (!product || !/^https?:\/\//i.test(product.previewUrl || "")) return;
  const existing = [...projects.values()].find(project =>
    [project.visitUrl, project.previewUrl].includes(product.previewUrl)
  );
  fillProject(existing || {
    title: product.name,
    description: product.description,
    previewUrl: product.previewUrl,
    visitUrl: product.previewUrl,
    image: product.previewImages?.[0]
  });
  window.goAdminCommerce("projects");
  $("projectTitle").focus();
});


document.addEventListener("click",e=>{const a=e.target.closest("[data-edit-product]");if(a)return editProduct(products.get(a.dataset.editProduct));const d=e.target.closest("[data-delete-product]");if(d&&allowed(auth.currentUser)&&confirm("Delete this product?"))deleteDoc(doc(db,"storeProducts",d.dataset.deleteProduct));});
$("productForm")?.addEventListener("submit",saveProduct,true);$("clearProductForm")?.addEventListener("click",clearProduct);$("projectForm")?.addEventListener("submit",saveProject);document.querySelectorAll(".commerce-tab").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".commerce-tab").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".commerce-panel").forEach(x=>x.hidden=x.id!==`commerce-${b.dataset.commerceTab}`);}));
onAuthStateChanged(auth,u=>{if(allowed(u)){button("Publish Product");loadProducts();loadProjects();}else button(u?"Unauthorized account":"Sign in to publish");});