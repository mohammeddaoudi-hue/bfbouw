// Bega Fortuna Bouw: slider, menu, filter, delen, offerteformulier.
(function () {
  'use strict';
  var d = document;

  // ---- kop over de hero: wit zodra er gescrold is (zoals INzicht) ----
  var kop = d.querySelector('.kop--over');
  if (kop) { var schakel = function () { kop.classList.toggle('is-gescrold', window.scrollY > 24); }; schakel(); window.addEventListener('scroll', schakel, { passive: true }); }

  // ---- hero: projectfoto's lopen automatisch door (overvloeien om de 6 s) ----
  var heroBox = d.querySelector('[data-hero]');
  if (heroBox && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) && !/[?&]shoot=1/.test(location.search)) {
    var slides = heroBox.querySelectorAll('.hero__beeld'), hi = 0;
    if (slides.length > 1) setInterval(function () {
      if (d.hidden) return;
      slides[hi].classList.remove('is-on'); hi = (hi + 1) % slides.length; slides[hi].classList.add('is-on');
    }, 6000);
  }

  // ---- menu op gsm ----
  var burger = d.querySelector('.nav__burger');
  if (burger) burger.addEventListener('click', function () {
    var open = d.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
  });

  // ---- reviews: één citaat zichtbaar, pijlen, vegen of pijltoetsen (zoals Aritherm) ----
  [].forEach.call(d.querySelectorAll('[data-reviews]'), function (box) {
    var quotes = [].slice.call(box.querySelectorAll('.quote')), i = 0; if (quotes.length < 2) return;
    function toon(k) { i = (k + quotes.length) % quotes.length; quotes.forEach(function (q, n) { q.classList.toggle('is-on', n === i); }); }
    var vorige = box.querySelector('[data-rev-prev]'), volgende = box.querySelector('[data-rev-next]');
    if (vorige) vorige.addEventListener('click', function () { toon(i - 1); });
    if (volgende) volgende.addEventListener('click', function () { toon(i + 1); });
    var x0 = null, y0 = null;
    box.addEventListener('pointerdown', function (e) { if (e.target.closest('button')) return; x0 = e.clientX; y0 = e.clientY; }, { passive: true });
    box.addEventListener('pointerup', function (e) { if (x0 === null) return; var dx = e.clientX - x0, dy = e.clientY - y0; x0 = null; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) toon(dx < 0 ? i + 1 : i - 1); });
    box.addEventListener('pointercancel', function () { x0 = null; });
    box.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') toon(i + 1); if (e.key === 'ArrowLeft') toon(i - 1); });
  });

  // ---- filter realisaties ----
  [].forEach.call(d.querySelectorAll('.tabs'), function (groep) {
    groep.addEventListener('click', function (e) {
      var knop = e.target.closest('.tab'); if (!knop) return;
      [].forEach.call(groep.querySelectorAll('.tab'), function (t) { var a = t === knop; t.classList.toggle('is-actief', a); t.setAttribute('aria-pressed', a ? 'true' : 'false'); });
      var f = knop.getAttribute('data-filter'), sectie = groep.closest('section');
      if (sectie) [].forEach.call(sectie.querySelectorAll('.tegel[data-groep]'), function (tg) { tg.classList.toggle('is-gedimd', f !== 'alle' && tg.getAttribute('data-groep') !== f); });
    });
  });

  // ---- delen (teamkaarten) ----
  [].forEach.call(d.querySelectorAll('.js-deel'), function (knop) {
    knop.addEventListener('click', function () {
      var url = location.href.split('#')[0];
      if (navigator.share) { navigator.share({ title: d.title, url: url }).catch(function () {}); return; }
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { knop.setAttribute('aria-label', 'Link gekopieerd'); });
    });
  });

  // ---- keuzelijst kleurt donker zodra er een keuze is ----
  [].forEach.call(d.querySelectorAll('select.veld'), function (s) {
    s.addEventListener('change', function () { s.classList.toggle('is-gekozen', !!s.value); });
  });

  // ---- offerteformulier ----
  // Zonder koppeling (geen data-form-endpoint op <html>) maakt het formulier een ingevulde e-mail aan info@bfbouw.be.
  // Tests zetten window.__bfOpenMail zodat er nooit een mailprogramma opent op de pc.
  var MAIL = 'info@bfbouw.be';
  function openMail(href) { if (typeof window.__bfOpenMail === 'function') { window.__bfOpenMail(href); return; } window.location.href = href; }
  [].forEach.call(d.querySelectorAll('.js-offerte'), function (form) {
    var melding = form.querySelector('.formulier-melding');
    function meld(t) { melding.textContent = t; melding.hidden = false; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fout = null;
      [].forEach.call(form.querySelectorAll('input, select, textarea'), function (v) { v.removeAttribute('aria-invalid'); });
      var vn = form.elements.naam, te = form.elements.telefoon, em = form.elements.email, di = form.elements.dienst;
      if (!vn.value.trim()) fout = fout || vn;
      if (!/^[+0-9 ()./-]{8,}$/.test(te.value.trim())) fout = fout || te;
      if (em.value.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value.trim())) fout = fout || em;
      if (!di.value) fout = fout || di;
      if (fout) {
        fout.setAttribute('aria-invalid', 'true'); fout.focus();
        meld(fout === te ? 'Vul een telefoonnummer in waarop wij u kunnen bellen.' : fout === em ? 'Dit e-mailadres klopt niet.' : fout === di ? 'Kies om welk werk het gaat.' : 'Vul uw naam in.');
        return;
      }
      var data = { naam: vn.value.trim(), postcode: form.elements.postcode.value.trim(), project: form.elements.project.value.trim(), email: em.value.trim(), telefoon: te.value.trim(), dienst: di.value, pagina: location.pathname };
      var eindpunt = d.documentElement.getAttribute('data-form-endpoint');
      if (eindpunt) {
        meld('Bezig met versturen…');
        fetch(eindpunt, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
          .then(function (r) { if (!r.ok) throw new Error(r.status); form.reset(); meld('Bedankt. Wij bellen u terug om een bezoek in te plannen.'); })
          .catch(function () { meld('Versturen lukte niet. Bel ons op 0492 48 13 83 of mail naar ' + MAIL + '.'); });
        return;
      }
      var body = (form.getAttribute('data-soort') || 'Offerteaanvraag') + ' via bfbouw.be\n\nNaam: ' + data.naam + '\nTelefoon: ' + data.telefoon + '\nE-mail: ' + data.email + '\nWerk: ' + data.dienst + '\nPostcode: ' + data.postcode + '\nProject: ' + data.project + '\n';
      var href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent((form.getAttribute('data-soort') || 'Offerteaanvraag') + ' ' + data.dienst + ' - ' + data.naam) + '&body=' + encodeURIComponent(body);
      openMail(href);
      meld('Uw e-mailprogramma opent met uw aanvraag. Verstuur die e-mail om de aanvraag af te ronden, of bel ons op 0492 48 13 83.');
    });
  });
})();

