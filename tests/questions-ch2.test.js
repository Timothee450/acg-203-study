var document = undefined;
load("assets/quiz.js"); load("chapters/ch2/questions.js");
test("ch2: 25 valid questions", function () { eq(validateQuiz(QUIZ), []); eq(QUIZ.questions.length, 25); eq(QUIZ.chapter, "ch2"); });
test("ch2: answers spread across A-D", function () {
  var c = [0,0,0,0]; QUIZ.questions.forEach(function (q) { c[q.answer]++; });
  ok(c.every(function (n) { return n >= 5; }), "answer distribution " + JSON.stringify(c));
});
test("ch2: every section 2.1-2.6 is covered", function () {
  ["s2-1", "s2-2", "s2-3", "s2-4", "s2-5", "s2-6"].forEach(function (p) {
    ok(QUIZ.questions.filter(function (q) { return q.section.indexOf(p) === 0; }).length >= 3, "fewer than 3 questions for " + p);
  });
});
test("ch2: no duplicate questions", function () {
  var seen = {}; QUIZ.questions.forEach(function (q) { ok(!seen[q.q], "dup: " + q.q); seen[q.q] = 1; });
});
test("ch2: no 'free' wording (tax-free, risk-free, ...)", function () {
  ok(!/\bfree\b/i.test(JSON.stringify(QUIZ)), "found 'free' in questions.js");
});
