'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getRoomsByStudio,
  getStudioById,
  createRoom,
  updateRoom,
  deleteRoom,
  type Room,
  type RoomInsert,
  type Studio,
} from '@/lib/db';

type RoomFormState = Omit<RoomInsert, 'studio_id'> & { studio_id?: string };

export default function StudioDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const studioId = params?.id;

  const [studio, setStudio] = useState<Studio | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RoomFormState>({
    name: '',
    room_number: '',
    notes: '',
  });

  useEffect(() => {
    if (!studioId) return;
    (async () => {
      try {
        const s = await getStudioById(String(studioId));
        if (!s) {
          setError('Studio not found');
          return;
        }
        setStudio(s);
        const r = await getRoomsByStudio(String(studioId));
        setRooms(r);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [studioId]);

  const resetForm = () => {
    setForm({ name: '', room_number: '', notes: '' });
    setEditingRoomId(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!studio) return;
    try {
      if (editingRoomId) {
        const updated = await updateRoom({
          id: editingRoomId,
          name: form.name || null,
          room_number: form.room_number || null,
          notes: form.notes || null,
        });
        setRooms((prev) =>
          prev.map((r) => (r.id === editingRoomId ? updated : r))
        );
      } else {
        const created = await createRoom({
          studio_id: studio.id,
          name: form.name || null,
          room_number: form.room_number || null,
          notes: form.notes || null,
        });
        setRooms((prev) => [created, ...prev]);
      }
      resetForm();
      setShowForm(false);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save room');
    }
  };

  const onEdit = (room: Room) => {
    setEditingRoomId(room.id);
    setShowForm(true);
    setForm({
      name: room.name ?? '',
      room_number: room.room_number ?? '',
      notes: room.notes ?? '',
    });
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this room?')) return;
    try {
      await deleteRoom(id);
      setRooms((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete room');
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/studios"
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:underline"
          >
            ← Back to studios
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {studio ? studio.name : 'Studio'}
          </h1>
          {studio && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {studio.address ?? '-'} • AM {studio.am_start_time ?? '-'} –{' '}
              {studio.am_end_time ?? '-'} • PM {studio.pm_start_time ?? '-'} –{' '}
              {studio.pm_end_time ?? '-'}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm((s) => !s);
          }}
          className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-3 py-1.5 text-sm font-medium hover:opacity-90"
        >
          {showForm ? 'Close' : 'Add Room'}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : (
        <>
          {showForm && (
            <form
              onSubmit={onSubmit}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <label className="text-sm">
                <span className="block text-zinc-700 dark:text-zinc-300">
                  Name
                </span>
                <input
                  className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
                  value={form.name || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </label>
              <label className="text-sm">
                <span className="block text-zinc-700 dark:text-zinc-300">
                  Room #
                </span>
                <input
                  className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
                  value={form.room_number || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, room_number: e.target.value }))
                  }
                />
              </label>
              <label className="md:col-span-3 text-sm">
                <span className="block text-zinc-700 dark:text-zinc-300">
                  Notes
                </span>
                <textarea
                  className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
                  value={form.notes || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={3}
                />
              </label>
              <div className="md:col-span-3 flex gap-3">
                <button
                  type="submit"
                  className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 text-sm font-medium"
                >
                  {editingRoomId ? 'Save changes' : 'Create room'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm"
                >
                  Clear
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Room #</th>
                  <th className="px-3 py-2 text-left font-medium">Notes</th>
                  <th className="px-3 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-zinc-200 dark:border-zinc-800"
                  >
                    <td className="px-3 py-2">{r.name ?? '-'}</td>
                    <td className="px-3 py-2">{r.room_number ?? '-'}</td>
                    <td className="px-3 py-2">{r.notes ?? '-'}</td>
                    <td className="px-3 py-2 text-right space-x-2">
                      <button
                        onClick={() => onEdit(r)}
                        className="rounded-md border border-zinc-300 dark:border-zinc-700 px-2 py-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(r.id)}
                        className="rounded-md border border-red-300 text-red-600 px-2 py-1"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
