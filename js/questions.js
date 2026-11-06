/*
 * SIG (Susquehanna) HackerRank OA mock: question bank.
 *
 * Format confirmed by the 2027 invitation email: 75 minutes, 12 sections,
 * 11 math + 1 coding, "probability, logic and problem-solving", calculator allowed.
 *
 * source.kind:
 *   "reported"  - question reported by candidates as asked by SIG (Glassdoor / prep sites)
 *   "style"     - question type that prep sites list as a SIG OA staple, numbers our own
 *   "original"  - written for this mock to cover a topic SIG lists (probability/EV/logic)
 *
 * Math types:
 *   mcq     -> answer = index into choices
 *   numeric -> answer = number, tol = absolute tolerance (default: max(0.2% * |ans|, 0.0006))
 * Every answer was verified with a script (exact fractions or simulation).
 */

const SRC = {
  glassdoorTorpedo: { kind: "reported", label: "Glassdoor: SIG Assistant Trader interview", url: "https://www.glassdoor.com/Interview/You-are-the-captain-of-a-submarine-You-have-two-torpedoes-Each-torpedo-hits-a-ship-independently-with-probability-1-3-Wh-QTN_77229.htm" },
  qbPancake: { kind: "reported", label: "QuantBlueprint: SIG question list", url: "https://www.quantblueprint.com/interview-questions/sig/sig-three-pancakes" },
  wsq: { kind: "reported", label: "TheWallStreetQuants: SIG question list", url: "https://www.thewallstreetquants.com/interview-questions/sig" },
  glassdoor: { kind: "reported", label: "Glassdoor: SIG interview reviews", url: "https://www.glassdoor.com/Interview/Susquehanna-International-Group-Interview-Questions-E24446.htm" },
  quantt: { kind: "style", label: "Quantt: SIG interview guide (OA topics)", url: "https://www.quantt.co.uk/resources/sig-interview" },
  qprep: { kind: "style", label: "QuantPrep: SIG online assessment guide", url: "https://www.thequantprepapp.com/guides/sig-online-assessment" },
  tradinginterview: { kind: "style", label: "TradingInterview: SIG quantitative assessment", url: "https://www.tradinginterview.com/the-sig-quantitative-evaluation/" },
  programhelp: { kind: "style", label: "ProgramHelp: SIG OA question types", url: "https://programhelp.net/en/oa/2026-sig-quant-online-assessment/" },
  everythingquant: { kind: "style", label: "EverythingQuant: SIG trader guide", url: "https://everythingquant.com/guides/quantitative-trader-at-sig/" },
  original: { kind: "original", label: "Original, written to match SIG's listed topics", url: "" },
};

