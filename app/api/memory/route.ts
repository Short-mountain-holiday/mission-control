import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { isConfigured, readFile, searchMemory } from '@/lib/openclaw';

// Memory files are bundled into data/memory/ in the repo as fallback.
// When gateway is configured, reads live from the VPS workspace via memory_get.

const MEMORY_ROOT = path.join(process.cwd(), 'data', 'memory');
const DAILY_DIR = path.join(MEMORY_ROOT, 'daily');
const WORKSPACE_MEMORY = '/data/.openclaw/workspace/memory';
const WORKSPACE_ROOT = '/data/.openclaw/workspace';

function getAvailableDates(): string[] {
  try {
    const files = fs.readdirSync(DAILY_DIR);
    return files
      .filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
      .map(f => f.replace('.md', ''))
      .sort();
  } catch {
    return [];
  }
}

/** Read a file — try gateway first, fall back to bundled. */
async function readMemoryFile(relativePath: string, bundledPath: string): Promise<string | null> {
  // Try live gateway
  if (isConfigured()) {
    const gatewayPath = `${WORKSPACE_ROOT}/${relativePath}`;
    const content = await readFile(gatewayPath);
    if (content) return content;
  }

  // Fallback to bundled file
  try {
    return fs.readFileSync(bundledPath, 'utf-8');
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const date = searchParams.get('date');
  const search = searchParams.get('search');
  const debug = searchParams.get('debug');

  try {
    // Debug endpoint — check gateway connectivity
    if (debug === '1') {
      const configured = isConfigured();
      let gatewayReachable = false;
      let gatewayError: string | null = null;

      if (configured) {
        try {
          const result = await searchMemory('test', 1);
          gatewayReachable = !!result;
        } catch (err: any) {
          gatewayError = err?.message || 'Unknown error';
        }
      }

      return NextResponse.json({
        configured,
        gatewayReachable,
        gatewayError,
        bundledDates: getAvailableDates().length,
        source: gatewayReachable ? 'live' : 'bundled',
      });
    }

    // Search across memory files
    if (search) {
      if (search.length > 100) {
        return NextResponse.json({ error: 'Search query too long' }, { status: 400 });
      }

      // Try gateway search first (searches across all memory files)
      if (isConfigured()) {
        const gatewayResults = await searchMemory(search, 10);
        if (gatewayResults && gatewayResults.results) {
          return NextResponse.json({
            dates: [...new Set(
              gatewayResults.results
                .map((r: any) => {
                  const match = r.path?.match(/(\d{4}-\d{2}-\d{2})/);
                  return match ? match[1] : null;
                })
                .filter(Boolean)
            )],
            results: gatewayResults.results.map((r: any) => ({
              date: r.path?.match(/(\d{4}-\d{2}-\d{2})/)?.[1] || 'longterm',
              snippet: r.snippet || '',
              path: r.path || '',
              score: r.score,
            })),
            source: 'live',
          });
        }
      }

      // Fallback to bundled search
      const query = search.toLowerCase();
      const dates = getAvailableDates();
      const results: { date: string; snippet: string }[] = [];

      for (const d of dates) {
        try {
          const content = fs.readFileSync(path.join(DAILY_DIR, `${d}.md`), 'utf-8');
          if (content.toLowerCase().includes(query)) {
            const idx = content.toLowerCase().indexOf(query);
            const start = Math.max(0, idx - 80);
            const end = Math.min(content.length, idx + query.length + 120);
            results.push({ date: d, snippet: content.substring(start, end).trim() });
          }
        } catch {
          // skip
        }
      }

      try {
        const ltm = fs.readFileSync(path.join(MEMORY_ROOT, 'MEMORY.md'), 'utf-8');
        if (ltm.toLowerCase().includes(query)) {
          const idx = ltm.toLowerCase().indexOf(query);
          const start = Math.max(0, idx - 80);
          const end = Math.min(ltm.length, idx + query.length + 120);
          results.push({ date: 'longterm', snippet: ltm.substring(start, end).trim() });
        }
      } catch {
        // no MEMORY.md
      }

      return NextResponse.json({
        dates: [...new Set(results.map(r => r.date).filter(d => d !== 'longterm'))],
        results,
        source: 'bundled',
      });
    }

    // List available dates (default)
    if (!type && !date) {
      const dates = getAvailableDates();
      return NextResponse.json({ dates, source: isConfigured() ? 'live-capable' : 'bundled' });
    }

    // Long-term memory
    if (type === 'longterm') {
      const content = await readMemoryFile('MEMORY.md', path.join(MEMORY_ROOT, 'MEMORY.md'));
      if (content) {
        return NextResponse.json({ content, source: isConfigured() ? 'live' : 'bundled' });
      }
      return NextResponse.json({ error: 'MEMORY.md not found' }, { status: 404 });
    }

    // Daily memory by date
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }

      const content = await readMemoryFile(
        `memory/${date}.md`,
        path.join(DAILY_DIR, `${date}.md`)
      );

      if (content) {
        return NextResponse.json({ content, date, source: isConfigured() ? 'live' : 'bundled' });
      }
      return NextResponse.json({ error: `No memory log for ${date}` }, { status: 404 });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (err) {
    console.error('[memory] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
