import { createFileRoute } from '@tanstack/react-router'
import { AppHeader } from '@/components/AppHeader'
import { RequireAccess } from '@/components/RequireAccess'

export const Route = createFileRoute('/app')({
  validateSearch: (s: Record<string, unknown>): { open?: string } =>
    typeof s.open === 'number' || typeof s.open === 'string' ? { open: String(s.open) } : {},
  component: AppPage,
})

// The audit tool is the original standalone RAVIN page (public/audit.html),
// embedded full-height. It saves visits to /api/visits using the login cookie.
function AppPage() {
  const { open } = Route.useSearch()
  const src = open ? `/audit.html?open=${encodeURIComponent(open)}` : '/audit.html'
  return (
    <RequireAccess>
      <div className="flex h-dvh flex-col">
        <AppHeader />
        <iframe key={src} src={src} title="RAVIN QC Audit" className="min-h-0 w-full flex-1 border-0 bg-bg" />
      </div>
    </RequireAccess>
  )
}
