/* Chapter 1 textbook widgets. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var usd = function (n, d) { return (n < 0 ? "−$" : "$") + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  var num = function (el) { var v = parseFloat(el.value); return isFinite(v) ? v : 0; };

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
    document.querySelectorAll('.tb-body [id^="s1-"]').forEach(function (s) { io.observe(s); });
  }
  links.forEach(function (a) { a.addEventListener("click", function () { if (details && window.matchMedia("(max-width:860px)").matches) details.open = false; }); });

  /* Arriving from a quiz "read this" link: make sure the section is on screen. */
  var target = location.hash && document.getElementById(location.hash.slice(1));
  if (target) window.addEventListener("load", function () { target.scrollIntoView({ behavior: "instant", block: "start" }); });

  /* ---------- 1.2 Prime and conversion cost ---------- */
  function primeCalc() {
    var dm = Math.max(0, num($("pc-dm"))), dl = Math.max(0, num($("pc-dl"))), oh = Math.max(0, num($("pc-oh"))), u = Math.max(1, Math.floor(num($("pc-u"))));
    var total = dm + dl + oh;
    $("pc-prime").textContent = usd(dm + dl);
    $("pc-conv").textContent = usd(dl + oh);
    $("pc-total").textContent = usd(total);
    $("pc-unit").textContent = usd(total / u, 2);
    $("pc-note").textContent = "Prime + conversion = " + usd(dm + 2 * dl + oh) + ", which is " + usd(dl) +
      " (the direct labor, counted in both) more than the " + usd(total) + " total.";
  }
  ["pc-dm", "pc-dl", "pc-oh", "pc-u"].forEach(function (id) { $(id).addEventListener("input", primeCalc); }); primeCalc();

  /* ---------- 1.3 Where product costs end up ---------- */
  function flowCalc() {
    var made = Math.max(1, Math.floor(num($("fl-made")))), cost = Math.max(0, num($("fl-cost"))), sold = Math.max(0, Math.floor(num($("fl-sold"))));
    var over = sold > made; sold = Math.min(sold, made);
    $("fl-cogs").textContent = usd(sold * cost);
    $("fl-fg").textContent = usd((made - sold) * cost);
    $("fl-note").textContent = (over ? "You can't sell more than you made (no beginning inventory here), so sold is capped at " + made.toLocaleString("en-US") + ". " : "") +
      sold.toLocaleString("en-US") + " sold × " + usd(cost) + " goes to the income statement; " +
      (made - sold).toLocaleString("en-US") + " unsold × " + usd(cost) + " waits on the balance sheet.";
  }
  ["fl-made", "fl-cost", "fl-sold"].forEach(function (id) { $(id).addEventListener("input", flowCalc); }); flowCalc();

  /* ---------- 1.4 Mixed cost Y = a + bX ---------- */
  function mixedCalc() {
    var a = Math.max(0, num($("mx-a"))), b = Math.max(0, num($("mx-b"))), x = Math.max(0, num($("mx-x")));
    var v = b * x, y = a + v, d = Number.isInteger(b) ? 0 : 2;
    $("mx-fixed").textContent = usd(a);
    $("mx-var").textContent = usd(v, Number.isInteger(v) ? 0 : 2);
    $("mx-y").textContent = usd(y, Number.isInteger(y) ? 0 : 2);
    $("mx-note").textContent = "Y = " + usd(a) + " + " + usd(b, d) + " × " + x.toLocaleString("en-US") +
      (x > 0 ? ". Cost per unit: " + usd(y / x, 2) + (a > 0 ? ", and it falls as X rises because the fixed part is spread wider." : ". With no fixed part, this is a purely variable cost.") : ". At zero activity you still pay the fixed part.");
  }
  ["mx-a", "mx-b", "mx-x"].forEach(function (id) { $(id).addEventListener("input", mixedCalc); }); mixedCalc();
})();
