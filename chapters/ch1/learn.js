/* Chapter 1 learning deck: step animations and simulators. The slide engine is assets/deck.js.
   Step animations are declared in the HTML, so most slides need no code of their own:
     data-at="N"     appears at step N (N = 0 animates in when the slide opens)
       + class draw  a path that draws itself
       + class grow  a bar that grows from the left (data-shrink="M" trims it to 40% at step M)
     data-move="N" data-dx data-dy   slides by (dx, dy) at step N
     data-count="V"  counts up to V when the slide opens */
(() => {
const { $, $$, RM, D, clamp, num, usd, pressSeg } = SIEDeck;
const paren = n => '(' + num(Math.round(n)) + ')';

/* ---------- generic step animation ---------- */
function anim(s, step, instant) {
  let z = 0;
  $$('[data-at]', s).forEach(el => {
    const at = +el.dataset.at, on = step >= at;
    const delay = !instant && at === 0 && on ? D(.2 + (z++) * .12) : 0;
    if (el.classList.contains('draw')) {
      if (!el._len) { el._len = (el.getTotalLength ? el.getTotalLength() : 600) + 2; gsap.set(el, { strokeDasharray: el._len, strokeDashoffset: el._len }); }
      gsap.to(el, { strokeDashoffset: on ? 0 : el._len, duration: instant ? 0 : D(.9), delay, ease: 'power2.inOut', overwrite: 'auto' });
    } else if (el.classList.contains('grow')) {
      const cut = el.dataset.shrink && step >= +el.dataset.shrink;
      gsap.to(el, { scaleX: on ? (cut ? .4 : 1) : 0, transformOrigin: '0% 50%', duration: instant ? 0 : D(.8), delay, ease: 'power3.out', overwrite: 'auto' });
    } else {
      gsap.to(el, { autoAlpha: on ? 1 : 0, scale: on ? 1 : .8, transformOrigin: '50% 50%', duration: instant ? 0 : D(.55), delay, ease: on ? 'back.out(1.6)' : 'power2.in', overwrite: 'auto' });
    }
    if (el.dataset.move) {
      const m = step >= +el.dataset.move;
      gsap.to(el, { x: m ? +el.dataset.dx : 0, y: m ? +el.dataset.dy : 0, duration: instant ? 0 : D(1), delay: instant ? 0 : delay + D(.15), ease: 'power2.inOut', overwrite: 'auto' });
    }
  });
}
function countUp(s) {
  $$('[data-count]', s).forEach(el => {
    const end = +el.dataset.count, o = { v: 0 };
    if (RM) { el.textContent = usd(end); return; }
    gsap.to(o, { v: end, duration: 1.2, delay: .8, ease: 'power2.out', onUpdate: () => { el.textContent = usd(Math.round(o.v)); } });
  });
}
const G = {
  enter: (s, step) => { anim(s, -1, true); anim(s, step, false); countUp(s); },
  step: (s, step) => anim(s, step, false),
};
const Divider = {
  enter: s => {
    if (RM) return;
    gsap.fromTo($('.divider .n', s), { scale: .4, rotation: -10, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, duration: .8, ease: 'back.out(2)', delay: .1 });
    gsap.fromTo($$('.chip', s), { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .4, stagger: .08, delay: .45, ease: 'power3.out' });
  },
};
const Hooks = { div: Divider };
['title', 'audience', 'trace', 'factory', 'nonmfg', 'driver', 'fixedkinds', 'range', 'sunk', 'uses'].forEach(k => { Hooks[k] = G; });

const Sims = {};

/* ---------- 1.1 Direct to what? ---------- */
Sims.objtoggle = s => {
  const COSTS = [
    ['Resin poured into the kayak', 'DDD'],
    ["Touring mold crew's wages", 'DDD'],
    ['Depreciation on the Touring molds', 'IDD'],
    ['Factory rent', 'IID'],
    ["Plant manager's salary", 'IID'],
    ["CEO's salary (head office)", 'III'],
  ];
  const WHY = [
    'For one kayak, only the resin and the crew who molded it can be traced. Everything shared is indirect.',
    'Widen to the whole Touring line: the Touring molds now trace straight to it, so their depreciation becomes direct.',
    'For the whole factory, rent and the plant manager become direct too. Only the head office CEO stays indirect.',
  ];
  const list = $('#ot-list', s), btns = $$('#ot-btns button', s);
  list.innerHTML = COSTS.map(c => `<div class="ot-row"><span>${c[0]}</span><span class="pill"></span></div>`).join('');
  const pills = $$('.pill', list);
  const paint = (p, d) => { p.className = 'pill ' + (d ? 'd' : 'i'); p.textContent = d ? 'Direct' : 'Indirect'; };
  pills.forEach((p, i) => paint(p, COSTS[i][1][0] === 'D'));
  btns.forEach(b => b.onclick = () => {
    const o = +b.dataset.o; pressSeg(btns, b);
    let k = 0;
    pills.forEach((p, i) => {
      const d = COSTS[i][1][o] === 'D';
      gsap.killTweensOf(p); gsap.set(p, { rotationX: 0 });
      if (p.classList.contains(d ? 'd' : 'i')) return;
      if (RM) { paint(p, d); return; }
      gsap.to(p, { rotationX: 90, duration: .18, delay: (k++) * .08, ease: 'power1.in', onComplete: () => {
        paint(p, d); gsap.to(p, { rotationX: 0, duration: .3, ease: 'back.out(2.5)' });
      } });
    });
    $('#ot-fb', s).textContent = WHY[o];
  });
};

/* ---------- 1.2 Sort the costs ---------- */
Sims.sortcost = s => {
  const CARDS = [
    ['Resin for the hulls', 'dm', 'Resin becomes part of every kayak and is easy to trace.'],
    ['Molded seats', 'dm', 'Each seat becomes part of a kayak and is easy to trace.'],
    ["Mold operators' wages", 'dl', 'Mold operators work hands-on on each kayak.'],
    ["Trim crew's wages", 'dl', 'The trim crew works hands-on on each kayak.'],
    ['Factory rent', 'oh', "Rent is a factory cost that can't be traced to one kayak."],
    ['Glue and sandpaper', 'oh', 'Too small to trace per kayak, so it counts as indirect materials.'],
    ["Factory supervisor's salary", 'oh', "Supervisors don't touch the kayaks: indirect labor."],
    ['Depreciation on molds', 'oh', 'Depreciation on factory equipment is a factory cost that is not traced per unit.'],
    ['Sales commissions', 'sell', 'Commissions are paid to get orders.'],
    ['Shipping to dealers', 'sell', 'Delivering finished kayaks to customers happens after production.'],
    ['Magazine ads', 'sell', 'Advertising helps get orders.'],
    ["CEO's salary", 'admin', 'The CEO runs the whole company, not the factory.'],
    ['Head office rent', 'admin', "The head office isn't the factory."],
    ['Accounting staff wages', 'admin', 'Accounting supports the company as a whole.'],
  ];
  const NAME = { dm: 'direct materials', dl: 'direct labor', oh: 'manufacturing overhead', sell: 'selling', admin: 'administrative' };
  const tray = $('#sc-tray', s), buckets = $$('.bucket', s), fb = $('#sc-fb', s);
  let sel = null;
  const deal = () => {
    sel = null; buckets.forEach(b => { $('.bucket-list', b).innerHTML = ''; b.classList.remove('hot'); });
    const order = CARDS.map((c, i) => i).sort(() => Math.random() - .5);
    tray.innerHTML = order.map(i => `<button type="button" class="risk-card" data-i="${i}">${CARDS[i][0]}</button>`).join('');
    fb.textContent = 'Pick a cost to start.';
    if (!RM) gsap.from($$('.risk-card', tray), { y: -24, autoAlpha: 0, rotation: () => Math.random() * 16 - 8, duration: .45, stagger: .04, ease: 'back.out(2)' });
    $$('.risk-card', tray).forEach(c => c.onclick = () => {
      if (c.classList.contains('placed')) return;
      $$('.risk-card', tray).forEach(x => x.classList.toggle('sel', x === c && sel !== c));
      sel = sel === c ? null : c;
      buckets.forEach(b => b.classList.toggle('hot', !!sel));
      if (sel) {
        fb.textContent = `"${c.textContent}": now tap the group it belongs to.`;
        if (innerWidth < 640) s.scrollTo({ top: s.scrollTop + buckets[0].getBoundingClientRect().top - s.getBoundingClientRect().top - 12, behavior: RM ? 'auto' : 'smooth' });
      }
    });
  };
  const place = b => {
    if (!sel) { fb.textContent = 'Pick a cost first.'; return; }
    const c = CARDS[+sel.dataset.i];
    if (c[1] !== b.dataset.type) {
      fb.innerHTML = `<b class="neg">Not quite.</b> ${c[2]} Try another group.`;
      if (!RM) gsap.fromTo(sel, { x: -10 }, { x: 0, duration: .6, ease: 'elastic.out(1,.25)' });
      return;
    }
    const from = sel.getBoundingClientRect(), card = document.createElement('span');
    card.className = 'risk-card placed'; card.textContent = sel.textContent;
    sel.remove(); $('.bucket-list', b).appendChild(card);
    const to = card.getBoundingClientRect();
    if (!RM) {
      gsap.fromTo(card, { x: from.left - to.left, y: from.top - to.top }, { x: 0, y: 0, duration: .6, ease: 'power3.inOut' });
      gsap.fromTo(b, { scale: 1 }, { scale: 1.04, duration: .15, yoyo: true, repeat: 1, delay: .55 });
    }
    sel = null; buckets.forEach(x => x.classList.remove('hot'));
    const left = $$('.risk-card', tray).length;
    fb.innerHTML = `<b class="pos">Yes:</b> ${c[0]} → ${NAME[c[1]]}. ` + (left ? `${left} to go.` : '<b>All 14 sorted!</b>');
  };
  buckets.forEach(b => { b.onclick = e => { if (!e.target.closest('.placed')) place(b); }; b.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); place(b); } }; });
  $('#sc-reset', s).onclick = deal;
  deal();
};

