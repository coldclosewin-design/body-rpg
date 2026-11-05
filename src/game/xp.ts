import type { Task, TaskLog } from '@/types/model'
import { weekStartKey } from './dates'

/** 세션 1회 달성으로 발생한 XP 이벤트. 로그에서 결정론적으로 재계산한다. */
export interface XpEvent {
  taskId: string
  skillId: string
  /** 세션을 완성시킨 로그의 날짜 */
  date: string
  xp: number
  /** 해당 기간 내 몇 번째 세션인지 (1부터) */
  sessionIndex: number
}

export const periodKeyOf = (task: Task, date: string, weekStartsOn: number): string =>
  task.cadence.per === 'day' ? date : weekStartKey(date, weekStartsOn)

/**
 * 과제별로 기간(일/주) 안의 로그를 시간순으로 누적해, 누적값이 target 배수를 넘을 때마다
 * 세션 1회 달성으로 보고 XP 이벤트를 만든다. 기간당 세션 수는 cadence.times 로 제한.
 */
export function computeXpEvents(tasks: Task[], logs: TaskLog[], weekStartsOn = 1): XpEvent[] {
  const byTask = new Map<string, TaskLog[]>()
  for (const log of logs) {
    const arr = byTask.get(log.taskId) ?? []
    arr.push(log)
    byTask.set(log.taskId, arr)
  }
  const events: XpEvent[] = []
  for (const task of tasks) {
    const taskLogs = byTask.get(task.id)
    if (!taskLogs?.length) continue
    const byPeriod = new Map<string, TaskLog[]>()
    for (const log of taskLogs) {
      const pk = periodKeyOf(task, log.date, weekStartsOn)
      const arr = byPeriod.get(pk) ?? []
      arr.push(log)
      byPeriod.set(pk, arr)
    }
    for (const periodLogs of byPeriod.values()) {
      periodLogs.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
      let sum = 0
      let sessions = 0
      for (const log of periodLogs) {
        sum += log.value
        const reached = Math.min(Math.floor(sum / task.target), task.cadence.times)
        while (sessions < reached) {
          sessions++
          events.push({ taskId: task.id, skillId: task.skillId, date: log.date, xp: task.xp, sessionIndex: sessions })
        }
      }
    }
  }
  events.sort((a, b) => a.date.localeCompare(b.date))
  return events
}

export const sumXp = (events: XpEvent[]): number => events.reduce((s, e) => s + e.xp, 0)
