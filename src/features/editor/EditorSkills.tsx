import { useEffect, useState } from 'react'
import { useWorld } from '@/app/world'
import { Empty, Field, confirmDelete } from '@/components/ui'
import type { Skill, Task } from '@/types/model'

export function EditorSkills() {
  const { world, upsertSkill, deleteSkill, upsertTask, deleteTask, newId } = useWorld()
  const domains = [...world.domains].sort((a, b) => a.order - b.order)
  const [domainId, setDomainId] = useState(domains[0]?.id ?? '')
  useEffect(() => { if (!domains.some((d) => d.id === domainId)) setDomainId(domains[0]?.id ?? '') }, [domains, domainId])
  const skills = world.skills.filter((s) => s.domainId === domainId).sort((a, b) => a.order - b.order)

  const addSkill = () => upsertSkill({
    id: newId(), domainId, name: '새 스킬', description: '', status: 'active', goal: { kind: 'weeks', weeks: 4 }, masteredAt: null, order: skills.length,
  })

  if (domains.length === 0) return <Empty>먼저 분야를 추가하세요.</Empty>

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">스킬 = 이루고 싶은 목표(예: 왼발로 축구하기). 과제 = 그걸 위해 반복할 행동(예: 왼발 슈팅 30분 주 3회). 과제 세션을 달성하면 XP, 달성 조건을 채우면 스킬 달성.</p>
      <div className="flex gap-1 flex-wrap">
        {domains.map((d) => (
          <button key={d.id} className={`btn text-xs ${d.id === domainId ? 'btn-gold' : ''}`} onClick={() => setDomainId(d.id)}>{d.icon} {d.name}</button>
        ))}
      </div>
      {skills.length === 0 && <Empty>이 분야에 스킬이 없습니다.</Empty>}
      {skills.map((s) => (
        <SkillCard
          key={s.id} skill={s} tasks={world.tasks.filter((t) => t.skillId === s.id).sort((a, b) => a.order - b.order)}
          onSave={upsertSkill} onDelete={() => confirmDelete(s.name) && deleteSkill(s.id)}
          onSaveTask={upsertTask} onDeleteTask={(id) => confirmDelete('과제') && deleteTask(id)}
          onAddTask={() => upsertTask({ id: newId(), skillId: s.id, name: '새 과제', metric: 'count', target: 10, cadence: { per: 'day', times: 1 }, xp: 10, order: world.tasks.length })}
        />
      ))}
      <button className="btn btn-mint" onClick={addSkill}>+ 스킬 추가</button>
    </div>
  )
}

function SkillCard(props: {
  skill: Skill; tasks: Task[]
  onSave: (s: Skill) => void; onDelete: () => void
  onSaveTask: (t: Task) => void; onDeleteTask: (id: string) => void; onAddTask: () => void
}) {
  const { skill, tasks } = props
  const [draft, setDraft] = useState<Skill>(skill)
  useEffect(() => setDraft(skill), [skill])
  const dirty = JSON.stringify(draft) !== JSON.stringify(skill)
  const set = (patch: Partial<Skill>) => setDraft({ ...draft, ...patch })

  return (
    <div className="card space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Field label="스킬 이름"><input className="input" value={draft.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <Field label="설명" className="md:col-span-2"><input className="input" value={draft.description} onChange={(e) => set({ description: e.target.value })} /></Field>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Field label="달성 조건">
          <select className="input" value={draft.goal.kind} onChange={(e) => set({ goal: e.target.value === 'weeks' ? { kind: 'weeks', weeks: 4 } : { kind: 'total', taskId: tasks[0]?.id ?? '', value: 100 } })}>
            <option value="weeks">N주 동안 주간 목표 충족</option>
            <option value="total">과제 누적값 도달</option>
          </select>
        </Field>
        {draft.goal.kind === 'weeks' ? (
          <Field label="주 수"><input className="input" type="number" min={1} value={draft.goal.weeks} onChange={(e) => set({ goal: { kind: 'weeks', weeks: Number(e.target.value) } })} /></Field>
        ) : (
          <>
            <Field label="기준 과제">
              <select className="input" value={draft.goal.taskId} onChange={(e) => set({ goal: { ...draft.goal as { kind: 'total'; taskId: string; value: number }, taskId: e.target.value } })}>
                <option value="">선택</option>
                {tasks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="누적 목표값"><input className="input" type="number" min={1} value={draft.goal.value} onChange={(e) => set({ goal: { ...draft.goal as { kind: 'total'; taskId: string; value: number }, value: Number(e.target.value) } })} /></Field>
          </>
        )}
        <Field label="상태">
          <select className="input" value={draft.status} onChange={(e) => set({ status: e.target.value as Skill['status'] })}>
            <option value="active">진행 중</option><option value="paused">일시정지</option><option value="mastered">달성</option>
          </select>
        </Field>
      </div>
      <div className="flex gap-2 justify-end">
        <button className="btn btn-ghost text-xs text-accent" onClick={props.onDelete}>스킬 삭제</button>
        <button className="btn btn-gold text-xs" disabled={!dirty} onClick={() => props.onSave(draft)}>{dirty ? '저장' : '저장됨'}</button>
      </div>

      <div className="border-t-2 border-black/40 pt-2 space-y-2">
        <div className="text-xs text-muted">과제</div>
        {tasks.map((t) => <TaskRow key={t.id} task={t} onSave={props.onSaveTask} onDelete={() => props.onDeleteTask(t.id)} />)}
        <button className="btn btn-ghost text-xs" onClick={props.onAddTask}>+ 과제 추가</button>
      </div>
    </div>
  )
}

function TaskRow({ task, onSave, onDelete }: { task: Task; onSave: (t: Task) => void; onDelete: () => void }) {
  const [d, setD] = useState<Task>(task)
  useEffect(() => setD(task), [task])
  const dirty = JSON.stringify(d) !== JSON.stringify(task)
  const set = (patch: Partial<Task>) => setD({ ...d, ...patch })
  return (
    <div className="grid grid-cols-2 md:grid-cols-7 gap-2 items-end bg-black/20 p-2">
      <Field label="과제 이름" className="col-span-2"><input className="input" value={d.name} onChange={(e) => set({ name: e.target.value })} /></Field>
      <Field label="단위">
        <select className="input" value={d.metric} onChange={(e) => { const metric = e.target.value as Task['metric']; set({ metric, target: metric === 'check' ? 1 : d.target }) }}>
          <option value="count">횟수</option><option value="minutes">분</option><option value="check">체크</option>
        </select>
      </Field>
      <Field label="세션 목표"><input className="input" type="number" min={1} disabled={d.metric === 'check'} value={d.target} onChange={(e) => set({ target: Number(e.target.value) })} /></Field>
      <Field label="주기">
        <select className="input" value={d.cadence.per} onChange={(e) => set({ cadence: { ...d.cadence, per: e.target.value as 'day' | 'week' } })}>
          <option value="day">매일</option><option value="week">매주</option>
        </select>
      </Field>
      <Field label="횟수"><input className="input" type="number" min={1} value={d.cadence.times} onChange={(e) => set({ cadence: { ...d.cadence, times: Number(e.target.value) } })} /></Field>
      <div className="flex gap-1 items-end">
        <Field label="XP"><input className="input w-16" type="number" min={0} value={d.xp} onChange={(e) => set({ xp: Number(e.target.value) })} /></Field>
        <button className="btn btn-gold text-xs" disabled={!dirty} onClick={() => onSave(d)}>{dirty ? '저장' : '✓'}</button>
        <button className="btn btn-ghost text-xs" onClick={onDelete}>✕</button>
      </div>
    </div>
  )
}
