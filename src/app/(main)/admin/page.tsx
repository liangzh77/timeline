'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';

interface UserInfo {
  id: string;
  username: string;
  isAdmin: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user && !user.isAdmin) {
      router.push('/events');
      return;
    }

    fetchUsers();
  }, [user, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    setResetting(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: selectedUser.username }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setMessage(data.message);
      setTimeout(() => {
        setShowResetModal(false);
        setSelectedUser(null);
        setMessage('');
      }, 2000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '重置失败');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">管理员面板</h1>
      <p className="text-gray-500 mb-6">管理用户账户</p>

      {/* Users List */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">用户列表</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {users.map((u) => (
            <div
              key={u.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-700">
                    {u.username[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{u.username}</p>
                  <p className="text-sm text-gray-500">
                    注册于 {new Date(u.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  u.isAdmin
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {u.isAdmin ? '管理员' : '普通用户'}
                </span>
                {!u.isAdmin && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(u);
                      setShowResetModal(true);
                    }}
                  >
                    重置密码
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Reset Password Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => {
          setShowResetModal(false);
          setSelectedUser(null);
          setMessage('');
        }}
        title="重置用户密码"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            确定要将用户 <strong>{selectedUser?.username}</strong> 的密码重置为与用户名相同吗？
          </p>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('成功')
                ? 'bg-green-50 text-green-600'
                : 'bg-red-50 text-red-600'
            }`}>
              {message}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowResetModal(false);
                setSelectedUser(null);
                setMessage('');
              }}
            >
              取消
            </Button>
            <Button
              variant="danger"
              loading={resetting}
              onClick={handleResetPassword}
            >
              确认重置
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
