import type { Skill, Task, TaskLog } from '@/types/model'
import { addDays, isBetween, weekStartKey } from './dates'

/** 매일 과제가 "주간 충족"으로 인정되려면 그 주에 달성해야 하는 최소 일수 */
export const DAY_TASK_WEEKLY_MIN = 5

export interface MasteryProgress {
  skill: Skill
  current: number
  goal: number
  ratio: number
  achieved: boolean
  /** 사람이 읽는 설명 */
  detail: string
  /** weeks 목표일 때: 주별 충족 여부 (주 시작일 키 → 충족) */
  weeks?: { weekStart: string; ok: boolean }[]
}

const weekOk = (tasks: Task[], logs: TaskLog[], weekStart: string): boolean => {
  const weekEnd = addDays(weekStart, 6)
  return tasks.every((task) => {
    const inWeek = logs.filter((l) => l.taskId === task.id && isBetween(l.date, weekStart, weekEnd))
    if (task.cadence.per === 'week') {
      const sum = inWeek.reduce((s, l) => s + l.value, 0)
      return Math.floor(sum / task.target) >= task.cadence.times
    }
    // 매일 과제: 하루 누적이 target*times 이상인 날이 DAY_TASK_WEEKLY_MIN 일 이상
    const byDay = new Map<string, number>()
    for (const l of inWeek) byDay.set(l.date, (byDay.get(l.date) ?? 0) + l.value)
    let okDays = 0
    for (const v of byDay.values()) if (v >= task.target * task.cadence.times) okDays++
    return okDays >= Math.min(DAY_TASK_WEEKLY_MIN, 7)
  })
}

export function skillMastery(skill: Skill, allTasks: Task[], logs: TaskLog[], today: string, weekStartsOn = 1): MasteryProgress {
  const tasks = allTasks.filter((t) => t.skillId === skill.id)
  if (skill.goal.kind === 'total') {
    const goalTaskId = skill.goal.taskId
    const total = logs.filter((l) => l.taskId === goalTaskId).reduce((s, l) => s + l.value, 0)
    const goal = skill.goal.value
    const task = tasks.find((t) => t.id === goalTaskId)
    return {
      skill, current: total, goal, ratio: Math.min(1, total / goal), achieved: total >= goal,
      detail: `${task?.name ?? '과제'} 누적 ${total} / ${goal}`,
    }
  }
  // weeks: 모든 과제 주간 목표 충족 주 수
  const goal = skill.goal.weeks
  if (tasks.length === 0) {
    return { skill, current: 0, goal, ratio: 0, achieved: false, detail: '등록된 과제 없음', weeks: [] }
  }
  const skillLogs = logs.filter((l) => tasks.some((t) => t.id === l.taskId))
  const weeks: { weekStart: string; ok: boolean }[] = []
  if (skillLogs.length) {
    const first = skillLogs.reduce((m, l) => (l.date < m ? l.date : m), skillLogs[0].date)
    let ws = weekStartKey(first, weekStartsOn)
    const currentWs = weekStartKey(today, weekStartsOn)
    while (ws <= currentWs) {
      weeks.push({ weekStart: ws, ok: weekOk(tasks, skillLogs, ws) })
      ws = addDays(ws, 7)
    }
  }
  const current = weeks.filter((w) => w.ok).length
  return {
    skill, current, goal, ratio: Math.min(1, current / goal), achieved: current >= goal,
    detail: `주간 목표 충족 ${current} / ${goal}주`, weeks,
  }
}
