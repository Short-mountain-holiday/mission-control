# SMH Operating Cadence — Ceremonies

> Every agent loads this file. It defines the operational rhythms that keep the team aligned,
> accountable, and moving. These are not optional meetings — they are the operating system.

---

## The EOS Framework

SMH runs on EOS Lite (Entrepreneurial Operating System). The core components:
- **V/TO** — Vision/Traction Organizer. The alignment anchor. See `context/vto.md`.
- **Rocks** — Quarterly goals. Binary: on track or off track. See `context/rocks.md`.
- **Scorecard** — Weekly metrics. See `context/scorecard.md`.
- **Ceremonies** — The cadence that holds it all together (this file).

**Micah = Visionary.** Big-picture, strategy, creative direction, relationships.
**Dru = Integrator.** Runs the operating system day-to-day. Holds agents accountable. Facilitates meetings. Translates vision into execution.

> **System Note:** As of 2026-03-11, all ceremonies run on OpenClaw (not GitHub Actions/fly.dev).
> Cron jobs deliver to Micah's Telegram via @Dru_at_SMH_bot.
> Domain agents (Sloane, Reid, Willow) are spawned as sub-agents for ceremony participation.

---

## Ceremony Calendar

| Cadence | Ceremony | Owner | Day/Time | Status |
|---------|----------|-------|----------|--------|
| **Daily** | Morning Briefing | Dru → Micah | 8am CDT (automated) | LIVE |
| **Daily** | Async Standup | Each agent → Dru | 6am CDT (automated) | DEFERRED — activating after L10 rhythm is established |
| **Weekly** | L10 Meeting | Dru → Micah | Monday 9am CDT (automated) | ACTIVE |
| **Weekly** | 1:1 — Sloane | Dru ↔ Sloane | Tuesday 9am CDT | ACTIVE |
| **Weekly** | 1:1 — Reid | Dru ↔ Reid | Wednesday 9am CDT | ACTIVE |
| **Weekly** | 1:1 — Willow | Dru ↔ Willow | Thursday 9am CDT | ACTIVE |
| **Monthly** | Financial Close | Reid → Micah | 1st of month (manual) | FUTURE |
| **Quarterly** | Planning Session | Dru initiates, Micah decides | 3 weeks before quarter end | ACTIVE |
| **Quarterly** | Rock Review + Setting | Dru + all agents | Part of quarterly planning | ACTIVE |
| **Quarterly** | V/TO Review | Micah + Dru | Part of quarterly planning | ACTIVE |
| **On hire** | 30/60/90 Plan | New agent + direct report | First session | ACTIVE |

---

## Ceremony Details

### Daily: Morning Briefing (LIVE)

**Owner:** Dru
**Trigger:** OpenClaw cron, 8am CDT daily
**Participants:** Dru → Micah (Telegram)
**Duration:** ~2 min read

**Purpose:** Give Micah the full picture in one message. What's moving, what's stuck, what needs him.

**Format:**
1. Micah's open items — specific cards, days waiting, what's blocked
2. Rock status snapshot — any Rocks off track get called out
3. Scorecard highlights — any metrics off target
4. Team status — 1-2 lines per active agent
5. Deadlines this week
6. Pulse — one sentence: is the team moving or stuck?

**Output:** Single Telegram message, 15-20 lines max.

---

### Daily: Async Standup (DEFERRED)

**Status:** Activating after L10 rhythm is established and working smoothly.

**Owner:** Each agent → Dru
**Trigger:** OpenClaw cron, 6am CDT daily
**Participants:** All agents report to Dru

**Purpose:** Feed the morning briefing with structured per-agent updates.

**Format per agent:**
1. What I worked on yesterday (or since last standup)
2. Rock status — on/off track
3. Blockers
4. What I'm working on today

**V1:** Dru generates standup on behalf of all agents (pulls board + data himself).
**V2:** Each agent has own cron trigger, self-reports (requires all Telegram bots).

---

### Weekly: L10 Meeting (ACTIVE)

**Owner:** Dru (facilitator)
**Trigger:** OpenClaw cron, Monday 9am CDT
**Participants:** Dru → Micah (Telegram). Async — not a synchronous meeting.
**Duration:** ~3 min read, then IDS if needed

**Purpose:** Weekly operating rhythm. Review metrics, check Rocks, surface issues.

**Format:**
1. **Scorecard review** — each metric with on/off track status
2. **Rock status** — company Rocks + each agent's Rocks, on/off track
3. **Headlines** — one-liner per agent (key update, risk, or win)
4. **Issues list** — anything that needs IDS (Identify, Discuss, Solve)
5. **To-do recap** — action items from last week, done or not