/* ---------- 1.2 Prime and conversion ---------- */
Sims.primeconv = s => {
  const dm = $('#pc-dm', s), dl = $('#pc-dl', s), oh = $('#pc-oh', s);
  const upd = () => {
    const a = +dm.value, b = +dl.value, c = +oh.value, t = a + b + c, w = v => (t ? v / t * 100 : 0);
    $('#pc-dm-o').textContent = usd(a); $('#pc-dl-o').textContent = usd(b); $('#pc-oh-o').textContent = usd(c);
    [['#pc-dm-s', a, 'DM'], ['#pc-dl-s', b, 'DL'], ['#pc-oh-s', c, 'MOH']].forEach(([id, v, l]) => {
      gsap.to(id, { width: w(v) + '%', duration: D(.5), ease: 'power2.out' }); $(id).textContent = w(v) > 9 ? l : '';
    });
    gsap.to('#pc-prime-b', { left: 0, width: w(a + b) + '%', duration: D(.5), ease: 'power2.out' });
    gsap.to('#pc-conv-b', { left: w(a) + '%', width: w(b + c) + '%', duration: D(.5), ease: 'power2.out' });
    $('#pc-prime-b').textContent = 'Prime ' + usd(a + b); $('#pc-conv-b').textContent = 'Conversion ' + usd(b + c);
    $('#pc-prime').textContent = usd(a + b); $('#pc-conv').textContent = usd(b + c); $('#pc-total').textContent = usd(t);
    $('#pc-f').innerHTML = `Prime + conversion = ${usd(a + 2 * b + c)}, which is <b>${usd(b)} more</b> than the ${usd(t)} total: that's the direct labor, counted in both.`;
  };
  [dm, dl, oh].forEach(e => { e.oninput = upd; }); upd();
};

