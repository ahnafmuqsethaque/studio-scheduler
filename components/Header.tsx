'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function Header() {
	const router = useRouter()

	const handleSignOut = async () => {
		const supabase = createSupabaseBrowserClient()
		await supabase.auth.signOut()
		router.refresh()
	}

	return (
		<header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-950/60">
			<div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
				<Link
					href="/dashboard"
					className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:underline"
				>
					Studio Scheduler
				</Link>
				<button
					onClick={handleSignOut}
					className="text-sm rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
				>
					Sign out
				</button>
			</div>
		</header>
	)
}


