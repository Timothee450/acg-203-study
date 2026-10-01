/* This is ACG 203 Study, not SIE Study: its own name, its own saved-data keys, no SIE wording. */
load("chapters/chapters.js");
var pages = ["index.html"];
CHAPTERS.forEach(function (c) {
  ["index.html", "textbook.html", "learn.html", "quiz.html"].forEach(function (p) { pages.push("chapters/" + c.id + "/" + p); });
});
function visible(html) { return html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, " "); }
test("storage keys belong to this site (SIE shares the same github.io origin)", function () {
  var p = readFile("assets/progress.js"), t = readFile("assets/theme.js");
  ok(p.indexOf('"acg203-study:v1"') > -1, "progress key");
  ok(t.indexOf('"acg203-study:theme"') > -1, "theme key");
  ok((p + t).indexOf("sie-study") === -1, "no SIE keys left");
});
test("quiz engine wording is not SIE-specific", function () {
  ok(!/SIE|FINRA/.test(readFile("assets/quiz.js").replace(/\/\*[\s\S]*?\*\//g, "")), "quiz.js mentions SIE/FINRA");
});
pages.forEach(function (p) {
  test(p + " is branded ACG 203 Study with no SIE/FINRA copy", function () {
    var html = readFile(p);
    ok(/ACG 203/.test(html), "missing ACG 203 name");
    ok(!/\bSIE\b|FINRA/.test(visible(html)), "SIE/FINRA wording in page copy");
  });
});
test("no chapter script says 'free' (tax-free, risk-free, ...)", function () {
  CHAPTERS.forEach(function (c) {
    ["textbook.js", "learn.js", "questions.js"].forEach(function (f) {
      var src = ""; try { src = readFile("chapters/" + c.id + "/" + f); } catch (e) { return; }
      ok(!/\bfree\b/i.test(src), c.id + "/" + f + " contains 'free'");
    });
  });
});
