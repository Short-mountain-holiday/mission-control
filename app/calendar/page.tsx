'use client';

import { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Pause,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CronRun {
  time: string;
  status: 'success' | 'error' | 'timeout';
  duration?: number;
  error?: string;
}

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  description?: string;
  lastRun?: CronRun;
  runs?: CronRun[];
}

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

function formatRunTime(time: string): string {
  try {
    const d = new Date(time);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return time;
  }
}

function getWeekDays(): { date: Date; label: string; isToday: boolean }[] {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

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

function getJobsForDay(jobs: CronJob[], dayOfWeek: number): CronJob[] {
  return jobs.filter(job => {
    const dow = job.schedule.split(' ')[4];
    if (dow === '*') return true;
    return parseInt(dow) === dayOfWeek;
  });
}

export default function CalendarPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'live' | 'fallback'>('fallback');
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const weekDays = getWeekDays();

  const fetchCronData = () => {
    setLoading(true);
    setError(null);
    fetch('/api/cron')
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          if (data.jobs) setJobs(data.jobs);
          if (data.source) setSource(data.source);
        }
      })
      .catch((err) => {
        setError('Failed to load calendar data');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCronData();
  }, []);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-[var(--accent)]" />
            Calendar
          </h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            Scheduled cron jobs and recurring tasks
          </p>
        </div>
        {source === 'fallback' && !loading && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5" />
            Showing cached data
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-sm text-[var(--text-tertiary)]">
          <Loader2 className="w-5 h-5 animate-spin mb-2" />
          Loading cron data...
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 text-sm text-[var(--text-tertiary)]">
          <AlertCircle className="w-8 h-8 mb-3 text-amber-400" />
          <p className="mb-4">{error}</p>
          <button
            onClick={fetchCronData}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Week View */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl mb-8 overflow-hidden">
            <div className="grid grid-cols-7 divide-x divide-[var(--border-primary)]">
              {weekDays.map((day, i) => {
                const dayJobs = getJobsForDay(jobs, day.date.getDay());
                return (
                  <div key={i} className={cn('min-h-[180px]', day.isToday && 'bg-[var(--accent)]/5')}>
                    <div
                      className={cn(
                        'px-3 py-2.5 border-b border-[var(--border-primary)] text-xs font-medium',
                        day.isToday ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'
                      )}
                    >
                      {day.label}
                      {day.isToday && (
                        <span className="ml-1.5 text-[10px] bg-[var(--accent)] text-white px-1.5 py-0.5 rounded-full">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="p-2 space-y-1.5">
                      {dayJobs.map(job => (
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
              {jobs.map(job => {
                const isExpanded = expandedJob === job.id;
                const hasRuns = job.runs && job.runs.length > 0;

                return (
                  <div key={job.id}>
                    <div
                      className={cn(
                        'px-5 py-4 flex items-center gap-4 hover:bg-[var(--bg-hover)] transition-colors',
                        hasRuns && 'cursor-pointer'
                      )}
                      onClick={() => hasRuns && setExpandedJob(isExpanded ? null : job.id)}
                    >
                      {getStatusIcon(job)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn('text-sm font-medium', !job.enabled && 'text-[var(--text-tertiary)]')}>
                            {job.name}
                          </span>
                          {!job.enabled && (
                            <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">
                              DISABLED
                            </span>
                          )}
                          {source === 'live' && (
                            <span className="text-[10px] bg-emerald-900/30 text-emerald-400 px-1.5 py-0.5 rounded">
                              LIVE
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)] mt-0.5">{job.description}</div>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-3">
                        <div>
                          <div className="text-xs text-[var(--text-secondary)]">{parseCronSchedule(job.schedule)}</div>
                          {job.lastRun && (
                            <div
                              className={cn(
                                'text-[10px] mt-0.5',
                                job.lastRun.status === 'success'
                                  ? 'text-emerald-400'
                                  : job.lastRun.status === 'error'
                                  ? 'text-red-400'
                                  : 'text-amber-400'
                              )}
                            >
                              Last: {job.lastRun.status}
                              {job.lastRun.duration ? ` (${job.lastRun.duration}s)` : ''}
                            </div>
                          )}
                        </div>
                        {hasRuns &&
                          (isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-[var(--text-tertiary)]" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
                          ))}
                      </div>
                    </div>

                    {/* Run History Panel */}
                    {isExpanded && job.runs && (
                      <div className="px-5 pb-4">
                        <div className="ml-8 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-primary)] divide-y divide-[var(--border-primary)]">
                          <div className="px-4 py-2 text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                            Recent Runs
                          </div>
                          {job.runs.map((run, i) => (
                            <div key={i} className="px-4 py-2.5 flex items-center gap-3 text-xs">
                              <span
                                className={cn(
                                  'w-2 h-2 rounded-full shrink-0',
                                  run.status === 'success'
                                    ? 'bg-emerald-400'
                                    : run.status === 'error'
                                    ? 'bg-red-400'
                                    : 'bg-amber-400'
                                )}
                              />
                              <span className="text-[var(--text-secondary)] flex-1">
                                {run.time ? formatRunTime(run.time) : 'Unknown time'}
                              </span>
                              <span
                                className={cn(
                                  run.status === 'success'
                                    ? 'text-emerald-400'
                                    : run.status === 'error'
                                    ? 'text-red-400'
                                    : 'text-amber-400'
                                )}
                              >
                                {run.status}
                              </span>
                              {run.duration && (
                                <span className="text-[var(--text-tertiary)]">{run.duration}s</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
