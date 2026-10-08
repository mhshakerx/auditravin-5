# RAVIN — نظام تقييم زيارات الجودة (Multi-user)

A shared, login-protected version of the RAVIN Quality Control audit tool. Field auditors sign in with a
username and password, fill in the branch visit evaluation (manager & cashier, deputy & merchandiser,
coordinator / mega coordinator, inventory count, final result), and save it to one shared history.
Admins create accounts, see every visit from every user, and export the list to Excel (CSV).

## Screens

| Path | What it is |
| --- | --- |
| `/` | Login (username + password) |
| `/setup` | One-time creation of the first admin account (disabled once an admin exists) |
| `/app` | The RAVIN audit tool, with a shared "سجل الزيارات" history |
| `/admin` | Admin dashboard: all visits (search, filter by user, open, delete, CSV export) and user management |

## Roles

- **admin** — sees and edits all visits, adds/removes users, resets passwords, promotes/demotes.
- **member** — saves visits and only sees their own.
- Accounts without either role (e.g. someone self-registering through the Identity API) can't access any data.

## Tech

- TanStack Start (React 19) + Tailwind CSS 4, deployed on Netlify
- Netlify Identity via `@netlify/identity` (login, admin user API)
- Netlify Database (Postgres) via Drizzle ORM — `db/schema.ts`, migrations in `netlify/database/migrations`
- The original audit tool lives in `public/audit.html` and is embedded in `/app`

## Running locally

```bash
pnpm install
netlify dev
```

Login only works on a deployed Netlify site (Identity isn't emulated locally).

After changing `db/schema.ts`, generate a migration:

```bash
npx drizzle-kit generate --name <describe_change>
```
