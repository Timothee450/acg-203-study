/* Chapter 5 learning deck: simulators. The slide engine is assets/deck.js; the step animations
   declared in learn.html (data-at, data-move, data-count) run through assets/steps.js. */
(() => {
const { $, $$, RM, D, num, usd, pressSeg } = SIEDeck;

/* Brightwick Candle Co., one month */
const PRICE = 25, VC = 15, FIXED = 40000;      // per candle, per candle, per month
const UNITS = 5000;                             // candles sold this month
const MIX = { candles: { sales: 120000, cmr: .4 }, diffusers: { sales: 80000, cmr: .6 }, fixed: 72000 };
const Hooks = SIESteps.hooks(['unitcm', 'bucket', 'ratio', 'lever', 'beformula', 'mos', 'targetkey', 'incremental', 'graphsteps', 'mixshift', 'recap']);
const Sims = {};

const pct = r => (Math.round(r * 1000) / 10) + '%';
const signed = v => (v > 0 ? '+' : v < 0 ? '−' : '') + usd(Math.abs(v));
const paren = v => v < 0 ? '(' + usd(-v).slice(1) + ')' : usd(v);
/* count a figure from its last value to v; a new count (or a reset) replaces one still running */
function countTo(el, v, instant, fmt = usd) {
  const o = { v: +(el.dataset.v || 0) };
  el.dataset.v = v;
  if (el._tw) el._tw.kill();
  if (instant || RM) { el._tw = null; el.textContent = fmt(v); return; }
  el._tw = gsap.to(o, { v, duration: .5, ease: 'power2.out', onUpdate: () => { el.textContent = fmt(Math.round(o.v)); }, onComplete: () => { el.textContent = fmt(v); } });
}
const bar = (sel, frac, instant) => gsap.to(sel, { width: Math.max(0, Math.min(1, frac)) * 100 + '%', duration: instant ? 0 : D(.4), ease: 'power2.out' });
const tone = (el, v) => { el.classList.toggle('pos', v > 0); el.classList.toggle('neg', v < 0); };

/* ---------- 5.1 Contribution income statement ---------- */
Sims.cmstmt = s => {
  const q = $('#cs-q', s);
  q.value = UNITS;
  const upd = instant => {
    const n = +q.value, sales = n * PRICE, ve = n * VC, cm = sales - ve, noi = cm - FIXED;
    $('#cs-q-o').textContent = num(n);
    countTo($('#cs-s'), sales, instant); countTo($('#cs-v'), -ve, instant, paren); countTo($('#cs-cm'), cm, instant);
    const e = $('#cs-noi'); countTo(e, noi, instant, paren); tone(e, noi);
    $('#cs-fb').textContent = `Profit = $10 × ${num(n)} − $40,000 = ${noi < 0 ? '−' + usd(-noi) : usd(noi)}. ` +
      (noi < 0 ? `A loss: ${num(Math.ceil((FIXED - cm) / (PRICE - VC)))} more candles to break even.` : noi === 0 ? 'Exactly break-even.' : 'Each extra candle adds $10.');
  };
  q.oninput = () => upd(false); upd(true);
};

/* ---------- 5.2 Two cost structures ---------- */
Sims.leverage = s => {
  const x = $('#lv-x', s);
  const CO = [{ f: FIXED, v: VC, id: 'a' }, { f: 15000, v: 20, id: 'b' }];   // both earn $10,000 at 5,000 candles
  const upd = instant => {
    const ch = +x.value / 100, n = UNITS * (1 + ch);
    $('#lv-x-o').textContent = (ch > 0 ? '+' : '') + Math.round(ch * 100) + '%';
    const res = CO.map(c => {
      const cm = (PRICE - c.v) * n, noi = cm - c.f, base = (PRICE - c.v) * UNITS - c.f, dol = (PRICE - c.v) * UNITS / base;
      const el = $('#lv-' + c.id); countTo(el, noi, instant, v => v < 0 ? '−' + usd(-v) : usd(v));
      $('#lv-' + c.id + 'p').textContent = `${noi >= base ? '+' : '−'}${Math.round(Math.abs(noi - base) / base * 100)}% · DOL ${num(dol, dol % 1 ? 1 : 0)}`;
      return noi;
    });
    $('#lv-fb').textContent = ch === 0 ? 'Both earn $10,000 right now. The difference shows up when sales move.'
      : ch > 0 ? `Sales up ${Math.round(ch * 100)}%: Brightwick's profit jumps ${usd(res[0] - 10000)}, the rival's only ${usd(res[1] - 10000)}. High fixed costs = high leverage.`
        : `Sales down ${Math.round(-ch * 100)}%: Brightwick's profit falls ${usd(10000 - res[0])}, the rival's only ${usd(10000 - res[1])}. Leverage cuts both ways.`;
  };
  x.oninput = () => upd(false); upd(true);
};

/* ---------- 5.3 Break-even ---------- */
Sims.breakeven = s => {
  const p = $('#be-p', s), v = $('#be-v', s), f = $('#be-f', s);
  p.value = PRICE; v.value = VC; f.value = FIXED;
  const upd = instant => {
    const P = +p.value, V = +v.value, F = +f.value, cm = P - V;
    $('#be-p-o').textContent = usd(P); $('#be-v-o').textContent = usd(V); $('#be-f-o').textContent = usd(F);
    if (cm <= 0) {
      $('#be-cm').textContent = usd(cm) + ' · —'; $('#be-mos').textContent = '—';
      ['#be-u', '#be-s'].forEach(id => { const e = $(id); if (e._tw) e._tw.kill(); e._tw = null; e.dataset.v = 0; });
      $('#be-u').textContent = 'Never'; $('#be-s').textContent = '—';
      bar('#be-bar', 1, instant);
      $('#be-fb').textContent = 'The price doesn\'t cover the variable cost, so every candle adds to the loss. There is no break-even point.';
      return;
    }
    const u = F / cm, mos = UNITS - u;
    $('#be-cm').textContent = usd(cm) + ' · ' + pct(cm / P);
    countTo($('#be-u'), Math.ceil(u), instant, num); countTo($('#be-s'), Math.ceil(u) * P, instant);
    $('#be-mos').textContent = mos >= 0 ? 'MOS ' + num(Math.floor(mos)) : 'short ' + num(Math.ceil(-mos));
    bar('#be-bar', u / UNITS, instant);
    $('#be-fb').textContent = `${usd(F)} ÷ ${usd(cm)} = ${num(Math.ceil(u))} candles. ` +
      (mos >= 0 ? `Brightwick sells 5,000, so it's ${num(Math.floor(mos))} candles above break-even.` : `At 5,000 candles it would lose money: ${num(Math.ceil(-mos))} short of break-even.`);
  };
  [p, v, f].forEach(e => { e.oninput = () => upd(false); }); upd(true);
};

/* ---------- 5.4 Target profit ---------- */
Sims.target = s => {
  const t = $('#tg-t', s), cm = PRICE - VC, cmr = cm / PRICE;
  const upd = instant => {
    const T = +t.value, u = (FIXED + T) / cm, sales = (FIXED + T) / cmr;
    $('#tg-t-o').textContent = usd(T);
    countTo($('#tg-u'), Math.ceil(u), instant, num); countTo($('#tg-s'), sales, instant);
    const d = Math.ceil(u) - UNITS; $('#tg-d').textContent = (d > 0 ? '+' : d < 0 ? '−' : '') + num(Math.abs(d));
    bar('#tg-sf', FIXED / (FIXED + T), instant); bar('#tg-st', T / (FIXED + T), instant);
    $('#tg-sf').textContent = 'fixed $40,000'; $('#tg-st').textContent = T / (FIXED + T) > .15 ? 'target ' + usd(T) : '';
    $('#tg-f').innerHTML = `($40,000 + ${usd(T)}) ÷ $10 = <b>${num(Math.ceil(u))} candles</b> · ÷ 40% = <b>${usd(sales)}</b>` + (T === 0 ? ' (that\'s break-even)' : '');
  };
  t.oninput = () => upd(false); upd(true);
};

/* ---------- 5.5 What-if ---------- */
Sims.whatif = s => {
  const ins = { p: $('#wi-p', s), v: $('#wi-v', s), f: $('#wi-f', s), q: $('#wi-q', s) };
  const PRESET = { a: { p: 0, v: 0, f: 6000, q: 16 }, b: { p: -2, v: 0, f: 0, q: 30 }, c: { p: 0, v: 1, f: -5000, q: 10 }, 0: { p: 0, v: 0, f: 0, q: 0 } };
  const NOTE = { a: '(a) $6,000 of ads, sales up $20,000 (800 candles).', b: '(b) Price cut to $23, volume up 30%.', c: '(c) $5,000 of salary becomes an extra $1 commission, volume up 10%.' };
  let tag = '';
  const upd = instant => {
    const dp = +ins.p.value, dv = +ins.v.value, df = +ins.f.value, dq = +ins.q.value / 100;
    const cm = (PRICE + dp) - (VC + dv), n = Math.round(UNITS * (1 + dq)), noi = cm * n - (FIXED + df), d = noi - 10000;
    $('#wi-p-o').textContent = (dp > 0 ? '+' : dp < 0 ? '−' : '') + '$' + num(Math.abs(dp), dp % 1 ? 2 : 0);
    $('#wi-v-o').textContent = (dv > 0 ? '+' : dv < 0 ? '−' : '') + '$' + num(Math.abs(dv), dv % 1 ? 2 : 0);
    $('#wi-f-o').textContent = signed(df); $('#wi-q-o').textContent = (dq > 0 ? '+' : '') + Math.round(dq * 100) + '%';
    $('#wi-cm').textContent = '$' + num(cm, 2); $('#wi-u').textContent = num(n);
    countTo($('#wi-noi'), noi, instant, v => v < 0 ? '−' + usd(-v) : usd(v));
    const de = $('#wi-d'); de.textContent = signed(d); tone(de, d);
    $('#wi-fb').innerHTML = (tag ? `<b>${NOTE[tag]}</b> ` : '') +
      `CM ${usd(cm * n)} (${signed(cm * n - 50000)}) − fixed ${usd(FIXED + df)} = NOI ${noi < 0 ? '−' + usd(-noi) : usd(noi)}. ` +
      (d > 0 ? 'Worth doing.' : d < 0 ? 'Profit falls: skip it.' : 'No change in profit.');
  };
  Object.values(ins).forEach(e => { e.oninput = () => { tag = ''; upd(false); }; });
  $$('[data-p]', s).forEach(b => {
    b.onclick = () => { const P = PRESET[b.dataset.p]; Object.keys(ins).forEach(k => { ins[k].value = P[k]; }); tag = b.dataset.p === '0' ? '' : b.dataset.p; upd(false); };
  });
  upd(true);
};

/* ---------- 5.5 Sales commissions ---------- */
Sims.commission = s => {
  const P = { g: { price: 60, cm: 12, name: 'Gift sets' }, j: { price: 40, cm: 18, name: 'Large jars' } }, N = 200;
  const btns = $$('#cm-btns button', s);
  let m = 's';
  const upd = instant => {
    const com = k => m === 's' ? P[k].price * .1 : P[k].cm * .3;
    const push = com('g') > com('j') ? 'g' : 'j';
    $('#cm-gc').textContent = '$' + num(com('g'), 2); $('#cm-jc').textContent = '$' + num(com('j'), 2);
    $('#cm-g').classList.toggle('on', push === 'g'); $('#cm-j').classList.toggle('on', push === 'j');
    $('#cm-g').style.borderColor = push === 'g' ? 'var(--accent)' : ''; $('#cm-j').style.borderColor = push === 'j' ? 'var(--accent)' : '';
    const earn = usd(N * com(push)), keep = usd(N * (P[push].cm - com(push)));
    $('#cm-fb').innerHTML = `The salesperson pushes <b>${P[push].name.toLowerCase()}</b>: 200 sales earn them ${earn}, and the company keeps <b>${keep}</b> of contribution margin after commissions. ` +
      (m === 's' ? 'Paid on sales, they chase the pricier gift set, even though the jar earns $6 more contribution margin per sale before commission.'
        : 'Paid on contribution margin, what earns the salesperson most is also what earns the company most.');
  };
  btns.forEach(b => { b.onclick = () => { m = b.dataset.m; pressSeg(btns, b); upd(false); }; });
  upd(true);
};

/* ---------- 5.6 Interactive CVP graph ---------- */
Sims.cvpgraph = s => {
  const q = $('#gr-q', s), p = $('#gr-p', s), X = u => 60 + u / 8000 * 500, Y = d => 220 - d / 240000 * 200;
  p.value = PRICE; q.value = UNITS;
  const set = (id, a) => gsap.set('#' + id, { attr: a });
  const upd = () => {
    const n = +q.value, P = +p.value, sales = n * P, exp = FIXED + VC * n, noi = sales - exp, be = FIXED / (P - VC);
    $('#gr-q-o').textContent = num(n); $('#gr-p-o').textContent = usd(P);
    set('gr-sl', { d: `M60 220 L560 ${Y(8000 * P).toFixed(1)}` });
    set('gr-mk', { x1: X(n), x2: X(n) });
    set('gr-gap', { x1: X(n), x2: X(n), y1: Y(sales), y2: Y(exp) });
    $('#gr-gap').setAttribute('class', noi >= 0 ? 's-blue' : 's-red');
    set('gr-be', { cx: X(be), cy: Y(be * P) });
    countTo($('#gr-s'), sales, true); countTo($('#gr-e'), exp, true);
    const e = $('#gr-noi'); e.textContent = noi < 0 ? '−' + usd(-noi) : usd(noi); tone(e, noi);
    $('#gr-fb').textContent = noi > 0 ? `At ${num(n)} candles the sales line is ${usd(noi)} above the total expense line: profit. Break-even is ${num(Math.ceil(be))} candles.`
      : noi < 0 ? `At ${num(n)} candles the sales line is ${usd(-noi)} below total expenses: a loss. Break-even is ${num(Math.ceil(be))} candles.`
        : 'Right on the break-even point: sales equal total expenses.';
  };
  q.oninput = p.oninput = upd; upd();
};

/* ---------- 5.7 Sales mix ---------- */
Sims.salesmix = s => {
  const a = $('#mx-a', s), TOTAL = MIX.candles.sales + MIX.diffusers.sales;
  a.value = MIX.candles.sales / TOTAL * 100;
  const upd = instant => {
    const share = +a.value / 100, cs = TOTAL * share, ds = TOTAL - cs, cm = cs * MIX.candles.cmr + ds * MIX.diffusers.cmr, r = cm / TOTAL;
    $('#mx-a-o').textContent = Math.round(share * 100) + '%';
    bar('#mx-sa', share, instant); bar('#mx-sb', 1 - share, instant);
    $('#mx-sa').textContent = share > .25 ? 'candles ' + usd(cs) : ''; $('#mx-sb').textContent = share < .75 ? 'diffusers ' + usd(ds) : '';
    $('#mx-r').textContent = pct(r);
    const be = Math.round(MIX.fixed / r);
    countTo($('#mx-be'), be, instant); countTo($('#mx-noi'), Math.round(cm - MIX.fixed), instant, v => v < 0 ? '−' + usd(-v) : usd(v));
    $('#mx-f').innerHTML = `${usd(cs)} × 40% + ${usd(ds)} × 60% = ${usd(cm)} · ${usd(cm)} ÷ $200,000 = ${pct(r)} · $72,000 ÷ ${pct(r)} = <b>${usd(be)}</b>`;
  };
  a.oninput = () => upd(false); upd(true);
};

SIEDeck.start({
  sections: { intro: 'Intro', '5.1': 'Contribution margin', '5.2': 'Operating leverage', '5.3': 'Break-even', '5.4': 'Target profit', '5.5': 'What-if changes', '5.6': 'CVP graph', '5.7': 'Sales mix', end: 'Review' },
  sims: Sims,
  hooks: Hooks,
});
})();
