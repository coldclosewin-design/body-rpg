import type { Task, TaskLog } from '@/types/model'

export const BADGE_THRESHOLDS = [100, 500, 1000, 5000, 10000]

export interface TaskBadge {
  task: Task
  total: number
  earned: number[]
  next: number | null
}

/** 과제별 누적값 뱃지 (count/minutes 만). 추상 스탯 대신 "누적 숫자"가 자랑거리. */
export function taskBadges(tasks: Task[], logs: TaskLog[]): TaskBadge[] {
  return tasks
    .filter((t) => t.metric !== 'check')
    .map((task) => {
      const total = logs.filter((l) => l.taskId === task.id).reduce((s, l) => s + l.value, 0)
      const earned = BADGE_THRESHOLDS.filter((th) => total >= th)
      const next = BADGE_THRESHOLDS.find((th) => total < th) ?? null
      return { task, total, earned, next }
    })
}
