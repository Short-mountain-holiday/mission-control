# HEARTBEAT.md — Active Checks

## Check Rotation (2-4x/day, rotate through)

### 1. Board Health
- Query Notion for overdue tasks
- Flag any cards stuck >3 days without movement
- Check Inbox count (triage needed if >5)

### 2. Memory Curation (every few days)
- Read recent memory/YYYY-MM-DD.md files
- Distill patterns into MEMORY.md
- Remove stale info from MEMORY.md
- Keep MEMORY.md under 5k tokens

### 3. System Health
- Verify cron jobs are running (openclaw cron list)
- Check for failed cron runs
- Verify Git repo is clean

### 4. End-of-Day Board Audit (business days, after 6pm CDT)
**Full Command Center audit — every non-Done card verified against reality.**

Process:
1. Query all non-Done cards (To Do, In Progress, Inbox, Parked, Review, Commit)
2. For each card:
   - Check if work is actually done → move to Done
   - Check if status is accurate → update if stale
   - Check if notes reflect current reality → update if outdated
   - Check if owner is correct → reassign if needed
3. Flag anything that needs Micah's decision
4. Commit findings to daily log

Skip this check before 6pm CDT (too early in the day to call things "done").
Run once per business day, typically during evening heartbeat.

## When to Stay Quiet (HEARTBEAT_OK)
- Late night (23:00-08:00 CDT) unless urgent
- Micah is clearly busy
- Nothing new since last check
- You just checked <30 minutes ago

## When to Reach Out
- Overdue task found (>2 days)
- Inbox items >5 (needs triage)
- Cron job failed
- Important pattern in board data

## Proactive Work (Do Without Asking)
- Read and organize memory files
- Update documentation
- Commit and push changes
- Review and update MEMORY.md
- Check Git status
