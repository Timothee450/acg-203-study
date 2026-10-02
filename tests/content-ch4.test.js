/* Chapter 4 facts that must agree across the Textbook, the Learning deck and the quiz.
   Seabright Hot Sauce Co., May. Two departments: Blending → Bottling. Weighted-average method, Blending department:
   Beginning WIP 4,000 gal (materials $9,000, conversion $3,600) · started 36,000 · completed and transferred 34,000
   Ending WIP 6,000 gal: materials 80% complete, conversion 50% → 4,800 and 3,000 equivalent units
   Equivalent units: materials 38,800 · conversion 37,000
   Costs added: materials $88,000 · conversion $51,900 (direct labor $18,900 + overhead applied $33,000)
   Cost per EU: $97,000 ÷ 38,800 = $2.50 · $55,500 ÷ 37,000 = $1.50 · total $4.00
   Transferred out 34,000 × $4.00 = $136,000 · ending WIP $12,000 + $4,500 = $16,500 · reconciliation $152,500
   Bottling: $10,000 beginning + $136,000 transferred in + $14,000 materials + $12,000 labor + $20,000 overhead = $192,000;
   $180,000 to Finished Goods, $12,000 left. Finished Goods → Cost of Goods Sold $170,000. */
var tb = readFile("chapters/ch4/textbook.html"), ln = readFile("chapters/ch4/learn.html"), lnjs = readFile("chapters/ch4/learn.js");
var deck = ln + lnjs;
function both(s, msg) { ok(tb.indexOf(s) > -1, "textbook missing " + (msg || s)); ok(deck.indexOf(s) > -1, "learning missing " + (msg || s)); }
test("units: 4,000 + 36,000 = 34,000 + 6,000", function () {
  ["4,000", "36,000", "34,000", "6,000"].forEach(function (n) { both(n); });
  ok(/4,000 \+ 36,000 = 40,000/.test(tb), "textbook: units to account for");
  ok(/34,000 \+ 6,000 = 40,000/.test(tb), "textbook: units accounted for");
});
test("equivalent units: 38,800 materials, 37,000 conversion", function () {
  both("38,800"); both("37,000"); both("4,800"); both("3,000");
  ok(/34,000 \+ \(?6,000 × 80%\)? = 38,800/.test(tb), "textbook materials EU");
  ok(/34,000 \+ \(?6,000 × 50%\)? = 37,000/.test(tb), "textbook conversion EU");
  ok(/beginning work in process never enters/i.test(tb), "textbook: weighted-average ignores beginning % complete");
});
test("cost per equivalent unit: $2.50 + $1.50 = $4.00", function () {
  ["$2.50", "$1.50", "$4.00", "$97,000", "$55,500", "$88,000", "$51,900"].forEach(function (n) { both(n); });
  ok(/\$97,000 ÷ 38,800 = \$2\.50/.test(tb), "textbook materials cost per EU");
  ok(/\$55,500 ÷ 37,000 = \$1\.50/.test(tb), "textbook conversion cost per EU");
});
test("assigning costs and the reconciliation: $136,000 + $16,500 = $152,500", function () {
  both("$136,000"); both("$16,500"); both("$152,500"); both("$12,000"); both("$4,500");
  ok(/34,000 × \$4\.00 = \$136,000/.test(tb), "textbook transferred out");
  ok(/4,800 × \$2\.50 = \$12,000/.test(tb) && /3,000 × \$1\.50 = \$4,500/.test(tb), "textbook ending WIP");
});
test("cost flow between departments", function () {
  both("$180,000"); both("$170,000");
  ok(/Work in Process–Bottling<\/td><td class="num">136,000/.test(tb), "textbook transfer entry debits WIP–Bottling");
  ok(/conversion cost[^.]*direct labor[^.]*overhead/i.test(tb), "textbook defines conversion cost");
});
test("simulator math uses the agreed constants", function () {
  ok(/BEG = \{ units: 4000, mat: 9000, conv: 3600 \}/.test(lnjs), "beginning WIP");
  ok(/ADDED = \{ mat: 88000, conv: 51900 \}/.test(lnjs), "costs added");
  ok(/DONE = 34000/.test(lnjs), "completed and transferred");
  ok(/END = \{ units: 6000, mat: \.8, conv: \.5 \}/.test(lnjs), "ending WIP");
});
test("numeric quiz answer keys are right", function () {
  load("chapters/ch4/questions.js");
  function key(part) {
    var q = QUIZ.questions.filter(function (x) { return x.q.indexOf(part) > -1; });
    eq(q.length, 1, "question containing: " + part);
    return q[0].options[q[0].answer];
  }
  eq(key("What were the equivalent units of production for conversion?"), "17,000");
  eq(key("What is the cost per equivalent unit for materials?"), "$2.00");
  eq(key("What cost was transferred out?"), "$120,000");
  eq(key("What is the cost of ending work in process?"), "$10,000");
  eq(key("How many units were completed and transferred out?"), "25,000");
  eq(key("What were the total costs to be accounted for?"), "$80,000");
});
test("wording rule: the word 'free' never appears in page copy", function () {
  var text = (tb + ln).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, " ");
  ok(!/\bfree\b/i.test(text + lnjs), "found 'free'");
});
test("Learning deck is animation-rich: at least 8 simulators and 8 animated step hooks", function () {
  var sims = (ln.match(/data-sim="/g) || []).length, keys = (ln.match(/data-key="(?!div|title)[^"]+"/g) || []).length;
  ok(sims >= 8, "only " + sims + " simulators");
  ok(keys >= 8, "only " + keys + " animated (hooked) slides");
});
