/* Chapter 5 textbook widgets. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var usd = function (n) { return (n < 0 ? "−$" : "$") + Math.round(Math.abs(n)).toLocaleString("en-US"); };
  var qty = function (n) { return (Math.round(n * 100) / 100).toLocaleString("en-US"); };
  var num = function (el) { var v = parseFloat(el.value); return isFinite(v) && v > 0 ? v : 0; };
  var pct = function (r) { return (Math.round(r * 1000) / 10).toLocaleString("en-US") + "%"; };
  var on = function (ids, fn) { ids.forEach(function (id) { $(id).addEventListener("input", fn); }); fn(); };

  /* ---------- Contents: highlight the section in view ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll(".tb-toc a"));
  var details = document.getElementById("toc-details");
  if (details && window.matchMedia && window.matchMedia("(max-width:860px)").matches) details.open = false;
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id); });
      });
    }, { rootMargin: "-35% 0px -60% 0px" });
    document.querySelectorAll('.tb-body [id^="s5-"]').forEach(function (s) { io.observe(s); });
  }
  links.forEach(function (a) { a.addEventListener("click", function () { if (details && window.matchMedia("(max-width:860px)").matches) details.open = false; }); });

  /* Arriving from a quiz "read this" link: make sure the section is on screen. */
  var target = location.hash && document.getElementById(location.hash.slice(1));
  if (target) window.addEventListener("load", function () { target.scrollIntoView({ behavior: "instant", block: "start" }); });

  /* ---------- 5.1 CVP calculator ---------- */
  on(["cv-p", "cv-v", "cv-f", "cv-q"], function () {
    var p = num($("cv-p")), v = num($("cv-v")), f = num($("cv-f")), q = num($("cv-q")), cm = p - v;
    if (cm <= 0 || !p) {
      $("cv-cm").textContent = usd(cm) + " · —"; $("cv-noi").textContent = usd(cm * q - f);
      $("cv-be").textContent = "Never"; $("cv-dol").textContent = "—";
      $("cv-note").textContent = "The price doesn't cover the variable cost, so every sale adds to the loss and there is no break-even point.";
      return;
    }
    var noi = cm * q - f, be = f / cm;
    $("cv-cm").textContent = usd(cm) + " · " + pct(cm / p);
    $("cv-noi").textContent = usd(noi);
    $("cv-be").textContent = qty(Math.ceil(be)) + " units";
    $("cv-dol").textContent = noi > 0 ? qty(cm * q / noi) : "—";
    $("cv-note").textContent = noi > 0
      ? "Margin of safety: " + usd(p * q - p * be) + " (" + pct((q - be) / q) + " of sales). A 10% rise in sales lifts profit " + pct(cm * q / noi / 10) + "."
      : noi === 0 ? "Exactly at break-even: contribution margin just covers fixed expenses." : "Below break-even: sales must rise by " + qty(Math.ceil(be - q)) + " units to stop losing money.";
  });

  /* ---------- 5.4 Target profit ---------- */
  on(["tp-t", "tp-f", "tp-cm", "tp-p"], function () {
    var t = num($("tp-t")), f = num($("tp-f")), cm = num($("tp-cm")), p = num($("tp-p"));
    if (!cm) { $("tp-u").textContent = "—"; $("tp-s").textContent = "—"; return; }
    var u = (f + t) / cm;
    $("tp-u").textContent = qty(Math.ceil(u));
    $("tp-s").textContent = p >= cm ? usd(u * p) : "—";
  });

  /* ---------- 5.7 Sales mix ---------- */
  on(["sm-a", "sm-b", "sm-f"], function () {
    var a = num($("sm-a")), b = num($("sm-b")), f = num($("sm-f")), cm = a * 0.4 + b * 0.6, sales = a + b;
    if (!sales) { $("sm-r").textContent = "—"; $("sm-be").textContent = "—"; $("sm-noi").textContent = usd(-f); return; }
    var r = cm / sales;
    $("sm-r").textContent = pct(r);
    $("sm-be").textContent = usd(f / r);
    $("sm-noi").textContent = usd(cm - f);
  });
})();
