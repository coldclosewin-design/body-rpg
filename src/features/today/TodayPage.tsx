import { useState } from 'react'
import { useWorld } from '@/app/world'
import { Bar, Empty, PageTitle } from '@/components/ui'
import { cadenceLabel, metricLabel, weekdayLabel, type TaskProgress } from '@/game'
import { PixelCanvas } from '@/pixel/PixelCanvas'
import { Link } from 'react-router'

export function TodayPage() {
  const { world, derived } = useWorld()
  const { progress, seasonStat, streak, todayXp, today } = derived
  const open = progress.filter((p) => !p.done)
  const done = progress.filter((p) => p.done)

  return (
    <div className="space-y-3">
      <PageTitle right={<span className="text-xs text-muted">{today} ({weekdayLabel(today)})</span>}>오늘의 퀘스트</PageTitle>

      {/* 상단 요약 */}
      <div className="card flex items-center gap-3">
        <PixelCanvas appearance={world.character.appearance} outfit={world.character.equippedOutfit} accessory={world.character.equippedAccessory} scale={3} />
        <div className="flex-1 min-w-0 text-sm space-y-1">
          <div className="flex justify-between"><span>오늘 XP</span><span className="text-gold">+{todayXp}</span></div>
          <div className="flex justify-between"><span>🔥 스트릭</span><span>{streak.current}일 {streak.activeToday ? '' : '(오늘 아직)'}</span></div>
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

      {progress.length === 0 && <Empty>활성 스킬에 과제가 없습니다. <Link to="/edit/skills" className="text-sky">편집에서 추가</Link></Empty>}

      {open.map((p) => <TaskCard key={p.task.id} p={p} />)}
      {done.length > 0 && (
        <>
          <div className="text-xs text-muted pt-2">완료 ✓</div>
          {done.map((p) => <TaskCard key={p.task.id} p={p} />)}
        </>
      )}
    </div>
  )
}

function TaskCard({ p }: { p: TaskProgress }) {
  const { world, derived, addLog, removeLog } = useWorld()
  const [custom, setCustom] = useState('')
  const { task } = p
  const skill = world.skills.find((s) => s.id === task.skillId)
  const domain = world.domains.find((d) => d.id === skill?.domainId)
  const lastToday = [...world.logs].filter((l) => l.taskId === task.id && l.date === derived.today).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

  const unit = task.metric === 'minutes' ? '분' : ''
  const steps = task.metric === 'count' ? [1, 5] : [5, 15]
  const quick: { label: string; value: number }[] = task.metric === 'check' ? [] : [
    ...steps.filter((v) => v !== task.target).map((v) => ({ label: `+${v}${unit}`, value: v })),
    { label: task.metric === 'count' ? `+${task.target} 세트` : `+${task.target}분`, value: task.target },
  ]

  const submitCustom = (e: React.FormEvent) => {
    e.preventDefault()
    const v = Number(custom)
    if (v > 0) { void addLog(task.id, v); setCustom('') }
  }

  return (
    <div className={`card ${p.done ? 'opacity-70' : ''}`} style={{ borderLeft: `6px solid ${domain?.color ?? '#999'}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs text-muted truncate">{domain?.icon} {domain?.name} · {skill?.name}</div>
          <div className="font-bold">{task.name} <span className="text-xs text-muted">{cadenceLabel(task)} · {metricLabel(task, task.target)}</span></div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-gold text-sm">{p.sessionsDone}/{p.sessionsGoal}</div>
          <div className="text-[10px] text-muted">+{task.xp}XP/세션</div>
        </div>
      </div>

      <Bar ratio={p.ratio} color={domain?.color} className="my-2" />
      <div className="flex justify-between text-xs text-muted mb-2">
        <span>{task.cadence.per === 'day' ? '오늘' : '이번 주'} {metricLabel(task, p.sum)} / {metricLabel(task, task.target * task.cadence.times)}</span>
        <span className="flex gap-1">
          {p.weekDays.map((d) => (
            <span key={d.date} title={d.date} className={`inline-block w-3 h-3 border border-black ${d.done ? 'bg-mint' : d.sum > 0 ? 'bg-sky/60' : 'bg-black/40'}`} />
          ))}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {task.metric === 'check' ? (
          p.todaySum >= 1
            ? <button className="btn btn-ghost" onClick={() => lastToday && removeLog(lastToday.id)}>완료 취소</button>
            : <button className="btn btn-mint flex-1" onClick={() => addLog(task.id, 1)}>✓ 완료</button>
        ) : (
          <>
            {quick.map((q) => (
              <button key={q.label} className={`btn ${q.value === task.target ? 'btn-accent' : ''}`} onClick={() => addLog(task.id, q.value)}>{q.label}</button>
            ))}
            <form onSubmit={submitCustom} className="flex gap-1">
              <input className="input w-20" inputMode="numeric" placeholder="직접" value={custom} onChange={(e) => setCustom(e.target.value)} />
              <button className="btn btn-ghost">기록</button>
            </form>
            {lastToday && <button className="btn btn-ghost text-xs" title="오늘 마지막 기록 취소" onClick={() => removeLog(lastToday.id)}>↶ {metricLabel(task, lastToday.value)}</button>}
          </>
        )}
      </div>
    </div>
  )
}
