import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Dashboard
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Welcome! Manage studios, rooms, voice actors, and directors.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/schedule"
          className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors bg-zinc-100 dark:bg-zinc-900"
        >
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Schedule
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            View and manage daily schedules for voice actors and rooms.
          </p>
        </Link>

        <Link
          href="/studios"
          className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
        >
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Studios
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Manage studios and their rooms, availability times, and notes.
          </p>
        </Link>

        <Link
          href="/voice-actors"
          className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
        >
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Voice Actors
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Manage voice actors, their contact info, codes, and dietary notes.
          </p>
        </Link>

        <Link
          href="/directors"
          className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
        >
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Directors
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Manage directors and their weekly availability and date overrides.
          </p>
        </Link>
      </div>
    </div>
  );
}
