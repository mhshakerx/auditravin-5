import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { visits } from '../../../db/schema'
import { requireAppUser, ROLE_ADMIN } from '@/lib/server-auth'
import { visitFields } from '@/lib/visit-input'

type Auth = Exclude<Awaited<ReturnType<typeof requireAppUser>>, Response>

async function loadOwned(auth: Auth, rawId: string) {
  const id = Number(rawId)
  if (!Number.isInteger(id)) return null
  const [row] = await db.select().from(visits).where(eq(visits.id, id))
  if (!row) return null
  if (auth.role !== ROLE_ADMIN && row.ownerId !== auth.user.id) return null
  return row
}

const notFound = () => Response.json({ error: 'not found' }, { status: 404 })

export const Route = createFileRoute('/api/visit/$id')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const auth = await requireAppUser()
        if (auth instanceof Response) return auth
        const row = await loadOwned(auth, params.id)
        return row ? Response.json(row) : notFound()
      },

      PUT: async ({ params, request }) => {
        const auth = await requireAppUser()
        if (auth instanceof Response) return auth
        const row = await loadOwned(auth, params.id)
        if (!row) return notFound()
        const fields = visitFields(await request.json().catch(() => null))
        if (!fields) return Response.json({ error: 'invalid body' }, { status: 400 })
        await db
          .update(visits)
          .set({ ...fields, updatedAt: new Date() })
          .where(eq(visits.id, row.id))
        return Response.json({ id: row.id })
      },

      DELETE: async ({ params }) => {
        const auth = await requireAppUser()
        if (auth instanceof Response) return auth
        const row = await loadOwned(auth, params.id)
        if (!row) return notFound()
        await db.delete(visits).where(eq(visits.id, row.id))
        return new Response(null, { status: 204 })
      },
    },
  },
})
