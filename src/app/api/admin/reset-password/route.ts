import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, hashPassword } from '@/lib/auth';
import { getUserByUsername, updateUser } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: '请提供用户名' },
        { status: 400 }
      );
    }

    const user = await getUserByUsername(username);
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 将密码重置为与用户名相同
    const newPasswordHash = await hashPassword(username);
    await updateUser({
      ...user,
      passwordHash: newPasswordHash,
    });

    return NextResponse.json({
      success: true,
      message: `用户 ${username} 的密码已重置为用户名`,
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
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: '重置密码失败' },
      { status: 500 }
    );
  }
}
