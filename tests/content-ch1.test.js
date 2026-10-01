/* Chapter 1 facts that must agree across the Textbook and the Learning deck.
   Worked example (fictional Northstar Kayak Co., one month, 1,000 kayaks made, 800 sold):
   DM $60,000 + DL $40,000 + MOH $50,000 = $150,000 → $150 a kayak; COGS $120,000; finished goods $30,000.
   Merchandiser example (Harbor Outfitters): both formats reach $10,000 net operating income; CM $33,000. */
var tb = readFile("chapters/ch1/textbook.html"), ln = readFile("chapters/ch1/learn.html"), lnjs = readFile("chapters/ch1/learn.js");
var deck = ln + lnjs;
function both(s, msg) { ok(tb.indexOf(s) > -1, "textbook missing " + (msg || s)); ok(deck.indexOf(s) > -1, "learning missing " + (msg || s)); }
test("manufacturing costs: $60,000 + $40,000 + $50,000 = $150,000, $150 a kayak", function () {
  ["$60,000", "$40,000", "$50,000", "$150,000", "$150"].forEach(function (n) { both(n); });
});
test("prime = DM + DL ($100,000); conversion = DL + MOH ($90,000)", function () {
  ok(/prime cost[^.]*direct materials[^.]*direct labor/i.test(tb), "textbook defines prime cost");
  ok(/conversion cost[^.]*direct labor[^.]*(manufacturing )?overhead/i.test(tb), "textbook defines conversion cost");
  both("$100,000"); both("$90,000");
});
test("product costs: 800 sold → COGS $120,000, 200 left → finished goods $30,000", function () {
  both("$120,000"); both("$30,000");
});
test("fixed cost per unit: $12,000 rent is $12 a kayak at 1,000 kayaks; relevant range tops out at 1,500", function () {
  both("$12,000"); both("1,500");
});
test("mixed cost formula Y = a + bX with $2,000 + $4 a kayak = $6,000 at 1,000 kayaks", function () {
  ok(/Y\s*=\s*a\s*\+\s*bX/.test(tb) && /Y\s*=\s*a\s*\+\s*bX/.test(deck), "formula in both");
  both("$2,000"); both("$6,000");
});
test("decision example: online beats the dealer by $500 once the $1,500 opportunity cost counts; $8,000 molds are sunk", function () {
  both("$1,500"); both("$500"); both("$8,000");
});
test("both income statement formats reach $10,000; contribution margin $33,000", function () {
  both("$10,000"); both("$33,000");
  ok(/contribution margin/i.test(tb) && /gross margin/i.test(tb), "textbook names both margins");
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

/* ---- facts checked in context, not just "the string appears somewhere" ---- */
test("textbook cost table puts each amount on the right line", function () {
  ok(/Direct materials<\/td><td class="num">\$60,000/.test(tb), "DM $60,000");
  ok(/Direct labor<\/td><td class="num">\$40,000/.test(tb), "DL $40,000");
  ok(/Manufacturing overhead \(rent \$12,000, electricity \$6,000, supervisors \$15,000, mold depreciation \$9,000, maintenance \$5,000, indirect materials \$3,000\)<\/td><td class="num">\$50,000/.test(tb), "MOH lines add to $50,000");
  ok(/\$150(?![,\d])/.test(tb) && /\$150(?![,\d])/.test(deck), "$150 a kayak (not just $150,000)");
  ok(/prime cost = \$60,000 \+ \$40,000 = <span class="num">\$100,000/i.test(tb), "prime worked example");
  ok(/Conversion cost = \$40,000 \+ \$50,000 = <span class="num">\$90,000/.test(tb), "conversion worked example");
});
test("cost flow: only direct materials start in Raw materials", function () {
  ok(/Only <strong>direct materials<\/strong> start in Raw materials/.test(tb), "textbook says so");
  ok(/Only direct materials start in Raw materials/.test(ln), "learning deck says so");
});
test("simulator math uses the agreed constants", function () {
  ok(/UNIT = 150\b/.test(lnjs), "flow: $150 a kayak");
  ok(/RATE = 45, RENT = 12000, RENT2 = 20000, RANGE = 1500/.test(lnjs), "behavior: $45 resin, $12,000 rent stepping to $20,000 past 1,500");
  ok(/const d1 = 37000 /.test(lnjs) && /d2 = 39000 /.test(lnjs) && /opp \? 1500 : 0/.test(lnjs) && /sunk \? 0 : 8000/.test(lnjs), "decision: dealer 37,000, online 39,000, $1,500 opportunity, $8,000 sunk");
  ok(/cm = 33 \* n, noi = cm - 23000/.test(lnjs), "volume sim: $33 a paddle, $23,000 fixed");
  ok(/value="2000"/.test(ln) && /id="mx-b" min="0" max="8" step="0.5" value="4"/.test(ln), "mixed sim starts at a = $2,000, b = $4");
});
test("numeric quiz answer keys are right", function () {
  load("chapters/ch1/questions.js");
  function key(part) {
    var q = QUIZ.questions.filter(function (x) { return x.q.indexOf(part) > -1; });
    eq(q.length, 1, "question containing: " + part);
    return q[0].options[q[0].answer];
  }
  eq(key("What is its prime cost?"), "$50,000");
  eq(key("what is the conversion cost?"), "$45,000");
  eq(key("What is cost of goods sold?"), "$60,000");
  eq(key("what is ending finished goods inventory?"), "$20,000");
  eq(key("the total lease cost is:"), "$9,000");
  eq(key("What is the total cost at 800 machine hours?"), "$3,900");
  eq(key("By how much is Option B better?"), "$3,000");
  eq(key("What is its contribution margin?"), "$70,000");
});
