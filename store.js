import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut, reload } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, collection, addDoc, setDoc, doc, serverTimestamp, onSnapshot, query, where, writeBatch } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
const firebaseConfig={apiKey:"AIzaSyD13MXR0ZQSjPJBxQKYPmsMKjl4yzU2hSs",authDomain:"steadfast-1d0e6.firebaseapp.com",projectId:"steadfast-1d0e6",storageBucket:"steadfast-1d0e6.firebasestorage.app",messagingSenderId:"488385339804",appId:"1:488385339804:web:0d2bcf3967a8f95ccfe859"};
const customerApp=getApps().find(a=>a.name==="steadfastCustomer")||initializeApp(firebaseConfig,"steadfastCustomer"),db=getFirestore(customerApp),auth=getAuth(customerApp);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=(v,c="PHP")=>{try{return new Intl.NumberFormat(undefined,{style:"currency",currency:c}).format(Number(v||0))}catch{return `${c} ${Number(v||0).toFixed(2)}`}};
let products=[];
function showSystemError(title, detail){const box=document.getElementById("sfSystemError");if(!box)return;document.getElementById("sfSystemErrorTitle").textContent=title||"Something went wrong.";document.getElementById("sfSystemErrorDetail").textContent=detail||"Please try again.";box.hidden=false;}
document.getElementById("sfSystemErrorClose")?.addEventListener("click",()=>{document.getElementById("sfSystemError").hidden=true});

