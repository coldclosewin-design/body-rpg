import { Link } from 'react-router'
import { useWorld } from '@/app/world'
import { Bar, Empty, PageTitle } from '@/components/ui'
import { cadenceLabel, metricLabel } from '@/game'

export function SkillsPage() {
  const { world, derived, upsertSkill } = useWorld()

  return (
    <div className="space-y-3">
      <PageTitle right={<Link to="/edit/skills" className="text-xs text-sky">스킬 편집</Link>}>스킬</PageTitle>
      {world.domains.length === 0 && <Empty>분야가 없습니다. 편집에서 추가하세요.</Empty>}
      {derived.domains.map((d) => {
        const skills = derived.mastery.filter((m) => m.skill.domainId === d.domain.id).sort((a, b) => a.skill.order - b.skill.order)
        return (
          <section key={d.domain.id} className="space-y-2">
            <h2 className="text-sm" style={{ color: d.domain.color }}>{d.domain.icon} {d.domain.name} · <span className="text-gold">{d.jobName}</span></h2>
            {skills.length === 0 && <Empty>스킬 없음</Empty>}
            {skills.map((m) => {
              const tasks = world.tasks.filter((t) => t.skillId === m.skill.id).sort((a, b) => a.order - b.order)
              const s = m.skill
              return (
                <div key={s.id} className={`card ${s.status === 'paused' ? 'opacity-60' : ''}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-bold">{s.status === 'mastered' ? '🏆 ' : ''}{s.name}</div>
                      {s.description && <div className="text-xs text-muted">{s.description}</div>}
                    </div>
                    <div className="text-xs text-right shrink-0">
                      {s.status === 'mastered' ? <span className="text-gold">달성</span> : s.status === 'paused' ? <span className="text-muted">일시정지</span> : <span className="text-mint">진행 중</span>}
                    </div>
                  </div>
                  <div className="text-xs text-muted mt-2">{m.detail}</div>
                  <Bar ratio={s.status === 'mastered' ? 1 : m.ratio} color={d.domain.color} className="mt-1" />
                  {m.weeks && m.weeks.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {m.weeks.map((w) => <span key={w.weekStart} title={`${w.weekStart} 주`} className={`w-3 h-3 border border-black ${w.ok ? 'bg-mint' : 'bg-black/40'}`} />)}
                    </div>
                  )}
                  <ul className="text-xs mt-2 space-y-0.5">
                    {tasks.map((t) => <li key={t.id} className="text-muted">· {t.name} — {cadenceLabel(t)} {metricLabel(t, t.target)} (+{t.xp}XP)</li>)}
                  </ul>
                  <div className="flex gap-2 mt-2">
                    {s.status === 'active' && <button className="btn btn-ghost text-xs" onClick={() => upsertSkill({ ...s, status: 'paused' })}>일시정지</button>}
                    {s.status === 'paused' && <button className="btn btn-ghost text-xs" onClick={() => upsertSkill({ ...s, status: 'active' })}>재개</button>}
                    {s.status !== 'mastered' && <button className="btn btn-ghost text-xs" onClick={() => window.confirm('이 스킬을 달성 처리할까요?') && upsertSkill({ ...s, status: 'mastered', masteredAt: new Date().toISOString() })}>수동 달성</button>}
                    {s.status === 'mastered' && <button className="btn btn-ghost text-xs" onClick={() => upsertSkill({ ...s, status: 'active', masteredAt: null })}>달성 취소</button>}
                  </div>
                </div>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}
