import { Link, useNavigate } from '@tanstack/react-router'
import { ClipboardList, LogOut, Users } from 'lucide-react'
import { isAdmin, useIdentity } from '@/lib/identity-context'
import { displayUsername } from '@/lib/username'
import { BrandMark } from './BrandMark'

// Thin account bar shown above the audit tool and the admin screens.
export function AppHeader() {
  const { user, logout } = useIdentity()
  const navigate = useNavigate()
  const admin = isAdmin(user)

  async function onLogout() {
    try {
      localStorage.removeItem('ravin_qc_current_visit_v1')
      localStorage.removeItem('ravin_qc_current_visit_id_v1')
    } catch {}
    await logout().catch(() => {})
    navigate({ to: '/' })
  }

  const tab =
    'inline-flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[13px] font-bold text-[#E9D3C9] hover:bg-white/10'
  const active = { className: `${tab} bg-white/10 text-white` }

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 bg-[#3D0416] px-4 text-[#F4E9E3]">
      <BrandMark light />
      <nav className="ms-4 flex items-center gap-1">
        <Link to="/app" className={tab} activeProps={active}>
          <ClipboardList size={15} /> التقييم
        </Link>
        {admin && (
          <Link to="/admin" className={tab} activeProps={active}>
            <Users size={15} /> لوحة الأدمن
          </Link>
        )}
      </nav>
      <div className="ms-auto flex items-center gap-3 text-[13px]">
        <span className="hidden sm:inline">
          {user?.name || displayUsername(user?.email ?? '')}
          <span className="ms-2 rounded-[3px] bg-gold/25 px-1.5 py-0.5 text-[11px] font-bold text-[#F3DFA9]">
            {admin ? 'أدمن' : 'مستخدم'}
          </span>
        </span>
        <button onClick={onLogout} className={tab} title="تسجيل الخروج">
          <LogOut size={15} /> خروج
        </button>
      </div>
    </header>
  )
}