window.MATH_QUESTIONS = [
  /* =========================== SET A =========================== */
  {
    id: "A1", set: "A", title: "Two Torpedoes", topic: "Probability: complement rule", difficulty: "Easy", type: "mcq",
    prompt: String.raw`<p>You are the captain of a submarine and you fire two torpedoes at a ship. Each torpedo hits the ship independently with probability $\tfrac{1}{3}$.</p><p>What is the probability that the ship is hit at least once?</p>`,
    choices: [String.raw`$\tfrac{1}{9}$`, String.raw`$\tfrac{4}{9}$`, String.raw`$\tfrac{5}{9}$`, String.raw`$\tfrac{2}{3}$`, String.raw`$\tfrac{8}{9}$`],
    answer: 2,
    think: ["\"At least one\" is usually easiest through the complement.", "Independent events: multiply the probabilities of both happening.", "Why is adding 1/3 + 1/3 wrong here?"],
    hints: ["Find P(both miss) first.", String.raw`P(both miss) $= (2/3)^2 = 4/9$.`],
    solution: String.raw`$P(\text{hit}) = 1 - P(\text{both miss}) = 1 - (2/3)^2 = 5/9$. Adding $1/3+1/3 = 2/3$ double counts the case where both torpedoes hit.`,
    source: SRC.glassdoorTorpedo,
  },
  {
    id: "A2", set: "A", title: "Three Dice Jackpot", topic: "Expected value", difficulty: "Easy", type: "numeric",
    prompt: String.raw`<p>You roll three fair six-sided dice. If all three show the same number you win <b><span class="usd">$</span>20</b>; otherwise you win nothing.</p><p>What is your expected payout per roll, in dollars? Give your answer to at least 2 decimal places.</p>`,
    answer: 5 / 9, display: "5/9 ≈ 0.56", tol: 0.005,
    think: ["How many of the 216 outcomes are triples?", "EV = payout × probability when the other outcome pays 0."],
    hints: ["There are 6 triples: (1,1,1) to (6,6,6).", "P(triple) = 6/216 = 1/36."],
    solution: String.raw`$P(\text{triple}) = 6/216 = 1/36$, so $E = 20 \cdot \tfrac{1}{36} = \tfrac{5}{9} \approx \$0.56$. A quick trader check: if this game cost <span class="usd">$</span>1 to play you would lose about 44 cents per roll.`,
    source: SRC.qprep,
  },
  {
    id: "A3", set: "A", title: "Burnt Pancakes", topic: "Conditional probability", difficulty: "Easy", type: "mcq",
    prompt: String.raw`<p>There are three pancakes: one is burnt on both sides, one is burnt on one side only, and one is not burnt at all. A pancake is chosen at random and placed on a plate with a random side up. The side facing up is burnt.</p><p>What is the probability that the other side is also burnt?</p>`,
    choices: [String.raw`$\tfrac{1}{3}$`, String.raw`$\tfrac{1}{2}$`, String.raw`$\tfrac{2}{3}$`, String.raw`$\tfrac{3}{4}$`],
    answer: 2,
    think: ["Condition on the <b>side</b> you see, not on the pancake.", "How many burnt faces exist in total, and which pancakes do they belong to?"],
    hints: ["There are 3 burnt faces, all equally likely to be the one facing up.", "2 of those 3 faces belong to the double-burnt pancake."],
    solution: String.raw`Burnt faces: B1, B2 (double-burnt pancake) and B3 (single-burnt). Each is equally likely to be the face up. The other side is burnt only for B1 or B2, so the answer is $2/3$. The common wrong answer $1/2$ treats the two candidate pancakes as equally likely, but the double-burnt one is twice as likely to show a burnt face.`,
    source: SRC.qbPancake,
  },
  {
    id: "A4", set: "A", title: "Max of Two Dice", topic: "Expected value: order statistics", difficulty: "Easy", type: "numeric",
    prompt: String.raw`<p>Two fair six-sided dice are rolled. Let $M$ be the larger of the two numbers shown.</p><p>Find $E[M]$. Give your answer to at least 2 decimal places (or as a fraction).</p>`,
    answer: 161 / 36, display: "161/36 ≈ 4.472",
    think: ["$P(M \\le k)$ is easy: both dice must be $\\le k$.", "Then $P(M = k) = P(M\\le k) - P(M \\le k-1)$."],
    hints: [String.raw`$P(M \le k) = (k/6)^2$, so $P(M = k) = \frac{k^2 - (k-1)^2}{36} = \frac{2k-1}{36}$.`, String.raw`$E[M] = \sum_{k=1}^{6} k\cdot\frac{2k-1}{36}$.`],
    solution: String.raw`$E[M] = \frac{1}{36}\sum_{k=1}^6 k(2k-1) = \frac{1+6+15+28+45+66}{36} = \frac{161}{36} \approx 4.47$.`,
    source: SRC.qprep,
  },
  {
    id: "A5", set: "A", title: "Which Coin?", topic: "Bayes' theorem", difficulty: "Medium", type: "mcq",
    prompt: String.raw`<p>A bag holds 10 coins: 9 are fair and 1 is double-headed. You draw a coin at random, flip it 3 times, and get 3 heads.</p><p>What is the probability that you drew the double-headed coin?</p>`,
    choices: [String.raw`$\tfrac{1}{10}$`, String.raw`$\tfrac{8}{17}$`, String.raw`$\tfrac{1}{2}$`, String.raw`$\tfrac{8}{9}$`, String.raw`$\tfrac{9}{17}$`],
    answer: 1,
    think: ["Prior × likelihood for each hypothesis, then normalise.", "Likelihood of HHH: 1 for the double-headed coin, (1/2)^3 for a fair coin."],
    hints: [String.raw`Unnormalised weights: double-headed $\tfrac{1}{10}\cdot 1$; fair $\tfrac{9}{10}\cdot\tfrac{1}{8}$.`, String.raw`Ratio is $\tfrac{1}{10} : \tfrac{9}{80} = 8 : 9$.`],
    solution: String.raw`$P(D\mid HHH) = \dfrac{\tfrac{1}{10}}{\tfrac{1}{10} + \tfrac{9}{10}\cdot\tfrac18} = \dfrac{8}{8+9} = \dfrac{8}{17} \approx 0.47$.`,
    source: SRC.qprep,
  },
  {
    id: "A6", set: "A", title: "Two Heads in a Row", topic: "Markov chains: first-step analysis", difficulty: "Medium", type: "numeric",
    prompt: String.raw`<p>You flip a fair coin repeatedly. What is the expected number of flips until you see two heads in a row (HH) for the first time?</p>`,
    answer: 6, display: "6",
    think: ["Define states by your progress: no useful streak, or one H just seen.", "Write one equation per state for the expected flips remaining."],
    hints: [String.raw`Let $E_0$ = expected flips from scratch, $E_1$ = expected flips having just seen H.`, String.raw`$E_0 = 1 + \tfrac12 E_1 + \tfrac12 E_0$ and $E_1 = 1 + \tfrac12\cdot 0 + \tfrac12 E_0$.`],
    solution: String.raw`From the equations: $E_0 = 2 + E_1$ and $E_1 = 1 + E_0/2$. Substituting: $E_0 = 3 + E_0/2$, so $E_0 = 6$. Compare: HT takes only 4 expected flips, because a failed HT attempt (HH) still leaves you one step in.`,
    source: SRC.quantt,
  },
  {
    id: "A7", set: "A", title: "Gambler's Ruin", topic: "Random walks: gambler's ruin", difficulty: "Medium", type: "mcq",
    prompt: String.raw`<p>You have <span class="usd">$</span>3 and your opponent has <span class="usd">$</span>5. You repeatedly bet <span class="usd">$</span>1 on flips of a fair coin until one of you is broke.</p><p>What is the probability that you end up with all <span class="usd">$</span>8?</p>`,
    choices: [String.raw`$\tfrac{3}{5}$`, String.raw`$\tfrac{3}{8}$`, String.raw`$\tfrac{1}{2}$`, String.raw`$\tfrac{5}{8}$`, String.raw`$\tfrac{1}{3}$`],
    answer: 1,
    think: ["A fair game is a martingale: your expected wealth never changes.", "At the end you hold either 0 or 8."],
    hints: [String.raw`Let $p$ = P(you win everything). Expected final wealth is $8p$.`, String.raw`Expected final wealth must equal your starting wealth, 3.`],
    solution: String.raw`By the optional stopping theorem $E[\text{final}] = 3$, so $8p + 0(1-p) = 3$ and $p = 3/8$. In a fair game, P(win) = your share of the total money.`,
    source: SRC.qprep,
  },
  {
    id: "A8", set: "A", title: "Uniform Sum", topic: "Continuous probability: geometric", difficulty: "Medium", type: "mcq",
    prompt: String.raw`<p>$X$ and $Y$ are independent and uniformly distributed on $[0,1]$. What is $P(X + Y < 1.5)$?</p>`,
    choices: [String.raw`$\tfrac{3}{4}$`, String.raw`$\tfrac{7}{8}$`, String.raw`$\tfrac{9}{16}$`, String.raw`$\tfrac{15}{16}$`, String.raw`$\tfrac{2}{3}$`],
    answer: 1,
    think: ["Draw the unit square; probability = area.", "Which region is <b>excluded</b>? It's often a triangle."],
    hints: ["The line x + y = 1.5 cuts off the top-right corner of the square.", "That corner is a right triangle with legs 0.5 and 0.5."],
    solution: String.raw`Excluded triangle area $= \tfrac12 (0.5)(0.5) = 0.125$, so $P = 1 - 0.125 = 7/8$.`,
    source: SRC.tradinginterview,
  },
  {
    id: "A9", set: "A", title: "Blocked Lattice Path", topic: "Combinatorics: lattice paths", difficulty: "Medium", type: "numeric",
    prompt: String.raw`<p>A robot walks on a grid from $(0,0)$ to $(4,4)$, moving one unit right or one unit up at each step. The point $(2,2)$ is blocked.</p><p>How many paths avoid $(2,2)$?</p>`,
    answer: 34, display: "34", tol: 0,
    think: ["Total paths minus paths through the blocked point.", "A monotone path with a right-moves and b up-moves: $\\binom{a+b}{a}$."],
    hints: [String.raw`Total paths: $\binom{8}{4} = 70$.`, String.raw`Paths through $(2,2)$: $\binom{4}{2}\cdot\binom{4}{2} = 36$.`],
    solution: String.raw`$70 - 6 \cdot 6 = 34$. For more blocked points, fill a DP table: $\text{ways}(x,y) = \text{ways}(x-1,y) + \text{ways}(x,y-1)$, with blocked cells set to 0.`,
    source: SRC.qprep,
  },
  {
    id: "A10", set: "A", title: "Best-of-Five Series", topic: "Expected value: stopping times", difficulty: "Medium", type: "numeric",
    prompt: String.raw`<p>Two evenly matched teams play a best-of-five series (first to win 3 games wins). Each game is won by either team with probability $\tfrac12$, independently.</p><p>What is the expected number of games played? Give your answer to at least 2 decimal places.</p>`,
    answer: 33 / 8, display: "33/8 = 4.125",
    think: ["The series lasts 3, 4 or 5 games.", "For the series to end in game n, the winner must win game n."],
    hints: [String.raw`$P(3) = 2\cdot(1/2)^3 = 1/4$.`, String.raw`$P(4) = 2\cdot\binom{3}{2}(1/2)^4 = 3/8$, and $P(5) = 1 - 1/4 - 3/8 = 3/8$.`],
    solution: String.raw`$E = 3\cdot\tfrac14 + 4\cdot\tfrac38 + 5\cdot\tfrac38 = \tfrac{6 + 12 + 15}{8} = \tfrac{33}{8} = 4.125$.`,
    source: SRC.quantt,
  },
  {
    id: "A11", set: "A", title: "Hat Game", topic: "Logic: strategy / information", difficulty: "Hard", type: "mcq",
    prompt: String.raw`<p>Three players each get a red or blue hat, independently with probability $\tfrac12$ each. Each player sees the other two hats but not their own. With no communication once hats are on, each player simultaneously either guesses their own hat colour or passes.</p><p>The team wins if at least one player guesses correctly and nobody guesses wrong. With the best strategy agreed in advance, what is the probability the team wins?</p>`,
    choices: [String.raw`$\tfrac12$`, String.raw`$\tfrac58$`, String.raw`$\tfrac23$`, String.raw`$\tfrac34$`, String.raw`$\tfrac78$`],
    answer: 3,
    think: ["Any single guess is right only half the time, so you can't raise the per-guess accuracy.", "Instead, try to concentrate wrong guesses into few hat configurations and spread right guesses over many."],
    hints: ["Consider: if you see two hats of the same colour, guess the opposite colour; otherwise pass.", "Count the 8 configurations: when are all three hats the same?"],
    solution: String.raw`Strategy: if the two hats you see match, guess the other colour; otherwise pass. In the 6 mixed configurations exactly one player sees a matching pair and guesses correctly, so the team wins. In RRR and BBB all three guess wrong. Win probability $= 6/8 = 3/4$.`,
    source: SRC.everythingquant,
  },

  /* =========================== SET B =========================== */
  {
    id: "B1", set: "B", title: "Smallest of Three", topic: "Continuous probability: order statistics", difficulty: "Easy", type: "mcq",
    prompt: String.raw`<p>Three numbers are drawn independently and uniformly from $[0,1]$. What is the probability that the smallest of them lies between $0.5$ and $1$?</p>`,
    choices: [String.raw`$\tfrac12$`, String.raw`$\tfrac18$`, String.raw`$\tfrac38$`, String.raw`$\tfrac{7}{8}$`, String.raw`$\tfrac14$`],
    answer: 1,
    think: ["The minimum is above 0.5 exactly when every number is above 0.5."],
    hints: [String.raw`$P(\min > 0.5) = P(\text{all three} > 0.5)$.`],
    solution: String.raw`$P = (1/2)^3 = 1/8$. Generalisation: $P(\min > t) = (1-t)^n$ and $P(\max < t) = t^n$.`,
    source: SRC.wsq,
  },
  {
    id: "B2", set: "B", title: "Chickens and Rabbits", topic: "Logic: systems of equations", difficulty: "Easy", type: "numeric",
    prompt: String.raw`<p>A barn contains only chickens and rabbits. There are 35 heads and 94 legs in total.</p><p>How many rabbits are there?</p>`,
    answer: 12, display: "12", tol: 0,
    think: ["Two unknowns, two equations.", "Shortcut: pretend every animal is a chicken first."],
    hints: ["If all 35 were chickens there would be 70 legs.", "Each rabbit adds 2 extra legs over a chicken."],
    solution: String.raw`$94 - 70 = 24$ extra legs, $24/2 = 12$ rabbits (and 23 chickens).`,
    source: SRC.programhelp,
  },
  {
    id: "B3", set: "B", title: "Accepting a Double", topic: "Expected value: decision making", difficulty: "Easy", type: "mcq",
    prompt: String.raw`<p>You are playing a game for a stake of 1 unit. Your opponent offers to <b>double</b> the stake. If you decline, you forfeit immediately and lose 1 unit. If you accept, the game continues for 2 units: you win 2 with probability $p$ or lose 2 with probability $1-p$.</p><p>What is the minimum $p$ at which accepting is at least as good as declining?</p>`,
    choices: ["10%", "20%", "25%", "33%", "50%"],
    answer: 2,
    think: ["Compare the EV of the two actions.", "Declining has a certain outcome."],
    hints: [String.raw`EV(accept) $= 2p - 2(1-p) = 4p - 2$. EV(decline) $= -1$.`],
    solution: String.raw`Accept when $4p - 2 \ge -1$, i.e. $p \ge 1/4$. This is the classic backgammon doubling threshold of 25%.`,
    source: SRC.wsq,
  },
  {
    id: "B4", set: "B", title: "Two Positive Tests", topic: "Bayes' theorem", difficulty: "Medium", type: "numeric",
    prompt: String.raw`<p>A disease affects 1% of a population. A test is 90% accurate: it is positive for 90% of sick people and negative for 90% of healthy people. A random person tests positive <b>twice</b>, with the two test results independent given their true condition.</p><p>What is the probability that the person has the disease? Give your answer to at least 2 decimal places.</p>`,
    answer: 0.45, display: "9/20 = 0.45",
    think: ["Compute it as odds: prior odds × likelihood ratio per test.", "Each positive multiplies the odds by 0.9/0.1 = 9."],
    hints: ["Prior odds sick : healthy = 1 : 99.", "Two positives multiply the odds by 81, giving 81 : 99."],
    solution: String.raw`Posterior odds $= \tfrac{1}{99}\cdot 81 = \tfrac{81}{99}$, so $P = \tfrac{81}{81+99} = \tfrac{81}{180} = 0.45$. After one positive it is only $9/108 \approx 8.3\%$.`,
    source: SRC.wsq,
  },
  {
    id: "B5", set: "B", title: "Chord Length", topic: "Continuous probability: geometry", difficulty: "Medium", type: "numeric",
    prompt: String.raw`<p>Two points are chosen independently and uniformly at random on the circumference of a circle of radius 1.</p><p>What is the expected straight-line distance between them? Give your answer to at least 3 decimal places.</p>`,
    answer: 4 / Math.PI, display: "4/π ≈ 1.2732",
    think: ["Fix the first point by symmetry; only the central angle θ matters.", "θ is uniform on [0, π] (or [0, 2π])."],
    hints: [String.raw`Chord length for central angle $\theta$ is $2\sin(\theta/2)$.`, String.raw`$E = \frac{1}{2\pi}\int_0^{2\pi} 2\sin(\theta/2)\,d\theta$.`],
    solution: String.raw`$E = \frac{1}{2\pi}\int_0^{2\pi} 2\sin(\theta/2)\,d\theta = \frac{1}{2\pi}\big[-4\cos(\theta/2)\big]_0^{2\pi} = \frac{8}{2\pi} = \frac{4}{\pi} \approx 1.273$.`,
    source: SRC.glassdoor,
  },
  {
    id: "B6", set: "B", title: "Round Table", topic: "Combinatorics: circular arrangements", difficulty: "Medium", type: "numeric",
    prompt: String.raw`<p>Six people, including Alice and Bob, sit around a round table. Rotations of the same seating count as the same arrangement.</p><p>In how many arrangements are Alice and Bob <b>not</b> sitting next to each other?</p>`,
    answer: 72, display: "72", tol: 0,
    think: [String.raw`Circular arrangements of $n$ people: $(n-1)!$.`, "Count the complement: glue Alice and Bob into one block."],
    hints: [String.raw`Total: $5! = 120$.`, String.raw`Adjacent: treat AB as a block, so 5 units around the table: $4!$, times 2 orders: $48$.`],
    solution: String.raw`$120 - 48 = 72$. Check: fix Alice's seat; Bob has 5 seats, 3 of them not adjacent, and the rest arrange in $4!$: $3 \cdot 24 = 72$.`,
    source: SRC.programhelp,
  },
  {
    id: "B7", set: "B", title: "Biased Gambler's Ruin", topic: "Random walks: gambler's ruin", difficulty: "Medium", type: "numeric",
    prompt: String.raw`<p>You start with <span class="usd">$</span>2 and bet <span class="usd">$</span>1 at a time. You win each bet with probability 0.6 and lose with probability 0.4. You stop when you reach <span class="usd">$</span>5 or go broke.</p><p>What is the probability that you reach <span class="usd">$</span>5? Give your answer to at least 3 decimal places.</p>`,
    answer: 135 / 211, display: "135/211 ≈ 0.6398",
    think: ["The fair-game shortcut fails; use the biased ruin formula or solve the recursion.", String.raw`$P_i = p\,P_{i+1} + q\,P_{i-1}$ with $P_0 = 0$, $P_N = 1$.`],
    hints: [String.raw`With $r = q/p = 2/3$: $P_i = \dfrac{1 - r^i}{1 - r^N}$.`, String.raw`$P_2 = \dfrac{1 - 4/9}{1 - 32/243}$.`],
    solution: String.raw`$P_2 = \dfrac{5/9}{211/243} = \dfrac{135}{211} \approx 0.640$.`,
    source: SRC.qprep,
  },
  {
    id: "B8", set: "B", title: "Collect All Six", topic: "Expected value: coupon collector", difficulty: "Medium", type: "numeric",
    prompt: String.raw`<p>You roll a fair six-sided die repeatedly. What is the expected number of rolls until every face has appeared at least once? Give your answer to at least 2 decimal places.</p>`,
    answer: 14.7, display: "147/10 = 14.7",
    think: ["Split the process into stages: waiting for the 1st new face, 2nd new face, and so on.", "Each stage is geometric."],
    hints: [String.raw`With $k$ faces already seen, a new face appears with probability $(6-k)/6$, so the stage takes $6/(6-k)$ rolls on average.`],
    solution: String.raw`$E = 6\left(\tfrac11 + \tfrac12 + \tfrac13 + \tfrac14 + \tfrac15 + \tfrac16\right) = 6 \cdot 2.45 = 14.7$.`,
    source: SRC.quantt,
  },
  {
    id: "B9", set: "B", title: "Optimal Bet Size", topic: "Expected value: Kelly criterion", difficulty: "Medium", type: "mcq",
    prompt: String.raw`<p>You are repeatedly offered a bet that pays <b>3 to 1</b> (stake <span class="usd">$</span>1, win <span class="usd">$</span>3 profit) and wins with probability 0.4. To maximise the long-run growth rate of your bankroll, what fraction of your bankroll should you bet each time?</p>`,
    choices: ["5%", "10%", "20%", "40%", "60%"],
    answer: 2,
    think: ["First check the bet has positive edge.", String.raw`Kelly fraction: $f^* = \dfrac{bp - q}{b}$, where $b$ = net odds.`],
    hints: [String.raw`$b = 3$, $p = 0.4$, $q = 0.6$.`, String.raw`Edge $= bp - q = 1.2 - 0.6 = 0.6$.`],
    solution: String.raw`$f^* = \dfrac{3(0.4) - 0.6}{3} = 0.2$. Derivation: maximise $0.4\ln(1+3f) + 0.6\ln(1-f)$; setting the derivative to 0 gives $f = 0.2$.`,
    source: { kind: "style", label: "Adapted from a Glassdoor-reported SIG betting / EV question", url: SRC.glassdoor.url },
  },
  {
    id: "B10", set: "B", title: "Box From a Sheet", topic: "Calculus: optimisation", difficulty: "Medium", type: "numeric",
    prompt: String.raw`<p>An open-top box is made from a $12 \times 12$ square sheet by cutting equal squares of side $x$ from each corner and folding up the sides.</p><p>What is the maximum possible volume of the box?</p>`,
    answer: 128, display: "128 (at x = 2)",
    think: ["Write V(x), find where V'(x) = 0, and check the domain 0 < x < 6."],
    hints: [String.raw`$V(x) = x(12 - 2x)^2$.`, String.raw`$V'(x) = (12-2x)(12-6x) = 0$, so $x = 2$.`],
    solution: String.raw`$V(2) = 2 \cdot 8^2 = 128$. ($x = 6$ gives volume 0, so $x = 2$ is the maximum.)`,
    source: SRC.tradinginterview,
  },
  {
    id: "B11", set: "B", title: "Knight, Knave, Spy", topic: "Logic: deduction", difficulty: "Hard", type: "mcq",
    prompt: String.raw`<p>A, B and C are a knight (always tells the truth), a knave (always lies) and a spy (may say anything), one of each, in some order.</p><ul><li>A says: "I am the knight."</li><li>B says: "A is telling the truth."</li><li>C says: "I am the spy."</li></ul><p>Who is the spy?</p>`,
    choices: ["A", "B", "C", "Cannot be determined"],
    answer: 1,
    think: ["Case on who the knight is, and look for contradictions.", "The knight can't claim to be the spy, so C is not the knight."],
    hints: ["C isn't the knight. Suppose B is the knight: then A tells the truth, so A is also a knight. Contradiction.", "So A is the knight. What does that make B?"],
    solution: String.raw`C can't be the knight (a knight wouldn't say "I am the spy"). B can't be the knight (that would make A truthful, a second knight). So A is the knight, B's statement is true so B isn't the knave, hence B is the spy and C is the knave (whose claim is a lie, which is consistent).`,
    source: SRC.tradinginterview,
  },

  /* =========================== SET C =========================== */
  {
    id: "C1", set: "C", title: "Sum of Seven", topic: "Conditional probability", difficulty: "Easy", type: "mcq",
    prompt: String.raw`<p>Two fair dice are rolled. Given that at least one die shows a 6, what is the probability that the sum is 7?</p>`,
    choices: [String.raw`$\tfrac16$`, String.raw`$\tfrac{2}{11}$`, String.raw`$\tfrac{1}{11}$`, String.raw`$\tfrac{11}{36}$`, String.raw`$\tfrac{1}{3}$`],
    answer: 1,
    think: ["Restrict the sample space to outcomes with at least one 6. How many are there?"],
    hints: ["Outcomes with at least one 6: 36 − 25 = 11.", "Which of them sum to 7?"],
    solution: String.raw`11 outcomes contain a 6, and only (1,6) and (6,1) sum to 7, so $P = 2/11$.`,
    source: SRC.programhelp,
  },
  {
    id: "C2", set: "C", title: "Stars and Bars", topic: "Combinatorics: distributions", difficulty: "Easy", type: "numeric",
    prompt: String.raw`<p>In how many ways can 10 identical candies be given to 4 children so that every child gets at least one candy?</p>`,
    answer: 84, display: "84", tol: 0,
    think: ["Give each child one candy first, then distribute the rest freely.", String.raw`Distributing $n$ identical items into $k$ bins: $\binom{n+k-1}{k-1}$.`],
    hints: [String.raw`After 1 each, 6 candies remain for 4 children: $\binom{6+3}{3}$.`],
    solution: String.raw`$\binom{9}{3} = 84$. (Equivalently, choose 3 of the 9 gaps between 10 candies.)`,
    source: SRC.original,
  },
  {
    id: "C3", set: "C", title: "Roll With One Reroll", topic: "Expected value: optimal stopping", difficulty: "Medium", type: "numeric",
    prompt: String.raw`<p>You roll a fair six-sided die and are paid the number shown, in dollars. After seeing the first roll you may choose to roll once more, in which case you are paid the second roll instead.</p><p>Under the optimal strategy, what is your expected payout? Give your answer to at least 2 decimal places.</p>`,
    answer: 4.25, display: "17/4 = 4.25",
    think: ["Work backwards: what's the value of the second roll?", "Keep the first roll only if it beats that value."],
    hints: ["A fresh roll is worth 3.5, so reroll on 1, 2 or 3.", String.raw`$E = \tfrac{4+5+6}{6} + \tfrac{3}{6}(3.5)$.`],
    solution: String.raw`$E = 2.5 + 1.75 = 4.25$. This backward-induction idea (keep if above the continuation value) shows up in most SIG dice games.`,
    source: SRC.everythingquant,
  },
  {
    id: "C4", set: "C", title: "Up to Three Rolls", topic: "Expected value: optimal stopping", difficulty: "Medium", type: "mcq",
    prompt: String.raw`<p>Same game as before, but now you may roll up to <b>three</b> times, keeping the final roll. Under the optimal strategy, what is your expected payout?</p>`,
    choices: [String.raw`$4.25$`, String.raw`$\tfrac{14}{3}$`, String.raw`$\tfrac{9}{2}$`, String.raw`$5$`, String.raw`$\tfrac{89}{18}$`],
    answer: 1,
    think: ["With two rolls left the game is worth 4.25 (previous question).", "On the first roll, keep it only if it beats 4.25."],
    hints: ["Keep 5 or 6 on the first roll; otherwise move on to the two-roll game.", String.raw`$E = \tfrac{5+6}{6} + \tfrac{4}{6}(4.25)$.`],
    solution: String.raw`$E = \tfrac{11}{6} + \tfrac{17}{6} = \tfrac{28}{6} = \tfrac{14}{3} \approx 4.67$.`,
    source: SRC.everythingquant,
  },
  {
    id: "C5", set: "C", title: "Tuesday Boy", topic: "Conditional probability: counting", difficulty: "Medium", type: "mcq",
    prompt: String.raw`<p>A family has two children. Each child is independently a boy or girl with probability $\tfrac12$, and born on any of the 7 days of the week with equal probability. You learn that at least one of the children is a boy born on a Tuesday.</p><p>What is the probability that both children are boys?</p>`,
    choices: [String.raw`$\tfrac13$`, String.raw`$\tfrac12$`, String.raw`$\tfrac{13}{27}$`, String.raw`$\tfrac{14}{27}$`, String.raw`$\tfrac{1}{4}$`],
    answer: 2,
    think: ["Each child has 14 equally likely (sex, day) types, so 196 pairs.", "Count pairs with at least one Tuesday boy, carefully avoiding double counting."],
    hints: ["Pairs with at least one Tuesday boy: 14 + 14 − 1 = 27.", "Of those, both boys: 7 + 7 − 1 = 13."],
    solution: String.raw`$P = 13/27$. The extra Tuesday detail pushes the answer from $1/3$ toward $1/2$ because it makes the information closer to identifying a specific child.`,
    source: SRC.original,
  },
  {
    id: "C6", set: "C", title: "Broken Stick", topic: "Continuous probability: geometric", difficulty: "Medium", type: "mcq",
    prompt: String.raw`<p>A stick of length 1 is broken at two points chosen independently and uniformly along its length. What is the probability that the three pieces can form a triangle?</p>`,
    choices: [String.raw`$\tfrac18$`, String.raw`$\tfrac14$`, String.raw`$\tfrac13$`, String.raw`$\tfrac12$`, String.raw`$\tfrac{3}{4}$`],
    answer: 1,
    think: ["Triangle inequality: every piece must be shorter than 1/2.", "Plot the two break points as (x, y) in the unit square."],
    hints: ["For x < y the pieces are x, y − x, 1 − y. Each must be < 1/2.", "That region is a small triangle of area 1/8 in the half-square x < y."],
    solution: String.raw`For $x \lt y$: $x \lt 1/2$, $y \gt 1/2$, $y - x \lt 1/2$. This triangle has area $1/8$; doubling for $y \lt x$ gives $1/4$.`,
    source: SRC.quantt,
  },
  {
    id: "C7", set: "C", title: "Hat Check", topic: "Combinatorics: derangements", difficulty: "Medium", type: "numeric",
    prompt: String.raw`<p>Five people check their hats, and the hats are returned at random (all $5!$ orderings equally likely).</p><p>What is the probability that <b>nobody</b> gets their own hat back? Give your answer to at least 3 decimal places.</p>`,
    answer: 11 / 30, display: "44/120 = 11/30 ≈ 0.3667",
    think: ["Use inclusion-exclusion over the people who do get their own hat.", String.raw`Derangements: $D_n = n!\sum_{k=0}^n \frac{(-1)^k}{k!}$, and $D_n/n! \to 1/e$.`],
    hints: [String.raw`$D_5 = 120\left(1 - 1 + \tfrac12 - \tfrac16 + \tfrac1{24} - \tfrac1{120}\right)$.`, String.raw`Or use $D_n = (n-1)(D_{n-1} + D_{n-2})$ with $D_1 = 0, D_2 = 1$.`],
    solution: String.raw`$D_5 = 44$, so $P = 44/120 = 11/30 \approx 0.367$, already very close to $1/e \approx 0.368$. Note that the expected number of people who get their own hat is exactly 1 for any $n$ (linearity of expectation).`,
    source: SRC.original,
  },
  {
    id: "C8", set: "C", title: "Frog on a Square", topic: "Markov chains: hitting times", difficulty: "Medium", type: "numeric",
    prompt: String.raw`<p>A frog sits on one corner of a square. Each second it jumps to one of the two adjacent corners, each with probability $\tfrac12$.</p><p>What is the expected number of jumps until it first reaches the opposite corner?</p>`,
    answer: 4, display: "4", tol: 0.0001,
    think: ["Group corners by distance from the target: 2, 1, or 0.", "Write first-step equations."],
    hints: [String.raw`$e_2 = 1 + e_1$ (both neighbours are at distance 1).`, String.raw`$e_1 = 1 + \tfrac12 \cdot 0 + \tfrac12 e_2$.`],
    solution: String.raw`Substitute: $e_1 = 1 + \tfrac12(1 + e_1)$, so $e_1 = 3$ and $e_2 = 4$.`,
    source: SRC.quantt,
  },
  {
    id: "C9", set: "C", title: "One Pair", topic: "Combinatorics: card probability", difficulty: "Medium", type: "numeric",
    prompt: String.raw`<p>You are dealt 5 cards from a well-shuffled standard 52-card deck. What is the probability that your hand is exactly <b>one pair</b> (two cards of one rank, and three cards of three other distinct ranks)? Give your answer to at least 3 decimal places.</p>`,
    answer: 352 / 833, display: "1,098,240 / 2,598,960 ≈ 0.4226",
    think: ["Choose the pair's rank and suits, then choose 3 different other ranks and a suit for each.", "Don't order the three kickers."],
    hints: [String.raw`Pair: $13\cdot\binom42$. Kickers: $\binom{12}{3}\cdot 4^3$.`, String.raw`Divide by $\binom{52}{5} = 2{,}598{,}960$.`],
    solution: String.raw`$\dfrac{13\cdot 6 \cdot 220 \cdot 64}{2{,}598{,}960} = \dfrac{1{,}098{,}240}{2{,}598{,}960} \approx 0.4226$.`,
    source: SRC.programhelp,
  },
  {
    id: "C10", set: "C", title: "Mean Absolute Difference", topic: "Continuous probability: expectation", difficulty: "Medium", type: "mcq",
    prompt: String.raw`<p>$X$ and $Y$ are independent and uniform on $[0,1]$. What is $E\big[|X - Y|\big]$?</p>`,
    choices: [String.raw`$\tfrac14$`, String.raw`$\tfrac13$`, String.raw`$\tfrac12$`, String.raw`$\tfrac16$`, String.raw`$\tfrac{2}{3}$`],
    answer: 1,
    think: ["Symmetry: compute E[Y − X | Y > X] style integral over half the square and double.", "Or: two uniform points split [0,1] into three pieces with equal expected length."],
    hints: [String.raw`$E|X-Y| = 2\int_0^1\int_0^y (y-x)\,dx\,dy$.`, "Three pieces of expected length 1/3 each; the middle one is |X − Y|."],
    solution: String.raw`$2\int_0^1 \tfrac{y^2}{2}\,dy = \tfrac13$. The spacing argument gives it with no integration: $n$ uniform points cut $[0,1]$ into $n+1$ pieces of expected length $\tfrac{1}{n+1}$.`,
    source: SRC.original,
  },
  {
    id: "C11", set: "C", title: "Look and Say", topic: "Logic: sequences / pattern recognition", difficulty: "Hard", type: "numeric",
    prompt: String.raw`<p>What is the next term of the sequence?</p><p style="text-align:center;font-size:18px">1, 11, 21, 1211, 111221, ?</p><p>Enter the number.</p>`,
    answer: 312211, display: "312211", tol: 0,
    think: ["The terms aren't arithmetic: try reading each term out loud.", "Each term describes the previous one."],
    hints: [`"1" is read as "one 1" → 11. "11" is "two 1s" → 21.`, `111221 is "three 1s, two 2s, one 1".`],
    solution: "Each term describes the digits of the previous term: 111221 → three 1s, two 2s, one 1 → 312211.",
    source: SRC.programhelp,
  },

  /* ================== EXTRA (random-mix pool only) ================== */
  {
    id: "X1", set: "X", title: "Heads Then Tails", topic: "Markov chains: first-step analysis", difficulty: "Easy", type: "numeric",
    prompt: String.raw`<p>You flip a fair coin repeatedly. What is the expected number of flips until you first see the pattern HT (a head immediately followed by a tail)?</p>`,
    answer: 4, display: "4",
    think: ["Once you have an H, extra H's don't lose your progress.", "Break the wait into two geometric stages."],
    hints: ["Wait for the first H: 2 flips on average.", "Then wait for the first T: 2 more flips on average."],
    solution: "E = 2 + 2 = 4. Contrast with HH (6), where a T resets your progress.",
    source: SRC.quantt,
  },
  {
    id: "X2", set: "X", title: "Ants on a Triangle", topic: "Probability: counting", difficulty: "Easy", type: "mcq",
    prompt: String.raw`<p>Three ants sit at the corners of a triangle. Each ant independently picks one of the two edges at random and walks along it. What is the probability that no two ants collide?</p>`,
    choices: [String.raw`$\tfrac18$`, String.raw`$\tfrac14$`, String.raw`$\tfrac12$`, String.raw`$\tfrac34$`],
    answer: 1,
    think: ["There are 2³ equally likely direction choices.", "When does nobody meet?"],
    hints: ["Nobody collides only if all ants go the same way round (all clockwise or all anticlockwise)."],
    solution: "2 good outcomes out of 8, so 1/4.",
    source: SRC.original,
  },
  {
    id: "X3", set: "X", title: "Russian Roulette", topic: "Conditional probability", difficulty: "Medium", type: "mcq",
    prompt: String.raw`<p>A six-chamber revolver has 2 bullets in <b>adjacent</b> chambers. The cylinder is spun and the trigger pulled once: it's empty. You must pull again. Without spinning, what is the probability you survive the next pull?</p>`,
    choices: [String.raw`$\tfrac23$`, String.raw`$\tfrac34$`, String.raw`$\tfrac12$`, String.raw`$\tfrac35$`],
    answer: 1,
    think: ["Label chambers 1–6 with bullets in 1 and 2; the cylinder advances one chamber per pull.", "Which empty chambers are followed by a bullet?"],
    hints: ["The empty chambers are 3, 4, 5, 6, equally likely.", "Only chamber 6 is followed by a bullet (chamber 1)."],
    solution: "P(survive without spinning) = 3/4, which beats spinning again (4/6). So don't spin.",
    source: SRC.original,
  },
  {
    id: "X4", set: "X", title: "Uniforms Until Sum Exceeds 1", topic: "Continuous probability: expectation", difficulty: "Hard", type: "mcq",
    prompt: String.raw`<p>You draw independent uniform $[0,1]$ numbers until their running sum exceeds 1. What is the expected number of draws?</p>`,
    choices: [String.raw`$2$`, String.raw`$e$`, String.raw`$\tfrac{5}{2}$`, String.raw`$3$`, String.raw`$\pi$`],
    answer: 1,
    think: [String.raw`$E[N] = \sum_{n\ge 0} P(N > n)$.`, String.raw`$P(N > n) = P(U_1+\dots+U_n \le 1)$, the volume of a simplex.`],
    hints: [String.raw`$P(U_1+\dots+U_n \le 1) = 1/n!$.`],
    solution: String.raw`$E[N] = \sum_{n\ge 0} \frac{1}{n!} = e \approx 2.718$.`,
    source: SRC.original,
  },
  {
    id: "X5", set: "X", title: "Five Dice, Three Alike", topic: "Combinatorics: dice probability", difficulty: "Hard", type: "numeric",
    prompt: String.raw`<p>Five fair dice are rolled. What is the probability that at least three of them show the same number? Give your answer to at least 3 decimal places.</p>`,
    answer: 23 / 108, display: "1656/7776 = 23/108 ≈ 0.2130",
    think: ["At most one value can appear 3+ times with 5 dice, so the cases don't overlap.", "Count exactly 3, exactly 4, exactly 5 of a chosen value."],
    hints: [String.raw`Exactly $k$ of a given value: $\binom{5}{k}5^{5-k}$.`, String.raw`Sum for $k = 3,4,5$ and multiply by 6 values: $6(250 + 25 + 1)$.`],
    solution: String.raw`$\dfrac{6(250 + 25 + 1)}{7776} = \dfrac{1656}{7776} = \dfrac{23}{108} \approx 0.213$.`,
    source: SRC.tradinginterview,
  },
  {
    id: "X6", set: "X", title: "Variance of Two Dice", topic: "Probability: variance", difficulty: "Easy", type: "numeric",
    prompt: String.raw`<p>Two fair six-sided dice are rolled. What is the variance of their sum? Give your answer to at least 2 decimal places.</p>`,
    answer: 35 / 6, display: "35/6 ≈ 5.833",
    think: ["Variance adds for independent variables.", String.raw`Var of one die: $E[X^2] - E[X]^2$.`],
    hints: [String.raw`$E[X^2] = 91/6$, $E[X]^2 = 49/4$, so one die has variance $35/12$.`],
    solution: String.raw`$2 \cdot \tfrac{35}{12} = \tfrac{35}{6} \approx 5.83$.`,
    source: SRC.original,
  },
  {
    id: "X7", set: "X", title: "Four-Door Monty Hall", topic: "Conditional probability", difficulty: "Medium", type: "mcq",
    prompt: String.raw`<p>There are 4 doors: one hides a car. You pick a door. The host, who knows where the car is, opens one of the other doors that has no car. You then switch to one of the two remaining unopened doors, chosen at random.</p><p>What is the probability that you win the car?</p>`,
    choices: [String.raw`$\tfrac14$`, String.raw`$\tfrac13$`, String.raw`$\tfrac38$`, String.raw`$\tfrac12$`, String.raw`$\tfrac34$`],
    answer: 2,
    think: ["Your first pick is right with probability 1/4; switching loses then.", "Otherwise the car is behind one of the two doors you might switch to."],
    hints: [String.raw`$P(\text{win}) = P(\text{first pick wrong}) \cdot P(\text{choose the right one of two})$.`],
    solution: String.raw`$\tfrac34 \cdot \tfrac12 = \tfrac38$, which beats staying ($\tfrac14$).`,
    source: SRC.quantt,
  },
];

