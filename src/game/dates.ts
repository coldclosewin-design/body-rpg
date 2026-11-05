/** 날짜 키(YYYY-MM-DD, 로컬 기준) 유틸. 시간대 문제를 피하기 위해 문자열 키로만 비교한다. */

export const toDateKey = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const parseDateKey = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const todayKey = (): string => toDateKey(new Date())

export const addDays = (key: string, n: number): string => {
  const d = parseDateKey(key)
  d.setDate(d.getDate() + n)
  return toDateKey(d)
}

/** 해당 날짜가 속한 주의 시작일 키. weekStartsOn: 0=일 … 1=월 */
export const weekStartKey = (key: string, weekStartsOn = 1): string => {
  const d = parseDateKey(key)
  const diff = (d.getDay() - weekStartsOn + 7) % 7
  return addDays(key, -diff)
}

export const weekEndKey = (key: string, weekStartsOn = 1): string =>
  addDays(weekStartKey(key, weekStartsOn), 6)

/** a <= key <= b (문자열 비교로 충분) */
export const isBetween = (key: string, a: string, b: string): boolean => key >= a && key <= b

/** [from, to] 구간의 날짜 키 목록 */
export const dateRange = (from: string, to: string): string[] => {
  const out: string[] = []
  let k = from
  while (k <= to) { out.push(k); k = addDays(k, 1) }
  return out
}

export const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']
export const weekdayLabel = (key: string): string => WEEKDAY_KO[parseDateKey(key).getDay()]
