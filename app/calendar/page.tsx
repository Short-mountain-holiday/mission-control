import { Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, AlertTriangle, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CronJob } from '@/lib/types';

export const revalidate = 60;

// For now, cron job data is defined here based on our known configuration.
// Phase 2: This will pull from the OpenClaw API.
const cronJobs: CronJob[] = [
  {
    id: 'morning-briefing',
    name: 'Morning Briefing',
    schedule: '0 8 * * *',
    enabled: true,
    description: 'Daily board status + team update delivered to Telegram. Dru spawns Sonnet sub-agent → queries Notion → delivers briefing.',
    lastRun: {
      time: new Date(Date.now() - 86400000).toISOString(),
      status: 'success',
      duration: 99,
    },
  },
  {
    id: 'weekly-l10',
    name: 'Weekly L10',
    schedule: '0 9 * * 1',
    enabled: false,
    description: 'EOS Level 10 meeting — scorecard, Rocks, headlines, issues. Currently disabled.',
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

function parseCronSchedule(schedule: string): string {
  const parts = schedule.split(' ');
  if (parts.length !== 5) return schedule;
  const [min, hour, , , dow] = parts;

  const time = `${hour.padStart(2, '0')}:${min.padStart(2, '0')} CDT`;

  const days: Record<string, string> = {
    '*': 'Daily',
    '0': 'Sunday',
    '1': 'Monday',
    '2': 'Tuesday',
    '3': 'Wednesday',
    '4': 'Thursday',
    '5': 'Friday',
    '6': 'Saturday',
  };

  const dayStr = days[dow] || dow;
  return `${dayStr} at ${time}`;
}

function getStatusIcon(job: CronJob) {
  if (!job.enabled) return <Pause className="w-4 h-4 text-zinc-500" />;
  if (!job.lastRun) return <Clock className="w-4 h-4 text-zinc-400" />;
  if (job.lastRun.status === 'success') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (job.lastRun.status === 'error') return <XCircle className="w-4 h-4 text-red-400" />;
  if (job.lastRun.status === 'timeout') return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  return <Clock className="w-4 h-4 text-zinc-400" />;
}

// Build a simple week calendar view
function getWeekDays(): { date: Date; label: string; isToday: boolean }[] {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return {
      date,
      label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      isToday: date.toDateString() === now.toDateString(),
    };
  });
}

function getJobsForDay(dayOfWeek: number): CronJob[] {
  return cronJobs.filter(job => {
    const dow = job.schedule.split(' ')[4];
    if (dow === '*') return true;
    return parseInt(dow) === dayOfWeek;
  });
}

export default function CalendarPage() {
  const weekDays = getWeekDays();

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2.5">
          <CalendarIcon className="w-6 h-6 text-[var(--accent)]" />
          Calendar
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          Scheduled cron jobs and recurring tasks
        </p>
      </div>

      {/* Week View */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl mb-8 overflow-hidden">
        <div className="grid grid-cols-7 divide-x divide-[var(--border-primary)]">
          {weekDays.map((day, i) => {
            const jobs = getJobsForDay(day.date.getDay());
            return (
              <div key={i} className={cn('min-h-[180px]', day.isToday && 'bg-[var(--accent)]/5')}>
                <div className={cn(
                  'px-3 py-2.5 border-b border-[var(--border-primary)] text-xs font-medium',
                  day.isToday ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'
                )}>
                  {day.label}
                  {day.isToday && <span className="ml-1.5 text-[10px] bg-[var(--accent)] text-white px-1.5 py-0.5 rounded-full">Today</span>}
                </div>
                <div className="p-2 space-y-1.5">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className={cn(
                        'px-2 py-1.5 rounded-md text-xs',
                        job.enabled
                          ? 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20'
                          : 'bg-zinc-800/50 text-zinc-500 border border-zinc-700/30'
                      )}
                    >
                      <div className="font-medium truncate">{job.name}</div>
                      <div className="text-[10px] opacity-70 mt-0.5">
                        {job.schedule.split(' ')[1]}:{job.schedule.split(' ')[0].padStart(2, '0')} CDT
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Job List */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl">
        <div className="px-5 py-4 border-b border-[var(--border-primary)]">
          <h2 className="text-sm font-medium">All Cron Jobs</h2>
        </div>
        <div className="divide-y divide-[var(--border-primary)]">
          {cronJobs.map((job) => (
            <div key={job.id} className="px-5 py-4 flex items-center gap-4 hover:bg-[var(--bg-hover)] transition-colors">
              {getStatusIcon(job)}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm font-medium', !job.enabled && 'text-[var(--text-tertiary)]')}>
                    {job.name}
                  </span>
                  {!job.enabled && (
                    <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">DISABLED</span>
                  )}
                </div>
                <div className="text-xs text-[var(--text-tertiary)] mt-0.5">{job.description}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-[var(--text-secondary)]">{parseCronSchedule(job.schedule)}</div>
                {job.lastRun && (
                  <div className={cn(
                    'text-[10px] mt-0.5',
                    job.lastRun.status === 'success' ? 'text-emerald-400' :
                    job.lastRun.status === 'error' ? 'text-red-400' : 'text-amber-400'
                  )}>
                    Last: {job.lastRun.status} {job.lastRun.duration ? `(${job.lastRun.duration}s)` : ''}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
