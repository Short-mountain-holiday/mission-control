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

export default function KanbanBoard({ columns, grouped, allTasks }: KanbanBoardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [ownerFilter, setOwnerFilter] = useState('All');
  const [showDone, setShowDone] = useState(false);
  const [showParked, setShowParked] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();

  const visibleColumns = columns.filter(col => {
    if (col.status === 'Done' && !showDone) return false;
    if (col.status === 'Parked' && !showParked) return false;
    return true;
  });

  const filteredGrouped = Object.fromEntries(
    Object.entries(grouped).map(([status, tasks]) => [
      status,
      ownerFilter === 'All' ? tasks : tasks.filter(t => t.owner === ownerFilter),
    ])
  );

  const handleTaskCreated = () => {
    router.refresh();
  };

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

      {/* Board + Activity Feed */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Kanban */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 h-full min-w-max pb-4">
            {visibleColumns.map((col) => {
              const tasks = filteredGrouped[col.status] || [];
              return (
                <div key={col.status} className="w-72 shrink-0 flex flex-col">
                  {/* Column header */}
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className={cn('w-2.5 h-2.5 rounded-full', col.color)} />
                    <span className="text-sm font-medium text-[var(--text-secondary)]">{col.label}</span>
                    <span className="text-xs text-[var(--text-tertiary)] ml-auto">{tasks.length}</span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 space-y-2 kanban-column overflow-y-auto">
                    {tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => setSelectedTask(task)}
                      />
                    ))}
                    {tasks.length === 0 && (
                      <div className="text-xs text-[var(--text-tertiary)] text-center py-8 opacity-50">
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
