/* Chapter 4 learning deck: simulators. The slide engine is assets/deck.js; the step animations
   declared in learn.html (data-at, data-move, data-count) run through assets/steps.js. */
(() => {
const { $, $$, RM, D, num, usd, pressSeg } = SIEDeck;

/* Seabright's Blending department in May (weighted-average method) */
const BEG = { units: 4000, mat: 9000, conv: 3600 };   // beginning work in process: gallons and cost
const ADDED = { mat: 88000, conv: 51900 };              // cost added in May (conversion = $18,900 labor + $33,000 overhead)
const DONE = 34000;                                     // gallons completed and transferred to Bottling
const END = { units: 6000, mat: .8, conv: .5 };         // ending work in process: gallons and percent complete
const TOTAL_UNITS = BEG.units + 36000, TOTAL_COST = BEG.mat + BEG.conv + ADDED.mat + ADDED.conv;
const Hooks = SIESteps.hooks(['twoways', 'depts', 'transfer', 'partial', 'waeu', 'perunit', 'split', 'report', 'hybrid', 'recap']);
const Sims = {};

const cents = n => '$' + num(n, 2);
const cents4 = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });   // unrounded enough to check by hand
function flyTo(el, target, done) {
  if (RM) { done(); return; }
  const a = el.getBoundingClientRect(), b = target.getBoundingClientRect();
  gsap.to(el, { x: (b.left + b.width / 2) - (a.left + a.width / 2), y: (b.top + b.height / 2) - (a.top + a.height / 2), scale: .3, autoAlpha: 0, duration: .45, ease: 'power2.in', onComplete: done });
}
const pulse = el => { if (!RM) gsap.fromTo(el, { scale: 1 }, { scale: 1.05, duration: .15, yoyo: true, repeat: 1 }); };
const shake = el => { if (!RM) gsap.fromTo(el, { x: -10 }, { x: 0, duration: .6, ease: 'elastic.out(1,.25)' }); };
/* count a figure from its last value to v; a new count (or a reset) replaces one still running */
function countTo(el, v, instant, fmt = usd) {
  const o = { v: +(el.dataset.v || 0) };
  el.dataset.v = v;
  if (el._tw) el._tw.kill();
  if (instant || RM) { el._tw = null; el.textContent = fmt(v); return; }
  el._tw = gsap.to(o, { v, duration: .6, ease: 'power2.out', onUpdate: () => { el.textContent = fmt(fmt === usd ? Math.round(o.v) : o.v); }, onComplete: () => { el.textContent = fmt(v); } });
}

/* a one-card-at-a-time sorter: items [text, right bin, why], bins are .pp-bin buttons with data-b */
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

