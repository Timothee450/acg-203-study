/* Chapter 4 textbook widgets. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var usd = function (n, d) { var v = Math.abs(n); return (n < 0 ? "−$" : "$") + v.toLocaleString("en-US", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  var qty = function (n) { return (Math.round(n * 100) / 100).toLocaleString("en-US"); };
  var num = function (el) { var v = parseFloat(el.value); return isFinite(v) && v > 0 ? v : 0; };
  var pct = function (el) { return Math.min(100, num(el)) / 100; };
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
    document.querySelectorAll('.tb-body [id^="s4-"]').forEach(function (s) { io.observe(s); });
  }
  links.forEach(function (a) { a.addEventListener("click", function () { if (details && window.matchMedia("(max-width:860px)").matches) details.open = false; }); });

  /* Arriving from a quiz "read this" link: make sure the section is on screen. */
  var target = location.hash && document.getElementById(location.hash.slice(1));
  if (target) window.addEventListener("load", function () { target.scrollIntoView({ behavior: "instant", block: "start" }); });

  /* ---------- 4.3 Equivalent units ---------- */
  on(["eu-done", "eu-end", "eu-m", "eu-c"], function () {
    var done = num($("eu-done")), end = num($("eu-end")), m = pct($("eu-m")), c = pct($("eu-c"));
    $("eu-om").textContent = qty(done + end * m);
    $("eu-oc").textContent = qty(done + end * c);
    $("eu-note").textContent = qty(done) + " completed + " + qty(end) + " × " + Math.round(m * 100) + "% = " + qty(done + end * m) + " for materials; " +
      qty(done) + " + " + qty(end) + " × " + Math.round(c * 100) + "% = " + qty(done + end * c) + " for conversion.";
  });

  /* ---------- 4.4 Cost per equivalent unit ---------- */
  on(["cp-beg", "cp-add", "cp-eu"], function () {
    var tot = num($("cp-beg")) + num($("cp-add")), eu = num($("cp-eu"));
    $("cp-tot").textContent = usd(tot);
    $("cp-out").textContent = eu ? usd(tot / eu, 2) : "Enter units";
  });

  /* ---------- 4.5 Production report ---------- */
  on(["pr-bm", "pr-bc", "pr-am", "pr-ac", "pr-done", "pr-end", "pr-pm", "pr-pc"], function () {
    var mat = num($("pr-bm")) + num($("pr-am")), conv = num($("pr-bc")) + num($("pr-ac"));
    var done = num($("pr-done")), end = num($("pr-end")), euM = done + end * pct($("pr-pm")), euC = done + end * pct($("pr-pc"));
    if (!euM || !euC) { ["pr-cpu", "pr-out", "pr-wip", "pr-chk"].forEach(function (id) { $(id).textContent = "—"; }); return; }
    var cm = mat / euM, cc = conv / euC, out = done * (cm + cc), wip = (euM - done) * cm + (euC - done) * cc;
    $("pr-cpu").textContent = "$" + (cm + cc).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    $("pr-out").textContent = usd(out);
    $("pr-wip").textContent = usd(wip);
    $("pr-chk").textContent = usd(mat + conv) + " = " + usd(out + wip);
  });
})();
