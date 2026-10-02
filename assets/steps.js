/* ACG 203 Study: declarative step animations for the Learning decks. Load after deck.js.
   Mark up a slide's diagram, give the slide a data-key, and pass SIESteps.hooks([...keys]) to SIEDeck.start:
     data-at="N"      appears at step N (N = 0 animates in when the slide opens, one after another)
       + class draw   a path that draws itself
       + class grow   a bar that grows from the left (data-shrink="M" trims it to 40% at step M)
     data-move="N" data-dx data-dy   slides by (dx, dy) at step N
     data-out="M"     disappears again at step M (for before → after diagrams)
     data-d="0.3"     extra delay in seconds, for staggering a group
     data-count="V"   counts up to V when it (or its data-at parent) appears; data-fmt="num" | "usd2" (default usd)
   Going Back runs the same rules with a lower step number, so everything reverses. */
window.SIESteps = (() => {
  const { $, $$, RM, D, num, usd } = SIEDeck;
  const fmt = (el, v) => { const f = el.dataset.fmt; return f === 'num' ? num(Math.round(v)) : f === 'usd2' ? '$' + num(v, 2) : usd(Math.round(v)); };
  function count(el, delay) {
    const end = +el.dataset.count;
    if (RM) { el.textContent = fmt(el, end); return; }
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.1, delay, ease: 'power2.out', onUpdate: () => { el.textContent = fmt(el, o.v); }, onComplete: () => { el.textContent = fmt(el, end); } });
  }
  function anim(s, step, instant) {
    let z = 0;
    $$('[data-at]', s).forEach(el => {
      const at = +el.dataset.at, on = step >= at && !(el.dataset.out && step >= +el.dataset.out), was = !!el._on;
      el._on = on;
      const delay = instant ? 0 : D((at === 0 && on ? .2 + (z++) * .12 : 0) + (on ? +el.dataset.d || 0 : 0));
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
      if (on && !was && !instant) (el.matches('[data-count]') ? [el] : $$('[data-count]', el)).forEach(c => count(c, delay + D(.2)));
    });
  }
  const Steps = {
    enter: (s, step) => { anim(s, -1, true); anim(s, step, false); },
    step: (s, step) => anim(s, step, false),
  };
  const Divider = {
    enter: s => {
      if (RM) return;
      gsap.fromTo($('.divider .n', s), { scale: .4, rotation: -10, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, duration: .8, ease: 'back.out(2)', delay: .1 });
      gsap.fromTo($$('.chip', s), { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .4, stagger: .08, delay: .45, ease: 'power3.out' });
    },
  };
  /* Hooks for SIEDeck.start: every listed data-key gets the step animations; section dividers get their entrance. */
  const hooks = keys => { const h = { div: Divider }; keys.forEach(k => { h[k] = Steps; }); return h; };
  return { anim, hooks, Steps, Divider };
})();
