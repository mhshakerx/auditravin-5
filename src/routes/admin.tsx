import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Download, KeyRound, Plus, Search, Trash2, UserPlus, X } from 'lucide-react'
import { AppHeader } from '@/components/AppHeader'
import { RequireAccess } from '@/components/RequireAccess'
import { useIdentity } from '@/lib/identity-context'
import { displayUsername } from '@/lib/username'
import {
  createManagedUser,
  deleteManagedUser,
  listManagedUsers,
  updateManagedUser,
  type ManagedUser,
} from '@/lib/admin'

export const Route = createFileRoute('/admin')({
  component: () => (
    <RequireAccess adminOnly>
      <div className="min-h-screen">
        <AppHeader />
        <AdminPage />
      </div>
    </RequireAccess>
  ),
})

type VisitRow = {
  id: number
  ownerId: string
  ownerName: string
  ownerEmail: string
  branch: string
  branchCode: string
  visitDate: string
  auditor: string
  score: number
  createdAt: string
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'حدث خطأ')

function AdminPage() {
  const [tab, setTab] = useState<'visits' | 'users'>('visits')
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [visits, setVisits] = useState<VisitRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  async function reload() {
    setLoadError('')
    try {
      const [u, v] = await Promise.all([
        listManagedUsers(),
        fetch('/api/visits', { credentials: 'same-origin' }).then((r) => {
          if (!r.ok) throw new Error('تعذّر تحميل الزيارات')
          return r.json() as Promise<{ visits: VisitRow[] }>
        }),
      ])
      setUsers(u)
      setVisits(v.visits)
    } catch (e) {
      setLoadError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  const stats = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7)
    const avg = visits.length ? Math.round(visits.reduce((s, v) => s + v.score, 0) / visits.length) : 0
    return {
      users: users.filter((u) => u.role).length,
      visits: visits.length,
      avg,
      month: visits.filter((v) => (v.visitDate || v.createdAt).startsWith(month)).length,
    }
  }, [users, visits])

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">لوحة الأدمن</h1>
          <p className="mt-1 text-sm text-ink-faint">متابعة كل زيارات الجودة وإدارة حسابات الفريق</p>
        </div>
        <div className="flex rounded-[3px] border border-line bg-surface-2 p-1">
          {(
            [
              ['visits', 'كل الزيارات'],
              ['users', 'المستخدمين'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`rounded-[3px] px-4 py-1.5 text-sm font-bold ${tab === k ? 'bg-surface text-wine shadow-sm' : 'text-ink-soft'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="إجمالي الزيارات" value={stats.visits} hero />
        <Stat label="زيارات هذا الشهر" value={stats.month} />
        <Stat label="متوسط النتيجة" value={`${stats.avg}%`} />
        <Stat label="المستخدمين النشطين" value={stats.users} />
      </section>

      {loadError && (
        <p className="mt-6 rounded-[3px] border border-fail/30 bg-fail-tint px-4 py-3 text-sm text-fail">{loadError}</p>
      )}

      {loading ? (
        <p className="mt-10 text-center text-sm text-ink-faint">جارٍ التحميل…</p>
      ) : tab === 'visits' ? (
        <VisitsPanel visits={visits} users={users} onChange={reload} />
      ) : (
        <UsersPanel users={users} onChange={reload} />
      )}
    </main>
  )
}

function Stat({ label, value, hero }: { label: string; value: string | number; hero?: boolean }) {
  return (
    <div
      className={`rounded-md border p-4 ${hero ? 'border-transparent bg-gradient-to-l from-wine to-wine-deep text-white' : 'border-line bg-surface'}`}
    >
      <div className={`text-xs font-bold ${hero ? 'text-[#E9C9B9]' : 'text-ink-faint'}`}>{label}</div>
      <div className="mt-1 font-mono text-3xl font-bold">{value}</div>
    </div>
  )
}

function scoreClass(s: number) {
  if (s >= 90) return 'bg-pass-tint text-pass'
  if (s >= 75) return 'bg-partial-tint text-partial'
  return 'bg-fail-tint text-fail'
}

/* ----------------------------- visits ----------------------------- */

function VisitsPanel({ visits, users, onChange }: { visits: VisitRow[]; users: ManagedUser[]; onChange: () => void }) {
  const [q, setQ] = useState('')
  const [owner, setOwner] = useState('')

  const filtered = visits.filter(
    (v) =>
      (!owner || v.ownerId === owner) &&
      (!q || `${v.branch} ${v.branchCode} ${v.auditor}`.toLowerCase().includes(q.toLowerCase())),
  )

  async function remove(v: VisitRow) {
    if (!confirm(`حذف زيارة فرع "${v.branch || '—'}" بتاريخ ${v.visitDate}؟`)) return
    const r = await fetch(`/api/visit/${v.id}`, { method: 'DELETE', credentials: 'same-origin' })
    if (!r.ok) return alert('تعذّر حذف الزيارة')
    onChange()
  }

  function exportCsv() {
    const rows = [
      ['الفرع', 'كود الفرع', 'تاريخ الزيارة', 'المقيّم', 'سجّلها', 'النتيجة %', 'تاريخ الحفظ'],
      ...filtered.map((v) => [
        v.branch,
        v.branchCode,
        v.visitDate,
        v.auditor,
        v.ownerName || displayUsername(v.ownerEmail),
        v.score,
        new Date(v.createdAt).toLocaleString('ar-EG'),
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `RAVIN_visits_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  return (
    <section className="mt-6 rounded-md border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
        <div className="relative min-w-56 flex-1">
          <Search size={15} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input className="field-input ps-9 py-2 text-sm" placeholder="بحث بالفرع أو المقيّم…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="field-input w-auto py-2 text-sm" value={owner} onChange={(e) => setOwner(e.target.value)}>
          <option value="">كل المستخدمين</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name || displayUsername(u.email)}
            </option>
          ))}
        </select>
        <button className="btn" onClick={exportCsv} disabled={!filtered.length}>
          <Download size={15} /> تصدير Excel (CSV)
        </button>
      </div>
      {filtered.length === 0 ? (
        <p className="p-10 text-center text-sm text-ink-faint">لا توجد زيارات محفوظة بعد</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-xs text-ink-soft">
              <tr>
                {['الفرع', 'تاريخ الزيارة', 'المقيّم', 'سجّلها', 'النتيجة', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-start font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-t border-line hover:bg-surface-2/50">
                  <td className="px-4 py-3">
                    <div className="font-bold">{v.branch || '—'}</div>
                    {v.branchCode && <div className="font-mono text-xs text-ink-faint">{v.branchCode}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{v.visitDate || '—'}</td>
                  <td className="px-4 py-3">{v.auditor || '—'}</td>
                  <td className="px-4 py-3 text-ink-soft">{v.ownerName || displayUsername(v.ownerEmail)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-[3px] px-2 py-1 font-mono text-xs font-bold ${scoreClass(v.score)}`}>{v.score}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link to="/app" search={{ open: String(v.id) }} className="btn px-3 py-1 text-xs">
                        فتح
                      </Link>
                      <button className="btn btn-danger px-2 py-1" onClick={() => remove(v)} title="حذف">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

/* ----------------------------- users ----------------------------- */

function UsersPanel({ users, onChange }: { users: ManagedUser[]; onChange: () => void }) {
  const { user: me } = useIdentity()
  const [showCreate, setShowCreate] = useState(false)
  const [pwFor, setPwFor] = useState<ManagedUser | null>(null)

  async function toggleRole(u: ManagedUser) {
    const role = u.role === 'admin' ? 'member' : 'admin'
    try {
      await updateManagedUser({ data: { id: u.id, role } })
      onChange()
    } catch (e) {
      alert(errMsg(e))
    }
  }

  async function remove(u: ManagedUser) {
    if (!confirm(`حذف المستخدم "${u.name || displayUsername(u.email)}"؟ زياراته المحفوظة ستبقى في السجل.`)) return
    try {
      await deleteManagedUser({ data: { id: u.id } })
      onChange()
    } catch (e) {
      alert(errMsg(e))
    }
  }

  return (
    <section className="mt-6 rounded-md border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line p-4">
        <div className="text-sm text-ink-soft">
          كل مستخدم يدخل باسم مستخدم وكلمة مرور. <b>المستخدم</b> يرى زياراته فقط، و<b>الأدمن</b> يرى كل شيء.
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <UserPlus size={15} /> إضافة مستخدم
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs text-ink-soft">
            <tr>
              {['الاسم', 'اسم المستخدم', 'الصلاحية', 'آخر دخول', ''].map((h) => (
                <th key={h} className="px-4 py-2.5 text-start font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="px-4 py-3 font-bold">
                  {u.name || '—'}
                  {u.id === me?.id && <span className="ms-2 text-xs font-normal text-ink-faint">(أنت)</span>}
                </td>
                <td className="px-4 py-3 font-mono text-xs" dir="ltr">
                  {displayUsername(u.email)}
                </td>
                <td className="px-4 py-3">
                  {u.role === 'admin' ? (
                    <span className="rounded-[3px] bg-wine-tint px-2 py-1 text-xs font-bold text-wine">أدمن</span>
                  ) : u.role === 'member' ? (
                    <span className="rounded-[3px] bg-surface-2 px-2 py-1 text-xs font-bold text-ink-soft">مستخدم</span>
                  ) : (
                    <span className="rounded-[3px] bg-partial-tint px-2 py-1 text-xs font-bold text-partial">غير مفعّل</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-ink-faint">
                  {u.lastSignInAt ? new Date(u.lastSignInAt).toLocaleString('ar-EG') : 'لم يدخل بعد'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button className="btn px-3 py-1 text-xs" onClick={() => setPwFor(u)}>
                      <KeyRound size={13} /> كلمة المرور
                    </button>
                    {u.id !== me?.id && (
                      <>
                        <button className="btn px-3 py-1 text-xs" onClick={() => toggleRole(u)}>
                          {u.role === 'admin' ? 'جعله مستخدم' : u.role ? 'جعله أدمن' : 'تفعيل كأدمن'}
                        </button>
                        {!u.role && (
                          <button
                            className="btn px-3 py-1 text-xs"
                            onClick={() => updateManagedUser({ data: { id: u.id, role: 'member' } }).then(onChange, (e) => alert(errMsg(e)))}
                          >
                            تفعيل كمستخدم
                          </button>
                        )}
                        <button className="btn btn-danger px-2 py-1" onClick={() => remove(u)} title="حذف">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onDone={() => {
            setShowCreate(false)
            onChange()
          }}
        />
      )}
      {pwFor && <PasswordModal user={pwFor} onClose={() => setPwFor(null)} />}
    </section>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-md bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-extrabold">{title}</h3>
          <button onClick={onClose} className="text-ink-faint hover:text-ink">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function CreateUserModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ name: '', username: '', password: '', role: 'member' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await createManagedUser({ data: f })
      onDone()
    } catch (err) {
      setError(errMsg(err))
      setBusy(false)
    }
  }

  return (
    <Modal title="إضافة مستخدم جديد" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ModalField label="الاسم">
          <input className="field-input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </ModalField>
        <ModalField label="اسم المستخدم (للدخول)">
          <input className="field-input" dir="ltr" required value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} placeholder="ahmed" />
        </ModalField>
        <ModalField label="كلمة المرور (6 أحرف على الأقل)">
          <input className="field-input" dir="ltr" required minLength={6} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        </ModalField>
        <ModalField label="الصلاحية">
          <select className="field-input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
            <option value="member">مستخدم — يسجل زيارات ويرى زياراته فقط</option>
            <option value="admin">أدمن — يرى كل الزيارات ويدير المستخدمين</option>
          </select>
        </ModalField>
        {error && <p className="rounded-[3px] border border-fail/30 bg-fail-tint px-3 py-2 text-sm text-fail">{error}</p>}
        <button className="btn btn-primary w-full py-2.5" disabled={busy}>
          <Plus size={15} /> {busy ? 'جارٍ الإنشاء…' : 'إنشاء المستخدم'}
        </button>
        <p className="text-xs leading-6 text-ink-faint">أرسل اسم المستخدم وكلمة المرور للشخص ليدخل بهما من صفحة الدخول.</p>
      </form>
    </Modal>
  )
}

function PasswordModal({ user, onClose }: { user: ManagedUser; onClose: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await updateManagedUser({ data: { id: user.id, password } })
      setDone(true)
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={`تغيير كلمة مرور ${user.name || displayUsername(user.email)}`} onClose={onClose}>
      {done ? (
        <div className="space-y-4">
          <p className="rounded-[3px] bg-pass-tint px-3 py-2 text-sm text-pass">تم تغيير كلمة المرور بنجاح.</p>
          <button className="btn w-full" onClick={onClose}>
            إغلاق
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <ModalField label="كلمة المرور الجديدة">
            <input className="field-input" dir="ltr" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </ModalField>
          {error && <p className="rounded-[3px] border border-fail/30 bg-fail-tint px-3 py-2 text-sm text-fail">{error}</p>}
          <button className="btn btn-primary w-full py-2.5" disabled={busy}>
            {busy ? 'جارٍ الحفظ…' : 'حفظ'}
          </button>
        </form>
      )}
    </Modal>
  )
}

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-ink-soft">{label}</span>
      {children}
    </label>
  )
}
