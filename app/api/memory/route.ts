import { NextRequest, NextResponse } from 'next/server';
import { invokeOpenClawTool, isConfigured } from '@/lib/openclaw';

// Use memory_get tool (available via gateway HTTP) to read memory files.
// memory_get can access: MEMORY.md, memory/*.md

function parseMemoryGetResult(result: any): string | null {
  if (!result?.ok) return null;
  const content = result?.result?.content?.[0]?.text;
  if (!content) return null;
  // memory_get wraps result in JSON with { text, path }
  try {
    const parsed = JSON.parse(content);
    return parsed.text || null;
  } catch {
    return content;
  }
}

async function readMemoryFile(path: string): Promise<string | null> {
  const result = await invokeOpenClawTool('memory_get', { path });
  return parseMemoryGetResult(result);
}

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

    // Search across memory files
    if (search) {
      if (search.length > 100) {
        return NextResponse.json({ error: 'Search query too long' }, { status: 400 });
      }
      const result = await invokeOpenClawTool('memory_search', { query: search });
      const content = result?.result?.content?.[0]?.text;
      let searchResults: any[] = [];
      if (content) {
        try {
          const parsed = JSON.parse(content);
          searchResults = parsed.results || [];
        } catch {
          // fall through
        }
      }
      // Extract dates from search result paths
      const dates = searchResults
        .map((r: any) => {
          const match = r.path?.match(/(\d{4}-\d{2}-\d{2})/);
          return match ? match[1] : null;
        })
        .filter(Boolean);
      return NextResponse.json({ dates: [...new Set(dates)], results: searchResults });
    }

    // List available dates
    if (!type && !date) {
      // Read index file which lists available dates
      const indexContent = await readMemoryFile('memory/index.md');
      const dates: string[] = [];
      if (indexContent) {
        // Parse dates from index (lines like "- 2026-03-12")
        const dateRegex = /\d{4}-\d{2}-\d{2}/g;
        let match;
        while ((match = dateRegex.exec(indexContent)) !== null) {
          dates.push(match[0]);
        }
      }
      // If index is empty/missing, try recent dates as fallback
      if (dates.length === 0) {
        const today = new Date();
        for (let i = 0; i < 14; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const content = await readMemoryFile(`memory/${dateStr}.md`);
          if (content && content.trim()) {
            dates.push(dateStr);
          }
        }
      }
      return NextResponse.json({ dates: dates.sort() });
    }

    // Long-term memory
    if (type === 'longterm') {
      const content = await readMemoryFile('MEMORY.md');
      if (content) {
        return NextResponse.json({ content });
      }
      return NextResponse.json({ error: 'MEMORY.md not found' }, { status: 404 });
    }

    // Daily memory by date
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }
      const content = await readMemoryFile(`memory/${date}.md`);
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
