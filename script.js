const toast=document.getElementById("toast");
function showToast(msg){toast.textContent=msg;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),3200)}
const toggle=document.querySelector(".menu-toggle"),nav=document.getElementById("nav");
toggle?.addEventListener("click",()=>nav.classList.toggle("open"));
nav?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));
const quoteForm=document.getElementById("quoteForm"),estimate=document.getElementById("estimate");
const base={"Admin Support":150,"Customer Service":180,"Web Solutions":300,"Admin + Customer Service":350,"Full Support Package":500};
function updateEstimate(){let v=(base[document.getElementById("service").value]||150)*parseFloat(document.getElementById("size").value);document.querySelectorAll("#quoteForm input[type=checkbox]:checked").forEach(x=>v+=Number(x.value));estimate.textContent="$"+Math.round(v)}
document.getElementById("service")?.addEventListener("change",updateEstimate);
document.getElementById("size")?.addEventListener("change",updateEstimate);
document.querySelectorAll("#quoteForm input[type=checkbox]").forEach(x=>x.addEventListener("change",updateEstimate));
quoteForm?.addEventListener("submit",e=>{e.preventDefault();showToast("Quote request prepared. Let's connect to finalize the details.");});
document.getElementById("contactForm")?.addEventListener("submit",e=>{e.preventDefault();showToast("Thanks! Your inquiry is ready to be connected to the STEADFAST contact system.");});
