import { useEffect, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { hasAccess, isAdmin, useIdentity } from '@/lib/identity-context'

// Client-side gate for app screens. The APIs enforce the same rules server-side.
export function RequireAccess({ adminOnly = false, children }: { adminOnly?: boolean; children: ReactNode }) {
  const { user, ready } = useIdentity()
  const navigate = useNavigate()
  const allowed = adminOnly ? isAdmin(user) : hasAccess(user)

  useEffect(() => {
    if (!ready) return
    if (!hasAccess(user)) navigate({ to: '/' })
    else if (adminOnly && !isAdmin(user)) navigate({ to: '/app' })
  }, [ready, user, adminOnly, navigate])

  if (!ready || !allowed) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-ink-faint">
        <div className="flex items-center gap-3">
          <span className="size-4 animate-spin rounded-full border-2 border-wine border-t-transparent" />
          جارٍ التحميل…
        </div>
      </div>
    )
  }
  return <>{children}</>
}
