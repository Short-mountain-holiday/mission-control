import type { Task } from '@/lib/types';
import { cn, getOwnerColor, getOwnerInitial, getPriorityIcon, isOverdue, formatRelativeTime } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  compact?: boolean;
  onClick?: () => void;
}

export default function TaskCard({ task, compact, onClick }: TaskCardProps) {
  const overdue = isOverdue(task.dueDate);

  if (compact) {
    return (
      <div
        onClick={onClick}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
      >
        <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium text-white', getOwnerColor(task.owner))}>
          {getOwnerInitial(task.owner)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-[var(--text-primary)] truncate">{task.title}</div>
        </div>
        {task.priority && (
          <span className="text-xs">{getPriorityIcon(task.priority)}</span>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-[var(--bg-surface)] border rounded-lg p-3.5 cursor-pointer hover:border-[var(--border-secondary)] transition-all group',
        overdue ? 'border-red-500/30' : 'border-[var(--border-primary)]'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-[var(--text-primary)] leading-snug group-hover:text-white transition-colors">
          {task.title}
        </h4>
        {task.priority && (
          <span className="text-xs shrink-0">{getPriorityIcon(task.priority)}</span>
        )}
      </div>

      {task.notes && (
        <p className="text-xs text-[var(--text-tertiary)] line-clamp-2 mb-3 leading-relaxed">
          {task.notes}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium text-white', getOwnerColor(task.owner))}>
            {getOwnerInitial(task.owner)}
          </div>
          {task.category && (
            <span className="text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded">
              {task.category}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className={cn('text-[10px]', overdue ? 'text-red-400' : 'text-[var(--text-tertiary)]')}>
              {overdue ? '⚠ ' : ''}{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          <span className="text-[10px] text-[var(--text-tertiary)]">
            {formatRelativeTime(task.lastEditedTime)}
          </span>
        </div>
      </div>
    </div>
  );
}
