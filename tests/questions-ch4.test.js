var document = undefined;
load("assets/quiz.js"); load("chapters/ch4/questions.js");
test("ch4: 25 valid questions", function () { eq(validateQuiz(QUIZ), []); eq(QUIZ.questions.length, 25); eq(QUIZ.chapter, "ch4"); });
test("ch4: answers spread across A-D", function () {
  var c = [0,0,0,0]; QUIZ.questions.forEach(function (q) { c[q.answer]++; });
  ok(c.every(function (n) { return n >= 5; }), "answer distribution " + JSON.stringify(c));
});
test("ch4: every section 4.1-4.6 is covered", function () {
  ["s4-1", "s4-2", "s4-3", "s4-4", "s4-5", "s4-6"].forEach(function (p) {
    ok(QUIZ.questions.filter(function (q) { return q.section.indexOf(p) === 0; }).length >= 3, "fewer than 3 questions for " + p);
  });
});
test("ch4: no duplicate questions", function () {
  var seen = {}; QUIZ.questions.forEach(function (q) { ok(!seen[q.q], "dup: " + q.q); seen[q.q] = 1; });
});
test("ch4: no 'free' wording", function () { ok(!/\bfree\b/i.test(JSON.stringify(QUIZ)), "found 'free'"); });
