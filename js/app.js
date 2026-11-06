/* SIG OA mock: application logic (vanilla JS, no build step). */
(function () {
  "use strict";

  const TEST_NAME = "2027 US Susquehanna Assessment";
  const DURATION_MIN = 75;
  const STORE_KEY = "sigmock.v1";
  const LANG_LABEL = { python3: "Python 3", cpp: "C++17", java: "Java 15", javascript: "JavaScript (Node.js)" };
  const LANG_MODE = { python3: "python", cpp: "text/x-c++src", java: "text/x-java", javascript: "javascript" };
  const SAMPLE_COUNT = 2; // first N test cases are visible samples

  const $app = document.getElementById("app");
  const MQ = window.MATH_QUESTIONS, CQ = window.CODING_QUESTIONS, TESTS = window.CODING_TESTS;
  const mathById = Object.fromEntries(MQ.map(q => [q.id, q]));
  const codeById = Object.fromEntries(CQ.map(q => [q.id, q]));

  /* ------------------------------------------------------------------ state */
  let S = null;              // persisted state
  let timerHandle = null;
  let editor = null;         // CodeMirror instance
  let camStream = null;
  let ui = { hintOpen: false, resTab: "results", selectedTc: 0, lastRun: null, running: false, railExpanded: false };

  function freshState() {
    return {
      phase: "welcome",
      settings: { name: "", set: "A", timed: true, strict: false, hints: true, camera: false },
      order: "math",
      sections: [],
      current: 0,
      answers: {},        // qid -> raw value (mcq index | numeric string)
      code: {},           // qid -> { lang, src: {lang: code} }
      coding: {},         // qid -> { passed, total, lang, submitted }
      hintLevel: {},      // qid -> number of hints revealed
      solutionSeen: {},   // qid -> true
      flagged: {},
      visited: {},
      startedAt: null, endedAt: null, awayCount: 0, endReason: "",
    };
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (_) {} }
  function load() { try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch (_) { return null; } }
  function clearSaved() { try { localStorage.removeItem(STORE_KEY); } catch (_) {} }

  /* ------------------------------------------------------------------ theme */
  const THEME_KEY = "sigmock.theme";
  const getTheme = () => document.documentElement.dataset.theme === "light" ? "light" : "dark";
  const editorTheme = () => (getTheme() === "dark" ? "material-darker" : "default");
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem(THEME_KEY, t); } catch (_) {}
    if (editor) editor.setOption("theme", editorTheme());
    document.querySelectorAll(".hr-theme").forEach(b => { b.textContent = t === "dark" ? "☀" : "☾"; b.title = t === "dark" ? "Switch to light theme" : "Switch to dark theme"; });
    const sel = document.getElementById("themeSel"); if (sel) sel.value = t;
  }
  document.addEventListener("click", e => { if (e.target.closest && e.target.closest(".hr-theme")) setTheme(getTheme() === "dark" ? "light" : "dark"); });

  /* ---------------------------------------------------------------- helpers */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  function renderMath(el) {
    if (window.renderMathInElement) {
      renderMathInElement(el, { delimiters: [{ left: "$$", right: "$$", display: true }, { left: "$", right: "$", display: false }], throwOnError: false });
    }
  }
  function toast(msg, ms = 2600) {
    const t = h(`<div class="toast">${esc(msg)}</div>`);
    document.body.appendChild(t); setTimeout(() => t.remove(), ms);
  }
  function modal({ title, body, ok = "OK", cancel = null, danger = false }) {
    return new Promise(res => {
      const m = h(`<div class="modal-back"><div class="modal">
        <div class="m-head">${esc(title)}</div><div class="m-body">${body}</div>
        <div class="m-foot">${cancel ? `<button class="btn btn-secondary" data-r="0">${esc(cancel)}</button>` : ""}
        <button class="btn ${danger ? "btn-danger" : "btn-primary"}" data-r="1">${esc(ok)}</button></div></div></div>`);
      m.addEventListener("click", e => { const r = e.target.dataset.r; if (r !== undefined) { m.remove(); res(r === "1"); } });
      document.body.appendChild(m);
      renderMath(m);
    });
  }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const bigFrac = c => String(c).replace(/\\tfrac/g, "\\dfrac");
  const fmtNum = x => (Math.abs(x) >= 1e6 || (Math.abs(x) < 1e-4 && x !== 0)) ? x.toExponential(4) : (+x.toFixed(6)).toString();

  /* ------------------------------------------- safe numeric expression parser */
  // Accepts: 5/9, 0.5556, 1,098,240/2,598,960, 45%, 4/pi, 2*sqrt(3), 3^2, e, π
  function parseNumeric(input) {
    let s = String(input || "").trim().toLowerCase().replace(/π/g, "pi").replace(/×/g, "*").replace(/÷/g, "/").replace(/\$/g, "");
    if (!s) return null;
    s = s.replace(/(\d),(?=\d{3}\b)/g, "$1");
    let i = 0;
    const peek = () => s[i], skip = () => { while (s[i] === " ") i++; };
    function num() {
      skip();
      const m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/.exec(s.slice(i));
      if (m) { i += m[0].length; return parseFloat(m[0]); }
      for (const [name, val] of [["pi", Math.PI], ["e", Math.E]]) if (s.startsWith(name, i) && !/[a-z]/.test(s[i + name.length] || "")) { i += name.length; return val; }
      for (const fn of ["sqrt", "ln", "log", "exp"]) if (s.startsWith(fn, i)) {
        i += fn.length; skip(); if (s[i] !== "(") throw 0; i++; const v = expr(); skip(); if (s[i] !== ")") throw 0; i++;
        return { sqrt: Math.sqrt, ln: Math.log, log: Math.log10, exp: Math.exp }[fn](v);
      }
      if (peek() === "(") { i++; const v = expr(); skip(); if (s[i] !== ")") throw 0; i++; return v; }
      throw 0;
    }
    function postfix() { let v = num(); skip(); if (s[i] === "%") { i++; v /= 100; } return v; }
    function unary() { skip(); if (s[i] === "-") { i++; return -unary(); } if (s[i] === "+") { i++; return unary(); } return power(); }
    function power() { const b = postfix(); skip(); if (s[i] === "^" || s.startsWith("**", i)) { i += s[i] === "^" ? 1 : 2; return Math.pow(b, unary()); } return b; }
    function term() {
      let v = unary();
      for (;;) {
        skip();
        if (s[i] === "*") { i++; v *= unary(); }
        else if (s[i] === "/") { i++; v /= unary(); }
        else if (s[i] && /[a-z(]/.test(s[i])) { v *= unary(); } // implicit multiply: 4pi, 2(3)
        else return v;
      }
    }
    function expr() { let v = term(); for (;;) { skip(); if (s[i] === "+") { i++; v += term(); } else if (s[i] === "-") { i++; v -= term(); } else return v; } }
    try { const v = expr(); skip(); if (i !== s.length || !isFinite(v)) return null; return v; } catch (_) { return null; }
  }

  function gradeMath(q) {
    const a = S.answers[q.id];
    if (a === undefined || a === null || a === "") return "skipped";
    if (q.type === "mcq") return a === q.answer ? "correct" : "wrong";
    const v = parseNumeric(a);
    if (v === null) return "wrong";
    const tol = q.tol === 0 ? 1e-9 : (q.tol !== undefined ? q.tol : Math.max(0.002 * Math.abs(q.answer), 0.0006));
    return Math.abs(v - q.answer) <= tol ? "correct" : "wrong";
  }
  const isAnswered = (sec) => sec.kind === "math"
    ? (S.answers[sec.qid] !== undefined && S.answers[sec.qid] !== "")
    : !!(S.coding[sec.qid] && S.coding[sec.qid].submitted);

  /* ------------------------------------------------------- test construction */
  function pickMath(set) {
    if (set !== "R") return MQ.filter(q => q.set === set).map(q => q.id);
    const by = d => shuffle(MQ.filter(q => q.difficulty === d));
    const picked = [...by("Easy").slice(0, 3), ...by("Medium").slice(0, 6), ...by("Hard").slice(0, 2)];
    const rank = { Easy: 0, Medium: 1, Hard: 2 };
    return picked.sort((a, b) => rank[a.difficulty] - rank[b.difficulty]).map(q => q.id);
  }
  function buildSections() {
    const set = S.settings.set;
    const math = pickMath(set).map(qid => ({ kind: "math", qid }));
    const cq = set === "R" ? shuffle(CQ)[0] : CQ.find(q => q.set === set);
    const coding = { kind: "coding", qid: cq.id };
    S.sections = S.order === "coding" ? [coding, ...math] : [...math, coding];
  }

  /* ================================================================ SCREENS */
  function headerHTML(withTimer) {
    return `<header class="hr-header">
      <div class="left">
        ${withTimer ? `<button class="hr-menu" id="railToggle" title="Toggle question list">☰</button>` : `<div style="width:16px"></div>`}
        <div class="hr-logo"><div class="mark">H</div><div class="word">Practice Assessment</div></div>
        <div class="hr-test-name">${esc(TEST_NAME)} · Mock</div>
      </div>
      <div class="right">
        <button class="hr-theme" title="${getTheme() === "dark" ? "Switch to light theme" : "Switch to dark theme"}">${getTheme() === "dark" ? "☀" : "☾"}</button>
        ${withTimer ? `<div class="hr-timer" id="timer">⏱ <span id="timerText">--</span></div>
        <div class="hr-cam" id="camThumb">${S.settings.camera ? "" : "cam off"}</div>
        <button class="end-test" id="endTest">End Test</button>` : ""}
      </div></header>`;
  }

  /* ---------- 1. welcome ---------- */
  function renderWelcome() {
    const saved = load();
    const canResume = saved && saved.phase === "test";
    const st = S.settings;
    $app.innerHTML = `<div class="landing">${headerHTML(false)}
    <div class="landing-body"><div class="card welcome">
      <div class="info">
        <h1>${esc(TEST_NAME)}</h1>
        <div class="company">Susquehanna International Group · Discovery Program: Quantitative Trading / QSD (practice replica)</div>
        <div class="stats">
          <div class="stat"><div class="k">Test duration</div><div class="v">${DURATION_MIN} mins</div></div>
          <div class="stat"><div class="k">No. of questions</div><div class="v">12</div></div>
          <div class="stat"><div class="k">Sections</div><div class="v">11 + 1</div></div>
        </div>
        <h3>Instructions</h3>
        <ul>
          <li>12 sections, one question each: <b>11 math</b> and <b>1 coding</b>.</li>
          <li>You'll choose to start with math or with coding. You can move freely between sections.</li>
          <li>The ${DURATION_MIN}-minute limit covers the whole test and can't be paused.</li>
          <li>Questions assess <b>probability, logic and problem-solving</b>. Pen, paper and a calculator are allowed.</li>
          <li>You don't need to finish everything. Answer as many as you can.</li>
          <li>Leaving the browser window ends the real test. This mock warns you (or ends the test in strict mode).</li>
        </ul>
      </div>
      <div class="form">
        ${canResume ? `<div class="resume-banner"><span>You have a mock in progress.</span><span><button class="btn btn-primary btn-sm" id="resume">Resume</button> <button class="btn btn-secondary btn-sm" id="discard">Discard</button></span></div>` : ""}
        <h2>Candidate details</h2>
        <div class="field"><label>Full name</label><input type="text" id="name" value="${esc(st.name)}" placeholder="Your name"></div>
        <div class="practice-box">
          <div class="title">Practice settings (not in the real test)</div>
          <div class="field"><label>Question set</label>
            <select id="set">
              <option value="A" ${st.set === "A" ? "selected" : ""}>Mock A: classic / reported questions</option>
              <option value="B" ${st.set === "B" ? "selected" : ""}>Mock B: Bayes, EV, ruin, logic</option>
              <option value="C" ${st.set === "C" ? "selected" : ""}>Mock C: optimal stopping, counting, sequences</option>
              <option value="R" ${st.set === "R" ? "selected" : ""}>Random mix (from all 40 math questions)</option>
            </select></div>
          <div class="field"><label>Colour scheme</label>
            <select id="themeSel"><option value="dark" ${getTheme() === "dark" ? "selected" : ""}>Dark</option><option value="light" ${getTheme() === "light" ? "selected" : ""}>Light</option></select></div>
          <label class="check"><input type="checkbox" id="timed" ${st.timed ? "checked" : ""}> 75-minute timer (auto-submits at 0)</label>
          <label class="check"><input type="checkbox" id="hints" ${st.hints ? "checked" : ""}> Enable 💡 Hint button</label>
          <label class="check"><input type="checkbox" id="strict" ${st.strict ? "checked" : ""}> Strict mode: leaving the window ends the test (like the real one)</label>
        </div>
        <label class="check"><input type="checkbox" id="agree"> I agree to the test rules and understand this session is a practice simulation.</label>
        <div style="margin-top:20px"><button class="btn btn-primary btn-lg" id="start" disabled>Start Test</button></div>
      </div>
    </div></div></div>`;
    document.getElementById("themeSel").onchange = e => setTheme(e.target.value);
    const agree = document.getElementById("agree"), start = document.getElementById("start");
    agree.onchange = () => { start.disabled = !agree.checked; };
    start.onclick = () => {
      st.name = document.getElementById("name").value.trim();
      st.set = document.getElementById("set").value;
      st.timed = document.getElementById("timed").checked;
      st.hints = document.getElementById("hints").checked;
      st.strict = document.getElementById("strict").checked;
      S.phase = "version"; save(); render();
    };
    if (canResume) {
      document.getElementById("resume").onclick = () => { S = saved; render(); };
      document.getElementById("discard").onclick = () => { clearSaved(); S = freshState(); render(); };
    }
  }

  /* ---------- 2. version selection ---------- */
  function renderVersion() {
    $app.innerHTML = `<div class="landing">${headerHTML(false)}
    <div class="landing-body"><div class="card version-wrap">
      <h1>Personalize your test experience</h1>
      <p class="lead">Choose which version you'd like to take. Both versions have the same 12 sections (11 math and 1 coding); only the order differs. You can still move freely between sections once the test begins.</p>
      <div class="version-options">
        <button class="version-opt ${S.order === "math" ? "sel" : ""}" data-o="math"><span class="radio"></span>
          <h3>Start with Math</h3><div>Begin with the 11 math questions, then the coding question.</div>
          <div class="order">Sections 1–11: Math<br>Section 12: Coding</div></button>
        <button class="version-opt ${S.order === "coding" ? "sel" : ""}" data-o="coding"><span class="radio"></span>
          <h3>Start with Coding</h3><div>Begin with the coding question, then the 11 math questions.</div>
          <div class="order">Section 1: Coding<br>Sections 2–12: Math</div></button>
      </div>
      <div class="row-end"><button class="btn btn-secondary" id="back">Back</button><button class="btn btn-primary btn-lg" id="next">Continue</button></div>
    </div></div></div>`;
    $app.querySelectorAll(".version-opt").forEach(b => b.onclick = () => {
      S.order = b.dataset.o; $app.querySelectorAll(".version-opt").forEach(x => x.classList.toggle("sel", x === b));
    });
    document.getElementById("back").onclick = () => { S.phase = "welcome"; save(); render(); };
    document.getElementById("next").onclick = () => { S.phase = "system"; save(); render(); };
  }

  /* ---------- 3. system / proctoring check ---------- */
  function renderSystem() {
    $app.innerHTML = `<div class="landing">${headerHTML(false)}
    <div class="landing-body"><div class="card system-wrap">
      <h1>Proctoring & system check</h1>
      <div class="syscheck">
        <div><div class="cam-preview" id="camPrev">${S.settings.camera && camStream ? "" : "Camera is optional in the mock.<br><br>The real test records your camera with an AI proctoring tool."}</div>
          <div style="margin-top:10px"><button class="btn btn-secondary btn-sm" id="camBtn">${camStream ? "Turn camera off" : "Enable camera preview"}</button></div></div>
        <div><ul>
          <li><span class="ok">✓</span> Browser supported</li>
          <li><span class="ok">✓</span> ${DURATION_MIN}-minute session, cannot be paused</li>
          <li>Keep your face in the camera view for the whole test.</li>
          <li>Don't open other windows, tabs or pop-ups. Disable screensavers and notifications.</li>
          <li>Don't refresh or press Back.</li>
          <li>Have pen, paper and a calculator ready.</li>
          <li>Version: <b>${S.order === "math" ? "Start with Math" : "Start with Coding"}</b> · Set: <b>${{ A: "Mock A", B: "Mock B", C: "Mock C", R: "Random mix" }[S.settings.set]}</b></li>
        </ul></div>
      </div>
      <div class="row-end"><button class="btn btn-secondary" id="back">Back</button><button class="btn btn-primary btn-lg" id="begin">Start the test</button></div>
    </div></div></div>`;
    if (camStream) attachCam(document.getElementById("camPrev"));
    document.getElementById("camBtn").onclick = async () => {
      if (camStream) { stopCam(); S.settings.camera = false; }
      else { await startCam(); }
      save(); renderSystem();
    };
    document.getElementById("back").onclick = () => { S.phase = "version"; save(); render(); };
    document.getElementById("begin").onclick = () => {
      buildSections();
      S.phase = "test"; S.current = 0; S.startedAt = Date.now(); S.endedAt = null;
      save(); render();
      if (S.settings.strict) toast("Strict mode on: leaving this window ends the test.");
    };
  }
  async function startCam() {
    try { camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); S.settings.camera = true; }
    catch (_) { toast("Camera unavailable or permission denied. Continuing without it."); S.settings.camera = false; }
  }
  function stopCam() { if (camStream) camStream.getTracks().forEach(t => t.stop()); camStream = null; }
  function attachCam(el) { if (!el || !camStream) return; el.innerHTML = ""; const v = document.createElement("video"); v.autoplay = true; v.muted = true; v.playsInline = true; v.srcObject = camStream; el.appendChild(v); }

  /* ---------- 4. test ---------- */
  function timeLeftMs() { return S.startedAt + DURATION_MIN * 60000 - Date.now(); }
  function tickTimer() {
    const el = document.getElementById("timerText"), box = document.getElementById("timer");
    if (!el) return;
    if (!S.settings.timed) {
      const used = Math.floor((Date.now() - S.startedAt) / 1000);
      el.textContent = `${Math.floor(used / 60)}:${String(used % 60).padStart(2, "0")} elapsed (untimed)`;
      return;
    }
    const ms = timeLeftMs();
    if (ms <= 0) { el.textContent = "0:00"; finishTest("Time is up. Your test was submitted automatically."); return; }
    const sec = Math.ceil(ms / 1000), m = Math.floor(sec / 60), s = sec % 60;
    el.textContent = m >= 10 ? `${m} min${m === 1 ? "" : "s"} left` : `${m}:${String(s).padStart(2, "0")} left`;
    box.classList.toggle("warn", m < 10 && m >= 5);
    box.classList.toggle("danger", m < 5);
    if (!S._warned10 && m < 10) { S._warned10 = true; toast("10 minutes remaining"); }
    if (!S._warned5 && m < 5) { S._warned5 = true; toast("5 minutes remaining"); }
  }

  function renderTest() {
    const sec = S.sections[S.current];
    S.visited[sec.qid] = true;
    $app.innerHTML = `<div class="hr-app">${headerHTML(true)}
      <div class="hr-body">
        <nav class="hr-rail ${ui.railExpanded ? "expanded" : ""}" id="rail"></nav>
        <main class="hr-main" id="main"></main>
      </div></div>`;
    renderRail();
    const main = document.getElementById("main");
    if (sec.kind === "math") renderMathSection(main, mathById[sec.qid]);
    else renderCodingSection(main, codeById[sec.qid]);
    if (camStream) attachCam(document.getElementById("camThumb"));
    document.getElementById("railToggle").onclick = () => { ui.railExpanded = !ui.railExpanded; document.getElementById("rail").classList.toggle("expanded", ui.railExpanded); };
    document.getElementById("endTest").onclick = confirmEnd;
    tickTimer();
    clearInterval(timerHandle); timerHandle = setInterval(tickTimer, 1000);
    save();
  }

  function renderRail() {
    const rail = document.getElementById("rail");
    rail.innerHTML = S.sections.map((sec, i) => {
      const q = sec.kind === "math" ? mathById[sec.qid] : codeById[sec.qid];
      const cls = ["rail-item", i === S.current ? "active" : "", isAnswered(sec) ? "answered" : ""].join(" ");
      const status = isAnswered(sec) ? "Attempted" : (S.visited[sec.qid] ? "Visited" : "Not attempted");
      return `${i > 0 && S.sections[i - 1].kind !== sec.kind ? '<div class="rail-sep"></div>' : ""}
        <div class="${cls}" data-i="${i}" title="Section ${i + 1}: ${esc(q.title)}">
          <div class="rail-num">${i + 1}${S.flagged[sec.qid] ? '<span class="flag-dot"></span>' : ""}${sec.kind === "coding" ? '<span class="code-tag">&lt;/&gt;</span>' : ""}</div>
          <div class="rail-label"><div class="t">${esc(q.title)}</div><div class="s">${sec.kind === "coding" ? "Coding" : "Math"} · ${status}</div></div>
        </div>`;
    }).join("");
    rail.querySelectorAll(".rail-item").forEach(el => el.onclick = () => goTo(+el.dataset.i));
  }

  function goTo(i) {
    if (i < 0 || i >= S.sections.length) return;
    persistEditor();
    S.current = i; ui.hintOpen = false; ui.lastRun = null; ui.selectedTc = 0; ui.resTab = "results";
    save(); renderTest();
  }

  function qHeadHTML(q, idx, kind) {
    return `<div class="q-head">
      <div class="crumb">Section ${idx + 1} of ${S.sections.length} · ${kind === "coding" ? "Coding" : "Math"}</div>
      <div class="title-row"><h2>${esc(q.title)}</h2>
        <div class="tools">
          <button class="flag-btn ${S.flagged[q.id] ? "on" : ""}" id="flagBtn" title="Mark for review">⚑ ${S.flagged[q.id] ? "Flagged" : "Flag"}</button>
          ${S.settings.hints ? `<button class="btn btn-hint" id="hintBtn">💡 Hint${S.hintLevel[q.id] ? ` (${S.hintLevel[q.id]})` : ""}</button>` : ""}
        </div></div></div>`;
  }
  function bindQHead(q, main) {
    document.getElementById("flagBtn").onclick = () => { S.flagged[q.id] = !S.flagged[q.id]; save(); renderTest(); };
    const hb = document.getElementById("hintBtn");
    if (hb) hb.onclick = () => { ui.hintOpen = !ui.hintOpen; drawHint(q, main); };
    drawHint(q, main);
  }

  function footHTML() {
    const last = S.current === S.sections.length - 1;
    return `<div class="a-foot">
      <button class="btn btn-secondary" id="prevBtn" ${S.current === 0 ? "disabled" : ""}>← Previous</button>
      <span class="saved" id="savedNote"></span>
      ${last ? `<button class="btn btn-primary" id="nextBtn">Submit Test</button>` : `<button class="btn btn-primary" id="nextBtn">Next →</button>`}
    </div>`;
  }
  function bindFoot() {
    document.getElementById("prevBtn").onclick = () => goTo(S.current - 1);
    document.getElementById("nextBtn").onclick = () => (S.current === S.sections.length - 1 ? confirmEnd() : goTo(S.current + 1));
  }

  /* ---------- math section ---------- */
  function renderMathSection(main, q) {
    const val = S.answers[q.id];
    main.innerHTML = `<div class="split">
      <section class="q-pane" id="qpane">${qHeadHTML(q, S.current, "math")}<div class="q-body">${q.prompt}</div></section>
      <div class="divider" id="divider"></div>
      <section class="a-pane">
        <div class="a-head">${q.type === "mcq" ? "Pick ONE option" : "Answer"}${q.type === "mcq" ? `<button class="btn-ghost" id="clearSel">Clear Selection</button>` : ""}</div>
        <div class="a-body" id="abody"></div>
        ${footHTML()}
      </section></div>`;
    const ab = document.getElementById("abody");
    if (q.type === "mcq") {
      ab.innerHTML = q.choices.map((c, i) => `<label class="mcq-opt ${val === i ? "sel" : ""}"><input type="radio" name="mcq" value="${i}" ${val === i ? "checked" : ""}><span>${bigFrac(c)}</span></label>`).join("");
      ab.querySelectorAll("input").forEach(inp => inp.onchange = () => {
        S.answers[q.id] = +inp.value; save();
        ab.querySelectorAll(".mcq-opt").forEach((o, i) => o.classList.toggle("sel", i === +inp.value));
        renderRail(); note("Answer saved");
      });
      document.getElementById("clearSel").onclick = () => { delete S.answers[q.id]; save(); renderTest(); };
    } else {
      ab.innerHTML = `<input class="numeric-input" id="numIn" autocomplete="off" spellcheck="false" placeholder="Type your answer" value="${esc(val || "")}">
        <div class="num-preview" id="numPrev"></div>
        <div class="input-help">Enter a number, a fraction or a simple expression, e.g. <code>5/9</code>, <code>0.556</code>, <code>4/pi</code>, <code>45%</code>, <code>2*sqrt(3)</code>.<br>Decimal answers are accepted if accurate to the precision asked for in the question.</div>`;
      const inp = document.getElementById("numIn"), prev = document.getElementById("numPrev");
      const upd = () => {
        const v = inp.value.trim();
        if (!v) { prev.textContent = ""; prev.className = "num-preview"; return; }
        const p = parseNumeric(v);
        prev.className = "num-preview" + (p === null ? " err" : "");
        prev.textContent = p === null ? "Can't read this as a number" : `= ${fmtNum(p)}`;
      };
      inp.oninput = () => { S.answers[q.id] = inp.value; save(); upd(); renderRail(); };
      inp.onkeydown = e => { if (e.key === "Enter") document.getElementById("nextBtn").click(); };
      upd(); setTimeout(() => inp.focus(), 0);
    }
    renderMath(main);
    bindQHead(q, main); bindFoot(); bindDivider();
  }
  function note(t) { const n = document.getElementById("savedNote"); if (n) { n.textContent = t; clearTimeout(note._t); note._t = setTimeout(() => (n.textContent = ""), 1800); } }

  /* ---------- hint drawer ---------- */
  function drawHint(q, main) {
    let d = document.getElementById("hintDrawer");
    if (!S.settings.hints) return;
    if (!d) { d = h(`<aside class="hint-drawer" id="hintDrawer"></aside>`); main.appendChild(d); }
    const lvl = S.hintLevel[q.id] || 0, seen = !!S.solutionSeen[q.id];
    const src = q.source ? `<div class="hd-section"><div class="h">Source</div><span class="src-tag src-${q.source.kind}">${{ reported: "Reported SIG question", style: "SIG-style (topic match)", original: "Original" }[q.source.kind]}</span>
      <div class="hd-note">${q.source.url ? `<a href="${esc(q.source.url)}" target="_blank" rel="noopener">${esc(q.source.label)}</a>` : esc(q.source.label)}</div></div>` : "";
    d.innerHTML = `<div class="hd-head"><h3>💡 Hints</h3><button class="icon-btn" id="hdClose" title="Close">✕</button></div>
      <div class="hd-body">
        <div><span class="topic-badge">${esc(q.topic)}</span><span class="diff-badge diff-${q.difficulty}">${q.difficulty}</span></div>
        <div class="hd-section"><div class="h">Things to think about</div><ul>${q.think.map(t => `<li>${t}</li>`).join("")}</ul></div>
        <div class="hd-section"><div class="h">Step-by-step hints (${lvl}/${q.hints.length} shown)</div>
          ${q.hints.slice(0, lvl).map((t, i) => `<div class="hint-card"><div class="n">HINT ${i + 1}</div>${t}</div>`).join("")}
          ${lvl < q.hints.length ? `<button class="btn btn-hint btn-sm" id="moreHint">Show hint ${lvl + 1}</button>` : `<div class="hd-note">All hints shown.</div>`}
        </div>
        <div class="hd-section"><div class="h">Full solution</div>
          ${seen ? `<div class="solution-card">${q.type === "mcq" ? `<p><b>Answer:</b> ${q.choices[q.answer]}</p>` : (q.display ? `<p><b>Answer:</b> ${esc(q.display)}</p>` : "")}${q.solution}</div>`
                 : `<button class="btn btn-secondary btn-sm" id="showSol">Reveal solution</button><div class="hd-note">Revealing is recorded in your results, so you can tell later which questions you solved on your own.</div>`}
        </div>
        ${src}
      </div>`;
    d.classList.toggle("open", ui.hintOpen);
    renderMath(d);
    d.querySelector("#hdClose").onclick = () => { ui.hintOpen = false; d.classList.remove("open"); };
    const more = d.querySelector("#moreHint");
    if (more) more.onclick = () => { S.hintLevel[q.id] = lvl + 1; save(); drawHint(q, main); updHintBtn(q); };
    const sol = d.querySelector("#showSol");
    if (sol) sol.onclick = async () => {
      if (await modal({ title: "Reveal the solution?", body: "This question will be marked as <b>solution viewed</b> in your results.", ok: "Reveal", cancel: "Cancel" })) {
        S.solutionSeen[q.id] = true; save(); drawHint(q, main);
      }
    };
  }
  function updHintBtn(q) { const b = document.getElementById("hintBtn"); if (b) b.textContent = `💡 Hint${S.hintLevel[q.id] ? ` (${S.hintLevel[q.id]})` : ""}`; }

  function bindDivider() {
    const dv = document.getElementById("divider"), qp = document.getElementById("qpane");
    if (!dv) return;
    if (S._split) qp.style.width = S._split + "%";
    dv.onmousedown = e => {
      e.preventDefault(); dv.classList.add("drag");
      const split = dv.parentElement, rect = split.getBoundingClientRect();
      const move = ev => { const pct = Math.min(75, Math.max(22, ((ev.clientX - rect.left) / rect.width) * 100)); qp.style.width = pct + "%"; S._split = pct; if (editor) editor.refresh(); };
      const up = () => { dv.classList.remove("drag"); document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); save(); };
      document.addEventListener("mousemove", move); document.addEventListener("mouseup", up);
    };
  }

  /* ---------- coding section ---------- */
  function codeState(q) {
    if (!S.code[q.id]) S.code[q.id] = { lang: "python3", src: {} };
    const cs = S.code[q.id];
    if (cs.src[cs.lang] === undefined) cs.src[cs.lang] = q.stubs[cs.lang];
    return cs;
  }
  function persistEditor() {
    const sec = S.sections[S.current];
    if (editor && sec && sec.kind === "coding") { const cs = codeState(codeById[sec.qid]); cs.src[cs.lang] = editor.getValue(); save(); }
  }

  function renderCodingSection(main, q) {
    const cs = codeState(q);
    const tests = TESTS[q.testKey];
    main.innerHTML = `<div class="split">
      <section class="q-pane" id="qpane">${qHeadHTML(q, S.current, "coding")}<div class="q-body">${q.prompt}</div></section>
      <div class="divider" id="divider"></div>
      <section class="a-pane">
        <div class="code-toolbar">
          <select id="lang">${Object.keys(q.stubs).map(l => `<option value="${l}" ${l === cs.lang ? "selected" : ""}>${LANG_LABEL[l]}</option>`).join("")}</select>
          <div class="right">
            <button class="icon-btn" id="resetCode" title="Reset to the starter code">⟲ Reset</button>
            <button class="icon-btn" id="themeBtn" title="Toggle dark / light theme">◐ Theme</button>
          </div>
        </div>
        <div class="editor-wrap" id="editorWrap"></div>
        <div class="code-actions">
          <span class="runner-status" id="runnerStatus">${esc(Runner.statusText())}</span>
          <div class="btns"><button class="btn btn-secondary" id="runBtn">Run Code</button><button class="btn btn-primary" id="submitBtn">Submit</button></div>
        </div>
        <div class="results ${ui.lastRun ? "" : "collapsed"}" id="results"></div>
        ${footHTML()}
      </section></div>`;
    editor = CodeMirror(document.getElementById("editorWrap"), {
      value: cs.src[cs.lang], mode: LANG_MODE[cs.lang], lineNumbers: true, indentUnit: 4, tabSize: 4,
      indentWithTabs: false, matchBrackets: true, autoCloseBrackets: true, theme: editorTheme(),
      extraKeys: { Tab: cm => cm.somethingSelected() ? cm.indentSelection("add") : cm.replaceSelection("    ", "end") },
    });
    let saveT; editor.on("change", () => { clearTimeout(saveT); saveT = setTimeout(persistEditor, 400); });
    setTimeout(() => editor.refresh(), 0);

    document.getElementById("lang").onchange = e => {
      persistEditor();
      cs.lang = e.target.value;
      if (cs.src[cs.lang] === undefined) cs.src[cs.lang] = q.stubs[cs.lang];
      editor.setOption("mode", LANG_MODE[cs.lang]); editor.setValue(cs.src[cs.lang]); save();
      if (cs.lang === "python3") Runner.warmPython();
    };
    document.getElementById("resetCode").onclick = async () => {
      if (await modal({ title: "Reset code?", body: "Your code for this language will be replaced with the starter code.", ok: "Reset", cancel: "Cancel", danger: true })) {
        cs.src[cs.lang] = q.stubs[cs.lang]; editor.setValue(cs.src[cs.lang]); save();
      }
    };
    document.getElementById("themeBtn").onclick = () => setTheme(getTheme() === "dark" ? "light" : "dark");
    document.getElementById("runBtn").onclick = () => runCode(q, false);
    document.getElementById("submitBtn").onclick = () => runCode(q, true);
    Runner.onStatus = () => { const el = document.getElementById("runnerStatus"); if (el) el.textContent = Runner.statusText(); };
    if (cs.lang === "python3") Runner.warmPython();
    drawResults(q, tests);
    bindQHead(q, main); bindFoot(); bindDivider();
  }

  function outputsMatch(got, exp, isFloat) {
    const norm = s => String(s).replace(/\r/g, "").split("\n").map(l => l.replace(/\s+$/, "")).join("\n").replace(/\n+$/, "");
    const a = norm(got), b = norm(exp);
    if (a === b) return true;
    if (!isFloat) return false;
    const ta = a.split(/\s+/), tb = b.split(/\s+/);
    if (ta.length !== tb.length) return false;
    return ta.every((t, i) => { const x = parseFloat(t), y = parseFloat(tb[i]); return t === tb[i] || (isFinite(x) && isFinite(y) && Math.abs(x - y) <= 1.5e-6); });
  }

  async function runCode(q, isSubmit) {
    if (ui.running) return;
    persistEditor();
    const cs = codeState(q), tests = TESTS[q.testKey];
    const which = isSubmit ? tests.map((_, i) => i) : [...Array(SAMPLE_COUNT).keys()];
    const custom = ui.resTab === "custom" && !isSubmit ? (document.getElementById("customIn") || {}).value : null;
    ui.running = true;
    const rb = document.getElementById("runBtn"), sb = document.getElementById("submitBtn");
    rb.disabled = sb.disabled = true;
    (isSubmit ? sb : rb).textContent = isSubmit ? "Submitting…" : "Running…";
    ui.lastRun = { pending: true, isSubmit };
    if (custom === null) ui.resTab = "results";
    drawResults(q, tests);
    let res;
    try {
      const inputs = custom !== null ? [custom] : which.map(i => tests[i].input);
      res = await Runner.run(cs.lang, cs.src[cs.lang], inputs);
    } catch (e) {
      res = { compile: { ok: false, message: "Runner error: " + e }, results: [] };
    }
    ui.running = false;
    if (custom !== null) {
      ui.lastRun = { custom: true, input: custom, compile: res.compile, result: res.results[0] };
    } else {
      const cases = which.map((ti, k) => {
        const r = res.results[k];
        const passed = !!(r && !r.timedOut && r.exitCode === 0 && outputsMatch(r.stdout, tests[ti].output, q.float));
        return { ti, r, passed };
      });
      ui.lastRun = { isSubmit, compile: res.compile, cases };
      ui.selectedTc = Math.max(0, cases.findIndex(c => !c.passed));
      if (isSubmit) {
        const passed = res.compile.ok ? cases.filter(c => c.passed).length : 0;
        const prev = S.coding[q.id];
        if (!prev || passed >= prev.passed) S.coding[q.id] = { passed, total: tests.length, lang: cs.lang, submitted: true, at: Date.now() };
        else S.coding[q.id].submitted = true;
        save(); renderRail();
      }
    }
    const rb2 = document.getElementById("runBtn"), sb2 = document.getElementById("submitBtn");
    if (rb2) { rb2.disabled = sb2.disabled = false; rb2.textContent = "Run Code"; sb2.textContent = "Submit"; }
    if (document.getElementById("results")) drawResults(q, tests);
  }

  function drawResults(q, tests) {
    const box = document.getElementById("results");
    if (!box) return;
    const L = ui.lastRun;
    box.classList.toggle("collapsed", !L && ui.resTab !== "custom");
    let body = "";
    if (ui.resTab === "custom") {
      const cr = L && L.custom ? L : null;
      body = `<div class="tc-detail custom-input"><div class="lbl">Custom input (stdin) · then press Run Code</div>
        <textarea id="customIn" spellcheck="false">${esc(cr ? cr.input : tests[0].input)}</textarea>
        ${cr ? (cr.compile.ok ? `<div class="lbl">Your Output (stdout)</div><pre>${esc(cr.result.timedOut ? "Terminated due to timeout" : cr.result.stdout || "~ no response on stdout ~")}</pre>${cr.result.stderr ? `<div class="lbl">Error (stderr)</div><pre>${esc(cr.result.stderr)}</pre>` : ""}` : `<div class="lbl">Compiler Message</div><pre>${esc(cr.compile.message)}</pre>`) : ""}
      </div>`;
    } else if (!L) {
      body = `<div class="res-empty">Run your code to see results here.</div>`;
    } else if (L.pending) {
      body = `<div class="res-empty">${L.isSubmit ? "Running all test cases…" : "Running sample test cases…"}</div>`;
    } else if (!L.compile.ok) {
      body = `<div class="tc-detail"><div class="verdict fail">Compilation error</div><div class="lbl">Compiler Message</div><pre>${esc(L.compile.message)}</pre></div>`;
    } else {
      const c = L.cases[ui.selectedTc] || L.cases[0];
      const t = tests[c.ti], hidden = c.ti >= SAMPLE_COUNT, r = c.r || {};
      const msg = r.timedOut ? "Terminated due to timeout" : (r.exitCode !== 0 ? "Runtime Error" : (c.passed ? "Success" : "Wrong Answer"));
      const detail = hidden
        ? `<div class="verdict ${c.passed ? "pass" : "fail"}">${c.passed ? "✓" : "✗"} ${esc(msg)}</div><div class="lbl">Hidden test case</div><div class="res-empty" style="padding:4px 0">Input and expected output are hidden, as on HackerRank.</div>${r.stderr ? `<div class="lbl">Error (stderr)</div><pre>${esc(r.stderr.slice(-3000))}</pre>` : ""}`
        : `<div class="verdict ${c.passed ? "pass" : "fail"}">${c.passed ? "✓" : "✗"} ${esc(msg)}</div>
           <div class="lbl">Compiler Message</div><pre>${esc(msg)}</pre>
           <div class="lbl">Input (stdin)</div><pre>${esc(t.input)}</pre>
           <div class="lbl">Your Output (stdout)</div><pre>${esc(r.timedOut ? "" : (r.stdout || "~ no response on stdout ~"))}</pre>
           <div class="lbl">Expected Output</div><pre>${esc(t.output)}</pre>
           ${r.stderr ? `<div class="lbl">Error (stderr)</div><pre>${esc(r.stderr.slice(-3000))}</pre>` : ""}`;
      body = `<div class="tc-list">${L.cases.map((cc, k) => `<div class="tc-item ${k === ui.selectedTc ? "on" : ""}" data-k="${k}"><span>${cc.ti >= SAMPLE_COUNT ? "🔒 " : ""}Test case ${cc.ti}</span><span class="${cc.passed ? "pass" : "fail"}">${cc.passed ? "✓" : "✗"}</span></div>`).join("")}</div>
        <div class="tc-detail">${detail}</div>`;
    }
    let summary = "";
    if (L && !L.pending && !L.custom && L.compile.ok) {
      const p = L.cases.filter(c => c.passed).length, n = L.cases.length;
      summary = `<span class="score-pill ${p === n ? "good" : (p ? "mid" : "bad")}" style="margin:6px 12px">${p}/${n} test cases passed${L.isSubmit ? " · submitted" : ""}</span>`;
    }
    box.innerHTML = `<div class="res-tabs">
        <button class="res-tab ${ui.resTab === "results" ? "on" : ""}" data-t="results">Test Results</button>
        <button class="res-tab ${ui.resTab === "custom" ? "on" : ""}" data-t="custom">Custom Input</button>
        <span class="spacer"></span>${summary}
      </div><div class="res-body">${body}</div>`;
    box.querySelectorAll(".res-tab").forEach(b => b.onclick = () => { ui.resTab = b.dataset.t; drawResults(q, tests); });
    box.querySelectorAll(".tc-item").forEach(b => b.onclick = () => { ui.selectedTc = +b.dataset.k; drawResults(q, tests); });
    if (editor) setTimeout(() => editor.refresh(), 0);
  }

  /* ---------- ending ---------- */
  async function confirmEnd() {
    persistEditor();
    const done = S.sections.filter(isAnswered).length;
    const cq = S.sections.find(s => s.kind === "coding");
    const codeNote = cq && !isAnswered(cq) && S.code[cq.qid] ? "<br><br>⚠️ Your coding answer hasn't been <b>submitted</b>. Only submitted code is scored." : "";
    const ok = await modal({ title: "Submit test?", body: `You have attempted <b>${done}</b> of <b>${S.sections.length}</b> sections. Once submitted you can't change your answers.${codeNote}`, ok: "Submit Test", cancel: "Continue test" });
    if (ok) finishTest("");
  }
  function finishTest(reason) {
    if (S.phase !== "test") return;
    persistEditor();
    clearInterval(timerHandle);
    S.phase = "results"; S.endedAt = Date.now(); S.endReason = reason;
    stopCam(); save(); render();
    if (reason) modal({ title: "Test submitted", body: esc(reason) });
  }

  /* ---------- tab-switch / blur detection ---------- */
  let awayLock = false;
  function onAway() {
    if (!S || S.phase !== "test" || awayLock) return;
    awayLock = true; setTimeout(() => (awayLock = false), 1500);
    S.awayCount++; save();
    if (S.settings.strict) { finishTest("You navigated away from the test window. In the real assessment this ends your test, and strict mode did the same here."); return; }
    modal({ title: "You left the test window", body: `In the real HackerRank assessment, opening another window or navigating away <b>ends your test</b> and it's graded as is.<br><br>Times detected so far: <b>${S.awayCount}</b>. Turn on strict mode to practise under real conditions.`, ok: "Back to test" });
  }
  document.addEventListener("visibilitychange", () => { if (document.hidden) onAway(); });
  window.addEventListener("blur", () => { setTimeout(() => { if (!document.hasFocus() && !document.querySelector("iframe:focus")) onAway(); }, 200); });
  window.addEventListener("beforeunload", e => { if (S && S.phase === "test") { persistEditor(); e.preventDefault(); e.returnValue = ""; } });

  /* ---------- 5. results ---------- */
  function renderResults() {
    clearInterval(timerHandle);
    const mathSecs = S.sections.filter(s => s.kind === "math");
    const graded = mathSecs.map(s => ({ q: mathById[s.qid], g: gradeMath(mathById[s.qid]) }));
    const correct = graded.filter(x => x.g === "correct").length;
    const cs = S.sections.find(s => s.kind === "coding");
    const cq = codeById[cs.qid], cr = S.coding[cq.id];
    const used = Math.round(((S.endedAt || Date.now()) - S.startedAt) / 1000);
    const hintsUsed = Object.values(S.hintLevel).reduce((a, b) => a + b, 0);
    const solSeen = Object.keys(S.solutionSeen).length;
    const mathPct = correct / mathSecs.length;
    const codePct = cr ? cr.passed / cr.total : 0;
    // Topics
    const topics = {};
    graded.forEach(({ q, g }) => { const t = q.topic.split(":")[0]; topics[t] = topics[t] || { c: 0, n: 0 }; topics[t].n++; if (g === "correct") topics[t].c++; });

    const markOf = g => ({ correct: ["c", "✓"], wrong: ["w", "✗"], skipped: ["s", "–"] }[g]);
    const yourAns = q => {
      const a = S.answers[q.id];
      if (a === undefined || a === "") return "<i>not answered</i>";
      if (q.type === "mcq") return bigFrac(q.choices[a]);
      const v = parseNumeric(a);
      return `${esc(a)}${v !== null && String(v) !== String(a).trim() ? ` <span style="color:var(--muted)">(= ${fmtNum(v)})</span>` : ""}`;
    };
    const correctAns = q => q.type === "mcq" ? bigFrac(q.choices[q.answer]) : esc(q.display || fmtNum(q.answer));
    const helpTag = id => (S.solutionSeen[id] ? `<span class="src-tag src-original">solution viewed</span> ` : "") + (S.hintLevel[id] ? `<span class="src-tag" style="background:var(--hint-light);color:var(--hint)">${S.hintLevel[id]} hint${S.hintLevel[id] > 1 ? "s" : ""}</span>` : "");
    const srcLine = q => q.source ? `<p style="font-size:13px;color:var(--muted)"><span class="src-tag src-${q.source.kind}">${{ reported: "Reported", style: "SIG-style", original: "Original" }[q.source.kind]}</span> ${q.source.url ? `<a href="${esc(q.source.url)}" target="_blank" rel="noopener">${esc(q.source.label)}</a>` : esc(q.source.label)}</p>` : "";

    const items = S.sections.map((s, i) => {
      if (s.kind === "math") {
        const q = mathById[s.qid], g = gradeMath(q), [mc, ms] = markOf(g);
        return `<div class="review-item"><div class="ri-head"><div class="ri-mark ${mc}">${ms}</div>
          <div class="ri-title">${i + 1}. ${esc(q.title)}<span class="tp">${esc(q.topic)} · ${q.difficulty}</span></div>
          <div class="ri-meta">${helpTag(q.id)}</div><div class="ri-meta">▾</div></div>
          <div class="ri-body"><div class="q-body" style="padding:0">${q.prompt}</div>
            <div class="ans-row"><div>Your answer: <b>${yourAns(q)}</b></div><div>Correct answer: <b>${correctAns(q)}</b></div></div>
            <div class="solution-card"><b>Solution.</b> ${q.solution}</div>${srcLine(q)}</div></div>`;
      }
      const mark = !cr ? ["s", "–"] : (cr.passed === cr.total ? ["c", "✓"] : (cr.passed ? ["p", "~"] : ["w", "✗"]));
      return `<div class="review-item"><div class="ri-head"><div class="ri-mark ${mark[0]}">${mark[1]}</div>
        <div class="ri-title">${i + 1}. ${esc(cq.title)}<span class="tp">Coding · ${esc(cq.topic)}</span></div>
        <div class="ri-meta">${cr ? `${cr.passed}/${cr.total} tests · ${LANG_LABEL[cr.lang]}` : "not submitted"} ${helpTag(cq.id)}</div><div class="ri-meta">▾</div></div>
        <div class="ri-body"><div class="solution-card"><b>Reference solution (Python).</b> ${cq.solution}</div>
          ${S.code[cq.id] ? `<div class="lbl" style="margin-top:12px;font-weight:700">Your last code (${LANG_LABEL[S.code[cq.id].lang]})</div><pre>${esc(S.code[cq.id].src[S.code[cq.id].lang] || "")}</pre>` : ""}</div></div>`;
    }).join("");

    $app.innerHTML = `<div class="landing">${headerHTML(false)}<div class="results-page">
      <h1>Mock results</h1>
      <div class="sub">${esc(S.settings.name || "Candidate")} · ${{ A: "Mock A", B: "Mock B", C: "Mock C", R: "Random mix" }[S.settings.set]} · ${S.order === "math" ? "Math first" : "Coding first"}${S.endReason ? ` · ${esc(S.endReason)}` : ""}</div>
      <div class="summary">
        <div class="card sum-card"><div class="k">Math</div><div class="v">${correct}/${mathSecs.length}</div><div class="d">${Math.round(mathPct * 100)}% correct</div></div>
        <div class="card sum-card"><div class="k">Coding</div><div class="v">${cr ? `${cr.passed}/${cr.total}` : "0"}</div><div class="d">${cr ? `test cases passed (${Math.round(codePct * 100)}%)` : "not submitted"}</div></div>
        <div class="card sum-card"><div class="k">Time used</div><div class="v">${Math.floor(used / 60)}:${String(used % 60).padStart(2, "0")}</div><div class="d">of ${DURATION_MIN}:00</div></div>
        <div class="card sum-card"><div class="k">Help used</div><div class="v">${hintsUsed}</div><div class="d">hints · ${solSeen} solution${solSeen === 1 ? "" : "s"} viewed · left window ${S.awayCount}×</div></div>
      </div>
      <div class="card topic-bars"><h3>By topic (math)</h3>
        ${Object.entries(topics).sort((a, b) => a[1].c / a[1].n - b[1].c / b[1].n).map(([t, v]) => `<div class="tb-row"><div>${esc(t)}</div><div class="tb-bar"><span style="width:${(v.c / v.n) * 100}%"></span></div><div>${v.c}/${v.n}</div></div>`).join("")}
      </div>
      <div class="card review"><h3>Review: click a question to see the solution</h3>${items}</div>
      <div style="margin-top:24px;display:flex;gap:12px"><button class="btn btn-primary btn-lg" id="again">Take another mock</button><button class="btn btn-secondary btn-lg" id="redo">Retry this set</button></div>
    </div></div>`;
    $app.querySelectorAll(".ri-head").forEach(el => el.onclick = () => el.parentElement.classList.toggle("open"));
    renderMath($app);
    const restart = keep => { const st = S.settings; S = freshState(); S.settings = { ...st }; if (!keep) S.settings.set = { A: "B", B: "C", C: "R", R: "R" }[st.set]; save(); render(); };
    document.getElementById("again").onclick = () => restart(false);
    document.getElementById("redo").onclick = () => restart(true);
  }

  /* ----------------------------------------------------------------- router */
  function render() {
    if (S.phase !== "test") clearInterval(timerHandle);
    ({ welcome: renderWelcome, version: renderVersion, system: renderSystem, test: renderTest, results: renderResults }[S.phase] || renderWelcome)();
    if (S.phase === "test" && S.settings.timed && timeLeftMs() <= 0) finishTest("Time ran out while you were away. Your test was submitted automatically.");
  }

  // exposed for tests
  window.__sigmock = { parseNumeric, outputsMatch, get state() { return S; } };

  (async function boot() {
    const saved = load();
    S = freshState();
    if (saved) { S.settings = { ...S.settings, ...saved.settings, camera: false }; if (saved.phase === "results") S = saved; }
    render();
    await Runner.init();
    const st = document.getElementById("runnerStatus"); if (st) st.textContent = Runner.statusText();
  })();
})();
