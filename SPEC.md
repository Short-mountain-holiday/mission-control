# Mission Control — Product Spec v2

> SMH Mission Control: Custom operations dashboard for OpenClaw agent system.
> Repo: `Short-mountain-holiday/mission-control`
> Live: `https://mission-control-lemon-beta-20.vercel.app`
> Spec created: 2026-03-12 | Last updated: 2026-03-12

---

## Table of Contents

1. [Tech Stack & Architecture](#tech-stack--architecture)
2. [Environment Variables](#environment-variables)
3. [Phase 1 — Complete](#phase-1--complete-)
4. [Phase 2 — Up Next](#phase-2--up-next)
   - [2A: Infrastructure](#2a-infrastructure)
   - [2B: Screen Upgrades](#2b-screen-upgrades)
   - [2C: New Screens](#2c-new-screens)
   - [2D: Chat Widget](#2d-chat-widget)
5. [Phase 3 — Future](#phase-3--future)
6. [Build Order](#build-order)

---

## Tech Stack & Architecture

| Layer | Tech | Notes |
|-------|------|-------|
| Framework | Next.js 16 (App Router) | React Server Components + client components where needed |
| Styling | Tailwind v4 | CSS variable-based dark theme via `globals.css` |
| Icons | Lucide React | Consistent icon set across all screens |
| Markdown | react-markdown | For Memory/Docs content rendering |
| Notion API | Direct REST fetch | Not SDK — Notion SDK v5 broke `databases.query`. All calls go through `lib/notion.ts` |
| OpenClaw API | `/tools/invoke` endpoint | For file reads, cron data, command execution. Auth via bearer token |
| OpenClaw Chat | `/v1/chat/completions` endpoint | OpenAI-compatible streaming chat. Must be enabled in gateway config |
| Hosting | Vercel (free tier) | ISR (Incremental Static Regeneration) for data freshness |
| Data refresh | `revalidate = 60` on server pages | 60-second ISR. Client components use `fetch` on mount |

### File Structure (Current)

```
mission-control/
├── app/
│   ├── layout.tsx              # Root layout: sidebar + main content area
│   ├── globals.css             # CSS variables, dark theme, markdown styles
│   ├── page.tsx                # Dashboard (server component, ISR)
│   ├── command-center/
│   │   ├── page.tsx            # Command Center wrapper (server: fetches tasks)
│   │   ├── kanban-board.tsx    # Kanban board (client: drag, filter, click)
│   │   └── task-detail.tsx     # Task detail panel (client: slide-out)
│   ├── calendar/
│   │   └── page.tsx            # Calendar (client: week view + job list)
│   ├── team/
│   │   └── page.tsx            # Team org chart (server: static)
│   ├── memory/
│   │   ├── page.tsx            # Memory wrapper
│   │   └── memory-browser.tsx  # Memory browser (client: date nav, search)
│   ├── docs/
│   │   ├── page.tsx            # Docs wrapper
│   │   └── docs-browser.tsx    # Docs browser (client: list + content view)
│   └── api/
│       ├── memory/route.ts     # Memory API (proxies to gateway or filesystem)
│       ├── docs/route.ts       # Docs API (filesystem scan + read)
│       └── notion/tasks/
│           ├── route.ts        # Tasks list + create
│           └── [id]/route.ts   # Task read + update
├── components/
│   ├── sidebar.tsx             # Left nav (persistent across all pages)
│   ├── stat-card.tsx           # Dashboard stat card component
│   └── task-card.tsx           # Task card (used in dashboard + kanban)
├── lib/
│   ├── notion.ts               # Notion REST API wrapper (getTasks, createTask, updateTask, getDashboardStats)
│   ├── agents.ts               # Static agent definitions + mission statement
│   ├── types.ts                # TypeScript interfaces (Task, CronJob, Agent, etc.)
│   └── utils.ts                # cn() helper, color utils
├── SPEC.md                     # This file
├── package.json
├── next.config.ts
└── tsconfig.json
```

### Design Language

- **Inspiration:** Linear app — clean, minimal, dark-first
- **Theme:** Dark mode only (CSS variables in `globals.css`)
- **Typography:** System font stack, tight tracking, small text (xs/sm primary)
- **Colors:** Emerald accent (`--accent`), zinc-based neutrals, status colors (emerald/amber/red/blue)
- **Cards:** `bg-[var(--bg-secondary)]` with `border-[var(--border-primary)]`, rounded-xl
- **Hover states:** `hover:bg-[var(--bg-hover)]` transitions
- **Agent avatars:** Single letter in colored circle (D=emerald, S=purple, R=amber, W=rose, M=blue)
- **Status badges:** Colored pill with text: active=emerald, parked=zinc, idle=amber

---

## Environment Variables

| Variable | Purpose | Status | Where Set |
|----------|---------|--------|-----------|
| `NOTION_API_KEY` | Notion database CRUD | ✅ Set | Vercel env |
| `SITE_PASSWORD` | Password gate for dashboard access | ⬜ Phase 2A | Vercel env |
| `OPENCLAW_URL` | Gateway base URL (`https://openclaw.shortmountain.holiday`) | ⬜ Phase 2A | Vercel env |
| `OPENCLAW_TOKEN` | Gateway bearer auth token | ⬜ Phase 2A | Vercel env |

---

## Phase 1 — Complete ✅

Built 2026-03-12. Six screens deployed on Vercel.

### 1. Dashboard (`app/page.tsx`)

**Type:** Server component with ISR (60s revalidation)

**Data source:** Notion API via `lib/notion.ts`

**What it shows:**
- **Stats grid** (4 cards): In Progress count, Overdue count, Completed This Week, Inbox (Needs Triage)
- **Recent Activity** (left 2/3): Last 8 edited non-Done tasks, sorted by `lastEditedTime` desc. Each shows title, status badge, owner avatar, priority, timestamps
- **Team Status** (right 1/3): All 5 agents with avatar, role, and status badge (active/parked/idle)
- **Status Breakdown** (right 1/3): Horizontal bar chart showing task count per status column

**Components used:** `StatCard`, `TaskCard`

### 2. Command Center (`app/command-center/`)

**Type:** Server component (data fetch) + client components (interactivity)

**Data source:** Notion API — full task list with pagination

**What it shows:**
- **Kanban board** with columns: Inbox → To Do → In Progress → Review → Commit → Done → Parked
- **Filter bar**: Owner dropdown, toggle to show/hide Done+Parked columns
- **Task cards**: Title, owner avatar, priority badge, due date, category tag
- **Detail panel**: Click any card → slide-out right panel with full task data (title, status, owner, priority, category, phase, property, source, due date, notes, timestamps)

**Current capabilities:**
- ✅ View all tasks in Kanban layout
- ✅ Filter by owner
- ✅ Toggle Done/Parked visibility
- ✅ Click-to-view task details
- ✅ Notion pagination (handles >100 tasks)

**Not yet built:**
- ❌ Activity feed sidebar
- ❌ Task creation from UI
- ❌ Inline status change (drag-and-drop or dropdown)
- ❌ Inline editing

### 3. Calendar (`app/calendar/page.tsx`)

**Type:** Client component (currently uses hardcoded data)

**Data source:** Hardcoded `cronJobs` array in the component file

**What it shows:**
- **Week view**: 7-column grid (Sun-Sat), shows which cron jobs fire on which days
- **Today highlight**: Blue accent background + "Today" badge
- **Job list**: All cron jobs with icon (✅ success / ❌ error / ⏸ disabled), name, description, schedule in human-readable format, last run status + duration

**Hardcoded jobs:** Morning Briefing (daily, enabled), Weekly L10 (Mon, disabled), 1:1 Sloane (Tue, disabled), 1:1 Reid (Wed, disabled), 1:1 Willow (Thu, disabled)

### 4. Team (`app/team/page.tsx`)

**Type:** Server component (static data from `lib/agents.ts`)

**Data source:** `lib/agents.ts` — hardcoded agent definitions

**What it shows:**
- **Mission statement**: Styled banner at top with crown icon
- **Org chart**: Vertical flow — Micah (Visionary) → Dru (Integrator/COO) → Domain agents (Sloane, Reid, Willow) in 3-column grid
- **Agent cards**: Avatar, name, role/title, status badge, current focus, ownership tags
- **EOS legend**: Explanation of each role in the accountability chart

### 5. Memory (`app/memory/`)

**Type:** Client component (fetches from `/api/memory`)

**Data source:** `/api/memory` route → tries OpenClaw gateway → falls back to filesystem

**What it shows:**
- **Tab bar**: Daily Logs | Long-Term Memory
- **Date navigator** (daily tab): Left/right arrows, date picker, last 7 available dates as chips
- **Search bar**: Filters displayed content by text match
- **Content area**: Markdown-rendered memory file content

**Current state on Vercel:** ⚠️ Empty. The `/api/memory` route tries a non-existent gateway endpoint (`/api/v1/files/read`) then falls back to filesystem which doesn't exist on Vercel. Filesystem fallback works on VPS localhost.

### 6. Docs (`app/docs/`)

**Type:** Client component (fetches from `/api/docs`)

**Data source:** `/api/docs` route → filesystem scan of workspace

**What it shows:**
- **Left panel** (fixed width 320px): Document list with search bar, category filter chips, file entries showing name/category/date
- **Right panel** (flex): Selected document rendered as markdown with header showing name, path, category
- **Categories**: Auto-inferred from directory (Workspace, Context, Sloane, Reid, Willow, Scripts, Skills)
- **Searchable**: Filter doc list by filename

**Current state on Vercel:** ⚠️ Empty. Route uses `fs.readdir`/`fs.readFile` which only works on VPS.

---

## Phase 2 — Up Next

### 2A: Infrastructure

These must be built first — they unblock everything else.

---

#### Password Protection

**Priority:** 🔴 Critical (build first)

**Problem:** Dashboard is publicly accessible at the Vercel URL. Anyone with the link can see SMH operational data.

**Solution:** Next.js middleware + cookie-based password gate.

**Implementation:**

1. **`middleware.ts`** (root of project):
   - Intercept all requests except `/login`, `/api/auth`, `/_next`, `/favicon.ico`
   - Check for cookie `mc-auth` with value matching `SITE_PASSWORD` hash
   - If no valid cookie → redirect to `/login`
   - Use `crypto.subtle.digest('SHA-256', ...)` for hash comparison (no plaintext in cookie)

2. **`app/login/page.tsx`**:
   - Clean login page matching the dark theme
   - Single password input field + "Enter" button
   - Mountain/SMH branding at top
   - On submit → `POST /api/auth` with password
   - Error state: "Incorrect password" shake animation

3. **`app/api/auth/route.ts`**:
   - `POST`: Compare submitted password against `process.env.SITE_PASSWORD`
   - If match → set `mc-auth` cookie (HttpOnly, Secure, SameSite=Strict, maxAge=30 days) with SHA-256 hash
   - If mismatch → 401
   - `DELETE`: Clear cookie (logout)

4. **Vercel env var:**
   - `SITE_PASSWORD` = whatever Micah sets

**UX:**
- First visit → redirected to `/login`
- Enter password → cookie set → redirected to Dashboard
- Cookie lasts 30 days
- No user accounts, no signup — single shared password
- Logout link in sidebar footer (calls `DELETE /api/auth`)

---

#### OpenClaw Gateway Integration Library

**Priority:** 🔴 Critical (powers Memory, Docs, Calendar, Chat)

**Problem:** Memory, Docs, and Calendar screens need data from the VPS workspace. The Vercel deployment can't access the filesystem. Current `/api/memory` route tries a wrong endpoint.

**Solution:** Create `lib/openclaw.ts` — a reusable client for the OpenClaw gateway's `/tools/invoke` API.

**Implementation:**

1. **`lib/openclaw.ts`**:

```typescript
const OPENCLAW_URL = process.env.OPENCLAW_URL || '';
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || '';

interface ToolInvokeResult {
  ok: boolean;
  result?: any;
  error?: { type: string; message: string };
}

// Core invoke function
export async function invokeOpenClawTool(
  tool: string,
  args: Record<string, any>,
  options?: { timeoutMs?: number }
): Promise<ToolInvokeResult> {
  const res = await fetch(`${OPENCLAW_URL}/tools/invoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
    },
    body: JSON.stringify({ tool, args }),
    signal: AbortSignal.timeout(options?.timeoutMs || 15000),
  });
  return res.json();
}

// Read a file from the workspace
export async function readFile(path: string): Promise<string | null> {
  const result = await invokeOpenClawTool('read', { path });
  if (result.ok && result.result) {
    // result.result is the file content (tool output)
    return typeof result.result === 'string' ? result.result : JSON.stringify(result.result);
  }
  return null;
}

// Execute a shell command and return stdout
export async function exec(command: string): Promise<string | null> {
  const result = await invokeOpenClawTool('exec', { command });
  if (result.ok && result.result) {
    return typeof result.result === 'string' ? result.result : JSON.stringify(result.result);
  }
  return null;
}

// List files in a directory
export async function listFiles(dir: string, pattern?: string): Promise<string[]> {
  const cmd = pattern
    ? `ls -1 ${dir} | grep '${pattern}'`
    : `ls -1 ${dir}`;
  const output = await exec(cmd);
  if (!output) return [];
  return output.trim().split('\n').filter(Boolean);
}

// Check if gateway is reachable
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await invokeOpenClawTool('read', { path: '/data/.openclaw/workspace/IDENTITY.md' });
    return result.ok === true;
  } catch {
    return false;
  }
}
```

2. **Error handling pattern for all API routes:**
   - Try gateway first
   - If `OPENCLAW_URL` not set → return `{ error: 'Gateway not configured', hint: 'Set OPENCLAW_URL and OPENCLAW_TOKEN in Vercel' }`
   - If gateway returns error → return `{ error: 'Gateway unavailable', details: error.message }`
   - UI shows friendly error states (not raw errors)

---

### 2B: Screen Upgrades

---

#### Memory Screen — Live Data via Gateway

**Priority:** 🔴 Critical

**Problem:** Memory screen shows empty on Vercel because it can't read VPS filesystem.

**Changes to `/api/memory/route.ts`:**

1. **List available dates:**
   - Use `listFiles('/data/.openclaw/workspace/memory', '\\d{4}-\\d{2}-\\d{2}\\.md')` from `lib/openclaw.ts`
   - Parse filenames to extract dates
   - Return sorted date array

2. **Read daily log:**
   - Use `readFile(`/data/.openclaw/workspace/memory/${date}.md`)` from `lib/openclaw.ts`
   - Return content as-is (markdown)

3. **Read long-term memory:**
   - Use `readFile('/data/.openclaw/workspace/MEMORY.md')` from `lib/openclaw.ts`

4. **Search across all files:**
   - New query param: `?search=<query>`
   - Use `exec(`grep -ril '${query}' /data/.openclaw/workspace/memory/`)` to find matching files
   - Return list of matching dates + snippets (first 200 chars of each match context)

**No changes needed to `memory-browser.tsx`** — it already calls `/api/memory` correctly.

---

#### Docs Screen — Live Data via Gateway

**Priority:** 🔴 Critical

**Problem:** Docs screen shows empty on Vercel because it uses `fs.readdir`.

**Changes to `/api/docs/route.ts`:**

1. **List all docs:**
   - Use `exec()` via gateway to run a find command:
     ```
     find /data/.openclaw/workspace -maxdepth 3 -name '*.md' -o -name '*.sh' -o -name '*.json' | 
     grep -v node_modules | grep -v .next | grep -v mission-control | grep -v .git | grep -v MEMORY.md
     ```
   - For each file, get stats via `exec(`stat -c '%Y %s' <path>`)` (or batch with a single script)
   - Infer category from path:
     - `/workspace/*.md` → "Workspace"
     - `/workspace/context/*` → "Context"  
     - `/workspace/agents/sloane/*` → "Sloane"
     - `/workspace/agents/reid/*` → "Reid"
     - `/workspace/agents/willow/*` → "Willow"
     - `/workspace/scripts/*` → "Scripts"
     - `/workspace/skills/*` → "Skills"
   - Return array of `{ name, path, category, lastModified, size }`

2. **Read specific doc:**
   - Use `readFile(path)` from `lib/openclaw.ts`
   - Security: validate path starts with `/data/.openclaw/workspace/`
   - Return `{ content }` (markdown)

3. **Search across docs:**
   - New query param: `?search=<query>`
   - Use `exec(`grep -ril '${query}' /data/.openclaw/workspace/ --include='*.md'`)` 
   - Return matching file list

**Optimization:** Batch the file listing + stats into a single `exec()` call using a small inline script to minimize round trips to the gateway.

**No changes needed to `docs-browser.tsx`** — it already calls `/api/docs` correctly.

---

#### Calendar — Live Cron Data

**Priority:** 🟡 High

**Problem:** Calendar shows hardcoded cron job data that may not reflect reality.

**Changes to `app/calendar/page.tsx`:**

1. **New API route: `/api/cron/route.ts`:**
   - Use `exec('openclaw cron list --json')` via gateway
   - Parse JSON output to get: job id, name, schedule, enabled, lastRun, etc.
   - Also call `exec('openclaw cron runs --id <id> --limit 5 --json')` for each enabled job to get run history
   - Return structured cron data

2. **Convert Calendar to client component** (or hybrid):
   - Fetch from `/api/cron` on mount
   - Replace hardcoded `cronJobs` array with live data
   - Add loading/error states
   - Show real last-run data: timestamp, status, duration, error message

3. **Add run history panel:**
   - Click a job → show last 5 runs with status, duration, timestamps
   - Color-coded: green=success, red=error, yellow=timeout

4. **Fallback:** If gateway unavailable, show current hardcoded data with a "⚠️ Showing cached data" banner.

---

#### Command Center — Activity Feed

**Priority:** 🟡 High

**Problem:** No visibility into recent board changes. You have to compare current state to memory to know what changed.

**Implementation:**

1. **Activity feed sidebar** (right side of kanban, ~300px wide):
   - Shows recent task changes sorted by `lastEditedTime`
   - Each entry: "[Owner avatar] [action] [task name] — [relative time]"
   - Actions inferred from data: "moved to In Progress", "completed", "created", "updated notes"
   - Limited to last 20 changes
   - Auto-updates with ISR (60s)

2. **Data source:** 
   - Notion API already returns `lastEditedTime` per task
   - Compare current snapshot to detect changes (or simply list most recently edited tasks)
   - For richer activity, use Notion's `last_edited_by` field if available

3. **UI:**
   - Collapsible sidebar (toggle button)
   - Compact list items with avatars and timestamps
   - Relative time formatting ("2 min ago", "1h ago", "yesterday")

---

#### Command Center — Task Creation

**Priority:** 🟢 Medium

**Problem:** Currently must use Notion directly or talk to Dru to create tasks.

**Implementation:**

1. **"+ New Task" button** in kanban header bar

2. **Modal form:**
   - Task name (required, text input)
   - Status (dropdown, default: "Inbox")
   - Owner (dropdown: Micah, Dru, Sloane, Reid, Willow, or blank)
   - Priority (dropdown: P1, P2, P3, P4, or blank)
   - Category (dropdown with existing categories + "Other" freetext)
   - Due Date (date picker, optional)
   - Notes (textarea, optional, supports markdown)

3. **Submit → `POST /api/notion/tasks`:**
   - Route already exists and calls `createTask()` in `lib/notion.ts`
   - `createTask()` already implemented with all fields
   - On success → close modal, refresh kanban

4. **Validation:**
   - Task name required, min 3 chars
   - Show loading spinner on submit
   - Error handling: show toast notification on failure

---

### 2C: New Screens

---

#### Projects Screen

**Priority:** 🟡 High

**Problem:** No high-level view of major initiatives. Tasks exist but they're flat — no grouping into projects with progress tracking.

**Route:** `app/projects/page.tsx`

**Data model:** Projects are derived from Notion Command Center data. A "project" is a group of related tasks, identified by their `Category` or `Phase` field.

**Implementation:**

1. **Project definition** (`lib/projects.ts`):
   ```typescript
   interface Project {
     id: string;
     name: string;
     description: string;
     status: 'active' | 'paused' | 'complete';
     progress: number; // 0-100, calculated from task completion
     totalTasks: number;
     completedTasks: number;
     inProgressTasks: number;
     blockedTasks: number;
     owner: string;
     linkedTasks: Task[];
     createdDate: string;
     targetDate?: string;
   }
   ```

2. **Project derivation logic:**
   - Group tasks by `Category` field from Notion
   - Calculate progress: `(Done tasks / Total tasks) * 100`
   - Active = has In Progress or To Do tasks
   - Paused = all tasks Parked
   - Complete = all tasks Done

3. **UI — Project list view:**
   - Grid of project cards (2 columns on desktop)
   - Each card shows: name, description, progress bar, task counts, owner, status badge
   - Sort by: most recently active, least progress, alphabetical

4. **UI — Project detail** (click to expand or navigate):
   - Full task list for that project (mini kanban or list view)
   - Progress breakdown: Done / In Progress / To Do / Blocked
   - Timeline if target date set
   - Quick actions: add task to project, change project status

5. **Sidebar nav:** Add "Projects" between "Command Center" and "Calendar" with `FolderKanban` icon.

6. **Future:** Allow manual project creation via a Notion database or config file. For Phase 2, derive from existing Category data.

---

#### Office Screen (Agent Visualization)

**Priority:** 🟢 Medium (high fun factor, increases engagement)

**Problem:** No visual way to see what agents are doing at a glance. The Team screen is static — it shows roles, not live activity.

**Route:** `app/office/page.tsx`

**Concept:** A 2D pixel-art office with agent characters at desks. Agents animate between idle and working states based on real activity data.

**Implementation:**

1. **Visual layout:**
   - Top-down or isometric office floor plan
   - CSS/SVG based (no canvas/WebGL — keep it simple and maintainable)
   - 5 desks arranged in an office: Micah (corner office), Dru (center), Sloane/Reid/Willow (row)
   - Water cooler area, conference room (decorative)
   - Pixel art aesthetic using CSS pixel borders or small sprite images

2. **Agent sprites:**
   - Simple animated characters (CSS animation or small sprite sheets)
   - States: `idle` (at desk, leaning back), `working` (at desk, typing animation), `offline` (empty desk, chair pushed in)
   - Each agent has their color (matching team colors)

3. **Activity data source:**
   - Fetch from gateway: `exec('openclaw sessions list --json')` or similar
   - Determine which agents have active sessions
   - Dru = always working if gateway is up
   - Sub-agents (Sloane/Reid/Willow) = working only if a sub-agent session is active
   - Micah = "in office" during business hours (8am-6pm CDT), else "away"

4. **Interaction:**
   - Hover over agent → tooltip showing current task/focus
   - Click agent → navigate to their detail on Team page
   - Speech bubbles occasionally appear with status updates (pulls from recent activity)

5. **Auto-refresh:** Poll every 30 seconds for activity updates

6. **Sidebar nav:** Add "Office" at the bottom of nav list with `Building2` icon

**Note:** This is the fun one from the video. Doesn't need to be perfect — charm matters more than precision. Start simple, iterate.

---

### 2D: Chat Widget

**Priority:** 🟡 High

**Problem:** To talk to Dru, Micah has to switch to Telegram or the OpenClaw webchat. Mission Control should have its own persistent chat interface.

**Concept:** Floating chat widget in the bottom-right corner, persistent across all pages and tabs. Functions like a customer support chat widget (Intercom/Drift/Crisp style) but connected directly to the OpenClaw agent.

#### Architecture

**Backend:** OpenClaw gateway's `/v1/chat/completions` endpoint (OpenAI-compatible)
- Must be enabled in gateway config: `gateway.http.endpoints.chatCompletions.enabled: true`
- Uses streaming SSE (`stream: true`) for real-time responses
- Uses `user` field with a stable session identifier to maintain conversation continuity across requests
- Bearer auth with `OPENCLAW_TOKEN`

**Frontend:** Client component rendered in `layout.tsx` so it persists across all page navigations.

#### Implementation

1. **`components/chat-widget.tsx`** (client component):

   **State management:**
   - `messages: Message[]` — conversation history
   - `isOpen: boolean` — expanded/collapsed
   - `isStreaming: boolean` — currently receiving a response
   - `inputValue: string` — current input text
   - Persist `messages` to `localStorage` under key `mc-chat-history`
   - Generate stable `sessionId` on first load, store in `localStorage` under key `mc-chat-session`

   **Message type:**
   ```typescript
   interface ChatMessage {
     id: string;
     role: 'user' | 'assistant';
     content: string;
     timestamp: number;
   }
   ```

   **UI — Collapsed state (default):**
   - Floating button, bottom-right corner, 56x56px
   - Emerald circle with chat bubble icon (MessageCircle from Lucide)
   - Subtle pulse animation if there's a new unread response
   - `position: fixed; bottom: 24px; right: 24px; z-index: 9999;`

   **UI — Expanded state:**
   - Panel: 400px wide × 600px tall (or 90vh on mobile)
   - `position: fixed; bottom: 24px; right: 24px; z-index: 9999;`
   - Rounded-2xl with shadow-2xl, matches dark theme
   - **Header bar:** "Chat with Dru" + Dru's avatar + minimize button (X or chevron-down)
   - **Message area:** Scrollable, auto-scrolls to bottom on new messages
     - User messages: right-aligned, emerald background, white text
     - Assistant messages: left-aligned, `bg-[var(--bg-surface)]` background
     - Timestamps: subtle, relative ("just now", "2m ago")
     - Markdown rendering in assistant messages (react-markdown)
     - Streaming indicator: animated dots ("Dru is typing...")
   - **Input area:** 
     - Text input with send button (arrow icon)
     - Send on Enter, Shift+Enter for newline
     - Disabled while streaming
     - Placeholder: "Message Dru..."
   - **Footer:** Tiny "Powered by OpenClaw" text (optional)

   **Animation:**
   - Open/close: slide-up/slide-down with opacity transition (200ms ease-out)
   - Message appear: subtle fade-in

2. **`app/api/chat/route.ts`** (streaming API route):

   ```typescript
   // POST /api/chat
   // Body: { messages: ChatMessage[], sessionId: string }
   // Returns: SSE stream (text/event-stream)
   
   export async function POST(req: Request) {
     const { messages, sessionId } = await req.json();
     
     // Forward to OpenClaw gateway chat completions
     const response = await fetch(`${OPENCLAW_URL}/v1/chat/completions`, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
         'x-openclaw-agent-id': 'main',
       },
       body: JSON.stringify({
         model: 'openclaw',
         stream: true,
         user: `mission-control-${sessionId}`,
         messages: messages.map(m => ({
           role: m.role,
           content: m.content,
         })),
       }),
     });
     
     // Pipe the SSE stream back to the client
     return new Response(response.body, {
       headers: {
         'Content-Type': 'text/event-stream',
         'Cache-Control': 'no-cache',
         'Connection': 'keep-alive',
       },
     });
   }
   ```

3. **Integration in `app/layout.tsx`:**
   ```tsx
   import ChatWidget from '@/components/chat-widget';
   
   export default function RootLayout({ children }) {
     return (
       <html lang="en" className="dark">
         <body>
           <Sidebar />
           <main className="ml-60 min-h-screen">{children}</main>
           <ChatWidget />  {/* Persistent across all pages */}
         </body>
       </html>
     );
   }
   ```

#### Best Practices (researched)

- **Persistence:** localStorage for message history + session ID. Messages survive page reloads and tab switches
- **Session continuity:** The `user` field in the OpenAI-compatible API creates a stable session in the gateway. Same session ID = same conversation thread
- **Token limit management:** Only send last 20 messages to the API to avoid context overflow. Keep full history in localStorage for display
- **Error recovery:** If stream fails mid-response, show partial content + "Connection lost. Click to retry" button
- **Accessibility:** Focus trap when open, Escape to close, aria-labels on all interactive elements
- **Performance:** Lazy-load the chat component (dynamic import with `ssr: false`). Don't load it until first click if possible
- **Mobile:** Full-width on screens <640px, bottom sheet style
- **Rate limiting:** Disable input for 1 second after sending to prevent spam
- **Clear chat:** Option in header dropdown to clear conversation history (clears localStorage)

#### Gateway Config Required

The following must be added to the OpenClaw gateway config to enable the chat endpoint:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

**Security note:** This endpoint is operator-access level. Since Mission Control is already password-protected (Phase 2A) and the gateway URL + token are server-side env vars (never exposed to the client), this is safe. The `/api/chat` route acts as a proxy — the client never sees the gateway token.

---

## Phase 3 — Future

Not scoped in detail. Ideas for future phases:

| Feature | Description | Complexity |
|---------|-------------|------------|
| **Notifications panel** | Surface Telegram messages, alerts, cron failures in Mission Control | Medium |
| **Cost tracker** | API spend per agent per day from OpenClaw session data | Medium |
| **Hostaway dashboard** | Reservation calendar, upcoming check-ins/outs, occupancy | High |
| **Analytics dashboard** | Reid's domain: occupancy rates, revenue, pricing data from Hostaway | High |
| **Mobile responsive** | Currently desktop-only. Needs mobile breakpoints + hamburger nav | Medium |
| **Custom domain** | `mission.shortmountain.holiday` or `control.shortmountain.holiday` | Low |
| **WebSocket/SSE push** | Real-time updates instead of 60s ISR polling | High |
| **Auth upgrade** | If needed: NextAuth, per-user accounts, role-based access | Medium |
| **Self-host option** | Run Next.js on VPS for zero-latency file access (eliminates gateway proxy) | Low |
| **Drag-and-drop kanban** | Move tasks between columns by dragging | Medium |
| **Dark/light theme toggle** | Currently dark only | Low |

---

## Build Order (Phase 2)

Sequenced by dependencies. Items within a step can be built in parallel.

| Step | Feature | Depends On | Est. Effort |
|------|---------|------------|-------------|
| 1 | Password protection (middleware + login) | Nothing | Small |
| 2 | `lib/openclaw.ts` gateway integration library | `OPENCLAW_URL` + `OPENCLAW_TOKEN` env vars | Small |
| 3 | Memory screen live data | Step 2 | Small |
| 4 | Docs screen live data | Step 2 | Small |
| 5 | Calendar live cron data | Step 2 | Medium |
| 6 | Chat widget | Step 2 + gateway chatCompletions enabled | Medium-Large |
| 7 | Command Center activity feed | Nothing (uses existing Notion data) | Medium |
| 8 | Command Center task creation | Nothing (API route already exists) | Small |
| 9 | Projects screen | Nothing (uses existing Notion data) | Medium |
| 10 | Office screen | Step 2 (needs session activity data) | Large (art + logic) |

**Session plan:** 
- Steps 1-5 = one build session (~2 hours)
- Step 6 = one build session (~1-2 hours)
- Steps 7-10 = one build session (~2-3 hours)

---

*Spec v2 — 2026-03-12*
