import { Columns3 } from 'lucide-react';
import { getTasks } from '@/lib/notion';
import type { Task, TaskStatus } from '@/lib/types';
import KanbanBoard from './kanban-board';

export const revalidate = 30;

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'Inbox', label: 'Inbox', color: 'bg-zinc-500' },
  { status: 'To Do', label: 'To Do', color: 'bg-blue-500' },
  { status: 'In Progress', label: 'In Progress', color: 'bg-amber-500' },
  { status: 'Review', label: 'Review', color: 'bg-purple-500' },
  { status: 'Commit', label: 'Commit', color: 'bg-emerald-500' },
  { status: 'Done', label: 'Done', color: 'bg-green-500' },
  { status: 'Parked', label: 'Parked', color: 'bg-zinc-600' },
];

export default async function CommandCenterPage() {
  let tasks: Task[] = [];
  let error = null;

  try {
    tasks = await getTasks();
  } catch (e) {
    error = 'Unable to connect to Notion.';
    console.error(e);
  }

  // Group tasks by status
  const grouped: Record<string, Task[]> = {};
  for (const col of COLUMNS) {
    grouped[col.status] = tasks.filter(t => t.status === col.status);
  }

  return (
    <div className="p-8 h-screen flex flex-col">
      {/* Header */}
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2.5">
          <Columns3 className="w-6 h-6 text-[var(--accent)]" />
          Command Center
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          {tasks.length} tasks across {COLUMNS.length} columns
        </p>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-red-400 text-sm">
          {error}
        </div>
      ) : (
        <KanbanBoard columns={COLUMNS} grouped={grouped} allTasks={tasks} />
      )}
    </div>
  );
}
