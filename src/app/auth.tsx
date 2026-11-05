import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Navigate } from 'react-router'
import { isCloudMode, supabase } from '@/lib/supabase'

interface AuthState { session: Session | null; loading: boolean }
const AuthCtx = createContext<AuthState>({ session: null, loading: false })
export const useAuth = () => useContext(AuthCtx)

export function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, loading: isCloudMode })

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setState({ session: data.session, loading: false }))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setState({ session, loading: false }))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!isCloudMode) return <AuthCtx.Provider value={state}>{children}</AuthCtx.Provider>
  if (state.loading) return <Center>불러오는 중…</Center>
  if (!state.session) return <Navigate to="/login" replace />
  return <AuthCtx.Provider value={state}>{children}</AuthCtx.Provider>
}

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!isCloudMode) return <Navigate to="/" replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError(null)
    const redirect = window.location.origin + import.meta.env.BASE_URL
    const { error } = await supabase!.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } })
    setBusy(false)
    if (error) setError(error.message); else setSent(true)
  }

  return (
    <Center>
      <form onSubmit={submit} className="card w-full max-w-sm space-y-3">
        <h1 className="text-xl text-gold">Body RPG</h1>
        <p className="text-xs text-muted">이메일로 로그인 링크를 보내드립니다. 비밀번호가 필요 없습니다.</p>
        {sent ? (
          <p className="text-mint text-sm">메일을 확인하세요. 링크를 열면 로그인됩니다.</p>
        ) : (
          <>
            <input className="input" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn btn-accent w-full" disabled={busy}>{busy ? '전송 중…' : '로그인 링크 보내기'}</button>
          </>
        )}
        {error && <p className="text-accent text-xs">{error}</p>}
      </form>
    </Center>
  )
}

export function Center({ children }: { children: ReactNode }) {
  return <div className="min-h-full flex items-center justify-center p-4">{children}</div>
}

export async function signOut() { await supabase?.auth.signOut() }
