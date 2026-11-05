import { Link } from 'react-router'
import { useWorld } from '@/app/world'
import { Bar, PageTitle } from '@/components/ui'
import { PixelCanvas } from '@/pixel/PixelCanvas'
import { BADGE_THRESHOLDS } from '@/game'

export function CharacterPage() {
  const { world, derived } = useWorld()
  const c = world.character
  const { domains, seasonStat, badges, streak, totalXp, mastery } = derived
  const mastered = mastery.filter((m) => m.skill.status === 'mastered')

  return (
    <div className="space-y-3">
      <PageTitle right={<Link to="/edit/character" className="text-xs text-sky">외형 편집</Link>}>캐릭터</PageTitle>

      <div className="card flex flex-col items-center py-5 gap-2 bg-[radial-gradient(circle_at_50%_30%,#0f3460_0,#16213e_60%)]">
        {c.equippedTitle && <div className="text-xs px-2 py-0.5 bg-gold text-black border-2 border-black">「{c.equippedTitle}」</div>}
        <PixelCanvas appearance={c.appearance} outfit={c.equippedOutfit} accessory={c.equippedAccessory} scale={8} />
        <div className="text-lg">{c.name}</div>
        <div className="text-xs text-muted">총 {totalXp} XP · 🔥 {streak.current}일 (최고 {streak.best}일) · 🏆 스킬 {mastered.length}개 달성</div>
      </div>

      <h2 className="text-sm text-muted">전직 현황</h2>
      {domains.map((d) => (
        <div key={d.domain.id} className="card" style={{ borderLeft: `6px solid ${d.domain.color}` }}>
          <div className="flex justify-between items-baseline">
            <div><span className="mr-1">{d.domain.icon}</span>{d.domain.name} <span className="text-gold ml-1">{d.jobName}</span>{d.currentTier && <span className="text-xs text-muted ml-1">{d.currentTier.tier}차</span>}</div>
            <div className="text-xs text-muted">숙련 {d.xp} XP</div>
          </div>
          <div className="text-xs text-muted mt-1">
            달성 스킬 {d.masteredCount}/{d.totalSkills}
            {d.nextTier ? ` · 다음 전직 「${d.nextTier.name}」까지 ${d.nextTier.requiredMastered - d.masteredCount}개` : ' · 최고 전직 달성!'}
          </div>
          {d.nextTier && <Bar ratio={d.masteredCount / d.nextTier.requiredMastered} color={d.domain.color} className="mt-1" />}
          <div className="flex flex-wrap gap-1 mt-2">
            {d.domain.tiers.map((t) => (
              <span key={t.tier} className={`text-[10px] px-1.5 py-0.5 border border-black ${d.currentTier && t.tier <= d.currentTier.tier ? 'bg-gold text-black' : 'bg-black/40 text-muted'}`}>
                {t.tier}차 {t.name}
              </span>
            ))}
          </div>
        </div>
      ))}

      {seasonStat && (
        <>
          <h2 className="text-sm text-muted">시즌</h2>
          <div className="card">
            <div className="flex justify-between"><span>{seasonStat.season.name}</span><span className="text-xs text-muted">D-{seasonStat.daysLeft}</span></div>
            <div className="text-xs text-muted">{seasonStat.xp} XP · 티어 {seasonStat.currentTier?.tier ?? 0}{seasonStat.nextTier ? ` → ${seasonStat.nextTier.tier} (${seasonStat.nextTier.xp} XP)` : ' (최고)'}</div>
            <Bar ratio={seasonStat.ratioToNext} color="var(--color-gold)" className="my-2" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
              {seasonStat.season.tiers.map((t) => {
                const got = seasonStat.xp >= t.xp
                return (
                  <div key={t.tier} className={`text-[11px] p-1.5 border border-black ${got ? 'bg-panel2' : 'bg-black/30 text-muted'}`}>
                    T{t.tier} · {t.xp}XP<br />{t.reward ? (got ? '🎁 ' : '🔒 ') + t.reward.label : '—'}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      <h2 className="text-sm text-muted">누적 뱃지</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {badges.map((b) => (
          <div key={b.task.id} className="card text-xs">
            <div className="flex justify-between"><span>{b.task.name}</span><span className="text-gold">{b.total}{b.task.metric === 'minutes' ? '분' : '회'}</span></div>
            <div className="flex gap-1 mt-1">
              {BADGE_THRESHOLDS.map((th) => (
                <span key={th} className={`px-1 border border-black ${b.earned.includes(th) ? 'bg-mint text-black' : 'bg-black/40 text-muted'}`}>{th >= 1000 ? `${th / 1000}k` : th}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {mastered.length > 0 && (
        <>
          <h2 className="text-sm text-muted">달성한 스킬</h2>
          <div className="card text-sm space-y-1">
            {mastered.map((m) => <div key={m.skill.id}>🏆 {m.skill.name} <span className="text-xs text-muted">{m.skill.masteredAt?.slice(0, 10)}</span></div>)}
          </div>
        </>
      )}
    </div>
  )
}
