'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { Event, Occurrence } from '@/lib/types';

function formatOccurrenceTime(occ: Occurrence): string {
  const parts: string[] = [];
  if (occ.year !== undefined) parts.push(`${occ.year}年`);
  if (occ.month !== undefined) parts.push(`${occ.month}月`);
  if (occ.day !== undefined) parts.push(`${occ.day}日`);
  if (occ.hour !== undefined) parts.push(`${occ.hour}时`);
  if (occ.minute !== undefined) parts.push(`${occ.minute}分`);
  if (occ.second !== undefined) parts.push(`${occ.second}秒`);
  return parts.join('') || '未设置时间';
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [editingOccurrence, setEditingOccurrence] = useState<Occurrence | null>(null);

  // 时间筛选
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredCount, setFilteredCount] = useState<number | null>(null);

  // 新增/编辑发生记录
  const [occForm, setOccForm] = useState({
    year: '',
    month: '',
    day: '',
    hour: '',
    minute: '',
    second: '',
    note: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 编辑事项
  const [editEventName, setEditEventName] = useState('');
  const [editEventDescription, setEditEventDescription] = useState('');

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/events/${id}`);
      if (res.ok) {
        const data = await res.json();
        setEvent(data.event);
        setEditEventName(data.event.name);
        setEditEventDescription(data.event.description || '');
      } else if (res.status === 404) {
        router.push('/events');
      }
    } catch (err) {
      console.error('Failed to fetch event:', err);
    }
  };

  const fetchOccurrences = async () => {
    try {
      const res = await fetch(`/api/events/${id}/occurrences`);
      if (res.ok) {
        const data = await res.json();
        setOccurrences(data.occurrences);
      }
    } catch (err) {
      console.error('Failed to fetch occurrences:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
    fetchOccurrences();
  }, [id]);

  const resetOccForm = () => {
    // 默认填入当前时间
    const now = new Date();
    setOccForm({
      year: now.getFullYear().toString(),
      month: (now.getMonth() + 1).toString(),
      day: now.getDate().toString(),
      hour: now.getHours().toString(),
      minute: now.getMinutes().toString(),
      second: now.getSeconds().toString(),
      note: '',
    });
  };

  const handleAddOccurrence = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const body: Record<string, unknown> = {};
      if (occForm.year) body.year = parseInt(occForm.year);
      if (occForm.month) body.month = parseInt(occForm.month);
      if (occForm.day) body.day = parseInt(occForm.day);
      if (occForm.hour) body.hour = parseInt(occForm.hour);
      if (occForm.minute) body.minute = parseInt(occForm.minute);
      if (occForm.second) body.second = parseInt(occForm.second);
      if (occForm.note) body.note = occForm.note;

      const res = await fetch(`/api/events/${id}/occurrences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setOccurrences([data.occurrence, ...occurrences]);
      setShowAddModal(false);
      resetOccForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加失败');
    } finally {
      setSaving(false);
    }
  };

  const handleEditOccurrence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOccurrence) return;
    setError('');
    setSaving(true);

    try {
      const body: Record<string, unknown> = {};
      if (occForm.year) body.year = parseInt(occForm.year);
      if (occForm.month) body.month = parseInt(occForm.month);
      if (occForm.day) body.day = parseInt(occForm.day);
      if (occForm.hour) body.hour = parseInt(occForm.hour);
      if (occForm.minute) body.minute = parseInt(occForm.minute);
      if (occForm.second) body.second = parseInt(occForm.second);
      if (occForm.note) body.note = occForm.note;

      const res = await fetch(`/api/occurrences/${editingOccurrence.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setOccurrences(occurrences.map(o =>
        o.id === editingOccurrence.id ? data.occurrence : o
      ));
      setShowEditModal(false);
      setEditingOccurrence(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOccurrence = async (occId: string) => {
    if (!confirm('确定要删除这条发生记录吗？')) return;

    try {
      const res = await fetch(`/api/occurrences/${occId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setOccurrences(occurrences.filter(o => o.id !== occId));
      }
    } catch (err) {
      console.error('Failed to delete occurrence:', err);
    }
  };

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editEventName,
          description: editEventDescription,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setEvent(data.event);
      setShowEditEventModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!confirm('确定要删除这个事项吗？所有发生记录也会被删除。')) return;

    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/events');
      }
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  const handleStats = async () => {
    if (!startDate || !endDate) {
      setError('请选择时间范围');
      return;
    }

    try {
      const res = await fetch(
        `/api/events/${id}/occurrences?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await res.json();

      if (res.ok) {
        setFilteredCount(data.total);
        setOccurrences(data.occurrences);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const clearFilter = () => {
    setStartDate('');
    setEndDate('');
    setFilteredCount(null);
    fetchOccurrences();
  };

  const openEditOccurrence = (occ: Occurrence) => {
    setEditingOccurrence(occ);
    setOccForm({
      year: occ.year?.toString() || '',
      month: occ.month?.toString() || '',
      day: occ.day?.toString() || '',
      hour: occ.hour?.toString() || '',
      minute: occ.minute?.toString() || '',
      second: occ.second?.toString() || '',
      note: occ.note || '',
    });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div>
      {/* Back Link */}
      <Link
        href="/events"
        className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-4"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回列表
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
          {event.description && (
            <p className="text-gray-500 mt-1">{event.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowStatsModal(true)}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            统计
          </Button>
          <Button variant="ghost" onClick={() => setShowEditEventModal(true)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Button>
          <Button
            onClick={() => {
              resetOccForm();
              setShowAddModal(true);
            }}
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加发生
          </Button>
        </div>
      </div>

      {/* Filter Info */}
      {filteredCount !== null && (
        <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <p className="text-blue-700">
              {startDate} 至 {endDate} 期间共有 <strong>{filteredCount}</strong> 次发生
            </p>
            <Button variant="ghost" size="sm" onClick={clearFilter}>
              清除筛选
            </Button>
          </div>
        </Card>
      )}

      {/* Occurrences List */}
      {occurrences.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">还没有发生记录</h3>
          <p className="text-gray-500 mb-4">点击"添加发生"记录一次</p>
          <Button
            onClick={() => {
              resetOccForm();
              setShowAddModal(true);
            }}
          >
            记录第一次发生
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {occurrences.map((occ) => (
            <Card key={occ.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {formatOccurrenceTime(occ)}
                  </p>
                  {occ.note && (
                    <p className="text-sm text-gray-500 mt-1">{occ.note}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditOccurrence(occ)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteOccurrence(occ.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Occurrence Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="添加发生记录"
      >
        <form onSubmit={handleAddOccurrence} className="space-y-4">
          <p className="text-sm text-gray-500 mb-4">
            可以只填写部分时间，例如只填年月日，或者只填年月
          </p>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="年"
              type="number"
              value={occForm.year}
              onChange={(e) => setOccForm({ ...occForm, year: e.target.value })}
              placeholder="2024"
            />
            <Input
              label="月"
              type="number"
              min="1"
              max="12"
              value={occForm.month}
              onChange={(e) => setOccForm({ ...occForm, month: e.target.value })}
              placeholder="1-12"
            />
            <Input
              label="日"
              type="number"
              min="1"
              max="31"
              value={occForm.day}
              onChange={(e) => setOccForm({ ...occForm, day: e.target.value })}
              placeholder="1-31"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="时"
              type="number"
              min="0"
              max="23"
              value={occForm.hour}
              onChange={(e) => setOccForm({ ...occForm, hour: e.target.value })}
              placeholder="0-23"
            />
            <Input
              label="分"
              type="number"
              min="0"
              max="59"
              value={occForm.minute}
              onChange={(e) => setOccForm({ ...occForm, minute: e.target.value })}
              placeholder="0-59"
            />
            <Input
              label="秒"
              type="number"
              min="0"
              max="59"
              value={occForm.second}
              onChange={(e) => setOccForm({ ...occForm, second: e.target.value })}
              placeholder="0-59"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              备注（可选）
            </label>
            <textarea
              value={occForm.note}
              onChange={(e) => setOccForm({ ...occForm, note: e.target.value })}
              placeholder="添加一些备注..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 resize-none"
              rows={2}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAddModal(false)}
            >
              取消
            </Button>
            <Button type="submit" loading={saving}>
              添加
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Occurrence Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingOccurrence(null);
        }}
        title="编辑发生记录"
      >
        <form onSubmit={handleEditOccurrence} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="年"
              type="number"
              value={occForm.year}
              onChange={(e) => setOccForm({ ...occForm, year: e.target.value })}
              placeholder="2024"
            />
            <Input
              label="月"
              type="number"
              min="1"
              max="12"
              value={occForm.month}
              onChange={(e) => setOccForm({ ...occForm, month: e.target.value })}
              placeholder="1-12"
            />
            <Input
              label="日"
              type="number"
              min="1"
              max="31"
              value={occForm.day}
              onChange={(e) => setOccForm({ ...occForm, day: e.target.value })}
              placeholder="1-31"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="时"
              type="number"
              min="0"
              max="23"
              value={occForm.hour}
              onChange={(e) => setOccForm({ ...occForm, hour: e.target.value })}
              placeholder="0-23"
            />
            <Input
              label="分"
              type="number"
              min="0"
              max="59"
              value={occForm.minute}
              onChange={(e) => setOccForm({ ...occForm, minute: e.target.value })}
              placeholder="0-59"
            />
            <Input
              label="秒"
              type="number"
              min="0"
              max="59"
              value={occForm.second}
              onChange={(e) => setOccForm({ ...occForm, second: e.target.value })}
              placeholder="0-59"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              备注（可选）
            </label>
            <textarea
              value={occForm.note}
              onChange={(e) => setOccForm({ ...occForm, note: e.target.value })}
              placeholder="添加一些备注..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 resize-none"
              rows={2}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowEditModal(false);
                setEditingOccurrence(null);
              }}
            >
              取消
            </Button>
            <Button type="submit" loading={saving}>
              保存
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        isOpen={showEditEventModal}
        onClose={() => setShowEditEventModal(false)}
        title="编辑事项"
      >
        <form onSubmit={handleEditEvent} className="space-y-4">
          <Input
            label="事项名称"
            value={editEventName}
            onChange={(e) => setEditEventName(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述（可选）
            </label>
            <textarea
              value={editEventDescription}
              onChange={(e) => setEditEventDescription(e.target.value)}
              placeholder="添加一些描述..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 resize-none"
              rows={3}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteEvent}
            >
              删除事项
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowEditEventModal(false)}
              >
                取消
              </Button>
              <Button type="submit" loading={saving}>
                保存
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Stats Modal */}
      <Modal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        title="统计发生次数"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            选择时间范围，统计这段时间内的发生次数
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="开始日期"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="结束日期"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowStatsModal(false)}
            >
              取消
            </Button>
            <Button
              onClick={() => {
                handleStats();
                setShowStatsModal(false);
              }}
            >
              查询
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
