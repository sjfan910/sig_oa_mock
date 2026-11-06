# SIG HackerRank OA Mock

A practice replica of the **HackerRank 2027 US Susquehanna Assessment** for the Discovery Program: Quantitative Trading / Quantitative Strategy Development.

It matches the format in the invitation email:

| | Real test | This mock |
|---|---|---|
| Duration | 75 min, can't pause | 75 min timer, auto-submits at 0 (untimed option) |
| Sections | 12, one question each | 12 |
| Mix | 11 math + 1 coding | 11 math + 1 coding |
| Order | Choose "start with math" or "start with coding" | Same choice screen |
| Navigation | Move freely between sections | Left rail, Previous / Next, flag for review |
| Topics | Probability, logic, problem-solving | Same (see below) |
| Tools | Pen, paper, calculator | Use your own |
| Proctoring | Camera + leaving the window ends the test | Optional camera preview; tab-switch warning, or **strict mode** that ends the test |

## Run it

**Recommended: the local runner** (real Python 3, C++17, Java and Node, with HackerRank-like time limits):

```bash
python3 server.py
```

Then open http://localhost:8000. It needs only the Python standard library. C++ and Java need `g++` and a JDK installed.

**No-install option:** open `index.html` directly in Chrome. Python 3 runs in the browser through Pyodide (downloaded from jsDelivr the first time, so you need internet). JavaScript runs too. C++ and Java need the local runner.

## What's inside

- **3 full mocks (A, B, C)**, 11 math questions each, ordered from easy to hard like the real test. There's also a **random mix** drawn from all 40 math questions (3 easy, 6 medium, 2 hard).
- **3 coding problems**, each with Python 3 / C++ / Java / JavaScript starter code in HackerRank's "complete the function" style. Run Code runs the 2 sample cases; Submit runs all 12 cases (10 hidden).
  - Dice Sum Ways: DP counting
  - Order Book Matching: heaps, price-time priority
  - Red and Black Card Game: optimal-stopping EV DP
- **💡 Hint button** on every question. It opens a panel with the topic, difficulty, "things to think about", step-by-step hints revealed one at a time, the full solution, and the question's source. Hints and revealed solutions are logged in your results.
- **Results page** with your math score, coding test cases passed, time used, a per-topic breakdown, and every question's solution.
- Answers save automatically to your browser's local storage, so a reload lets you resume.

Math answers are a mix of multiple choice and typed numbers. The number box accepts `5/9`, `0.556`, `4/pi`, `45%`, `2*sqrt(3)` and similar.

## Where the questions come from

Each question shows a source tag:

- **Reported:** candidates reported SIG asking it (Glassdoor, QuantBlueprint, TheWallStreetQuants). Examples: two torpedoes, burnt pancakes, chord length on a unit circle, accepting a double, two positive tests, smallest of three uniforms.
- **SIG-style:** a question type that prep sites list as a SIG staple (gambler's ruin, lattice paths, Bayes coins, dice EV, reroll games, Markov hitting times, x + y < 1.5), with the numbers sometimes changed.
- **Original:** written for this mock to cover a listed topic.

SIG doesn't publish its questions, and the reported ones come from third-party sites, so treat the bank as topic-accurate practice, not the actual test. Every answer key was checked with exact-fraction scripts or simulation.

Topic coverage: probability (complement, conditional, Bayes), expected value (dice, order statistics, optimal stopping, Kelly), combinatorics (lattice paths, circular arrangements, stars and bars, derangements, cards), continuous / geometric probability, random walks and gambler's ruin, Markov chains and first-step analysis, calculus optimisation, and logic (knights and knaves, hats, sequences).

## Files

```
index.html          app shell
css/style.css       HackerRank-style UI
js/questions.js     math + coding question bank (hints, solutions, sources)
js/tests.js         generated coding test cases
js/runner.js        code runner (local server, or in-browser fallback)
js/app.js           screens, timer, grading, hints, results
server.py           static server + /api/run code runner (stdlib only)
tools/gen_tests.py  reference solutions; regenerates js/tests.js
vendor/             CodeMirror 5 and KaTeX (MIT), bundled for offline use
```

To add a question, append an object to `MATH_QUESTIONS` in `js/questions.js` following the existing fields.
