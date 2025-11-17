'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function LoginPage() {
	const [email, setEmail] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [message, setMessage] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)
		setMessage(null)
		setError(null)
		try {
			const supabase = createSupabaseBrowserClient()
			const redirectTo =
				typeof window !== 'undefined'
					? `${window.location.origin}/auth/callback`
					: undefined
			const { error: signInError } = await supabase.auth.signInWithOtp({
				email,
				options: {
					emailRedirectTo: redirectTo,
				},
			})
			if (signInError) {
				setError(signInError.message)
			} else {
				setMessage('Check your email for the login link.')
			}
		} catch (err: any) {
			setError(err?.message ?? 'Something went wrong')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="min-h-dvh flex items-center justify-center p-6 bg-zinc-50 dark:bg-black">
			<div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
				<h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Sign in</h1>
				<p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">We&apos;ll email you a magic link.</p>
				<form className="mt-6 space-y-4" onSubmit={handleSubmit}>
					<label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
						Email
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							placeholder="you@example.com"
							className="mt-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-500"
						/>
					</label>
					<button
						type="submit"
						disabled={isLoading}
						className="w-full rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 py-2 font-medium hover:opacity-90 disabled:opacity-50"
					>
						{isLoading ? 'Sending...' : 'Send magic link'}
					</button>
				</form>
				{message && <p className="mt-4 text-sm text-green-600 dark:text-green-400">{message}</p>}
				{error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
			</div>
		</div>
	)
}


