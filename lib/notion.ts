import type { Task, TaskStatus, TaskOwner, TaskPriority } from './types';

const NOTION_API_KEY = process.env.NOTION_API_KEY || '';
const COMMAND_CENTER_DB = 'a66999eb-0c71-4806-8bbd-cdc19429fa67';
const NOTION_VERSION = '2022-06-28';

// Direct REST API calls — simpler and more reliable than SDK v5 breaking changes

async function notionFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(`https://api.notion.com/v1${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Notion API error ${res.status}: ${text}`);
  }
  return res.json();
}

// Helper to safely extract Notion property values
function getSelect(page: any, prop: string): string | null {
  const p = page.properties[prop];
  if (!p) return null;
  if (p.type === 'select' && p.select) return p.select.name;
  if (p.type === 'multi_select') return p.multi_select?.map((s: any) => s.name).join(', ') || null;
  return null;
}

function getTitle(page: any, prop: string): string {
  const p = page.properties[prop];
  if (!p) return 'Untitled';
  if (p.type === 'title') return p.title?.map((t: any) => t.plain_text).join('') || 'Untitled';
  return 'Untitled';
}

function getRichText(page: any, prop: string): string | null {
  const p = page.properties[prop];
  if (!p) return null;
  if (p.type === 'rich_text') return p.rich_text?.map((t: any) => t.plain_text).join('') || null;
  return null;
}

function getDate(page: any, prop: string): string | null {
  const p = page.properties[prop];
  if (!p || p.type !== 'date' || !p.date) return null;
  return p.date.start;
}

function pageToTask(page: any): Task {
  return {
    id: page.id,
    title: getTitle(page, 'Task'),
    status: (getSelect(page, 'Status') || 'Inbox') as TaskStatus,
    owner: getSelect(page, 'Owner') as TaskOwner,
    priority: getSelect(page, 'Priority') as TaskPriority,
    category: getSelect(page, 'Category'),
    dueDate: getDate(page, 'Due Date'),
    notes: getRichText(page, 'Notes'),
    property: getSelect(page, 'Property'),
    source: getSelect(page, 'Source'),
    phase: getSelect(page, 'Phase'),
    createdTime: page.created_time,
    lastEditedTime: page.last_edited_time,
  };
}

export async function getTasks(filter?: {
  status?: TaskStatus;
  owner?: string;
  excludeDone?: boolean;
}): Promise<Task[]> {
  const filters: any[] = [];

  if (filter?.status) {
    filters.push({
      property: 'Status',
      select: { equals: filter.status },
    });
  }

  if (filter?.owner) {
    filters.push({
      property: 'Owner',
      select: { equals: filter.owner },
    });
  }

  if (filter?.excludeDone) {
    filters.push({
      property: 'Status',
      select: { does_not_equal: 'Done' },
    });
  }

  const body: any = {
    sorts: [
      { property: 'Status', direction: 'ascending' },
      { property: 'Priority', direction: 'ascending' },
    ],
  };

  if (filters.length === 1) {
    body.filter = filters[0];
  } else if (filters.length > 1) {
    body.filter = { and: filters };
  }

  // Paginate through all results
  let allResults: any[] = [];
  let hasMore = true;
  let startCursor: string | undefined;

  while (hasMore) {
    const query: any = { ...body };
    if (startCursor) query.start_cursor = startCursor;

    const response = await notionFetch(`/databases/${COMMAND_CENTER_DB}/query`, {
      method: 'POST',
      body: JSON.stringify(query),
    });

    allResults = allResults.concat(response.results);
    hasMore = response.has_more;
    startCursor = response.next_cursor;
  }

  return allResults.map(pageToTask);
}

export async function getTask(id: string): Promise<Task | null> {
  try {
    const page = await notionFetch(`/pages/${id}`);
    return pageToTask(page);
  } catch {
    return null;
  }
}

export async function updateTask(id: string, updates: {
  title?: string;
  status?: TaskStatus;
  owner?: TaskOwner;
  priority?: TaskPriority;
  category?: string;
  dueDate?: string;
  notes?: string;
}): Promise<Task | null> {
  try {
    const properties: any = {};

    if (updates.title) {
      properties['Task'] = {
        title: [{ text: { content: updates.title } }],
      };
    }
    if (updates.status) {
      properties['Status'] = { select: { name: updates.status } };
    }
    if (updates.owner !== undefined) {
      properties['Owner'] = updates.owner ? { select: { name: updates.owner } } : { select: null };
    }
    if (updates.priority !== undefined) {
      properties['Priority'] = updates.priority ? { select: { name: updates.priority } } : { select: null };
    }
    if (updates.category !== undefined) {
      properties['Category'] = updates.category ? { select: { name: updates.category } } : { select: null };
    }
    if (updates.dueDate !== undefined) {
      properties['Due Date'] = updates.dueDate ? { date: { start: updates.dueDate } } : { date: null };
    }
    if (updates.notes !== undefined) {
      properties['Notes'] = {
        rich_text: updates.notes ? [{ text: { content: updates.notes } }] : [],
      };
    }

    const page = await notionFetch(`/pages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties }),
    });
    return pageToTask(page);
  } catch {
    return null;
  }
}

export async function createTask(task: {
  title: string;
  status?: TaskStatus;
  owner?: TaskOwner;
  priority?: TaskPriority;
  category?: string;
  dueDate?: string;
  notes?: string;
}): Promise<Task | null> {
  try {
    const properties: any = {
      'Task': {
        title: [{ text: { content: task.title } }],
      },
    };

    if (task.status) properties['Status'] = { select: { name: task.status } };
    if (task.owner) properties['Owner'] = { select: { name: task.owner } };
    if (task.priority) properties['Priority'] = { select: { name: task.priority } };
    if (task.category) properties['Category'] = { select: { name: task.category } };
    if (task.dueDate) properties['Due Date'] = { date: { start: task.dueDate } };
    if (task.notes) {
      properties['Notes'] = {
        rich_text: [{ text: { content: task.notes } }],
      };
    }

    const page = await notionFetch('/pages', {
      method: 'POST',
      body: JSON.stringify({
        parent: { database_id: COMMAND_CENTER_DB },
        properties,
      }),
    });
    return pageToTask(page);
  } catch {
    return null;
  }
}

export async function getDashboardStats() {
  const allTasks = await getTasks();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  return {
    totalTasks: allTasks.length,
    inProgress: allTasks.filter(t => t.status === 'In Progress').length,
    overdue: allTasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done' && t.status !== 'Parked').length,
    completedThisWeek: allTasks.filter(t => t.status === 'Done' && new Date(t.lastEditedTime) >= weekAgo).length,
    inbox: allTasks.filter(t => t.status === 'Inbox').length,
    byStatus: {
      'Inbox': allTasks.filter(t => t.status === 'Inbox').length,
      'To Do': allTasks.filter(t => t.status === 'To Do').length,
      'In Progress': allTasks.filter(t => t.status === 'In Progress').length,
      'Review': allTasks.filter(t => t.status === 'Review').length,
      'Commit': allTasks.filter(t => t.status === 'Commit').length,
      'Done': allTasks.filter(t => t.status === 'Done').length,
      'Parked': allTasks.filter(t => t.status === 'Parked').length,
    },
    byOwner: allTasks.reduce((acc, t) => {
      const owner = t.owner || 'Unassigned';
      acc[owner] = (acc[owner] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}
