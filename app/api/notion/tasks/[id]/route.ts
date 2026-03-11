import { NextRequest, NextResponse } from 'next/server';
import { getTask, updateTask } from '@/lib/notion';
import { verifyOrigin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await getTask(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json(task);
  } catch (err) {
    console.error('[task] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // CSRF check for mutations
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const task = await updateTask(id, body);
    if (!task) {
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    console.log(`[AUDIT] task_updated | id: ${id} | fields: ${Object.keys(body).join(',')}`);
    return NextResponse.json(task);
  } catch (err) {
    console.error('[task] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
