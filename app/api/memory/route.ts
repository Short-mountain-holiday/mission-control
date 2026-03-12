import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Memory files are bundled into data/memory/ in the repo (like docs).
// Daily logs: data/memory/daily/YYYY-MM-DD.md
// Long-term:  data/memory/MEMORY.md
// To update: run scripts/sync-memory.sh then redeploy.

const MEMORY_ROOT = path.join(process.cwd(), 'data', 'memory');
const DAILY_DIR = path.join(MEMORY_ROOT, 'daily');

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const date = searchParams.get('date');
  const search = searchParams.get('search');

  try {
    // Search across memory files
    if (search) {
      if (search.length > 100) {
        return NextResponse.json({ error: 'Search query too long' }, { status: 400 });
      }
      const query = search.toLowerCase();
      const dates = getAvailableDates();
      const results: { date: string; snippet: string }[] = [];

      for (const d of dates) {
        try {
          const content = fs.readFileSync(path.join(DAILY_DIR, `${d}.md`), 'utf-8');
          if (content.toLowerCase().includes(query)) {
            // Extract snippet around match
            const idx = content.toLowerCase().indexOf(query);
            const start = Math.max(0, idx - 80);
            const end = Math.min(content.length, idx + query.length + 120);
            results.push({ date: d, snippet: content.substring(start, end).trim() });
          }
        } catch {
          // skip unreadable files
        }
      }

      // Also search MEMORY.md
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
      });
    }

    // List available dates (default — no params)
    if (!type && !date) {
      const dates = getAvailableDates();
      return NextResponse.json({ dates });
    }

    // Long-term memory
    if (type === 'longterm') {
      try {
        const content = fs.readFileSync(path.join(MEMORY_ROOT, 'MEMORY.md'), 'utf-8');
        return NextResponse.json({ content });
      } catch {
        return NextResponse.json({ error: 'MEMORY.md not found' }, { status: 404 });
      }
    }

    // Daily memory by date
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }
      const filePath = path.join(DAILY_DIR, `${date}.md`);
      // Ensure resolved path stays within DAILY_DIR
      const resolved = path.resolve(filePath);
      if (!resolved.startsWith(DAILY_DIR)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      try {
        const content = fs.readFileSync(resolved, 'utf-8');
        return NextResponse.json({ content, date });
      } catch {
        return NextResponse.json({ error: `No memory log for ${date}` }, { status: 404 });
      }
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (err) {
    console.error('[memory] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
