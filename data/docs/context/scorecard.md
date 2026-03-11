# SMH Weekly Scorecard

> 5-15 metrics that tell us if the business is healthy. Reviewed weekly in the L10 meeting.
> Each metric has an owner, a target, and a data source. On track or off track — that's it.
> Updated quarterly when Rocks change. Targets may shift as baselines are established.

---

## How the Scorecard Works

1. Every metric has **one owner** — the person accountable for that number
2. Targets are **weekly** unless noted otherwise
3. Status is binary: **on track** (meeting target) or **off track** (below target)
4. Off-track metrics get discussed in the L10 — owner explains why and what they're doing about it
5. Dru owns the scorecard review process. Domain agents own their metrics.

---

## Weekly Metrics

| # | Metric | Owner | Target | Source | Notes |
|---|--------|-------|--------|--------|-------|
| 1 | 30-day forward occupancy — South Cove | Reid | 60%+ | Hostaway API | |
| 2 | 30-day forward occupancy — North Ridge | Reid | 60%+ | Hostaway API | |
| 3 | Instagram followers | Sloane | Per Rocks | Instagram API | Cumulative |
| 4 | Instagram engagement rate | Sloane | 4%+ | Instagram API | Likes + comments + saves / reach |
| 5 | Posts published (trailing 7 days) | Sloane | 3+ | Instagram API | |
| 6 | Email list size | Sloane | Per Rocks | Mailchimp API | Cumulative |
| 7 | Monthly close completed by | Reid | 5th of month | Manual | Monthly metric |
| 8 | Open Kanban cards (overdue) | Drew | 0 | Notion API | Cards past due date |
| 9 | Ceremonies completed (trailing 7 days) | Drew | 100% | Manual | All scheduled ceremonies ran |

---

## Scorecard Data Sources

**Automated (V2 — tools connected):**
- Metrics 1-2: `tools/hostaway_analytics.py` → `hostaway_snapshot`
- Metrics 3-5: `tools/instagram.py` → `instagram_analytics`
- Metric 6: `tools/mailchimp.py` → `mailchimp_stats`
- Metric 8: `tools/agent_tools.py` → `query_board`

**Manual (V1 — until tool credentials are connected):**
- Agents self-report during 1:1s
- Dru compiles for L10

**Scorecard tool:** `tools/scorecard.py` — auto-pulls all connected metrics. Dru uses `generate_scorecard` in the L10 and morning briefing.

---

## Future Metrics (add when ready)

- **Guest response turnaround** (Willow, < 1 hour) — add when Willow takes over guest comms from Micah's existing system
- **Repeat guest rate** — add when tracking method is established (Reid Rock)
- **Referral booking rate** — add when tracking method is established (Reid Rock)

---

## Metric History

*Tracking begins Q2 2026. Prior data may be sparse or unavailable for some metrics.*

| Week | SC Occ | NR Occ | IG Followers | IG Engage | Posts | Email List | Close By | Overdue Cards | Ceremonies |
|------|--------|--------|-------------|-----------|-------|-----------|---------|--------------|------------|
| *Populated weekly by Drew during L10* | | | | | | | | | |