/* ---------- 4.2 Run May through two departments ---------- */
Sims.flow = s => {
  const board = $('#fl-board', s), fb = $('#fl-fb', s), nextBtn = $('#fl-next', s), tile = k => $(`[data-a="${k}"]`, board);
  const START = { rm: 115000, bl: BEG.mat + BEG.conv, bo: 10000, fg: 25000, cogs: 0 };
  const E = [
    ['rm', [['bl', ADDED.mat], ['bo', 14000]], '(1) Materials issued', 'Dr WIP–Blending 88,000 · Dr WIP–Bottling 14,000 · Cr Raw Materials 102,000', 'Each department gets the materials it uses: sauce ingredients in Blending, bottles and caps in Bottling.'],
    ['out', [['bl', 18900], ['bo', 12000]], '(2) Direct labor', 'Dr WIP–Blending 18,900 · Dr WIP–Bottling 12,000 · Cr Salaries and Wages Payable 30,900', 'Labor is traced to departments, not jobs.'],
    ['out', [['bl', 33000], ['bo', 20000]], '(3) Overhead applied', 'Dr WIP–Blending 33,000 · Dr WIP–Bottling 20,000 · Cr Manufacturing Overhead 53,000', 'Each department applies overhead at its own rate. Blending now holds $152,500.'],
    ['bl', [['bo', 136000]], '(4) Blending → Bottling', 'Dr WIP–Bottling 136,000 · Cr WIP–Blending 136,000', 'The finished sauce and its cost move on. $16,500 stays in Blending\'s ending inventory.'],
    ['bo', [['fg', 180000]], '(5) Bottling → Finished Goods', 'Dr Finished Goods 180,000 · Cr WIP–Bottling 180,000', 'Cost of goods manufactured. $12,000 stays in Bottling.'],
    ['fg', [['cogs', 170000]], '(6) Cases sold', 'Dr Cost of Goods Sold 170,000 · Cr Finished Goods 170,000', 'May is done: $35,000 of cases are still in the warehouse.'],
  ];
  let bal, at, busy, gen = 0;
  const show = (k, instant) => countTo($('.bal', tile(k)), bal[k], instant);
  const center = el => { const r = el.getBoundingClientRect(), b = board.getBoundingClientRect(); return [r.left - b.left + r.width / 2, r.top - b.top + r.height / 2]; };
  const fly = (from, to, v, done) => {
    if (RM) { done(); return; }
    const c = document.createElement('span'); c.className = 'fly'; c.textContent = usd(v); board.appendChild(c);
    const [x0, y0] = center(tile(from)), [x1, y1] = center(tile(to)), w = c.offsetWidth / 2, h = c.offsetHeight / 2;
    gsap.fromTo(c, { x: x0 - w, y: y0 - h, scale: .6, autoAlpha: 0 }, { x: x1 - w, y: y1 - h, scale: 1, autoAlpha: 1, duration: .8, ease: 'power2.inOut', onComplete: () => { c.remove(); done(); } });
  };
  const next = () => {
    if (busy || at >= E.length) return;
    const [from, to, title, je, note] = E[at++], g = gen;
    let left = to.length;
    busy = true;
    $$('.acct', board).forEach(t => t.classList.remove('hot'));
    if (from !== 'out') { bal[from] -= to.reduce((a, x) => a + x[1], 0); show(from); }
    to.forEach(([k, v]) => fly(from, k, v, () => {
      if (g !== gen) return;
      bal[k] += v; show(k); tile(k).classList.add('hot'); pulse(tile(k));
      if (--left === 0) busy = false;
    }));
    $('#fl-count').textContent = `Entry ${at} of ${E.length}`;
    fb.innerHTML = `<b>${title}.</b> <span class="mono">${je}</span><br>${note}`;
    if (at === E.length) { nextBtn.disabled = true; nextBtn.textContent = 'May done ✓'; }
  };
  const reset = () => {
    gen++; bal = { ...START }; at = 0; busy = false;
    $$('.fly', board).forEach(c => c.remove());
    $$('.acct', board).forEach(t => t.classList.remove('hot'));
    Object.keys(START).forEach(k => show(k, true));
    nextBtn.disabled = false; nextBtn.textContent = 'Next entry →';
    $('#fl-count').textContent = `Entry 0 of ${E.length}`;
    fb.innerHTML = 'May 1 balances are shown. Press <b>Next entry</b> to post the first transaction.';
  };
  nextBtn.onclick = next; $('#fl-reset', s).onclick = reset;
  reset();
};

/* ---------- 4.2 Which account is debited? ---------- */
Sims.jeproc = s => sorter(s, {
  items: [
    ['Chili mash is issued to Blending', 'bl', 'Materials are charged to the department that uses them.'],
    ['Bottles and caps are issued to Bottling', 'bo', 'Bottling uses them, so Bottling\'s Work in Process is debited.'],
    ['The blending crew\'s direct labor for the week is recorded', 'bl', 'Direct labor is traced to the department where the work was done (credit Salaries and Wages Payable).'],
    ['Overhead is applied to Bottling at $40 per machine-hour', 'bo', 'Applied overhead goes to the department\'s Work in Process (credit Manufacturing Overhead).'],
    ['Finished sauce moves from Blending to Bottling', 'bo', 'Debit the receiving department; credit Work in Process–Blending.'],
    ['Overhead is applied to Blending at $30 per machine-hour', 'bl', 'Each department applies overhead with its own rate.'],
    ['Cases leave Bottling for the warehouse', 'fg', 'Completed units move to Finished Goods (credit Work in Process–Bottling).'],
    ['A grocery chain buys 500 cases', 'cogs', 'Sold units become Cost of Goods Sold (credit Finished Goods). A second entry records the sale.'],
  ],
  names: { bl: 'WIP–Blending', bo: 'WIP–Bottling', fg: 'Finished Goods', cogs: 'Cost of Goods Sold' },
  card: $('#jp-card', s), fb: $('#jp-fb', s), count: $('#jp-count', s), reset: $('#jp-reset', s), noun: 'Event', intro: 'Read the event, then tap the account that\'s debited.',
  hint: 'Which department did the work or used the item? Or has the product left the factory floor?',
  done: 'Costs go to the department that incurs them, then follow the units: Blending → Bottling → Finished Goods → Cost of Goods Sold.',
});

