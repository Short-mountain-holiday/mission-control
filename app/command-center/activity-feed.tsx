'use client';

import { useState } from 'react';
import type { Task } from '@/lib/types';
import { cn, getOwnerColor, getOwnerInitial, formatRelativeTime } from '@/lib/utils';
import { Activity, ChevronRight, ChevronLeft } from 'lucide-react';

interface ActivityFeedProps {
  tasks: Task[];
}

function inferAction(task: Task): string {
  if (task.status === 'Done') return 'completed';
  if (task.status === 'In Progress') return 'moved to In Progress';
  if (task.status === 'Review') return 'moved to Review';
  if (task.status === 'Commit') return 'moved to Commit';
  if (task.status === 'Inbox') return 'added to Inbox';
  if (task.status === 'To Do') return 'moved to To Do';
  if (task.status === 'Parked') return 'parked';
  return 'updated';
}

function getActionColor(status: string): string {
  const colors: Record<string, string> = {
    'completed': 'text-emerald-400',
    'moved to In Progress': 'text-amber-400',
    'moved to Review': 'text-purple-400',
    'moved to Commit': 'text-emerald-400',
    'added to Inbox': 'text-zinc-400',
    'moved to To Do': 'text-blue-400',
    'parked': 'text-zinc-500',
    'updated': 'text-[var(--text-tertiary)]',
  };
  return colors[status] || 'text-[var(--text-tertiary)]';
}

export default function ActivityFeed({ tasks }: ActivityFeedProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Sort by last edited, take top 20
  const recentActivity = [...tasks]
    .sort((a, b) => new Date(b.lastEditedTime).getTime() - new Date(a.lastEditedTime).getTime())
    .slice(0, 20);

  if (collapsed) {
    return (
      <div className="w-10 shrink-0 flex flex-col items-center pt-2">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-tertiary)]"
          title="Show activity feed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 shrink-0 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border-primary)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="text-xs font-medium text-[var(--text-secondary)]">Recent Activity</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 rounded hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-tertiary)]"
          title="Collapse"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto">
        {recentActivity.map((task) => {
          const action = inferAction(task);
          return (
            <div
              key={task.id}
              className="px-4 py-3 border-b border-[var(--border-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium text-white shrink-0 mt-0.5',
                    getOwnerColor(task.owner)
                  )}
                >
                  {getOwnerInitial(task.owner)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-relaxed">
                    <span className="text-[var(--text-secondary)] font-medium">
                      {task.owner || 'Someone'}
                    </span>{' '}
                    <span className={getActionColor(action)}>{action}</span>
                  </p>
                  <p className="text-xs text-[var(--text-primary)] truncate mt-0.5 font-medium">
                    {task.title}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                    {formatRelativeTime(task.lastEditedTime)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        {recentActivity.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-[var(--text-tertiary)]">
            No recent activity
          </div>
        )}
      </div>
    </div>
  );
}