/* ---------- 1.3 Where the dollars go ---------- */
Sims.flow = s => {
  const g = $('#fl-tokens', s), sold = $('#fl-sold', s), btn = $('#fl-run', s), N = 10, UNIT = 150;
  const X = { wip: 225, fg: 370, cogs: 545 };
  const at = (box, i) => ({ cx: X[box] + (i % 5 - 2) * 14, cy: 146 + Math.floor(i / 5) * 14 });
  const dm = $('#fl-dm', s), dl = $('#fl-dl', s), oh = $('#fl-oh', s);
  g.innerHTML = Array.from({ length: N }, () => '<circle r="5" class="f-accent"/>').join('') + '<circle r="7" class="f-amber"/>';
  const toks = $$('circle', g).slice(0, N), per = $$('circle', g)[N];
  const all = () => [...toks, per, dm, dl, oh];
  const text = () => {
    const k = +sold.value, cogs = k * UNIT, fg = (1000 - k) * UNIT;
    $('#fl-sold-o').textContent = num(k);
    $('#fl-cogs-t').textContent = usd(cogs); $('#fl-fg-t').textContent = usd(fg);
    $('#fl-f').innerHTML = `${num(k)} × $150 = <b>${usd(cogs)}</b> to cost of goods sold · ${num(1000 - k)} × $150 = <b>${usd(fg)}</b> stays in finished goods`;
  };
  const route = (instant, delay = 0) => {
    const k = +sold.value / 100;
    toks.forEach((t, i) => { gsap.killTweensOf(t); gsap.to(t, { attr: i < k ? at('cogs', i) : at('fg', i - k), autoAlpha: 1, duration: instant ? 0 : D(.7), delay: instant ? 0 : delay + i * .04, ease: 'power2.inOut' }); });
  };
  const reset = () => {
    all().forEach(e => gsap.killTweensOf(e));
    gsap.set([dm, dl, oh], { x: 0, y: 0, scale: 1, autoAlpha: 1 });
    toks.forEach((t, i) => gsap.set(t, { attr: at('wip', i), autoAlpha: 0 }));
    gsap.set(per, { attr: { cx: 300, cy: 212 }, autoAlpha: 1 });
  };
  const run = () => {
    reset();
    if (RM) { gsap.set([dm, dl, oh], { autoAlpha: 0 }); route(true); gsap.set(per, { attr: { cx: 462 } }); return; }
    gsap.to(dm, { x: 145, y: -48, duration: .7, delay: .1, ease: 'power2.inOut' });
    gsap.to(dl, { x: -40, y: 54, duration: .6, delay: .5, ease: 'power2.in' });
    gsap.to(oh, { x: -100, y: 54, duration: .6, delay: .7, ease: 'power2.in' });
    gsap.to([dm, dl, oh], { autoAlpha: 0, scale: .6, transformOrigin: '50% 50%', duration: .3, delay: 1.3 });
    toks.forEach((t, i) => gsap.to(t, { autoAlpha: 1, duration: .3, delay: 1.4 + i * .04 }));
    gsap.to(per, { attr: { cx: 462 }, duration: 1.2, delay: .2, ease: 'power1.inOut' });
    toks.forEach((t, i) => gsap.to(t, { attr: at('fg', i), duration: .6, delay: 1.9 + i * .05, ease: 'power2.inOut' }));
    const k = +sold.value / 100;
    toks.forEach((t, i) => { if (i < k) gsap.to(t, { attr: at('cogs', i), duration: .6, delay: 2.9 + i * .04, ease: 'power2.inOut' }); });
    btn.textContent = '↻ Run it again';
  };
  sold.oninput = () => { text(); route(false); };
  btn.onclick = run;
  text(); reset();
  if (RM) run(); else setTimeout(run, 700);
};

