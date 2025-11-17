'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  getVoiceActors,
  createVoiceActor,
  updateVoiceActor,
  deleteVoiceActor,
  type VoiceActor,
  type VoiceActorInsert,
} from '@/lib/db';

type VoiceActorFormState = Omit<
  VoiceActorInsert,
  'phone' | 'code' | 'dietary_notes' | 'notes'
> & {
  phone: string;
  code: string;
  dietary_notes: string;
  notes: string;
};

export default function VoiceActorsPage() {
  const [voiceActors, setVoiceActors] = useState<VoiceActor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VoiceActorFormState>({
    name: '',
    email: '',
    phone: '',
    code: '',
    dietary_notes: '',
    notes: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const list = await getVoiceActors();
        setVoiceActors(list);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load voice actors');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredVoiceActors = useMemo(() => {
    if (!searchQuery.trim()) return voiceActors;
    const q = searchQuery.toLowerCase();
    return voiceActors.filter(
      (va) =>
        va.name.toLowerCase().includes(q) ||
        va.code?.toLowerCase().includes(q) ||
        va.email.toLowerCase().includes(q)
    );
  }, [voiceActors, searchQuery]);

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      code: '',
      dietary_notes: '',
      notes: '',
    });
    setEditingId(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload: VoiceActorInsert = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        code: form.code || null,
        dietary_notes: form.dietary_notes || null,
        notes: form.notes || null,
      };
      if (editingId) {
        const updated = await updateVoiceActor({ id: editingId, ...payload });
        setVoiceActors((prev) =>
          prev.map((va) => (va.id === editingId ? updated : va))
        );
      } else {
        const created = await createVoiceActor(payload);
        setVoiceActors((prev) => [created, ...prev]);
      }
      resetForm();
      setShowForm(false);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save voice actor');
    }
  };

  const onEdit = (va: VoiceActor) => {
    setEditingId(va.id);
    setShowForm(true);
    setForm({
      name: va.name,
      email: va.email,
      phone: va.phone ?? '',
      code: va.code ?? '',
      dietary_notes: va.dietary_notes ?? '',
      notes: va.notes ?? '',
    });
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this voice actor?')) return;
    try {
      await deleteVoiceActor(id);
      setVoiceActors((prev) => prev.filter((va) => va.id !== id));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete voice actor');
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Voice Actors
        </h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm((s) => !s);
          }}
          className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-3 py-1.5 text-sm font-medium hover:opacity-90"
        >
          {showForm ? 'Close' : 'Add Voice Actor'}
        </button>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by name, code, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
        />
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
              value={form.name || ''}
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
              value={form.email || ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              required
            />
          </label>
          <label className="text-sm">
            <span className="block text-zinc-700 dark:text-zinc-300">
              Phone
            </span>
            <input
              type="tel"
              className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
              value={form.phone || ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
          </label>
          <label className="text-sm">
            <span className="block text-zinc-700 dark:text-zinc-300">Code</span>
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
              value={form.code || ''}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            />
          </label>
          <label className="md:col-span-2 text-sm">
            <span className="block text-zinc-700 dark:text-zinc-300">
              Dietary Notes
            </span>
            <textarea
              className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
              value={form.dietary_notes || ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, dietary_notes: e.target.value }))
              }
              rows={2}
            />
          </label>
          <label className="md:col-span-2 text-sm">
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
          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 text-sm font-medium"
            >
              {editingId ? 'Save changes' : 'Create voice actor'}
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
      ) : filteredVoiceActors.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {searchQuery
            ? 'No voice actors match your search.'
            : 'No voice actors yet.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Code</th>
                <th className="px-3 py-2 text-left font-medium">Email</th>
                <th className="px-3 py-2 text-left font-medium">Phone</th>
                <th className="px-3 py-2 text-left font-medium">
                  Dietary Notes
                </th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVoiceActors.map((va) => (
                <tr
                  key={va.id}
                  className="border-t border-zinc-200 dark:border-zinc-800"
                >
                  <td className="px-3 py-2">{va.name}</td>
                  <td className="px-3 py-2">{va.code ?? '-'}</td>
                  <td className="px-3 py-2">{va.email}</td>
                  <td className="px-3 py-2">{va.phone ?? '-'}</td>
                  <td className="px-3 py-2 max-w-xs truncate">
                    {va.dietary_notes ?? '-'}
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button
                      onClick={() => onEdit(va)}
                      className="rounded-md border border-zinc-300 dark:border-zinc-700 px-2 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(va.id)}
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
