/* Chapter 2 learning deck: simulators. The slide engine is assets/deck.js; the step animations
   declared in learn.html (data-at, data-move, data-count) run through assets/steps.js. */
(() => {
const { $, $$, RM, D, clamp, num, usd, pressSeg } = SIEDeck;
const money = n => Number.isInteger(Math.round(n * 100) / 100) ? usd(n) : '$' + num(n, 2);

const POHR = 8, WAGE = 20;            // plantwide rate per direct labor-hour, wage per hour
const CUT = 7.5, FIN = 2.5;           // departmental rates: Cutting per machine-hour, Finishing per labor-hour
const Hooks = SIESteps.hooks(['title', 'jobs', 'trace2', 'ohcloud', 'why', 'apply', 'unitcost', 'depts', 'service']);
const Sims = {};

/* fly an element toward another, then call done (instant with reduced motion) */
function flyTo(el, target, done) {
  if (RM) { done(); return; }
  const a = el.getBoundingClientRect(), b = target.getBoundingClientRect();
  gsap.to(el, { x: (b.left + b.width / 2) - (a.left + a.width / 2), y: (b.top + b.height / 2) - (a.top + a.height / 2), scale: .3, autoAlpha: 0, duration: .45, ease: 'power2.in', onComplete: done });
}
const pulse = el => { if (!RM) gsap.fromTo(el, { scale: 1 }, { scale: 1.05, duration: .15, yoyo: true, repeat: 1 }); };
const shake = el => { if (!RM) gsap.fromTo(el, { x: -10 }, { x: 0, duration: .6, ease: 'elastic.out(1,.25)' }); };
/* count a dollar figure from its last value to v; a new count (or a reset) replaces one still running */
function countTo(el, v, instant, dur = .6) {
  const o = { v: +(el.dataset.v || 0) };
  el.dataset.v = v;
  if (el._tw) el._tw.kill();
  if (instant || RM) { el._tw = null; el.textContent = usd(v); return; }
  el._tw = gsap.to(o, { v, duration: dur, ease: 'power2.out', onUpdate: () => { el.textContent = usd(Math.round(o.v)); }, onComplete: () => { el.textContent = usd(v); } });
}

/* ---------- 2.1 Job-order or process? ---------- */
Sims.jobornot = s => {
  const ITEMS = [
    ['Custom home builder', 'j', 'Every house is built to its own plans.'],
    ['Breakfast cereal maker', 'p', 'The same cereal pours out all day.'],
    ['Wedding cake bakery', 'j', 'Each cake is designed for one couple.'],
    ['Paint factory', 'p', 'Gallons of the same paint, continuously.'],
    ['Print shop making event posters', 'j', 'Each poster order is different.'],
    ['Bottled-water plant', 'p', 'Identical bottles, nonstop.'],
    ['Auto repair shop', 'j', 'Each car comes in with a different problem.'],
    ['Oil refinery', 'p', 'A continuous flow of the same product.'],
    ['Architecture firm', 'j', 'Each building design is a separate project.'],
    ['Cement plant', 'p', 'Tons of identical cement.'],
  ];
  const card = $('#jo-card', s), fb = $('#jo-fb', s), bins = { j: $('#jo-job', s), p: $('#jo-proc', s) };
  let order, at, n, busy;
  const show = () => {
    busy = false; gsap.killTweensOf(card);
    if (at >= ITEMS.length) { card.textContent = 'All 10 sorted ✓'; $('#jo-count').textContent = 'Finished'; fb.innerHTML = '<b class="pos">Done.</b> Unique orders → job-order costing. Identical units → process costing.'; }
    else { card.textContent = ITEMS[order[at]][0]; $('#jo-count').textContent = `Business ${at + 1} of 10`; }
    if (RM) gsap.set(card, { x: 0, y: 0, scale: 1, autoAlpha: 1 });
    else gsap.fromTo(card, { x: 0, y: -30, scale: .9, autoAlpha: 0 }, { x: 0, y: 0, scale: 1, autoAlpha: 1, duration: .4, ease: 'back.out(2)' });
  };
  const pick = k => {
    if (busy || at >= ITEMS.length) return;
    const [name, right, why] = ITEMS[order[at]];
    if (k !== right) { fb.innerHTML = `<b class="neg">Not quite.</b> ${why}`; shake(card); return; }
    n[k]++; $(k === 'j' ? '#jo-jn' : '#jo-pn').textContent = n[k];
    fb.innerHTML = `<b class="pos">Yes:</b> ${name} → ${k === 'j' ? 'job-order' : 'process'}. ${why}`;
    at++; busy = true; pulse(bins[k]);
    flyTo(card, bins[k], show);
  };
  bins.j.onclick = () => pick('j'); bins.p.onclick = () => pick('p');
  $('#jo-reset', s).onclick = () => { order = ITEMS.map((x, i) => i).sort(() => Math.random() - .5); at = 0; n = { j: 0, p: 0 }; $('#jo-jn').textContent = 0; $('#jo-pn').textContent = 0; fb.textContent = 'Is every order different? Then it\'s job-order. Tap a side.'; show(); };
  $('#jo-reset', s).onclick();
};

/* ---------- 2.1 Post documents to job cost sheets ---------- */
Sims.jobsheet = s => {
  const DOCS = [
    ['dm', 214, 'Requisition #41', 'Aluminum panels', 1800],
    ['dm', 215, 'Requisition #42', 'Vinyl lettering', 350],
    ['dl', 214, 'Time ticket', '120 h × $20', 2400],
    ['dm', 214, 'Requisition #43', 'LED modules', 800],
    ['dl', 216, 'Time ticket', '300 h × $20', 6000],
    ['dl', 215, 'Time ticket', '45 h × $20', 900],
    ['dm', 216, 'Requisition #44', 'Steel posts', 4200],
  ];
  const JOBS = [214, 215, 216], box = $('#js-docs', s), sheets = $('#js-sheets', s), fb = $('#js-fb', s);
  let sel = null, tot;
  sheets.innerHTML = JOBS.map(j => `<button type="button" class="sheet" data-j="${j}"><span class="h">Job ${j}</span>
    <span class="ln"><span>Direct materials</span><span data-l="dm">$0</span></span>
    <span class="ln"><span>Direct labor</span><span data-l="dl">$0</span></span>
    <span class="ln tot"><span>So far</span><span data-l="t">$0</span></span></button>`).join('');
  const setLine = (j, l, v) => countTo($(`.sheet[data-j="${j}"] [data-l="${l}"]`, s), v);
  const deal = () => {
    sel = null; tot = {}; JOBS.forEach(j => { tot[j] = { dm: 0, dl: 0 }; ['dm', 'dl', 't'].forEach(l => countTo($(`.sheet[data-j="${j}"] [data-l="${l}"]`, s), 0, true)); });
    $$('.sheet', sheets).forEach(x => x.classList.remove('hot'));
    box.innerHTML = DOCS.map((d, i) => `<button type="button" class="doc-card ${d[0]}" data-i="${i}"><span class="k">${d[2]} · Job ${d[1]}</span><span>${d[3]}</span><b class="mono">${usd(d[4])}</b></button>`).join('');
    if (!RM) gsap.from($$('.doc-card', box), { y: -20, autoAlpha: 0, duration: .4, stagger: .05, ease: 'back.out(2)' });
    $$('.doc-card', box).forEach(c => c.onclick = () => {
      $$('.doc-card', box).forEach(x => x.classList.toggle('sel', x === c && sel !== c));
      sel = sel === c ? null : c;
      $$('.sheet', sheets).forEach(x => x.classList.toggle('hot', !!sel));
      if (sel) fb.textContent = `Which job cost sheet does "${DOCS[+c.dataset.i][2]}" belong on? Read the job number.`;
    });
    fb.textContent = 'Pick a document to start.';
  };
  $$('.sheet', sheets).forEach(sh => sh.onclick = () => {
    if (!sel) { fb.textContent = 'Pick a document first.'; return; }
    const d = DOCS[+sel.dataset.i], j = +sh.dataset.j;
    if (d[1] !== j) { fb.innerHTML = `<b class="neg">Wrong job.</b> This document says Job ${d[1]}.`; shake(sel); return; }
    const doc = sel, left = $$('.doc-card:not([disabled])', box).length - 1;
    sel = null; doc.disabled = true; doc.classList.remove('sel'); $$('.sheet', sheets).forEach(x => x.classList.remove('hot'));
    flyTo(doc, sh, () => doc.remove());
    tot[j][d[0]] += d[4];
    setLine(j, d[0], tot[j][d[0]]); setLine(j, 't', tot[j].dm + tot[j].dl); pulse(sh);
    fb.innerHTML = `<b class="pos">Posted:</b> ${d[0] === 'dm' ? 'direct materials' : 'direct labor'} of ${usd(d[4])} to Job ${j}. ` +
      (left ? `${left} to go.` : '<b>All posted.</b> Job 214 has $2,600 of materials and $2,400 of labor. Overhead comes next, through a rate.');
  });
  $('#js-reset', s).onclick = deal;
  deal();
};

/* ---------- 2.2 Build the predetermined rate ---------- */
Sims.pohr = s => {
  const FIXED = 300000, VRATE = 2, BASE = 50000;
  const b = $('#pr-base', s), f = $('#pr-fixed', s), v = $('#pr-var', s);
  b.value = BASE; f.value = FIXED; v.value = VRATE;
  const upd = () => {
    const base = +b.value, fixed = +f.value, vr = +v.value, total = fixed + vr * base, rate = total / base;
    $('#pr-base-o').textContent = num(base); $('#pr-fixed-o').textContent = usd(fixed); $('#pr-var-o').textContent = money(vr);
    $('#pr-total').textContent = usd(total); $('#pr-hours').textContent = num(base); $('#pr-rate').textContent = '$' + num(rate, 2);
    gsap.to('#pr-fs', { width: fixed / total * 100 + '%', duration: D(.4) }); gsap.to('#pr-vs', { width: vr * base / total * 100 + '%', duration: D(.4) });
    $('#pr-f').innerHTML = `${usd(fixed)} + ${money(vr)} × ${num(base)} = ${usd(total)} · ${usd(total)} ÷ ${num(base)} = <b>$${num(rate, 2)} per direct labor-hour</b>`;
    if (!RM) gsap.fromTo('#pr-rate', { scale: 1.12 }, { scale: 1, duration: .3, ease: 'power2.out' });
  };
  [b, f, v].forEach(e => { e.oninput = upd; }); upd();
};

/* ---------- 2.3 Apply overhead to three jobs ---------- */
Sims.applyoh = s => {
  const btns = $$('#ap-btns button', s), coins = $('#ap-coins', s);
  const show = (h, name) => {
    const oh = POHR * h;
    gsap.to('#ap-bar', { scaleX: h / 300, transformOrigin: '0% 50%', duration: D(.6), ease: 'power3.out' });
    $('#ap-h').textContent = h + ' h';
    coins.innerHTML = Array.from({ length: Math.floor(h / 10) }, () => '<span class="coin">$80</span>').join('') + (h % 10 ? `<span class="coin part">$${(h % 10) * POHR}</span>` : '');
    if (!RM) gsap.from(coins.children, { y: -30, autoAlpha: 0, scale: .4, duration: .35, stagger: .03, ease: 'back.out(2)' });
    const el = $('#ap-oh'); el.dataset.v = 0; countTo(el, oh, false, .9);
    $('#ap-f').innerHTML = `$8 × ${h} hours = <b>${usd(oh)}</b> applied to ${name} · each coin = 10 hours × $8` + (h % 10 ? `; the small coin is ${h % 10} hours` : '');
  };
  btns.forEach(b => b.onclick = () => { pressSeg(btns, b); show(+b.dataset.h, b.textContent.split(' · ')[0]); });
  show(120, 'Job 214');
};

/* ---------- 2.4 Add up the job ---------- */
Sims.jobcost = s => {
  const dm = $('#jc-dm', s), h = $('#jc-h', s), u = $('#jc-u', s), MAX = 6000 + 300 * (WAGE + POHR);
  const upd = () => {
    const m = +dm.value, hours = +h.value, units = +u.value, dl = hours * WAGE, oh = hours * POHR, total = m + dl + oh;
    $('#jc-dm-o').textContent = usd(m); $('#jc-h-o').textContent = hours; $('#jc-u-o').textContent = units;
    [['#jc-s1', m, 'DM'], ['#jc-s2', dl, 'DL'], ['#jc-s3', oh, 'MOH']].forEach(([id, v, l]) => { gsap.to(id, { width: v / MAX * 100 + '%', duration: D(.4), ease: 'power2.out' }); $(id).textContent = v / MAX > .06 ? l : ''; });
    $('#jc-total').textContent = usd(total); $('#jc-unit').textContent = '$' + num(total / units, 2);
    $('#jc-f').innerHTML = `${usd(m)} + ${hours} × $20 + ${hours} × $8 = <b>${usd(total)}</b> · ÷ ${units} sign${units === 1 ? '' : 's'} = <b>${money(total / units)}</b> each`;
  };
  [dm, h, u].forEach(e => { e.oninput = upd; }); upd();
};

/* ---------- 2.5 Plantwide vs departmental ---------- */
Sims.deptrates = s => {
  const JOBS = {
    214: { dm: 2600, cutMH: 80, cutDLH: 30, finDLH: 90 },
    220: { dm: 3000, cutMH: 400, cutDLH: 20, finDLH: 40 },
  };
  const btns = $$('#dr-btns button', s), mk = $('#dr-mk', s);
  let j = 214;
  const upd = () => {
    const J = JOBS[j], dlh = J.cutDLH + J.finDLH, base = J.dm + dlh * WAGE, m = +mk.value / 100;
    const pOH = dlh * POHR, dOH = J.cutMH * CUT + J.finDLH * FIN, pTot = base + pOH, dTot = base + dOH;
    $('#dr-cut').textContent = `${J.cutMH} machine-hours · ${J.cutDLH} labor-hours`;
    $('#dr-fin').textContent = `${J.finDLH} labor-hours`;
    $('#dr-mk-o').textContent = Math.round(m * 100) + '%';
    $('#dr-p-oh').textContent = `Overhead ${usd(pOH)} (${dlh} h × $8)`;
    $('#dr-d-oh').textContent = `Overhead ${usd(dOH)} (${J.cutMH} × $7.50 + ${J.finDLH} × $2.50)`;
    $('#dr-p-tot').textContent = `Job cost ${usd(pTot)}`; $('#dr-d-tot').textContent = `Job cost ${usd(dTot)}`;
    $('#dr-p-price').textContent = `Price ${money(pTot * (1 + m))}`; $('#dr-d-price').textContent = `Price ${money(dTot * (1 + m))}`;
    const gap = pOH - dOH;
    $('#dr-fb').innerHTML = gap > 0
      ? `Job ${j} needs little machine time, so the plantwide rate <b>overcosts</b> it by ${usd(gap)}. Its bid would be too high, and the shop could lose the work.`
      : `Job ${j} is machine-heavy, so the plantwide labor-hour rate <b>undercosts</b> it by ${usd(-gap)}. ` +
        (pTot * (1 + m) < dTot ? `Its price of ${money(pTot * (1 + m))} is below the true cost of ${usd(dTot)}: the shop would win the bid and lose money on it.`
          : `Its price of ${money(pTot * (1 + m))} still covers the true cost of ${usd(dTot)}, but the shop earns far less than it planned.`);
    if (!RM) gsap.fromTo($$('.vs2 .card', s), { y: 8, autoAlpha: .4 }, { y: 0, autoAlpha: 1, duration: .4, stagger: .08 });
  };
  btns.forEach(b => b.onclick = () => { j = +b.dataset.j; pressSeg(btns, b); upd(); });
  mk.oninput = upd; upd();
};

/* ---------- 2.6 Job cost sheets behind the balances ---------- */
Sims.ledger = s => {
  const JOBS = [[301, 8000, 2], [302, 5000, 2], [303, 7000, 2], [304, 6000, 1], [305, 3000, 1], [306, 4000, 0]];
  const cols = $$('.col', s), fb = $('#lg-fb', s), ACT = ['Finish →', 'Sell →', '↺ replay'];
  const totals = instant => [0, 1, 2].forEach(k => countTo($('#lg-t' + k), JOBS.filter(x => x[2] === k).reduce((a, x) => a + x[1], 0), instant));
  const render = (moved, from) => {
    cols.forEach(c => { $('.lg-list', c).innerHTML = ''; });
    JOBS.forEach((x, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'jcard'; b.dataset.i = i;
      b.innerHTML = `<span>Job ${x[0]} · <span class="mono">${usd(x[1])}</span></span><span class="act">${ACT[x[2]]}</span>`;
      $('.lg-list', cols[x[2]]).appendChild(b);
      b.onclick = () => {
        const r = b.getBoundingClientRect();
        x[2] = (x[2] + 1) % 3; render(i, r); totals(false);
        fb.innerHTML = x[2] === 1 ? `Job ${x[0]} is finished: its ${usd(x[1])} moves from work in process to <b>finished goods</b>.`
          : x[2] === 2 ? `Job ${x[0]} is sold: its ${usd(x[1])} leaves the balance sheet and becomes <b>cost of goods sold</b>.`
            : `Job ${x[0]} is back in work in process so you can replay it.`;
      };
      if (moved === i && from && !RM) { const t = b.getBoundingClientRect(); gsap.fromTo(b, { x: from.left - t.left, y: from.top - t.top }, { x: 0, y: 0, duration: .55, ease: 'power3.inOut' }); }
    });
  };
  render(); totals(true);
};

/* ---------- 2.6 Under- or overapplied ---------- */
Sims.underover = s => {
  const APPLIED = 392000, x = $('#uo-x', s), MAX = 440000;
  const upd = instant => {
    const actual = +x.value, diff = actual - APPLIED;
    $('#uo-x-o').textContent = usd(actual); $('#uo-act').textContent = usd(actual);
    gsap.to('#uo-a', { scaleX: APPLIED / MAX, transformOrigin: '0% 50%', duration: instant ? 0 : D(.4) });
    gsap.to('#uo-b', { scaleX: actual / MAX, transformOrigin: '0% 50%', duration: instant ? 0 : D(.4) });
    const res = $('#uo-res'), cogs = $('#uo-cogs');
    if (diff === 0) { res.textContent = 'Exactly applied'; res.className = 'v'; cogs.textContent = 'no change'; $('#uo-fb').textContent = 'Applied equals actual, so nothing needs adjusting. That almost never happens in real life.'; }
    else if (diff > 0) { res.textContent = `${usd(diff)} underapplied`; res.className = 'v neg'; cogs.textContent = `↑ + ${usd(diff)}`; $('#uo-fb').textContent = `Jobs were charged ${usd(diff)} too little, so cost of goods sold goes up by ${usd(diff)}.`; }
    else { res.textContent = `${usd(-diff)} overapplied`; res.className = 'v pos'; cogs.textContent = `↓ − ${usd(-diff)}`; $('#uo-fb').textContent = `Jobs were charged ${usd(-diff)} too much, so cost of goods sold comes down by ${usd(-diff)}.`; }
    if (!instant && !RM) gsap.fromTo(cogs, { y: diff > 0 ? 10 : -10, autoAlpha: .3 }, { y: 0, autoAlpha: 1, duration: .35 });
  };
  x.oninput = () => upd(false); upd(true);
};

SIEDeck.start({
  sections: { intro: 'Intro', '2.1': 'Job-order costing', '2.2': 'Overhead rate', '2.3': 'Applying overhead', '2.4': 'Job cost', '2.5': 'Multiple rates', '2.6': 'The statements', end: 'Review' },
  sims: Sims,
  hooks: Hooks,
});
})();
