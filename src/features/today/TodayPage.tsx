import { useEffect, useMemo, useState } from 'react'
import { useWorld } from '@/app/world'
import { Bar, Empty, PageTitle } from '@/components/ui'
import { cadenceLabel, metricLabel, weekdayLabel, STREAK_BONUS_XP, type TaskProgress } from '@/game'
import { PixelCanvas } from '@/pixel/PixelCanvas'
import type { Domain, Skill } from '@/types/model'
import { Link } from 'react-router'

/**
 * 오늘 화면 — "과제 보관함" 구조.
 * 본문에는 먼저 할 미완료 과제 3개만 카드로 두고, 전체 과제는 보관함(PC 우측 패널 / 폰 바텀시트)에
 * 한 줄 행으로 모은다. 행을 누르면 그 자리에서 기록 도구가 펼쳐진다.
 */

/** 과제 + 그 과제가 속한 스킬·분야 */
interface Item { p: TaskProgress; skill: Skill | undefined; domain: Domain | null }

const FOCUS_COUNT = 3
const HIDE_DONE_KEY = 'today.hideDone'
const readHideDone = (): boolean => { try { return localStorage.getItem(HIDE_DONE_KEY) === '1' } catch { return false } }

export function TodayPage() {
  const { world, derived } = useWorld()
  const { progress, seasonStat, streak, todayXp, today } = derived
  /* 한 번이라도 스트릭이 있었는데 지금 0이면 나태 고블린 등장 */
  const goblin = streak.current === 0 && streak.best > 0
  const [sheetOpen, setSheetOpen] = useState(false)

  /* 분야 순서 → 과제 순서로 정렬한 전체 과제 */
  const items = useMemo<Item[]>(() => {
    const skillById = new Map(world.skills.map((s) => [s.id, s]))
    const domains = derived.domains.map((d) => d.domain)
    const rank = new Map(domains.map((d, i) => [d.id, i]))
    return progress
      .map((p) => {
        const skill = skillById.get(p.task.skillId)
        return { p, skill, domain: domains.find((d) => d.id === skill?.domainId) ?? null }
      })
      .sort((a, b) => (rank.get(a.domain?.id ?? '') ?? 999) - (rank.get(b.domain?.id ?? '') ?? 999))
  }, [world.skills, derived.domains, progress])

  const total = items.length
  const undone = items.filter((it) => !it.p.done)
  const doneTotal = total - undone.length
  const focus = undone.slice(0, FOCUS_COUNT)

  return (
    <div>
      <PageTitle right={<span className="text-xs text-muted">{today} ({weekdayLabel(today)})</span>}>오늘의 퀘스트</PageTitle>

      <div className="lg:flex lg:items-start lg:gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          {/* 상단 요약 */}
          <div className="card flex items-center gap-3">
            <PixelCanvas appearance={world.character.appearance} outfit={world.character.equippedOutfit} accessory={world.character.equippedAccessory} scale={3} />
            <div className="flex-1 min-w-0 text-sm space-y-1">
              <div className="flex justify-between"><span>오늘 XP</span><span className="text-gold">+{todayXp}</span></div>
              <div className="flex justify-between">
                <span>🔥 스트릭</span>
                <span>
                  {streak.current}일 {streak.activeToday ? '' : '(오늘 아직)'}
                  <span className="text-[10px] text-muted"> · {streak.bonusToday ? <span className="text-gold">보너스 +{STREAK_BONUS_XP}!</span> : `보너스까지 ${streak.daysToBonus}일`}</span>
                </span>
              </div>
              {seasonStat ? (
                <div>
                  <div className="flex justify-between text-xs text-muted">
                    <span>{seasonStat.season.name} · T{seasonStat.currentTier?.tier ?? 0}</span>
                    <span>{seasonStat.xp}{seasonStat.nextTier ? ` / ${seasonStat.nextTier.xp}` : ''} XP · D-{seasonStat.daysLeft}</span>
                  </div>
                  <Bar ratio={seasonStat.ratioToNext} color="var(--color-gold)" />
                </div>
              ) : (
                <div className="text-xs text-muted">진행 중인 시즌 없음 · <Link to="/edit/seasons" className="text-sky">시즌 만들기</Link></div>
              )}
            </div>
          </div>

          {goblin && (
            <div className="card flex items-center gap-3 border border-mint/60">
              <PixelCanvas appearance={world.character.appearance} outfit="goblin" scale={3} />
              <div className="text-sm space-y-1">
                <div className="font-bold text-mint">나태 고블린이 나타났다!</div>
                <div className="text-xs text-muted">스트릭이 끊겼습니다 (최고 {streak.best}일). 오늘 과제를 하나 완료하면 쫓아낼 수 있습니다.</div>
              </div>
            </div>
          )}

          {total === 0 && <Empty>활성 스킬에 과제가 없습니다. <Link to="/edit/skills" className="text-sky">편집에서 추가</Link></Empty>}

          {total > 0 && (
            <>
              <div className="flex items-baseline justify-between pt-1">
                <span className="font-bold">{undone.length > 0 ? '먼저 할 과제' : '오늘의 과제'}</span>
                <span className="text-xs text-muted">남은 {undone.length}개 · 완료 <span className="text-mint">{doneTotal}/{total}</span></span>
              </div>
              {focus.map((it) => <FocusCard key={it.p.task.id} item={it} />)}
              {undone.length === 0 && <Empty>오늘 과제를 모두 끝냈습니다 ✓</Empty>}
              {undone.length > focus.length && (
                <div className="hidden lg:block text-xs text-muted">나머지 {undone.length - focus.length}개는 오른쪽 과제 보관함에서 바로 기록할 수 있습니다.</div>
              )}
              {/* 폰: 전체 과제는 바텀시트로. (.btn 의 display 가 lg:hidden 보다 우선하므로 감싸서 숨긴다) */}
              <div className="lg:hidden">
                <button className="btn btn-gold w-full" aria-haspopup="dialog" onClick={() => setSheetOpen(true)}>과제 목록 · 전체 {total}개</button>
              </div>
            </>
          )}
        </div>

        {/* PC: 우측 고정 과제 보관함 */}
        {total > 0 && (
          <aside className="hidden lg:flex flex-col w-80 shrink-0 sticky top-6 max-h-[calc(100vh-3rem)] bg-panel border-2 border-edge shadow-[3px_3px_0_var(--color-edge)]" aria-label="과제 보관함">
            <TaskBoard items={items} />
          </aside>
        )}
      </div>

      {sheetOpen && <BottomSheet onClose={() => setSheetOpen(false)}><TaskBoard items={items} onClose={() => setSheetOpen(false)} /></BottomSheet>}
    </div>
  )
}

