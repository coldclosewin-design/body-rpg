import type { Task, TaskLog } from '@/types/model'
import { isBetween, weekEndKey, weekStartKey } from './dates'

export interface TaskProgress {
  task: Task
  periodStart: string
  periodEnd: string
  /** 기간 내 누적값 */
  sum: number
  /** 오늘 누적값 */
  todaySum: number
  sessionsDone: number
  sessionsGoal: number
  /** 0~1 (세션 단위가 아닌 값 단위 진행률) */
  ratio: number
  done: boolean
  /** 이번 주 날짜별 세션 달성 여부 (주간 뷰 점 표시용) */
  weekDays: { date: string; sum: number; done: boolean }[]
}

export function taskProgress(task: Task, logs: TaskLog[], today: string, weekStartsOn = 1): TaskProgress {
  const isDay = task.cadence.per === 'day'
  const periodStart = isDay ? today : weekStartKey(today, weekStartsOn)
  const periodEnd = isDay ? today : weekEndKey(today, weekStartsOn)
  const taskLogs = logs.filter((l) => l.taskId === task.id)
  const inPeriod = taskLogs.filter((l) => isBetween(l.date, periodStart, periodEnd))
  const sum = inPeriod.reduce((s, l) => s + l.value, 0)
  const todaySum = taskLogs.filter((l) => l.date === today).reduce((s, l) => s + l.value, 0)
  const sessionsGoal = task.cadence.times
  const sessionsDone = Math.min(Math.floor(sum / task.target), sessionsGoal)
  const ratio = Math.min(1, sum / (task.target * sessionsGoal))

  const ws = weekStartKey(today, weekStartsOn)
  const weekDays: TaskProgress['weekDays'] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(ws + 'T00:00:00')
    d.setDate(d.getDate() + i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const daySum = taskLogs.filter((l) => l.date === key).reduce((s, l) => s + l.value, 0)
    weekDays.push({ date: key, sum: daySum, done: daySum >= task.target })
  }

  return { task, periodStart, periodEnd, sum, todaySum, sessionsDone, sessionsGoal, ratio, done: sessionsDone >= sessionsGoal, weekDays }
}

export const metricLabel = (task: Task, value: number): string => {
  if (task.metric === 'minutes') return `${value}분`
  if (task.metric === 'count') return `${value}회`
  return value >= 1 ? '완료' : '미완료'
}

export const cadenceLabel = (task: Task): string =>
  task.cadence.per === 'day'
    ? (task.cadence.times === 1 ? '매일' : `매일 ${task.cadence.times}회`)
    : `주 ${task.cadence.times}회`
