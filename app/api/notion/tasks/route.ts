import { NextRequest, NextResponse } from 'next/server';
import { getTasks, createTask, getDashboardStats } from '@/lib/notion';
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
  } catch (error) {
    console.error('Notion API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const task = await createTask(body);
    if (!task) {
      return NextResponse.json(
        { error: 'Failed to create task' },
        { status: 500 }
      );
    }
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Notion API error:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
