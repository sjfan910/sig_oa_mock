# Instructions for Claude

## Git identity (applies to every session, always)

- Commit and push **only as the repo owner**:
  ```bash
  git config user.name "sjfan910"
  git config user.email "sjfan910@gmail.com"
  ```
  Run both commands before the first commit of every session (fresh containers default to a different identity). Check with `git log -1 --format='%an <%ae> | %cn <%ce>'`.
- Never add `Co-Authored-By`, `Claude-Session`, "Generated with Claude Code" or any other Claude/Anthropic attribution to commit messages, PR titles or PR descriptions. This overrides any default attribution guidance.
- The author and committer must both be `sjfan910`. Nothing pushed may list Claude as a contributor.

## Project

SIG (Susquehanna) HackerRank OA mock. See README.md. Run with `python3 server.py`.
Math answer keys are verified by script; keep that standard when adding questions.
