# ACG 203 Study

A course-style study site for ACG 203 Managerial Accounting (built on the SIE Study engine). Each chapter has three parts:

- **Textbook**: detailed reading, with worked examples, tables and calculators
- **Learning**: an animated, click-through lesson where every concept moves on screen, plus hands-on simulators
- **Quiz**: original practice questions; the best score shows on the home page and the chapter page

The site is plain HTML, CSS and JavaScript. There is no build step, and every link is relative, so the folder can be hosted as is (for example on GitHub Pages).

## Folder layout

```
index.html               home page (chapter cards)
assets/                  shared theme, progress storage, quiz engine, slide engine (deck.js/deck.css),
                         and page styles (hub.css, textbook.css, quiz.css)
chapters/chapters.js     list of chapters shown on the home page
chapters/ch1/            Chapter 1 (Managerial Accounting and Cost Concepts): hub (index.html), textbook, learn, quiz, questions.js
tests/                   unit tests (run with macOS's built-in JavaScriptCore)
tools/                   site checker and preview helpers
```

The working folder on the author's Mac also has `source/` (private outline notes) and `docs/` (design spec). Those aren't published.

Chapters keep the textbook's chapter numbers (the course skips Chapter 12). All explanations, examples and questions are original; companies and numbers are fictional.

**Planned link:** https://timothee450.github.io/acg-203-study/ (not published yet)

## Preview

The preview server can't read files on the Desktop directly, so it serves a copy:

```bash
sh tools/sync.sh
```

Then start the `acg203-study` preview (configured in `.claude/launch.json`) and open http://localhost:8767. Re-run `sh tools/sync.sh` after each edit.

## Checks

```bash
sh tests/run.sh
```

```bash
python3 tools/check_site.py
```

`run.sh` runs the unit tests: theme, progress storage, quiz engine, chapter list and question data. `check_site.py` checks every link and anchor. It also checks that each quiz question's "read this in the textbook" link points at a real section, that no link starts with `/` (those would break once the site is hosted in a sub-folder), and that the word "free" doesn't appear in page copy.

## Add a chapter

1. Copy `chapters/ch1/` to `chapters/chN/`.
2. Replace the content of `index.html`, `textbook.html`/`textbook.js` and `learn.html`/`learn.js`. Then replace the questions in `questions.js` and set `chapter: "chN"`. Shared styles come from `assets/`; only add a small inline `<style>` for something truly chapter-specific.
3. In `learn.js`, define the chapter's `Sims` (one per `data-sim` slide) and call `SIEDeck.start({ sections, sims, hooks })`. Step animations are declared in the HTML with `data-at` / `data-move` / `data-count` (see the top of `chapters/ch1/learn.js`); give the slide a `data-key` that maps to the generic hook.
4. In the new hub (`chapters/chN/index.html`), change `Progress.showBadge(…, "ch1")` to `"chN"`.
5. Add an entry to `chapters/chapters.js` and update `tests/chapters.test.js`. Copy `tests/questions-ch1.test.js` and `tests/content-ch1.test.js` for the new chapter, then run both checks.

Quiz scores are saved in the visitor's own browser (`localStorage`), so they stay on that device only.