/* ---------- 4.3 Pour partial work together ---------- */
Sims.eutanks = s => {
  const n = $('#et-n', s), p = $('#et-p', s), box = $('#et-tanks', s), btn = $('#et-pour', s), fb = $('#et-fb', s);
  let poured = false;
  const levels = () => {
    const tanks = +n.value / 1000, pct = +p.value / 100, eu = tanks * pct;
    return poured ? Array.from({ length: tanks }, (x, i) => Math.max(0, Math.min(1, eu - i))) : Array.from({ length: tanks }, () => pct);
  };
  const draw = instant => {
    const lv = levels();
    if (box.children.length !== lv.length) box.innerHTML = lv.map(() => '<div class="tank"><i></i></div>').join('');
    $$('.tank', box).forEach((t, i) => {
      t.classList.toggle('dim', poured && lv[i] === 0);
      gsap.to($('i', t), { width: lv[i] * 100 + '%', duration: instant ? 0 : D(.6), delay: instant || !poured ? 0 : D(i * .06), ease: 'power2.inOut' });
    });
  };
  const upd = instant => {
    const units = +n.value, pct = +p.value, eu = units * pct / 100;
    $('#et-n-o').textContent = num(units); $('#et-p-o').textContent = pct + '%';
    $('#et-eu').textContent = num(eu);
    btn.textContent = poured ? 'Spread back out' : 'Pour together';
    fb.innerHTML = poured
      ? `Poured together, the work fills <b>${num(eu / 1000, eu % 1000 ? 2 : 0)}</b> tank${eu === 1000 ? '' : 's'}: ${num(eu)} equivalent units. Same work, counted as whole gallons.`
      : `${num(units)} gallons × ${pct}% = <b>${num(eu)} equivalent units</b>. Press <b>Pour together</b> to see why.`;
    draw(instant);
  };
  n.oninput = p.oninput = () => { poured = false; upd(false); };
  btn.onclick = () => { poured = !poured; upd(false); };
  upd(true);
};

/* ---------- 4.3 Weighted-average equivalent units ---------- */
Sims.eucalc = s => {
  const m = $('#ec-m', s), c = $('#ec-c', s), b = $('#ec-b', s), fb = $('#ec-fb', s);
  m.value = END.mat * 100; c.value = END.conv * 100;
  let lastB = +b.value;
  const upd = instant => {
    const pm = +m.value / 100, pc = +c.value / 100, euM = DONE + END.units * pm, euC = DONE + END.units * pc;
    $('#ec-m-o').textContent = Math.round(pm * 100) + '%'; $('#ec-c-o').textContent = Math.round(pc * 100) + '%'; $('#ec-b-o').textContent = b.value + '%';
    gsap.to('#ec-mb', { width: END.units * pm / TOTAL_UNITS * 100 + '%', duration: instant ? 0 : D(.4) });
    gsap.to('#ec-cb', { width: END.units * pc / TOTAL_UNITS * 100 + '%', duration: instant ? 0 : D(.4) });
    countTo($('#ec-mv'), euM, instant, num); countTo($('#ec-cv'), euC, instant, num);
    $('#ec-f').innerHTML = `Materials ${num(DONE)} + ${num(END.units)} × ${Math.round(pm * 100)}% = <b>${num(euM)}</b> · Conversion ${num(DONE)} + ${num(END.units)} × ${Math.round(pc * 100)}% = <b>${num(euC)}</b>`;
  };
  m.oninput = c.oninput = () => { upd(false); fb.textContent = 'Only the ending inventory\'s percent complete changes the equivalent units.'; };
  b.oninput = () => {
    if (+b.value !== lastB) { pulse($('#ec-mv')); pulse($('#ec-cv')); }
    lastB = +b.value; $('#ec-b-o').textContent = b.value + '%';
    fb.innerHTML = `<b>Nothing changed.</b> Under weighted-average, the 4,000 beginning gallons are inside the 34,000 completed and count as whole units, whether they started May ${b.value}% done or not.`;
  };
  upd(true);
};

