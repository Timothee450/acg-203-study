/* Chapter 6 textbook widgets. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var usd = function (n) { return (n < 0 ? "−$" : "$") + Math.round(Math.abs(n)).toLocaleString("en-US"); };
  var qty = function (n) { return (Math.round(n * 100) / 100).toLocaleString("en-US"); };
  var num = function (el) { var v = parseFloat(el.value); return isFinite(v) && v > 0 ? v : 0; };
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
    document.querySelectorAll('.tb-body [id^="s6-"]').forEach(function (s) { io.observe(s); });
  }
  links.forEach(function (a) { a.addEventListener("click", function () { if (details && window.matchMedia("(max-width:860px)").matches) details.open = false; }); });

  /* Arriving from a quiz "read this" link: make sure the section is on screen. */
  var target = location.hash && document.getElementById(location.hash.slice(1));
  if (target) window.addEventListener("load", function () { target.scrollIntoView({ behavior: "instant", block: "start" }); });

  /* ---------- 6.1 Unit product cost ---------- */
  on(["uc-v", "uc-f", "uc-q"], function () {
    var v = num($("uc-v")), f = num($("uc-f")), q = num($("uc-q"));
    $("uc-vc").textContent = "$" + qty(v);
    $("uc-ac").textContent = q ? "$" + (v + f / q).toLocaleString("en-US", { minimumFractionDigits: (v + f / q) % 1 ? 2 : 0, maximumFractionDigits: 2 }) : "Enter units";
  });

  /* ---------- 6.5 Segment break-even ---------- */
  on(["sb-of", "sb-rf", "sb-c"], function () {
    var o = num($("sb-of")), r = num($("sb-rf")), c = num($("sb-c"));
    $("sb-o").textContent = usd(o / 0.6);
    $("sb-r").textContent = usd(r / 0.4);
    $("sb-t").textContent = usd((o + r + c) / 0.5);
  });
})();