/* Doorlopende realisatieslider (zoals Aritherm): loopt vanzelf, pauzeert bij aanwijzen, sleepbaar, pijlen en pijltoetsen */
(function () {
  'use strict';
  var stil = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var shoot = /[?&]shoot=1/.test(location.search);
  Array.prototype.slice.call(document.querySelectorAll('[data-slider]')).forEach(function (box) {
    var baan = box.querySelector('.rslider__baan'); if (!baan) return;
    var x = 0, half = 0, laatste = 0, bezig = false, sleep = null, snelheid = 28, pauze = false, hervat = 0, tween = null;
    function gap() { return parseFloat(getComputedStyle(baan).columnGap || getComputedStyle(baan).gap) || 0; }
    function meet() { var items = baan.children, n = items.length / 2; if (n < 1) return; half = items[n].getBoundingClientRect().left - items[0].getBoundingClientRect().left; }
    function zet() { if (half > 0) { while (x <= -half) x += half; while (x > 0) x -= half; } baan.style.transform = 'translate3d(' + x + 'px,0,0)'; }
    function stap(t) { if (!laatste) laatste = t; var dt = Math.min(64, t - laatste); laatste = t; if (!pauze && !bezig && !tween && t > hervat && !document.hidden) { x -= snelheid * dt / 1000; zet(); } requestAnimationFrame(stap); }
    meet(); zet();
    window.addEventListener('resize', function () { meet(); zet(); });
    Array.prototype.forEach.call(baan.querySelectorAll('img'), function (im) { im.addEventListener('load', function () { meet(); zet(); }); });
    box.addEventListener('mouseenter', function () { pauze = true; });
    box.addEventListener('mouseleave', function () { pauze = false; });
    box.addEventListener('pointerdown', function (e) { if (e.target.closest('.rslider__pijlen')) return; bezig = true; sleep = { x0: e.clientX, start: x, bewogen: false }; if (box.setPointerCapture) box.setPointerCapture(e.pointerId); });
    box.addEventListener('pointermove', function (e) { if (!bezig || !sleep) return; var dx = e.clientX - sleep.x0; if (Math.abs(dx) > 4) sleep.bewogen = true; x = sleep.start + dx; zet(); });
    function los() { if (!bezig) return; bezig = false; hervat = performance.now() + 1200; if (sleep && sleep.bewogen) { var stop = function (ev) { ev.preventDefault(); ev.stopPropagation(); box.removeEventListener('click', stop, true); }; box.addEventListener('click', stop, true); setTimeout(function () { box.removeEventListener('click', stop, true); }, 50); } sleep = null; }
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { box.addEventListener(t, los); });
    function schuif(richting) { var it = baan.children[0]; if (!it) return; var stapje = it.getBoundingClientRect().width + gap(); var van = x, naar = x - richting * stapje, t0 = performance.now(); hervat = t0 + 2000; if (tween) cancelAnimationFrame(tween); (function loop(t) { var p = Math.min(1, (t - t0) / 420); var e = 1 - Math.pow(1 - p, 3); x = van + (naar - van) * e; zet(); if (p < 1) tween = requestAnimationFrame(loop); else tween = null; })(t0); }
    var vorige = box.querySelector('[data-slider-prev]'), volgende = box.querySelector('[data-slider-next]');
    if (vorige) vorige.addEventListener('click', function () { schuif(-1); });
    if (volgende) volgende.addEventListener('click', function () { schuif(1); });
    box.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') schuif(1); if (e.key === 'ArrowLeft') schuif(-1); });
    if (!stil && !shoot) requestAnimationFrame(stap);
  });
})();

