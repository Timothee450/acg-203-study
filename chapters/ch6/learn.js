/* Chapter 6 learning deck: simulators. The slide engine is assets/deck.js; the step animations
   declared in learn.html (data-at, data-move, data-count) run through assets/steps.js. */
(() => {
const { $, $$, RM, num, usd, pressSeg } = SIEDeck;

/* Cobalt Trail Packs */
const PRICE = 80, VMFG = 30, FMOH = 200000;    // per pack, variable manufacturing per pack, fixed MOH per year
const VSA = 5, FSA = 90000, MADE = 10000;      // variable S&A per pack, fixed S&A per year, packs made per year
const SEG = { online: { sales: 500000, cmr: .6, fixed: 180000 }, retail: { sales: 500000, cmr: .4, fixed: 120000 }, common: 100000 };
const Hooks = SIESteps.hooks(['unitcost', 'twostmts', 'inventory', 'whyvc', 'traceable', 'segmargin', 'levels', 'bekey', 'trap', 'recap']);
const Sims = {};

const money = v => v < 0 ? '−' + usd(-v) : usd(v);
const paren = v => v < 0 ? '(' + usd(-v).slice(1) + ')' : usd(v);
const signedN = v => (v > 0 ? '+' : v < 0 ? '−' : '') + num(Math.abs(v));
function flyTo(el, target, done) {
  if (RM) { done(); return; }
  const a = el.getBoundingClientRect(), b = target.getBoundingClientRect();
  gsap.to(el, { x: (b.left + b.width / 2) - (a.left + a.width / 2), y: (b.top + b.height / 2) - (a.top + a.height / 2), scale: .3, autoAlpha: 0, duration: .45, ease: 'power2.in', onComplete: done });
}
const pulse = el => { if (!RM) gsap.fromTo(el, { scale: 1 }, { scale: 1.05, duration: .15, yoyo: true, repeat: 1 }); };
const shake = el => { if (!RM) gsap.fromTo(el, { x: -10 }, { x: 0, duration: .6, ease: 'elastic.out(1,.25)' }); };
/* count a figure from its last value to v; a new count (or a reset) replaces one still running */
function countTo(el, v, instant, fmt = money) {
  const o = { v: +(el.dataset.v || 0) };
  el.dataset.v = v;
  if (el._tw) el._tw.kill();
  if (instant || RM) { el._tw = null; el.textContent = fmt(v); return; }
  el._tw = gsap.to(o, { v, duration: .5, ease: 'power2.out', onUpdate: () => { el.textContent = fmt(Math.round(o.v)); }, onComplete: () => { el.textContent = fmt(v); } });
}
const tone = (el, v) => { el.classList.toggle('pos', v > 0); el.classList.toggle('neg', v < 0); };

/* a one-card-at-a-time sorter: items [text, right bin, why]; bins are .pp-bin buttons with data-b */
function sorter(s, { items, names, card, fb, count, reset, noun, hint, done, intro }) {
  const bins = $$('.pp-bin', s);
  let order, at, first, missed, busy;
  const show = () => {
    busy = false; gsap.killTweensOf(card);
    if (at >= items.length) { card.textContent = `All ${items.length} sorted ✓`; count.textContent = 'Finished'; fb.innerHTML = `<b class="pos">Done: ${first} of ${items.length} on the first try.</b> ${done}`; }
    else { card.textContent = items[order[at]][0]; count.textContent = `${noun} ${at + 1} of ${items.length}`; }
    if (RM) gsap.set(card, { x: 0, y: 0, scale: 1, autoAlpha: 1 });
    else gsap.fromTo(card, { x: 0, y: -30, scale: .9, autoAlpha: 0 }, { x: 0, y: 0, scale: 1, autoAlpha: 1, duration: .4, ease: 'back.out(2)' });
  };
  const pick = b => {
    if (busy || at >= items.length) return;
    const [, right, why] = items[order[at]], k = b.dataset.b;
    if (k !== right) { missed = true; fb.innerHTML = `<b class="neg">Not ${names[k]}.</b> ${hint}`; shake(card); return; }
    if (!missed) first++;
    missed = false;
    const n = $('.n', b); n.textContent = +n.textContent + 1;
    fb.innerHTML = `<b class="pos">Yes: ${names[k]}.</b> ${why}`;
    at++; busy = true; pulse(b);
    flyTo(card, b, show);
  };
  bins.forEach(b => { b.onclick = () => pick(b); });
  reset.onclick = () => {
    order = items.map((x, i) => i).sort(() => Math.random() - .5); at = 0; first = 0; missed = false;
    bins.forEach(b => { $('.n', b).textContent = 0; });
    fb.textContent = intro; show();
  };
  reset.onclick();
}

/* ---------- 6.1 Product cost under which method? ---------- */
Sims.classify = s => sorter(s, {
  items: [
    ['Direct materials', 'both', 'Every method counts the materials in the pack.'],
    ['Direct labor', 'both', 'Labor that sews the pack is a product cost either way.'],
    ['Variable manufacturing overhead', 'both', 'Variable factory costs go into the unit under both methods.'],
    ['Factory building rent', 'abs', 'A fixed factory cost: in the unit under absorption costing, expensed under variable costing.'],
    ['Factory supervisor\'s salary', 'abs', 'Fixed manufacturing overhead, so only absorption costing puts it in the unit.'],
    ['Depreciation on sewing machines', 'abs', 'Fixed manufacturing overhead.'],
    ['Sales commissions per pack', 'none', 'A variable selling cost is still a period cost, never a product cost.'],
    ['Office administrators\' salaries', 'none', 'Administrative costs are period costs under both methods.'],
    ['Advertising', 'none', 'A selling cost: expensed in the period.'],
    ['Zippers and buckles sewn into each pack', 'both', 'They\'re direct materials.'],
  ],
  names: { both: 'both methods', abs: 'absorption only', none: 'neither' },
  card: $('#cl-card', s), fb: $('#cl-fb', s), count: $('#cl-count', s), reset: $('#cl-reset', s), noun: 'Cost',
  intro: 'Is this cost part of a pack\'s unit product cost?',
  hint: 'Is it a factory cost? If so, is it variable or fixed?',
  done: 'Variable factory costs: both methods. Fixed factory costs: absorption only. Selling and admin: never in the unit.',
});

/* ---------- 6.2 One year, two statements ---------- */
Sims.stmtsim = s => {
  const m = $('#ss-m', s), so = $('#ss-s', s);
  const upd = instant => {
    const made = +m.value;
    so.max = Math.min(made, 12000); if (+so.value > made) so.value = made;
    const sold = +so.value, f = FMOH / made;
    const vnoi = sold * (PRICE - VMFG - VSA) - FMOH - FSA, anoi = sold * (PRICE - VMFG - f) - sold * VSA - FSA;
    $('#ss-m-o').textContent = num(made); $('#ss-s-o').textContent = num(sold);
    countTo($('#ss-v'), vnoi, instant); countTo($('#ss-a'), Math.round(anoi), instant);
    tone($('#ss-v'), vnoi); tone($('#ss-a'), anoi);
    $('#ss-vu').textContent = 'unit cost $30'; $('#ss-au').textContent = `unit cost $${num(VMFG + f, f % 1 ? 2 : 0)} ($30 + $${num(f, f % 1 ? 2 : 0)})`;
    const left = made - sold;
    $('#ss-f').innerHTML = left
      ? `Difference = ${num(left)} packs left in inventory × ${f % 1 ? `($200,000 ÷ ${num(made)})` : '$' + num(f)} of fixed overhead = <b>${usd(Math.round(left * f))}</b>, deferred under absorption costing`
      : 'Everything made was sold, so no fixed overhead waits in inventory: <b>both profits match</b>';
  };
  m.oninput = so.oninput = () => upd(false); upd(true);
};

/* ---------- 6.3 Two years ---------- */
Sims.yearsim = s => {
  const y1 = $('#ys-1', s), y2 = $('#ys-2', s), f = FMOH / MADE;
  const upd = () => {
    const s1 = +y1.value;
    y2.max = MADE + (MADE - s1); if (+y2.value > +y2.max) y2.value = y2.max;
    const s2 = +y2.value, i1 = MADE - s1, i2 = MADE - s2;
    const v = q => q * (PRICE - VMFG - VSA) - FMOH - FSA, a = q => q * (PRICE - VMFG - f - VSA) - FSA;
    $('#ys-1-o').textContent = num(s1); $('#ys-2-o').textContent = num(s2);
    $('#ys-i1').textContent = signedN(i1); $('#ys-i2').textContent = signedN(i2); $('#ys-it').textContent = signedN(i1 + i2);
    [['v1', v(s1)], ['v2', v(s2)], ['vt', v(s1) + v(s2)], ['a1', a(s1)], ['a2', a(s2)], ['at', a(s1) + a(s2)]].forEach(([k, x]) => { $('#ys-' + k).textContent = money(x); });
    const gap = a(s1) + a(s2) - v(s1) - v(s2);
    $('#ys-fb').textContent = i1 + i2 === 0
      ? `Inventory ends where it started, so the two-year totals match: ${money(v(s1) + v(s2))} either way.`
      : `Inventory ${i1 + i2 > 0 ? 'grew' : 'shrank'} by ${num(Math.abs(i1 + i2))} packs over the two years, so absorption costing reports ${money(Math.abs(gap))} ${gap > 0 ? 'more' : 'less'}: ${num(Math.abs(i1 + i2))} × $20.`;
  };
  y1.oninput = y2.oninput = upd; upd();
};

/* ---------- 6.3 Which profit is higher? ---------- */
Sims.which = s => sorter(s, {
  items: [
    ['Produced 50,000, sold 45,000', 'abs', 'Inventory grew, so absorption costing deferred some fixed overhead.'],
    ['Produced 30,000, sold 34,000', 'var', 'Inventory shrank, so absorption costing released old fixed overhead into expense.'],
    ['Produced and sold 20,000; no inventory at all', 'same', 'No change in inventory, no difference.'],
    ['Inventory grew by 3,000 units', 'abs', 'Growing inventory holds fixed overhead back from expense.'],
    ['Inventory fell by 1,200 units', 'var', 'Shrinking inventory pushes earlier fixed overhead into this period.'],
    ['A company builds stock before a product launch', 'abs', 'Production exceeds sales, so inventory grows.'],
    ['A just-in-time plant that never keeps inventory', 'same', 'Production always equals sales.'],
    ['Holiday sales outrun production', 'var', 'Sales exceed production, so inventory falls.'],
  ],
  names: { abs: 'absorption higher', var: 'variable higher', same: 'same' },
  card: $('#wh-card', s), fb: $('#wh-fb', s), count: $('#wh-count', s), reset: $('#wh-reset', s), noun: 'Case',
  intro: 'Watch what happens to inventory.',
  hint: 'Did inventory grow, shrink, or stay the same?',
  done: 'Inventory up → absorption higher. Inventory down → variable higher. No change → same.',
});

/* ---------- 6.4 Traceable or common? ---------- */
Sims.segsort = s => sorter(s, {
  items: [
    ['Website hosting', 'online', 'It exists only because of the online channel.'],
    ['Leases on the retail stores', 'retail', 'Close the stores and the leases end.'],
    ['CEO\'s salary', 'common', 'The CEO runs the whole company, whichever channels stay open.'],
    ['Online advertising campaigns', 'online', 'They drive web sales only.'],
    ['Store managers\' salaries', 'retail', 'No stores, no store managers.'],
    ['Depreciation on the headquarters building', 'common', 'Headquarters stays if either channel is dropped.'],
    ['Online customer service team', 'online', 'They answer web orders.'],
    ['Depreciation on store fixtures', 'retail', 'The fixtures belong to the stores.'],
    ['Company accounting department', 'common', 'It serves both channels.'],
  ],
  names: { online: 'traceable to Online', retail: 'traceable to Retail', common: 'common' },
  card: $('#sg-card', s), fb: $('#sg-fb', s), count: $('#sg-count', s), reset: $('#sg-reset', s), noun: 'Cost',
  intro: 'Ask: if this segment closed, would the cost disappear?',
  hint: 'If one channel closed, would this cost go away?',
  done: 'A cost that disappears with a segment is traceable to it. One that stays is common.',
});

/* ---------- 6.4 Segment statement ---------- */
Sims.segstmt = s => {
  const o = $('#st-o', s), r = $('#st-r', s);
  o.value = SEG.online.sales; r.value = SEG.retail.sales;
  const upd = instant => {
    const os = +o.value, rs = +r.value, oc = os * SEG.online.cmr, rc = rs * SEG.retail.cmr;
    const om = oc - SEG.online.fixed, rm = rc - SEG.retail.fixed, n = om + rm - SEG.common;
    $('#st-o-o').textContent = usd(os); $('#st-r-o').textContent = usd(rs);
    countTo($('#st-ct'), oc + rc, instant); countTo($('#st-co'), oc, instant); countTo($('#st-cr'), rc, instant);
    countTo($('#st-mt'), om + rm, instant, paren); countTo($('#st-mo'), om, instant, paren); countTo($('#st-mr'), rm, instant, paren);
    countTo($('#st-n'), n, instant, paren);
    $('#st-fb').textContent = (rm < 0 ? `Retail's segment margin is negative (${money(rm)}): it doesn't cover its own traceable costs. ` : '') +
      (om < 0 ? `Online's segment margin is negative (${money(om)}). ` : '') + (n < 0 ? `The company loses ${usd(-n)}. ` : '') +
      `Each extra $1 of sales adds 60¢ online, 40¢ in Retail.`;
  };
  o.oninput = r.oninput = () => upd(false); upd(true);
};

/* ---------- 6.5 Segment break-even ---------- */
Sims.segbe = s => {
  const ids = ['o', 'r', 'c', 'm'].map(k => $('#sb-' + k, s));
  const upd = instant => {
    const [to, tr, c, m] = ids.map(x => +x.value), share = m / 100, ratio = share * SEG.online.cmr + (1 - share) * SEG.retail.cmr;
    $('#sb-o-o').textContent = usd(to); $('#sb-r-o').textContent = usd(tr); $('#sb-c-o').textContent = usd(c); $('#sb-m-o').textContent = m + '%';
    const ob = to / SEG.online.cmr, rb = tr / SEG.retail.cmr, cb = Math.round((to + tr + c) / ratio);
    countTo($('#sb-ob'), Math.round(ob), instant); countTo($('#sb-rb'), Math.round(rb), instant); countTo($('#sb-cb'), cb, instant);
    $('#sb-ck').textContent = `Company (${Math.round(ratio * 1000) / 10}%)`;
    $('#sb-fb').textContent = `($${num(to + tr)} + $${num(c)}) ÷ ${Math.round(ratio * 1000) / 10}% = ${usd(cb)}. ` +
      (Math.abs(ratio - .5) < 1e-9 ? '' : `The mix changed the overall CM ratio, so the company break-even moved. `) +
      (cb >= Math.round(ob + rb) ? `The company needs ${usd(cb - Math.round(ob + rb))} more than the segments' break-evens combined.`
        : `That's ${usd(Math.round(ob + rb) - cb)} less than the segments' break-evens combined: at this mix one segment runs above its break-even and carries the other.`);
  };
  ids.forEach(x => { x.oninput = () => upd(false); }); upd(true);
};

/* ---------- 6.6 Keep or drop Retail? ---------- */
Sims.dropsim = s => {
  const A = $$('#dp-alloc button', s), Dd = $$('#dp-drop button', s);
  const rmargin = SEG.retail.sales * SEG.retail.cmr - SEG.retail.fixed, omargin = SEG.online.sales * SEG.online.cmr - SEG.online.fixed;
  let share = 0, drop = false;
  const upd = instant => {
    const alloc = SEG.common * share, look = rmargin - alloc, noi = drop ? omargin - SEG.common : omargin + rmargin - SEG.common;
    const rEl = $('#dp-r'); countTo(rEl, look, instant); tone(rEl, look);
    $('#dp-rn').textContent = share ? `$80,000 segment margin − ${usd(alloc)} allocated` : 'segment margin, nothing allocated';
    const nEl = $('#dp-n'); countTo(nEl, noi, instant);
    $('#dp-nn').textContent = drop ? 'Retail closed; common costs still $100,000' : 'both channels open';
    $('#dp-fb').innerHTML = drop
      ? `<b class="neg">Profit falls from $100,000 to ${money(noi)}.</b> The $100,000 of common costs stayed; the company just lost Retail's $80,000 segment margin.`
      : look < 0 ? `With ${Math.round(share * 100)}% of common costs charged to it, Retail looks like it loses ${usd(-look)}. Try dropping it and watch company profit.`
        : `Retail adds $80,000 to profit. Splitting the common costs changes how it looks (${money(look)}), not what it earns.`;
  };
  A.forEach(b => { b.onclick = () => { share = +b.dataset.a; pressSeg(A, b); upd(false); }; });
  Dd.forEach(b => { b.onclick = () => { drop = b.dataset.d === '1'; pressSeg(Dd, b); upd(false); }; });
  upd(true);
};

SIEDeck.start({
  sections: { intro: 'Intro', '6.1': 'Unit cost', '6.2': 'Two statements', '6.3': 'Why they differ', '6.4': 'Segments', '6.5': 'Segment break-even', '6.6': 'Common mistakes', end: 'Review' },
  sims: Sims,
  hooks: Hooks,
});
})();
