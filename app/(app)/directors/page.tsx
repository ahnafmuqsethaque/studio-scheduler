'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getDirectors,
  createDirector,
  updateDirector,
  deleteDirector,
  type Director,
  type DirectorInsert,
} from '@/lib/db';

type DirectorFormState = Omit<DirectorInsert, 'email' | 'phone' | 'notes'> & {
  email: string;
  phone: string;
  notes: string;
};

export default function DirectorsPage() {
  const [directors, setDirectors] = useState<Director[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DirectorFormState>({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const list = await getDirectors();
        setDirectors(list);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load directors');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      notes: '',
    });
    setEditingId(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload: DirectorInsert = {
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        notes: form.notes || null,
      };
      if (editingId) {
        const updated = await updateDirector({ id: editingId, ...payload });
        setDirectors((prev) =>
          prev.map((d) => (d.id === editingId ? updated : d))
        );
      } else {
        const created = await createDirector(payload);
        setDirectors((prev) => [created, ...prev]);
      }
      resetForm();
      setShowForm(false);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save director');
    }
  };

  const onEdit = (director: Director) => {
    setEditingId(director.id);
    setShowForm(true);
    setForm({
      name: director.name,
      email: director.email ?? '',
      phone: director.phone ?? '',
      notes: director.notes ?? '',
    });
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this director?')) return;
    try {
      await deleteDirector(id);
      setDirectors((prev) => prev.filter((d) => d.id !== id));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete director');
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Directors
        </h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm((s) => !s);
          }}
          className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-3 py-1.5 text-sm font-medium hover:opacity-90"
        >
          {showForm ? 'Close' : 'Add Director'}
        </button>
      </div>

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
              Email
            </span>
            <input
              type="email"
              className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </label>
          <label className="text-sm">
            <span className="block text-zinc-700 dark:text-zinc-300">
              Phone
            </span>
            <input
              type="tel"
              className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
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
              {editingId ? 'Save changes' : 'Create director'}
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
      ) : directors.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No directors yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Email</th>
                <th className="px-3 py-2 text-left font-medium">Phone</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {directors.map((d) => (
                <tr
                  key={d.id}
                  className="border-t border-zinc-200 dark:border-zinc-800"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/directors/${d.id}`}
                      className="text-zinc-900 dark:text-zinc-100 hover:underline"
                    >
                      {d.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{d.email ?? '-'}</td>
                  <td className="px-3 py-2">{d.phone ?? '-'}</td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button
                      onClick={() => onEdit(d)}
                      className="rounded-md border border-zinc-300 dark:border-zinc-700 px-2 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(d.id)}
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