async function hashCode(value){const data=new TextEncoder().encode(value);const hash=await crypto.subtle.digest("SHA-256",data);return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("");}
function imgs(p){return Array.isArray(p.previewImages)?p.previewImages.filter(Boolean):[];}
function livePreview(url,title){const u=/^https?:\/\//i.test(String(url||""))?String(url):"";if(!u)return `<div class="sf-preview-empty">NO LIVE PREVIEW</div>`;const shot=`https://image.thum.io/get/width/1400/crop/900/noanimate/${u}`;return `<div class="sf-live-frame" data-live-frame data-url="${esc(u)}"><iframe src="${esc(u)}" loading="eager" title="${esc(title)} preview" tabindex="-1" allow="fullscreen"></iframe><div class="sf-live-fallback"><img src="${esc(shot)}" alt="${esc(title)} website preview" loading="lazy"><div><strong>Live page preview</strong><span>The website may block embedded viewing. The preview image is shown as a fallback.</span><a href="${esc(u)}" target="_blank" rel="noopener">Open live website ↗</a></div></div></div>`}
function mainPreview(p){const list=imgs(p);if(p.previewUrl)return livePreview(p.previewUrl,p.name);if(list[0])return `<img src="${esc(list[0])}" alt="${esc(p.name)} preview">`;return `<div class="sf-preview-empty">LIVE PREVIEW</div>`}
function productCard(p){const stock=Math.max(0,Number(p.stock||0)),out=stock<1;return `<article class="sf-product-card"><div class="sf-product-preview sf-preview-button" role="button" tabindex="0" data-preview="${esc(p.id)}" aria-label="Preview ${esc(p.name)}">${mainPreview(p)}<span class="sf-preview-label">CLICK TO PREVIEW</span></div><div class="sf-product-body"><div class="sf-product-top"><span>DIGITAL PRODUCT</span><strong>${money(p.price,p.currency||"PHP")}</strong></div><h3>${esc(p.name)}</h3><p>${esc(p.description||"")}</p><div class="sf-product-meta"><span>${out?'Out of stock':`${stock} available`}</span><span>${esc(p.paymentMethod||'Manual verification')}</span></div><button class="btn primary full" type="button" data-buy="${esc(p.id)}" ${out?'disabled':''}>${out?'Sold Out':'Buy to Unlock'} <span>→</span></button></div></article>`}
function preview(p){const body=document.getElementById('sfPreviewBody');if(!body)return;const list=imgs(p);body.innerHTML=`<div class="sf-preview-modal-content"><div><div class="sf-product-preview-large" id="previewMain">${mainPreview(p)}</div>${list.length>1?`<div class="sf-preview-gallery">${list.map((x,i)=>`<button type="button" data-gallery="${i}"><img src="${esc(x)}" alt="Preview ${i+1}"></button>`).join('')}</div>`:''}</div><div class="sf-preview-modal-copy"><span class="sf-work-tag">DIGITAL PRODUCT</span><h2>${esc(p.name)}</h2><p>${esc(p.description||'')}</p><div class="sf-checkout-price"><span>Fixed price</span><strong>${money(p.price,p.currency||'PHP')}</strong></div><button class="btn primary full" type="button" data-buy="${esc(p.id)}" ${Number(p.stock||0)<1?'disabled':''}>${Number(p.stock||0)<1?'Sold Out':'Buy to Unlock'} <span>→</span></button></div></div>`;document.getElementById('sfPreviewModal').hidden=false;activateLiveFallbacks(body);body.querySelectorAll('[data-gallery]').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.gallery),m=document.getElementById('previewMain');if(m&&list[i])m.innerHTML=`<img src="${esc(list[i])}" alt="Preview ${i+1}">`}));body.querySelector('[data-buy]')?.addEventListener('click',()=>openCheckout(p));}
let authMode='login';
function authStatus(text,error=false){const el=document.getElementById('sfAuthStatus');if(!el)return;el.textContent=text;el.hidden=false;el.classList.toggle('error',error)}
function setAuthMode(mode){authMode=mode==='register'?'register':'login';const reg=authMode==='register';document.querySelectorAll('[data-auth-mode]').forEach(b=>b.classList.toggle('active',b.dataset.authMode===authMode));const title=document.getElementById('sfAuthTitle'),intro=document.getElementById('sfAuthIntro'),submit=document.getElementById('sfAuthSubmit'),confirm=document.getElementById('sfAuthConfirmWrap'),pw=document.getElementById('sfAuthPassword');if(title)title.textContent=reg?'Create your STEADFAST account.':'Sign in to purchase.';if(intro)intro.textContent=reg?'Use your email and a password to create your customer account.':'Sign in to purchase products and access your verified buyer reviews. You can return to the Store as a guest anytime.';if(submit)submit.textContent=reg?'Create account →':'Sign in →';if(confirm)confirm.hidden=!reg;if(pw)pw.autocomplete=reg?'new-password':'current-password';const st=document.getElementById('sfAuthStatus');if(st)st.hidden=true}
function openCustomerAuth(mode='login'){const modal=document.getElementById('sfCustomerAuthModal');if(!modal)return;setAuthMode(mode);modal.hidden=false;document.body.classList.add('modal-open');setTimeout(()=>document.getElementById('sfAuthEmail')?.focus(),50)}
function closeCustomerAuth(){const modal=document.getElementById('sfCustomerAuthModal');if(modal)modal.hidden=true;document.body.classList.remove('modal-open')}
function updateStoreAccount(user){const title=document.getElementById('storeAccountTitle'),detail=document.getElementById('storeAccountDetail'),actions=document.getElementById('storeAccountActions');if(!title||!detail||!actions)return;if(user){title.textContent=`Signed in as ${user.email||'customer'}`;detail.textContent='Your account is ready for purchasing and verified buyer reviews.';actions.innerHTML='<button class="btn primary" type="button" data-buy-account>Browse products →</button><button class="btn ghost" type="button" data-signout>Sign out</button>'}else{title.textContent='Sign in to purchase';detail.textContent='You can browse the Store as a guest. An account is required only when you purchase.';actions.innerHTML='<button class="btn primary" type="button" data-open-auth="login">Sign in</button><button class="btn ghost" type="button" data-open-auth="register">Create account</button><button class="btn ghost" type="button" data-guest-store>Visit as guest</button>'}}
document.addEventListener('click',e=>{const authBtn=e.target.closest('[data-open-auth]');if(authBtn){e.preventDefault();openCustomerAuth(authBtn.dataset.openAuth);return}const modeBtn=e.target.closest('[data-auth-mode]');if(modeBtn){e.preventDefault();setAuthMode(modeBtn.dataset.authMode);return}const toggle=e.target.closest('[data-toggle-password]');if(toggle){const input=document.getElementById(toggle.dataset.togglePassword);if(input){const showing=input.type==='text';input.type=showing?'password':'text';toggle.textContent=showing?'Show':'Hide';toggle.setAttribute('aria-label',showing?'Show password':'Hide password');}}if(e.target.closest('[data-close-auth]'))closeCustomerAuth();if(e.target.closest('[data-guest-store]'))closeCustomerAuth();if(e.target.closest('[data-buy-account]'))document.getElementById('steadfastStoreGrid')?.scrollIntoView({behavior:'smooth',block:'start'});if(e.target.closest('[data-signout]'))signOut(auth).catch(err=>showSystemError('Could not sign out.',err?.message||'Please try again.'));});
document.addEventListener('keydown',e=>{const modal=document.getElementById('sfCustomerAuthModal');if(e.key==='Escape'&&modal&&!modal.hidden)closeCustomerAuth()});
async function sendVerification(user){
  const actionCodeSettings={url:new URL('store.html?verified=1',location.href).href,handleCodeInApp:false};
  await sendEmailVerification(user,actionCodeSettings);
}
async function finishVerificationState(){
  const user=auth.currentUser;
  if(!user)return false;
  await reload(user);
  if(user.emailVerified)return true;
  return false;
}
document.getElementById('sfCustomerAuthForm')?.addEventListener('submit',async e=>{e.preventDefault();const email=document.getElementById('sfAuthEmail').value.trim().toLowerCase(),pw=document.getElementById('sfAuthPassword').value,confirm=document.getElementById('sfAuthConfirm').value;if(authMode==='register'&&pw!==confirm){authStatus('Passwords do not match.',true);return}try{
  if(authMode==='register'){
    authStatus('Creating account…');
    // Always start registration from a clean customer session. This prevents
    // an existing session from interfering with a new customer's account.
    if(auth.currentUser) await signOut(auth);
    const cred=await createUserWithEmailAndPassword(auth,email,pw);
    await sendVerification(cred.user);
    await signOut(auth);
    authStatus('Account created. We sent a verification email to '+email+'. Verify your email first, then return here and sign in.',false);
    document.getElementById('sfAuthTitle').textContent='Verify your email first.';
    document.getElementById('sfAuthIntro').textContent='Check your inbox (and Spam/Junk). Your account cannot purchase or submit reviews until the email is verified.';
    document.querySelectorAll('[data-auth-mode]').forEach(b=>b.classList.remove('active'));
    document.getElementById('sfAuthForm')?.classList.add('verification-sent');
    return;
  }
  authStatus('Signing in…');
  const cred=await signInWithEmailAndPassword(auth,email,pw);
  await reload(cred.user);
  if(!cred.user.emailVerified){
    await sendVerification(cred.user).catch(()=>{});
    await signOut(auth);
    authStatus('Your email is not verified yet. We sent another verification email to '+email+'. Verify it first, then sign in again.',true);
    return;
  }
  authStatus('Signed in successfully.');closeCustomerAuth();
}catch(err){console.error(err);const code=err?.code||'';const message=code==='auth/invalid-credential'?'Email or password is incorrect.':code==='auth/email-already-in-use'?'That email already has a STEADFAST customer account. Please use Sign in.':code==='auth/weak-password'?'Password must be at least 6 characters.':code==='auth/invalid-email'?'Please enter a valid email address.':code==='auth/operation-not-allowed'?'Email/password sign-in is disabled in Firebase. Enable Authentication → Sign-in method → Email/Password.':code==='auth/network-request-failed'?'Network error. Check your internet connection and try again.':code==='auth/too-many-requests'?'Too many attempts. Please wait a moment and try again.':(err?.message||'Account action failed.');authStatus(message,true)}});


