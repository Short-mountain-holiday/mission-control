import { NextRequest, NextResponse } from 'next/server';

// Scan the workspace for markdown documents (excluding memory files)
// Categories are inferred from directory structure

interface DocEntry {
  name: string;
  path: string;
  category: string;
  lastModified: string;
  size: number;
}

const WORKSPACE = '/data/.openclaw/workspace';

// Directories to scan and their category labels
const SCAN_DIRS: Record<string, string> = {
  '.': 'Workspace',
  'context': 'Context',
  'agents/sloane': 'Sloane',
  'agents/reid': 'Reid',
  'agents/willow': 'Willow',
  'scripts': 'Scripts',
  'skills/notion': 'Skills',
  'skills/hostaway': 'Skills',
};

// Files to exclude
const EXCLUDE = new Set([
  'MEMORY.md',
  'node_modules',
  '.git',
  'mission-control',
]);

async function scanDocs(): Promise<DocEntry[]> {
  const fs = await import('fs/promises');
  const path = await import('path');
  const docs: DocEntry[] = [];

  for (const [dir, category] of Object.entries(SCAN_DIRS)) {
    const fullDir = path.join(WORKSPACE, dir);
    try {
      const files = await fs.readdir(fullDir);
      for (const file of files) {
        if (EXCLUDE.has(file)) continue;
        if (!file.endsWith('.md') && !file.endsWith('.sh') && !file.endsWith('.json')) continue;
        if (file.startsWith('.')) continue;

        const fullPath = path.join(fullDir, file);
        try {
          const stat = await fs.stat(fullPath);
          if (!stat.isFile()) continue;

          docs.push({
            name: file,
            path: fullPath,
            category,
            lastModified: stat.mtime.toISOString(),
            size: stat.size,
          });
        } catch {
          continue;
        }
      }
    } catch {
      continue;
    }
  }

  return docs.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path');

  // Read specific file
  if (filePath) {
    // Security: only allow reading from workspace
    if (!filePath.startsWith(WORKSPACE)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(filePath, 'utf-8');
      return NextResponse.json({ content });
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
  }

  // List all docs
  try {
    const docs = await scanDocs();
    return NextResponse.json({ docs });
  } catch {
    return NextResponse.json({ docs: [] });
  }
}
