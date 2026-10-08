import { pgTable, serial, text, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core'

// One saved RAVIN QC audit visit. `data` holds the full visit object produced
// by the audit tool (public/audit.html) so it can be reopened exactly as saved.
export const visits = pgTable(
  'visits',
  {
    id: serial().primaryKey(),
    ownerId: text('owner_id').notNull(),
    ownerName: text('owner_name').notNull().default(''),
    ownerEmail: text('owner_email').notNull().default(''),
    branch: text().notNull().default(''),
    branchCode: text('branch_code').notNull().default(''),
    visitDate: text('visit_date').notNull().default(''),
    auditor: text().notNull().default(''),
    score: integer().notNull().default(0),
    data: jsonb().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('visits_owner_idx').on(t.ownerId), index('visits_created_idx').on(t.createdAt)],
)