/* ---------- 1.3 Product or period? ---------- */
Sims.pporp = s => {
  const ITEMS = [
    ['Resin for kayak hulls', 'p'], ['Sales commissions', 'q'], ['Factory electricity', 'p'], ["CEO's salary", 'q'],
    ["Mold operators' wages", 'p'], ['Magazine advertising', 'q'], ['Depreciation on factory molds', 'p'],
    ['Shipping kayaks to customers', 'q'], ["Factory supervisor's salary", 'p'], ['Head office supplies', 'q'],
  ];
  const card = $('#pp-card', s), fb = $('#pp-fb', s), bins = { p: $('#pp-prod', s), q: $('#pp-per', s) };
  let order, at, n, firstTry, missed, busy;
  const show = () => {
    busy = false;
    gsap.killTweensOf(card);
    if (at >= ITEMS.length) {
      card.textContent = `Done: ${firstTry} of 10 right on the first try`;
      fb.innerHTML = '<b class="pos">All sorted.</b> Factory costs are product costs; selling and admin are period costs.';
      $('#pp-count').textContent = 'Finished';
    } else {
      card.textContent = ITEMS[order[at]][0]; missed = false;
      $('#pp-count').textContent = `Cost ${at + 1} of 10`;
    }
    if (RM) gsap.set(card, { x: 0, y: 0, autoAlpha: 1, scale: 1 });
    else gsap.fromTo(card, { x: 0, y: -30, autoAlpha: 0, scale: .9 }, { x: 0, y: 0, autoAlpha: 1, scale: 1, duration: .4, ease: 'back.out(2)' });
  };
  const pick = k => {
    if (busy || at >= ITEMS.length) return;
    const [name, right] = ITEMS[order[at]];
    if (k !== right) {
      missed = true;
      fb.innerHTML = `<b class="neg">Not quite.</b> ${name}: ${right === 'p' ? 'a factory cost, so it waits in inventory. That makes it a product cost' : 'a selling or administrative cost, so it is expensed right away. That makes it a period cost'}.`;
      if (!RM) gsap.fromTo(card, { x: -12 }, { x: 0, duration: .6, ease: 'elastic.out(1,.25)' });
      return;
    }
    if (!missed) firstTry++;
    n[k]++; $(k === 'p' ? '#pp-pn' : '#pp-qn').textContent = n[k];
    fb.innerHTML = `<b class="pos">Yes:</b> ${name} → ${k === 'p' ? 'product' : 'period'} cost.`;
    at++;
    if (RM) { show(); return; }
    busy = true;
    const c = card.getBoundingClientRect(), b = bins[k].getBoundingClientRect();
    gsap.fromTo(bins[k], { scale: 1 }, { scale: 1.06, duration: .15, yoyo: true, repeat: 1, delay: .3 });
    gsap.to(card, { x: (b.left + b.width / 2) - (c.left + c.width / 2), scale: .3, autoAlpha: 0, duration: .45, ease: 'power2.in', onComplete: show });
  };
  bins.p.onclick = () => pick('p'); bins.q.onclick = () => pick('q');
  const reset = () => { order = ITEMS.map((x, i) => i).sort(() => Math.random() - .5); at = 0; n = { p: 0, q: 0 }; firstTry = 0; $('#pp-pn').textContent = 0; $('#pp-qn').textContent = 0; fb.textContent = 'Factory cost → product. Selling or admin → period. Tap a side.'; show(); };
  $('#pp-reset', s).onclick = reset;
  reset();
};

