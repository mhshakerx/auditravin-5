import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getUser, logout as nlLogout, onAuthChange, type User } from '@netlify/identity'

interface IdentityContextValue {
  user: User | null
  ready: boolean
  logout: () => Promise<void>
}

const IdentityContext = createContext<IdentityContextValue | null>(null)

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // getUser() also restarts the background token refresh, which keeps the
    // nf_jwt cookie fresh for the API calls made by the embedded audit tool.
    getUser().then((u) => {
      setUser(u ?? null)
      setReady(true)
    })
    return onAuthChange((_event, u) => setUser(u ?? null))
  }, [])

  return (
    <IdentityContext.Provider value={{ user, ready, logout: nlLogout }}>
      {children}
    </IdentityContext.Provider>
  )
}

export function useIdentity() {
  const ctx = useContext(IdentityContext)
  if (!ctx) throw new Error('useIdentity must be used within an IdentityProvider')
  return ctx
}

export const isAdmin = (u: User | null) => !!u?.roles?.includes('admin')
export const hasAccess = (u: User | null) =>
  !!u?.roles?.some((r) => r === 'admin' || r === 'member')
