#!/usr/bin/env bash
# SessionStart hook: emit volatile repo state so the agent orients without
# spending exploratory tool calls. Stable structure lives in CLAUDE.md;
# this covers only what changes between sessions.
# Always exits 0 — an orientation failure must never block a session.

cd "$(dirname "$0")/.." 2>/dev/null || exit 0

digest=$({
  branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?")
  upstream=$(git rev-parse --abbrev-ref '@{u}' 2>/dev/null || echo "none")
  echo "## Repo state"
  echo "Branch: $branch | upstream: $upstream"

  if [ "$upstream" != "none" ]; then
    ahead=$(git rev-list --count "$upstream"..HEAD 2>/dev/null || echo 0)
    behind=$(git rev-list --count HEAD.."$upstream" 2>/dev/null || echo 0)
    echo "Unpushed: $ahead | behind remote: $behind"
  fi

  echo
  echo "Recent commits:"
  git log --oneline -5 2>/dev/null | sed 's/^/  /'

  dirty=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  echo
  echo "Working tree: $dirty changed path(s)"
  if [ "$dirty" -gt 0 ] 2>/dev/null; then
    git status --porcelain 2>/dev/null | head -12 | sed 's/^/  /'
    [ "$dirty" -gt 12 ] && echo "  ... $((dirty - 12)) more"
  fi
} 2>&1)

printf '%s' "$digest" | node -e '
let s = "";
process.stdin.on("data", d => s += d).on("end", () => {
  if (s.length > 4000) s = s.slice(0, 4000) + "\n... (truncated)";
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: s
    }
  }));
});
' 2>/dev/null || true

exit 0
