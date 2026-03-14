// ============================================================
// OpenClaw Gateway Integration Library
// Uses memory_get / memory_search (gateway-available tools)
// instead of read/exec (sandbox-only, not available via gateway)
// ============================================================

const OPENCLAW_URL = process.env.OPENCLAW_URL || '';
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || '';
const WORKSPACE_ROOT = '/data/.openclaw/workspace';

interface ToolInvokeResult {
  ok: boolean;
  result?: any;
  error?: { type: string; message: string };
}

// ── Input Sanitization ──────────────────────────────────────

/** Strip shell metacharacters. Only allows alphanumeric, space, dash, underscore, dot, slash, colon. */
export function sanitizeShellArg(input: string): string {
  if (input.length > 200) throw new Error('Input too long');
  return input.replace(/[^a-zA-Z0-9\s\-_./:]/g, '');
}

/** Validate and resolve a file path. Returns null if path is outside workspace or blocked. */
export function sanitizePath(input: string): string | null {
  // Block null bytes and path traversal
  if (input.includes('\0') || input.includes('..')) return null;

  // Resolve to absolute
  const resolved = input.startsWith(WORKSPACE_ROOT)
    ? input
    : `${WORKSPACE_ROOT}/${input.replace(/^\/+/, '')}`;

  // Verify still within workspace after resolution
  if (!resolved.startsWith(WORKSPACE_ROOT + '/') && resolved !== WORKSPACE_ROOT) return null;

  // Block sensitive files
  const blocked = ['.env', '.git/config', 'openclaw.json', 'node_modules'];
  if (blocked.some(b => resolved.includes(b))) return null;

  // Only allow known extensions
  const allowedExt = ['.md', '.sh', '.json', '.txt', '.yml', '.yaml'];
  const ext = resolved.substring(resolved.lastIndexOf('.'));
  if (!allowedExt.includes(ext) && !resolved.endsWith('/')) return null;

  return resolved;
}

// ── Core API ────────────────────────────────────────────────

export function isConfigured(): boolean {
  return !!(OPENCLAW_URL && OPENCLAW_TOKEN);
}

export async function invokeOpenClawTool(
  tool: string,
  args: Record<string, any>,
  options?: { timeoutMs?: number }
): Promise<ToolInvokeResult> {
  if (!isConfigured()) {
    return { ok: false, error: { type: 'config', message: 'Gateway not configured' } };
  }

  try {
    const res = await fetch(`${OPENCLAW_URL}/tools/invoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
      },
      body: JSON.stringify({ tool, args }),
      signal: AbortSignal.timeout(options?.timeoutMs || 8000),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[openclaw] Gateway error ${res.status}: ${text}`);
      return { ok: false, error: { type: 'gateway', message: `HTTP ${res.status}` } };
    }

    return await res.json();
  } catch (err: any) {
    console.error(`[openclaw] Request error:`, err?.message || err);
    return { ok: false, error: { type: 'network', message: err?.message || 'Request failed' } };
  }
}

// ── File Operations (using memory_get) ──────────────────────

/** Read a file from the workspace via gateway memory_get tool. */
export async function readFile(filePath: string): Promise<string | null> {
  const safePath = sanitizePath(filePath);
  if (!safePath) return null;

  const result = await invokeOpenClawTool('memory_get', { path: safePath });
  if (result.ok && result.result) {
    const data = result.result;
    if (typeof data === 'string') return data;

    // Gateway wraps response as { content: [{type:"text", text:"..."}], details: {text, path} }
    // The actual file content is in details.text
    if (data.details?.text) return data.details.text;

    // Or try unwrapping content[0].text which may be JSON-encoded
    if (data.content?.[0]?.text) {
      try {
        const inner = JSON.parse(data.content[0].text);
        if (inner.text) return inner.text;
        return data.content[0].text;
      } catch {
        return data.content[0].text;
      }
    }

    if (data.text) return data.text;
    return null;
  }
  return null;
}

/** Search memory files via gateway memory_search tool. */
export async function searchMemory(query: string, maxResults?: number): Promise<any> {
  const result = await invokeOpenClawTool('memory_search', {
    query,
    maxResults: maxResults || 10,
  });
  if (result.ok && result.result) {
    const data = result.result;
    // Gateway wraps as { content, details } — results are in details
    if (data.details?.results) return data.details;
    if (data.results) return data;
    return data;
  }
  return null;
}

/** Check if gateway is reachable using memory_search (a known gateway tool). */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await invokeOpenClawTool(
      'memory_search',
      { query: 'health check', maxResults: 1 },
      { timeoutMs: 5000 }
    );
    return result.ok === true;
  } catch {
    return false;
  }
}

export { WORKSPACE_ROOT };
