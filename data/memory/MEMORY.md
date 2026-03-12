# MEMORY.md - Curated Long-Term Memory

> Distilled patterns, decisions, and lessons. Keep under 5k tokens. Details belong in daily logs, TOOLS.md, or SOUL.md.

## Current State (2026-03-12)

**Operational posture:** Minimal viable ops. Only morning briefing cron active. Reid & Willow parked. Expand when Micah is comfortable.

**Model:** Opus 4.6 main session, Sonnet 4.5 for sub-agents. Claude Max 20 ($200/mo flat). No API credits.

**Micah's priorities:** EOS alignment > Sloane+Dru pro-level > Mission Control.

## Architecture

- **Dru (main)** → spawns Sloane, Reid, Willow as sub-agents
- Each sub-agent has own workspace + symlinked shared resources
- Morning briefing: main session systemEvent → Sonnet sub-agent → Notion query → Telegram
- ⚠️ Isolated cron sessions broken (OpenClaw v2026.3.8) — use main+systemEvent workaround

## Credentials

All in 1Password "OpenClaw" vault. Service account is read-only (write pending).
- ✅ Hostaway, Mailchimp, Canva, Email (dru@agentmail.to), Instagram Graph API, Dropbox
- ⏳ GA4 (Micah needs to create service account), QuickBooks (deferred Q3)
- Instagram token: 60-day, issued 2026-03-11 — **renew by May 10**

## Mission Control

- Next.js on Vercel: `https://mission-control-lemon-beta-20.vercel.app`
- Repo: `Short-mountain-holiday/mission-control` (shared repo — always `git pull` first)
- Phase 2 in progress: security hardening → password protection → gateway integration
- Chat widget deferred to Phase 3 (needs scoped gateway tokens)
- Gateway `/tools/invoke` cannot expose sandbox tools (read/write/edit/exec/process/image)
- **Micah values security over features.** Don't push things that feel unsafe.

## Active Content

- **Campaign 3 (Sky Series):** Equinox post draft complete, awaiting Micah review. March 20 deadline.
- **Campaign 1 (Disconnect):** Framing decided. Sloane cleared to draft once Dropbox skill is live.
- **Q2 Occupancy:** 9% combined vs 60% target. March decent (SC 26%, NR 77%). May+June nearly empty.

## Board Rules (Type + Emoji)

- BLOCKER → 🛑 | ROCK → 🪨 | ClawOS → 🤖
- New "ClawOS" type tracks work ON the system vs IN the business

## Lessons Learned

1. **Board is the ONLY source of truth.** Card before work. Status in real time. No exceptions. Got called out twice 2026-03-12.
2. **Owner = whoever does the work.** Review column is Micah's approval queue regardless of owner.
3. **Don't overbuild.** Deploy incrementally. Opacity = anxiety for Micah.
4. **Infrastructure before automation.** Build trust with basics first.
5. **Bot token** is Docker env var — config file edits get overwritten on restart.
6. **Headless OAuth** doesn't work on VPS — generate tokens on Mac, paste to server.
7. **Docker container** isn't named "openclaw" — use `docker ps` to find it.
8. **Memory discipline:** Write it down immediately. Don't wait for session end.
9. **Micah doesn't communicate all details** — ask clarifying questions, state assumptions.
10. **Sloane content pipeline:** Dropbox browse → image analysis → draft copy → Telegram approval.

---

Last curated: 2026-03-12