/* ---------- 1.4 Variable vs fixed ---------- */
Sims.behavior = s => {
  const RATE = 45, RENT = 12000, RENT2 = 20000, RANGE = 1500, MAXX = 2000;
  const rent = x => x > RANGE ? RENT2 : RENT;
  const px = x => 40 + x / MAXX * 245;
  const T = { svg: $('#bh-tot', s), max: 100000, lab: ['$0', '$100K'] }, U = { svg: $('#bh-unit', s), max: 130, lab: ['$0', '$130'] };
  const py = (c, v) => 165 - clamp(v / c.max, 0, 1.05) * 150;
  [T, U].forEach(c => {
    c.svg.innerHTML = `<rect x="${px(RANGE)}" y="10" width="${px(MAXX) - px(RANGE)}" height="155" class="f-red-soft" opacity=".5"/>
      <text x="${(px(RANGE) + px(MAXX)) / 2}" y="22" text-anchor="middle" class="f-red" style="font-size:10px">past the range</text>
      <path d="M40 165 L290 165 M40 165 L40 10" class="f-none s-ink2" stroke-width="1.2"/>
      <text x="36" y="169" text-anchor="end" class="f-ink2" style="font-size:11px">${c.lab[0]}</text><text x="36" y="19" text-anchor="end" class="f-ink2" style="font-size:11px">${c.lab[1]}</text>
      <text x="40" y="182" text-anchor="middle" class="f-ink2" style="font-size:11px">0</text><text x="${px(RANGE)}" y="182" text-anchor="middle" class="f-ink2" style="font-size:11px">1,500</text><text x="285" y="182" text-anchor="middle" class="f-ink2" style="font-size:11px">2,000</text>
      <path class="f-none s-accent ln" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path class="f-none s-ink2 gd" stroke-width="1" stroke-dasharray="4 4"/>
      <circle r="7" class="f-accent s-bg dt" stroke-width="2.5"/>`;
  });
  const btns = $$('#bh-btns button', s), xs = $('#bh-x', s);
  let t = 'v';
  const tot = x => t === 'v' ? RATE * x : rent(x), unit = x => t === 'v' ? RATE : rent(x) / x;
  const path = (c, f) => {
    let d = '';
    for (let x = (c === U && t === 'f') ? 100 : 0; x <= MAXX; x += 25) {
      if (x === RANGE + 25 && t === 'f') d += 'L' + px(RANGE).toFixed(1) + ' ' + py(c, f(RANGE + 1)).toFixed(1);
      d += (d ? 'L' : 'M') + px(x).toFixed(1) + ' ' + py(c, f(Math.max(x, 1))).toFixed(1);
    }
    return d;
  };
  const draw = instant => {
    [[T, tot], [U, unit]].forEach(([c, f]) => {
      const ln = $('.ln', c.svg); ln.setAttribute('d', path(c, f));
      const L = ln.getTotalLength ? ln.getTotalLength() + 2 : 600;
      gsap.set(ln, { strokeDasharray: L, strokeDashoffset: instant || RM ? 0 : L });
      if (!instant) gsap.to(ln, { strokeDashoffset: 0, duration: D(.9), ease: 'power2.inOut' });
    });
  };
  const move = instant => {
    const x = +xs.value, past = x > RANGE;
    [[T, tot(x)], [U, unit(x)]].forEach(([c, v]) => {
      const cx = px(x), cy = py(c, v);
      gsap.to($('.dt', c.svg), { attr: { cx, cy }, duration: instant ? 0 : D(.35), ease: 'power2.out' });
      $('.gd', c.svg).setAttribute('d', `M40 ${cy.toFixed(1)} L${cx.toFixed(1)} ${cy.toFixed(1)} L${cx.toFixed(1)} 165`);
    });
    $('#bh-x-o').textContent = num(x);
    $('#bh-t').textContent = usd(tot(x)); $('#bh-u').textContent = '$' + num(unit(x), 2);
    $('#bh-f').innerHTML = t === 'v'
      ? `Variable: total <b>rises</b> with volume (${num(x)} × $45 = ${usd(tot(x))}); cost per kayak <b>stays</b> at $45.`
      : past
        ? `Past 1,500 kayaks the building is full: a second one pushes rent up to <b>$20,000</b>. "Fixed" only holds inside the relevant range.`
        : `Fixed: total <b>stays</b> at $12,000; cost per kayak <b>falls</b> as volume rises ($12,000 ÷ ${num(x)} = $${num(unit(x), 2)}).`;
  };
  btns.forEach(b => b.onclick = () => { t = b.dataset.t; pressSeg(btns, b); draw(false); move(true); });
  xs.oninput = () => move(false);
  draw(true); move(true);
};

