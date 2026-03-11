import { NextRequest, NextResponse } from 'next/server';
import { readFile, listFiles, exec, isConfigured, sanitizeShellArg, WORKSPACE_ROOT } from '@/lib/openclaw';

const MEMORY_DIR = `${WORKSPACE_ROOT}/memory`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const date = searchParams.get('date');
  const search = searchParams.get('search');

  try {
    if (!isConfigured()) {
      return NextResponse.json(
        { error: 'Gateway not configured', hint: 'Set OPENCLAW_URL and OPENCLAW_TOKEN in Vercel' },
        { status: 503 }
      );
    }

    // Search across all memory files
    if (search) {
      if (search.length > 100) {
        return NextResponse.json({ error: 'Search query too long' }, { status: 400 });
      }
      const safeQuery = sanitizeShellArg(search);
      const output = await exec(
        `grep -ril -- '${safeQuery}' "${MEMORY_DIR}/" 2>/dev/null | head -20`
      );
      const matchingFiles = output
        ? output.trim().split('\n').filter(Boolean).map(f => f.replace(`${MEMORY_DIR}/`, '').replace('.md', ''))
        : [];
      return NextResponse.json({ dates: matchingFiles });
    }

    // List available dates
    if (!type && !date) {
      const files = await listFiles(MEMORY_DIR, '\\d{4}-\\d{2}-\\d{2}\\.md');
      const dates = files
        .map(f => f.replace('.md', ''))
        .filter(f => /^\d{4}-\d{2}-\d{2}$/.test(f))
        .sort();
      return NextResponse.json({ dates });
    }

    // Long-term memory
    if (type === 'longterm') {
      const content = await readFile('MEMORY.md');
      if (content) {
        return NextResponse.json({ content });
      }
      return NextResponse.json({ error: 'MEMORY.md not found' }, { status: 404 });
    }

    // Daily memory by date
    if (date) {
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }
      const content = await readFile(`memory/${date}.md`);
      if (content) {
        return NextResponse.json({ content, date });
      }
      return NextResponse.json({ error: `No memory log for ${date}` }, { status: 404 });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (err) {
    console.error('[memory] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
