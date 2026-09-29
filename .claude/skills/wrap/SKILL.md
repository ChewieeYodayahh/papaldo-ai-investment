---
name: wrap
description: Close out a Papaldo work session — fold what happened into PROGRESS.md so the next session starts from a written record instead of re-deriving it. Use when the user says wrap up, end of session, or before a long break.
---

# Wrap a session

Compress this session into `PROGRESS.md`. The next session reads that file, not
this transcript — anything you leave out is lost.

## Do this

1. **Read the current state.** `git status --short`, `git log --oneline` since the
   session started, and the top phase section of `PROGRESS.md`.

2. **Write only what a fresh session could not re-derive.** Skip anything visible
   in the diff or the log — those are already available. Capture:
   - **Decisions and their why.** "Chose X over Y because Z." The why is the part
     that gets lost.
   - **Dead ends.** What was tried and abandoned, so it isn't retried.
   - **Blocked items** — anything waiting on Carlos (a dashboard toggle, a
     credential, an interactive CLI login). Say exactly what unblocks it.
   - **Known issues** deliberately left alone, with the reason.

3. **Update, don't append blindly.** If an item under "Waiting on you" is now
   done, remove it. A stale blocker is worse than no blocker — it sends the next
   session chasing something already handled.

4. **Keep the newest phase at the top**, matching the file's existing structure.

5. **Verify before claiming done.** If the session touched code, run
   `/verify` (or `npm run verify`) and record the actual result. Never write
   "verified" for something you did not run — say what was skipped instead.

6. **Refresh the code graph** with `npm run graph` if more than a handful of
   files changed, so the next session's `explorer` agent works from a current map.

## Do not

- Do not restate the diff. `git log` already holds it.
- Do not write a narrative of the session. Write the state it ended in.
- Do not commit or push unless the user asks.

## Then

Tell the user what you recorded, and name anything still blocked on them.
