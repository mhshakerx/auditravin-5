import { createServerFn } from '@tanstack/react-start'
import { admin, type User } from '@netlify/identity'
import { currentUser, roleOf, ROLE_ADMIN, ROLE_MEMBER } from './server-auth'
import { toLoginEmail } from './username'

export type ManagedUser = {
  id: string
  email: string
  name: string
  role: 'admin' | 'member' | null
  createdAt: string | null
  lastSignInAt: string | null
}

function toManaged(u: User): ManagedUser {
  return {
    id: u.id,
    email: u.email ?? '',
    name: u.name ?? '',
    role: roleOf(u),
    createdAt: u.createdAt ?? null,
    lastSignInAt: u.lastSignInAt ?? null,
  }
}

async function assertAdmin() {
  const user = await currentUser()
  if (!user || roleOf(user) !== ROLE_ADMIN) throw new Error('هذه العملية متاحة للأدمن فقط')
  return user
}

async function allUsers() {
  const out: User[] = []
  for (let page = 1; page <= 20; page++) {
    const batch = await admin.listUsers({ page, perPage: 100 })
    out.push(...batch)
    if (batch.length < 100) break
  }
  return out
}

function validatePassword(p: unknown) {
  if (typeof p !== 'string' || p.length < 6) throw new Error('كلمة المرور يجب ألا تقل عن 6 أحرف')
  return p
}

function validateUsername(u: unknown) {
  if (typeof u !== 'string' || !/^[\p{L}\p{N}._@+-]{2,80}$/u.test(u.trim()))
    throw new Error('اسم المستخدم غير صالح (حروف وأرقام بدون مسافات)')
  return toLoginEmail(u)
}

const normalizeRole = (r: unknown) => (r === ROLE_ADMIN ? ROLE_ADMIN : ROLE_MEMBER)

/** True when no admin account exists yet — enables the one-time /setup screen. */
export const getSetupStatus = createServerFn({ method: 'GET' }).handler(async () => {
  const users = await allUsers()
  return { needsSetup: !users.some((u) => roleOf(u) === ROLE_ADMIN) }
})

export const createFirstAdmin = createServerFn({ method: 'POST' })
  .inputValidator((d: { name: string; username: string; password: string }) => d)
  .handler(async ({ data }) => {
    const users = await allUsers()
    if (users.some((u) => roleOf(u) === ROLE_ADMIN)) throw new Error('تم إعداد حساب الأدمن مسبقاً')
    const email = validateUsername(data.username)
    const password = validatePassword(data.password)
    const created = await admin.createUser({
      email,
      password,
      data: {
        app_metadata: { roles: [ROLE_ADMIN] },
        user_metadata: { full_name: String(data.name || '').slice(0, 120) },
      },
    })
    return toManaged(created)
  })

export const listManagedUsers = createServerFn({ method: 'GET' }).handler(async () => {
  await assertAdmin()
  const users = await allUsers()
  return users.map(toManaged).sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''))
})

export const createManagedUser = createServerFn({ method: 'POST' })
  .inputValidator((d: { name: string; username: string; password: string; role: string }) => d)
  .handler(async ({ data }) => {
    await assertAdmin()
    const email = validateUsername(data.username)
    const password = validatePassword(data.password)
    try {
      const created = await admin.createUser({
        email,
        password,
        data: {
          app_metadata: { roles: [normalizeRole(data.role)] },
          user_metadata: { full_name: String(data.name || '').slice(0, 120) },
        },
      })
      return toManaged(created)
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      if (/already|exists|registered/i.test(msg)) throw new Error('اسم المستخدم مستخدم بالفعل')
      throw new Error('تعذّر إنشاء المستخدم')
    }
  })

export const updateManagedUser = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: { id: string; name?: string; password?: string; role?: string }) => d,
  )
  .handler(async ({ data }) => {
    const me = await assertAdmin()
    const target = await admin.getUser(data.id)
    const updates: Parameters<typeof admin.updateUser>[1] = {}
    if (data.password) updates.password = validatePassword(data.password)
    if (data.name !== undefined)
      updates.user_metadata = { ...(target.userMetadata ?? {}), full_name: data.name.slice(0, 120) }
    if (data.role !== undefined) {
      if (target.id === me.id && normalizeRole(data.role) !== ROLE_ADMIN)
        throw new Error('لا يمكنك إزالة صلاحية الأدمن من حسابك')
      updates.app_metadata = { ...(target.appMetadata ?? {}), roles: [normalizeRole(data.role)] }
    }
    return toManaged(await admin.updateUser(data.id, updates))
  })

export const deleteManagedUser = createServerFn({ method: 'POST' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const me = await assertAdmin()
    if (data.id === me.id) throw new Error('لا يمكنك حذف حسابك')
    await admin.deleteUser(data.id)
    return { ok: true }
  })
