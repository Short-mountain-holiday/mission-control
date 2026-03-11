---
summary: "Workspace template for TOOLS.md"
read_when:
  - Bootstrapping a workspace manually
---

# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

## Notion - SMH Workspace

### Databases

- **SMH Command Center** (Kanban board)
  - ID: `a66999eb-0c71-4806-8bbd-cdc19429fa67`
  - Fields: Task, Status, Owner, Phase, Priority, Category, Due Date, Notes, Property, Source
  
- **Agent Resources**
  - ID: `319fe864-f323-80ef-8bf6-cb69d81c18e4`
  
- **SMH Plans Log**
  - ID: `ad121d87-19ea-4ac0-9039-81564c2bc56f`

### Status Flow

Inbox → To Do → In Progress → Review → Commit → Done  
(Parked = on hold)

### Owners

Current: Micah, Drew, Sloane, Reid, Willow, Ryan, Geoff, Amber, Justin, Claude Code

✅ "Dru" added as Owner option via Notion API (2026-03-11) - all Drew/Claude Code cards updated

### Helper Scripts

- `scripts/notion-helpers.sh` — Common operations (get tasks, update status/owner)
- `scripts/morning-briefing.sh` — Daily board status summary

### Common Queries

**Get all In Progress tasks:**
```bash
curl -s -X POST "https://api.notion.com/v1/databases/a66999eb-0c71-4806-8bbd-cdc19429fa67/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -d '{"filter": {"property": "Status", "select": {"equals": "In Progress"}}}'
```

**Get tasks by owner:**
```bash
curl -s -X POST "https://api.notion.com/v1/databases/a66999eb-0c71-4806-8bbd-cdc19429fa67/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -d '{"filter": {"property": "Owner", "select": {"equals": "Drew"}}}'
```

**Update task status:**
```bash
curl -s -X PATCH "https://api.notion.com/v1/pages/{PAGE_ID}" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -d '{"properties": {"Status": {"select": {"name": "Done"}}}}'
```

---

Add whatever helps you do your job. This is your cheat sheet.