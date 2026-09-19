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

  window.STEADFAST_FIREBASE_CONFIG = {
    apiKey: 'AIzaSyD13MXR0ZQSjPJBxQKYPmsMKjl4yzU2hSs',
    authDomain: 'steadfast-1d0e6.firebaseapp.com',
    projectId: 'steadfast-1d0e6',
    storageBucket: 'steadfast-1d0e6.firebasestorage.app',
    messagingSenderId: '488385339804',
    appId: '1:488385339804:web:0d2bcf3967a8f95ccfe859'
  };

  // ---------- Gmail bridge helper (no Gmail password is ever stored) ----------
  function postToGmailBridge(payload) {
    const cfg = window.STEADFAST_EMAIL_CONFIG || {};
    if (!cfg.webAppUrl) return false;
    try {
      const frameName = `steadfastMailFrame_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const iframe = document.createElement('iframe');
      iframe.name = frameName;
      iframe.style.display = 'none';
      iframe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(iframe);
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = cfg.webAppUrl;
      form.target = frameName;
      form.style.display = 'none';
      Object.entries(payload).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = Array.isArray(value) ? value.join('\n') : String(value ?? '');
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
      setTimeout(() => { iframe.remove(); form.remove(); }, 12000);
      return true;
    } catch (err) {
      console.warn('STEADFAST Gmail bridge request failed:', err);
      return false;
    }
  }

  // ---------- Website quotation with IP-based currency ----------
  const quoteForm = $('#quoteForm');
  if (quoteForm) {
    const base = {
      'Landing Page': 180,
      'Business Website': 350,
      'E-commerce Website': 650,
      'Web Application': 900,
      'Website Redesign': 250
    };
    const currencies = [
      ['USD','United States'],['PHP','Philippines'],['CAD','Canada'],['AUD','Australia'],['NZD','New Zealand'],['GBP','United Kingdom'],['EUR','Eurozone'],['SGD','Singapore'],['HKD','Hong Kong'],['JPY','Japan'],['CNY','China'],['KRW','South Korea'],['INR','India'],['MYR','Malaysia'],['THB','Thailand'],['IDR','Indonesia'],['AED','United Arab Emirates'],['SAR','Saudi Arabia'],['CHF','Switzerland'],['BRL','Brazil'],['MXN','Mexico'],['ZAR','South Africa']
    ];
    const countryCurrency = { US:'USD',CA:'CAD',AU:'AUD',NZ:'NZD',GB:'GBP',IE:'EUR',DE:'EUR',FR:'EUR',IT:'EUR',ES:'EUR',NL:'EUR',BE:'EUR',AT:'EUR',PT:'EUR',FI:'EUR',SE:'EUR',DK:'EUR',NO:'EUR',CH:'CHF',PH:'PHP',SG:'SGD',HK:'HKD',JP:'JPY',CN:'CNY',KR:'KRW',IN:'INR',MY:'MYR',TH:'THB',ID:'IDR',AE:'AED',SA:'SAR',BR:'BRL',MX:'MXN',ZA:'ZAR' };
    const symbols = {USD:'$',PHP:'₱',CAD:'CA$',AUD:'A$',NZD:'NZ$',GBP:'£',EUR:'€',SGD:'S$',HKD:'HK$',JPY:'¥',CNY:'CN¥',KRW:'₩',INR:'₹',MYR:'RM',THB:'฿',IDR:'Rp',AED:'AED ',SAR:'SAR ',CHF:'CHF ',BRL:'R$',MXN:'MX$',ZAR:'R'};
    let currency = 'USD', rate = 1, detectedCountry = 'United States', rateSource = 'fallback';
    const select = $('#currencySelect'), status = $('#currencyStatus'), label = $('#currencyLabel'), fxNote = $('#fxNote');
    if (select) select.innerHTML = currencies.map(([code,name]) => `<option value="${code}">${code} · ${name}</option>`).join('');

    const formatMoney = usd => {
      const amount = usd * rate;
      try { return new Intl.NumberFormat(undefined,{style:'currency',currency,maximumFractionDigits: currency==='JPY'||currency==='KRW'?0:2}).format(amount); }
      catch { return `${symbols[currency] || currency}${amount.toFixed(2)}`; }
    };
    const scopeSets = {
      'Landing Page': [['1','Starter landing page'],['1.6','Conversion-focused landing page'],['2.5','Advanced landing page']],
      'Business Website': [['1','Starter business site'],['1.6','Standard multi-page site'],['2.5','Advanced business site']],
      'E-commerce Website': [['1','Starter store'],['1.6','Standard online store'],['2.5','Advanced store'],],
      'Web Application': [['1','Prototype / small app'],['1.6','Standard web application'],['2.5','Advanced web system']],
      'Website Redesign': [['1','Visual refresh'],['1.6','Full redesign'],['2.5','Redesign + improvements']]
    };
    const updateScope = () => {
      const service = $('#service')?.value, size = $('#size');
      if (!size) return;
      const current = size.value;
      size.innerHTML = (scopeSets[service] || scopeSets['Business Website']).map(([v,t]) => `<option value="${v}">${t}</option>`).join('');
      size.value = [...size.options].some(o=>o.value===current) ? current : size.options[0]?.value || '1';
    };
    const calc = () => {
      const service = $('#service')?.value, size = parseFloat($('#size')?.value || 1), estimate = $('#estimate'), note = $('#estimateNote');
      if (!estimate || !note) return;
      if (!base[service]) { estimate.textContent = '—'; note.textContent = 'Choose a website type to calculate your starting estimate.'; }
      else {
        let value = base[service] * size;
        $$('.checks input:checked').forEach(x => value += Number(x.dataset.usd || x.value || 0));
        estimate.textContent = formatMoney(value);
        note.textContent = `Starting estimate · ${currency} · final pricing depends on scope.`;
      }
      $$('.checks small[data-usd]').forEach(el => el.textContent = `+ ${formatMoney(Number(el.dataset.usd))}`);
      if (label) label.textContent = `${currency} · ${detectedCountry}`;
    };
    const setCurrency = async (code, country='') => {
      currency = code || 'USD'; detectedCountry = country || detectedCountry || 'Local market';
      if (select) select.value = currency;
      rate = currency === 'USD' ? 1 : rate || 1;
      if (status) status.innerHTML = `<span class="detect-dot"></span><span>${country ? `Detected ${country}` : `Currency set to ${currency}`}</span>`;
      if (fxNote) fxNote.textContent = currency === 'USD' ? 'Base currency · USD' : 'Updating live FX rate…';
      calc();
      if (currency !== 'USD') {
        try {
          const r = await fetch('https://open.er-api.com/v6/latest/USD',{cache:'no-store'}), data = await r.json();
          if (data?.rates?.[currency]) { rate = Number(data.rates[currency]); rateSource = 'live'; if (fxNote) fxNote.textContent = `Live USD → ${currency} conversion`; calc(); }
          else throw new Error('Currency rate unavailable');
        } catch { rate = 1; if (fxNote) fxNote.textContent = `${currency} selected · FX service unavailable`; calc(); }
      }
    };
    if (select) select.addEventListener('change', () => setCurrency(select.value, detectedCountry));
    $('#service')?.addEventListener('change', () => { updateScope(); calc(); });
    $('#size')?.addEventListener('change', calc);
    $$('.checks input').forEach(x => x.addEventListener('change', calc));
    updateScope(); calc();

    fetch('https://ipapi.co/json/',{cache:'no-store'}).then(r=>r.json()).then(data => {
      const code = data?.country_code || 'US';
      const detected = data?.currency || countryCurrency[code] || 'USD';
      const name = data?.country_name || currencies.find(x=>x[0]===detected)?.[1] || 'Local market';
      return setCurrency(detected,name);
    }).catch(() => {
      const browserCurrency = countryCurrency[(navigator.language||'en-US').split('-')[1]?.toUpperCase()] || 'USD';
      return setCurrency(browserCurrency, currencies.find(x=>x[0]===browserCurrency)?.[1] || 'Local market');
    });

    quoteForm.addEventListener('submit', async e => {
      e.preventDefault();
      if (!base[$('#service')?.value]) { toast('Choose a website type first.'); return; }
      const customerName = $('#quoteName')?.value.trim() || '';
      const customerEmail = $('#quoteEmail')?.value.trim() || '';
      if (customerName.length < 2 || !/^\S+@\S+\.\S+$/.test(customerEmail)) { toast('Please enter your name and a valid email address.'); return; }

      const submitBtn = quoteForm.querySelector('button[type="submit"]');
      const originalBtn = submitBtn?.innerHTML || '';
      if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = 'Sending request…'; }

      const estimateText = $('#estimate')?.textContent || '';
      const data = {
        customerName, customerEmail, phone: $('#quotePhone')?.value.trim() || '', company: $('#quoteCompany')?.value.trim() || '',
        requirements: $('#quoteRequirements')?.value.trim() || '', preferredNextStep: $('#quoteNextStep')?.value || 'Email discussion',
        service: $('#service')?.value, scope: $('#size')?.selectedOptions?.[0]?.text || '', estimate: estimateText, currency, country: detectedCountry, fxRate: rate, rateSource,
        addons: $$('.checks input:checked').map(x => x.parentElement.textContent.trim()), status: 'New', source: 'steadfast-website', createdAt: new Date().toISOString()
      };
      localStorage.setItem('steadfastLastQuote', JSON.stringify(data));

      try {
        if (!window.STEADFAST_FIREBASE_CONFIG) throw new Error('Firebase config missing');
        const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js');
        const { getFirestore, collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js');
        const app = getApps().length ? getApps()[0] : initializeApp(window.STEADFAST_FIREBASE_CONFIG);
        const db = getFirestore(app);
        const ref = await addDoc(collection(db, 'quotations'), { ...data, createdAt: serverTimestamp() });
        data.id = ref.id;
        localStorage.setItem('steadfastLastQuote', JSON.stringify(data));

        const emailQueued = postToGmailBridge({
          action: 'sendQuoteEmail',
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          websiteType: data.service,
          scope: data.scope,
          estimate: data.estimate,
          currency: data.currency,
          country: data.country,
          requirements: data.requirements,
          nextStep: data.preferredNextStep,
          addons: data.addons.join('\n'),
          quoteId: data.id
        });

        toast(emailQueued ? 'Quote received! Confirmation sent by Gmail.' : 'Quote received! We will follow up shortly.');
        quoteForm.reset();
        updateScope();
        calc();
      } catch (err) {
        console.error('Quotation submission failed:', err);
        toast('We could not send your quote right now. Please try again in a moment.');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtn; }
      }
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

  // ---------- Route page tabs ----------
  const tabButtons = $$('[data-tab]');
  const tabPanels = $$('[data-panel]');
  if (tabButtons.length && tabPanels.length) {
    tabButtons.forEach(btn => btn.addEventListener('click', () => {
      const key = btn.dataset.tab;
      tabButtons.forEach(b => b.classList.toggle('active', b === btn));
      tabPanels.forEach(panel => panel.classList.toggle('active', panel.dataset.panel === key));
    }));
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
