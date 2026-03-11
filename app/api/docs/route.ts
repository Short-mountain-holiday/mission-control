import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Docs are bundled into data/docs/ in the repo.
// This route reads from the local filesystem (works on Vercel since files are in the deployment).
// For live updates, re-sync workspace docs to data/docs/ and redeploy.

const DOCS_ROOT = path.join(process.cwd(), 'data', 'docs');

// Category inference from directory
function inferCategory(filePath: string): string {
  const rel = path.relative(DOCS_ROOT, filePath);
  if (rel.startsWith('agents/sloane')) return 'Sloane';
  if (rel.startsWith('agents/reid')) return 'Reid';
  if (rel.startsWith('agents/willow')) return 'Willow';
  if (rel.startsWith('context')) return 'Context';
  if (rel.startsWith('scripts')) return 'Scripts';
  if (rel.startsWith('skills')) return 'Skills';
  return 'Workspace';
}

function walkDir(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...walkDir(full));
      } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.sh') || entry.name.endsWith('.json'))) {
        results.push(full);
      }
    }
  } catch {
    // Directory doesn't exist
  }
  return results;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path');
  const search = searchParams.get('search');

  try {
    // Read specific file
    if (filePath) {
      // Resolve and validate path stays within DOCS_ROOT
      const resolved = path.resolve(DOCS_ROOT, filePath.replace(/^\/+/, ''));
      if (!resolved.startsWith(DOCS_ROOT)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      try {
        const content = fs.readFileSync(resolved, 'utf-8');
        return NextResponse.json({ content });
      } catch {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
    }

    // Search across docs
    if (search) {
      if (search.length > 100) {
        return NextResponse.json({ error: 'Search query too long' }, { status: 400 });
      }
      const allFiles = walkDir(DOCS_ROOT);
      const query = search.toLowerCase();
      const matches = allFiles.filter(f => {
        try {
          const content = fs.readFileSync(f, 'utf-8');
          return content.toLowerCase().includes(query) || path.basename(f).toLowerCase().includes(query);
        } catch {
          return false;
        }
      });
      return NextResponse.json({
        docs: matches.map(f => ({
          name: path.basename(f),
          path: path.relative(DOCS_ROOT, f),
          category: inferCategory(f),
        })),
      });
    }

    // List all docs
    const allFiles = walkDir(DOCS_ROOT);
    const docs = allFiles.map(f => {
      let stat;
      try {
        stat = fs.statSync(f);
      } catch {
        return null;
      }
      return {
        name: path.basename(f),
        path: path.relative(DOCS_ROOT, f),
        category: inferCategory(f),
        lastModified: stat.mtime.toISOString(),
        size: stat.size,
      };
    }).filter(Boolean).sort((a: any, b: any) =>
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );

    return NextResponse.json({ docs });
  } catch (err) {
    console.error('[docs] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
