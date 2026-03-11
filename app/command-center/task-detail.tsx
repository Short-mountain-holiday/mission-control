'use client';

import type { Task } from '@/lib/types';
import { X, Calendar, User, Tag, Flag, FileText } from 'lucide-react';
import { cn, getOwnerColor, getOwnerInitial, getStatusColor, getPriorityIcon, formatDate, formatRelativeTime, isOverdue } from '@/lib/utils';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

export default function TaskDetail({ task, onClose }: TaskDetailProps) {
  const overdue = isOverdue(task.dueDate);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Panel - full screen on mobile, slide-out on desktop */}
      <div className="fixed inset-0 md:right-0 md:left-auto md:w-[480px] bg-[var(--bg-secondary)] md:border-l border-[var(--border-primary)] z-50 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)]">
          <span className={cn('text-sm font-medium', getStatusColor(task.status))}>
            {task.status}
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-4 h-4 text-[var(--text-tertiary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-6">{task.title}</h2>

          <div className="space-y-5">
            {/* Owner */}
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-[var(--text-tertiary)]" />
              <span className="text-sm text-[var(--text-tertiary)] w-20">Owner</span>
              <div className="flex items-center gap-2">
                <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium text-white', getOwnerColor(task.owner))}>
                  {getOwnerInitial(task.owner)}
                </div>
                <span className="text-sm">{task.owner || 'Unassigned'}</span>
              </div>
            </div>

            {/* Priority */}
            {task.priority && (
              <div className="flex items-center gap-3">
                <Flag className="w-4 h-4 text-[var(--text-tertiary)]" />
                <span className="text-sm text-[var(--text-tertiary)] w-20">Priority</span>
                <span className="text-sm">{getPriorityIcon(task.priority)} {task.priority}</span>
              </div>
            )}

            {/* Due Date */}
            {task.dueDate && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-[var(--text-tertiary)]" />
                <span className="text-sm text-[var(--text-tertiary)] w-20">Due</span>
                <span className={cn('text-sm', overdue ? 'text-red-400' : '')}>
                  {overdue && '⚠ '}{formatDate(task.dueDate)}
                </span>
              </div>
            )}

            {/* Category */}
            {task.category && (
              <div className="flex items-center gap-3">
                <Tag className="w-4 h-4 text-[var(--text-tertiary)]" />
                <span className="text-sm text-[var(--text-tertiary)] w-20">Category</span>
                <span className="text-xs bg-[var(--bg-elevated)] px-2 py-0.5 rounded text-[var(--text-secondary)]">{task.category}</span>
              </div>
            )}

            {/* Property */}
            {task.property && (
              <div className="flex items-center gap-3">
                <Tag className="w-4 h-4 text-[var(--text-tertiary)]" />
                <span className="text-sm text-[var(--text-tertiary)] w-20">Property</span>
                <span className="text-sm">{task.property}</span>
              </div>
            )}

            {/* Phase */}
            {task.phase && (
              <div className="flex items-center gap-3">
                <Flag className="w-4 h-4 text-[var(--text-tertiary)]" />
                <span className="text-sm text-[var(--text-tertiary)] w-20">Phase</span>
                <span className="text-sm">{task.phase}</span>
              </div>
            )}

            {/* Notes */}
            {task.notes && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-[var(--text-tertiary)]" />
                  <span className="text-sm font-medium text-[var(--text-secondary)]">Notes</span>
                </div>
                <div className="bg-[var(--bg-surface)] rounded-lg p-4 text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {task.notes}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="pt-4 border-t border-[var(--border-primary)] space-y-2">
              <div className="flex justify-between text-xs text-[var(--text-tertiary)]">
                <span>Created</span>
                <span>{formatDate(task.createdTime)}</span>
              </div>
              <div className="flex justify-between text-xs text-[var(--text-tertiary)]">
                <span>Last edited</span>
                <span>{formatRelativeTime(task.lastEditedTime)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
