import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { login } from '@netlify/identity'
import { ShieldCheck } from 'lucide-react'
import { createFirstAdmin, getSetupStatus } from '@/lib/admin'
import { toLoginEmail } from '@/lib/username'
import { BrandMark } from '@/components/BrandMark'

export const Route = createFileRoute('/setup')({
  component: SetupPage,
})

// One-time screen: creates the first admin account. Disabled once an admin exists.
function SetupPage() {
  const [status, setStatus] = useState<'loading' | 'open' | 'done'>('loading')
  const [form, setForm] = useState({ name: '', username: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getSetupStatus()
      .then((s) => setStatus(s.needsSetup ? 'open' : 'done'))
      .catch(() => setStatus('done'))
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('كلمتا المرور غير متطابقتين')
    setBusy(true)
    try {
      await createFirstAdmin({ data: { name: form.name, username: form.username, password: form.password } })
      await login(toLoginEmail(form.username), form.password)
      window.location.href = '/admin'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر إنشاء الحساب')
      setBusy(false)
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value })

  return (
    <div className="grid min-h-screen place-items-center px-5 py-12">
      <div className="w-full max-w-md rounded-md border border-line bg-surface p-8 shadow-sm">
        <BrandMark />
        <div className="mt-8 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-[3px] bg-wine-tint text-wine">
            <ShieldCheck size={20} />
          </span>
          <div>
            <h1 className="text-xl font-extrabold">إعداد حساب الأدمن</h1>
            <p className="text-sm text-ink-faint">خطوة لمرة واحدة فقط</p>
          </div>
        </div>

        {status === 'loading' && <p className="mt-8 text-sm text-ink-faint">جارٍ التحقق…</p>}
        {status === 'done' && (
          <div className="mt-8 text-sm leading-7">
            تم إعداد حساب الأدمن بالفعل.{' '}
            <Link to="/" className="font-bold text-wine underline">
              الذهاب لتسجيل الدخول
            </Link>
          </div>
        )}
        {status === 'open' && (
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Field label="الاسم">
              <input className="field-input" required value={form.name} onChange={set('name')} />
            </Field>
            <Field label="اسم المستخدم">
              <input className="field-input" dir="ltr" required value={form.username} onChange={set('username')} placeholder="admin" />
            </Field>
            <Field label="كلمة المرور (6 أحرف على الأقل)">
              <input className="field-input" dir="ltr" type="password" required minLength={6} value={form.password} onChange={set('password')} />
            </Field>
            <Field label="تأكيد كلمة المرور">
              <input className="field-input" dir="ltr" type="password" required value={form.confirm} onChange={set('confirm')} />
            </Field>
            {error && <p className="rounded-[3px] border border-fail/30 bg-fail-tint px-3 py-2 text-sm text-fail">{error}</p>}
            <button className="btn btn-primary w-full py-3" disabled={busy}>
              {busy ? 'جارٍ الإنشاء…' : 'إنشاء حساب الأدمن'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-ink-soft">{label}</span>
      {children}
    </label>
  )
}
