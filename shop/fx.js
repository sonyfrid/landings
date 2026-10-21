/* fx.js — общие эффекты для лендингов (без библиотек).
   Подключение: <script src="fx.js" defer></script>
   Атрибуты:
   data-fxnav            — шапка: при прокрутке сжимается в стеклянную «таблетку» по центру (как у Zoox)
   data-orbs="#c1,#c2"   — летающие объёмные шары внутри блока (как у Twinbru), реагируют на мышь
   data-par="0.15"       — параллакс при прокрутке (картинки, фоны)
   data-clip             — картинка раскрывается из маленькой рамки на весь экран при прокрутке
   data-lines            — текст появляется построчно снизу
   data-scrollx="-0.3"   — строка едет вбок вместе с прокруткой
   + полоса прогресса прокрутки сверху (цвет --fxbar)
*/
(function () {
  const css = `
  .fxbar{position:fixed;top:0;left:0;height:3px;width:100%;transform-origin:0 50%;transform:scaleX(0);background:var(--fxbar,#c8a46a);z-index:999;pointer-events:none}
  [data-fxnav]{transition:max-width .6s cubic-bezier(.2,.8,.2,1),padding .6s,margin .6s,border-radius .6s,background .6s,box-shadow .6s,height .6s}
  [data-fxnav].fxpill{max-width:var(--fxpillw,760px)!important;margin:12px auto 0!important;border-radius:999px;background:var(--fxglass,rgba(20,20,20,.55));backdrop-filter:blur(16px) saturate(1.4);-webkit-backdrop-filter:blur(16px) saturate(1.4);box-shadow:0 10px 40px rgba(0,0,0,.25);padding-left:22px!important;padding-right:22px!important;height:64px!important;padding-top:0!important;padding-bottom:0!important;align-items:center!important;border:1px solid rgba(255,255,255,.12);border-bottom:1px solid rgba(255,255,255,.12)!important}
  [data-fxnav] .fxhide{transition:opacity .4s,max-width .6s;max-width:400px;overflow:hidden;white-space:nowrap}
  [data-fxnav].fxpill .fxhide{opacity:0;max-width:0;margin:0!important;padding:0!important;pointer-events:none}
  .fxorbs{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0}
  .fxorb{position:absolute;border-radius:50%;will-change:transform}
  .fxshape:after{display:none}.fxshape svg{width:100%;height:100%;display:block}
  .fxorb:after{content:"";position:absolute;inset:0;border-radius:50%;opacity:.18;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E")}
  [data-clip]{clip-path:inset(var(--fxc,18%) round 28px);will-change:clip-path}
  [data-lines] .fxl{display:block;overflow:hidden}
  [data-lines] .fxl>span{display:block;transform:translateY(105%);transition:transform 1s cubic-bezier(.2,.8,.2,1)}
  [data-lines].fxon .fxl>span{transform:none}
  [data-scrollx]{white-space:nowrap;will-change:transform;transition:transform .9s cubic-bezier(.2,.7,.2,1)}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const bar = document.createElement('div'); bar.className = 'fxbar'; document.body.appendChild(bar);

  // шапка-таблетка
  const navs = [...document.querySelectorAll('[data-fxnav]')];
  // max-width «none» не анимируется — задаём числом, чтобы шапка сужалась плавно
  function fixNavWidth() {
    navs.forEach(n => {
      if (n.dataset.fxnav !== 'smooth' || n.classList.contains('fxpill')) return;  // только где попросили (Кумо)
      n.style.maxWidth = '';
      if (getComputedStyle(n).maxWidth === 'none') n.style.maxWidth = n.getBoundingClientRect().width + 'px';
    });
  }
  fixNavWidth(); addEventListener('resize', () => { navs.forEach(n => n.classList.remove('fxpill')); fixNavWidth() });

  // параллакс, раскрытие, бегущие строки
  const pars = [...document.querySelectorAll('[data-par]')];
  const clips = [...document.querySelectorAll('[data-clip]')];
  const sx = [...document.querySelectorAll('[data-scrollx]')];

  function onScroll() {
    const y = scrollY, h = innerHeight, max = document.documentElement.scrollHeight - h;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    navs.forEach(n => n.classList.toggle('fxpill', y > 120));
    pars.forEach(el => {
      const r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > h + 200) return;
      const k = parseFloat(el.dataset.par) || .15;
      el.style.transform = `translate3d(0,${((r.top + r.height / 2) - h / 2) * -k}px,0)`;
    });
    clips.forEach(el => {
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (h - r.top) / (h * .9)));
      el._p = Math.max(el._p || 0, p);
      el.style.setProperty('--fxc', (18 * (1 - el._p)).toFixed(2) + '%');
    });
    sx.forEach(el => {
      const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > h) return;
      el.style.transform = `translateX(${(r.top - h) * (parseFloat(el.dataset.scrollx) || -.3)}px)`;
    });
  }
  let ticking = false;
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; onScroll() }) } };
  addEventListener('scroll', req, { passive: true }); addEventListener('resize', req); onScroll();

  // построчное появление
  document.querySelectorAll('[data-lines]').forEach(el => {
    const parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map((p, i) => `<span class="fxl"><span style="transition-delay:${i * .1}s">${p}</span></span>`).join('');
    new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { el.classList.add('fxon'); o.disconnect() } }), { threshold: .3 }).observe(el);
  });

  // летающие предметы: data-shapes="bowl,scissors,..." (SVG) или шары по умолчанию
  const SH = {
    bowl: c => `<svg viewBox="0 0 100 100"><path d="M34 30c0-8 6-8 6-16M50 30c0-8 6-8 6-16M66 30c0-8 6-8 6-16" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" opacity=".8"><animate attributeName="opacity" values=".2;.9;.2" dur="3s" repeatCount="indefinite"/></path><path d="M10 44h80c0 24-18 42-40 42S10 68 10 44z" fill="${c}"/><rect x="34" y="84" width="32" height="6" rx="3" fill="${c}"/><path d="M70 40 94 18M74 42 98 22" stroke="${c}" stroke-width="3" stroke-linecap="round"/></svg>`,
    scissors: c => `<svg viewBox="0 0 100 100" fill="none" stroke="${c}" stroke-width="5"><circle cx="28" cy="76" r="13"/><circle cx="72" cy="76" r="13"/><path d="M36 66 80 8M64 66 20 8"/></svg>`,
    razor: c => `<svg viewBox="0 0 100 100"><path d="M18 70 60 28" stroke="${c}" stroke-width="12" stroke-linecap="round"/><path d="M60 28C66 14 80 8 92 10 88 24 78 34 64 36z" fill="none" stroke="${c}" stroke-width="4"/><circle cx="60" cy="30" r="4" fill="${c}"/></svg>`,
    comb: c => `<svg viewBox="0 0 100 100" fill="${c}"><rect x="10" y="30" width="80" height="12" rx="4"/>${Array.from({length:12},(_,i)=>`<rect x="${13+i*6.3}" y="40" width="3" height="${i%2?22:30}" rx="1.5"/>`).join('')}</svg>`,
    roller: c => `<svg viewBox="0 0 100 100"><rect x="14" y="14" width="62" height="22" rx="8" fill="${c}"/><path d="M76 25h10v22H50v14" fill="none" stroke="${c}" stroke-width="5"/><rect x="44" y="60" width="12" height="30" rx="4" fill="${c}"/></svg>`,
    hammer: c => `<svg viewBox="0 0 100 100"><path d="M20 30h46l10 10v8H58l-8-8H20z" fill="${c}"/><rect x="42" y="44" width="12" height="48" rx="4" fill="${c}"/></svg>`,
    house: c => `<svg viewBox="0 0 100 100"><path d="M12 50 50 16l38 34v38H12z" fill="${c}"/><rect x="40" y="62" width="20" height="26" fill="#fff" opacity=".8"/></svg>`,
    ruler: c => `<svg viewBox="0 0 100 100"><rect x="8" y="36" width="84" height="28" rx="4" fill="${c}"/>${Array.from({length:9},(_,i)=>`<rect x="${16+i*9}" y="36" width="3" height="${i%2?10:16}" fill="#fff" opacity=".85"/>`).join('')}</svg>`,
    brick: c => `<svg viewBox="0 0 100 100"><rect x="8" y="30" width="84" height="40" rx="4" fill="${c}"/><path d="M8 50h84M36 30v20M64 50v20" stroke="#fff" stroke-width="3" opacity=".7"/></svg>`,
    mustache: c => `<svg viewBox="0 0 100 100"><path d="M50 52c-6-12-20-16-30-8-6 5-12 4-16-2 0 14 14 24 30 20 8-2 14-6 16-10 2 4 8 8 16 10 16 4 30-6 30-20-4 6-10 7-16 2-10-8-24-4-30 8z" fill="${c}"/></svg>`,
    circle: c => `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="${c}"/></svg>`,
    square: c => `<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="10" fill="${c}"/></svg>`,
    triangle: c => `<svg viewBox="0 0 100 100"><path d="M50 6 96 90H4z" fill="${c}" stroke-linejoin="round"/></svg>`,
    ring: c => `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="none" stroke="${c}" stroke-width="12"/></svg>`,
  };
  // летающие шары
  const shade = c => `radial-gradient(circle at 32% 28%, rgba(255,255,255,.85) 0%, ${c} 38%, color-mix(in srgb, ${c} 55%, #000) 100%)`;
  document.querySelectorAll('[data-orbs]').forEach(host => {
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    const box = document.createElement('div'); box.className = 'fxorbs'; host.prepend(box);
    const cols = host.dataset.orbs.split(',');
    const n = +(host.dataset.orbsN || 6);
    const orbs = [];
    const shapes = host.dataset.shapes ? host.dataset.shapes.split(',').map(x => x.trim()) : null;
    for (let i = 0; i < n; i++) {
      const o = document.createElement('div'); o.className = 'fxorb';
      if (shapes) {
        const z = .4 + Math.random() * .8, s = (50 + Math.random() * 90) * z;
        o.classList.add('fxshape'); o.style.width = o.style.height = s + 'px';
        o.innerHTML = SH[shapes[i % shapes.length]](cols[i % cols.length].trim());
        o.style.opacity = (.45 + z * .5).toFixed(2);
        o.style.filter = z < .6 ? `blur(${(.6 - z) * 6}px)` : 'none';
        box.appendChild(o);
        orbs.push({ o, z, x: Math.random(), y: Math.random(), vx: (Math.random() - .5) * .0004, vy: (Math.random() - .5) * .0003, ph: Math.random() * 6, r: Math.random() * 360, vr: (Math.random() - .5) * .15 });
        continue;
      }
      const z = .35 + Math.random() * .9;              // глубина: дальние меньше, мутнее, медленнее
      const s = (60 + Math.random() * 160) * z;
      o.style.width = o.style.height = s + 'px';
      o.style.background = shade(cols[i % cols.length].trim());
      o.style.filter = z < .6 ? `blur(${(.6 - z) * 10}px)` : 'none';
      o.style.opacity = (.55 + z * .45).toFixed(2);
      o.style.boxShadow = `0 ${s * .25}px ${s * .35}px rgba(0,0,0,${.18 * z})`;
      box.appendChild(o);
      orbs.push({ o, z, x: Math.random(), y: Math.random(), vx: (Math.random() - .5) * .0004, vy: (Math.random() - .5) * .0003, ph: Math.random() * 6 });
    }
    let mx = 0, my = 0;
    addEventListener('mousemove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5 }, { passive: true });
    (function tick(t) {
      const W = box.clientWidth, H = box.clientHeight;
      orbs.forEach(b => {
        b.x += b.vx; b.y += b.vy;
        if (b.x < -.1 || b.x > 1.05) b.vx *= -1;
        if (b.y < -.1 || b.y > 1.05) b.vy *= -1;
        const bob = Math.sin(t / 1400 + b.ph) * 14 * b.z;
        if (b.vr !== undefined) b.r += b.vr;
        b.o.style.transform = `translate3d(${b.x * W - mx * 60 * b.z}px,${b.y * H + bob - my * 40 * b.z}px,0)` + (b.vr !== undefined ? ` rotate(${b.r}deg)` : '');
      });
      requestAnimationFrame(tick);
    })(0);
  });
})();
