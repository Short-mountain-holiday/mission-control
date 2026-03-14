import { NextResponse } from 'next/server';
import { isConfigured, readFile } from '@/lib/openclaw';

// Cron data is written to a workspace JSON file by a periodic cron job.
// This route reads that file via gateway memory_get.
// Falls back to hardcoded data if gateway unavailable.

const CRON_DATA_PATH = '/data/.openclaw/workspace/data/cron-status.json';

const FALLBACK_JOBS = [
  {
    id: 'morning-briefing',
    name: 'Morning Briefing',
    schedule: '0 8 * * *',
    enabled: true,
    description: 'Daily board status + team update delivered to Telegram.',
  },
  {
    id: 'weekly-l10',
    name: 'Weekly L10',
    schedule: '30 13 * * 1',
    enabled: true,
    description: 'EOS Level 10 meeting facilitation.',
  },
  {
    id: 'weekly-occupancy',
    name: 'Weekly Occupancy',
    schedule: '0 7 * * 1',
    enabled: true,
    description: 'Pull Hostaway occupancy data and update Rock card.',
  },
  {
    id: 'overnight-work',
    name: 'Overnight Work',
    schedule: '0 1 * * *',
    enabled: true,
    description: 'Autonomous work session on To Do cards.',
  },
  {
    id: 'overnight-wrapup',
    name: 'Overnight Wrap-up',
    schedule: '0 6 * * *',
    enabled: true,
    description: 'Summary of overnight work sent to Telegram.',
  },
  {
    id: 'kb-daily-update',
    name: 'KB Daily Update',
    schedule: '0 3 * * *',
    enabled: true,
    description: 'Update Notion knowledge base with structural changes.',
  },
];

export async function GET() {
  try {
    if (!isConfigured()) {
      return NextResponse.json({ jobs: FALLBACK_JOBS, source: 'fallback' });
    }

    // Try reading live cron status from workspace
    const content = await readFile(CRON_DATA_PATH);
    if (content) {
      try {
        const data = JSON.parse(content);
        const jobs = Array.isArray(data) ? data : data.jobs || [];
        return NextResponse.json({ jobs, source: 'live', updatedAt: data.updatedAt });
      } catch {
        // JSON parse failed, use fallback
      }
    }

    return NextResponse.json({ jobs: FALLBACK_JOBS, source: 'fallback' });
  } catch (err) {
    console.error('[cron] Error:', err);
    return NextResponse.json({ jobs: FALLBACK_JOBS, source: 'fallback' });
  }
}
