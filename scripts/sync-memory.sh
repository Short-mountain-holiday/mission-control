#!/bin/bash
# Sync workspace memory files to mission-control/data/memory/ for Vercel deployment
WORKSPACE="/data/.openclaw/workspace"
MEMORY_DIR="$WORKSPACE/mission-control/data/memory"

rm -rf "$MEMORY_DIR"
mkdir -p "$MEMORY_DIR/daily"

# Copy daily logs (YYYY-MM-DD.md pattern only)
for f in "$WORKSPACE"/memory/????-??-??.md; do
  [ -f "$f" ] && cp "$f" "$MEMORY_DIR/daily/"
done

# Copy MEMORY.md (long-term)
[ -f "$WORKSPACE/MEMORY.md" ] && cp "$WORKSPACE/MEMORY.md" "$MEMORY_DIR/MEMORY.md"

echo "✅ Memory synced: $(find "$MEMORY_DIR" -type f | wc -l) files"
