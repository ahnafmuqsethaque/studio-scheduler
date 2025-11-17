'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  getStudios,
  createStudio,
  updateStudio,
  deleteStudio,
  type Studio,
  type StudioInsert,
} from '@/lib/db';

type StudioFormState = Omit<
  StudioInsert,
  'am_start_time' | 'am_end_time' | 'pm_start_time' | 'pm_end_time'
> & {
  am_start_time: string;
  am_end_time: string;
  pm_start_time: string;
  pm_end_time: string;
};

export default function StudiosPage() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StudioFormState>({
    name: '',
    address: '',
    notes: '',
    am_start_time: '',
    am_end_time: '',
    pm_start_time: '',
    pm_end_time: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const list = await getStudios();
        setStudios(list);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load studios');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const resetForm = () => {
    setForm({
      name: '',
      address: '',
      notes: '',
      am_start_time: '',
      am_end_time: '',
      pm_start_time: '',
      pm_end_time: '',
    });
    setEditingId(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload: StudioInsert = {
        name: form.name,
        address: form.address || null,
        notes: form.notes || null,
        am_start_time: form.am_start_time || null,
        am_end_time: form.am_end_time || null,
        pm_start_time: form.pm_start_time || null,
        pm_end_time: form.pm_end_time || null,
      };
      if (editingId) {
        const updated = await updateStudio({ id: editingId, ...payload });
        setStudios((prev) =>
          prev.map((s) => (s.id === editingId ? updated : s))
        );
      } else {
        const created = await createStudio(payload);
        setStudios((prev) => [created, ...prev]);
      }
      resetForm();
      setShowForm(false);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save studio');
    }
  };

  const onEdit = (studio: Studio) => {
    setEditingId(studio.id);
    setShowForm(true);
    setForm({
      name: studio.name,
      address: studio.address ?? '',
      notes: studio.notes ?? '',
      am_start_time: studio.am_start_time ?? '',
      am_end_time: studio.am_end_time ?? '',
      pm_start_time: studio.pm_start_time ?? '',
      pm_end_time: studio.pm_end_time ?? '',
    });
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this studio?')) return;
    try {
      await deleteStudio(id);
      setStudios((prev) => prev.filter((s) => s.id !== id));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete studio');
    }
  };

  const header = useMemo(
    () => (
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Studios
        </h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm((s) => !s);
          }}
          className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-3 py-1.5 text-sm font-medium hover:opacity-90"
        >
          {showForm ? 'Close' : 'Add Studio'}
        </button>
      </div>
    ),
    [showForm]
  );

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      {header}

      {showForm && (
        <form
          onSubmit={onSubmit}
          className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <label className="text-sm">
            <span className="block text-zinc-700 dark:text-zinc-300">Name</span>
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </label>
          <label className="text-sm">
            <span className="block text-zinc-700 dark:text-zinc-300">
              Address
            </span>
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
            />
          </label>
          <label className="text-sm">
            <span className="block text-zinc-700 dark:text-zinc-300">
              AM Start
            </span>
            <input
              type="time"
              className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
              value={form.am_start_time}
              onChange={(e) =>
                setForm((f) => ({ ...f, am_start_time: e.target.value }))
              }
            />
          </label>
          <label className="text-sm">
            <span className="block text-zinc-700 dark:text-zinc-300">
              AM End
            </span>
            <input
              type="time"
              className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
              value={form.am_end_time}
              onChange={(e) =>
                setForm((f) => ({ ...f, am_end_time: e.target.value }))
              }
            />
          </label>
          <label className="text-sm">
            <span className="block text-zinc-700 dark:text-zinc-300">
              PM Start
            </span>
            <input
              type="time"
              className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
              value={form.pm_start_time}
              onChange={(e) =>
                setForm((f) => ({ ...f, pm_start_time: e.target.value }))
              }
            />
          </label>
          <label className="text-sm">
            <span className="block text-zinc-700 dark:text-zinc-300">
              PM End
            </span>
            <input
              type="time"
              className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
              value={form.pm_end_time}
              onChange={(e) =>
                setForm((f) => ({ ...f, pm_end_time: e.target.value }))
              }
            />
          </label>
          <label className="md:col-span-2 text-sm">
            <span className="block text-zinc-700 dark:text-zinc-300">
              Notes
            </span>
            <textarea
              className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={3}
            />
          </label>
          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 text-sm font-medium"
            >
              {editingId ? 'Save changes' : 'Create studio'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm"
            >
              Clear
            </button>
          </div>
          {error && (
            <p className="md:col-span-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </form>
      )}

      {loading ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</p>
      ) : studios.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No studios yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Address</th>
                <th className="px-3 py-2 text-left font-medium">AM</th>
                <th className="px-3 py-2 text-left font-medium">PM</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {studios.map((s) => (
                <tr
                  key={s.id}
                  className="border-t border-zinc-200 dark:border-zinc-800"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/studios/${s.id}`}
                      className="text-zinc-900 dark:text-zinc-100 hover:underline"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{s.address ?? '-'}</td>
                  <td className="px-3 py-2">
                    {[s.am_start_time, s.am_end_time]
                      .filter(Boolean)
                      .join(' - ') || '-'}
                  </td>
                  <td className="px-3 py-2">
                    {[s.pm_start_time, s.pm_end_time]
                      .filter(Boolean)
                      .join(' - ') || '-'}
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button
                      onClick={() => onEdit(s)}
                      className="rounded-md border border-zinc-300 dark:border-zinc-700 px-2 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(s.id)}
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
      )}
    </div>
  );
}
