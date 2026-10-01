var document = undefined;
load("assets/quiz.js"); load("chapters/ch1/questions.js");
test("ch1: 25 valid questions", function () { eq(validateQuiz(QUIZ), []); eq(QUIZ.questions.length, 25); eq(QUIZ.chapter, "ch1"); });
test("ch1: answers spread across A-D", function () {
  var c = [0,0,0,0]; QUIZ.questions.forEach(function (q) { c[q.answer]++; });
  ok(c.every(function (n) { return n >= 5; }), "answer distribution " + JSON.stringify(c));
});
test("ch1: every section 1.1-1.6 is covered", function () {
  ["s1-1", "s1-2", "s1-3", "s1-4", "s1-5", "s1-6"].forEach(function (p) {
    ok(QUIZ.questions.filter(function (q) { return q.section.indexOf(p) === 0; }).length >= 3, "fewer than 3 questions for " + p);
  });
});
test("ch1: no duplicate questions", function () {
  var seen = {}; QUIZ.questions.forEach(function (q) { ok(!seen[q.q], "dup: " + q.q); seen[q.q] = 1; });
});
test("ch1: no 'free' wording (tax-free, risk-free, ...)", function () {
  ok(!/\bfree\b/i.test(JSON.stringify(QUIZ)), "found 'free' in questions.js");
});
