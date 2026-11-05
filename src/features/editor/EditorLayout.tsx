import { NavLink, Outlet } from 'react-router'

const TABS = [
  { to: 'domains', label: '분야·전직' },
  { to: 'skills', label: '스킬·과제' },
  { to: 'seasons', label: '시즌' },
  { to: 'character', label: '캐릭터' },
  { to: 'gallery', label: '도감' },
  { to: 'data', label: '데이터' },
]

export function EditorLayout() {
  return (
    <div className="space-y-3">
      <h1 className="text-lg text-gold">세계관 편집</h1>
      <div className="flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} className={({ isActive }) => `btn text-xs whitespace-nowrap ${isActive ? 'btn-gold' : ''}`}>{t.label}</NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  )
}
