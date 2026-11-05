import { NavLink, Outlet } from 'react-router'
import { useWorld } from './world'
import { isCloudMode } from '@/lib/supabase'
import { signOut } from './auth'

const NAV = [
  { to: '/', label: '오늘', icon: '📋', end: true },
  { to: '/character', label: '캐릭터', icon: '🧍' },
  { to: '/skills', label: '스킬', icon: '📈' },
  { to: '/friends', label: '친구', icon: '👥' },
  { to: '/edit', label: '편집', icon: '🛠️' },
]

export function Layout() {
  const { toasts, mode, derived, world } = useWorld()
  const link = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 ${isActive ? 'bg-panel2 text-gold' : 'text-ink hover:bg-panel2/60'}`

  return (
    <div className="min-h-full md:flex">
      {/* PC 사이드바 */}
      <aside className="hidden md:flex md:flex-col w-56 shrink-0 bg-panel border-r-4 border-black p-3 gap-1 sticky top-0 h-screen">
        <div className="text-gold text-lg mb-2">Body RPG</div>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={link}>
            <span>{n.icon}</span>{n.label}
          </NavLink>
        ))}
        <div className="mt-auto text-xs text-muted space-y-1">
          <div>{world.character.name} · 총 {derived.totalXp} XP</div>
          <div>{mode === 'cloud' ? '☁ 클라우드 동기화' : '💾 로컬 저장 (이 기기만)'}</div>
          {isCloudMode && <button className="btn btn-ghost text-xs px-2 py-1" onClick={signOut}>로그아웃</button>}
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-3 pb-24 md:pb-6 md:p-6 max-w-4xl">
        <Outlet />
      </main>

      {/* 모바일 하단 탭 */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-panel border-t-4 border-black flex z-20" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `flex-1 flex flex-col items-center py-2 text-[11px] ${isActive ? 'text-gold' : 'text-muted'}`}>
            <span className="text-lg leading-none">{n.icon}</span>{n.label}
          </NavLink>
        ))}
      </nav>

      {/* 토스트 */}
      <div className="fixed top-3 inset-x-0 flex flex-col items-center gap-2 pointer-events-none z-30">
        {toasts.map((t) => (
          <div key={t.id} className={`px-4 py-2 border-2 border-black shadow-[3px_3px_0_#000] text-sm ${t.kind === 'xp' ? 'bg-gold text-black' : t.kind === 'levelup' ? 'bg-accent text-white' : 'bg-panel2 text-ink'}`}>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  )
}
