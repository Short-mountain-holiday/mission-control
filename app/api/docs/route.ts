import { NextRequest, NextResponse } from 'next/server';
import { readFile, exec, isConfigured, sanitizeShellArg, sanitizePath, WORKSPACE_ROOT } from '@/lib/openclaw';

// Category inference from path
function inferCategory(path: string): string {
  if (path.includes('/agents/sloane/')) return 'Sloane';
  if (path.includes('/agents/reid/')) return 'Reid';
  if (path.includes('/agents/willow/')) return 'Willow';
  if (path.includes('/context/')) return 'Context';
  if (path.includes('/scripts/')) return 'Scripts';
  if (path.includes('/skills/')) return 'Skills';
  return 'Workspace';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path');
  const search = searchParams.get('search');

  try {
    if (!isConfigured()) {
      return NextResponse.json(
        { error: 'Gateway not configured', hint: 'Set OPENCLAW_URL and OPENCLAW_TOKEN in Vercel' },
        { status: 503 }
      );
    }

    // Read specific file
    if (filePath) {
      // sanitizePath handles all validation: traversal, blocked files, extensions, workspace bounds
      const safePath = sanitizePath(filePath);
      if (!safePath) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      const content = await readFile(filePath);
      if (content) {
        return NextResponse.json({ content });
      }
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Search across docs
    if (search) {
      if (search.length > 100) {
        return NextResponse.json({ error: 'Search query too long' }, { status: 400 });
      }
      const safeQuery = sanitizeShellArg(search);
      const output = await exec(
        `grep -ril -- '${safeQuery}' "${WORKSPACE_ROOT}/" --include='*.md' 2>/dev/null | grep -v node_modules | grep -v .next | grep -v mission-control | grep -v .git | head -30`
      );
      const files = output ? output.trim().split('\n').filter(Boolean) : [];
      return NextResponse.json({
        docs: files.map(f => ({
          name: f.split('/').pop() || f,
          path: f,
          category: inferCategory(f),
        })),
      });
    }

    // List all docs — single batched exec call for efficiency
    const script = `
      find "${WORKSPACE_ROOT}" -maxdepth 3 \\( -name '*.md' -o -name '*.sh' -o -name '*.json' \\) -type f 2>/dev/null | \
      grep -v node_modules | grep -v .next | grep -v mission-control | grep -v '.git/' | grep -v MEMORY.md | grep -v openclaw.json | \
      while read f; do
        stat_out=$(stat -c '%Y %s' "$f" 2>/dev/null)
        echo "$stat_out $f"
      done
    `.trim();

    const output = await exec(script, 30000);
    if (!output) {
      return NextResponse.json({ docs: [] });
    }

    const docs = output
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(line => {
        const parts = line.split(' ');
        if (parts.length < 3) return null;
        const mtime = parseInt(parts[0], 10);
        const size = parseInt(parts[1], 10);
        const path = parts.slice(2).join(' ');
        const name = path.split('/').pop() || path;
        return {
          name,
          path,
          category: inferCategory(path),
          lastModified: new Date(mtime * 1000).toISOString(),
          size,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

    return NextResponse.json({ docs });
  } catch (err) {
    console.error('[docs] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
