/* Chapter 5 facts that must agree across the Textbook, the Learning deck and the quiz.
   Brightwick Candle Co., one month. Price $25, variable expense $15 → unit CM $10, CM ratio 40%, variable expense ratio 60%. Fixed expenses $40,000.
   Current: 5,000 candles → sales $125,000, variable $75,000, CM $50,000, NOI $10,000.
   DOL $50,000 ÷ $10,000 = 5 → sales +10% gives NOI +50% ($15,000).
   Break-even $40,000 ÷ $10 = 4,000 candles; $40,000 ÷ 40% = $100,000. Margin of safety $125,000 − $100,000 = $25,000 = 20% (1,000 candles).
   Target profit $20,000: ($40,000 + $20,000) ÷ $10 = 6,000 candles = $150,000.
   What-ifs: (a) +$6,000 ads, +$20,000 sales → CM +$8,000, NOI +$2,000. (b) price $23, 6,500 candles → CM $52,000, NOI $12,000.
   (c) $5,000 of fixed salaries → $1 commission, 5,500 candles → CM $49,500 − $35,000 = $14,500.
   Sales mix (with diffusers): candles $120,000 at 40% + diffusers $80,000 at 60% = $200,000, CM $96,000, 48%; fixed $72,000 → break-even $150,000.
   Mix shifts to $150,000 / $50,000 → CM $90,000, 45% → break-even $160,000. */
var tb = readFile("chapters/ch5/textbook.html"), ln = readFile("chapters/ch5/learn.html"), lnjs = readFile("chapters/ch5/learn.js");
var deck = ln + lnjs;
function both(s, msg) { ok(tb.indexOf(s) > -1, "textbook missing " + (msg || s)); ok(deck.indexOf(s) > -1, "learning missing " + (msg || s)); }
test("contribution margin: $25 − $15 = $10, 40% CM ratio", function () {
  ["$25", "$15", "$10", "40%", "60%", "$40,000", "$125,000", "$75,000", "$50,000", "$10,000"].forEach(function (n) { both(n); });
  ok(/\$10 ÷ \$25 = 40%/.test(tb), "textbook CM ratio");
  ok(/selling price[^.]*constant/i.test(tb), "textbook lists the CVP assumptions");
});
test("operating leverage: 5", function () {
  ok(/\$50,000 ÷ \$10,000 = 5/.test(tb), "textbook DOL");
  both("50%"); both("$15,000");
});
test("break-even and margin of safety", function () {
  both("4,000"); both("$100,000"); both("$25,000"); both("20%");
  ok(/\$40,000 ÷ \$10 = 4,000/.test(tb), "textbook break-even units");
  ok(/\$40,000 ÷ 40% = \$100,000/.test(tb), "textbook break-even dollars");
  ok(/\$125,000 − \$100,000 = \$25,000/.test(tb), "textbook margin of safety");
});
test("target profit: 6,000 candles, $150,000", function () {
  both("6,000"); both("$150,000"); both("$20,000");
  ok(/\(\$40,000 \+ \$20,000\) ÷ \$10 = 6,000/.test(tb), "textbook target units");
});
test("what-if changes", function () {
  both("$6,000"); both("$52,000"); both("$12,000"); both("$14,500");
});
test("sales mix: 48% → $150,000; 45% → $160,000", function () {
  both("48%"); both("45%"); both("$72,000"); both("$160,000"); both("$96,000");
  ok(/\$72,000 ÷ 48% = \$150,000/.test(tb), "textbook mix break-even");
  ok(/\$72,000 ÷ 45% = \$160,000/.test(tb), "textbook shifted mix break-even");
});
test("simulator math uses the agreed constants", function () {
  ok(/PRICE = 25, VC = 15, FIXED = 40000/.test(lnjs), "price, variable cost, fixed");
  ok(/UNITS = 5000/.test(lnjs), "current volume");
  ok(/MIX = \{ candles: \{ sales: 120000, cmr: \.4 \}, diffusers: \{ sales: 80000, cmr: \.6 \}, fixed: 72000 \}/.test(lnjs), "sales mix");
});
test("numeric quiz answer keys are right", function () {
  load("chapters/ch5/questions.js");
  function key(part) {
    var q = QUIZ.questions.filter(function (x) { return x.q.indexOf(part) > -1; });
    eq(q.length, 1, "question containing: " + part);
    return q[0].options[q[0].answer];
  }
  eq(key("What is the break-even point in units?"), "5,000 units");
  eq(key("What is the contribution margin ratio?"), "30%");
  eq(key("What is the degree of operating leverage?"), "3");
  eq(key("How many units must be sold to earn a target profit of $18,000?"), "5,000 units");
  eq(key("What is the margin of safety percentage?"), "25%");
  eq(key("What is the break-even point in sales dollars?"), "$400,000");
  eq(key("By how much will net operating income increase?"), "$15,000");
  eq(key("What is the company's overall contribution margin ratio?"), "40%");
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
