import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getAllUsers } from '@/lib/db';

export async function GET() {
  try {
    await requireAdmin();

    const users = await getAllUsers();

    return NextResponse.json({
      users: users.map(u => ({
        id: u.id,
        username: u.username,
        isAdmin: u.isAdmin,
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: '未登录' }, { status: 401 });
      }
      if (error.message === 'Forbidden') {
        return NextResponse.json({ error: '无权限' }, { status: 403 });
      }
    }
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: '获取用户列表失败' },
      { status: 500 }
    );
  }
}
