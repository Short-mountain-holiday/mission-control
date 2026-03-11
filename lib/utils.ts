import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date);
}

export function getOwnerColor(owner: string | null): string {
  const colors: Record<string, string> = {
    'Micah': 'bg-blue-500',
    'Dru': 'bg-emerald-500',
    'Sloane': 'bg-purple-500',
    'Reid': 'bg-amber-500',
    'Willow': 'bg-rose-500',
    'Ryan': 'bg-cyan-500',
    'Geoff': 'bg-orange-500',
    'Amber': 'bg-pink-500',
    'Justin': 'bg-indigo-500',
  };
  return colors[owner || ''] || 'bg-zinc-500';
}

export function getOwnerInitial(owner: string | null): string {
  if (!owner) return '?';
  return owner.charAt(0).toUpperCase();
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'Inbox': 'text-zinc-400',
    'To Do': 'text-blue-400',
    'In Progress': 'text-amber-400',
    'Review': 'text-purple-400',
    'Commit': 'text-emerald-400',
    'Done': 'text-green-400',
    'Parked': 'text-zinc-500',
  };
  return colors[status] || 'text-zinc-400';
}

export function getPriorityIcon(priority: string | null): string {
  const icons: Record<string, string> = {
    'P1': '🔴',
    'P2': '🟠',
    'P3': '🟡',
    'P4': '⚪',
  };
  return icons[priority || ''] || '';
}

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}
