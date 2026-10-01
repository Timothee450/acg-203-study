load("chapters/chapters.js");
test("registry lists chapter 1 first, numbered like the textbook", function () {
  eq(CHAPTERS.map(function (c) { return [c.id, c.num]; }).slice(0, 1), [["ch1", 1]]);
});
test("chapter entries are complete", function () {
  eq([CHAPTERS[0].title, CHAPTERS[0].href], ["Managerial Accounting and Cost Concepts", "chapters/ch1/index.html"]);
  CHAPTERS.forEach(function (c) { ok(typeof c.summary === "string" && c.summary.length > 20, c.id + " summary"); });
});
