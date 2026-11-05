import { useEffect, useState } from 'react'
import { useWorld } from '@/app/world'
import { Field, confirmDelete } from '@/components/ui'
import { spritesOfLayer } from '@/pixel/sprites'
import type { Domain, JobTier } from '@/types/model'

export function EditorDomains() {
  const { world, upsertDomain, deleteDomain, newId } = useWorld()
  const domains = [...world.domains].sort((a, b) => a.order - b.order)

  const add = () => upsertDomain({
    id: newId(), name: '새 분야', icon: '⭐', color: '#4cc9f0', baseJobName: '견습생', order: domains.length,
    tiers: [{ tier: 1, name: '운동깔짝이', title: '깔짝이', requiredMastered: 1, outfit: 'tracksuit' }],
  })

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">분야 = 직업 트리. 분야 안의 스킬을 몇 개 달성했는지로 전직이 결정됩니다.</p>
      {domains.map((d) => (
        <DomainCard key={d.id} domain={d} onSave={upsertDomain} onDelete={() => confirmDelete(d.name) && deleteDomain(d.id)} />
      ))}
      <button className="btn btn-mint" onClick={add}>+ 분야 추가</button>
    </div>
  )
}

function DomainCard({ domain, onSave, onDelete }: { domain: Domain; onSave: (d: Domain) => void; onDelete: () => void }) {
  const [draft, setDraft] = useState<Domain>(domain)
  useEffect(() => setDraft(domain), [domain])
  const dirty = JSON.stringify(draft) !== JSON.stringify(domain)
  const set = (patch: Partial<Domain>) => setDraft({ ...draft, ...patch })
  const setTier = (i: number, patch: Partial<JobTier>) => set({ tiers: draft.tiers.map((t, j) => (j === i ? { ...t, ...patch } : t)) })
  const outfits = spritesOfLayer('outfit')

  return (
    <div className="card space-y-2" style={{ borderLeft: `6px solid ${draft.color}` }}>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <Field label="아이콘"><input className="input" value={draft.icon} onChange={(e) => set({ icon: e.target.value })} /></Field>
        <Field label="분야 이름" className="col-span-2"><input className="input" value={draft.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <Field label="색상"><input className="input h-8 p-0" type="color" value={draft.color} onChange={(e) => set({ color: e.target.value })} /></Field>
        <Field label="미전직 직업명"><input className="input" value={draft.baseJobName} onChange={(e) => set({ baseJobName: e.target.value })} /></Field>
      </div>

      <div className="text-xs text-muted mt-2">전직 사다리</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-muted"><tr><th className="text-left p-1">차수</th><th className="text-left p-1">직업명</th><th className="text-left p-1">칭호</th><th className="text-left p-1">필요 달성 스킬</th><th className="text-left p-1">직업 스킨</th><th /></tr></thead>
          <tbody>
            {draft.tiers.map((t, i) => (
              <tr key={i}>
                <td className="p-1"><input className="input w-12" type="number" value={t.tier} onChange={(e) => setTier(i, { tier: Number(e.target.value) })} /></td>
                <td className="p-1"><input className="input min-w-28" value={t.name} onChange={(e) => setTier(i, { name: e.target.value })} /></td>
                <td className="p-1"><input className="input min-w-20" value={t.title} onChange={(e) => setTier(i, { title: e.target.value })} /></td>
                <td className="p-1"><input className="input w-16" type="number" value={t.requiredMastered} onChange={(e) => setTier(i, { requiredMastered: Number(e.target.value) })} /></td>
                <td className="p-1">
                  <select className="input" value={t.outfit ?? ''} onChange={(e) => setTier(i, { outfit: e.target.value || null })}>
                    <option value="">없음</option>
                    {outfits.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                  </select>
                </td>
                <td className="p-1"><button className="btn btn-ghost text-xs" onClick={() => set({ tiers: draft.tiers.filter((_, j) => j !== i) })}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button className="btn btn-ghost text-xs" onClick={() => set({ tiers: [...draft.tiers, { tier: draft.tiers.length + 1, name: '새 직업', title: '', requiredMastered: (draft.tiers.at(-1)?.requiredMastered ?? 0) + 2, outfit: null }] })}>+ 단계 추가</button>
        <div className="flex-1" />
        <button className="btn btn-ghost text-xs text-accent" onClick={onDelete}>분야 삭제</button>
        <button className="btn btn-gold text-xs" disabled={!dirty} onClick={() => onSave({ ...draft, tiers: [...draft.tiers].sort((a, b) => a.tier - b.tier) })}>{dirty ? '저장' : '저장됨'}</button>
      </div>
    </div>
  )
}