**IDS Process:** If Micah raises an issue, Dru runs IDS:
- **Identify** the root cause (not the symptom)
- **Discuss** options (Dru may pull in domain agents)
- **Solve** — one owner, one action, one deadline

**Output:** Structured Telegram message. Micah responds with issues to IDS or "looks good."

---

### Weekly: 1:1 Meetings (ACTIVE)

**Owner:** Dru (conducts 1:1s with direct reports)
**Trigger:** OpenClaw crons, staggered through the week
**Participants:** Dru ↔ domain agent (Micah does NOT attend)

**Purpose:** Feed Dru's L10 and morning briefings with comprehensive, up-to-date agent status.

**Schedule:**
| Agent | Day | Time | With |
|-------|-----|------|------|
| Sloane | Tuesday | 9am CDT | Dru |
| Reid | Wednesday | 9am CDT | Dru |
| Willow | Thursday | 9am CDT | Dru |

**Format:**
1. Rock status — on/off track for each, with why if off
2. Scorecard metrics — what moved this week
3. Open Kanban cards — status of each
4. Wins — what went well
5. Blockers — what's stuck and what's needed
6. Ideas/improvements — at least one proposal per 1:1
7. Cross-team flags — anything another agent needs to know

**V1 (current):** Dru generates 1:1 content himself — pulls data from tools + reads each agent's memory. Produces per-agent status report.
**V2 (after Telegram bots):** Each agent gets own cron trigger, pulls their own data, self-assesses against Rocks, sends structured report to Dru.

**Output:** Per-agent report. Dru synthesizes into Monday L10.

---

### Monthly: Financial Close (FUTURE)

**Owner:** Reid → Micah
**Trigger:** Manual (1st of month)
**Participants:** Reid (produces), Micah (approves)

**Purpose:** Close the books for the prior month. QuickBooks reconciliation, Hostaway payout matching, expense categorization, receipt verification.

**Format:**
1. Revenue summary (by property, by channel)
2. Expense summary (by category)
3. Net income (by property)
4. Anomalies and open items
5. Budget vs. actuals
6. Micah action items (receipts needed, categorization questions)

---

### Quarterly: Planning Session (ACTIVE)

**Owner:** Dru initiates, Micah decides
**Trigger:** OpenClaw cron, 3 weeks before quarter end (10th of March, June, Sept, Dec)
**Participants:** Dru + Micah, with input from all agents

**Purpose:** Review the quarter. Set the next quarter's Rocks. Check the V/TO.

**Sequence:**
1. **Dru kicks off via Telegram** — sends structured kickoff message:
   - Prior quarter Rock status (each Rock: completed or not, why)
   - V/TO check prompts ("Anything changed in the 3-year picture?")
   - Proposed agenda for the planning session
2. **Planning session** (Micah + Dru):
   - Review prior Rocks → reflect on what worked/didn't
   - V/TO review → any updates to vision, 1-year plan, or issues list
   - Set new quarterly Rocks (company-level first, then cascade to agents)
   - Update scorecard targets if needed
   - Update `context/rocks.md`, `context/scorecard.md`, `context/vto.md`
   - Sync to Kanban board
3. **Dru communicates new Rocks to all agents** via morning briefing

**Skill:** `.claude/skills/quarterly-planning/SKILL.md`

---

### On Hire: 30/60/90 Plan (ACTIVE)

**Owner:** New agent + their direct report
**Trigger:** First session with a new or newly-refined agent
**Template:** `agents/templates/30-60-90-template.md`

**Purpose:** Structured onboarding. Every agent gets a 90-day plan with measurable goals, checkpoints, and accountability.

**Process:**
1. Direct report (usually Dru) facilitates the planning session
2. Agent produces their 30/60/90 using the template
3. Micah reviews and approves
4. Checkpoints at Day 30, 60, 90 (conducted during regular 1:1s)
5. Day 90 checkpoint transitions to ongoing quarterly Rocks

---

## Rules for All Ceremonies

1. **Ceremonies are non-negotiable.** They happen on schedule. If there's nothing to report, the ceremony is short — but it still happens.
2. **Dru owns the cadence.** If a ceremony is missed, Dru flags it in the next morning briefing.
3. **Output over process.** The goal is alignment and accountability, not bureaucracy. Keep ceremonies tight.
4. **Micah's time is protected.** He only attends: morning briefing (read), L10 (read + respond), quarterly planning (participate). All 1:1s happen without him.
5. **Everything feeds up.** Agent standups → Dru's morning briefing. 1:1s → L10. L10 → quarterly planning. Nothing exists in isolation.
