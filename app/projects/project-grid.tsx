'use client';

import { useState } from 'react';
import type { Task } from '@/lib/types';
import { cn, getOwnerColor, getOwnerInitial, getPriorityIcon, getStatusColor, formatRelativeTime } from '@/lib/utils';
import { ChevronDown, ChevronUp, CheckCircle2, Timer, ListTodo, PauseCircle } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'complete';
  progress: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  parkedTasks: number;
  owner: string;
  tasks: Task[];
}

interface ProjectGridProps {
  projects: Project[];
}

function getProjectStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">Active</span>;
    case 'paused':
      return <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-400 font-medium">Paused</span>;
    case 'complete':
      return <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">Complete</span>;
    default:
      return null;
  }
}

function getProgressColor(progress: number): string {
  if (progress >= 80) return 'bg-emerald-500';
  if (progress >= 50) return 'bg-blue-500';
  if (progress >= 25) return 'bg-amber-500';
  return 'bg-[var(--accent)]';
}

export default function ProjectGrid({ projects }: ProjectGridProps) {
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {projects.map((project) => {
        const isExpanded = expandedProject === project.id;

        return (
          <div
            key={project.id}
            className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden hover:border-[var(--border-secondary)] transition-colors"
          >
            {/* Card Header */}
            <div
              className="p-5 cursor-pointer"
              onClick={() => setExpandedProject(isExpanded ? null : project.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{project.name}</h3>
                  {getProjectStatusBadge(project.status)}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-[var(--text-tertiary)]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
                )}
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', getProgressColor(project.progress))}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <span className="text-xs text-[var(--text-secondary)] font-medium w-10 text-right">
                  {project.progress}%
                </span>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{project.completedTasks} done</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Timer className="w-3 h-3" />
                  <span>{project.inProgressTasks} active</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-400">
                  <ListTodo className="w-3 h-3" />
                  <span>{project.todoTasks} to do</span>
                </div>
                {project.parkedTasks > 0 && (
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <PauseCircle className="w-3 h-3" />
                    <span>{project.parkedTasks} parked</span>
                  </div>
                )}
                <div className="ml-auto flex items-center gap-1.5">
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-medium text-white',
                      getOwnerColor(project.owner)
                    )}
                  >
                    {getOwnerInitial(project.owner)}
                  </div>
                  <span className="text-[var(--text-tertiary)]">{project.owner}</span>
                </div>
              </div>
            </div>

            {/* Expanded Task List */}
            {isExpanded && (
              <div className="border-t border-[var(--border-primary)]">
                <div className="px-5 py-2 text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider bg-[var(--bg-surface)]">
                  Tasks ({project.totalTasks})
                </div>
                <div className="divide-y divide-[var(--border-primary)] max-h-[400px] overflow-y-auto">
                  {project.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="px-5 py-3 flex items-center gap-3 hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium text-white shrink-0',
                          getOwnerColor(task.owner)
                        )}
                      >
                        {getOwnerInitial(task.owner)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)] truncate">{task.title}</p>
                      </div>
                      {task.priority && (
                        <span className="text-xs shrink-0">{getPriorityIcon(task.priority)}</span>
                      )}
                      <span className={cn('text-[10px] shrink-0 font-medium', getStatusColor(task.status))}>
                        {task.status}
                      </span>
                      <span className="text-[10px] text-[var(--text-tertiary)] shrink-0 w-14 text-right">
                        {formatRelativeTime(task.lastEditedTime)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {projects.length === 0 && (
        <div className="col-span-2 text-center text-[var(--text-tertiary)] py-16">
          No projects found. Tasks need a Category to appear here.
        </div>
      )}
    </div>
  );
}
