import { getUser, refreshSession, type User } from '@netlify/identity'

export const ROLE_ADMIN = 'admin'
export const ROLE_MEMBER = 'member'

export type AppRole = typeof ROLE_ADMIN | typeof ROLE_MEMBER | null

export function roleOf(user: Pick<User, 'roles'> | null | undefined): AppRole {
  const roles = user?.roles ?? []
  if (roles.includes(ROLE_ADMIN)) return ROLE_ADMIN
  if (roles.includes(ROLE_MEMBER)) return ROLE_MEMBER
  return null
}

/** Current user, refreshing an expired access token if a refresh cookie exists. */
export async function currentUser(): Promise<User | null> {
  let user = await getUser()
  if (!user) {
    try {
      if (await refreshSession()) user = await getUser()
    } catch {
      user = null
    }
  }
  return user ?? null
}

/**
 * Only accounts created by an admin (role admin/member) can use the app.
 * Self-registered Identity accounts without a role are rejected.
 */
export async function requireAppUser(): Promise<
  { user: User; role: Exclude<AppRole, null> } | Response
> {
  const user = await currentUser()
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
  const role = roleOf(user)
  if (!role) return Response.json({ error: 'forbidden' }, { status: 403 })
  return { user, role }
}