/* ---------- 4.4 Cost per equivalent unit ---------- */
Sims.costpu = s => {
  const EU = { mat: DONE + END.units * END.mat, conv: DONE + END.units * END.conv };
  const am = $('#cu-m', s), ac = $('#cu-c', s), btns = $$('#cu-btns button', s), fb = $('#cu-fb', s);
  am.value = ADDED.mat; ac.value = ADDED.conv;
  let wa = true;
  const upd = instant => {
    const bm = wa ? BEG.mat : 0, bc = wa ? BEG.conv : 0, pm = (bm + +am.value) / EU.mat, pc = (bc + +ac.value) / EU.conv, pt = pm + pc;
    $('#cu-m-o').textContent = usd(+am.value); $('#cu-c-o').textContent = usd(+ac.value);
    countTo($('#cu-pm'), pm, instant, cents); countTo($('#cu-pc'), pc, instant, cents); countTo($('#cu-pt'), pt, instant, cents);
    $('#cu-f').innerHTML = `(${usd(bm)} + ${usd(+am.value)}) ÷ ${num(EU.mat)} = ${cents(pm)} · (${usd(bc)} + ${usd(+ac.value)}) ÷ ${num(EU.conv)} = ${cents(pc)} · <b>${cents(pt)} a gallon</b>`;
    const right = (BEG.mat + +am.value) / EU.mat + (BEG.conv + +ac.value) / EU.conv;
    fb.innerHTML = wa ? 'Weighted-average: beginning cost plus cost added, divided by equivalent units.'
      : `<b class="neg">Wrong for weighted-average.</b> The equivalent units include the 4,000 beginning gallons, so their $12,600 of cost must be included too. Leaving it out understates the gallon by ${cents(right - pt)}.`;
  };
  am.oninput = ac.oninput = () => upd(false);
  btns.forEach(b => { b.onclick = () => { wa = b.dataset.w === '1'; pressSeg(btns, b); upd(false); }; });
  upd(true);
};

/* ---------- 4.5 The whole production report ---------- */
Sims.assign = s => {
  const d = $('#as-d', s), m = $('#as-m', s), c = $('#as-c', s);
  d.value = DONE; m.value = END.mat * 100; c.value = END.conv * 100;
  const upd = instant => {
    const done = +d.value, end = TOTAL_UNITS - done, pm = +m.value / 100, pc = +c.value / 100;
    const euM = done + end * pm, euC = done + end * pc, cm = (BEG.mat + ADDED.mat) / euM, cc = (BEG.conv + ADDED.conv) / euC;
    const out = done * (cm + cc), wip = end * pm * cm + end * pc * cc;
    $('#as-d-o').textContent = num(done); $('#as-m-o').textContent = Math.round(pm * 100) + '%'; $('#as-c-o').textContent = Math.round(pc * 100) + '%';
    $('#as-eu').textContent = num(euM) + ' · ' + num(euC);
    countTo($('#as-cpu'), cm + cc, instant, cents4); countTo($('#as-out'), out, instant); countTo($('#as-wip'), wip, instant);
    gsap.to('#as-so', { width: out / TOTAL_COST * 100 + '%', duration: instant ? 0 : D(.4) }); gsap.to('#as-sw', { width: wip / TOTAL_COST * 100 + '%', duration: instant ? 0 : D(.4) });
    $('#as-sw').textContent = wip / TOTAL_COST > .07 ? 'WIP' : '';
    $('#as-f').innerHTML = `${usd(out)} transferred + ${usd(wip)} ending = <b>${usd(out + wip)}</b> = ${usd(TOTAL_COST)} to account for ✓` +
      (end ? ` · ${num(end)} gallons left, ${Math.round(pm * 100)}% / ${Math.round(pc * 100)}% done` : ' · nothing left in process');
  };
  d.oninput = m.oninput = c.oninput = () => upd(false);
  upd(true);
};