/* Scrolleffecten (clean): koppen en kaarten schuiven 16 px omhoog, streepjes tekenen zich, hero-foto's met lichte parallax. Geen vervagen, geen zoom. */
(function () {
  'use strict';
  var stil = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (stil || navigator.webdriver || !('IntersectionObserver' in window)) return;
  var d = document; d.documentElement.classList.add('anim');
  var groepen = [['.h2', ''], ['.streep', 'rv--streep'], ['.wkaart', ''], ['.pstap', ''], ['.inspectie__blok', ''], ['.post', '']];
  var io = new IntersectionObserver(function (items) {
    items.forEach(function (it) { if (it.isIntersecting) { it.target.classList.add('is-in'); io.unobserve(it.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  groepen.forEach(function (g) {
    var els = d.querySelectorAll(g[0]);
    Array.prototype.forEach.call(els, function (el) {
      if (el.classList.contains('rv')) return;
      el.classList.add('rv'); if (g[1]) el.classList.add(g[1]);
      // volgnummer binnen dezelfde ouder: kaarten komen na elkaar
      var i = 0, s = el.previousElementSibling; while (s) { if (s.classList.contains('rv')) i++; s = s.previousElementSibling; }
      el.style.setProperty('--i', Math.min(i, 5));
      io.observe(el);
    });
  });
  // hero: foto's schuiven trager mee dan de pagina
  var slides = d.querySelector('.hero__slides'), hero = d.querySelector('.hero'), tik = false;
  if (slides && hero) window.addEventListener('scroll', function () {
    if (tik) return; tik = true;
    requestAnimationFrame(function () { var y = window.scrollY; if (y < hero.offsetHeight) slides.style.transform = 'translate3d(0,' + (y * 0.28).toFixed(1) + 'px,0)'; tik = false; });
  }, { passive: true });
})();

/* Diensten: de foto wisselt mee met de rij onder de muis of het toetsenbord; offerteblok: inspectieknop kiest de optie in het formulier */
(function () {
  'use strict';
  var d = document;
  Array.prototype.forEach.call(d.querySelectorAll('[data-dlijst]'), function (box) {
    var fotos = box.querySelectorAll('.dlijst__foto'), rijen = box.querySelectorAll('.drij');
    function zet(i) { Array.prototype.forEach.call(rijen, function (r, k) { r.classList.toggle('is-on', k === i); }); Array.prototype.forEach.call(fotos, function (f, k) { f.classList.toggle('is-on', k === i); }); }
    Array.prototype.forEach.call(rijen, function (r) { var i = +r.getAttribute('data-i'); r.addEventListener('mouseenter', function () { zet(i); }); r.addEventListener('focus', function () { zet(i); }); });
  });
  // formulierkaart: wisselen tussen offerte en gratis inspectie
  function wissel(soort, focus) {
    Array.prototype.forEach.call(d.querySelectorAll('[data-fwissel]'), function (box) {
      Array.prototype.forEach.call(box.querySelectorAll('[data-wissel]'), function (t) { var aan = t.getAttribute('data-wissel') === soort; t.classList.toggle('is-actief', aan); t.setAttribute('aria-selected', aan ? 'true' : 'false'); });
      Array.prototype.forEach.call(box.querySelectorAll('[data-paneel]'), function (p) { var aan = p.getAttribute('data-paneel') === soort; p.hidden = !aan; p.classList.toggle('is-on', aan); });
    });
    var pill = d.querySelector('.plaats__inspectie'); if (pill) pill.hidden = soort === 'inspectie';
    // geen focus op een veld: op gsm zou het toetsenbord meteen openspringen (Mohammed 9 okt); alleen naar de formulierkaart scrollen
    if (focus) { var kaart = d.querySelector('.plaats__formkern'), kop = d.querySelector('.kop'); if (kaart) { var hoog = kop ? kop.getBoundingClientRect().height : 0; window.scrollTo({ top: kaart.getBoundingClientRect().top + window.scrollY - hoog - 12, behavior: 'smooth' }); } }
  }
  Array.prototype.forEach.call(d.querySelectorAll('[data-wissel]'), function (t) { t.addEventListener('click', function () { wissel(t.getAttribute('data-wissel'), false); }); });
  Array.prototype.forEach.call(d.querySelectorAll('[data-kies]'), function (knop) { knop.addEventListener('click', function () { wissel('inspectie', true); }); });
})();

/* Dienstkaarten: start in het midden (kaarten aan beide kanten), pijlen, pijltoetsen, vegen en muis slepen; puntjes volgen */
(function () {
  'use strict';
  Array.prototype.forEach.call(document.querySelectorAll('[data-dkaarten]'), function (box) {
    var baan = box.querySelector('.dkaarten__baan'), kaarten = baan.children, stippen = box.querySelectorAll('.dkaarten__stippen span'), nu = 0;
    function doel(i) { var k = kaarten[i], kb = k.getBoundingClientRect(), bb = baan.getBoundingClientRect(); return baan.scrollLeft + (kb.left + kb.width / 2) - (bb.left + bb.width / 2); }
    var vast = 0;
    function toon(i) { Array.prototype.forEach.call(stippen, function (s, k) { s.classList.toggle('is-actief', k === i); }); Array.prototype.forEach.call(kaarten, function (c, k) { c.classList.toggle('is-actief', k === i); }); }
    function naar(i, zacht) { i = Math.max(0, Math.min(kaarten.length - 1, i)); nu = i; toon(i); vast = zacht ? performance.now() + 700 : 0; baan.scrollTo({ left: doel(i), behavior: zacht ? 'smooth' : 'auto' }); }
    function actief() { if (performance.now() < vast) return; var bb = baan.getBoundingClientRect(), m = bb.left + bb.width / 2, af = 1e9; Array.prototype.forEach.call(kaarten, function (k, i) { var kb = k.getBoundingClientRect(), d = Math.abs(kb.left + kb.width / 2 - m); if (d < af) { af = d; nu = i; } }); toon(nu); }
    baan.addEventListener('scroll', function () { window.requestAnimationFrame(actief); }, { passive: true });
    var vorige = box.querySelector('[data-dk-prev]'), volgende = box.querySelector('[data-dk-next]');
    if (vorige) vorige.addEventListener('click', function () { naar(nu - 1, true); });
    if (volgende) volgende.addEventListener('click', function () { naar(nu + 1, true); });
    box.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); naar(nu + 1, true); } if (e.key === 'ArrowLeft') { e.preventDefault(); naar(nu - 1, true); } });
    var sleep = null;
    baan.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; sleep = { x: e.clientX, l: baan.scrollLeft, bewogen: false }; });
    window.addEventListener('pointermove', function (e) { if (!sleep) return; var dx = e.clientX - sleep.x; if (Math.abs(dx) > 4) { sleep.bewogen = true; baan.classList.add('is-slepen'); } baan.scrollLeft = sleep.l - dx; });
    window.addEventListener('pointerup', function () { if (!sleep) return; var was = sleep.bewogen; sleep = null; baan.classList.remove('is-slepen'); if (was) { var stop = function (ev) { ev.preventDefault(); ev.stopPropagation(); }; baan.addEventListener('click', stop, { capture: true, once: true }); setTimeout(function () { baan.removeEventListener('click', stop, { capture: true }); }, 50); actief(); naar(nu, true); } });
    // start in het midden: de middelste kaart gecentreerd, zodat links en rechts een kaart in beeld komt
    function start() { naar(Math.floor((kaarten.length - 1) / 2), false); actief(); }
    start(); window.addEventListener('load', start);
  });
})();

