/* Chapter 6 facts that must agree across the Textbook, the Learning deck and the quiz.
   Cobalt Trail Packs. Price $80. Variable manufacturing $30 (DM $14 + DL $10 + VOH $6). Fixed MOH $200,000 a year.
   Variable selling & admin $5 a pack; fixed selling & admin $90,000.
   Unit product cost: variable costing $30; absorption $30 + $200,000 ÷ 10,000 = $50 ($20 fixed MOH per pack).
   Year 1: made 10,000, sold 8,000 → variable NOI $70,000, absorption NOI $110,000; 2,000 × $20 = $40,000 deferred.
   Year 2: made 10,000, sold 12,000 → variable NOI $250,000, absorption NOI $210,000; $40,000 released.
   Segments: Online $500,000 sales, 60% CM, traceable $180,000 → margin $120,000; Retail $500,000, 40%, $120,000 → $80,000.
   Company: CM $500,000 (50%), segment margin $200,000, common $100,000 → NOI $100,000.
   Break-even: Online $180,000 ÷ 60% = $300,000; Retail $120,000 ÷ 40% = $300,000; company ($300,000 + $100,000) ÷ 50% = $800,000.
   Allocation trap: 90% of common ($90,000) to Retail shows −$10,000; dropping Retail loses $80,000 → NOI $20,000. */
var tb = readFile("chapters/ch6/textbook.html"), ln = readFile("chapters/ch6/learn.html"), lnjs = readFile("chapters/ch6/learn.js");
var deck = ln + lnjs;
function both(s, msg) { ok(tb.indexOf(s) > -1, "textbook missing " + (msg || s)); ok(deck.indexOf(s) > -1, "learning missing " + (msg || s)); }
test("unit product cost: $30 variable, $50 absorption", function () {
  ["$80", "$30", "$50", "$20", "$200,000"].forEach(function (n) { both(n); });
  ok(/\$30 \+ \$200,000 ÷ 10,000 = \$50/.test(tb), "textbook absorption unit cost");
  ok(/variable costing[^.]*fixed manufacturing overhead[^.]*period cost/i.test(tb), "textbook: variable costing treats fixed MOH as a period cost");
});
test("year 1 and year 2 income: $70,000 vs $110,000, $250,000 vs $210,000", function () {
  ["$70,000", "$110,000", "$250,000", "$210,000", "$40,000"].forEach(function (n) { both(n); });
  ok(/2,000 × \$20 = \$40,000/.test(tb), "textbook reconciliation");
  ok(/produces more than it sells, absorption costing reports the higher profit/i.test(tb), "textbook: production > sales → absorption higher");
});
test("segment margins and common costs", function () {
  ["$500,000", "$180,000", "$120,000", "$80,000", "$100,000", "$200,000"].forEach(function (n) { both(n); });
  ok(/common fixed costs? (should not|shouldn't|are not) be allocated|never allocate/i.test(tb), "textbook: don't allocate common costs");
  ok(/traceable fixed cost[^.]*(disappear|go away|eliminated)/i.test(tb), "textbook defines traceable fixed cost");
});
test("break-even: $300,000 per segment, $800,000 company", function () {
  both("$300,000"); both("$800,000"); both("50%");
  ok(/\$180,000 ÷ 60% = \$300,000/.test(tb) && /\$120,000 ÷ 40% = \$300,000/.test(tb), "textbook segment break-evens");
  ok(/\(\$300,000 \+ \$100,000\) ÷ 50% = \$800,000/.test(tb), "textbook companywide break-even");
});
test("allocation trap: dropping Retail cuts NOI to $20,000", function () {
  both("$90,000"); both("$20,000");
});
test("simulator math uses the agreed constants", function () {
  ok(/PRICE = 80, VMFG = 30, FMOH = 200000/.test(lnjs), "costs");
  ok(/SEG = \{ online: \{ sales: 500000, cmr: \.6, fixed: 180000 \}, retail: \{ sales: 500000, cmr: \.4, fixed: 120000 \}, common: 100000 \}/.test(lnjs), "segments");
});
test("numeric quiz answer keys are right", function () {
  load("chapters/ch6/questions.js");
  function key(part) {
    var q = QUIZ.questions.filter(function (x) { return x.q.indexOf(part) > -1; });
    eq(q.length, 1, "question containing: " + part);
    return q[0].options[q[0].answer];
  }
  eq(key("What is the unit product cost under absorption costing?"), "$33");
  eq(key("What is the unit product cost under variable costing?"), "$20");
  eq(key("By how much does absorption costing net operating income exceed"), "$10,000");
  eq(key("What is the segment margin?"), "$80,000");
  eq(key("What is the companywide break-even point in sales dollars?"), "$500,000");
  eq(key("What is the segment's break-even point in sales dollars?"), "$300,000");
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
