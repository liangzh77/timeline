import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername, createUser } from '@/lib/db';
import { hashPassword, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    if (username.length < 2 || username.length > 20) {
      return NextResponse.json(
        { error: '用户名长度需在2-20个字符之间' },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: '密码长度至少4个字符' },
        { status: 400 }
      );
    }

    // 检查用户名是否已存在
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return NextResponse.json(
        { error: '用户名已存在' },
        { status: 400 }
      );
    }

    // 创建用户
    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();
    const user = {
      id: userId,
      username,
      passwordHash,
      isAdmin: false,
      createdAt: new Date().toISOString(),
    };

    await createUser(user);

    // 设置认证 cookie
    await setAuthCookie({
      userId: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
