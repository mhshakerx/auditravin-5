# AGENTS.md

## Project overview

RAVIN QC — a multi-user wrapper around the client's standalone RAVIN quality-control audit page.
UI language is Arabic (RTL). Built with TanStack Start on Netlify.

## Architecture

- `public/audit.html` — the client's original single-file audit tool (vanilla JS, scoring rules extracted
  from their Excel sheet). Changes from the original are limited to: the history/save section now calls
  `/api/visits` + `/api/visit/:id` instead of localStorage, `?open=<id>` opens a saved visit, evidence photos
  are downscaled (`shrinkImage`), and the page redirects to `/app` if opened outside the iframe.
  The current draft is still kept in localStorage (`ravin_qc_current_visit_v1`) and the id of the saved visit
  being edited in `ravin_qc_current_visit_id_v1`; both are cleared on logout.
  Keep edits to this file surgical — its scoring logic mirrors the client's spreadsheet.
- `src/routes/app.tsx` — account bar + full-height iframe of `/audit.html`. The parent page runs
  `@netlify/identity`, whose refresh timer keeps the `nf_jwt` cookie valid for the iframe's fetches.
- `src/routes/admin.tsx` — admin dashboard (visits table + user management).
- `src/routes/index.tsx` — login; `src/routes/setup.tsx` — first-admin bootstrap.
- `src/routes/api/visits.ts`, `src/routes/api/visit.$id.ts` — visit CRUD. Admin sees all; members only own rows.
- `src/lib/admin.ts` — server functions wrapping `admin.*` from `@netlify/identity`.
- `src/lib/server-auth.ts` — `requireAppUser()`; access requires role `admin` or `member` in `app_metadata.roles`.
- `src/lib/username.ts` — usernames without `@` map to `<username>@users.ravin.app` Identity emails.
- `db/schema.ts` — `visits` table (summary columns + full visit JSON in `data`).

## Conventions

- Arabic copy throughout; use logical Tailwind properties (`ps-`, `start-`, `ms-`) for RTL.
- Brand tokens (wine / gold / pass / partial / fail) are defined in `src/styles.css` `@theme`, matching audit.html.
- Server security is enforced in API routes / server functions; client gates (`RequireAccess`) are UX only.
- Schema changes need `npx drizzle-kit generate --name <name>`.
