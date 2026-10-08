import { createFileRoute } from '@tanstack/react-router'
import { requireAppUser } from '@/lib/server-auth'

export const Route = createFileRoute('/api/me')({
  server: {
    handlers: {
      GET: async () => {
        const auth = await requireAppUser()
        if (auth instanceof Response) return auth
        const { user, role } = auth
        return Response.json({ id: user.id, email: user.email, name: user.name || '', role })
      },
    },
  },
})
