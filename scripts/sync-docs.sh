#!/bin/bash
# Sync workspace docs to mission-control/data/docs/ for Vercel deployment
WORKSPACE="/data/.openclaw/workspace"
DOCS_DIR="$WORKSPACE/mission-control/data/docs"

rm -rf "$DOCS_DIR"
mkdir -p "$DOCS_DIR"/{workspace,context,agents/sloane,agents/reid,agents/willow}

for f in AGENTS.md SOUL.md IDENTITY.md USER.md HEARTBEAT.md TOOLS.md; do
  [ -f "$WORKSPACE/$f" ] && cp "$WORKSPACE/$f" "$DOCS_DIR/workspace/$f"
done
for f in "$WORKSPACE"/context/*.md; do [ -f "$f" ] && cp "$f" "$DOCS_DIR/context/"; done
for agent in sloane reid willow; do
  for f in "$WORKSPACE"/agents/$agent/*.md; do [ -f "$f" ] && cp "$f" "$DOCS_DIR/agents/$agent/"; done
done

echo "✅ Docs synced: $(find "$DOCS_DIR" -type f | wc -l) files"
