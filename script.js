(() => {
  'use strict';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Global utilities ----------
  function toast(message) {
    let t = $('#toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = message;
    t.classList.add('show');
    clearTimeout(window.__steadfastToast);
    window.__steadfastToast = setTimeout(() => t.classList.remove('show'), 3200);
  }

  function smoothScroll(target) {
    const el = document.querySelector(target);
    if (!el) return false;
    el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
    return true;
  }

  // ---------- Mobile navigation ----------
  const menu = $('.menu-toggle');
  const nav = $('#nav');
  if (menu && nav) {
    const closeMenu = () => {
      nav.classList.remove('open');
      menu.setAttribute('aria-expanded', 'false');
    };
    menu.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menu.setAttribute('aria-expanded', String(open));
    });
    $$('.nav a').forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('click', e => {
      if (nav.classList.contains('open') && !nav.contains(e.target) && !menu.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  }

  // ---------- Smooth internal links ----------
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      if (document.querySelector(href)) {
        e.preventDefault();
        history.pushState(null, '', href);
        smoothScroll(href);
      }
    });
  });

  // ---------- Active navigation + scroll progress ----------
  const sections = $$('main section[id], section[id]');
  const navLinks = $$('.nav a[href*="#"]');
  if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${id}` || a.getAttribute('href') === `index.html#${id}`));
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
    sections.forEach(s => io.observe(s));
  }

  let progress = $('#scrollProgress');
  if (!progress) {
    progress = document.createElement('div');
    progress.id = 'scrollProgress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progress);
  }
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  // ---------- Reveal-on-scroll ----------
  const revealTargets = $$('section, .service-card, .process-grid > div, .tool-group, .case-shot, .workflow-step, .case-split-card, .case-stats > div');
  revealTargets.forEach((el, i) => {
    if (el.classList.contains('js-reveal')) return;
    el.classList.add('js-reveal');
    if (!prefersReduced) el.style.setProperty('--reveal-delay', `${Math.min((i % 5) * 55, 220)}ms`);
  });
  if ('IntersectionObserver' in window && !prefersReduced) {
    const revealIO = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    revealTargets.forEach(el => revealIO.observe(el));
  } else revealTargets.forEach(el => el.classList.add('is-visible'));

  // ---------- Back-to-top ----------
  const topBtn = document.createElement('button');
  topBtn.className = 'back-to-top';
  topBtn.type = 'button';
  topBtn.setAttribute('aria-label', 'Back to top');
  topBtn.innerHTML = '↑';
  document.body.appendChild(topBtn);
  topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' }));
  const toggleTop = () => topBtn.classList.toggle('show', window.scrollY > 600);
  window.addEventListener('scroll', toggleTop, { passive: true });
  toggleTop();

  // ---------- Button ripple ----------
  $$('.btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('i');
      ripple.className = 'btn-ripple';
      ripple.style.left = `${e.clientX - rect.left}px`;
      ripple.style.top = `${e.clientY - rect.top}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 550);
    });
  });

  // ---------- Service cards ----------
  $$('.service-flip').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('a')) return;
      card.classList.toggle('is-flipped');
    });
    card.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('a')) {
        e.preventDefault(); card.classList.toggle('is-flipped');
      }
    });
  });

  // ---------- Quote builder ----------
  const quoteForm = $('#quoteForm');
  if (quoteForm) {
    const base = { 'Admin Support':150, 'Customer Service':175, 'Web Solutions':300, 'Admin + Customer Service':275, 'Full Support Package':450, 'Custom Quote':0 };
    const calc = () => {
      const service = $('#service')?.value;
      const size = parseFloat($('#size')?.value || 1);
      const estimate = $('#estimate');
      const note = $('#estimateNote');
      if (!estimate || !note) return;
      if (service === 'Custom Quote') {
        estimate.textContent = 'Custom';
        note.textContent = 'Tell me what you need and I’ll prepare a custom quote.';
        return;
      }
      let value = (base[service] || 0) * size;
      $$('.checks input:checked').forEach(x => value += Number(x.value || 0));
      estimate.textContent = '$' + Math.round(value);
      note.textContent = 'Starting estimate only — final pricing depends on scope and requirements.';
    };
    ['service','size'].forEach(id => $('#'+id)?.addEventListener('change', calc));
    $$('.checks input').forEach(x => x.addEventListener('change', calc));
    calc();
    quoteForm.addEventListener('submit', e => {
      e.preventDefault();
      const data = {
        service: $('#service')?.value,
        scope: $('#size')?.selectedOptions?.[0]?.text || '',
        estimate: $('#estimate')?.textContent || '',
        addons: $$('.checks input:checked').map(x => x.parentElement.textContent.trim()),
        created: new Date().toISOString()
      };
      localStorage.setItem('steadfastLastQuote', JSON.stringify(data));
      toast('Quote saved. Let’s turn it into an inquiry.');
      setTimeout(() => smoothScroll('#contact'), 350);
    });
  }

  // ---------- Contact form ----------
  const contactForm = $('#contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const email = $('#contactEmail')?.value.trim() || '';
      if (!/^\S+@\S+\.\S+$/.test(email)) { toast('Please enter a valid email address.'); return; }
      const quote = JSON.parse(localStorage.getItem('steadfastLastQuote') || 'null');
      const data = {
        name: $('#contactName')?.value.trim() || '', email,
        service: $('#contactService')?.value || '', message: $('#contactMessage')?.value.trim() || '',
        quote, created: new Date().toISOString()
      };
      localStorage.setItem('steadfastLastInquiry', JSON.stringify(data));
      toast('Inquiry prepared and saved in this browser.');
      contactForm.reset();
    });
  }

  // ---------- FAQ accordion ----------
  $$('details').forEach(d => d.addEventListener('toggle', () => {
    if (d.open) $$('details').filter(x => x !== d).forEach(x => x.removeAttribute('open'));
  }));

  // ---------- Reviews ----------
  const list = $('#reviewList');
  if (list) {
    const stored = JSON.parse(localStorage.getItem('steadfastReviews') || '[]');
    const reviews = [...stored];
    let selectedRating = 0;
    const esc = s => String(s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
    const initials = n => String(n).trim().split(/\s+/).map(x => x[0]).join('').slice(0,2).toUpperCase() || 'CL';
    const render = () => {
      list.innerHTML = reviews.length ? reviews.map(r => `<article class="review-card"><div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div><p>“${esc(r.msg || 'No written comment provided.')}”</p><div class="review-author"><div class="avatar">${initials(r.name)}</div><div><strong>${esc(r.name)}</strong><small>${esc(r.role || 'Client')} · ${esc(r.date || 'Today')}</small></div></div></article>`).join('') : '<div class="empty-reviews"><div>★</div><h3>Your first review can go here.</h3><p>Once a real client submits feedback, it will appear in this section.</p></div>';
      const count = reviews.length;
      if ($('#reviewCount')) $('#reviewCount').textContent = count;
      if ($('#ratingAverage')) $('#ratingAverage').textContent = count ? (reviews.reduce((a,b)=>a+b.rating,0)/count).toFixed(1) : '—';
      for (let s=1; s<=5; s++) {
        const c = reviews.filter(r=>r.rating===s).length, p = count ? Math.round(c/count*100) : 0;
        if ($('#bar'+s)) $('#bar'+s).style.width = p+'%';
        if ($('#pct'+s)) $('#pct'+s).textContent = p+'%';
      }
    };
    render();
    $$('.star-picker button').forEach(btn => btn.addEventListener('click', () => {
      selectedRating = Number(btn.dataset.star);
      $$('.star-picker button').forEach(b => b.textContent = Number(b.dataset.star) <= selectedRating ? '★' : '☆');
    }));
    const rf = $('#reviewForm');
    if (rf) rf.addEventListener('submit', e => {
      e.preventDefault();
      if (!selectedRating) { toast('Please choose a star rating first.'); return; }
      const review = { name: $('#reviewName').value.trim(), role: $('#reviewRole').value.trim() || 'Client', date: new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}), rating:selectedRating, msg:$('#reviewMessage').value.trim() || 'Great experience working with STEADFAST.' };
      stored.push(review); localStorage.setItem('steadfastReviews', JSON.stringify(stored)); reviews.push(review); render(); rf.reset(); selectedRating=0; $$('.star-picker button').forEach(b=>b.textContent='☆'); toast('Thank you! Your review was added in this browser.');
    });
  }

  // ---------- Project gallery lightbox ----------
  const shots = $$('.case-shot');
  if (shots.length) {
    const modal = document.createElement('div');
    modal.className = 'project-lightbox';
    modal.setAttribute('aria-hidden','true');
    modal.innerHTML = `
      <div class="lightbox-backdrop"></div>
      <div class="lightbox-shell" role="dialog" aria-modal="true" aria-label="Project screenshot viewer">
        <div class="lightbox-top"><span class="lightbox-counter">01 / ${String(shots.length).padStart(2,'0')}</span><button class="lightbox-close" type="button" aria-label="Close viewer">×</button></div>
        <button class="lightbox-nav prev" type="button" aria-label="Previous screenshot">‹</button>
        <div class="lightbox-stage"><div class="lightbox-image-wrap"><img class="lightbox-image" alt=""></div></div>
        <button class="lightbox-nav next" type="button" aria-label="Next screenshot">›</button>
        <div class="lightbox-bottom"><div class="lightbox-caption"><b></b><span></span></div><div class="lightbox-tools"><button data-zoom="out" type="button" aria-label="Zoom out">−</button><button data-zoom="reset" type="button" aria-label="Reset zoom">100%</button><button data-zoom="in" type="button" aria-label="Zoom in">+</button></div></div>
      </div>`;
    document.body.appendChild(modal);
    const img = $('.lightbox-image', modal), wrap = $('.lightbox-image-wrap', modal), counter = $('.lightbox-counter', modal), title = $('.lightbox-caption b', modal), desc = $('.lightbox-caption span', modal);
    let index=0, scale=1, x=0, y=0, drag=false, sx=0, sy=0, ox=0, oy=0;
    const apply = () => { img.style.transform = `translate3d(${x}px,${y}px,0) scale(${scale})`; $('.lightbox-tools [data-zoom="reset"]',modal).textContent = Math.round(scale*100)+'%'; };
    const resetZoom = () => { scale=1; x=0; y=0; apply(); };
    const load = i => {
      index=(i+shots.length)%shots.length;
      const source=shots[index].querySelector('img');
      img.src=source.currentSrc || source.src; img.alt=source.alt || '';
      title.textContent=shots[index].querySelector('figcaption b')?.textContent || 'Project screen';
      desc.textContent=shots[index].querySelector('figcaption span:last-child')?.textContent || '';
      counter.textContent=`${String(index+1).padStart(2,'0')} / ${String(shots.length).padStart(2,'0')}`;
      resetZoom();
    };
    const open = i => { load(i); modal.classList.add('is-open'); modal.setAttribute('aria-hidden','false'); document.body.classList.add('lightbox-open'); setTimeout(()=>$('.lightbox-close',modal)?.focus(),180); };
    const close = () => { modal.classList.add('is-closing'); modal.setAttribute('aria-hidden','true'); setTimeout(()=>{modal.classList.remove('is-open','is-closing'); document.body.classList.remove('lightbox-open');},260); };
    shots.forEach((shot,i)=>{ shot.tabIndex=0; shot.setAttribute('role','button'); shot.setAttribute('aria-label',`Open ${shot.querySelector('figcaption b')?.textContent || 'project screen'}`); shot.addEventListener('click',()=>open(i)); shot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(i);}}); });
    $('.lightbox-close',modal).addEventListener('click',close); $('.lightbox-backdrop',modal).addEventListener('click',close); $('.lightbox-nav.prev',modal).addEventListener('click',()=>load(index-1)); $('.lightbox-nav.next',modal).addEventListener('click',()=>load(index+1));
    $('[data-zoom="in"]',modal).addEventListener('click',()=>{scale=Math.min(4,scale+.25);apply();});
    $('[data-zoom="out"]',modal).addEventListener('click',()=>{scale=Math.max(1,scale-.25); if(scale===1){x=0;y=0;} apply();});
    $('[data-zoom="reset"]',modal).addEventListener('click',resetZoom);
    $('.lightbox-stage',modal).addEventListener('wheel',e=>{e.preventDefault(); scale=Math.min(4,Math.max(1,scale+(e.deltaY<0?.2:-.2))); if(scale===1){x=0;y=0;} apply();},{passive:false});
    wrap.addEventListener('pointerdown',e=>{if(scale<=1)return;drag=true;sx=e.clientX;sy=e.clientY;ox=x;oy=y;wrap.setPointerCapture(e.pointerId);});
    wrap.addEventListener('pointermove',e=>{if(!drag)return;x=ox+(e.clientX-sx);y=oy+(e.clientY-sy);apply();});
    ['pointerup','pointercancel'].forEach(ev=>wrap.addEventListener(ev,()=>drag=false));
    document.addEventListener('keydown',e=>{if(!modal.classList.contains('is-open'))return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')load(index-1);if(e.key==='ArrowRight')load(index+1);});
  }

  // ---------- Subtle project hero parallax ----------
  const browser = $('.case-browser');
  if (browser && !prefersReduced && window.matchMedia('(pointer:fine)').matches) {
    const visual = $('.case-hero-visual');
    visual?.addEventListener('pointermove', e => {
      const r=visual.getBoundingClientRect(), px=(e.clientX-r.left)/r.width-.5, py=(e.clientY-r.top)/r.height-.5;
      browser.style.transform=`perspective(1300px) rotateY(${px*-5}deg) rotateX(${py*3}deg) translateY(-4px)`;
    });
    visual?.addEventListener('pointerleave',()=>browser.style.transform='');
  }

  // ---------- Image error guard ----------
  $$('img').forEach(img => img.addEventListener('error', () => img.classList.add('asset-error'), { once:true }));
  // ---------- STEADFAST fast logo loader + page transitions ----------
  const loader = document.createElement('div');
  loader.className = 'steadfast-loader';
  loader.innerHTML = `
    <div class="steadfast-loader-mark">
      <img src="assets/steadfast-mark.png" alt="STEADFAST">
    </div>`;
  document.body.prepend(loader);

  // Deliberately fast: 0.05s loader duration as requested.
  requestAnimationFrame(() => {
    setTimeout(() => loader.classList.add('is-done'), 50);
    setTimeout(() => loader.remove(), 180);
  });

  // Smooth route transition for same-site page navigation.
  const isModifiedClick = e => e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
  const isSameOriginInternal = a => {
    if (!a || !a.href) return false;
    if (a.target === '_blank' || a.hasAttribute('download')) return false;
    const url = new URL(a.href, location.href);
    return url.origin === location.origin && (url.pathname.endsWith('.html') || url.pathname === location.pathname || url.pathname === '/');
  };

  document.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!a || isModifiedClick(e) || !isSameOriginInternal(a)) return;
    const url = new URL(a.href, location.href);
    // Same-document anchors use the native smooth scroll handler above.
    if (url.pathname === location.pathname && url.hash) return;
    e.preventDefault();
    document.body.classList.add('page-leaving');
    setTimeout(() => { window.location.href = a.href; }, 180);
  }, true);

  // Logo is always a true Home route, including header/footer marks.
  $$('.brand, .footer-brand, [data-home-logo]').forEach(logo => {
    logo.addEventListener('click', e => {
      const href = logo.getAttribute('href') || 'index.html#home';
      if (href.startsWith('http') || href.startsWith('#')) return;
      e.preventDefault();
      document.body.classList.add('page-leaving');
      setTimeout(() => { window.location.href = 'index.html#home'; }, 180);
    });
  });

  // ---------- Smooth mobile menu transition ----------
  $$('.menu-toggle').forEach(btn => {
    btn.addEventListener('click', () => document.body.classList.toggle('menu-open'));
  });

})();
