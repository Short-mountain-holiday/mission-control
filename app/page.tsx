import {
  LayoutDashboard,
  AlertTriangle,
  CheckCircle2,
  Inbox,
  Timer,
  Zap,
} from 'lucide-react';
import StatCard from '@/components/stat-card';
import TaskCard from '@/components/task-card';
import { getTasks, getDashboardStats } from '@/lib/notion';
import { agents } from '@/lib/agents';
import { cn, getOwnerColor } from '@/lib/utils';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Dashboard() {
  let stats = null;
  let recentTasks: any[] = [];
  let error = null;

  try {
    stats = await getDashboardStats();
    const allTasks = await getTasks({ excludeDone: true });
    recentTasks = allTasks
      .sort((a, b) => new Date(b.lastEditedTime).getTime() - new Date(a.lastEditedTime).getTime())
      .slice(0, 8);
  } catch (e) {
    error = 'Unable to connect to Notion. Check your API key.';
    console.error(e);
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2.5">
          <LayoutDashboard className="w-6 h-6 text-[var(--accent)]" />
          Dashboard
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          Short Mountain Holiday — Operations Overview
        </p>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-red-400">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Connection Error</span>
          </div>
          <p className="text-sm">{error}</p>
        </div>
      ) : stats ? (
        <>
          {/* Stats Grid - 2 columns on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="In Progress"
              value={stats.inProgress}
              icon={Timer}
              accent="bg-amber-500/10"
            />
            <StatCard
              label="Overdue"
              value={stats.overdue}
              icon={AlertTriangle}
              accent={stats.overdue > 0 ? 'bg-red-500/10' : 'bg-[var(--bg-elevated)]'}
            />
            <StatCard
              label="Completed This Week"
              value={stats.completedThisWeek}
              icon={CheckCircle2}
              accent="bg-emerald-500/10"
            />
            <StatCard
              label="Inbox (Needs Triage)"
              value={stats.inbox}
              icon={Inbox}
              accent={stats.inbox > 5 ? 'bg-amber-500/10' : 'bg-[var(--bg-elevated)]'}
            />
          </div>

          {/* Recent Activity + Team Status - stack vertically on mobile, 2/3 + 1/3 split on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl">
                <div className="px-5 py-4 border-b border-[var(--border-primary)] flex items-center justify-between">
                  <h2 className="text-sm font-medium">Recent Activity</h2>
                  <span className="text-xs text-[var(--text-tertiary)]">{stats.totalTasks} total tasks</span>
                </div>
                <div className="p-2 space-y-1">
                  {recentTasks.length > 0 ? (
                    recentTasks.map((task) => (
                      <TaskCard key={task.id} task={task} compact />
                    ))
                  ) : (
                    <div className="px-3 py-8 text-center text-sm text-[var(--text-tertiary)]">
                      No active tasks
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Agent Status */}
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl">
                <div className="px-5 py-4 border-b border-[var(--border-primary)]">
                  <h2 className="text-sm font-medium">Team Status</h2>
                </div>
                <div className="p-3 space-y-1">
                  {agents.map((agent) => (
                    <div key={agent.name} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
                      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white', agent.color)}>
                        {agent.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-[var(--text-primary)]">{agent.name}</div>
                        <div className="text-[10px] text-[var(--text-tertiary)]">{agent.role}</div>
                      </div>
                      <div className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full font-medium',
                        agent.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                        agent.status === 'parked' ? 'bg-zinc-500/10 text-zinc-400' :
                        'bg-amber-500/10 text-amber-400'
                      )}>
                        {agent.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl">
                <div className="px-5 py-4 border-b border-[var(--border-primary)]">
                  <h2 className="text-sm font-medium">By Status</h2>
                </div>
                <div className="p-4 space-y-3">
                  {Object.entries(stats.byStatus).filter(([_, count]) => (count as number) > 0).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">{status}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--accent)] rounded-full"
                            style={{ width: `${Math.min(100, ((count as number) / stats.totalTasks) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-[var(--text-tertiary)] w-6 text-right">{count as number}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-[var(--text-tertiary)] py-12">Loading...</div>
      )}
    </div>
  );
}
