'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  getDirectorById,
  getDirectorWeeklyAvailability,
  upsertDirectorWeeklyAvailability,
  getDirectorDateOverrides,
  createDirectorDateOverride,
  updateDirectorDateOverride,
  deleteDirectorDateOverride,
  type Director,
  type DirectorWeeklyAvailability,
  type DirectorDateOverride,
} from '@/lib/db';

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

type WeeklyAvailabilityFormState = {
  day_of_week: number;
  am_start_time: string;
  am_end_time: string;
  pm_start_time: string;
  pm_end_time: string;
  notes: string;
};

type DateOverrideFormState = {
  date: string;
  override_type: string;
  am_start_time: string;
  am_end_time: string;
  pm_start_time: string;
  pm_end_time: string;
  notes: string;
};

function WeeklyAvailabilityRow({
  day,
  existing,
  onSave,
  saving,
}: {
  day: { value: number; label: string };
  existing?: DirectorWeeklyAvailability;
  onSave: (form: WeeklyAvailabilityFormState) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<WeeklyAvailabilityFormState>({
    day_of_week: day.value,
    am_start_time: existing?.am_start_time ?? '',
    am_end_time: existing?.am_end_time ?? '',
    pm_start_time: existing?.pm_start_time ?? '',
    pm_end_time: existing?.pm_end_time ?? '',
    notes: existing?.notes ?? '',
  });

  useEffect(() => {
    if (existing) {
      setForm({
        day_of_week: day.value,
        am_start_time: existing.am_start_time ?? '',
        am_end_time: existing.am_end_time ?? '',
        pm_start_time: existing.pm_start_time ?? '',
        pm_end_time: existing.pm_end_time ?? '',
        notes: existing.notes ?? '',
      });
    }
  }, [existing, day.value]);

  return (
    <tr className="border-t border-zinc-200 dark:border-zinc-800">
      <td className="px-3 py-2 font-medium">{day.label}</td>
      <td className="px-3 py-2">
        <input
          type="time"
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-xs"
          value={form.am_start_time || ''}
          onChange={(e) =>
            setForm((f) => ({ ...f, am_start_time: e.target.value }))
          }
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="time"
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-xs"
          value={form.am_end_time || ''}
          onChange={(e) =>
            setForm((f) => ({ ...f, am_end_time: e.target.value }))
          }
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="time"
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-xs"
          value={form.pm_start_time || ''}
          onChange={(e) =>
            setForm((f) => ({ ...f, pm_start_time: e.target.value }))
          }
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="time"
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-xs"
          value={form.pm_end_time || ''}
          onChange={(e) =>
            setForm((f) => ({ ...f, pm_end_time: e.target.value }))
          }
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-xs"
          value={form.notes || ''}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Notes"
        />
      </td>
      <td className="px-3 py-2 text-right">
        <button
          onClick={() => onSave(form)}
          disabled={saving}
          className="rounded-md border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-xs disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </td>
    </tr>
  );
}

export default function DirectorDetailPage() {
  const params = useParams<{ id: string }>();
  const directorId = params?.id;

  const [director, setDirector] = useState<Director | null>(null);
  const [weeklyAvailability, setWeeklyAvailability] = useState<
    DirectorWeeklyAvailability[]
  >([]);
  const [dateOverrides, setDateOverrides] = useState<DirectorDateOverride[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingDay, setSavingDay] = useState<number | null>(null);
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [editingOverrideId, setEditingOverrideId] = useState<string | null>(
    null
  );
  const [overrideForm, setOverrideForm] = useState<DateOverrideFormState>({
    date: '',
    override_type: '',
    am_start_time: '',
    am_end_time: '',
    pm_start_time: '',
    pm_end_time: '',
    notes: '',
  });

  useEffect(() => {
    if (!directorId) return;
    (async () => {
      try {
        const d = await getDirectorById(String(directorId));
        if (!d) {
          setError('Director not found');
          return;
        }
        setDirector(d);

        const weekly = await getDirectorWeeklyAvailability(String(directorId));
        setWeeklyAvailability(weekly);

        const overrides = await getDirectorDateOverrides(String(directorId));
        setDateOverrides(overrides);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [directorId]);

  const getAvailabilityForDay = (dayOfWeek: number) => {
    return weeklyAvailability.find((a) => a.day_of_week === dayOfWeek);
  };

  const saveWeeklyAvailability = async (
    dayOfWeek: number,
    form: WeeklyAvailabilityFormState
  ) => {
    if (!directorId) return;
    setSavingDay(dayOfWeek);
    setError(null);
    try {
      const saved = await upsertDirectorWeeklyAvailability({
        director_id: String(directorId),
        day_of_week: dayOfWeek,
        am_start_time: form.am_start_time || null,
        am_end_time: form.am_end_time || null,
        pm_start_time: form.pm_start_time || null,
        pm_end_time: form.pm_end_time || null,
        notes: form.notes || null,
      });
      setWeeklyAvailability((prev) => {
        const filtered = prev.filter((a) => a.day_of_week !== dayOfWeek);
        return [...filtered, saved];
      });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save availability');
    } finally {
      setSavingDay(null);
    }
  };

  const resetOverrideForm = () => {
    setOverrideForm({
      date: '',
      override_type: '',
      am_start_time: '',
      am_end_time: '',
      pm_start_time: '',
      pm_end_time: '',
      notes: '',
    });
    setEditingOverrideId(null);
  };

  const onSubmitOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directorId) return;
    setError(null);
    try {
      if (editingOverrideId) {
        const updated = await updateDirectorDateOverride({
          id: editingOverrideId,
          director_id: String(directorId),
          date: overrideForm.date,
          override_type: overrideForm.override_type || null,
          am_start_time: overrideForm.am_start_time || null,
          am_end_time: overrideForm.am_end_time || null,
          pm_start_time: overrideForm.pm_start_time || null,
          pm_end_time: overrideForm.pm_end_time || null,
          notes: overrideForm.notes || null,
        });
        setDateOverrides((prev) =>
          prev.map((o) => (o.id === editingOverrideId ? updated : o))
        );
      } else {
        const created = await createDirectorDateOverride({
          director_id: String(directorId),
          date: overrideForm.date,
          override_type: overrideForm.override_type || null,
          am_start_time: overrideForm.am_start_time || null,
          am_end_time: overrideForm.am_end_time || null,
          pm_start_time: overrideForm.pm_start_time || null,
          pm_end_time: overrideForm.pm_end_time || null,
          notes: overrideForm.notes || null,
        });
        setDateOverrides((prev) => [created, ...prev]);
      }
      resetOverrideForm();
      setShowOverrideForm(false);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save override');
    }
  };

  const onEditOverride = (override: DirectorDateOverride) => {
    setEditingOverrideId(override.id);
    setShowOverrideForm(true);
    setOverrideForm({
      date: override.date,
      override_type: override.override_type ?? '',
      am_start_time: override.am_start_time ?? '',
      am_end_time: override.am_end_time ?? '',
      pm_start_time: override.pm_start_time ?? '',
      pm_end_time: override.pm_end_time ?? '',
      notes: override.notes ?? '',
    });
  };

  const onDeleteOverride = async (id: string) => {
    if (!confirm('Delete this override?')) return;
    try {
      await deleteDirectorDateOverride(id);
      setDateOverrides((prev) => prev.filter((o) => o.id !== id));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete override');
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div>
        <Link
          href="/directors"
          className="text-sm text-zinc-600 dark:text-zinc-400 hover:underline"
        >
          ← Back to directors
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {director ? director.name : 'Director'} - Availability
        </h1>
        {director && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {director.email ?? '-'} • {director.phone ?? '-'}
          </p>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : (
        <>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Weekly Availability
            </h2>
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-900">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Day</th>
                    <th className="px-3 py-2 text-left font-medium">
                      AM Start
                    </th>
                    <th className="px-3 py-2 text-left font-medium">AM End</th>
                    <th className="px-3 py-2 text-left font-medium">
                      PM Start
                    </th>
                    <th className="px-3 py-2 text-left font-medium">PM End</th>
                    <th className="px-3 py-2 text-left font-medium">Notes</th>
                    <th className="px-3 py-2 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day) => {
                    const existing = getAvailabilityForDay(day.value);
                    return (
                      <WeeklyAvailabilityRow
                        key={day.value}
                        day={day}
                        existing={existing}
                        onSave={(form) =>
                          saveWeeklyAvailability(day.value, form)
                        }
                        saving={savingDay === day.value}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Date Overrides
              </h2>
              <button
                onClick={() => {
                  resetOverrideForm();
                  setShowOverrideForm((s) => !s);
                }}
                className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-3 py-1.5 text-sm font-medium hover:opacity-90"
              >
                {showOverrideForm ? 'Close' : 'Add Override'}
              </button>
            </div>

            {showOverrideForm && (
              <form
                onSubmit={onSubmitOverride}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 mb-4"
              >
                <label className="text-sm">
                  <span className="block text-zinc-700 dark:text-zinc-300">
                    Date
                  </span>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
                    value={overrideForm.date}
                    onChange={(e) =>
                      setOverrideForm((f) => ({ ...f, date: e.target.value }))
                    }
                    required
                  />
                </label>
                <label className="text-sm">
                  <span className="block text-zinc-700 dark:text-zinc-300">
                    Override Type
                  </span>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
                    value={overrideForm.override_type}
                    onChange={(e) =>
                      setOverrideForm((f) => ({
                        ...f,
                        override_type: e.target.value,
                      }))
                    }
                    placeholder="e.g., unavailable, custom"
                  />
                </label>
                <label className="text-sm">
                  <span className="block text-zinc-700 dark:text-zinc-300">
                    AM Start
                  </span>
                  <input
                    type="time"
                    className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
                    value={overrideForm.am_start_time}
                    onChange={(e) =>
                      setOverrideForm((f) => ({
                        ...f,
                        am_start_time: e.target.value,
                      }))
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
                    value={overrideForm.am_end_time}
                    onChange={(e) =>
                      setOverrideForm((f) => ({
                        ...f,
                        am_end_time: e.target.value,
                      }))
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
                    value={overrideForm.pm_start_time}
                    onChange={(e) =>
                      setOverrideForm((f) => ({
                        ...f,
                        pm_start_time: e.target.value,
                      }))
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
                    value={overrideForm.pm_end_time}
                    onChange={(e) =>
                      setOverrideForm((f) => ({
                        ...f,
                        pm_end_time: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="md:col-span-3 text-sm">
                  <span className="block text-zinc-700 dark:text-zinc-300">
                    Notes
                  </span>
                  <textarea
                    className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
                    value={overrideForm.notes}
                    onChange={(e) =>
                      setOverrideForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    rows={2}
                  />
                </label>
                <div className="md:col-span-3 flex gap-3">
                  <button
                    type="submit"
                    className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 text-sm font-medium"
                  >
                    {editingOverrideId ? 'Save changes' : 'Create override'}
                  </button>
                  <button
                    type="button"
                    onClick={resetOverrideForm}
                    className="rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm"
                  >
                    Clear
                  </button>
                </div>
              </form>
            )}

            {dateOverrides.length === 0 ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No date overrides yet.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                <table className="min-w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-900">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Date</th>
                      <th className="px-3 py-2 text-left font-medium">
                        Override Type
                      </th>
                      <th className="px-3 py-2 text-left font-medium">AM</th>
                      <th className="px-3 py-2 text-left font-medium">PM</th>
                      <th className="px-3 py-2 text-left font-medium">Notes</th>
                      <th className="px-3 py-2 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dateOverrides.map((o) => (
                      <tr
                        key={o.id}
                        className="border-t border-zinc-200 dark:border-zinc-800"
                      >
                        <td className="px-3 py-2">{o.date}</td>
                        <td className="px-3 py-2">{o.override_type ?? '-'}</td>
                        <td className="px-3 py-2">
                          {[o.am_start_time, o.am_end_time]
                            .filter(Boolean)
                            .join(' - ') || '-'}
                        </td>
                        <td className="px-3 py-2">
                          {[o.pm_start_time, o.pm_end_time]
                            .filter(Boolean)
                            .join(' - ') || '-'}
                        </td>
                        <td className="px-3 py-2">{o.notes ?? '-'}</td>
                        <td className="px-3 py-2 text-right space-x-2">
                          <button
                            onClick={() => onEditOverride(o)}
                            className="rounded-md border border-zinc-300 dark:border-zinc-700 px-2 py-1"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDeleteOverride(o.id)}
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
        </>
      )}
    </div>
  );
}
