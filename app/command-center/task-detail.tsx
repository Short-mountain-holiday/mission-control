'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Task, TaskStatus, TaskOwner, TaskPriority } from '@/lib/types';
import { X, Calendar, User, Tag, Flag, FileText, Edit2, Check, Loader2 } from 'lucide-react';
import { cn, getOwnerColor, getOwnerInitial, getStatusColor, getPriorityIcon, formatDate, formatRelativeTime, isOverdue } from '@/lib/utils';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

const STATUSES: TaskStatus[] = ['Inbox', 'To Do', 'In Progress', 'Review', 'Commit', 'Done', 'Parked'];
const OWNERS: (TaskOwner | 'Unassigned')[] = ['Micah', 'Dru', 'Sloane', 'Reid', 'Willow', 'Unassigned'];
const PRIORITIES: (TaskPriority | 'None')[] = ['P1', 'P2', 'P3', 'P4', 'None'];
const CATEGORIES = ['Marketing', 'Operations', 'Revenue', 'Guest Experience', 'Tech / AI', 'Finance', 'Legal', 'Content', 'Infrastructure', 'None'];

type EditingField = 'title' | 'status' | 'owner' | 'priority' | 'category' | 'dueDate' | 'notes' | null;

export default function TaskDetail({ task: initialTask, onClose }: TaskDetailProps) {
  const [task, setTask] = useState(initialTask);
  const [editing, setEditing] = useState<EditingField>(null);
  const [saving, setSaving] = useState<EditingField>(null);
  const [saved, setSaved] = useState<EditingField>(null);
  const [error, setError] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<any>(null);
  const [notesDebounce, setNotesDebounce] = useState<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);

  const overdue = isOverdue(task.dueDate);

  useEffect(() => {
    if (editing === 'title' && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editing]);

  const saveField = async (field: keyof Task, value: any) => {
    setSaving(field as EditingField);
    setError(null);

    // Optimistic update
    const oldValue = task[field];
    setTask({ ...task, [field]: value });

    try {
      const body: any = {};
      body[field] = value === 'Unassigned' || value === 'None' ? null : value;

      const response = await fetch(`/api/notion/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      const updated = await response.json();
      setTask(updated);

      // Show saved indicator
      setSaved(field as EditingField);
      setTimeout(() => setSaved(null), 2000);

      // Refresh the board in the background
      router.refresh();
    } catch (err) {
      // Revert on error
      setTask({ ...task, [field]: oldValue });
      setError('Failed to save. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(null);
      setEditing(null);
    }
  };

  const handleTitleSave = () => {
    if (tempValue && tempValue.trim() !== task.title) {
      saveField('title', tempValue.trim());
    } else {
      setEditing(null);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditing(null);
      setTempValue(null);
    }
  };

  const handleNotesChange = (value: string) => {
    setTask({ ...task, notes: value });

    // Clear existing debounce
    if (notesDebounce) {
      clearTimeout(notesDebounce);
    }

    // Set new debounce
    const timeout = setTimeout(() => {
      saveField('notes', value);
    }, 2000);

    setNotesDebounce(timeout);
  };

  const handleNotesBlur = () => {
    if (notesDebounce) {
      clearTimeout(notesDebounce);
      setNotesDebounce(null);
    }
    if (task.notes !== initialTask.notes) {
      saveField('notes', task.notes);
    }
  };

  const renderEditableTitle = () => {
    if (editing === 'title') {
      return (
        <div className="flex items-center gap-2">
          <input
            ref={titleInputRef}
            type="text"
            value={tempValue ?? task.title}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            className="flex-1 text-lg font-semibold bg-[var(--bg-surface)] px-3 py-2 rounded-lg border border-[var(--accent)] focus:outline-none"
          />
          {saving === 'title' && <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 group">
        <h2 className="text-lg font-semibold flex-1">{task.title}</h2>
        <button
          onClick={() => {
            setTempValue(task.title);
            setEditing('title');
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-[var(--bg-hover)] rounded"
        >
          <Edit2 className="w-4 h-4 text-[var(--text-tertiary)]" />
        </button>
        {saved === 'title' && <Check className="w-4 h-4 text-green-400" />}
      </div>
    );
  };

  const renderSelectField = (
    icon: React.ReactNode,
    label: string,
    field: keyof Task,
    currentValue: any,
    options: any[],
    displayFn?: (val: any) => React.ReactNode
  ) => {
    const isEditing = editing === field;
    const isSaving = saving === field;
    const isSaved = saved === field;

    const display = displayFn ? displayFn(currentValue) : currentValue || `No ${label.toLowerCase()}`;

    if (isEditing) {
      return (
        <div className="flex items-center gap-3">
          {icon}
          <span className="text-sm text-[var(--text-tertiary)] w-20">{label}</span>
          <div className="flex items-center gap-2 flex-1">
            <select
              value={currentValue || (field === 'owner' || field === 'priority' || field === 'category' ? 'Unassigned' : 'None')}
              onChange={(e) => saveField(field, e.target.value)}
              onBlur={() => setEditing(null)}
              autoFocus
              className="bg-[var(--bg-surface)] px-2 py-1 rounded border border-[var(--accent)] text-sm focus:outline-none"
            >
              {options.map((opt) => (
                <option key={String(opt)} value={String(opt)}>
                  {String(opt)}
                </option>
              ))}
            </select>
            {isSaving && <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />}
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3 group">
        {icon}
        <span className="text-sm text-[var(--text-tertiary)] w-20">{label}</span>
        <div className="flex items-center gap-2 flex-1">
          <div className="text-sm">{display}</div>
          <button
            onClick={() => setEditing(field as EditingField)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[var(--bg-hover)] rounded"
          >
            <Edit2 className="w-3 h-3 text-[var(--text-tertiary)]" />
          </button>
          {isSaved && <Check className="w-4 h-4 text-green-400" />}
        </div>
      </div>
    );
  };

  const renderDateField = () => {
    const isEditing = editing === 'dueDate';
    const isSaving = saving === 'dueDate';
    const isSaved = saved === 'dueDate';

    if (isEditing) {
      return (
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-[var(--text-tertiary)]" />
          <span className="text-sm text-[var(--text-tertiary)] w-20">Due</span>
          <div className="flex items-center gap-2 flex-1">
            <input
              type="date"
              value={task.dueDate || ''}
              onChange={(e) => saveField('dueDate', e.target.value || null)}
              onBlur={() => setEditing(null)}
              autoFocus
              className="bg-[var(--bg-surface)] px-2 py-1 rounded border border-[var(--accent)] text-sm focus:outline-none"
            />
            {isSaving && <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />}
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3 group">
        <Calendar className="w-4 h-4 text-[var(--text-tertiary)]" />
        <span className="text-sm text-[var(--text-tertiary)] w-20">Due</span>
        <div className="flex items-center gap-2 flex-1">
          <span className={cn('text-sm', overdue ? 'text-red-400' : '')}>
            {task.dueDate ? (
              <>{overdue && '⚠ '}{formatDate(task.dueDate)}</>
            ) : (
              <span className="text-[var(--text-tertiary)]">No due date</span>
            )}
          </span>
          <button
            onClick={() => setEditing('dueDate')}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[var(--bg-hover)] rounded"
          >
            <Edit2 className="w-3 h-3 text-[var(--text-tertiary)]" />
          </button>
          {isSaved && <Check className="w-4 h-4 text-green-400" />}
        </div>
      </div>
    );
  };

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

        {/* Error Toast */}
        {error && (
          <div className="mx-6 mt-4 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Title */}
          <div className="mb-6">
            {renderEditableTitle()}
          </div>

          <div className="space-y-5">
            {/* Status */}
            {renderSelectField(
              <div className={cn('w-2.5 h-2.5 rounded-full', getStatusColor(task.status).replace('text-', 'bg-'))} />,
              'Status',
              'status',
              task.status,
              STATUSES
            )}

            {/* Owner */}
            {renderSelectField(
              <User className="w-4 h-4 text-[var(--text-tertiary)]" />,
              'Owner',
              'owner',
              task.owner,
              OWNERS,
              (owner) => (
                <div className="flex items-center gap-2">
                  <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium text-white', getOwnerColor(owner))}>
                    {getOwnerInitial(owner)}
                  </div>
                  <span>{owner || 'Unassigned'}</span>
                </div>
              )
            )}

            {/* Priority */}
            {renderSelectField(
              <Flag className="w-4 h-4 text-[var(--text-tertiary)]" />,
              'Priority',
              'priority',
              task.priority,
              PRIORITIES,
              (priority) => priority ? `${getPriorityIcon(priority)} ${priority}` : 'None'
            )}

            {/* Category */}
            {renderSelectField(
              <Tag className="w-4 h-4 text-[var(--text-tertiary)]" />,
              'Category',
              'category',
              task.category,
              CATEGORIES,
              (category) => category ? (
                <span className="text-xs bg-[var(--bg-elevated)] px-2 py-0.5 rounded text-[var(--text-secondary)]">{category}</span>
              ) : 'None'
            )}

            {/* Due Date */}
            {renderDateField()}

            {/* Property (read-only) */}
            {task.property && (
              <div className="flex items-center gap-3">
                <Tag className="w-4 h-4 text-[var(--text-tertiary)]" />
                <span className="text-sm text-[var(--text-tertiary)] w-20">Property</span>
                <span className="text-sm">{task.property}</span>
              </div>
            )}

            {/* Phase (read-only) */}
            {task.phase && (
              <div className="flex items-center gap-3">
                <Flag className="w-4 h-4 text-[var(--text-tertiary)]" />
                <span className="text-sm text-[var(--text-tertiary)] w-20">Phase</span>
                <span className="text-sm">{task.phase}</span>
              </div>
            )}

            {/* Notes */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-[var(--text-tertiary)]" />
                <span className="text-sm font-medium text-[var(--text-secondary)]">Notes</span>
                {saving === 'notes' && (
                  <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Saving...
                  </span>
                )}
                {saved === 'notes' && !saving && (
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Saved
                  </span>
                )}
              </div>
              <textarea
                ref={notesTextareaRef}
                value={task.notes || ''}
                onChange={(e) => handleNotesChange(e.target.value)}
                onBlur={handleNotesBlur}
                placeholder="Add notes..."
                className="w-full bg-[var(--bg-surface)] rounded-lg p-4 text-sm text-[var(--text-secondary)] leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)] min-h-[120px]"
                style={{ fontFamily: 'inherit' }}
              />
            </div>

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
