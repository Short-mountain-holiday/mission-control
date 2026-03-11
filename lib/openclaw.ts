// ============================================================
// OpenClaw Gateway Integration Library
// Proxies file reads and command execution through /tools/invoke
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
      signal: AbortSignal.timeout(options?.timeoutMs || 15000),
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

// ── File Operations ─────────────────────────────────────────

/** Read a file from the workspace. Path must pass sanitizePath. */
export async function readFile(path: string): Promise<string | null> {
  const safePath = sanitizePath(path);
  if (!safePath) return null;

  const result = await invokeOpenClawTool('read', { path: safePath });
  if (result.ok && result.result) {
    return typeof result.result === 'string' ? result.result : JSON.stringify(result.result);
  }
  return null;
}

/** Execute a shell command and return stdout. WARNING: Only call with pre-built commands using sanitized inputs. */
export async function exec(command: string, timeoutMs?: number): Promise<string | null> {
  const result = await invokeOpenClawTool('exec', { command }, { timeoutMs: timeoutMs || 15000 });
  if (result.ok && result.result) {
    return typeof result.result === 'string' ? result.result : JSON.stringify(result.result);
  }
  return null;
}

/** List files in a directory within the workspace. */
export async function listFiles(dir: string, pattern?: string): Promise<string[]> {
  if (!dir.startsWith(WORKSPACE_ROOT)) return [];
  const safeDir = dir.replace(/[^a-zA-Z0-9\-_./]/g, '');

  const cmd = pattern
    ? `ls -1 "${safeDir}" 2>/dev/null | grep '${sanitizeShellArg(pattern)}'`
    : `ls -1 "${safeDir}" 2>/dev/null`;

  const output = await exec(cmd);
  if (!output) return [];
  return output.trim().split('\n').filter(Boolean);
}

/** Check if gateway is reachable. */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await invokeOpenClawTool('read', { path: `${WORKSPACE_ROOT}/IDENTITY.md` }, { timeoutMs: 5000 });
    return result.ok === true;
  } catch {
    return false;
  }
}

export { WORKSPACE_ROOT };
