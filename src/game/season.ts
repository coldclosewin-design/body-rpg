import type { Reward, Season, SeasonTier } from '@/types/model'
import { isBetween } from './dates'
import type { XpEvent } from './xp'
import type { StreakBonus } from './streak'

/** 30일 시즌 기준 기본 티어 XP 곡선 (예시 과제를 꾸준히 하면 T5 도달 가능한 수준) */
export const BASE_SEASON_TIER_XP = [80, 250, 500, 800, 1100]
export const BASE_SEASON_DAYS = 30

export const seasonDays = (startDate: string, endDate: string): number =>
  Math.max(1, Math.round((new Date(endDate + 'T00:00:00').getTime() - new Date(startDate + 'T00:00:00').getTime()) / 86400000) + 1)

/** 시즌 길이에 비례해 기본 곡선을 늘리거나 줄인다 (10 단위 반올림) */
export function defaultSeasonTierXp(startDate: string, endDate: string): number[] {
  const ratio = seasonDays(startDate, endDate) / BASE_SEASON_DAYS
  return BASE_SEASON_TIER_XP.map((xp) => Math.max(10, Math.round((xp * ratio) / 10) * 10))
}

/** 기존 티어표의 보상은 유지한 채 필요 XP 만 기본 곡선으로 되돌린다 */
export function applyDefaultCurve(season: Season): Season {
  const curve = defaultSeasonTierXp(season.startDate, season.endDate)
  const tiers = [...season.tiers].sort((a, b) => a.tier - b.tier).map((t, i) => ({
    ...t, xp: curve[i] ?? Math.round((curve.at(-1) ?? 0) * (1 + (i - curve.length + 1) * 0.3) / 10) * 10,
  }))
  return { ...season, tiers }
}

export const activeSeason = (seasons: Season[], today: string): Season | null => {
  const live = seasons.filter((s) => isBetween(today, s.startDate, s.endDate))
  live.sort((a, b) => b.startDate.localeCompare(a.startDate))
  return live[0] ?? null
}

export interface SeasonStatus {
  season: Season
  xp: number
  /** xp 중 스트릭 보너스로 얻은 몫 */
  bonusXp: number
  currentTier: SeasonTier | null
  nextTier: SeasonTier | null
  /** 현재 티어 → 다음 티어 구간 진행률 0~1 (최고 티어면 1) */
  ratioToNext: number
  unlockedRewards: Reward[]
  daysLeft: number
}

export function seasonStatus(season: Season, xpEvents: XpEvent[], today: string, bonuses: StreakBonus[] = []): SeasonStatus {
  const inSeason = (date: string) => isBetween(date, season.startDate, season.endDate)
  const bonusXp = bonuses.filter((b) => inSeason(b.date)).reduce((s, b) => s + b.xp, 0)
  const xp = xpEvents.filter((e) => inSeason(e.date)).reduce((s, e) => s + e.xp, 0) + bonusXp
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
  return { season, xp, bonusXp, currentTier, nextTier, ratioToNext, unlockedRewards, daysLeft }
}
