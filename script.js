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

// McKenzie real-project screenshot gallery: swipe/drag on touch or use arrows/dots.
(() => {
  const gallery = document.getElementById('mckenzieGallery');
  const dots = document.getElementById('mckenzieDots');
  if (!gallery || !dots) return;
  const slides = [...gallery.querySelectorAll('.gallery-slide')];
  let index = 0;
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'gallery-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Show screenshot ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dots.appendChild(dot);
  });
  const dotEls = [...dots.children];
  function goTo(i) {
    index = (i + slides.length) % slides.length;
    gallery.scrollTo({ left: gallery.clientWidth * index, behavior: 'smooth' });
    dotEls.forEach((d, n) => d.classList.toggle('active', n === index));
  }
  document.querySelector('[data-gallery-prev]')?.addEventListener('click', () => goTo(index - 1));
  document.querySelector('[data-gallery-next]')?.addEventListener('click', () => goTo(index + 1));
  let scrollTimer;
  gallery.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const next = Math.round(gallery.scrollLeft / Math.max(gallery.clientWidth, 1));
      if (next !== index) {
        index = Math.max(0, Math.min(slides.length - 1, next));
        dotEls.forEach((d, n) => d.classList.toggle('active', n === index));
      }
    }, 60);
  }, { passive: true });
})();
