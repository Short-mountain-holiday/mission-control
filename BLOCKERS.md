# Mission Control — Blockers for Micah

*Last updated: 2026-03-12*

## 🔴 Blocker: Gateway Not Reachable from Vercel

**Status:** Memory screen and live Calendar data don't work because Vercel can't reach the OpenClaw gateway.

**Diagnostic result:**
```json
{
  "gatewayUrl": "https://openclaw.shortmountain.holiday...",
  "tokenSet": true,
  "testRead": "failed",
  "testError": "Gateway error: {\"type\":\"network\",\"message\":\"The operation was aborted due to timeout\"}"
}
```

**Root cause:** The nginx reverse proxy on the VPS (the one that proxies `openclaw.shortmountain.holiday` → `127.0.0.1:18789`) is likely only configured for WebSocket upgrades (for the Control UI), not for regular HTTP POST requests to `/tools/invoke`.

**What needs to happen:** Update the nginx config on the VPS host to properly proxy HTTP POST requests.

### Exact nginx config needed

Find the nginx server block for `openclaw.shortmountain.holiday` and ensure it includes:

```nginx
server {
    listen 443 ssl;
    server_name openclaw.shortmountain.holiday;

    # ... SSL certs ...

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket support (for Control UI)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts (important for /tools/invoke which can take a few seconds)
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
```

**Key things to check:**
1. `proxy_http_version 1.1;` — needed for both WebSocket AND regular HTTP
2. The `Connection` header handling — some configs set `Connection "upgrade"` unconditionally which breaks regular HTTP. A better pattern:
   ```nginx
   map $http_upgrade $connection_upgrade {
       default upgrade;
       '' close;
   }
   # Then in the location block:
   proxy_set_header Connection $connection_upgrade;
   ```
3. Timeouts — default nginx proxy timeout is 60s which should be fine, but if it's been set lower, `/tools/invoke` calls might time out

### How to verify after fixing

```bash
# From any external machine:
curl -s -X POST https://openclaw.shortmountain.holiday/tools/invoke \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tD43DOiArvE6cvSLqLMMm7F2iEedsLGq" \
  -d '{"tool":"memory_get","args":{"path":"MEMORY.md"}}'
```

Should return JSON with `{"ok":true,"result":{...}}`. If it returns HTML or times out, the proxy isn't configured correctly.

### After fixing, verify Mission Control:
- Visit: https://mission-control-lemon-beta-20.vercel.app/api/memory?debug=1
- Should show: `"testRead": "success"`

---

## 🟡 Info: Docs Screen Uses Bundled Files

The Docs screen reads from files committed to the repo (`data/docs/`), not live from the workspace. This is by design — the gateway can't serve arbitrary file reads (those tools are sandbox-only).

**To update docs after workspace changes:**
```bash
cd /data/.openclaw/workspace/mission-control
bash scripts/sync-docs.sh
git add data/docs/ && git commit -m "Sync workspace docs" && git push
```

This is a manual step. Could be automated later with a git hook or heartbeat task.

---

## ✅ What's Working

- Dashboard (live Notion data) ✅
- Command Center (Kanban + filters + task detail + activity feed + task creation) ✅
- Projects (derived from Notion categories) ✅
- Team (static org chart) ✅
- Calendar (fallback static data) ✅
- Docs (bundled workspace files) ✅
- Office (pixel art, static agent states) ✅
- Auth (password + brute-force protection + cookie) ✅
- Security headers ✅
