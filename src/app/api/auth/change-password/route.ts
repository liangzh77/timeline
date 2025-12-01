import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, verifyPassword, hashPassword } from '@/lib/auth';
import { updateUser } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    const { oldPassword, newPassword } = await request.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: '请输入旧密码和新密码' },
        { status: 400 }
      );
    }

    if (newPassword.length < 4) {
      return NextResponse.json(
        { error: '新密码长度至少4个字符' },
        { status: 400 }
      );
    }

    // 验证旧密码
    const isValid = await verifyPassword(oldPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: '旧密码错误' },
        { status: 400 }
      );
    }

    // 更新密码
    const newPasswordHash = await hashPassword(newPassword);
    await updateUser({
      ...user,
      passwordHash: newPasswordHash,
    });

    return NextResponse.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: '修改密码失败，请稍后重试' },
      { status: 500 }
    );
  }
}