function openCheckout(p){
  const user=auth.currentUser;
  if(!user){
    openCustomerAuth('login');
    return;
  }
  if(!user.emailVerified){
    openCustomerAuth('login');
    authStatus('Please verify your email before purchasing.');
    return;
  }
  const code=p.accessCodeHash||"";const modal=document.getElementById('sfPreviewModal'),body=document.getElementById('sfPreviewBody');
  body.innerHTML=`<div class="sf-preview-modal-copy"><span class="sf-work-tag">SECURE PRODUCT CHECKOUT</span><h2>${esc(p.name)}</h2><p>${esc(p.description||'')}</p><div class="sf-checkout-price"><span>Fixed price</span><strong>${money(p.price,p.currency||'PHP')}</strong></div><form id="sfOrderForm" class="sf-checkout-copy form-like">${code?`<label>Access code<input name="accessCode" required autocomplete="off" placeholder="Enter access code"></label>`:''}<label>Name<input name="name" required placeholder="Your name"></label><label>Email<input name="email" type="email" value="${esc(user.email||'')}" readonly></label><button class="btn primary full" type="submit">Proceed to Payment <span>→</span></button><small>Your account email will be attached to this order. Payment proof is reviewed manually before unlocking.</small></form></div>`;
  modal.hidden=false;body.querySelector('#sfOrderForm').addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(e.currentTarget);if(p.accessCodeHash){const entered=await hashCode(String(fd.get('accessCode')||''));if(entered!==p.accessCodeHash){showSystemError('Invalid access code.','The access code does not match this product.');return}}try{const orderRef=doc(collection(db,'storeOrders'));const checkoutRef=doc(db,'storeCheckout',orderRef.id);const createdAt=serverTimestamp();const batch=writeBatch(db);batch.set(orderRef,{productId:p.id,productName:p.name,customerName:String(fd.get('name')),customerEmail:user.email.trim().toLowerCase(),customerUid:user.uid,amount:Number(p.price||0),currency:p.currency||'PHP',paymentMethod:p.paymentMethod||'Manual verification',paymentUrl:p.paymentUrl||'',mariBankLink:p.mariBankLink||'',unlockUrl:p.unlockUrl||'',accessUsername:p.accessUsername||'',accessPassword:p.accessPassword||'',previewUrl:p.previewUrl||'',previewImages:imgs(p),description:p.description||'',status:'pending',createdAt});batch.set(checkoutRef,{productName:p.name,customerName:String(fd.get('name')),customerUid:user.uid,description:p.description||'',amount:Number(p.price||0),currency:p.currency||'PHP',paymentMethod:p.paymentMethod||'Manual verification',paymentUrl:p.paymentUrl||'',mariBankLink:p.mariBankLink||'',unlockUrl:p.unlockUrl||'',status:'pending',createdAt});await batch.commit();location.href=`pay.html?order=${encodeURIComponent(orderRef.id)}`;}catch(err){console.error(err);showSystemError('Could not create checkout order.',`Problem identified: ${err?.code||err?.message||'temporary Firebase error'}`);}})
}

