import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useWorld, type QueuedCelebration } from '@/app/world'
import { PixelCanvas } from '@/pixel/PixelCanvas'
import { DEFAULT_OUTFIT, spriteByKey } from '@/pixel/sprites'

type Mastery = Extract<QueuedCelebration, { kind: 'mastery' }>
type Promotion = Extract<QueuedCelebration, { kind: 'promotion' }>

/** 전직 연출 시간표(ms): 기존 외형 → 분야 문장 → 새 외형. 합쳐서 900ms */
const EMBLEM_AT = 300
const REVEAL_AT = 600

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** 달성 도장 안의 체크 표시 (7×6 도트) */
const CHECK = ['......X', '.....XX', 'X...XX.', 'XX.XX..', '.XXX...', '..X....']

function Stamp() {
  return (
    <div className="fx-stamp flex items-center justify-center w-14 h-14 border-[3px] border-mint bg-panel" aria-hidden="true">
      <svg viewBox="0 0 7 6" width="35" height="30" shapeRendering="crispEdges">
        {CHECK.flatMap((row, y) => [...row].map((ch, x) => (ch === 'X' ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="var(--color-mint)" /> : null)))}
      </svg>
    </div>
  )
}

/** 달성·전직 연출 창. 대기열의 첫 사건을 하나씩 보여 준다 (달성 → 그 분야의 전직 순서) */
export function CelebrationOverlay() {
  const { celebrations } = useWorld()
  const current = celebrations[0]
  if (!current) return null
  return current.kind === 'mastery'
    ? <MasteryScene key={current.id} c={current} />
    : <PromotionScene key={current.id} c={current} />
}

function Dialog({ titleId, onClose, children }: { titleId: string; onClose: () => void; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    const prevFocus = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    box.current?.querySelector<HTMLElement>('[data-primary]')?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose() } }
    window.addEventListener('keydown', onKey, true)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey, true)
      prevFocus?.focus?.()
    }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75" onClick={onClose}>
      <div ref={box} role="dialog" aria-modal="true" aria-labelledby={titleId} className="card w-full max-w-sm text-center space-y-3" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

function Stage({ pulse, children }: { pulse?: boolean; children: ReactNode }) {
  return (
    <div className={`relative flex items-center justify-center gap-4 h-56 bg-[radial-gradient(circle_at_50%_30%,#0f3460_0,#16213e_60%)] border-2 border-edge ${pulse ? 'fx-pulse' : ''}`}>
      {children}
    </div>
  )
}

function MasteryScene({ c }: { c: Mastery }) {
  const { world, dismissCelebration } = useWorld()
  const ch = world.character
  const titleId = useId()
  const left = c.nextTier ? c.nextTier.requiredMastered - c.masteredCount : 0
  return (
    <Dialog titleId={titleId} onClose={dismissCelebration}>
      <Stage>
        <PixelCanvas appearance={ch.appearance} outfit={ch.equippedOutfit} accessory={ch.equippedAccessory} scale={6} />
        <Stamp />
      </Stage>
      <div aria-live="polite" className="space-y-1">
        <div className="text-xs text-mint">스킬 달성</div>
        <h2 id={titleId} className="text-lg">{c.skill.name}</h2>
        {c.domain && (
          <div className="text-xs text-muted">{c.domain.icon} {c.domain.name} · 달성 스킬 {c.masteredCount}/{c.totalSkills}</div>
        )}
        <div className="text-xs text-gold min-h-4">
          {c.promoted ? '전직 조건을 채웠습니다' : c.nextTier && left > 0 ? `다음 전직 「${c.nextTier.name}」까지 ${left}개` : ''}
        </div>
      </div>
      <button data-primary className="btn btn-gold w-full" onClick={dismissCelebration}>{c.promoted ? '전직 보기' : '확인'}</button>
    </Dialog>
  )
}

function PromotionScene({ c }: { c: Promotion }) {
  const { world, derived, dismissCelebration, saveCharacter } = useWorld()
  const ch = world.character
  const titleId = useId()
  const [phase, setPhase] = useState<0 | 1 | 2>(() => (prefersReducedMotion() ? 2 : 0))
  useEffect(() => {
    if (prefersReducedMotion()) return
    const a = window.setTimeout(() => setPhase(1), EMBLEM_AT)
    const b = window.setTimeout(() => setPhase(2), REVEAL_AT)
    return () => { window.clearTimeout(a); window.clearTimeout(b) }
  }, [])

  const fromOutfit = c.from?.outfit ?? DEFAULT_OUTFIT
  const toOutfit = c.to.outfit ?? fromOutfit
  const fromName = c.from?.name ?? c.domain.baseJobName
  const done = phase === 2
  const left = c.nextTier ? c.nextTier.requiredMastered - c.masteredCount : 0
  const canEquip = !!c.to.outfit && ch.equippedOutfit !== c.to.outfit && derived.unlocked.includes(`outfit:${c.to.outfit}`)
  const unlocks = [
    c.to.outfit ? `스킨 「${spriteByKey(c.to.outfit)?.label ?? c.to.outfit}」` : '',
    c.to.title ? `칭호 「${c.to.title}」` : '',
  ].filter(Boolean)
  const equip = () => {
    void saveCharacter({ ...ch, equippedOutfit: c.to.outfit })
    dismissCelebration()
  }

  return (
    <Dialog titleId={titleId} onClose={dismissCelebration}>
      <Stage pulse={done}>
        {phase === 1 ? (
          <div className="flex items-center justify-center w-24 h-24 text-5xl bg-panel border-[3px]" style={{ borderColor: c.domain.color }} aria-hidden="true">{c.domain.icon}</div>
        ) : (
          <PixelCanvas appearance={ch.appearance} outfit={done ? toOutfit : fromOutfit} accessory={ch.equippedAccessory} scale={6} />
        )}
      </Stage>
      <div aria-live="polite" className="space-y-1">
        <div className="text-xs text-gold">{c.domain.icon} {c.domain.name} · {c.to.tier}차 전직</div>
        <h2 id={titleId} className="text-lg">
          {done ? <><span className="text-muted">{fromName} → </span>{c.to.name}</> : fromName}
        </h2>
        <div className="text-xs text-muted">달성 스킬 {c.to.requiredMastered}개 조건을 채웠습니다</div>
        <div className="text-xs min-h-8 space-y-1" style={{ visibility: done ? 'visible' : 'hidden' }}>
          {unlocks.length > 0 && <div className="text-mint">해금: {unlocks.join(' · ')}</div>}
          <div className="text-muted">
            {!c.nextTier ? '이 분야의 최고 전직입니다' : left > 0 ? `다음 전직 「${c.nextTier.name}」까지 ${left}개` : ''}
          </div>
        </div>
      </div>
      {canEquip ? (
        <div className="flex gap-2">
          <button className="btn btn-ghost flex-1" onClick={dismissCelebration}>나중에</button>
          <button data-primary className="btn btn-gold flex-1" onClick={equip}>새 스킨 입기</button>
        </div>
      ) : (
        <button data-primary className="btn btn-gold w-full" onClick={dismissCelebration}>확인</button>
      )}
    </Dialog>
  )
}
