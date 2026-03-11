// ============================================================
// SMH Mission Control — Type Definitions
// ============================================================

export type TaskStatus = 'Inbox' | 'To Do' | 'In Progress' | 'Review' | 'Commit' | 'Done' | 'Parked';
export type TaskPriority = 'P1' | 'P2' | 'P3' | 'P4' | null;
export type TaskOwner = 'Micah' | 'Dru' | 'Sloane' | 'Reid' | 'Willow' | 'Ryan' | 'Geoff' | 'Amber' | 'Justin' | 'Claude Code' | null;

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  owner: TaskOwner;
  priority: TaskPriority;
  category: string | null;
  dueDate: string | null;
  notes: string | null;
  property: string | null;
  source: string | null;
  phase: string | null;
  createdTime: string;
  lastEditedTime: string;
}

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  lastRun?: {
    time: string;
    status: 'success' | 'error' | 'timeout';
    duration?: number;
  };
  nextRun?: string;
  description?: string;
}

export interface Agent {
  name: string;
  role: string;
  title: string;
  status: 'active' | 'parked' | 'idle';
  currentFocus?: string;
  owns: string[];
  reportsTo?: string;
  avatar: string; // emoji or initials
  color: string;
}

export interface MemoryEntry {
  date: string;
  content: string;
  sections: { title: string; content: string }[];
}

export interface Doc {
  name: string;
  path: string;
  category: string;
  lastModified: string;
  size: number;
  content?: string;
}

export interface ActivityItem {
  id: string;
  type: 'task_created' | 'task_moved' | 'task_completed' | 'cron_run' | 'agent_action';
  title: string;
  description: string;
  agent?: string;
  timestamp: string;
}

export interface DashboardStats {
  totalTasks: number;
  inProgress: number;
  overdue: number;
  completedThisWeek: number;
  inbox: number;
  activeCronJobs: number;
}