function activateLiveFallbacks(root=document){root.querySelectorAll('[data-live-frame]').forEach(w=>{const iframe=w.querySelector('iframe');const fallback=w.querySelector('.sf-live-fallback');let timer=setTimeout(()=>{if(fallback)fallback.classList.add('show');},5500);iframe?.addEventListener('load',()=>{clearTimeout(timer);});});}
function loadStore(){const grid=document.getElementById('steadfastStoreGrid');if(!grid)return;onSnapshot(query(collection(db,'storeProducts'), where('active','==',true)),snap=>{products=snap.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.active).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));grid.innerHTML=products.length?products.map(productCard).join(''):`<div class="sf-empty-store"><strong>No products available.</strong><span>There are no products available in the STEADFAST Store right now.</span></div>`;activateLiveFallbacks(grid)},e=>{console.warn(e);showSystemError('Store could not load.', `Problem identified: ${e?.code||e?.message||'temporary Firebase connection or permission issue'}`);grid.innerHTML=`<div class="sf-empty-store sf-service-error"><strong>Store temporarily unavailable.</strong><span>We’re having trouble connecting to the Store service right now.</span><small>Problem identified: ${esc(e?.code||e?.message||'temporary Firebase connection or permission issue')}</small><button class="btn ghost" type="button" onclick="window.location.reload()">Try Again</button></div>`})}
document.addEventListener('click',e=>{const close=e.target.closest('[data-close-preview]');if(close)document.getElementById('sfPreviewModal').hidden=true;const pb=e.target.closest('[data-preview]');if(pb)preview(products.find(p=>p.id===pb.dataset.preview));const buy=e.target.closest('[data-buy]');if(buy&&!buy.closest('#sfPreviewBody'))openCheckout(products.find(p=>p.id===buy.dataset.buy));});
loadStore();

onAuthStateChanged(auth,async u=>{if(u){await reload(u).catch(()=>{});if(!u.emailVerified){await signOut(auth).catch(()=>{});updateStoreAccount(null);return;}}updateStoreAccount(u);});
const params=new URLSearchParams(location.search);if(params.get('auth')==='login')setTimeout(()=>openCustomerAuth('login'),150);if(params.get('verified')==='1')setTimeout(()=>{openCustomerAuth('login');authStatus('Email verification completed. You can now sign in with your email and password.');},200);

