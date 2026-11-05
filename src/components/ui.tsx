import type { ReactNode } from 'react'

export function Bar({ ratio, color = 'var(--color-mint)', className = '' }: { ratio: number; color?: string; className?: string }) {
  return (
    <div className={`bar ${className}`}>
      <div style={{ width: `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`, background: color, transition: 'width .3s' }} />
    </div>
  )
}

export function PageTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h1 className="text-lg text-gold">{children}</h1>
      {right}
    </div>
  )
}

export function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="card text-muted text-sm text-center py-6">{children}</div>
}

export const confirmDelete = (what: string): boolean => window.confirm(`${what} 을(를) 삭제할까요? 되돌릴 수 없습니다.`)
