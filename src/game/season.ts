import type { Reward, Season, SeasonTier } from '@/types/model'
import { isBetween } from './dates'
import type { XpEvent } from './xp'

export const activeSeason = (seasons: Season[], today: string): Season | null => {
  const live = seasons.filter((s) => isBetween(today, s.startDate, s.endDate))
  live.sort((a, b) => b.startDate.localeCompare(a.startDate))
  return live[0] ?? null
}

export interface SeasonStatus {
  season: Season
  xp: number
  currentTier: SeasonTier | null
  nextTier: SeasonTier | null
  /** 현재 티어 → 다음 티어 구간 진행률 0~1 (최고 티어면 1) */
  ratioToNext: number
  unlockedRewards: Reward[]
  daysLeft: number
}

export function seasonStatus(season: Season, xpEvents: XpEvent[], today: string): SeasonStatus {
  const xp = xpEvents
    .filter((e) => isBetween(e.date, season.startDate, season.endDate))
    .reduce((s, e) => s + e.xp, 0)
  const tiers = [...season.tiers].sort((a, b) => a.tier - b.tier)
  let currentTier: SeasonTier | null = null
  let nextTier: SeasonTier | null = null
  for (const t of tiers) {
    if (xp >= t.xp) currentTier = t
    else { nextTier = t; break }
  }
  const base = currentTier?.xp ?? 0
  const ratioToNext = nextTier ? Math.min(1, (xp - base) / Math.max(1, nextTier.xp - base)) : 1
  const unlockedRewards = tiers.filter((t) => xp >= t.xp && t.reward).map((t) => t.reward as Reward)
  const ms = new Date(season.endDate + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()
  const daysLeft = Math.max(0, Math.round(ms / 86400000))
  return { season, xp, currentTier, nextTier, ratioToNext, unlockedRewards, daysLeft }
}
