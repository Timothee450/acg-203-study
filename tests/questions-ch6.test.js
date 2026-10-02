var document = undefined;
load("assets/quiz.js"); load("chapters/ch6/questions.js");
test("ch6: 25 valid questions", function () { eq(validateQuiz(QUIZ), []); eq(QUIZ.questions.length, 25); eq(QUIZ.chapter, "ch6"); });
test("ch6: answers spread across A-D", function () {
  var c = [0,0,0,0]; QUIZ.questions.forEach(function (q) { c[q.answer]++; });
  ok(c.every(function (n) { return n >= 5; }), "answer distribution " + JSON.stringify(c));
});
test("ch6: every section 6.1-6.6 is covered", function () {
  ["s6-1", "s6-2", "s6-3", "s6-4", "s6-5", "s6-6"].forEach(function (p) {
    ok(QUIZ.questions.filter(function (q) { return q.section.indexOf(p) === 0; }).length >= 3, "fewer than 3 questions for " + p);
  });
});
test("ch6: no duplicate questions", function () {
  var seen = {}; QUIZ.questions.forEach(function (q) { ok(!seen[q.q], "dup: " + q.q); seen[q.q] = 1; });
});
test("ch6: no 'free' wording", function () { ok(!/\bfree\b/i.test(JSON.stringify(QUIZ)), "found 'free'"); });