/* ---------- 1.4 Mixed cost ---------- */
Sims.mixed = s => {
  const svg = $('#mx-svg', s), A = $('#mx-a', s), B = $('#mx-b', s), Xs = $('#mx-x', s), MAXX = 2000, MAXY = 22000;
  const px = x => 50 + x / MAXX * 330, py = y => 190 - y / MAXY * 172;
  svg.innerHTML = `<rect x="50" width="330" class="f-amber-soft fx"/>
    <polygon class="f-blue-soft vr"/>
    <path d="M50 190 L384 190 M50 190 L50 12" class="f-none s-ink2" stroke-width="1.2"/>
    <text x="46" y="194" text-anchor="end" class="f-ink2" style="font-size:11px">$0</text>
    <text x="50" y="206" text-anchor="middle" class="f-ink2" style="font-size:11px">0</text><text x="380" y="206" text-anchor="middle" class="f-ink2" style="font-size:11px">2,000</text>
    <text x="215" y="218" text-anchor="middle" class="f-ink2" style="font-size:11px">Kayaks (X)</text>
    <text x="58" class="f-amber b al" style="font-size:12px">a = fixed</text>
    <line class="s-accent ln" stroke-width="3.5" stroke-linecap="round"/>
    <path class="f-none s-ink2 gd" stroke-width="1" stroke-dasharray="4 4"/>
    <circle r="7" class="f-accent s-bg dt" stroke-width="2.5"/>
    <text class="f-accent b yl" style="font-size:13px" text-anchor="end"></text>`;
  const upd = instant => {
    const a = +A.value, b = +B.value, x = +Xs.value, y = a + b * x, d = instant || RM ? 0 : .45;
    const ya = py(a), yEnd = py(a + b * MAXX), cx = px(x), cy = py(y);
    gsap.to($('.fx', svg), { attr: { y: ya, height: 190 - ya }, duration: d });
    gsap.to($('.vr', svg), { attr: { points: `50,${ya} 380,${yEnd} 380,${ya}` }, duration: d });
    gsap.to($('.ln', svg), { attr: { x1: 50, y1: ya, x2: 380, y2: yEnd }, duration: d });
    gsap.to($('.al', svg), { attr: { y: Math.min(ya + 16, 184) }, duration: d });
    gsap.to($('.dt', svg), { attr: { cx, cy }, duration: d });
    gsap.to($('.yl', svg), { attr: { x: Math.max(cx - 10, 150), y: Math.max(cy - 12, 24) }, duration: d });
    $('.yl', svg).textContent = 'Y = ' + usd(y);
    $('.gd', svg).setAttribute('d', `M50 ${cy.toFixed(1)} L${cx.toFixed(1)} ${cy.toFixed(1)} L${cx.toFixed(1)} 190`);
    $('#mx-a-o').textContent = usd(a); $('#mx-b-o').textContent = usd(b); $('#mx-x-o').textContent = num(x);
    $('#mx-f').innerHTML = `Y = ${usd(a)} + ${usd(b)} × ${num(x)} = <b>${usd(y)}</b>`;
  };
  [A, B, Xs].forEach(e => { e.oninput = () => upd(false); });
  upd(true);
  if (!RM) gsap.from($('.ln', svg), { attr: { x2: 50, y2: py(2000) }, duration: 1, delay: .5, ease: 'power2.out' });
};

