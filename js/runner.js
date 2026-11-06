/*
 * Code runner.
 *  1. Local server mode (python3 server.py): real Python 3 / C++17 / Java / Node, HackerRank-like limits.
 *  2. Browser fallback (index.html opened directly): JavaScript in a Web Worker,
 *     Python 3 through Pyodide loaded from the jsDelivr CDN (needs internet once).
 */
(function () {
  const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
  const LIMITS = { python3: 10000, javascript: 10000 }; // ms per test case in browser mode

  const JS_WORKER = `
self.onmessage = function (e) {
  const { code, stdin } = e.data;
  let out = "", err = "";
  const fmt = a => a.map(x => typeof x === "string" ? x : (typeof x === "object" ? JSON.stringify(x) : String(x))).join(" ");
  const con = { log: (...a) => { out += fmt(a) + "\\n"; }, info: (...a) => { out += fmt(a) + "\\n"; },
                error: (...a) => { err += fmt(a) + "\\n"; }, warn: (...a) => { err += fmt(a) + "\\n"; } };
  const handlers = { data: [], end: [] };
  const stdinObj = { resume() {}, setEncoding() {}, on(ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); return stdinObj; } };
  const proc = { stdin: stdinObj, stdout: { write: s => { out += String(s); return true; } }, env: {}, argv: [], exit: () => { throw { __exit: true }; } };
  const rl = {
    createInterface() {
      const lines = stdin.split("\\n"); if (lines.length && lines[lines.length - 1] === "") lines.pop();
      const h = { line: [], close: [] };
      const iface = { on(ev, fn) { (h[ev] = h[ev] || []).push(fn); return iface; }, close() {},
        [Symbol.asyncIterator]: async function* () { for (const l of lines) yield l; } };
      setTimeout(() => { try { lines.forEach(l => h.line.forEach(f => f(l))); h.close.forEach(f => f()); done(); } catch (x) { fail(x); } }, 0);
      pending = true; return iface;
    }
  };
  const req = m => { if (m === "fs") return { readFileSync: () => stdin }; if (m === "readline") return rl; throw new Error("Cannot find module '" + m + "'"); };
  let pending = false;
  function done() { self.postMessage({ stdout: out, stderr: err, exitCode: 0 }); }
  function fail(x) { if (x && x.__exit) return done(); self.postMessage({ stdout: out, stderr: err + String((x && x.stack) || x), exitCode: 1 }); }
  try {
    new Function("require", "console", "process", "module", "exports", code)(req, con, proc, { exports: {} }, {});
    if (handlers.data.length || handlers.end.length) { pending = true; handlers.data.forEach(f => f(stdin)); handlers.end.forEach(f => f()); }
    if (!pending || handlers.end.length) done();
  } catch (x) { fail(x); }
};`;

  const PY_WORKER = `
importScripts("${PYODIDE_URL}pyodide.js");
let pyReady = loadPyodide({ indexURL: "${PYODIDE_URL}" });
const WRAP = [
  "import sys, io, builtins, traceback",
  "_in = io.StringIO(__STDIN__); _out = io.StringIO(); _err = ''; _code = 0",
  "sys.stdin = _in; sys.stdout = _out",
  "def _inp(prompt=''):",
  "    l = _in.readline()",
  "    if not l: raise EOFError('EOF when reading a line')",
  "    return l[:-1] if l.endswith('\\\\n') else l",
  "builtins.input = _inp",
  "try:",
  "    exec(compile(__CODE__, 'solution.py', 'exec'), {'__name__': '__main__'})",
  "except SystemExit as e:",
  "    _code = e.code if isinstance(e.code, int) else 0",
  "except BaseException:",
  "    _err = traceback.format_exc(); _code = 1",
  "finally:",
  "    sys.stdout = sys.__stdout__; sys.stdin = sys.__stdin__",
  "(_out.getvalue(), _err, _code)"
].join("\\n");
self.onmessage = async function (e) {
  try {
    const py = await pyReady;
    if (e.data.warm) { self.postMessage({ warm: true }); return; }
    py.globals.set("__STDIN__", e.data.stdin);
    py.globals.set("__CODE__", e.data.code);
    const r = py.runPython(WRAP).toJs();
    self.postMessage({ stdout: r[0], stderr: r[1], exitCode: r[2] });
  } catch (x) {
    self.postMessage({ stdout: "", stderr: String(x), exitCode: 1, loadError: !!e.data.warm });
  }
};`;

  function makeWorker(src) {
    return new Worker(URL.createObjectURL(new Blob([src], { type: "text/javascript" })));
  }

  const Runner = {
    mode: "detecting", // "server" | "browser"
    languages: [],
    pyWorker: null,
    pyStatus: "idle", // idle | loading | ready | failed

    async init() {
      try {
        if (location.protocol.startsWith("http")) {
          const r = await fetch("/api/health", { cache: "no-store" });
          if (r.ok) {
            const j = await r.json();
            this.mode = "server";
            this.languages = j.languages;
            return;
          }
        }
      } catch (_) { /* fall through */ }
      this.mode = "browser";
      this.languages = ["python3", "javascript"];
    },

    supports(lang) { return this.languages.includes(lang); },

    statusText() {
      if (this.mode === "server") return "Local runner connected";
      if (this.mode === "browser") {
        const py = { idle: "", loading: " · loading Python…", ready: "", failed: " · Python runtime failed to load (needs internet)" }[this.pyStatus];
        return "Browser runner (Python, JavaScript)" + py;
      }
      return "Detecting runner…";
    },

    warmPython() {
      if (this.mode !== "browser" || this.pyWorker) return;
      this.pyStatus = "loading";
      this.pyWorker = makeWorker(PY_WORKER);
      this.pyWorker.onmessage = (e) => { this.pyStatus = e.data.loadError ? "failed" : "ready"; if (this.onStatus) this.onStatus(); };
      this.pyWorker.onerror = () => { this.pyStatus = "failed"; if (this.onStatus) this.onStatus(); };
      this.pyWorker.postMessage({ warm: true });
    },

    // returns { compile: {ok, message}, results: [{stdout, stderr, exitCode, time, timedOut}] }
    async run(lang, code, inputs) {
      if (this.mode === "server") {
        const r = await fetch("/api/run", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: lang, code, inputs }),
        });
        const j = await r.json();
        if (!r.ok) return { compile: { ok: false, message: j.error || "Runner error" }, results: [] };
        return j;
      }
      if (!this.supports(lang)) {
        return { compile: { ok: false, message: "C++ and Java need the local runner.\n\nStart it with:\n    python3 server.py\nthen open http://localhost:8000\n\nPython 3 and JavaScript work without it." }, results: [] };
      }
      const results = [];
      for (const stdin of inputs) results.push(await this._runOne(lang, code, stdin));
      return { compile: { ok: true, message: "" }, results };
    },

    _runOne(lang, code, stdin) {
      return new Promise((resolve) => {
        let w;
        if (lang === "python3") {
          if (!this.pyWorker) this.warmPython();
          w = this.pyWorker;
        } else {
          w = makeWorker(JS_WORKER);
        }
        const t0 = performance.now();
        // Python's first load can take a while; only start the clock-based kill after load.
        const limit = LIMITS[lang] + (lang === "python3" && this.pyStatus !== "ready" ? 60000 : 0);
        const timer = setTimeout(() => {
          w.terminate();
          if (lang === "python3") { this.pyWorker = null; this.pyStatus = "idle"; }
          resolve({ stdout: "", stderr: "", exitCode: null, time: limit / 1000, timedOut: true });
        }, limit);
        w.onmessage = (e) => {
          if (e.data.warm) return; // late warm-up ack
          clearTimeout(timer);
          if (lang === "python3") this.pyStatus = "ready";
          else w.terminate();
          resolve({ ...e.data, time: +((performance.now() - t0) / 1000).toFixed(3), timedOut: false });
        };
        w.onerror = (e) => {
          clearTimeout(timer);
          resolve({ stdout: "", stderr: e.message || "Worker error", exitCode: 1, time: 0, timedOut: false });
        };
        w.postMessage({ code, stdin });
      });
    },
  };

  window.Runner = Runner;
})();