/* ---------- 4.5 Spot the slip ---------- */
Sims.recon = s => {
  const ROUNDS = [
    { lines: ['Transferred out: 34,000 × $4.00 = $136,000', 'Ending WIP: 6,000 × $4.00 = $24,000', 'Total assigned: $160,000'], bad: 1, chk: '$160,000 ≠ $152,500 to account for',
      why: 'Ending inventory is only partly done. Use its equivalent units: 4,800 × $2.50 + 3,000 × $1.50 = $16,500.' },
    { lines: ['Equivalent units, materials: 38,800', 'Materials cost per EU: $88,000 ÷ 38,800 = $2.27', 'Conversion cost per EU: $55,500 ÷ 37,000 = $1.50'], bad: 1, chk: 'per gallon $3.77, not $4.00',
      why: 'Weighted-average adds beginning inventory\'s cost: ($9,000 + $88,000) ÷ 38,800 = $2.50.' },
    { lines: ['Equivalent units, conversion: 34,000 + 6,000 = 40,000', 'Conversion cost: $3,600 + $51,900 = $55,500', 'Units completed and transferred: 34,000'], bad: 0, chk: 'conversion $1.39 per EU, not $1.50',
      why: 'Ending gallons are only 50% converted: 34,000 + 6,000 × 50% = 37,000.' },
    { lines: ['Materials cost per EU: $97,000 ÷ 38,800 = $2.50', 'Conversion cost per EU: $55,500 ÷ 38,800 = $1.43', 'Units to account for: 4,000 + 36,000 = 40,000'], bad: 1, chk: 'per gallon $3.93, not $4.00',
      why: 'Each category is divided by its own equivalent units: conversion uses 37,000, so $55,500 ÷ 37,000 = $1.50.' },
  ];
  const box = $('#rc-lines', s), fb = $('#rc-fb', s);
  let r, first, missed, locked;
  const round = () => {
    if (r >= ROUNDS.length) {
      box.innerHTML = ''; $('#rc-count').textContent = 'Finished';
      fb.innerHTML = `<b class="pos">All four fixed: ${first} on the first try.</b> Use equivalent units for ending inventory, include beginning cost, and divide each category by its own units.`;
      return;
    }
    const R = ROUNDS[r];
    locked = false;
    $('#rc-count').textContent = `Report ${r + 1} of ${ROUNDS.length}`;
    box.innerHTML = R.lines.map((l, i) => `<button type="button" data-i="${i}"><span>${l}</span></button>`).join('') + `<div class="chk">Check: ${R.chk}</div>`;
    if (!RM) gsap.from(box.children, { y: 12, autoAlpha: 0, duration: .35, stagger: .06 });
    $$('button', box).forEach(b => {
      b.onclick = () => {
        if (locked) return;
        if (+b.dataset.i !== R.bad) { missed = true; b.classList.add('wrong'); shake(b); fb.innerHTML = '<b class="neg">That line is fine.</b> Recompute each line, and look for the one that breaks a rule.'; return; }
        if (!missed) first++;
        missed = false; locked = true; b.classList.add('right'); pulse(b);
        fb.innerHTML = `<b class="pos">Found it.</b> ${R.why}`;
        r++;
        if (RM) round(); else gsap.delayedCall(1.6, round);
      };
    });
  };
  $('#rc-reset', s).onclick = () => { gsap.killTweensOf(round); r = 0; first = 0; missed = false; fb.textContent = 'Which line is wrong?'; round(); };
  $('#rc-reset', s).onclick();
};

/* ---------- 4.6 Job-order, process or operation? ---------- */
Sims.whichsys = s => sorter(s, {
  items: [
    ['Custom wedding cakes', 'job', 'Every cake is designed for one couple.'],
    ['Bottled-water plant', 'proc', 'Identical bottles, nonstop.'],
    ['Shoe factory running batches of different styles through the same cutting and stitching', 'op', 'Different materials per batch, same operations for every pair.'],
    ['Oil refinery', 'proc', 'A continuous flow of the same product.'],
    ['Home builder', 'job', 'Each house is built to its own plans.'],
    ['Clothing maker sewing batches of different shirt designs on the same line', 'op', 'Fabric differs by batch; the sewing steps are the same.'],
    ['Flour mill', 'proc', 'Tons of identical flour.'],
    ['Auto repair shop', 'job', 'Each car comes in with a different problem.'],
    ['Furniture plant making batches of oak and pine chairs on the same machines', 'op', 'Wood is traced to each batch; machining is the same per chair.'],
  ],
  names: { job: 'job-order', proc: 'process', op: 'operation costing' },
  card: $('#ws-card', s), fb: $('#ws-fb', s), count: $('#ws-count', s), reset: $('#ws-reset', s), noun: 'Business', intro: 'Read the business, then tap the costing system it fits.',
  hint: 'Is every order unique? Is every unit identical? Or do different batches share the same steps?',
  done: 'Unique orders → job-order. Identical units → process. Different batches through the same operations → operation costing.',
});

SIEDeck.start({
  sections: { intro: 'Intro', '4.1': 'Process vs job-order', '4.2': 'Recording the flow', '4.3': 'Equivalent units', '4.4': 'Cost per unit', '4.5': 'Assign & reconcile', '4.6': 'Operation costing', end: 'Review' },
  sims: Sims,
  hooks: Hooks,
});
})();