/* ---------- 1.5 Dealer or online? ---------- */
Sims.decision = s => {
  const bs = $('#dc-sunk', s), bo = $('#dc-opp', s), sunkRow = $('#dc-sunk-row', s), oppRow = $('#dc-opp-row', s), fb = $('#dc-fb', s);
  let sunk = false, opp = false;
  const MSG = {
    '00': 'Northstar has 200 leftover kayaks. Online looks $2,000 better. Now press the two buttons.',
    '10': 'The $8,000 of molds sits in both columns, so it cancels out: it is sunk. Online still leads by $2,000.',
    '01': 'Storing kayaks for online orders means giving up $1,500 of warehouse rent. Online now leads by only $500.',
    '11': 'Relevant costs only: online wins by $500 ($6,000 more revenue − $4,000 more cost − $1,500 opportunity cost).',
  };
  const upd = instant => {
    const d1 = 37000 - (sunk ? 0 : 8000), d2 = 39000 - (opp ? 1500 : 0) - (sunk ? 0 : 8000), dur = instant ? 0 : D(.6);
    $('#dc-n1').textContent = usd(d1); $('#dc-n2').textContent = usd(d2); $('#dc-nd').textContent = '+' + usd(d2 - d1);
    $('#dc-v1').textContent = usd(d1); $('#dc-v2').textContent = usd(d2);
    gsap.to('#dc-b1', { scaleX: d1 / 40000, transformOrigin: '0% 50%', duration: dur, ease: 'power3.out' });
    gsap.to('#dc-b2', { scaleX: d2 / 40000, transformOrigin: '0% 50%', duration: dur, ease: 'power3.out' });
    fb.innerHTML = (sunk && opp ? '<b class="pos">Decision:</b> ' : '') + MSG[(sunk ? '1' : '0') + (opp ? '1' : '0')];
  };
  bs.onclick = () => {
    sunk = !sunk; bs.setAttribute('aria-pressed', sunk);
    gsap.to($('.strike', sunkRow), { scaleX: sunk ? 1 : 0, duration: D(.5), ease: 'power2.inOut' });
    gsap.to(sunkRow, { opacity: sunk ? .45 : 1, duration: D(.5) });
    upd(false);
  };
  bo.onclick = () => {
    opp = !opp; bo.setAttribute('aria-pressed', opp);
    if (opp) { oppRow.style.display = ''; if (!RM) gsap.fromTo(oppRow, { autoAlpha: 0, x: 30 }, { autoAlpha: 1, x: 0, duration: .5, ease: 'back.out(1.8)' }); }
    else oppRow.style.display = 'none';
    upd(false);
  };
  upd(true);
};

