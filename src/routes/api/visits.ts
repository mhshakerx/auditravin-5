import { createFileRoute } from '@tanstack/react-router'
import { desc, eq } from 'drizzle-orm'
import { db } from '../../../db'
import { visits } from '../../../db/schema'
import { requireAppUser, ROLE_ADMIN } from '@/lib/server-auth'
import { visitFields } from '@/lib/visit-input'

const listColumns = {
  id: visits.id,
  ownerId: visits.ownerId,
  ownerName: visits.ownerName,
  ownerEmail: visits.ownerEmail,
  branch: visits.branch,
  branchCode: visits.branchCode,
  visitDate: visits.visitDate,
  auditor: visits.auditor,
  score: visits.score,
  createdAt: visits.createdAt,
  updatedAt: visits.updatedAt,
}

export const Route = createFileRoute('/api/visits')({
  server: {
    handlers: {
      // Admins see every visit; members only see the visits they saved.
      GET: async () => {
        const auth = await requireAppUser()
        if (auth instanceof Response) return auth
        const base = db.select(listColumns).from(visits)
        const rows =
          auth.role === ROLE_ADMIN
            ? await base.orderBy(desc(visits.createdAt))
            : await base.where(eq(visits.ownerId, auth.user.id)).orderBy(desc(visits.createdAt))
        return Response.json({ role: auth.role, visits: rows })
      },

      POST: async ({ request }) => {
        const auth = await requireAppUser()
        if (auth instanceof Response) return auth
        const fields = visitFields(await request.json().catch(() => null))
        if (!fields) return Response.json({ error: 'invalid body' }, { status: 400 })
        const [row] = await db
          .insert(visits)
          .values({
            ...fields,
            ownerId: auth.user.id,
            ownerName: auth.user.name || '',
            ownerEmail: auth.user.email || '',
          })
          .returning(listColumns)
        return Response.json(row, { status: 201 })
      },
    },
  },
})
