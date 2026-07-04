'use client'

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { unlockSite } from './actions'

export default function UnlockPage() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/'

  const [state, formAction, isPending] = useActionState(unlockSite, null)

  return (
    <div className="fixed inset-0 bg-white font-poppins flex items-center justify-center">
      <div className="w-full max-w-sm mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-[32px] font-semibold text-[#1a1a1a] mb-2">
            Solvi
          </h1>
          <p className="text-[14px] text-[#52596b]">
            Enter the team password to continue
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="redirect" value={redirectTo} />

          <input
            name="password"
            type="password"
            placeholder="Password"
            autoFocus
            className="w-full px-4 py-3 rounded-lg border border-zinc-200 text-[15px] text-[#1a1a1a] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#3b7cf4] focus:border-transparent transition-shadow"
          />

          {state?.error && (
            <p className="text-[13px] text-red-500 text-center">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-[#3b7cf4] px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#2f67dc] disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isPending ? 'Unlocking…' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  )
}
