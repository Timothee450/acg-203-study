load("chapters/chapters.js");
test("registry lists chapters in textbook order (course skips 12)", function () {
  var allowed = ["ch1", "ch2", "ch3", "ch4", "ch5", "ch6", "ch7", "ch8", "ch9", "ch10", "ch11", "ch13", "ch14"];
  var ids = CHAPTERS.map(function (c) { return c.id; });
  eq(ids, allowed.filter(function (id) { return ids.indexOf(id) > -1; }));
  CHAPTERS.forEach(function (c) { eq("ch" + c.num, c.id); eq(c.href, "chapters/" + c.id + "/index.html"); });
});
test("chapter titles", function () {
  eq(CHAPTERS[0].title, "Managerial Accounting and Cost Concepts");
  eq(CHAPTERS[1].title, "Job-Order Costing: Calculating Unit Product Costs");
  eq(CHAPTERS[2].title, "Job-Order Costing: Cost Flows and External Reporting");
  eq(CHAPTERS[3].title, "Process Costing");
  eq(CHAPTERS[4].title, "Cost-Volume-Profit Relationships");
  eq(CHAPTERS[5].title, "Variable Costing and Segment Reporting");
  CHAPTERS.forEach(function (c) { ok(typeof c.summary === "string" && c.summary.length > 20, c.id + " summary"); });
});
