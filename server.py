#!/usr/bin/env python3
"""
Local server for the SIG OA mock.

  python3 server.py            -> http://localhost:8000
  python3 server.py --port 9000

Serves the static site and exposes POST /api/run, which compiles/runs your code
against stdin inputs (like HackerRank's Run Code / Submit). Supported:
python3, cpp (g++), java (javac/java), javascript (node) -- whichever are installed.

It only listens on 127.0.0.1 and runs the code you type, as your own user.
Standard library only; no pip installs needed.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))

# HackerRank-style time limits (seconds per test case)
LANGS = {
    "python3": {"file": "solution.py", "compile": None,
                "run": [sys.executable or "python3", "solution.py"], "limit": 10, "need": None},
    "cpp": {"file": "solution.cpp", "compile": ["g++", "-std=c++17", "-O2", "-o", "solution", "solution.cpp"],
            "run": ["./solution"], "limit": 2, "need": "g++"},
    "java": {"file": "Solution.java", "compile": ["javac", "Solution.java"],
             "run": ["java", "-Xss64m", "-cp", ".", "Solution"], "limit": 4, "need": "javac"},
    "javascript": {"file": "solution.js", "compile": None,
                   "run": ["node", "--stack-size=65500", "solution.js"], "limit": 10, "need": "node"},
}
MAX_OUT = 1 << 20  # 1 MB of stdout kept per test


def available():
    return [k for k, v in LANGS.items() if v["need"] is None or shutil.which(v["need"])]


def run_code(lang, code, inputs):
    cfg = LANGS[lang]
    with tempfile.TemporaryDirectory(prefix="sigmock_") as d:
        with open(os.path.join(d, cfg["file"]), "w") as f:
            f.write(code)
        if cfg["compile"]:
            try:
                p = subprocess.run(cfg["compile"], cwd=d, capture_output=True, text=True, timeout=30)
            except subprocess.TimeoutExpired:
                return {"compile": {"ok": False, "message": "Compilation timed out"}, "results": []}
            if p.returncode != 0:
                return {"compile": {"ok": False, "message": (p.stderr or p.stdout)[-8000:]}, "results": []}
        results = []
        for stdin in inputs:
            t0 = time.time()
            try:
                p = subprocess.run(cfg["run"], cwd=d, input=stdin, capture_output=True, text=True,
                                   timeout=cfg["limit"])
                results.append({"stdout": p.stdout[:MAX_OUT], "stderr": p.stderr[-8000:],
                                "exitCode": p.returncode, "time": round(time.time() - t0, 3),
                                "timedOut": False})
            except subprocess.TimeoutExpired as e:
                out = e.stdout.decode() if isinstance(e.stdout, bytes) else (e.stdout or "")
                results.append({"stdout": out[:MAX_OUT], "stderr": "", "exitCode": None,
                                "time": cfg["limit"], "timedOut": True})
        return {"compile": {"ok": True, "message": ""}, "results": results}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def log_message(self, fmt, *args):
        if "/api/" in (args[0] if args else ""):
            sys.stderr.write("%s\n" % (fmt % args))

    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/api/health":
            return self._json(200, {"ok": True, "languages": available()})
        return super().do_GET()

    def do_POST(self):
        if self.path != "/api/run":
            return self._json(404, {"error": "not found"})
        try:
            n = int(self.headers.get("Content-Length", 0))
            req = json.loads(self.rfile.read(n))
            lang, code, inputs = req["language"], req["code"], req["inputs"]
        except Exception as e:  # noqa: BLE001
            return self._json(400, {"error": "bad request: %s" % e})
        if lang not in available():
            return self._json(400, {"error": "language '%s' is not installed on this machine" % lang})
        return self._json(200, run_code(lang, code, inputs))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8000)
    args = ap.parse_args()
    srv = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    print("SIG OA mock running at http://localhost:%d  (languages: %s)" % (args.port, ", ".join(available())))
    print("Press Ctrl+C to stop.")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
