/* Chapter 3 learning deck: simulators. The slide engine is assets/deck.js; the step animations
   declared in learn.html (data-at, data-move, data-count) run through assets/steps.js. */
(() => {
const { $, $$, RM, D, num, usd, pressSeg } = SIEDeck;

const POHR = 8, WAGE = 20;                      // Chapter 2's rate per direct labor-hour, wage per hour
const APPLIED = 32000, ACTUAL = 34000;          // March overhead: 4,000 h × $8 applied, actual factory overhead
const COGM = 150000, SOLD = 140000;             // jobs completed and jobs sold, at cost
const SALES = 210000, SA = 22000;               // March sales, selling and administrative expenses
const SHARE = { wip: .15, fg: .25, cogs: .6 };  // where March's applied overhead sits at month end
const Hooks = SIESteps.hooks(['accounts', 'materials', 'labor', 'overhead', 'nonmfg', 'complete', 'schedule', 'balance', 'dispose', 'recap']);
const Sims = {};

/* fly an element toward another, then call done (instant with reduced motion) */
function flyTo(el, target, done) {
  if (RM) { done(); return; }
  const a = el.getBoundingClientRect(), b = target.getBoundingClientRect();
  gsap.to(el, { x: (b.left + b.width / 2) - (a.left + a.width / 2), y: (b.top + b.height / 2) - (a.top + a.height / 2), scale: .3, autoAlpha: 0, duration: .45, ease: 'power2.in', onComplete: done });
}
const pulse = el => { if (!RM) gsap.fromTo(el, { scale: 1 }, { scale: 1.05, duration: .15, yoyo: true, repeat: 1 }); };
const shake = el => { if (!RM) gsap.fromTo(el, { x: -10 }, { x: 0, duration: .6, ease: 'elastic.out(1,.25)' }); };
/* count a dollar figure from its last value to v */
function countTo(el, v, instant) {
  const o = { v: +(el.dataset.v || 0) };
  el.dataset.v = v;
  if (el._tw) el._tw.kill();   // a new count (or a reset) replaces one still running
  if (instant || RM) { el._tw = null; el.textContent = usd(v); return; }
  el._tw = gsap.to(o, { v, duration: .6, ease: 'power2.out', onUpdate: () => { el.textContent = usd(Math.round(o.v)); }, onComplete: () => { el.textContent = usd(v); } });
}
const signed = v => v > 0 ? '+ ' + usd(v) : v < 0 ? '− ' + usd(-v) : 'no change';

/* ---------- 3.1 Run March through the accounts ---------- */
Sims.flowmap = s => {
  const board = $('#fm-board', s), fb = $('#fm-fb', s), nextBtn = $('#fm-next', s), tile = k => $(`[data-a="${k}"]`, board);
  const START = { rm: 8000, wip: 20000, fg: 30000, cogs: 0, moh: 0, sa: 0 };
  const E = [
    ['out', [['rm', 50000]], '(1) Buy materials on account', 'Dr Raw Materials 50,000 · Cr Accounts Payable 50,000', 'Materials wait in the storeroom until they are issued.'],
    ['rm', [['wip', 40000], ['moh', 6000]], '(2) Issue materials', 'Dr Work in Process 40,000 · Dr Manufacturing Overhead 6,000 · Cr Raw Materials 46,000', 'Direct materials go to jobs; indirect materials wait in overhead.'],
    ['out', [['wip', 80000], ['moh', 12000]], '(3) Factory payroll', 'Dr Work in Process 80,000 · Dr Manufacturing Overhead 12,000 · Cr Salaries and Wages Payable 92,000', 'Direct labor goes to jobs; indirect labor waits in overhead.'],
    ['out', [['moh', 16000]], '(4) Other factory bills', 'Dr Manufacturing Overhead 16,000 · Cr Accounts Payable, Accumulated Depreciation, Prepaid Insurance', 'Overhead now holds all $34,000 of actual factory costs.'],
    ['moh', [['wip', APPLIED]], '(5) Apply overhead: 4,000 h × $8', 'Dr Work in Process 32,000 · Cr Manufacturing Overhead 32,000', 'Jobs get overhead at the rate, so $2,000 of actual overhead is left behind.'],
    ['out', [['sa', SA]], '(6) Selling and administrative costs', 'Dr Salaries, Advertising, Depreciation Expense 22,000 · Cr Payables, Accumulated Depreciation', 'Period costs skip the factory entirely.'],
    ['wip', [['fg', COGM]], '(7) Jobs completed', 'Dr Finished Goods 150,000 · Cr Work in Process 150,000', 'That is cost of goods manufactured. $22,000 of jobs are still in process.'],
    ['fg', [['cogs', SOLD]], '(8) Jobs sold for $210,000', 'Dr Cost of Goods Sold 140,000 · Cr Finished Goods 140,000 (and Dr Accounts Receivable, Cr Sales 210,000)', 'That is unadjusted cost of goods sold. $40,000 of signs are still on the shelves.'],
    ['moh', [['cogs', ACTUAL - APPLIED]], 'Month end: close the leftover overhead', 'Dr Cost of Goods Sold 2,000 · Cr Manufacturing Overhead 2,000', 'Overhead is back to zero and adjusted cost of goods sold is $142,000. March is done.'],
  ];
  let bal, at, busy, gen = 0;
  const show = (k, instant) => {
    countTo($('.bal', tile(k)), bal[k], instant);
    if (k === 'moh') $('.dc', tile('moh')).textContent = bal.moh > 0 ? 'debit balance' : bal.moh < 0 ? 'credit balance' : '';
  };
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
    $('#fm-count').textContent = `Entry ${at} of ${E.length}`;
    fb.innerHTML = `<b>${title}.</b> <span class="mono">${je}</span><br>${note}`;
    if (at === E.length) { nextBtn.disabled = true; nextBtn.textContent = 'March done ✓'; }
  };
  const reset = () => {
    gen++; bal = { ...START }; at = 0; busy = false;
    $$('.fly', board).forEach(c => c.remove());
    $$('.acct', board).forEach(t => t.classList.remove('hot'));
    Object.keys(START).forEach(k => show(k, true));
    nextBtn.disabled = false; nextBtn.textContent = 'Next entry →';
    $('#fm-count').textContent = `Entry 0 of ${E.length}`;
    fb.innerHTML = 'March 1 balances are shown. Press <b>Next entry</b> to post the first transaction.';
  };
  nextBtn.onclick = next; $('#fm-reset', s).onclick = reset;
  reset();
};

/* ---------- 3.2 Which account is debited? ---------- */
Sims.jesort = s => {
  const ITEMS = [
    ['Steel for Job 305 is requisitioned', 'wip', 'Direct materials are traced to the job.'],
    ['Glue and sandpaper are issued to the shop floor', 'moh', 'Indirect materials can\'t be traced to one job, so they go to overhead.'],
    ['A welder logs 30 hours on Job 305', 'wip', 'Direct labor from a time ticket is traced to the job.'],
    ['The factory supervisor is paid', 'moh', 'Indirect labor: the supervisor serves every job.'],
    ['Factory machines depreciate', 'moh', 'An actual factory cost, so it\'s debited to overhead.'],
    ['Overhead is applied at $8 per labor-hour', 'wip', 'Applied overhead moves into Work in Process (and out of Manufacturing Overhead).'],
    ['Sales staff earn commissions', 'exp', 'A selling cost: expensed this period, never inventory.'],
    ['Job 305 is finished and moved to the warehouse', 'fg', 'Completed jobs move to Finished Goods (credit Work in Process).'],
    ['Job 302 is delivered to the customer', 'cogs', 'Sold jobs become Cost of Goods Sold (credit Finished Goods). A second entry records the sale: debit Accounts Receivable, credit Sales.'],
    ['The head office building depreciates', 'exp', 'It isn\'t a factory cost, so it\'s an administrative expense.'],
  ];
  const NAME = { wip: 'Work in Process', moh: 'Manufacturing Overhead', fg: 'Finished Goods', cogs: 'Cost of Goods Sold', exp: 'Period expense' };
  const card = $('#jd-card', s), fb = $('#jd-fb', s), bins = $$('.pp-bin', s);
  let order, at, first, missed, busy;
  const show = () => {
    busy = false; gsap.killTweensOf(card);
    if (at >= ITEMS.length) {
      card.textContent = 'All 10 posted ✓'; $('#jd-count').textContent = 'Finished';
      fb.innerHTML = `<b class="pos">Done: ${first} of 10 on the first try.</b> Direct costs → Work in Process; indirect factory costs → Manufacturing Overhead; selling and admin → expense.`;
    } else { card.textContent = ITEMS[order[at]][0]; $('#jd-count').textContent = `Event ${at + 1} of 10`; }
    if (RM) gsap.set(card, { x: 0, y: 0, scale: 1, autoAlpha: 1 });
    else gsap.fromTo(card, { x: 0, y: -30, scale: .9, autoAlpha: 0 }, { x: 0, y: 0, scale: 1, autoAlpha: 1, duration: .4, ease: 'back.out(2)' });
  };
  const pick = b => {
    if (busy || at >= ITEMS.length) return;
    const [, right, why] = ITEMS[order[at]], k = b.dataset.b;
    if (k !== right) { missed = true; fb.innerHTML = `<b class="neg">Not ${NAME[k]}.</b> Ask: can it be traced to one job? Is it a factory cost at all? Is the job finished, or sold?`; shake(card); return; }
    if (!missed) first++;
    missed = false;
    const n = $('.n', b); n.textContent = +n.textContent + 1;
    fb.innerHTML = `<b class="pos">Yes: ${NAME[k]}.</b> ${why}`;
    at++; busy = true; pulse(b);
    flyTo(card, b, show);
  };
  bins.forEach(b => { b.onclick = () => pick(b); });
  $('#jd-reset', s).onclick = () => {
    order = ITEMS.map((x, i) => i).sort(() => Math.random() - .5); at = 0; first = 0; missed = false;
    bins.forEach(b => { $('.n', b).textContent = 0; });
    fb.textContent = 'Read the event, then tap the account that\'s debited.'; show();
  };
  $('#jd-reset', s).onclick();
};

/* ---------- 3.2 Post to the Manufacturing Overhead T-account ---------- */
Sims.mohacct = s => {
  const ITEMS = [
    ['Indirect materials', 6000, 'dr', 'Glue and fasteners are actual overhead: a debit.'],
    ['Direct labor', 80000, 'no', 'Direct labor is traced to jobs, so it goes straight to Work in Process.'],
    ['Indirect labor', 12000, 'dr', 'Supervisors and maintenance are actual overhead: a debit.'],
    ['Factory utilities', 4000, 'dr', 'A factory bill is actual overhead: a debit.'],
    ['Overhead applied to jobs', APPLIED, 'cr', 'Applied overhead leaves the account (a credit) and enters Work in Process.'],
    ['Sales salaries', 15000, 'no', 'Selling costs are period expenses, never overhead.'],
    ['Factory depreciation', 10000, 'dr', 'Depreciation on factory equipment is actual overhead: a debit.'],
    ['Factory insurance', 2000, 'dr', 'Expired factory insurance is actual overhead: a debit.'],
  ];
  const docs = $('#mo-docs', s), fb = $('#mo-fb', s), sides = $$('.side', s);
  let sel, sum;
  const deal = () => {
    sel = null; sum = { dr: 0, cr: 0 };
    sides.forEach(x => { $('.lst', x).innerHTML = ''; x.classList.remove('hot'); });
    ['dr', 'cr'].forEach(k => countTo($('#mo-' + k), 0, true));
    docs.innerHTML = ITEMS.map((d, i) => `<button type="button" class="doc-card" data-i="${i}"><span>${d[0]}</span><b class="mono">${usd(d[1])}</b></button>`).join('');
    if (!RM) gsap.from($$('.doc-card', docs), { y: -20, autoAlpha: 0, duration: .4, stagger: .05, ease: 'back.out(2)' });
    $$('.doc-card', docs).forEach(c => {
      c.onclick = () => {
        if (c.disabled) return;
        $$('.doc-card', docs).forEach(x => x.classList.toggle('sel', x === c && sel !== c));
        sel = sel === c ? null : c;
        sides.forEach(x => x.classList.toggle('hot', !!sel));
        if (sel) fb.textContent = `Where does "${ITEMS[+c.dataset.i][0]}" go: debit, credit, or not overhead at all?`;
      };
    });
    fb.textContent = 'Pick a cost to start.';
  };
  sides.forEach(sd => {
    sd.onclick = () => {
      if (!sel) { fb.textContent = 'Pick a cost first.'; return; }
      const d = ITEMS[+sel.dataset.i], t = sd.dataset.t;
      if (d[2] !== t) {
        fb.innerHTML = `<b class="neg">Not there.</b> ` + (d[2] === 'no' ? 'Is this really a factory overhead cost?'
          : t === 'no' ? 'This one does belong in Manufacturing Overhead.'
            : t === 'cr' ? 'Actual costs are debits. Only applied overhead is a credit.' : 'Applied overhead leaves the account, so it is a credit.');
        shake(sel); return;
      }
      const doc = sel, left = $$('.doc-card:not([disabled])', docs).length - 1;
      sel = null; doc.disabled = true; doc.classList.remove('sel'); sides.forEach(x => x.classList.remove('hot'));
      flyTo(doc, sd, () => doc.remove());
      const line = document.createElement('span'); line.className = 'pl';
      line.innerHTML = `<span>${d[0]}</span><span class="mono">${num(d[1])}</span>`;
      $('.lst', sd).appendChild(line);
      if (!RM) gsap.from(line, { x: -12, autoAlpha: 0, duration: .4, delay: .3 });
      if (t !== 'no') { sum[t] += d[1]; countTo($('#mo-' + t), sum[t]); }
      pulse(sd);
      fb.innerHTML = `<b class="pos">Right.</b> ${d[3]} ` + (left ? `${left} to go.`
        : `<b>All posted.</b> Debits ${usd(sum.dr)} − credits ${usd(sum.cr)} = a ${usd(sum.dr - sum.cr)} debit balance, so overhead is <b>underapplied</b>.`);
    };
  });
  $('#mo-reset', s).onclick = deal;
  deal();
};

/* ---------- 3.2 Work in Process, Finished Goods and Cost of Goods Sold ---------- */
Sims.tacct = s => {
  const WIP0 = 20000, FG0 = 30000, IN = [['Mar 1', WIP0], ['Materials', 40000], ['Labor', 80000], ['Overhead', APPLIED]];
  const TOTAL = IN.reduce((a, x) => a + x[1], 0);   // $172,000 went through Work in Process
  const c = $('#tk-c', s), so = $('#tk-s', s);
  c.max = TOTAL; c.value = COGM; so.max = FG0 + COGM; so.value = SOLD;
  const row = (l, v, cls = '') => `<div class="tl ${cls}"><span>${l}</span><span class="mono">${num(v)}</span></div>`;
  $('#tk-wd').innerHTML = IN.map(x => row(x[0], x[1])).join('');
  const upd = instant => {
    const done = +c.value;
    so.max = FG0 + done; if (+so.value > FG0 + done) so.value = FG0 + done;
    const sold = +so.value, w = TOTAL - done, f = FG0 + done - sold;
    $('#tk-c-o').textContent = usd(done); $('#tk-s-o').textContent = usd(sold);
    $('#tk-wc').innerHTML = row('Done', done, 'out');
    $('#tk-fd').innerHTML = row('Mar 1', FG0) + row('Done', done, 'in');
    $('#tk-fc').innerHTML = row('Sold', sold, 'out');
    $('#tk-gd').innerHTML = row('Sold', sold, 'in');
    countTo($('#tk-w'), w, instant); countTo($('#tk-f'), f, instant); countTo($('#tk-g'), sold, instant);
    $('#tk-fb').innerHTML = `${usd(done)} of jobs finished, so <b>${usd(w)}</b> is still in process. ${usd(sold)} of jobs sold, so <b>${usd(f)}</b> of signs wait on the shelves.` +
      (done === COGM && sold === SOLD ? ' These are March\'s actual numbers.' : '');
  };
  c.oninput = () => upd(false); so.oninput = () => upd(false); upd(true);
};

/* ---------- 3.3 Schedule of cost of goods manufactured ---------- */
Sims.cogm = s => {
  const RM0 = 8000, IND = 6000, WIP0 = 20000, X0 = 170, PX = 360 / 240000;
  const ins = ['p', 'e', 'h', 'w'].map(k => $('#cm-' + k, s));
  const upd = instant => {
    const [p, e, h, w] = ins.map(x => +x.value);
    const dm = RM0 + p - e - IND, dl = h * WAGE, oh = h * POHR, tmc = dm + dl + oh, cogm = tmc + WIP0 - w;
    [p, e, h, w].forEach((v, i) => { $(`#cm-${'pehw'[i]}-o`).textContent = i === 2 ? num(v) : usd(v); });
    [[0, dm], [dm, dl], [dm + dl, oh], [0, tmc], [tmc, WIP0], [tmc + WIP0 - w, w], [0, cogm]].forEach(([a, v], i) => {
      gsap.to('#cm-r' + i, { attr: { x: X0 + a * PX, width: Math.max(1, v * PX) }, duration: instant ? 0 : D(.45), ease: 'power2.out' });
      $('#cm-v' + i).textContent = usd(i === 5 ? -v : v);
    });
    $('#cm-f').innerHTML = `(${usd(RM0)} + ${usd(p)} − ${usd(e)} − ${usd(IND)}) + ${num(h)} h × ($20 + $8) = ${usd(tmc)} · + ${usd(WIP0)} − ${usd(w)} = <b>${usd(cogm)} cost of goods manufactured</b>`;
  };
  ins.forEach(x => { x.oninput = () => upd(false); }); upd(true);
};

/* ---------- 3.3 Schedule of cost of goods sold ---------- */
Sims.cogs = s => {
  const FG0 = 30000, AVAIL = FG0 + COGM, e = $('#cg-e', s), btns = $$('#cg-btns button', s);
  let adj = ACTUAL - APPLIED;
  e.value = AVAIL - SOLD;
  const upd = instant => {
    const end = +e.value, sold = AVAIL - end, fin = sold + adj;
    $('#cg-e-o').textContent = usd(end);
    gsap.to('#cg-sold', { width: sold / AVAIL * 100 + '%', duration: instant ? 0 : D(.4), ease: 'power2.out' });
    gsap.to('#cg-left', { width: end / AVAIL * 100 + '%', duration: instant ? 0 : D(.4), ease: 'power2.out' });
    $('#cg-sold').textContent = sold / AVAIL > .25 ? 'sold ' + usd(sold) : '';
    $('#cg-left').textContent = end / AVAIL > .2 ? 'on shelves ' + usd(end) : '';
    countTo($('#cg-un'), sold, instant); countTo($('#cg-fin'), fin, instant);
    const a = $('#cg-adj'); a.textContent = signed(adj); a.className = 'v ' + (adj > 0 ? 'neg' : adj < 0 ? 'pos' : '');
    $('#cg-f').innerHTML = `${usd(FG0)} + ${usd(COGM)} − ${usd(end)} = ${usd(sold)} unadjusted` +
      (adj ? ` ${adj > 0 ? '+' : '−'} ${usd(Math.abs(adj))} ${adj > 0 ? 'underapplied' : 'overapplied'}` : '') + ` = <b>${usd(fin)} adjusted cost of goods sold</b>`;
  };
  btns.forEach(b => { b.onclick = () => { adj = +b.dataset.a; pressSeg(btns, b); upd(false); }; });
  e.oninput = () => upd(false); upd(true);
};

/* ---------- 3.3 Build the income statement ---------- */
Sims.isbuild = s => {
  const GOOD = [['sales', 'Sales', SALES], ['cogs', 'Cost of goods sold (adjusted)', SOLD + ACTUAL - APPLIED], ['sa', 'Selling and administrative expenses', SA]];
  const BAD = [
    ['cogm', 'Cost of goods manufactured', COGM, 'It moves jobs into Finished Goods. Only the cost of jobs <b>sold</b> reaches the income statement.'],
    ['fg', 'Ending finished goods', 40000, 'Unsold signs are an asset, so they stay on the balance sheet.'],
    ['act', 'Actual overhead', ACTUAL, 'Overhead reaches the statement only as part of the cost of the jobs sold (plus the $2,000 adjustment), never as its own line.'],
    ['dl', 'Direct labor', 80000, 'Labor is a product cost. It reaches the statement only inside cost of goods sold.'],
  ];
  const ROWS = ['Sales', 'Cost of goods sold', 'Gross margin', 'Selling and administrative expenses', 'Net operating income'], SLOT = [0, 1, 3];
  const tray = $('#ib-tray', s), st = $('#ib-stmt', s), fb = $('#ib-fb', s);
  let at;
  const fill = (r, label, v, neg) => {
    const row = $(`[data-r="${r}"]`, st);
    row.classList.add('on'); $('span', row).textContent = label; $('.mono', row).textContent = neg ? '(' + num(v) + ')' : usd(v);
    if (!RM) gsap.from(row, { x: -16, autoAlpha: 0, duration: .4, delay: .25 });
  };
  const pick = (b, k) => {
    const bad = BAD.find(x => x[0] === k), want = GOOD[at];
    if (bad) { fb.innerHTML = `<b class="neg">Not on the income statement.</b> ${bad[3]}`; shake(b); return; }
    if (k !== want[0]) { fb.innerHTML = '<b class="neg">Right line, wrong spot.</b> ' + (at === 0 ? 'An income statement starts with sales.' : 'Cost of goods sold comes right after sales.'); shake(b); return; }
    b.disabled = true;
    flyTo(b, $(`[data-r="${SLOT[at]}"]`, st), () => b.remove());
    fill(SLOT[at], want[1], want[2], at > 0);
    at++;
    if (at === 1) fb.innerHTML = '<b class="pos">Yes.</b> Sales of $210,000 come first. Next, subtract the cost of the jobs that were sold.';
    else if (at === 2) { fill(2, 'Gross margin', SALES - GOOD[1][2]); fb.innerHTML = '<b class="pos">Gross margin:</b> $210,000 − $142,000 = $68,000. Cost of goods sold is the adjusted figure, with the $2,000 underapplied added.'; }
    else { fill(4, 'Net operating income', SALES - GOOD[1][2] - SA); fb.innerHTML = '<b class="pos">Done.</b> $68,000 − $22,000 = <b>$46,000</b> net operating income. The four cards left over never appear on the income statement.'; }
  };
  const build = () => {
    at = 0;
    st.innerHTML = ROWS.map((r, i) => `<div class="isr${i === 2 || i === 4 ? ' sub' : ''}" data-r="${i}"><span>${i === 2 || i === 4 ? r : '?'}</span><span class="mono">…</span></div>`).join('');
    const cards = [...GOOD, ...BAD].sort(() => Math.random() - .5);
    tray.innerHTML = cards.map(c => `<button type="button" class="doc-card" data-k="${c[0]}"><span>${c[1]}</span><b class="mono">${usd(c[2])}</b></button>`).join('');
    if (!RM) gsap.from($$('.doc-card', tray), { y: -20, autoAlpha: 0, duration: .4, stagger: .05, ease: 'back.out(2)' });
    $$('.doc-card', tray).forEach(b => { b.onclick = () => { if (!b.disabled) pick(b, b.dataset.k); }; });
    fb.textContent = 'Which line comes first on the income statement?';
  };
  $('#ib-reset', s).onclick = build;
  build();
};

/* ---------- 3.4 Close the overhead balance ---------- */
Sims.close = s => {
  const x = $('#cl-x', s), btns = $$('#cl-btns button', s), END = { wip: 22000, fg: 40000, cogs: SOLD };
  const NAME = { wip: 'Work in Process', fg: 'Finished Goods', cogs: 'Cost of Goods Sold' };
  let m = 'cogs';
  x.value = ACTUAL;
  const upd = instant => {
    const act = +x.value, diff = act - APPLIED;
    const a = m === 'cogs' ? { wip: 0, fg: 0, cogs: diff } : { wip: diff * SHARE.wip, fg: diff * SHARE.fg, cogs: diff * SHARE.cogs };
    $('#cl-x-o').textContent = usd(act);
    const bal = $('#cl-bal');
    bal.textContent = diff === 0 ? 'No balance' : usd(Math.abs(diff)) + (diff > 0 ? ' underapplied' : ' overapplied');
    bal.className = 'v ' + (diff > 0 ? 'neg' : diff < 0 ? 'pos' : '');
    ['wip', 'fg', 'cogs'].forEach(k => { countTo($('#cl-' + k), END[k] + a[k], instant); $('#cl-' + k + 'a').textContent = signed(a[k]); });
    countTo($('#cl-noi'), SALES - (SOLD + a.cogs) - SA, instant);
    const parts = ['wip', 'fg', 'cogs'].filter(k => a[k]).map(k => `${NAME[k]} ${usd(Math.abs(a[k]))}`);
    $('#cl-je').textContent = diff === 0 ? 'No entry: applied matched actual.'
      : diff > 0 ? `Dr ${parts.join(' · Dr ')} · Cr Manufacturing Overhead ${usd(diff)}`
        : `Dr Manufacturing Overhead ${usd(-diff)} · Cr ${parts.join(' · Cr ')}`;
    $('#cl-fb').textContent = diff === 0 ? 'Applied equals actual, so there is nothing to close. That almost never happens.'
      : (diff > 0 ? `Underapplied: jobs were undercosted, so ${m === 'alloc' ? 'all three accounts go' : 'cost of goods sold goes'} up and income goes down.`
        : `Overapplied: jobs were overcosted, so ${m === 'alloc' ? 'all three accounts come' : 'cost of goods sold comes'} down and income goes up.`) +
        (m === 'alloc' ? ` Allocating sends only 60% (${usd(Math.abs(a.cogs))}) to this month's income statement; the rest stays in inventory.` : ` The whole ${usd(Math.abs(diff))} hits this month's cost of goods sold.`);
  };
  btns.forEach(b => { b.onclick = () => { m = b.dataset.m; pressSeg(btns, b); upd(false); }; });
  x.oninput = () => upd(false); upd(true);
};

SIEDeck.start({
  sections: { intro: 'Intro', '3.1': 'How costs flow', '3.2': 'Recording the flow', '3.3': 'The schedules', '3.4': 'Leftover overhead', end: 'Review' },
  sims: Sims,
  hooks: Hooks,
});
})();
