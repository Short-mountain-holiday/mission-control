'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Task, TaskStatus } from '@/lib/types';
import TaskCard from '@/components/task-card';
import TaskDetail from './task-detail';
import ActivityFeed from './activity-feed';
import CreateTaskModal from './create-task-modal';
import { cn } from '@/lib/utils';
import { Filter, Plus } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Column {
  status: TaskStatus;
  label: string;
  color: string;
}

interface KanbanBoardProps {
  columns: Column[];
  grouped: Record<string, Task[]>;
  allTasks: Task[];
}

const OWNERS = ['All', 'Micah', 'Dru', 'Sloane', 'Reid', 'Willow'];

function DraggableTaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onClick={onClick} />
    </div>
  );
}

function DroppableColumn({
  column,
  tasks,
  onTaskClick,
  isOver,
}: {
  column: Column;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  isOver: boolean;
}) {
  return (
    <div className="w-72 shrink-0 flex flex-col">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={cn('w-2.5 h-2.5 rounded-full', column.color)} />
        <span className="text-sm font-medium text-[var(--text-secondary)]">{column.label}</span>
        <span className="text-xs text-[var(--text-tertiary)] ml-auto">{tasks.length}</span>
      </div>

      {/* Cards */}
      <div
        className={cn(
          'flex-1 space-y-2 kanban-column overflow-y-auto rounded-lg transition-all',
          isOver && 'ring-2 ring-[var(--accent)]/50 bg-[var(--accent)]/5'
        )}
      >
        <SortableContext items={tasks.map(t => t.id)}>
          {tasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="text-xs text-[var(--text-tertiary)] text-center py-8 opacity-50">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard({ columns, grouped, allTasks }: KanbanBoardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [ownerFilter, setOwnerFilter] = useState('All');
  const [showDone, setShowDone] = useState(false);
  const [showParked, setShowParked] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [localGrouped, setLocalGrouped] = useState(grouped);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts (allows clicking)
      },
    })
  );

  const visibleColumns = columns.filter(col => {
    if (col.status === 'Done' && !showDone) return false;
    if (col.status === 'Parked' && !showParked) return false;
    return true;
  });

  const filteredGrouped = Object.fromEntries(
    Object.entries(localGrouped).map(([status, tasks]) => [
      status,
      ownerFilter === 'All' ? tasks : tasks.filter(t => t.owner === ownerFilter),
    ])
  );

  const handleTaskCreated = () => {
    router.refresh();
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id as string | null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    // Find the task and its current status
    let task: Task | undefined;
    let oldStatus: TaskStatus | undefined;

    for (const [status, tasks] of Object.entries(localGrouped)) {
      const found = tasks.find(t => t.id === taskId);
      if (found) {
        task = found;
        oldStatus = status as TaskStatus;
        break;
      }
    }

    if (!task || !oldStatus || oldStatus === newStatus) return;

    // Optimistic update
    const updatedGrouped = { ...localGrouped };
    updatedGrouped[oldStatus] = updatedGrouped[oldStatus].filter(t => t.id !== taskId);
    updatedGrouped[newStatus] = [...(updatedGrouped[newStatus] || []), { ...task, status: newStatus }];
    setLocalGrouped(updatedGrouped);

    // API call
    try {
      const response = await fetch(`/api/notion/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update task');

      showToast(`Moved to ${newStatus}`, 'success');
      router.refresh();
    } catch (error) {
      // Revert on error
      setLocalGrouped(localGrouped);
      showToast('Failed to move task', 'error');
      console.error('Error updating task:', error);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  const activeTask = activeId
    ? Object.values(localGrouped).flat().find(t => t.id === activeId)
    : null;

  return (
    <>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <Filter className="w-4 h-4 text-[var(--text-tertiary)]" />
        <div className="flex items-center gap-1">
          {OWNERS.map((owner) => (
            <button
              key={owner}
              onClick={() => setOwnerFilter(owner)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs transition-colors',
                ownerFilter === owner
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
              )}
            >
              {owner}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            New Task
          </button>
          <button
            onClick={() => setShowDone(!showDone)}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs transition-colors',
              showDone ? 'bg-green-500/20 text-green-400' : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]'
            )}
          >
            Done
          </button>
          <button
            onClick={() => setShowParked(!showParked)}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs transition-colors',
              showParked ? 'bg-zinc-500/20 text-zinc-400' : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]'
            )}
          >
            Parked
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            'fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-50 animate-in slide-in-from-top',
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          )}
        >
          {toast.message}
        </div>
      )}

      {/* Board + Activity Feed */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Kanban */}
        <div className="flex-1 overflow-x-auto">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="flex gap-4 h-full min-w-max pb-4">
              {visibleColumns.map((col) => {
                const tasks = filteredGrouped[col.status] || [];
                return (
                  <div key={col.status} id={col.status}>
                    <DroppableColumn
                      column={col}
                      tasks={tasks}
                      onTaskClick={setSelectedTask}
                      isOver={overId === col.status}
                    />
                  </div>
                );
              })}
            </div>

            <DragOverlay>
              {activeTask ? (
                <div style={{ cursor: 'grabbing', opacity: 0.8 }}>
                  <TaskCard task={activeTask} onClick={() => {}} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Activity Feed */}
        <ActivityFeed tasks={allTasks} />
      </div>

      {/* Task Detail Slide-over */}
      {selectedTask && (
        <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleTaskCreated}
        />
      )}
    </>
  );
}
