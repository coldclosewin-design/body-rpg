import { useEffect, useState } from 'react'
import { useWorld } from '@/app/world'
import { Field, confirmDelete } from '@/components/ui'
import { addDays, todayKey } from '@/game'
import { spritesOfLayer } from '@/pixel/sprites'
import type { Season, SeasonTier } from '@/types/model'

export function EditorSeasons() {
  const { world, upsertSeason, deleteSeason, newId } = useWorld()
  const seasons = [...world.seasons].sort((a, b) => b.startDate.localeCompare(a.startDate))

  const add = () => {
    const last = seasons[0]
    const start = last ? addDays(last.endDate, 1) : todayKey()
    upsertSeason({
      id: newId(), name: `시즌 ${seasons.length + 1}`, startDate: start, endDate: addDays(start, 29),
      tiers: last ? last.tiers.map((t) => ({ ...t })) : [
        { tier: 1, xp: 100, reward: { type: 'title', value: '참가자', label: '칭호: 참가자' } },
        { tier: 2, xp: 300, reward: { type: 'accessory', value: 'headband', label: '헤어밴드' } },
        { tier: 3, xp: 600, reward: null },
      ],
    })
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">시즌 기간 동안 얻은 XP 로 티어가 오르고 보상(칭호·코스튬·액세서리)이 해금됩니다. 보상은 시즌이 끝나도 영구 보관됩니다. 새 시즌은 직전 시즌 티어표를 복제해 만듭니다.</p>
      {seasons.map((s) => <SeasonCard key={s.id} season={s} onSave={upsertSeason} onDelete={() => confirmDelete(s.name) && deleteSeason(s.id)} />)}
      <button className="btn btn-mint" onClick={add}>+ 시즌 추가</button>
    </div>
  )
}

function SeasonCard({ season, onSave, onDelete }: { season: Season; onSave: (s: Season) => void; onDelete: () => void }) {
  const [d, setD] = useState<Season>(season)
  useEffect(() => setD(season), [season])
  const dirty = JSON.stringify(d) !== JSON.stringify(season)
  const set = (patch: Partial<Season>) => setD({ ...d, ...patch })
  const setTier = (i: number, patch: Partial<SeasonTier>) => set({ tiers: d.tiers.map((t, j) => (j === i ? { ...t, ...patch } : t)) })
  const outfits = spritesOfLayer('outfit'), accs = spritesOfLayer('accessory')
  const live = todayKey() >= d.startDate && todayKey() <= d.endDate

  return (
    <div className="card space-y-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Field label={`시즌 이름 ${live ? '(진행 중)' : ''}`} className="col-span-2"><input className="input" value={d.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <Field label="시작"><input className="input" type="date" value={d.startDate} onChange={(e) => set({ startDate: e.target.value })} /></Field>
        <Field label="종료"><input className="input" type="date" value={d.endDate} onChange={(e) => set({ endDate: e.target.value })} /></Field>
      </div>
      <table className="w-full text-xs">
        <thead className="text-muted"><tr><th className="text-left p-1">티어</th><th className="text-left p-1">필요 XP</th><th className="text-left p-1">보상 종류</th><th className="text-left p-1">보상</th><th className="text-left p-1">표시 이름</th><th /></tr></thead>
        <tbody>
          {d.tiers.map((t, i) => (
            <tr key={i}>
              <td className="p-1"><input className="input w-12" type="number" value={t.tier} onChange={(e) => setTier(i, { tier: Number(e.target.value) })} /></td>
              <td className="p-1"><input className="input w-20" type="number" value={t.xp} onChange={(e) => setTier(i, { xp: Number(e.target.value) })} /></td>
              <td className="p-1">
                <select className="input" value={t.reward?.type ?? ''} onChange={(e) => {
                  const type = e.target.value as 'title' | 'outfit' | 'accessory' | ''
                  setTier(i, { reward: type ? { type, value: type === 'title' ? '' : (type === 'outfit' ? outfits[0].key : accs[0].key), label: '' } : null })
                }}>
                  <option value="">없음</option><option value="title">칭호</option><option value="outfit">코스튬</option><option value="accessory">액세서리</option>
                </select>
              </td>
              <td className="p-1">
                {t.reward?.type === 'title' && <input className="input min-w-24" placeholder="칭호 문구" value={t.reward.value} onChange={(e) => setTier(i, { reward: { ...t.reward!, value: e.target.value } })} />}
                {(t.reward?.type === 'outfit' || t.reward?.type === 'accessory') && (
                  <select className="input" value={t.reward.value} onChange={(e) => setTier(i, { reward: { ...t.reward!, value: e.target.value } })}>
                    {(t.reward.type === 'outfit' ? outfits : accs).map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                  </select>
                )}
              </td>
              <td className="p-1">{t.reward && <input className="input min-w-24" placeholder="예: 헤어밴드" value={t.reward.label} onChange={(e) => setTier(i, { reward: { ...t.reward!, label: e.target.value } })} />}</td>
              <td className="p-1"><button className="btn btn-ghost text-xs" onClick={() => set({ tiers: d.tiers.filter((_, j) => j !== i) })}>✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 flex-wrap">
        <button className="btn btn-ghost text-xs" onClick={() => set({ tiers: [...d.tiers, { tier: d.tiers.length + 1, xp: (d.tiers.at(-1)?.xp ?? 0) + 300, reward: null }] })}>+ 티어 추가</button>
        <div className="flex-1" />
        <button className="btn btn-ghost text-xs text-accent" onClick={onDelete}>시즌 삭제</button>
        <button className="btn btn-gold text-xs" disabled={!dirty} onClick={() => onSave({ ...d, tiers: [...d.tiers].sort((a, b) => a.tier - b.tier) })}>{dirty ? '저장' : '저장됨'}</button>
      </div>
    </div>
  )
}
