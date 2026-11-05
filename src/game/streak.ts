import { addDays } from './dates'
import type { XpEvent } from './xp'

export interface Streak { current: number; best: number; activeToday: boolean }

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
  return { current, best, activeToday }
}