/** 폰 바텀시트. 바깥을 누르거나 Esc 로 닫히고, 열려 있는 동안 뒤 화면 스크롤을 막는다 */
function BottomSheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [onClose])
  return (
    <div className="lg:hidden fixed inset-0 z-[25] flex flex-col justify-end bg-black/60" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="과제 보관함" className="flex flex-col max-h-[85vh] bg-panel border-t-4 border-edge" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

/** 과제 보관함: 분야 필터 + 완료 포함 여부 + 한 줄 행 목록. PC 패널과 폰 시트가 같이 쓴다 */
function TaskBoard({ items, onClose }: { items: Item[]; onClose?: () => void }) {
  const [filter, setFilter] = useState<string>('all')
  const [hideDone, setHideDone] = useState(readHideDone)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)

  const shown = hideDone ? items.filter((it) => !it.p.done) : items
  /* 과제가 있는 분야만 칩으로 */
  const domains = useMemo(() => {
    const seen = new Map<string, Domain>()
    for (const it of items) if (it.domain) seen.set(it.domain.id, it.domain)
    return [...seen.values()]
  }, [items])
  const activeFilter = filter === 'all' || domains.some((d) => d.id === filter) ? filter : 'all'
  const list = activeFilter === 'all' ? shown : shown.filter((it) => it.domain?.id === activeFilter)
  /* 남은 과제를 위로, 끝낸 과제를 아래로 */
  const ordered = [...list.filter((it) => !it.p.done), ...list.filter((it) => it.p.done)]
  const remaining = items.filter((it) => !it.p.done).length

  const toggleHideDone = () => {
    const next = !hideDone
    setHideDone(next)
    try { localStorage.setItem(HIDE_DONE_KEY, next ? '1' : '0') } catch { /* 저장 실패해도 화면은 동작 */ }
  }
  const chip = (on: boolean) => `px-2 py-1 text-xs border-2 ${on ? 'bg-panel2 text-gold font-bold border-gold' : 'text-muted border-muted/50'}`

  return (
    <>
      <div className="p-3 space-y-2 border-b-2 border-edge">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold">과제 보관함</span>
          <span className="flex items-center gap-2 text-xs text-muted">
            전체 {items.length} · 남은 {remaining}
            {onClose && <button className="btn btn-ghost text-xs px-2 py-1" onClick={onClose}>닫기</button>}
          </span>
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="분야 필터">
          <button className={chip(activeFilter === 'all')} aria-pressed={activeFilter === 'all'} onClick={() => setFilter('all')}>전체 {shown.length}</button>
          {domains.map((d) => (
            <button key={d.id} className={chip(activeFilter === d.id)} aria-pressed={activeFilter === d.id} onClick={() => setFilter(d.id)}>
              {d.icon} {d.name} {shown.filter((it) => it.domain?.id === d.id).length}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer select-none">
          <input type="checkbox" checked={!hideDone} onChange={toggleHideDone} /> 완료한 과제 포함
        </label>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:var(--color-panel2)_transparent]">
        {ordered.map((it) => (
          <TaskRow key={it.p.task.id} item={it} open={openTaskId === it.p.task.id} onToggle={() => setOpenTaskId((cur) => (cur === it.p.task.id ? null : it.p.task.id))} />
        ))}
        {ordered.length === 0 && <div className="p-4 text-center text-sm text-muted">{remaining === 0 ? '오늘 과제를 모두 끝냈습니다 ✓' : '이 분야에 남은 과제가 없습니다'}</div>}
      </div>
    </>
  )
}

/** 과제 한 개의 기록 동작과 표시용 값 */
function useTaskLog({ p }: Item) {
  const { world, derived, addLog, removeLog } = useWorld()
  const { task } = p
  const lastToday = [...world.logs].filter((l) => l.taskId === task.id && l.date === derived.today).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  const isCheck = task.metric === 'check'
  const checkedToday = p.todaySum >= 1
  const unit = task.metric === 'minutes' ? '분' : task.metric === 'count' ? '회' : ''
  /* 한 줄 요약: 수치형은 누적/목표, 체크형은 주기와 회차 */
  const summary = isCheck
    ? (p.sessionsGoal === 1 ? cadenceLabel(task) : `${cadenceLabel(task)} · ${p.sessionsDone}/${p.sessionsGoal}`)
    : `${p.sum}/${task.target * task.cadence.times}${unit}`
  const toggleCheck = () => { if (checkedToday) { if (lastToday) void removeLog(lastToday.id) } else void addLog(task.id, 1) }
  return { task, lastToday, isCheck, checkedToday, summary, toggleCheck, addLog, removeLog }
}

function ThinBar({ ratio, color = 'var(--color-mint)' }: { ratio: number; color?: string }) {
  return (
    <div className="h-[3px] bg-black/40">
      <div style={{ width: `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`, height: '100%', background: color, transition: 'width .3s' }} />
    </div>
  )
}

function WeekDots({ p }: { p: TaskProgress }) {
  return (
    <span className="flex gap-1">
      {p.weekDays.map((d) => (
        <span key={d.date} title={d.date} className={`inline-block w-3 h-3 border border-edge ${d.done ? 'bg-mint' : d.sum > 0 ? 'bg-sky/60' : 'bg-black/40'}`} />
      ))}
    </span>
  )
}

/** 기록 버튼 줄: 체크형은 완료/취소, 수치형은 빠른 입력 + 직접 입력 + 마지막 기록 취소 */
function LogControls({ item }: { item: Item }) {
  const { task, lastToday, isCheck, checkedToday, toggleCheck, addLog, removeLog } = useTaskLog(item)
  const [custom, setCustom] = useState('')
  const steps = task.metric === 'count' ? [1, 5] : [5, 15]
  const quick: { label: string; value: number }[] = isCheck ? [] : [
    ...steps.filter((v) => v !== task.target).map((v) => ({ label: `+${v}${task.metric === 'minutes' ? '분' : ''}`, value: v })),
    { label: task.metric === 'count' ? `+${task.target} 세트` : `+${task.target}분`, value: task.target },
  ]
  const submitCustom = (e: React.FormEvent) => {
    e.preventDefault()
    const v = Number(custom)
    if (v > 0) { void addLog(task.id, v); setCustom('') }
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {isCheck ? (
        checkedToday
          ? <button className="btn btn-ghost" onClick={toggleCheck}>완료 취소</button>
          : <button className="btn btn-mint flex-1" onClick={toggleCheck}>✓ 완료</button>
      ) : (
        <>
          {/* 세션 1회를 채우는 버튼만 민트(완료), 나머지는 기본 */}
          {quick.map((q) => (
            <button key={q.label} className={`btn ${q.value === task.target ? 'btn-mint' : ''}`} onClick={() => addLog(task.id, q.value)}>{q.label}</button>
          ))}
          <form onSubmit={submitCustom} className="flex gap-1">
            {/* .input 의 w-full 이 유틸리티보다 우선하므로 폭은 style 로 고정 */}
            <input className="input" style={{ width: '5rem' }} inputMode="numeric" placeholder="직접" aria-label={`${task.name} 직접 입력`} value={custom} onChange={(e) => setCustom(e.target.value)} />
            <button className="btn btn-ghost shrink-0 whitespace-nowrap">기록</button>
          </form>
          {lastToday && <button className="btn btn-ghost text-xs" title="오늘 마지막 기록 취소" onClick={() => removeLog(lastToday.id)}>↶ {metricLabel(task, lastToday.value)}</button>}
        </>
      )}
    </div>
  )
}

/** 본문의 "먼저 할 과제" 카드: 기록 도구가 처음부터 보인다 */
function FocusCard({ item }: { item: Item }) {
  const { p, skill, domain } = item
  const { task } = p
  return (
    <div className="card" style={{ borderLeft: `6px solid ${domain?.color ?? '#999'}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs text-muted truncate">{domain?.icon} {domain?.name} · {skill?.name}</div>
          <div className="font-bold">{task.name} <span className="text-xs text-muted font-normal">{cadenceLabel(task)} · {metricLabel(task, task.target)}</span></div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm">{p.sessionsDone}/{p.sessionsGoal}</div>
          <div className="text-[10px] text-muted">+{task.xp}XP/세션</div>
        </div>
      </div>
      <Bar ratio={p.ratio} color={domain?.color} className="my-2" />
      <div className="flex justify-between text-xs text-muted mb-2">
        <span>{task.cadence.per === 'day' ? '오늘' : '이번 주'} {metricLabel(task, p.sum)} / {metricLabel(task, task.target * task.cadence.times)}</span>
        <WeekDots p={p} />
      </div>
      <LogControls item={item} />
    </div>
  )
}

/** 보관함의 한 줄 행. 체크형은 왼쪽 칸으로 바로 완료, 그 밖에는 행을 눌러 펼친다 */
function TaskRow({ item, open, onToggle }: { item: Item; open: boolean; onToggle: () => void }) {
  const { p, skill, domain } = item
  const { task, isCheck, checkedToday, summary, toggleCheck } = useTaskLog(item)
  const color = domain?.color ?? '#999'
  const box = 'shrink-0 w-6 h-6 border-2 border-edge flex items-center justify-center text-xs text-edge'
  const boxFill = p.done || (isCheck && checkedToday) ? 'bg-mint' : p.todaySum > 0 ? 'bg-sky/60' : 'bg-black/40'

  return (
    <div className={`border-b-2 border-edge/60 ${p.done ? 'opacity-70' : ''}`} style={{ borderLeft: `4px solid ${color}` }}>
      <div className="flex items-center gap-2 pl-2">
        {isCheck
          ? <button className={`${box} ${boxFill}`} aria-label={checkedToday ? `${task.name} 완료 취소` : `${task.name} 완료`} aria-pressed={checkedToday} onClick={toggleCheck}>{checkedToday ? '✓' : ''}</button>
          : <span className={`${box} ${boxFill}`} aria-hidden="true">{p.done ? '✓' : ''}</span>}
        <button className="flex-1 min-w-0 flex items-center gap-2 py-2.5 pr-3 text-left" aria-expanded={open} onClick={onToggle}>
          <span className="flex-1 min-w-0 truncate"><span aria-hidden="true">{domain?.icon} </span>{task.name}</span>
          <span className={`shrink-0 text-xs ${p.done ? 'text-mint' : 'text-ink'}`}>{summary}</span>
          <span className="shrink-0 w-4 text-center text-muted text-xs" aria-hidden="true">{open ? '▾' : '▸'}</span>
        </button>
      </div>
      <ThinBar ratio={p.ratio} color={color} />

      {open && (
        <div className="px-3 py-2 space-y-2 bg-black/20">
          <div className="flex justify-between gap-2 text-xs text-muted">
            <span className="min-w-0 truncate">{domain?.name} · {skill?.name}</span>
            <span className="shrink-0">{p.sessionsDone}/{p.sessionsGoal} · +{task.xp}XP/세션</span>
          </div>
          <div className="flex justify-between gap-2 text-xs text-muted">
            <span>{cadenceLabel(task)} · {task.cadence.per === 'day' ? '오늘' : '이번 주'} {metricLabel(task, p.sum)} / {metricLabel(task, task.target * task.cadence.times)}</span>
            <WeekDots p={p} />
          </div>
          <LogControls item={item} />
        </div>
      )}
    </div>
  )
}
