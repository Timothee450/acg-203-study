/* Chapter 3 facts that must agree across the Textbook, the Learning deck and the quiz.
   Harborlight Sign Works, March. Opening: RM $8,000 · WIP $20,000 · FG $30,000. Overhead rate $8 per DLH (Chapter 2).
   (1) buy RM $50,000 · (2) issue RM $46,000 = $40,000 direct + $6,000 indirect · (3) labor $92,000 = $80,000 direct (4,000 h × $20) + $12,000 indirect
   (4) other actual overhead $16,000 · actual MOH $34,000 · (5) applied 4,000 × $8 = $32,000 → underapplied $2,000
   (6) selling & admin $22,000 · (7) completed $150,000 · (8) sold: cost $140,000, sales $210,000
   Ending: RM $12,000 · WIP $22,000 · FG $40,000. Total manufacturing costs $152,000 · COGM $150,000.
   COGS $140,000 + $2,000 = $142,000 adjusted · gross margin $68,000 · NOI $46,000.
   Allocation method: applied overhead in ending WIP 15% / FG 25% / COGS 60% → $300 / $500 / $1,200. */
var tb = readFile("chapters/ch3/textbook.html"), ln = readFile("chapters/ch3/learn.html"), lnjs = readFile("chapters/ch3/learn.js");
var deck = ln + lnjs;
function both(s, msg) { ok(tb.indexOf(s) > -1, "textbook missing " + (msg || s)); ok(deck.indexOf(s) > -1, "learning missing " + (msg || s)); }
test("materials and labor split between Work in Process and Manufacturing Overhead", function () {
  ["$50,000", "$46,000", "$40,000", "$6,000", "$92,000", "$80,000", "$12,000"].forEach(function (n) { both(n); });
  ok(/indirect materials[^.]*(debited|charged|go) to Manufacturing Overhead/i.test(tb), "textbook: indirect materials → MOH");
  ok(/indirect labor[^.]*(debited|charged|go) to Manufacturing Overhead/i.test(tb), "textbook: indirect labor → MOH");
});
test("overhead: actual $34,000 debited, applied $32,000 credited, underapplied $2,000", function () {
  both("$34,000"); both("$32,000"); both("$2,000");
  ok(/4,000 (direct labor-)?hours × \$8 = \$32,000/.test(tb), "textbook applied overhead");
  ok(/debit balance[^.]*underapplied/i.test(tb) && /credit balance[^.]*overapplied/i.test(tb), "textbook: debit balance = underapplied, credit = overapplied");
});
test("schedule of cost of goods manufactured: $152,000 total manufacturing costs, $150,000 COGM", function () {
  both("$152,000"); both("$150,000");
  ok(/Raw materials used in production<\/td><td class="num">46,000/.test(tb), "COGM schedule line: RM used $46,000");
  ok(/Cost of goods manufactured<\/strong><\/td><td class="num"><strong>\$150,000/.test(tb), "COGM schedule total");
});
test("schedule of cost of goods sold and income statement: $140,000 → $142,000, NOI $46,000", function () {
  both("$140,000"); both("$142,000"); both("$46,000"); both("$68,000");
  both("$210,000"); both("$22,000");
});
test("ending balances: RM $12,000, WIP $22,000, FG $40,000", function () {
  both("$22,000"); both("$40,000");
  ok(/Raw materials[^<]*<\/td><td class="num">\$8,000<\/td><td class="num">\$12,000/.test(tb), "textbook balance table: RM $8,000 → $12,000");
});
test("allocation method splits $2,000 as $300 / $500 / $1,200", function () {
  both("$300"); both("$500"); both("$1,200");
  ok(/in proportion to the overhead applied/i.test(tb), "textbook names the allocation basis");
});
test("simulator math uses the agreed constants", function () {
  ok(/APPLIED = 32000, ACTUAL = 34000/.test(lnjs), "overhead constants");
  ok(/COGM = 150000/.test(lnjs) && /SOLD = 140000/.test(lnjs), "completed and sold");
  ok(/SHARE = \{ wip: \.15, fg: \.25, cogs: \.6 \}/.test(lnjs), "allocation shares");
});
test("numeric quiz answer keys are right", function () {
  load("chapters/ch3/questions.js");
  function key(part) {
    var q = QUIZ.questions.filter(function (x) { return x.q.indexOf(part) > -1; });
    eq(q.length, 1, "question containing: " + part);
    return q[0].options[q[0].answer];
  }
  eq(key("How much direct materials cost was used in production?"), "$31,000");
  eq(key("What is cost of goods manufactured?"), "$118,000");
  eq(key("What is the adjusted cost of goods sold?"), "$93,000");
  eq(key("What was the overhead balance at year end?"), "$7,000 overapplied");
  eq(key("how much of the underapplied overhead goes to Finished Goods?"), "$1,500");
  eq(key("What is the ending balance in Raw Materials?"), "$9,000");
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
