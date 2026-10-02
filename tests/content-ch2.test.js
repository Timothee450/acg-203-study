/* Chapter 2 facts that must agree across the Textbook, the Learning deck and the quiz.
   Harborlight Sign Works (fictional job shop), one year:
   POHR = ($300,000 fixed + $2 × 50,000 DLH) ÷ 50,000 DLH = $400,000 ÷ 50,000 = $8 per DLH.
   Job 214 (20 signs): DM $2,600 + DL 120 h × $20 = $2,400 + MOH 120 × $8 = $960 → $5,960, $298 a sign.
   Departments: Cutting $300,000 ÷ 40,000 MH = $7.50/MH; Finishing $100,000 ÷ 40,000 DLH = $2.50/DLH.
   Job 214: 80 MH × $7.50 = $600 + 90 DLH × $2.50 = $225 = $825 → job $5,825, $291.25 a sign.
   Ledger: WIP $4,000 · FG $9,000 · COGS $20,000. Year end: actual MOH $412,000 vs applied 49,000 × $8 = $392,000 → underapplied $20,000. */
var tb = readFile("chapters/ch2/textbook.html"), ln = readFile("chapters/ch2/learn.html"), lnjs = readFile("chapters/ch2/learn.js");
var deck = ln + lnjs;
function both(s, msg) { ok(tb.indexOf(s) > -1, "textbook missing " + (msg || s)); ok(deck.indexOf(s) > -1, "learning missing " + (msg || s)); }
test("predetermined overhead rate: $400,000 ÷ 50,000 DLH = $8", function () {
  ok(/predetermined overhead rate = estimated total manufacturing overhead[^.]*÷ estimated total (amount of the )?allocation base/i.test(tb), "textbook formula");
  ok(/\$300,000 \+ \$2 × 50,000 = \$400,000/.test(tb), "textbook estimate of total overhead");
  both("$400,000"); both("$8 per direct labor-hour");
});
test("Job 214: $2,600 + $2,400 + $960 = $5,960, $298 a sign", function () {
  ["$2,600", "$2,400", "$960", "$5,960", "$298"].forEach(function (n) { both(n); });
  ok(/120 (direct labor-)?hours × \$8 = \$960/.test(tb), "textbook applied overhead");
  ok(/\$5,960 ÷ 20 = \$298/.test(tb), "textbook unit cost");
});
test("departmental rates: $7.50 per machine-hour and $2.50 per direct labor-hour, Job 214 overhead $825", function () {
  ["$7.50", "$2.50", "$825", "$5,825", "$291.25"].forEach(function (n) { both(n); });
  ok(/80 machine-hours × \$7\.50 = \$600/.test(tb) && /90 direct labor-hours × \$2\.50 = \$225/.test(tb), "textbook departmental application");
});
test("job cost sheets: WIP $4,000, finished goods $9,000, COGS $20,000", function () {
  both("$4,000"); both("$9,000"); both("$20,000");
});
test("underapplied overhead: $412,000 actual vs $392,000 applied → $20,000 added to COGS", function () {
  both("$412,000"); both("$392,000");
  ok(/underapplied[^.]*(increases|added to|raises) cost of goods sold/i.test(tb), "textbook: underapplied increases COGS");
  ok(/overapplied[^.]*(decreases|subtracted from|lowers) cost of goods sold/i.test(tb), "textbook: overapplied decreases COGS");
});
test("simulator math uses the agreed constants", function () {
  ok(/FIXED = 300000, VRATE = 2, BASE = 50000/.test(lnjs), "POHR sim defaults");
  ok(/POHR = 8\b/.test(lnjs), "plantwide rate $8");
  ok(/CUT = 7\.5, FIN = 2\.5/.test(lnjs), "departmental rates");
  ok(/APPLIED = 392000/.test(lnjs), "applied overhead for the year");
});
test("numeric quiz answer keys are right", function () {
  load("chapters/ch2/questions.js");
  function key(part) {
    var q = QUIZ.questions.filter(function (x) { return x.q.indexOf(part) > -1; });
    eq(q.length, 1, "question containing: " + part);
    return q[0].options[q[0].answer];
  }
  eq(key("What is the predetermined overhead rate?"), "$12 per machine-hour");
  eq(key("How much overhead is applied to Job 77?"), "$1,200");
  eq(key("What is the total cost of Job 52?"), "$4,100");
  eq(key("What is the unit product cost of Job 52?"), "$41");
  eq(key("How much overhead does the Milling Department apply to Job 9?"), "$450");
  eq(key("What is the ending balance in Work in Process?"), "$6,000");
  eq(key("By how much was overhead underapplied or overapplied?"), "$15,000 overapplied");
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