/* =========================== CODING =========================== */
window.CODING_QUESTIONS = [
  {
    id: "CA", set: "A", title: "Dice Sum Ways", topic: "Dynamic programming: counting", difficulty: "Medium", testKey: "dice", float: false,
    prompt: String.raw`
<p>You roll <code>n</code> dice, each with faces numbered <code>1</code> to <code>k</code>. Count the number of ordered outcomes (the dice are distinguishable) whose face values sum to exactly <code>target</code>. As the answer can be large, return it modulo <code>10<sup>9</sup> + 7</code>.</p>
<h4>Function Description</h4>
<p>Complete the function <code>countWays</code> in the editor below.</p>
<p><code>countWays</code> has the following parameters:</p>
<ul><li><code>int n</code>: the number of dice</li><li><code>int k</code>: the number of faces on each die</li><li><code>int target</code>: the required sum</li></ul>
<p><b>Returns</b></p><p><code>int</code>: the number of ways, modulo 10<sup>9</sup> + 7</p>
<h4>Input Format</h4>
<p>A single line containing three space-separated integers <code>n</code>, <code>k</code> and <code>target</code>.</p>
<h4>Constraints</h4>
<ul><li>1 ≤ n ≤ 50</li><li>1 ≤ k ≤ 50</li><li>1 ≤ target ≤ 2500</li></ul>
<h4>Sample Input 0</h4><pre>2 6 7</pre>
<h4>Sample Output 0</h4><pre>6</pre>
<h4>Explanation 0</h4><p>(1,6), (2,5), (3,4), (4,3), (5,2), (6,1).</p>
<h4>Sample Input 1</h4><pre>3 6 10</pre>
<h4>Sample Output 1</h4><pre>27</pre>`,
    think: ["Brute force is k^n. What state do you need to remember after rolling i dice?", "dp[i][s] = number of ways for the first i dice to sum to s.", "Remember to take the modulus at every addition."],
    hints: ["dp[0][0] = 1; dp[i][s] = Σ_{f=1..k} dp[i-1][s-f].", "O(n · target · k) is at most 6.25M operations, which is fine. A prefix-sum version is O(n · target).", "Early exit: if target < n or target > n·k, the answer is 0."],
    solution: String.raw`<pre>MOD = 10**9 + 7
def countWays(n, k, target):
    dp = [0] * (target + 1)
    dp[0] = 1
    for _ in range(n):
        nd = [0] * (target + 1)
        for s in range(1, target + 1):
            nd[s] = sum(dp[s - f] for f in range(1, k + 1) if s - f >= 0) % MOD
        dp = nd
    return dp[target]</pre>`,
    stubs: {
      python3: `#!/bin/python3

import math
import os
import sys

#
# Complete the 'countWays' function below.
#
# The function is expected to return an INTEGER.
# The function accepts following parameters:
#  1. INTEGER n
#  2. INTEGER k
#  3. INTEGER target
#

def countWays(n, k, target):
    # Write your code here
    pass

if __name__ == '__main__':
    n, k, target = map(int, input().split())
    print(countWays(n, k, target))
`,
      cpp: `#include <bits/stdc++.h>

using namespace std;

/*
 * Complete the 'countWays' function below.
 *
 * The function is expected to return an INTEGER.
 * The function accepts following parameters:
 *  1. INTEGER n
 *  2. INTEGER k
 *  3. INTEGER target
 */

int countWays(int n, int k, int target) {
    // Write your code here
    return 0;
}

int main() {
    int n, k, target;
    cin >> n >> k >> target;
    cout << countWays(n, k, target) << "\\n";
    return 0;
}
`,
      java: `import java.io.*;
import java.util.*;

class Result {

    /*
     * Complete the 'countWays' function below.
     *
     * The function is expected to return an INTEGER.
     * The function accepts following parameters:
     *  1. INTEGER n
     *  2. INTEGER k
     *  3. INTEGER target
     */

    public static int countWays(int n, int k, int target) {
        // Write your code here
        return 0;
    }
}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        int n = Integer.parseInt(st.nextToken());
        int k = Integer.parseInt(st.nextToken());
        int target = Integer.parseInt(st.nextToken());
        System.out.println(Result.countWays(n, k, target));
    }
}
`,
      javascript: `'use strict';

const lines = require('fs').readFileSync(0, 'utf-8').trim().split('\\n');

/*
 * Complete the 'countWays' function below.
 *
 * The function is expected to return an INTEGER.
 * The function accepts following parameters:
 *  1. INTEGER n
 *  2. INTEGER k
 *  3. INTEGER target
 */

function countWays(n, k, target) {
    // Write your code here
    return 0;
}

const [n, k, target] = lines[0].split(' ').map(Number);
console.log(countWays(n, k, target));
`,
    },
  },
  {
    id: "CB", set: "B", title: "Order Book Matching", topic: "Data structures: heaps / simulation", difficulty: "Medium", testKey: "book", float: false,
    prompt: String.raw`
<p>Implement a simple limit order book for a single stock. Orders arrive one at a time. Each order is a <b>buy</b> (<code>B</code>) or <b>sell</b> (<code>S</code>) with a limit price and a quantity.</p>
<ul>
<li>An incoming <b>buy</b> order trades against resting sell orders whose price is <b>≤</b> the buy's limit price, best (lowest) price first.</li>
<li>An incoming <b>sell</b> order trades against resting buy orders whose price is <b>≥</b> the sell's limit price, best (highest) price first.</li>
<li>Among resting orders at the same price, the one that arrived earlier trades first (price-time priority).</li>
<li>Each trade is for the minimum of the two remaining quantities. Partially filled resting orders keep their place in the queue.</li>
<li>Any unfilled remainder of the incoming order rests in the book at its limit price.</li>
</ul>
<p>After all orders are processed, report the total quantity traded and the best bid and best ask left in the book.</p>
<h4>Function Description</h4>
<p>Complete the function <code>processOrders</code> in the editor below.</p>
<p><code>processOrders</code> has the following parameter:</p>
<ul><li><code>orders</code>: a list of (side, price, quantity) tuples in arrival order</li></ul>
<p><b>Returns</b></p><p>Three integers: total traded quantity, best bid price, best ask price. Use <code>-1</code> for an empty side.</p>
<h4>Input Format</h4>
<p>The first line contains an integer <code>N</code>, the number of orders. Each of the next <code>N</code> lines contains a character <code>side</code> (<code>B</code> or <code>S</code>) and two integers <code>price</code> and <code>quantity</code>.</p>
<h4>Output Format</h4>
<p>Line 1: the total traded quantity. Line 2: the best bid and best ask, space-separated.</p>
<h4>Constraints</h4>
<ul><li>1 ≤ N ≤ 10<sup>5</sup></li><li>1 ≤ price ≤ 10<sup>6</sup></li><li>1 ≤ quantity ≤ 10<sup>4</sup></li></ul>
<h4>Sample Input 0</h4><pre>4
B 100 5
S 101 3
S 99 4
B 102 10</pre>
<h4>Sample Output 0</h4><pre>7
102 -1</pre>
<h4>Explanation 0</h4><p><code>S 99 4</code> trades 4 against the resting bid at 100 (1 left). <code>B 102 10</code> trades 3 against the ask at 101 and the remaining 7 rest at 102. Total traded = 7. Bids: 102×7, 100×1. No asks remain.</p>
<h4>Sample Input 1</h4><pre>3
S 50 10
S 49 5
B 48 7</pre>
<h4>Sample Output 1</h4><pre>0
48 49</pre>`,
    think: ["You need the best price on each side quickly: what structure gives min / max in O(log n)?", "Ties at the same price are broken by arrival time, so store (price, sequence number, qty).", "Only the top of the opposite side ever matches, so loop while the top crosses."],
    hints: ["Use a min-heap for asks and a max-heap for bids (push −price in Python).", "While the incoming order has quantity left and the top of the other side crosses: trade min(qty), pop the top if fully filled, else update its quantity in place.", "Total work is O(N log N): each order is pushed once and popped at most once."],
    solution: String.raw`<pre>import heapq
def processOrders(orders):
    bids, asks, vol = [], [], 0
    for seq, (side, p, q) in enumerate(orders):
        if side == 'B':
            while q and asks and asks[0][0] <= p:
                ap, s, aq = asks[0]; x = min(q, aq); vol += x; q -= x
                if aq == x: heapq.heappop(asks)
                else: asks[0] = (ap, s, aq - x)
            if q: heapq.heappush(bids, (-p, seq, q))
        else:
            while q and bids and -bids[0][0] >= p:
                bp, s, bq = bids[0]; x = min(q, bq); vol += x; q -= x
                if bq == x: heapq.heappop(bids)
                else: bids[0] = (bp, s, bq - x)
            if q: heapq.heappush(asks, (p, seq, q))
    return vol, (-bids[0][0] if bids else -1), (asks[0][0] if asks else -1)</pre>
<p>Replacing <code>heap[0]</code> with a tuple that has the same price and sequence but smaller quantity keeps the heap valid, because the ordering key is unchanged.</p>`,
    stubs: {
      python3: `#!/bin/python3

import heapq
import sys

#
# Complete the 'processOrders' function below.
#
# The function accepts a list of (side, price, quantity) tuples.
# The function is expected to return a tuple:
#   (total_traded_quantity, best_bid, best_ask)   using -1 for an empty side
#

def processOrders(orders):
    # Write your code here
    return 0, -1, -1

if __name__ == '__main__':
    data = sys.stdin.read().split()
    n = int(data[0])
    orders = []
    for i in range(n):
        side = data[1 + 3 * i]
        price = int(data[2 + 3 * i])
        qty = int(data[3 + 3 * i])
        orders.append((side, price, qty))
    vol, bid, ask = processOrders(orders)
    print(vol)
    print(bid, ask)
`,
      cpp: `#include <bits/stdc++.h>

using namespace std;

/*
 * Complete the 'processOrders' function below.
 *
 * Each order is (side, price, quantity).
 * Return {total_traded_quantity, best_bid, best_ask}, using -1 for an empty side.
 */

array<long long, 3> processOrders(const vector<tuple<char, int, int>>& orders) {
    // Write your code here
    return {0, -1, -1};
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<tuple<char, int, int>> orders(n);
    for (auto& [side, price, qty] : orders) cin >> side >> price >> qty;
    auto r = processOrders(orders);
    cout << r[0] << "\\n" << r[1] << " " << r[2] << "\\n";
    return 0;
}
`,
      java: `import java.io.*;
import java.util.*;

class Result {

    /*
     * Complete the 'processOrders' function below.
     *
     * sides[i] is 'B' or 'S'. Return {total_traded_quantity, best_bid, best_ask},
     * using -1 for an empty side.
     */

    public static long[] processOrders(char[] sides, int[] prices, int[] qtys) {
        // Write your code here
        return new long[]{0, -1, -1};
    }
}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        char[] sides = new char[n];
        int[] prices = new int[n], qtys = new int[n];
        for (int i = 0; i < n; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            sides[i] = st.nextToken().charAt(0);
            prices[i] = Integer.parseInt(st.nextToken());
            qtys[i] = Integer.parseInt(st.nextToken());
        }
        long[] r = Result.processOrders(sides, prices, qtys);
        System.out.println(r[0]);
        System.out.println(r[1] + " " + r[2]);
    }
}
`,
      javascript: `'use strict';

const data = require('fs').readFileSync(0, 'utf-8').split(/\\s+/).filter(Boolean);

/*
 * Complete the 'processOrders' function below.
 *
 * orders is an array of [side, price, quantity].
 * Return [total_traded_quantity, best_bid, best_ask], using -1 for an empty side.
 */

function processOrders(orders) {
    // Write your code here
    return [0, -1, -1];
}

const n = Number(data[0]);
const orders = [];
for (let i = 0; i < n; i++) {
    orders.push([data[1 + 3 * i], Number(data[2 + 3 * i]), Number(data[3 + 3 * i])]);
}
const [vol, bid, ask] = processOrders(orders);
console.log(String(vol));
console.log(bid + ' ' + ask);
`,
    },
  },
  {
    id: "CC", set: "C", title: "Red and Black Card Game", topic: "Dynamic programming: optimal stopping EV", difficulty: "Medium", testKey: "cards", float: true,
    prompt: String.raw`
<p>A shuffled deck contains <code>R</code> red cards and <code>B</code> black cards. You turn the cards over one at a time. Each red card pays you <b>+<span class="usd">$</span>1</b> and each black card costs you <b>−<span class="usd">$</span>1</b>. Before each card is turned you may choose to stop and keep your current total. You may also stop before turning any card.</p>
<p>Assuming you play optimally, compute your expected total winnings.</p>
<h4>Function Description</h4>
<p>Complete the function <code>expectedValue</code> in the editor below.</p>
<p><code>expectedValue</code> has the following parameters:</p>
<ul><li><code>int R</code>: the number of red cards</li><li><code>int B</code>: the number of black cards</li></ul>
<p><b>Returns</b></p><p><code>double</code>: the optimal expected winnings.</p>
<h4>Input Format</h4>
<p>A single line containing two space-separated integers <code>R</code> and <code>B</code>.</p>
<h4>Output Format</h4>
<p>Print the answer with exactly 6 digits after the decimal point. Answers within 10<sup>-6</sup> of the expected value are accepted.</p>
<h4>Constraints</h4>
<ul><li>0 ≤ R, B ≤ 500</li></ul>
<h4>Sample Input 0</h4><pre>2 2</pre>
<h4>Sample Output 0</h4><pre>0.666667</pre>
<h4>Explanation 0</h4><p>Always turn the first card. If it is red (prob 1/2) you are at +1 with 1 red and 2 black left; turning more cannot help on average, so stop: this branch is worth 1. If it is black you are at −1 with 2 red and 1 black left; playing on from there is worth 4/3 more, so this branch is worth 1/3. Total: 1/2 · 1 + 1/2 · 1/3 = 2/3.</p>
<h4>Sample Input 1</h4><pre>1 1</pre>
<h4>Sample Output 1</h4><pre>0.500000</pre>`,
    think: ["The future only depends on how many red and black cards remain, not on what you've already won.", "So let V(r, b) be the extra amount you can gain from here, playing optimally. You can always stop, so V ≥ 0.", "Write V(r, b) in terms of V(r−1, b) and V(r, b−1)."],
    hints: ["V(r, 0) = r (take all remaining reds). V(0, b) = 0 (stop).", "V(r, b) = max(0, r/(r+b) · (1 + V(r−1, b)) + b/(r+b) · (−1 + V(r, b−1))).", "Fill the table with r and b increasing. 501 × 501 is about 250k states; keep only one row if memory matters."],
    solution: String.raw`<pre>def expectedValue(R, B):
    prev = [0.0] * (B + 1)            # r = 0
    for r in range(1, R + 1):
        cur = [0.0] * (B + 1)
        cur[0] = float(r)
        for b in range(1, B + 1):
            go = (r * (1 + prev[b]) + b * (-1 + cur[b - 1])) / (r + b)
            cur[b] = max(0.0, go)
        prev = cur
    return prev[B]</pre>
<p>For a full 26/26 deck the value is about 2.6245. This is a standard SIG / trading-firm interview game: the key step is spotting that the state is (cards remaining), not (money so far).</p>`,
    stubs: {
      python3: `#!/bin/python3

import math
import os
import sys

#
# Complete the 'expectedValue' function below.
#
# The function is expected to return a DOUBLE.
# The function accepts following parameters:
#  1. INTEGER R
#  2. INTEGER B
#

def expectedValue(R, B):
    # Write your code here
    return 0.0

if __name__ == '__main__':
    R, B = map(int, input().split())
    print(f"{expectedValue(R, B):.6f}")
`,
      cpp: `#include <bits/stdc++.h>

using namespace std;

/*
 * Complete the 'expectedValue' function below.
 *
 * The function is expected to return a DOUBLE.
 * The function accepts following parameters:
 *  1. INTEGER R
 *  2. INTEGER B
 */

double expectedValue(int R, int B) {
    // Write your code here
    return 0.0;
}

int main() {
    int R, B;
    cin >> R >> B;
    printf("%.6f\\n", expectedValue(R, B));
    return 0;
}
`,
      java: `import java.io.*;
import java.util.*;

class Result {

    /*
     * Complete the 'expectedValue' function below.
     *
     * The function is expected to return a DOUBLE.
     * The function accepts following parameters:
     *  1. INTEGER R
     *  2. INTEGER B
     */

    public static double expectedValue(int R, int B) {
        // Write your code here
        return 0.0;
    }
}

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        int R = Integer.parseInt(st.nextToken());
        int B = Integer.parseInt(st.nextToken());
        System.out.println(String.format("%.6f", Result.expectedValue(R, B)));
    }
}
`,
      javascript: `'use strict';

const lines = require('fs').readFileSync(0, 'utf-8').trim().split('\\n');

/*
 * Complete the 'expectedValue' function below.
 *
 * The function is expected to return a DOUBLE.
 * The function accepts following parameters:
 *  1. INTEGER R
 *  2. INTEGER B
 */

function expectedValue(R, B) {
    // Write your code here
    return 0.0;
}

const [R, B] = lines[0].split(' ').map(Number);
console.log(expectedValue(R, B).toFixed(6));
`,
    },
  },
];
