const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function toast(msg){const t=$("#toast");if(!t)return;t.textContent=msg;t.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove("show"),3600)}
const menu=$(".menu-toggle"),nav=$("#nav");if(menu&&nav){menu.addEventListener("click",()=>{const open=nav.classList.toggle("open");menu.setAttribute("aria-expanded",open)});$$('.nav a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}))}
const quoteForm=$("#quoteForm");
if(quoteForm){const base={"Admin Support":150,"Customer Service":175,"Web Solutions":300,"Admin + Customer Service":275,"Full Support Package":450,"Custom Quote":0};function calc(){const service=$("#service").value;if(service==='Custom Quote'){$("#estimate").textContent='Custom';$("#estimateNote").textContent='Tell me what you need and I’ll prepare a custom quote.';return}let v=base[service]*parseFloat($("#size").value);$$('.checks input:checked').forEach(x=>v+=Number(x.value));$("#estimate").textContent='$'+Math.round(v);$("#estimateNote").textContent='Starting estimate only — final pricing depends on scope and requirements.'}['service','size'].forEach(id=>$("#"+id).addEventListener('change',calc));$$('.checks input').forEach(x=>x.addEventListener('change',calc));calc();quoteForm.addEventListener('submit',e=>{e.preventDefault();const data={service:$("#service").value,scope:$("#size").selectedOptions[0].text,estimate:$("#estimate").textContent,addons:$$('.checks input:checked').map(x=>x.parentElement.textContent.trim()),created:new Date().toISOString()};localStorage.setItem('steadfastLastQuote',JSON.stringify(data));toast('Quote saved. Scroll to Contact to turn this into an inquiry.');setTimeout(()=>location.hash='contact',500)})}
const contactForm=$("#contactForm");if(contactForm){contactForm.addEventListener('submit',e=>{e.preventDefault();const quote=JSON.parse(localStorage.getItem('steadfastLastQuote')||'null');const data={name:$("#contactName").value.trim(),email:$("#contactEmail").value.trim(),service:$("#contactService").value,message:$("#contactMessage").value.trim(),quote,created:new Date().toISOString()};localStorage.setItem('steadfastLastInquiry',JSON.stringify(data));toast('Inquiry prepared and saved in this browser. Backend connection can be added when your email/Firebase endpoint is ready.');contactForm.reset()})}
const defaultReviews=[];let selectedRating=0;const list=$("#reviewList");
if(list){const stored=JSON.parse(localStorage.getItem('steadfastReviews')||'[]');const reviews=[...defaultReviews,...stored];function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}function initials(n){return String(n).trim().split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()||'CL'}function render(){if(!reviews.length){list.innerHTML='<div class="empty-reviews"><div>★</div><h3>Your first review can go here.</h3><p>Once a real client submits feedback, it will appear in this section.</p></div>'}else{list.innerHTML=reviews.map(r=>`<article class="review-card"><div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div><p>“${esc(r.msg||'No written comment provided.')}”</p><div class="review-author"><div class="avatar">${initials(r.name)}</div><div><strong>${esc(r.name)}</strong><small>${esc(r.role||'Client')} · ${esc(r.date||'Today')}</small></div></div></article>`).join('')}const count=reviews.length;$("#reviewCount").textContent=count;if(count){const avg=reviews.reduce((a,b)=>a+b.rating,0)/count;$("#ratingAverage").textContent=avg.toFixed(1)}for(let s=1;s<=5;s++){const c=reviews.filter(r=>r.rating===s).length,p=count?Math.round(c/count*100):0;const bar=$("#bar"+s),pct=$("#pct"+s);if(bar)bar.style.width=p+'%';if(pct)pct.textContent=p+'%'}}render();$$('.star-picker button').forEach(btn=>btn.addEventListener('click',()=>{selectedRating=Number(btn.dataset.star);$$('.star-picker button').forEach(b=>b.textContent=Number(b.dataset.star)<=selectedRating?'★':'☆')}));const rf=$("#reviewForm");if(rf)rf.addEventListener('submit',e=>{e.preventDefault();if(!selectedRating){toast('Please choose a star rating first.');return}const review={name:$("#reviewName").value.trim(),role:$("#reviewRole").value.trim()||'Client',date:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),rating:selectedRating,msg:$("#reviewMessage").value.trim()||'Great experience working with STEADFAST.'};stored.push(review);localStorage.setItem('steadfastReviews',JSON.stringify(stored));reviews.push(review);render();rf.reset();selectedRating=0;$$('.star-picker button').forEach(b=>b.textContent='☆');toast('Thank you! Your review was added in this browser.')})}
$$('details').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)$$('details').filter(x=>x!==d).forEach(x=>x.removeAttribute('open'))}));

// McKenzie project gallery — swipe, arrows, and dots.
const gallery = document.getElementById('mckenzieGallery');
const dots = document.getElementById('mckenzieDots');
if(gallery && dots){
  const slides = [...gallery.querySelectorAll('.gallery-slide')];
  let current = 0;
  slides.forEach((_,i)=>{
    const b=document.createElement('button'); b.type='button'; b.className='gallery-dot'+(i===0?' active':'');
    b.setAttribute('aria-label','Show project screen '+(i+1));
    b.addEventListener('click',()=>goTo(i)); dots.appendChild(b);
  });
  const dotEls=[...dots.children];
  function goTo(i){ current=(i+slides.length)%slides.length; gallery.scrollTo({left:slides[current].offsetLeft,behavior:'smooth'}); dotEls.forEach((d,n)=>d.classList.toggle('active',n===current)); }
  const prev=document.querySelector('[data-gallery-prev]'), next=document.querySelector('[data-gallery-next]');
  prev?.addEventListener('click',()=>goTo(current-1)); next?.addEventListener('click',()=>goTo(current+1));
  let ticking=false; gallery.addEventListener('scroll',()=>{
    if(ticking)return; ticking=true; requestAnimationFrame(()=>{
      const i=Math.round(gallery.scrollLeft/gallery.clientWidth);
      if(i!==current && i>=0 && i<slides.length){current=i;dotEls.forEach((d,n)=>d.classList.toggle('active',n===current));}
      ticking=false;
    });
  });
}
