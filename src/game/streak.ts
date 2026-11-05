import { addDays } from './dates'
import type { XpEvent } from './xp'

export interface Streak {
  current: number
  best: number
  activeToday: boolean
  /** 다음 스트릭 보너스까지 남은 일수 (오늘 달성 기준) */
  daysToBonus: number
  /** 오늘 달성으로 보너스를 받았는지 */
  bonusToday: boolean
}

/** 연속 달성일이 STREAK_BONUS_EVERY 의 배수에 닿을 때마다 시즌 XP 보너스 */
export const STREAK_BONUS_EVERY = 7
export const STREAK_BONUS_XP = 50

export interface StreakBonus { date: string; xp: number; streakDay: number }

/** 세션 달성일을 연속 구간으로 묶어, 7일째·14일째… 되는 날에 보너스 이벤트를 만든다. 끊기면 다시 1부터. */
export function streakBonuses(xpEvents: XpEvent[], every = STREAK_BONUS_EVERY, xp = STREAK_BONUS_XP): StreakBonus[] {
  const days = [...new Set(xpEvents.map((e) => e.date))].sort()
  const out: StreakBonus[] = []
  let run = 0
  let prev: string | null = null
  for (const d of days) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1
    if (run % every === 0) out.push({ date: d, xp, streakDay: run })
    prev = d
  }
  return out
}

/** 세션 달성(XP 이벤트)이 있는 날이 연속된 일수. 오늘 아직 없으면 어제까지의 연속을 유지한다. */
export function computeStreak(xpEvents: XpEvent[], today: string): Streak {
  const days = new Set(xpEvents.map((e) => e.date))
  const activeToday = days.has(today)
  let current = 0
  let cursor = activeToday ? today : addDays(today, -1)
  while (days.has(cursor)) { current++; cursor = addDays(cursor, -1) }

  let best = 0
  const sorted = [...days].sort()
  let run = 0
  let prev: string | null = null
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  const eff = activeToday ? current : current + 1 // 오늘 달성하면 도달하는 연속일
  const rem = eff % STREAK_BONUS_EVERY === 0 ? 0 : STREAK_BONUS_EVERY - (eff % STREAK_BONUS_EVERY)
  const daysToBonus = activeToday ? rem : rem + 1
  const bonusToday = activeToday && current > 0 && current % STREAK_BONUS_EVERY === 0
  return { current, best, activeToday, daysToBonus, bonusToday }
}
