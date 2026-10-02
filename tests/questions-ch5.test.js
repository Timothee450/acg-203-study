var document = undefined;
load("assets/quiz.js"); load("chapters/ch5/questions.js");
test("ch5: 25 valid questions", function () { eq(validateQuiz(QUIZ), []); eq(QUIZ.questions.length, 25); eq(QUIZ.chapter, "ch5"); });
test("ch5: answers spread across A-D", function () {
  var c = [0,0,0,0]; QUIZ.questions.forEach(function (q) { c[q.answer]++; });
  ok(c.every(function (n) { return n >= 5; }), "answer distribution " + JSON.stringify(c));
});
test("ch5: every section 5.1-5.7 is covered", function () {
  ["s5-1", "s5-2", "s5-3", "s5-4", "s5-5", "s5-6", "s5-7"].forEach(function (p) {
    ok(QUIZ.questions.filter(function (q) { return q.section.indexOf(p) === 0; }).length >= 3, "fewer than 3 questions for " + p);
  });
});
test("ch5: no duplicate questions", function () {
  var seen = {}; QUIZ.questions.forEach(function (q) { ok(!seen[q.q], "dup: " + q.q); seen[q.q] = 1; });
});
test("ch5: no 'free' wording", function () { ok(!/\bfree\b/i.test(JSON.stringify(QUIZ)), "found 'free'"); });
