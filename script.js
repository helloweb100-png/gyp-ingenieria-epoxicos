/* =========================================================
   GyP Ingeniería Epóxicos · script.js
   JavaScript sin dependencias obligatorias. anime.js (CDN) solo
   suma detalles; si no carga, todo funciona igual.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- CONFIGURACIÓN ---------- */
  // Único lugar donde vive el número de WhatsApp: "52" + 10 dígitos.
  // Si se deja vacío, el botón flotante y el envío del formulario se ocultan.
  var WHATSAPP_NUMBER = '528135624509';

  var html = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var desktopMQ = window.matchMedia('(min-width: 900px)');

  // Avisa al HTML que el script sí cargó (si no, a los 6 s se quita la clase "js").
  window.__gypListo = true;
  // Red de seguridad: pase lo que pase, el contenido se muestra a los 2.6 s.
  setTimeout(function () { html.classList.add('is-ready'); }, 2600);

  /* ---------- Utilidades ---------- */
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function anim() { return typeof window.anime === 'function' ? window.anime : null; }
  function onMQ(mq, fn) { if (mq.addEventListener) { mq.addEventListener('change', fn); } else if (mq.addListener) { mq.addListener(fn); } }

  var state = { y: 0, vh: window.innerHeight, vw: window.innerWidth };
  var scrollModules = [];
  var tickers = [];
  var resizers = [];

  /* =========================================================
     1. CARGADOR
     ========================================================= */
  function initLoader() {
    var el = $('#cargador');
    var boot = function () { html.classList.add('is-ready'); };
    if (!el) { boot(); return; }
    var pct = $('#cargadorPct');
    var estado = $('#cargadorEstado');
    var estados = ['Preparando superficie', 'Aplicando primer', 'Mezclando resina', 'Curando el acabado', 'Listo'];
    var inicio = 150;
    var dur = reduceMotion ? 250 : 1450;
    var terminado = false;

    function terminar() {
      if (terminado) { return; }
      terminado = true;
      el.style.setProperty('--p', '1');
      if (pct) { pct.textContent = '100'; }
      if (estado) { estado.textContent = estados[estados.length - 1]; }
      el.classList.add('is-out');
      setTimeout(boot, reduceMotion ? 0 : 260);
      setTimeout(function () { el.classList.add('is-gone'); }, 740);
    }
    function paso(ahora) {
      var t = clamp((ahora - inicio) / dur);
      var e = 1 - Math.pow(1 - t, 3);
      el.style.setProperty('--p', e.toFixed(4));
      if (pct) { pct.textContent = String(Math.round(e * 100)); }
      if (estado) { estado.textContent = estados[Math.min(estados.length - 1, Math.floor(e * estados.length))]; }
      if (t < 1) { requestAnimationFrame(paso); } else { terminar(); }
    }
    requestAnimationFrame(paso);
    setTimeout(terminar, 1900);
  }

  /* =========================================================
     2. NAVEGACIÓN, MENÚ Y PROGRESO
     ========================================================= */
  function initNav() {
    var nav = $('#nav');
    var burger = $('#burger');
    var menu = $('#menuMovil');
    var barra = $('#progresoBarra');
    var lastY = 0;

    function setMenu(abrir) {
      if (!burger || !menu) { return; }
      burger.setAttribute('aria-expanded', String(abrir));
      burger.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
      html.classList.toggle('is-locked', abrir);
      if (abrir) {
        menu.hidden = false;
        if (nav) { nav.classList.remove('is-hide'); }
        requestAnimationFrame(function () { requestAnimationFrame(function () { menu.classList.add('is-open'); }); });
      } else {
        menu.classList.remove('is-open');
        setTimeout(function () { if (burger.getAttribute('aria-expanded') === 'false') { menu.hidden = true; } }, 430);
      }
    }
    if (burger && menu) {
      burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
      $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setMenu(false); burger.focus(); } });
      onMQ(desktopMQ, function () { if (desktopMQ.matches) { setMenu(false); } });
    }

    scrollModules.push(function (y) {
      var alto = Math.max(1, document.documentElement.scrollHeight - state.vh);
      if (barra) { barra.style.setProperty('--p', clamp(y / alto).toFixed(4)); }
      if (!nav) { return; }
      nav.classList.toggle('is-solid', y > 40);
      var abierto = burger && burger.getAttribute('aria-expanded') === 'true';
      if (!abierto) {
        var d = y - lastY;
        if (y > 280 && d > 6) { nav.classList.add('is-hide'); }
        else if (d < -4 || y < 140) { nav.classList.remove('is-hide'); }
      }
      lastY = y;
    });
  }

  /* =========================================================
     3. ENTRADAS AL HACER SCROLL
     ========================================================= */
  function initReveal() {
    $$('.gitem').forEach(function (el, i) { el.setAttribute('data-reveal', ''); el.style.setProperty('--d', String((i % 4) * 70)); });
    var els = $$('[data-reveal]');
    if (!('IntersectionObserver' in window) || reduceMotion) {
      els.forEach(function (e) { e.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  /* =========================================================
     4. HERO: flujo de partículas (mármol líquido) + movimiento 3D
     ========================================================= */
  function initFlow() {
    var canvas = $('#flujo');
    if (!canvas || !canvas.getContext) { return; }
    var hero = canvas.parentElement;
    var ctx = canvas.getContext('2d');
    var w = 0, h = 0, dpr = 1, parts = [], t = 0, visible = true;
    var mouse = { x: -9999, y: -9999, on: false };
    var PAL = [[26, 140, 240], [76, 195, 255], [140, 201, 250], [11, 114, 209], [255, 255, 255], [76, 195, 255]];

    function spawn(p) {
      p.x = rnd(0, w); p.y = rnd(0, h); p.life = 0; p.max = rnd(90, 260);
      p.sp = rnd(0.7, 1.9); p.c = PAL[Math.floor(Math.random() * PAL.length)];
      p.a = rnd(0.25, 0.75); p.lw = rnd(0.6, 1.6);
      return p;
    }
    function angle(x, y) {
      var s = 0.0026;
      return (Math.sin(x * s + t * 0.32) + Math.cos(y * s * 1.4 - t * 0.25) + Math.sin((x + y) * s * 0.7 + t * 0.18)) * 1.35 + 0.5;
    }
    function step(fade) {
      if (fade) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.fillRect(0, 0, w, h);
      }
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        var a = angle(p.x, p.y);
        var vx = Math.cos(a) * p.sp, vy = Math.sin(a) * p.sp;
        if (mouse.on) {
          var dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < 24000) {
            var d = Math.sqrt(d2) || 1, f = 1 - d / 155;
            vx += (-dy / d) * f * 2.6 + (dx / d) * f * 0.9;
            vy += (dx / d) * f * 2.6 + (dy / d) * f * 0.9;
          }
        }
        var nx = p.x + vx, ny = p.y + vy;
        var k = Math.sin(Math.PI * (p.life / p.max));
        ctx.strokeStyle = 'rgba(' + p.c[0] + ',' + p.c[1] + ',' + p.c[2] + ',' + (p.a * k).toFixed(3) + ')';
        ctx.lineWidth = p.lw;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();
        p.x = nx; p.y = ny; p.life++;
        if (p.life > p.max || nx < -20 || nx > w + 20 || ny < -20 || ny > h + 20) { spawn(p); }
      }
      t += 0.0045;
    }
    function size() {
      var r = hero.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = clamp(Math.round((w * h) / 3200), 110, 560);
      parts = [];
      for (var i = 0; i < n; i++) { parts.push(spawn({})); }
      var pre = reduceMotion ? 300 : 150;
      for (var j = 0; j < pre; j++) { step(true); }
    }
    size();

    if ('ResizeObserver' in window) {
      var ult = 0;
      new ResizeObserver(function () {
        clearTimeout(ult);
        ult = setTimeout(function () { var r = hero.getBoundingClientRect(); if (Math.abs(r.width - w) > 2 || Math.abs(r.height - h) > 40) { size(); } }, 180);
      }).observe(hero);
    }
    if (reduceMotion) { return; }

    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true;
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { mouse.on = false; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0 }).observe(hero);
    }
    tickers.push(function () { if (visible && !document.hidden) { step(true); } });
  }

  function initHeroMotion() {
    var hero = $('#inicio');
    var baraja = $('#baraja');
    var stage = $('#escenario');
    var inner = $('.hero__inner');
    if (!hero || !baraja) { return; }
    var tgt = { x: 0, y: 0 }, cur = { x: 0, y: 0 };

    if (finePointer && !reduceMotion) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        tgt.x = (e.clientX - r.left) / r.width - 0.5;
        tgt.y = (e.clientY - r.top) / r.height - 0.5;
      }, { passive: true });
      hero.addEventListener('pointerleave', function () { tgt.x = 0; tgt.y = 0; });
    }
    scrollModules.push(function (y) {
      if (reduceMotion) { return; }
      var k = clamp(y / (state.vh * 0.9));
      if (inner) {
        inner.style.transform = 'translate3d(0,' + (y * 0.14).toFixed(1) + 'px,0)';
        inner.style.opacity = String((1 - k * 0.92).toFixed(3));
      }
      if (stage) { stage.style.translate = '0 ' + (-y * 0.05).toFixed(1) + 'px'; }
    });
    tickers.push(function (now) {
      if (reduceMotion || document.hidden) { return; }
      var idleY = Math.sin(now * 0.0006) * 4;
      var idleX = Math.cos(now * 0.0005) * 3;
      cur.x = lerp(cur.x, tgt.x, 0.06);
      cur.y = lerp(cur.y, tgt.y, 0.06);
      baraja.style.setProperty('--ry', (cur.x * 16 + idleY).toFixed(2) + 'deg');
      baraja.style.setProperty('--rx', (-cur.y * 12 + idleX).toFixed(2) + 'deg');
    });
  }

  /* =========================================================
     5. MANIFIESTO (palabras que se encienden) Y NÚMEROS
     ========================================================= */
  function initWords() {
    var el = $('[data-palabras]');
    if (!el || reduceMotion) { return; }
    var texto = el.textContent.replace(/\s+/g, ' ').trim();
    var palabras = texto.split(' ');
    el.textContent = '';
    var spans = palabras.map(function (p, i) {
      var s = document.createElement('span');
      s.className = 'w'; s.textContent = p; s.style.opacity = '0.16';
      el.appendChild(s);
      if (i < palabras.length - 1) { el.appendChild(document.createTextNode(' ')); }
      return s;
    });
    var vals = spans.map(function () { return 0; });
    scrollModules.push(function () {
      var r = el.getBoundingClientRect();
      var p = clamp((state.vh * 0.82 - r.top) / (r.height + state.vh * 0.42));
      var n = spans.length;
      for (var i = 0; i < n; i++) {
        var k = clamp(p * (n + 6) - i);
        if (k > vals[i]) { vals[i] = k; spans[i].style.opacity = (0.16 + 0.84 * k).toFixed(3); }
      }
    });
  }

  function initCounters() {
    var els = $$('[data-cuenta]');
    if (!els.length) { return; }
    function correr(el) {
      var n = Number(el.getAttribute('data-cuenta')) || 0;
      if (reduceMotion || n <= 1) { el.textContent = String(n); return; }
      var A = anim();
      var obj = { v: 0 };
      if (A) {
        A({ targets: obj, v: n, round: 1, duration: 1600, easing: 'easeOutExpo', update: function () { el.textContent = String(obj.v); } });
      } else {
        var t0 = performance.now();
        (function f(now) {
          var k = clamp((now - t0) / 1400);
          el.textContent = String(Math.round(n * (1 - Math.pow(1 - k, 3))));
          if (k < 1) { requestAnimationFrame(f); }
        })(t0);
      }
    }
    if (!('IntersectionObserver' in window) || reduceMotion) { return; }
    els.forEach(function (el) { el.textContent = '0'; });
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { correr(x.target); io.unobserve(x.target); } });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* =========================================================
     6. SERVICIOS APILADOS Y ESCENA DE IMAGEN A PANTALLA COMPLETA
     ========================================================= */
  function initStack() {
    var cards = $$('#pila .svc');
    if (cards.length < 2) { return; }
    scrollModules.push(function () {
      if (!desktopMQ.matches || reduceMotion) {
        cards.forEach(function (c) { c.style.removeProperty('--s'); c.style.filter = ''; });
        return;
      }
      for (var i = 0; i < cards.length - 1; i++) {
        var c = cards[i], n = cards[i + 1];
        var top = 96 + i * 20;
        var nr = n.getBoundingClientRect();
        var t = clamp(1 - (nr.top - top - 24) / (c.offsetHeight * 0.85));
        c.style.setProperty('--s', (1 - 0.055 * t).toFixed(4));
        c.style.filter = t > 0.01 ? 'brightness(' + (1 - 0.28 * t).toFixed(3) + ')' : '';
      }
    });
  }

  function initEscena() {
    var sec = $('#escena');
    if (!sec) { return; }
    if (reduceMotion) { sec.style.setProperty('--p', '1'); return; }
    scrollModules.push(function () {
      var r = sec.getBoundingClientRect();
      var p = clamp((state.vh * 0.8 - r.top) / (state.vh * 0.8));
      sec.style.setProperty('--p', easeInOut(p).toFixed(4));
    });
  }

  /* =========================================================
     7. LABORATORIO DE ACABADOS Y SIMULADOR DE TONO
     ========================================================= */
  function initLab() {
    var tabs = $$('.lab__tab');
    var panels = $$('.lab__panel');
    var fotos = $$('.lab__foto');
    var lab = $('#lab');
    if (!tabs.length || !lab) { return; }
    var cur = 0, auto = null, tocado = false, enVista = false;

    function elegir(i, usuario) {
      if (i === cur && !usuario) { return; }
      var prev = fotos[cur];
      tabs.forEach(function (tb, k) { var on = k === i; tb.setAttribute('aria-selected', String(on)); tb.tabIndex = on ? 0 : -1; });
      panels.forEach(function (p, k) { p.hidden = k !== i; });
      if (fotos[cur] !== fotos[i]) {
        fotos.forEach(function (f) { f.classList.remove('is-prev'); });
        prev.classList.remove('is-on'); prev.classList.add('is-prev');
        fotos[i].classList.add('is-on');
        setTimeout(function () { prev.classList.remove('is-prev'); }, 980);
      }
      cur = i;
    }
    function detener() { tocado = true; if (auto) { clearInterval(auto); auto = null; } }

    tabs.forEach(function (tb, i) {
      tb.addEventListener('click', function () { detener(); elegir(i, true); });
      tb.addEventListener('keydown', function (e) {
        var d = 0;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { d = 1; }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { d = -1; }
        if (!d) { return; }
        e.preventDefault(); detener();
        var j = (i + d + tabs.length) % tabs.length;
        tabs[j].focus(); elegir(j, true);
      });
    });
    if (!reduceMotion && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        enVista = en[0].isIntersecting;
        if (enVista && !tocado && !auto) { auto = setInterval(function () { elegir((cur + 1) % tabs.length, false); }, 6200); }
        if (!enVista && auto) { clearInterval(auto); auto = null; }
      }, { threshold: 0.35 }).observe(lab);
    }
  }

  function initTone() {
    var escena = $('.tono__escena');
    var muestras = $$('.muestra');
    if (!escena || !muestras.length) { return; }
    var nombre = $('#tonoNombre'), codigo = $('#tonoCodigo');
    var activa = muestras.filter(function (m) { return m.classList.contains('is-on'); })[0] || muestras[0];
    escena.style.setProperty('--tono', activa.getAttribute('data-c'));
    muestras.forEach(function (m) {
      m.addEventListener('click', function () {
        muestras.forEach(function (x) { x.classList.remove('is-on'); x.setAttribute('aria-checked', 'false'); });
        m.classList.add('is-on'); m.setAttribute('aria-checked', 'true');
        escena.style.setProperty('--tono', m.getAttribute('data-c'));
        if (nombre) { nombre.textContent = m.getAttribute('data-n'); }
        if (codigo) { codigo.textContent = m.getAttribute('data-k'); }
      });
    });
  }

  /* =========================================================
     8. GALERÍA HORIZONTAL (deriva automática, arrastre y flechas)
     ========================================================= */
  function initHScroll() {
    var win = $('.hscroll__ventana');
    var sec = $('#metalizados');
    var barra = $('#barraH');
    var prev = $('#hPrev'), next = $('#hNext');
    if (!win || !sec) { return; }
    var pausado = false, reanuda = 0, arrastrando = false, enVista = false, dir = 1, acc = 0, ult = 0;
    var auto = finePointer && !reduceMotion;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { enVista = en[0].isIntersecting; }, { threshold: 0.2 }).observe(sec);
    }
    function paso() { var c = $('.hcard', win); return c ? c.offsetWidth + 20 : 300; }
    function empujar(d) { reanuda = performance.now() + 5000; win.scrollBy({ left: d * paso() * 1.5, behavior: reduceMotion ? 'auto' : 'smooth' }); }
    if (prev) { prev.addEventListener('click', function () { empujar(-1); }); }
    if (next) { next.addEventListener('click', function () { empujar(1); }); }

    if (finePointer) {
      var x0 = 0, l0 = 0, movido = 0;
      win.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse' || e.button !== 0) { return; }
        arrastrando = true; x0 = e.clientX; l0 = win.scrollLeft; movido = 0;
        win.classList.add('is-arrastre');
        try { win.setPointerCapture(e.pointerId); } catch (err) { /* sin captura */ }
      });
      win.addEventListener('pointermove', function (e) {
        if (!arrastrando) { return; }
        movido = e.clientX - x0;
        win.scrollLeft = l0 - movido;
      });
      var soltar = function () { if (!arrastrando) { return; } arrastrando = false; reanuda = performance.now() + 4000; win.classList.remove('is-arrastre'); };
      win.addEventListener('pointerup', soltar);
      win.addEventListener('pointercancel', soltar);
      win.addEventListener('pointerenter', function () { pausado = true; });
      win.addEventListener('pointerleave', function () { pausado = false; });
    }

    tickers.push(function (now) {
      var max = win.scrollWidth - win.clientWidth;
      if (barra) { barra.style.setProperty('--p', max > 0 ? (win.scrollLeft / max).toFixed(4) : '0.1'); }
      var dt = ult ? Math.min(60, now - ult) : 16;
      ult = now;
      if (!auto || !enVista || arrastrando || pausado || now < reanuda || document.hidden) { return; }
      acc += dt * 0.045;
      if (acc >= 1) {
        var n = Math.floor(acc); acc -= n;
        win.scrollLeft += n * dir;
        if (win.scrollLeft >= max - 1) { dir = -1; } else if (win.scrollLeft <= 0) { dir = 1; }
      }
    });
  }

  /* =========================================================
     9. ANTES / DESPUÉS
     ========================================================= */
  function initCompare() {
    var box = $('#cmp');
    var rango = $('#cmpRango');
    var antes = $('#cmpAntes');
    var despues = $('#cmpDespues');
    if (!box || !rango || !antes || !despues) { return; }
    var PARES = [
      { antes: 'assets/img/preparacion-lijado.jpg', despues: 'assets/img/hojuela-brillo.jpg', altA: 'Antes: piso de concreto esmerilado y limpio, listo para recibir el acabado', altD: 'Después: piso con acabado de hojuela gris y brillo uniforme' },
      { antes: 'assets/img/base-amarilla.jpg', despues: 'assets/img/metalizado-cobre-1.jpg', altA: 'Antes: base amarilla de primer sobre piso de terrazo', altD: 'Después: acabado metalizado color cobre con brillo espejo' }
    ];
    var movio = false, demo = false;

    function poner(v) { box.style.setProperty('--pos', v.toFixed(2) + '%'); rango.value = String(Math.round(v)); }
    rango.addEventListener('input', function () { movio = true; box.style.setProperty('--pos', rango.value + '%'); });
    rango.addEventListener('pointerdown', function () { movio = true; });

    $$('[data-par]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var par = PARES[Number(btn.getAttribute('data-par'))];
        if (!par) { return; }
        $$('[data-par]').forEach(function (b) { var on = b === btn; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
        antes.src = par.antes; antes.alt = par.altA;
        despues.src = par.despues; despues.alt = par.altD;
        movio = true; poner(50);
      });
    });

    if (reduceMotion || !('IntersectionObserver' in window)) { return; }
    new IntersectionObserver(function (en, io) {
      if (!en[0].isIntersecting || demo) { return; }
      demo = true; io.disconnect();
      var t0 = performance.now();
      (function f(now) {
        if (movio) { return; }
        var k = clamp((now - t0) / 2800);
        poner(50 + 30 * Math.sin(k * Math.PI * 2) * (1 - k * 0.35));
        if (k < 1) { requestAnimationFrame(f); } else { poner(50); }
      })(t0);
    }, { threshold: 0.5 }).observe(box);
  }

  /* =========================================================
     10. PROCESO Y VIDEO DE OBRA
     ========================================================= */
  function initProceso() {
    var lista = $('#pasos');
    if (lista) {
      var pasos = $$('.paso', lista);
      var medir = function () {
        var ultimo = pasos[pasos.length - 1];
        if (ultimo) { lista.style.setProperty('--fin', (ultimo.offsetTop + 24) + 'px'); }
      };
      medir(); resizers.push(medir); window.addEventListener('load', medir);
      scrollModules.push(function () {
        if (!pasos.length) { return; }
        var linea = state.vh * 0.55;
        var a = pasos[0].getBoundingClientRect().top + 24;
        var b = pasos[pasos.length - 1].getBoundingClientRect().top + 24;
        var total = b - a;
        lista.style.setProperty('--prog', (total > 0 ? clamp((linea - a) / total) : 0).toFixed(4));
        pasos.forEach(function (p) { p.classList.toggle('is-activo', p.getBoundingClientRect().top + 24 < linea); });
      });
    }

    var video = $('#reel');
    var cambio = $('#reelCambio');
    if (!video) { return; }
    var fuentes = ['assets/video/proceso-1.mp4', 'assets/video/proceso-2.mp4'];
    var vi = 0, cargado = false;
    function cargar() {
      var s = $('source', video);
      if (!s) { return; }
      s.src = fuentes[vi];
      video.load();
      cargado = true;
    }
    function reproducir() { if (reduceMotion) { return; } var p = video.play(); if (p && p.catch) { p.catch(function () { /* el navegador pidió interacción */ }); } }
    if (reduceMotion) { video.controls = true; }
    if (cambio) {
      cambio.addEventListener('click', function () { vi = (vi + 1) % fuentes.length; cargar(); reproducir(); });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { if (!cargado) { cargar(); } reproducir(); } else { video.pause(); }
      }, { threshold: 0.35 }).observe(video);
    } else { cargar(); }
  }

  /* =========================================================
     11. LLUVIA SOBRE UN ESCUDO (impermeabilización)
     ========================================================= */
  function initRain() {
    var canvas = $('#lluvia');
    if (!canvas || !canvas.getContext) { return; }
    var sec = canvas.parentElement;
    var ctx = canvas.getContext('2d');
    var w = 0, h = 0, dpr = 1, gotas = [], chispas = [], ondas = [], visible = false, t = 0;

    function escudoY(x) {
      var u = (x / w) * 2 - 1;
      return Math.min(h * 0.12, 220) + u * u * Math.min(h * 0.09, 150);
    }
    function nuevaGota(g, inicio) {
      g.x = rnd(-40, w + 40); g.y = inicio ? rnd(-h * 0.3, escudoY(g.x)) : -rnd(10, 220);
      g.v = rnd(9, 16); g.l = rnd(14, 30); g.a = rnd(0.18, 0.5);
      return g;
    }
    function size() {
      var r = sec.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = clamp(Math.round(w / 9), 40, 150);
      gotas = [];
      for (var i = 0; i < n; i++) { gotas.push(nuevaGota({}, true)); }
    }
    function dibujar(mover) {
      ctx.clearRect(0, 0, w, h);
      var i, g;
      ctx.lineCap = 'round'; ctx.lineWidth = 1.2;
      for (i = 0; i < gotas.length; i++) {
        g = gotas[i];
        ctx.strokeStyle = 'rgba(160,215,255,' + g.a.toFixed(2) + ')';
        ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(g.x - g.l * 0.12, g.y - g.l); ctx.stroke();
        if (mover) {
          g.y += g.v; g.x -= g.v * 0.12;
          var ey = escudoY(g.x);
          if (g.y >= ey) {
            for (var k = 0; k < 3; k++) { chispas.push({ x: g.x, y: ey, vx: rnd(-2.2, 2.2), vy: rnd(-3.4, -1.2), l: 24 }); }
            if (ondas.length < 26) { ondas.push({ x: g.x, y: ey, r: 2, a: 0.5 }); }
            nuevaGota(g, false);
          }
        }
      }
      // escudo
      ctx.beginPath();
      for (var x = 0; x <= w + 12; x += 12) { if (x === 0) { ctx.moveTo(x, escudoY(x)); } else { ctx.lineTo(x, escudoY(x)); } }
      ctx.strokeStyle = 'rgba(76,195,255,0.38)'; ctx.lineWidth = 2; ctx.shadowColor = 'rgba(76,195,255,0.8)'; ctx.shadowBlur = 14; ctx.stroke();
      ctx.shadowBlur = 0;
      var cx = ((t * 0.12) % 1) * (w + 160) - 80;
      ctx.beginPath();
      for (var q = -50; q <= 50; q += 10) { var px = cx + q; if (q === -50) { ctx.moveTo(px, escudoY(px)); } else { ctx.lineTo(px, escudoY(px)); } }
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2.4; ctx.stroke();
      // chispas y ondas
      for (i = chispas.length - 1; i >= 0; i--) {
        var c = chispas[i];
        ctx.fillStyle = 'rgba(190,230,255,' + (c.l / 24 * 0.8).toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(c.x, c.y, 1.4, 0, Math.PI * 2); ctx.fill();
        if (mover) { c.x += c.vx; c.y += c.vy; c.vy += 0.2; c.l--; if (c.l <= 0) { chispas.splice(i, 1); } }
      }
      for (i = ondas.length - 1; i >= 0; i--) {
        var o = ondas[i];
        ctx.strokeStyle = 'rgba(140,201,250,' + o.a.toFixed(2) + ')'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(o.x, o.y, o.r * 2.2, o.r * 0.6, 0, 0, Math.PI * 2); ctx.stroke();
        if (mover) { o.r += 0.7; o.a -= 0.018; if (o.a <= 0) { ondas.splice(i, 1); } }
      }
      if (mover) { t += 0.016; }
    }
    size(); dibujar(false);
    if ('ResizeObserver' in window) {
      var ult = 0;
      new ResizeObserver(function () {
        clearTimeout(ult);
        ult = setTimeout(function () { var r = sec.getBoundingClientRect(); if (Math.abs(r.width - w) > 2 || Math.abs(r.height - h) > 40) { size(); } }, 200);
      }).observe(sec);
    }
    if (reduceMotion) { return; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0 }).observe(sec);
    }
    tickers.push(function () { if (visible && !document.hidden) { dibujar(true); } });
  }

  /* =========================================================
     12. PARALLAX, INCLINACIÓN 3D, BOTONES MAGNÉTICOS Y LUZ DEL CURSOR
     ========================================================= */
  function initParallax() {
    var imgs = $$('[data-parallax]');
    if (!imgs.length || reduceMotion) { return; }
    scrollModules.push(function () {
      imgs.forEach(function (img) {
        var r = img.parentElement.getBoundingClientRect();
        if (r.bottom < -120 || r.top > state.vh + 120) { return; }
        var c = r.top + r.height / 2 - state.vh / 2;
        var max = r.height * 0.05;
        var y = clamp(-c * Number(img.getAttribute('data-parallax')), -max, max);
        img.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
      });
    });
  }

  function initTilt() {
    if (!finePointer || reduceMotion) { return; }
    $$('[data-tilt]').forEach(function (el) {
      var raf = 0;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        if (raf) { cancelAnimationFrame(raf); }
        raf = requestAnimationFrame(function () {
          el.style.transition = 'transform .12s ease-out, box-shadow .5s';
          el.style.transform = 'perspective(900px) rotateX(' + ((0.5 - py) * 7).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * 9).toFixed(2) + 'deg)';
          el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
          el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
        });
      });
      el.addEventListener('pointerleave', function () {
        if (raf) { cancelAnimationFrame(raf); }
        el.style.transition = '';
        el.style.transform = '';
      });
    });
  }

  function initMagnetic() {
    if (!finePointer || reduceMotion) { return; }
    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + (dx * 0.18).toFixed(1) + 'px,' + (dy * 0.28).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  function initSpot() {
    if (!finePointer) { return; }
    $$('[data-spot]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
      }, { passive: true });
    });
  }

  /* =========================================================
     13. GALERÍA CON FILTROS Y VISOR
     ========================================================= */
  function initGallery() {
    var lista = $('#galeria');
    if (!lista) { return; }
    var items = $$('.gitem', lista);
    var chips = $$('[data-f]');
    var visor = $('#visor'), vImg = $('#visorImg'), vPie = $('#visorPie');
    var bCerrar = $('#visorCerrar'), bPrev = $('#visorPrev'), bNext = $('#visorNext');
    var idx = 0, vis = [], previo = null;

    function visibles() { return items.filter(function (i) { return !i.classList.contains('is-off'); }); }

    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        chips.forEach(function (x) { var on = x === c; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', String(on)); });
        var f = c.getAttribute('data-f'), mostrados = [];
        items.forEach(function (it) {
          var ok = f === 'todos' || it.getAttribute('data-cat') === f;
          it.classList.toggle('is-off', !ok);
          if (ok) { it.classList.add('is-in'); mostrados.push(it); }
        });
        var A = anim();
        if (A && !reduceMotion) {
          A({ targets: mostrados, opacity: [0, 1], translateY: [34, 0], scale: [0.94, 1], delay: A.stagger(45), duration: 800, easing: 'easeOutExpo' });
        }
      });
    });

    if (!visor || !vImg) { return; }
    function mostrar() {
      var it = vis[idx];
      if (!it) { return; }
      var img = $('img', it);
      vImg.src = img.currentSrc || img.src;
      vImg.alt = img.alt;
      if (vPie) { vPie.textContent = img.alt + '  (' + (idx + 1) + ' de ' + vis.length + ')'; }
      var sig = vis[(idx + 1) % vis.length]; if (sig) { var pre = new Image(); pre.src = $('img', sig).src; }
    }
    function abrir(i) {
      vis = visibles(); idx = Math.max(0, i); previo = document.activeElement;
      mostrar();
      visor.hidden = false;
      html.classList.add('is-locked');
      requestAnimationFrame(function () { requestAnimationFrame(function () { visor.classList.add('is-open'); }); });
      if (bCerrar) { bCerrar.focus(); }
    }
    function cerrar() {
      visor.classList.remove('is-open');
      setTimeout(function () { visor.hidden = true; html.classList.remove('is-locked'); }, 380);
      if (previo && previo.focus) { previo.focus(); }
    }
    function mover(d) { idx = (idx + d + vis.length) % vis.length; mostrar(); }

    lista.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.gitem__btn') : null;
      if (!b) { return; }
      var li = b.closest('.gitem');
      var v = visibles();
      abrir(v.indexOf(li));
    });
    if (bCerrar) { bCerrar.addEventListener('click', cerrar); }
    if (bPrev) { bPrev.addEventListener('click', function () { mover(-1); }); }
    if (bNext) { bNext.addEventListener('click', function () { mover(1); }); }
    visor.addEventListener('click', function (e) { if (e.target === visor) { cerrar(); } });
    document.addEventListener('keydown', function (e) {
      if (visor.hidden) { return; }
      if (e.key === 'Escape') { cerrar(); }
      else if (e.key === 'ArrowLeft') { mover(-1); }
      else if (e.key === 'ArrowRight') { mover(1); }
      else if (e.key === 'Tab') {
        var foco = [bCerrar, bPrev, bNext].filter(Boolean);
        var i = foco.indexOf(document.activeElement);
        e.preventDefault();
        foco[(i + (e.shiftKey ? -1 : 1) + foco.length) % foco.length].focus();
      }
    });
    var x0 = null;
    visor.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    visor.addEventListener('pointerup', function (e) {
      if (x0 === null) { return; }
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 60) { mover(dx < 0 ? 1 : -1); }
    });
  }

  /* =========================================================
     14. WHATSAPP: ENLACES, FORMULARIO Y BOTÓN FLOTANTE
     ========================================================= */
  function initWhatsApp() {
    var hay = Boolean(WHATSAPP_NUMBER);
    var flotante = $('#waFlotante');
    var form = $('#formContacto');
    var aviso = $('#formAviso');
    var enviar = $('#formEnviar');
    var selServicio = $('#f-servicio');

    function url(msg) { return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg); }
    function preseleccionar(servicio) {
      if (!selServicio) { return; }
      for (var i = 0; i < selServicio.options.length; i++) {
        if (selServicio.options[i].text === servicio) { selServicio.selectedIndex = i; break; }
      }
      setTimeout(function () { var n = $('#f-nombre'); if (n) { n.focus({ preventScroll: true }); } }, 900);
    }

    $$('[data-wa]').forEach(function (a) {
      if (a === flotante) { return; }
      var servicio = a.getAttribute('data-servicio');
      if (!hay) { a.setAttribute('href', '#contacto'); return; }
      if (servicio) {
        a.setAttribute('href', '#contacto');
        a.addEventListener('click', function () { preseleccionar(servicio); });
        return;
      }
      a.setAttribute('href', url(a.getAttribute('data-wa')));
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    });

    if (flotante) {
      if (!hay) { flotante.hidden = true; }
      else {
        flotante.setAttribute('href', url(flotante.getAttribute('data-wa')));
        flotante.setAttribute('target', '_blank');
        flotante.setAttribute('rel', 'noopener');
        setTimeout(function () { flotante.classList.add('is-visible'); }, 3000);
        setTimeout(function () { flotante.classList.add('is-aviso'); }, 6500);
        setTimeout(function () { flotante.classList.remove('is-aviso'); }, 12500);
        flotante.addEventListener('mouseenter', function () { flotante.classList.add('is-aviso'); });
        flotante.addEventListener('mouseleave', function () { flotante.classList.remove('is-aviso'); });
        scrollModules.push(function (y) { if (y > 240) { flotante.classList.add('is-visible'); } });
      }
    }

    if (!form) { return; }
    if (!hay) {
      if (enviar) { enviar.hidden = true; }
      if (aviso) { aviso.textContent = 'Por ahora escríbenos al correo o llámanos: te respondemos a toda hora.'; }
      return;
    }
    function error(campo, msg) {
      var cont = campo.closest('.campo');
      if (!cont) { return; }
      cont.classList.toggle('tiene-error', Boolean(msg));
      var e = $('.campo__error', cont);
      if (e) { e.textContent = msg || ''; }
      campo.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var nombre = $('#f-nombre'), servicio = $('#f-servicio'), espacio = $('#f-espacio'), medida = $('#f-medida'), mensaje = $('#f-mensaje');
      var ok = true;
      if (nombre.value.trim().length < 2) { error(nombre, 'Escribe tu nombre para saber con quién hablamos.'); ok = false; } else { error(nombre, ''); }
      if (!servicio.value) { error(servicio, 'Elige el servicio que te interesa.'); ok = false; } else { error(servicio, ''); }
      if (!ok) { (form.querySelector('[aria-invalid="true"]') || nombre).focus(); return; }
      var lineas = ['Hola, soy ' + nombre.value.trim() + '. Vi su página web y quiero una cotización.', '', '• Servicio: ' + servicio.value];
      if (espacio.value) { lineas.push('• Tipo de espacio: ' + espacio.value); }
      if (medida.value.trim()) { lineas.push('• Medida aproximada: ' + medida.value.trim()); }
      if (mensaje.value.trim()) { lineas.push('• Comentarios: ' + mensaje.value.trim()); }
      var destino = url(lineas.join('\n'));
      if (aviso) { aviso.textContent = '¡Listo! Abriendo WhatsApp con tu mensaje…'; aviso.classList.add('ok'); }
      var ventana = window.open(destino, '_blank', 'noopener');
      if (!ventana) { window.location.href = destino; }
    });
    $$('input, select', form).forEach(function (c) { c.addEventListener('input', function () { if (c.value) { error(c, ''); } }); });
  }

  /* =========================================================
     BUCLE PRINCIPAL
     ========================================================= */
  function iniciar() {
    var ultY = -1, forzar = true;
    window.addEventListener('scroll', function () { forzar = true; }, { passive: true });
    window.addEventListener('resize', function () {
      state.vh = window.innerHeight; state.vw = window.innerWidth;
      resizers.forEach(function (f) { f(); });
      forzar = true;
    });
    window.addEventListener('load', function () { forzar = true; });
    function bucle(ahora) {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      state.y = y;
      if (forzar || y !== ultY) {
        ultY = y; forzar = false;
        for (var i = 0; i < scrollModules.length; i++) { scrollModules[i](y, ahora); }
      }
      for (var j = 0; j < tickers.length; j++) { tickers[j](ahora); }
      requestAnimationFrame(bucle);
    }
    requestAnimationFrame(bucle);
  }

  function arrancar() {
    var modulos = [initLoader, initNav, initReveal, initFlow, initHeroMotion, initWords, initCounters, initStack, initEscena, initLab, initTone, initHScroll, initCompare, initProceso, initRain, initParallax, initTilt, initMagnetic, initSpot, initGallery, initWhatsApp];
    modulos.forEach(function (m) {
      try { m(); } catch (err) { if (window.console && console.warn) { console.warn('Módulo con aviso:', m.name, err); } }
    });
    iniciar();
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', arrancar); } else { arrancar(); }
})();