/* Reviewkaarten (over ons): lange reviews ingekort met "Meer weergeven", klapt open en dicht */
(function () {
  'use strict';
  Array.prototype.forEach.call(document.querySelectorAll('.rkaart'), function (k) {
    var t = k.querySelector('.rkaart__tekst'); if (!t || t.scrollHeight <= t.clientHeight + 2) return;
    k.classList.add('is-lang');
    var knop = document.createElement('button'); knop.type = 'button'; knop.className = 'rkaart__meer'; knop.textContent = 'Meer weergeven'; knop.setAttribute('aria-expanded', 'false');
    knop.addEventListener('click', function () { var open = k.classList.toggle('is-open'); knop.textContent = open ? 'Minder weergeven' : 'Meer weergeven'; knop.setAttribute('aria-expanded', open ? 'true' : 'false'); });
    k.appendChild(knop);
  });
})();

/* Cijferband: getallen tellen één keer rustig op wanneer de band in beeld komt (de echte waarde staat al in de HTML) */
(function () {
  'use strict';
  var stil = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els = document.querySelectorAll('[data-tel]');
  if (!els.length || stil || navigator.webdriver || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (items) {
    items.forEach(function (it) {
      if (!it.isIntersecting) return; io.unobserve(it.target);
      var el = it.target, doel = +el.getAttribute('data-tel'), na = el.getAttribute('data-na') || '', t0 = performance.now(), duur = 1400;
      (function stap(t) { var p = Math.min(1, (t - t0) / duur), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(doel * e) + na; if (p < 1) requestAnimationFrame(stap); })(t0);
    });
  }, { threshold: 0.6 });
  Array.prototype.forEach.call(els, function (el) { el.textContent = '0' + (el.getAttribute('data-na') || ''); io.observe(el); });
})();

