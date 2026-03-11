import { NextRequest, NextResponse } from 'next/server';
import { getTasks, createTask, getDashboardStats } from '@/lib/notion';
import { verifyOrigin } from '@/lib/auth';
import type { TaskStatus } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as TaskStatus | null;
    const owner = searchParams.get('owner');
    const excludeDone = searchParams.get('excludeDone') === 'true';
    const stats = searchParams.get('stats') === 'true';

    if (stats) {
      const dashStats = await getDashboardStats();
      return NextResponse.json(dashStats);
    }

    const tasks = await getTasks({
      status: status || undefined,
      owner: owner || undefined,
      excludeDone,
    });
    return NextResponse.json(tasks);
  } catch (err) {
    console.error('[tasks] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // CSRF check for mutations
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();

    // Basic validation
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 3) {
      return NextResponse.json({ error: 'Task name required (min 3 chars)' }, { status: 400 });
    }

    const task = await createTask(body);
    if (!task) {
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    console.log(`[AUDIT] task_created | name: ${body.title}`);
    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error('[tasks] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