/* ---------- 1.6 Two formats, one profit ---------- */
Sims.formats = s => {
  const list = $('#fm-list', s), btns = $$('#fm-btns button', s), rows = {};
  $$('.st-row', list).forEach(r => { rows[r.dataset.id] = r; });
  const ORDER = { t: ['sales', 'cogs', 'gm', 'sv', 'sf', 'av', 'af', 'noi'], c: ['sales', 'cogs', 'sv', 'av', 'cm', 'sf', 'af', 'noi'] };
  const TAG = {
    t: { cogs: ['cogs', ''], sv: ['selling', ''], sf: ['selling', ''], av: ['admin', ''], af: ['admin', ''] },
    c: { cogs: ['variable', 'var'], sv: ['variable', 'var'], av: ['variable', 'var'], sf: ['fixed', 'fix'], af: ['fixed', 'fix'] },
  };
  const set = (f, instant) => {
    const before = {}; Object.keys(rows).forEach(k => { before[k] = rows[k].getBoundingClientRect().top; });
    const was = { gm: rows.gm.style.display !== 'none', cm: rows.cm.style.display !== 'none' };
    rows.gm.style.display = f === 't' ? '' : 'none'; rows.cm.style.display = f === 'c' ? '' : 'none';
    ORDER[f].forEach(k => list.appendChild(rows[k]));
    Object.entries(TAG[f]).forEach(([k, [txt, cls]]) => { const t = $('.tag', rows[k]); t.textContent = txt; t.className = 'tag ' + cls; });
    if (instant || RM) return;
    ORDER[f].forEach((k, i) => {
      const r = rows[k];
      if ((k === 'gm' || k === 'cm') && !was[k]) { gsap.fromTo(r, { autoAlpha: 0, scale: .85 }, { autoAlpha: 1, scale: 1, duration: .5, delay: .45, ease: 'back.out(2)' }); return; }
      const dy = before[k] - r.getBoundingClientRect().top;
      if (dy) gsap.fromTo(r, { y: dy }, { y: 0, duration: .7, delay: i * .03, ease: 'power3.inOut' });
    });
    gsap.fromTo(rows.noi, { scale: 1 }, { scale: 1.05, duration: .2, yoyo: true, repeat: 1, delay: .9 });
  };
  btns.forEach(b => b.onclick = () => { pressSeg(btns, b); set(b.dataset.f, false); });
  set('t', true);
};

/* ---------- 1.6 Every paddle adds $33 ---------- */
Sims.cmvolume = s => {
  const q = $('#cv-q', s), st = { q: 1000 };
  const render = () => {
    const n = st.q, cm = 33 * n, noi = cm - 23000;
    $('#cv-s').textContent = usd(100 * n); $('#cv-v').textContent = paren(67 * n);
    $('#cv-cm').textContent = usd(cm); $('#cv-bar-v').textContent = usd(cm);
    $('#cv-noi').textContent = usd(noi);
    $('#cv-noi-row').style.background = noi < 0 ? 'var(--red)' : '';
    gsap.set('#cv-bar', { scaleX: clamp(cm / 66000, 0, 1), transformOrigin: '0% 50%' });
  };
  q.oninput = () => {
    $('#cv-q-o').textContent = num(+q.value);
    gsap.to(st, { q: +q.value, duration: D(.5), ease: 'power2.out', onUpdate: () => { st.q = Math.round(st.q); render(); }, overwrite: true });
    if (RM) { st.q = +q.value; render(); }
  };
  render();
};

SIEDeck.start({
  sections: { intro: 'Intro', '1.1': 'Cost objects', '1.2': 'Manufacturing costs', '1.3': 'Product and period', '1.4': 'Cost behavior', '1.5': 'Costs for decisions', '1.6': 'Income statements', end: 'Review' },
  sims: Sims,
  hooks: Hooks,
});
})();
