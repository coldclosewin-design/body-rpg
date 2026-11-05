import type { World } from '@/types/model'
import { todayKey } from './dates'
import { computeXpEvents, sumXp } from './xp'
import { taskProgress } from './progress'
import { skillMastery } from './mastery'
import { domainStatus } from './jobTier'
import { activeSeason, seasonStatus } from './season'
import { computeStreak } from './streak'
import { taskBadges } from './badges'

export * from './dates'
export * from './xp'
export * from './progress'
export * from './mastery'
export * from './jobTier'
export * from './season'
export * from './streak'
export * from './badges'

/** 화면들이 공통으로 쓰는 파생 상태를 한 번에 계산 */
export function deriveWorld(world: World, today = todayKey()) {
  const wso = world.settings.weekStartsOn
  const xpEvents = computeXpEvents(world.tasks, world.logs, wso)
  const activeSkillIds = new Set(world.skills.filter((s) => s.status === 'active').map((s) => s.id))
  const activeTasks = world.tasks
    .filter((t) => activeSkillIds.has(t.skillId))
    .sort((a, b) => a.order - b.order)
  const progress = activeTasks.map((t) => taskProgress(t, world.logs, today, wso))
  const mastery = world.skills.map((s) => skillMastery(s, world.tasks, world.logs, today, wso))
  const domains = [...world.domains].sort((a, b) => a.order - b.order).map((d) => domainStatus(d, world.skills, xpEvents))
  const season = activeSeason(world.seasons, today)
  const seasonStat = season ? seasonStatus(season, xpEvents, today) : null
  const streak = computeStreak(xpEvents, today)
  const badges = taskBadges(world.tasks, world.logs)
  const todayXp = sumXp(xpEvents.filter((e) => e.date === today))
  const totalXp = sumXp(xpEvents)

  // 해금된 보상 = 캐릭터에 저장된 것 ∪ 시즌 티어 도달 ∪ 전직 코스튬
  const unlocked = new Set(world.character.unlocked)
  for (const r of seasonStat?.unlockedRewards ?? []) unlocked.add(`${r.type}:${r.value}`)
  for (const d of domains) {
    for (const t of d.domain.tiers) {
      if (d.currentTier && t.tier <= d.currentTier.tier) {
        if (t.outfit) unlocked.add(`outfit:${t.outfit}`)
        if (t.title) unlocked.add(`title:${t.title}`)
      }
    }
  }
  // 과거 시즌의 보상도 포함
  for (const s of world.seasons) {
    if (season && s.id === season.id) continue
    for (const r of seasonStatus(s, xpEvents, today).unlockedRewards) unlocked.add(`${r.type}:${r.value}`)
  }

  return { today, xpEvents, activeTasks, progress, mastery, domains, season, seasonStat, streak, badges, todayXp, totalXp, unlocked: [...unlocked] }
}
export type Derived = ReturnType<typeof deriveWorld>
