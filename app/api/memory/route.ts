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

async function readMemoryFile(path: string): Promise<{ content: string | null; error?: string }> {
  try {
    const result = await invokeOpenClawTool('memory_get', { path });
    if (!result.ok) {
      return { content: null, error: `Gateway error: ${JSON.stringify(result.error)}` };
    }
    return { content: parseMemoryGetResult(result) };
  } catch (err: any) {
    return { content: null, error: `Request failed: ${err.message}` };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const date = searchParams.get('date');
  const search = searchParams.get('search');
  const debug = searchParams.get('debug');

  try {
    if (!isConfigured()) {
      return NextResponse.json(
        { error: 'Gateway not configured', hint: 'Set OPENCLAW_URL and OPENCLAW_TOKEN in Vercel' },
        { status: 503 }
      );
    }

    // Debug endpoint — shows gateway connectivity status
    if (debug === '1') {
      const url = process.env.OPENCLAW_URL || '(not set)';
      const tokenSet = !!process.env.OPENCLAW_TOKEN;
      const testResult = await readMemoryFile('MEMORY.md');
      return NextResponse.json({
        gatewayUrl: url.replace(/\/+$/, '').substring(0, 40) + '...',
        tokenSet,
        testRead: testResult.content ? 'success' : 'failed',
        testError: testResult.error || null,
        testContentLength: testResult.content?.length || 0,
      });
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
      const indexResult = await readMemoryFile('memory/index.md');
      const dates: string[] = [];
      if (indexResult.content) {
        const dateRegex = /\d{4}-\d{2}-\d{2}/g;
        let match;
        while ((match = dateRegex.exec(indexResult.content)) !== null) {
          dates.push(match[0]);
        }
      }
      // Fallback: try recent dates
      if (dates.length === 0) {
        const today = new Date();
        for (let i = 0; i < 14; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const result = await readMemoryFile(`memory/${dateStr}.md`);
          if (result.content && result.content.trim()) {
            dates.push(dateStr);
          }
        }
      }
      return NextResponse.json({
        dates: dates.sort(),
        ...(dates.length === 0 ? { gatewayError: indexResult.error } : {}),
      });
    }

    // Long-term memory
    if (type === 'longterm') {
      const result = await readMemoryFile('MEMORY.md');
      if (result.content) {
        return NextResponse.json({ content: result.content });
      }
      return NextResponse.json(
        { error: 'MEMORY.md not found', gatewayError: result.error },
        { status: 404 }
      );
    }

    // Daily memory by date
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }
      const result = await readMemoryFile(`memory/${date}.md`);
      if (result.content) {
        return NextResponse.json({ content: result.content, date });
      }
      return NextResponse.json(
        { error: `No memory log for ${date}`, gatewayError: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (err) {
    console.error('[memory] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