/* gsm: puntjes onder de veegbare rijen (zekerheden, tips) en oplichtende werkwijzestap tijdens het scrollen */
(function () {
  'use strict';
  var d = document;
  Array.prototype.forEach.call(d.querySelectorAll('.waarom__veld, .blog__raster'), function (rij) {
    var kaarten = Array.prototype.filter.call(rij.children, function (k) { return k.matches('.wkaart, .post'); });
    if (kaarten.length < 2) return;
    var hint = d.createElement('div'); hint.className = 'veeghint'; hint.setAttribute('aria-hidden', 'true');
    kaarten.forEach(function (k, i) { var s = d.createElement('span'); if (!i) s.className = 'is-actief'; hint.appendChild(s); });
    rij.parentNode.insertBefore(hint, rij.nextSibling);
    rij.addEventListener('scroll', function () {
      var l = rij.getBoundingClientRect().left, best = 0, af = 1e9;
      kaarten.forEach(function (k, i) { var x = Math.abs(k.getBoundingClientRect().left - l - 16); if (x < af) { af = x; best = i; } });
      Array.prototype.forEach.call(hint.children, function (s, i) { s.classList.toggle('is-actief', i === best); });
    }, { passive: true });
  });
  var stappen = d.querySelectorAll('.pstap');
  if (stappen.length && 'IntersectionObserver' in window && window.matchMedia('(max-width: 1000px)').matches) {
    var io = new IntersectionObserver(function (items) { items.forEach(function (it) { it.target.classList.toggle('is-in-beeld', it.isIntersecting); }); }, { rootMargin: '-45% 0px -45% 0px' });
    Array.prototype.forEach.call(stappen, function (s) { io.observe(s); });
  }
})();

/* gsm: zwevende belknop rechtsonder zodra de hero voorbij is */
(function () {
  'use strict';
  var knop = document.querySelector('.belzweef'); if (!knop) return;
  function zet() { knop.classList.toggle('is-zichtbaar', window.scrollY > window.innerHeight * 0.6); }
  zet(); window.addEventListener('scroll', zet, { passive: true });
})();
