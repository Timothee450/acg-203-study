/* Chapter 3 textbook widgets. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var usd = function (n) { return (n < 0 ? "−$" : "$") + Math.round(Math.abs(n)).toLocaleString("en-US"); };
  var num = function (el) { var v = parseFloat(el.value); return isFinite(v) ? v : 0; };
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
    document.querySelectorAll('.tb-body [id^="s3-"]').forEach(function (s) { io.observe(s); });
  }
  links.forEach(function (a) { a.addEventListener("click", function () { if (details && window.matchMedia("(max-width:860px)").matches) details.open = false; }); });

  /* Arriving from a quiz "read this" link: make sure the section is on screen. */
  var target = location.hash && document.getElementById(location.hash.slice(1));
  if (target) window.addEventListener("load", function () { target.scrollIntoView({ behavior: "instant", block: "start" }); });

  /* ---------- 3.2 Work in Process T-account ---------- */
  on(["ta-beg", "ta-dm", "ta-dl", "ta-oh", "ta-out"], function () {
    var beg = num($("ta-beg")), dm = num($("ta-dm")), dl = num($("ta-dl")), oh = num($("ta-oh")), out = num($("ta-out"));
    var total = beg + dm + dl + oh, end = total - out;
    $("ta-in").textContent = usd(total);
    $("ta-end").textContent = usd(end);
    $("ta-note").textContent = end < 0 ? "More was transferred out than the account ever held. Check the completed amount."
      : usd(beg) + " + " + usd(dm) + " + " + usd(dl) + " + " + usd(oh) + " − " + usd(out) + " = " + usd(end) + " still in process.";
  });

  /* ---------- 3.3 Schedules ---------- */
  on(["sc-rmb", "sc-pur", "sc-rme", "sc-ind", "sc-dl", "sc-oh", "sc-wb", "sc-we", "sc-fb", "sc-fe"], function () {
    var v = function (id) { return num($(id)); };
    var dm = v("sc-rmb") + v("sc-pur") - v("sc-rme") - v("sc-ind");
    var tmc = dm + v("sc-dl") + v("sc-oh"), cogm = tmc + v("sc-wb") - v("sc-we"), cogs = v("sc-fb") + cogm - v("sc-fe");
    $("sc-dm").textContent = usd(dm); $("sc-tmc").textContent = usd(tmc);
    $("sc-cogm").textContent = usd(cogm); $("sc-cogs").textContent = usd(cogs);
  });

  /* ---------- 3.4 Dispose of the overhead balance ---------- */
  on(["dp-act", "dp-app", "dp-w", "dp-f"], function () {
    var bal = num($("dp-act")) - num($("dp-app")), w = Math.max(0, num($("dp-w"))) / 100, f = Math.max(0, num($("dp-f"))) / 100;
    var c = Math.max(0, 1 - w - f), sign = bal >= 0 ? "" : "−";
    $("dp-bal").textContent = bal === 0 ? "No balance" : usd(Math.abs(bal)) + (bal > 0 ? " underapplied" : " overapplied");
    $("dp-tw").textContent = sign + usd(Math.abs(bal) * w);
    $("dp-tf").textContent = sign + usd(Math.abs(bal) * f);
    $("dp-tc").textContent = sign + usd(Math.abs(bal) * c);
    $("dp-note").textContent = w + f > 1 ? "The WIP and FG shares add up to more than 100%. Lower one of them."
      : bal === 0 ? "Applied matched actual exactly, so there is nothing to close."
        : (bal > 0 ? "Underapplied: the accounts were undercosted, so each one is increased." : "Overapplied: the accounts were overcosted, so each one is reduced.") +
          " Closing it all to cost of goods sold instead would " + (bal > 0 ? "add " : "subtract ") + usd(Math.abs(bal)) + " there.";
  });
})();
