#!/usr/bin/env bash
# SessionStart hook: emit volatile repo state so the agent orients without
# spending exploratory tool calls. Stable structure lives in CLAUDE.md;
# this covers only what changes between sessions.
# Always exits 0 — an orientation failure must never block a session.

cd "$(dirname "$0")/.." 2>/dev/null || exit 0

# Groups changed paths by area: features/<name>[/<sub-feature>], src/<dir>, or
# the top folder. A nested feature (features/tools/quiz/...) counts as its own
# area; api/components/pages/hooks folders belong to their parent.
AREAS_AWK='
{
  if ($1 == "src" && $2 == "app" && $3 == "features") {
    key = "features/" $4
    if (NF >= 6 && $5 !~ /^(api|components|pages|hooks|sections)$/) key = key "/" $5
  }
  else if ($1 == "src") key = "src/" $2
  else key = $1
  count[key]++
}
END { for (key in count) print count[key], key }
'

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

  # The built-in git snapshot already lists recent commits and changed files,
  # so this adds only what it lacks: where the changes cluster, and whether
  # the code graph still matches HEAD.
  dirty=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  if [ "$dirty" -gt 0 ] 2>/dev/null; then
    areas=$(git status --porcelain 2>/dev/null | cut -c4- | sed 's/.* -> //' | tr -d '"' \
      | awk -F/ "$AREAS_AWK" | sort -nr | head -8 \
      | awk '{ printf "%s%s (%s)", (NR > 1 ? ", " : ""), $2, $1 }')
    echo "Uncommitted: $dirty path(s) — $areas"
  else
    echo "Uncommitted: none"
  fi

  if [ -f graphify-out/GRAPH_REPORT.md ]; then
    built=$(sed -n 's/.*Built from commit: `\([0-9a-f]*\)`.*/\1/p' graphify-out/GRAPH_REPORT.md | head -1)
    if [ -n "$built" ]; then
      since=$(git rev-list --count "$built"..HEAD 2>/dev/null || echo "?")
      echo "Code graph: graphify-out/ built at $built, $since commit(s) behind HEAD (npm run graph refreshes it)"
    fi
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
