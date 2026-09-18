const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function toast(msg){const t=$("#toast");if(!t)return;t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),3200)}
const menu=$(".menu-toggle"),nav=$("#nav"); if(menu) menu.addEventListener("click",()=>nav.classList.toggle("open"));
$$(".nav a").forEach(a=>a.addEventListener("click",()=>nav&&nav.classList.remove("open")));

const quoteForm=$("#quoteForm");
if(quoteForm){
 const base={ "Admin Support":150,"Customer Service":175,"Web Solutions":300,"Admin + Customer Service":275,"Full Support Package":450 };
 function calc(){let v=(base[$("#service").value]||150)*parseFloat($("#size").value);$$(".checks input:checked").forEach(x=>v+=+x.value);$("#estimate").textContent="$"+Math.round(v);}
 ["service","size"].forEach(id=>$("#"+id).addEventListener("change",calc));$$(".checks input").forEach(x=>x.addEventListener("change",calc));calc();
 quoteForm.addEventListener("submit",e=>{e.preventDefault();toast("Quote request prepared. Connect this form to email or Firebase next.");});
}
const contactForm=$("#contactForm");
if(contactForm) contactForm.addEventListener("submit",e=>{e.preventDefault();toast("Thanks! Your inquiry form is ready to connect to your email/Firebase.");contactForm.reset()});

const defaultReviews=[
 {name:"Janelle M.",role:"Small Business Owner",date:"Sep 12, 2025",rating:5,msg:"Cliff is very reliable and easy to work with. He communicates well and always delivers on time. Highly recommended!"},
 {name:"Ryan T.",role:"E-commerce Store Owner",date:"Aug 28, 2025",rating:5,msg:"Amazing support! He helped me set up my website and made the whole process smooth and stress-free."},
 {name:"Liza C.",role:"Restaurant Business Owner",date:"Aug 15, 2025",rating:5,msg:"Professional, responsive, and detail-oriented. STEADFAST truly lives up to its name."},
 {name:"Mark D.",role:"Startup Founder",date:"Aug 10, 2025",rating:5,msg:"Great customer service and very patient with revisions. The website looks amazing!"},
 {name:"Alyssa P.",role:"Online Seller",date:"Jul 25, 2025",rating:5,msg:"Cliff went above and beyond to help us. Super efficient and easy to communicate with. Will definitely work again!"},
 {name:"Kevin B.",role:"Entrepreneur",date:"Jul 18, 2025",rating:5,msg:"Not just a VA, but a true partner in growing our business. Highly recommended!"}
];
let selectedRating=0;
const list=$("#reviewList");
if(list){
 const stored=JSON.parse(localStorage.getItem("steadfastReviews")||"[]");
 const reviews=[...defaultReviews,...stored];
 function initials(n){return n.split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase()}
 function render(){
   list.innerHTML=reviews.map(r=>`<article class="review-card"><div class="stars">${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</div><p>“${escapeHtml(r.msg||"No written comment provided.")}”</p><div class="review-author"><div class="avatar">${initials(r.name)}</div><div><strong>${escapeHtml(r.name)}</strong><small>${escapeHtml(r.role||"Client")} · ${escapeHtml(r.date||"Today")}</small></div></div></article>`).join("");
   const count=reviews.length, avg=reviews.reduce((a,b)=>a+b.rating,0)/count;
   $("#ratingAverage").textContent=avg.toFixed(1);$("#reviewCount").textContent=count;
   for(let s=1;s<=5;s++){const c=reviews.filter(r=>r.rating===s).length,p=Math.round(c/count*100);$("#bar"+s).style.width=p+"%";$("#pct"+s).textContent=p+"%"}
 }
 function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
 render();
 $$(".star-picker button").forEach(btn=>btn.addEventListener("click",()=>{selectedRating=+btn.dataset.star;$$(".star-picker button").forEach(b=>b.textContent=+b.dataset.star<=selectedRating?"★":"☆")}));
 const rf=$("#reviewForm");
 rf.addEventListener("submit",e=>{e.preventDefault();if(!selectedRating){toast("Please choose a star rating first.");return}const review={name:$("#reviewName").value.trim(),role:"Client",date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),rating:selectedRating,msg:$("#reviewMessage").value.trim()||"Great experience working with STEADFAST."};stored.push(review);localStorage.setItem("steadfastReviews",JSON.stringify(stored));reviews.push(review);render();rf.reset();selectedRating=0;$$(".star-picker button").forEach(b=>b.textContent="☆");toast("Thank you! Your review has been added.");});
}