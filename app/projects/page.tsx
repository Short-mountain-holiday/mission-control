import { FolderKanban } from 'lucide-react';
import { getTasks } from '@/lib/notion';
import type { Task } from '@/lib/types';
import ProjectGrid from './project-grid';

export const revalidate = 60;

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

function deriveProjects(tasks: Task[]): Project[] {
  // Group by Category
  const groups = new Map<string, Task[]>();

  for (const task of tasks) {
    const cat = task.category || 'Uncategorized';
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(task);
  }

  const projects: Project[] = [];
  for (const [name, catTasks] of groups) {
    const done = catTasks.filter(t => t.status === 'Done').length;
    const inProgress = catTasks.filter(t => t.status === 'In Progress').length;
    const todo = catTasks.filter(t => t.status === 'To Do' || t.status === 'Inbox').length;
    const parked = catTasks.filter(t => t.status === 'Parked').length;
    const total = catTasks.length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;

    // Determine project status
    let status: 'active' | 'paused' | 'complete';
    if (done === total) {
      status = 'complete';
    } else if (parked === total - done) {
      status = 'paused';
    } else {
      status = 'active';
    }

    // Most common owner
    const ownerCounts = new Map<string, number>();
    catTasks.forEach(t => {
      const o = t.owner || 'Unassigned';
      ownerCounts.set(o, (ownerCounts.get(o) || 0) + 1);
    });
    const owner = [...ownerCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unassigned';

    projects.push({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      status,
      progress,
      totalTasks: total,
      completedTasks: done,
      inProgressTasks: inProgress,
      todoTasks: todo,
      parkedTasks: parked,
      owner,
      tasks: catTasks.sort((a, b) => new Date(b.lastEditedTime).getTime() - new Date(a.lastEditedTime).getTime()),
    });
  }

  // Sort: active first, then by progress (least first), then by task count
  return projects.sort((a, b) => {
    const statusOrder = { active: 0, paused: 1, complete: 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return a.progress - b.progress;
  });
}

export default async function ProjectsPage() {
  let projects: Project[] = [];
  let error = null;

  try {
    const tasks = await getTasks();
    projects = deriveProjects(tasks);
  } catch (e) {
    error = 'Unable to connect to Notion.';
    console.error(e);
  }

  const activeCount = projects.filter(p => p.status === 'active').length;
  const totalTasks = projects.reduce((s, p) => s + p.totalTasks, 0);

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2.5">
          <FolderKanban className="w-6 h-6 text-[var(--accent)]" />
          Projects
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          {activeCount} active projects • {totalTasks} total tasks
        </p>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-red-400 text-sm">
          {error}
        </div>
      ) : (
        <ProjectGrid projects={projects} />
      )}
    </div>
  );
}
