import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { login, AuthError, MissingIdentityError } from '@netlify/identity'
import { ClipboardCheck, Lock, ShieldCheck, User as UserIcon, Users } from 'lucide-react'
import { hasAccess, useIdentity } from '@/lib/identity-context'
import { toLoginEmail } from '@/lib/username'
import { getSetupStatus } from '@/lib/admin'
import { BrandMark } from '@/components/BrandMark'

export const Route = createFileRoute('/')({
  component: LoginPage,
})

function LoginPage() {
  const { user, ready, logout } = useIdentity()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [needsSetup, setNeedsSetup] = useState(false)

  useEffect(() => {
    getSetupStatus()
      .then((s) => setNeedsSetup(s.needsSetup))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (ready && hasAccess(user)) navigate({ to: '/app' })
  }, [ready, user, navigate])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const u = await login(toLoginEmail(username), password)
      if (!hasAccess(u)) setError('هذا الحساب غير مفعّل. تواصل مع الأدمن.')
    } catch (err) {
      if (err instanceof MissingIdentityError) setError('خدمة الدخول غير متاحة حالياً.')
      else if (err instanceof AuthError && (err.status === 400 || err.status === 401))
        setError('اسم المستخدم أو كلمة المرور غير صحيحة')
      else setError('تعذّر تسجيل الدخول، حاول مرة أخرى')
    } finally {
      setBusy(false)
    }
  }

  const blocked = ready && user && !hasAccess(user)

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      {/* Brand side */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-wine-deep p-12 text-[#F4E9E3]">
        <div className="absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(135deg,#fff_0_1px,transparent_1px_22px)]" />
        <div className="relative">
          <BrandMark light />
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-black leading-tight text-white">
            تقييم زيارات الجودة
            <br />
            <span className="text-gold">لكل الفروع، من مكان واحد</span>
          </h1>
          <p className="mt-5 text-[15px] leading-8 text-[#D9B6A5]">
            فريق الجودة يسجّل الزيارات من أي جهاز، والإدارة تتابع كل النتائج في سجل واحد مشترك ومحمي بكلمة مرور.
          </p>
          <ul className="mt-8 space-y-4 text-sm">
            <Feature icon={<ClipboardCheck size={18} />} text="نموذج التقييم الكامل: المدير والكاشير، النائب والمرشينديزر، الكورديتور، والجرد" />
            <Feature icon={<Users size={18} />} text="حساب منفصل لكل عضو في الفريق" />
            <Feature icon={<ShieldCheck size={18} />} text="الأدمن يضيف المستخدمين ويشاهد كل الزيارات" />
          </ul>
        </div>
        <div className="relative h-1 w-24 bg-gold" />
      </aside>

      {/* Form side */}
      <main className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <BrandMark />
          </div>
          <h2 className="text-2xl font-extrabold">تسجيل الدخول</h2>
          <p className="mt-1 text-sm text-ink-faint">أدخل اسم المستخدم وكلمة المرور الخاصة بك</p>

          {blocked ? (
            <div className="mt-8 rounded-md border border-partial/30 bg-partial-tint p-4 text-sm leading-7">
              هذا الحساب غير مفعّل بعد. اطلب من الأدمن إضافتك من لوحة المستخدمين.
              <button className="btn mt-3 w-full" onClick={() => logout()}>
                تسجيل الخروج
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-ink-soft">اسم المستخدم</span>
                <div className="relative">
                  <UserIcon size={16} className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 text-ink-faint" />
                  <input
                    className="field-input ps-9"
                    autoComplete="username"
                    dir="ltr"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username"
                  />
                </div>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-ink-soft">كلمة المرور</span>
                <div className="relative">
                  <Lock size={16} className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 text-ink-faint" />
                  <input
                    className="field-input ps-9"
                    type="password"
                    autoComplete="current-password"
                    dir="ltr"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </label>
              {error && (
                <p className="rounded-[3px] border border-fail/30 bg-fail-tint px-3 py-2 text-sm text-fail">{error}</p>
              )}
              <button type="submit" disabled={busy || !ready} className="btn btn-primary w-full py-3 text-base">
                {busy ? 'جارٍ الدخول…' : 'دخول'}
              </button>
            </form>
          )}

          {needsSetup && (
            <div className="mt-8 rounded-md border border-gold/40 bg-gold-tint p-4 text-sm leading-7">
              لم يتم إنشاء حساب الأدمن بعد.{' '}
              <Link to="/setup" className="font-bold text-wine underline">
                إعداد حساب الأدمن الآن
              </Link>
            </div>
          )}

          <p className="mt-10 text-xs leading-6 text-ink-faint">
            الحسابات يتم إنشاؤها بواسطة الأدمن فقط. لو نسيت كلمة المرور، اطلب من الأدمن تعيين كلمة جديدة.
          </p>
        </div>
      </main>
    </div>
  )
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[3px] border border-white/20 bg-white/5 text-gold">
        {icon}
      </span>
      <span className="leading-7">{text}</span>
    </li>
  )
}
