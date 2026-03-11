import { NextResponse } from 'next/server';
import { exec, isConfigured } from '@/lib/openclaw';

// Fallback static data if gateway is unavailable
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
    schedule: '0 9 * * 1',
    enabled: false,
    description: 'EOS Level 10 meeting. Currently disabled.',
  },
  {
    id: '1on1-sloane',
    name: '1:1 Sloane',
    schedule: '0 9 * * 2',
    enabled: false,
    description: 'Weekly check-in with Sloane (CMO). Currently disabled.',
  },
  {
    id: '1on1-reid',
    name: '1:1 Reid',
    schedule: '0 9 * * 3',
    enabled: false,
    description: 'Weekly check-in with Reid (CIFO). Currently disabled.',
  },
  {
    id: '1on1-willow',
    name: '1:1 Willow',
    schedule: '0 9 * * 4',
    enabled: false,
    description: 'Weekly check-in with Willow (Guest Comms). Currently disabled.',
  },
];

export async function GET() {
  try {
    if (!isConfigured()) {
      return NextResponse.json({ jobs: FALLBACK_JOBS, source: 'fallback' });
    }

    // Get cron job list from OpenClaw
    const listOutput = await exec('openclaw cron list --json 2>/dev/null', 10000);

    if (!listOutput) {
      return NextResponse.json({ jobs: FALLBACK_JOBS, source: 'fallback' });
    }

    let jobs: any[];
    try {
      const parsed = JSON.parse(listOutput);
      jobs = Array.isArray(parsed) ? parsed : parsed.jobs || parsed.data || [];
    } catch {
      // If JSON parse fails, return fallback
      return NextResponse.json({ jobs: FALLBACK_JOBS, source: 'fallback' });
    }

    // For each enabled job, try to get recent run history
    const enrichedJobs = await Promise.all(
      jobs.map(async (job: any) => {
        let runs: any[] = [];
        if (job.enabled !== false && job.id) {
          try {
            const runsOutput = await exec(
              `openclaw cron runs --id ${job.id} --limit 5 --json 2>/dev/null`,
              10000
            );
            if (runsOutput) {
              const parsed = JSON.parse(runsOutput);
              runs = Array.isArray(parsed) ? parsed : parsed.runs || [];
            }
          } catch {
            // Run history is optional
          }
        }

        return {
          id: job.id || job.name,
          name: job.name || job.id,
          schedule: job.schedule || job.cron || '',
          enabled: job.enabled !== false,
          description: job.description || job.prompt || '',
          runs: runs.map((r: any) => ({
            time: r.startedAt || r.time || r.timestamp,
            status: r.status || (r.error ? 'error' : 'success'),
            duration: r.durationMs ? Math.round(r.durationMs / 1000) : r.duration,
            error: r.error || null,
          })),
          lastRun: runs[0]
            ? {
                time: runs[0].startedAt || runs[0].time || runs[0].timestamp,
                status: runs[0].status || (runs[0].error ? 'error' : 'success'),
                duration: runs[0].durationMs ? Math.round(runs[0].durationMs / 1000) : runs[0].duration,
              }
            : undefined,
        };
      })
    );

    return NextResponse.json({ jobs: enrichedJobs, source: 'live' });
  } catch (err) {
    console.error('[cron] Error:', err);
    return NextResponse.json({ jobs: FALLBACK_JOBS, source: 'fallback' });
  }
}
