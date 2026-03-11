import { NextRequest, NextResponse } from 'next/server';

const OPENCLAW_URL = process.env.OPENCLAW_URL || 'https://openclaw.shortmountain.holiday';
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || '';

// Memory files live on the VPS. This API route proxies to the OpenClaw gateway
// to read workspace files. If the gateway doesn't support file reads,
// we fall back to a direct file read (only works in dev/self-hosted).

async function fetchFromOpenClaw(path: string): Promise<string | null> {
  try {
    // Try OpenClaw gateway file read endpoint
    const res = await fetch(`${OPENCLAW_URL}/api/v1/files/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
      },
      body: JSON.stringify({ path }),
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const data = await res.json();
      return data.content || null;
    }
  } catch {
    // Gateway might not support this endpoint yet
  }

  // Fallback: try reading from filesystem (dev mode / self-hosted Next.js)
  try {
    const fs = await import('fs/promises');
    const content = await fs.readFile(path, 'utf-8');
    return content;
  } catch {
    return null;
  }
}

async function listMemoryDates(): Promise<string[]> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const memoryDir = '/data/.openclaw/workspace/memory';
    const files = await fs.readdir(memoryDir);
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

  // List available dates
  if (!type && !date) {
    const dates = await listMemoryDates();
    return NextResponse.json({ dates });
  }

  // Long-term memory
  if (type === 'longterm') {
    const content = await fetchFromOpenClaw('/data/.openclaw/workspace/MEMORY.md');
    if (content) {
      return NextResponse.json({ content });
    }
    return NextResponse.json({ error: 'MEMORY.md not found' }, { status: 404 });
  }

  // Daily memory
  if (date) {
    const content = await fetchFromOpenClaw(`/data/.openclaw/workspace/memory/${date}.md`);
    if (content) {
      return NextResponse.json({ content, date });
    }
    return NextResponse.json({ error: `No memory log for ${date}` }, { status: 404 });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}
