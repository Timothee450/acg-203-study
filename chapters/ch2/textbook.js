/* Chapter 2 textbook widgets. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var usd = function (n, d) { return (n < 0 ? "−$" : "$") + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  var num = function (el) { var v = parseFloat(el.value); return isFinite(v) ? v : 0; };
  var cents = function (n) { return usd(n, Number.isInteger(Math.round(n * 100) / 100) ? 0 : 2); };

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
    document.querySelectorAll('.tb-body [id^="s2-"]').forEach(function (s) { io.observe(s); });
  }
  links.forEach(function (a) { a.addEventListener("click", function () { if (details && window.matchMedia("(max-width:860px)").matches) details.open = false; }); });

  /* Arriving from a quiz "read this" link: make sure the section is on screen. */
  var target = location.hash && document.getElementById(location.hash.slice(1));
  if (target) window.addEventListener("load", function () { target.scrollIntoView({ behavior: "instant", block: "start" }); });

  /* ---------- 2.2 Predetermined overhead rate ---------- */
  function rateCalc() {
    var base = Math.max(1, num($("po-base"))), fixed = Math.max(0, num($("po-fixed"))), v = Math.max(0, num($("po-var")));
    var total = fixed + v * base;
    $("po-total").textContent = usd(total);
    $("po-rate").textContent = usd(total / base, 2) + " / hour";
    $("po-note").textContent = usd(fixed) + " fixed + " + cents(v) + " × " + base.toLocaleString("en-US") + " hours = " + usd(total) +
      "; ÷ " + base.toLocaleString("en-US") + " hours = " + usd(total / base, 2) + " per hour.";
  }
  ["po-base", "po-fixed", "po-var"].forEach(function (id) { $(id).addEventListener("input", rateCalc); }); rateCalc();

  /* ---------- 2.4 Job cost ---------- */
  function jobCalc() {
    var dm = Math.max(0, num($("jc-dm"))), h = Math.max(0, num($("jc-h"))), w = Math.max(0, num($("jc-w"))), r = Math.max(0, num($("jc-r"))), u = Math.max(1, Math.floor(num($("jc-u"))));
    var dl = h * w, oh = h * r, total = dm + dl + oh;
    $("jc-dl").textContent = cents(dl); $("jc-oh").textContent = cents(oh);
    $("jc-total").textContent = cents(total); $("jc-unit").textContent = usd(total / u, 2);
  }
  ["jc-dm", "jc-h", "jc-w", "jc-r", "jc-u"].forEach(function (id) { $(id).addEventListener("input", jobCalc); }); jobCalc();

  /* ---------- 2.6 Under- or overapplied ---------- */
  function underCalc() {
    var rate = Math.max(0, num($("ua-rate"))), hours = Math.max(0, num($("ua-hours"))), actual = Math.max(0, num($("ua-actual")));
    var applied = rate * hours, diff = actual - applied;
    $("ua-applied").textContent = cents(applied);
    $("ua-res").textContent = Math.abs(diff) < 0.005 ? "Exactly applied" : cents(Math.abs(diff)) + (diff > 0 ? " underapplied" : " overapplied");
    $("ua-note").textContent = Math.abs(diff) < 0.005 ? "Applied equals actual, so cost of goods sold needs no adjustment."
      : diff > 0 ? "Applied is less than actual, so add " + cents(diff) + " to cost of goods sold."
        : "Applied is more than actual, so subtract " + cents(-diff) + " from cost of goods sold.";
  }
  ["ua-rate", "ua-hours", "ua-actual"].forEach(function (id) { $(id).addEventListener("input", underCalc); }); underCalc();
})();
