import { describe, expect, it } from 'vitest'
import type { Domain, Season, Skill, Task, TaskLog } from '@/types/model'
import { addDays, weekStartKey } from './dates'
import { computeXpEvents } from './xp'
import { taskProgress } from './progress'
import { skillMastery } from './mastery'
import { domainStatus } from './jobTier'
import { activeSeason, seasonStatus } from './season'
import { computeStreak } from './streak'
import { taskBadges } from './badges'

const task = (over: Partial<Task> = {}): Task => ({
  id: 't1', skillId: 's1', name: '턱걸이', metric: 'count', target: 10,
  cadence: { per: 'day', times: 1 }, xp: 10, order: 0, ...over,
})
const log = (taskId: string, date: string, value: number, i = 0): TaskLog => ({
  id: `${taskId}-${date}-${i}`, taskId, date, value, createdAt: `${date}T10:0${i}:00.000Z`,
})

// 2026-11-02 는 월요일
const MON = '2026-11-02'

describe('dates', () => {
  it('weekStartKey (월요일 시작)', () => {
    expect(weekStartKey('2026-11-05', 1)).toBe(MON)
    expect(weekStartKey('2026-11-08', 1)).toBe(MON) // 일요일은 같은 주
    expect(weekStartKey('2026-11-09', 1)).toBe('2026-11-09')
  })
  it('weekStartKey (일요일 시작)', () => {
    expect(weekStartKey('2026-11-05', 0)).toBe('2026-11-01')
  })
  it('addDays 월 경계', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })
})

describe('computeXpEvents', () => {
  it('매일 과제: 누적이 target 넘으면 세션 1회, 하루 times 초과는 무시', () => {
    const t = task()
    const logs = [log('t1', MON, 4, 0), log('t1', MON, 6, 1), log('t1', MON, 10, 2)]
    const ev = computeXpEvents([t], logs)
    expect(ev).toHaveLength(1)
    expect(ev[0]).toMatchObject({ taskId: 't1', date: MON, xp: 10, sessionIndex: 1 })
  })
  it('주간 과제: 같은 주 안에서 times 까지 세션 인정', () => {
    const t = task({ id: 'w', metric: 'minutes', target: 30, cadence: { per: 'week', times: 3 }, xp: 20 })
    const logs = [log('w', MON, 30), log('w', addDays(MON, 1), 60), log('w', addDays(MON, 3), 30), log('w', addDays(MON, 7), 30)]
    const ev = computeXpEvents([t], logs)
    // 이번 주 30+60+30=120 → 4세션이지만 3으로 제한, 다음 주 30 → 1세션
    expect(ev.filter((e) => e.date < addDays(MON, 7))).toHaveLength(3)
    expect(ev).toHaveLength(4)
  })
})

describe('taskProgress', () => {
  it('주간 과제 진행률과 요일 점', () => {
    const t = task({ id: 'w', metric: 'minutes', target: 30, cadence: { per: 'week', times: 3 } })
    const logs = [log('w', MON, 30), log('w', addDays(MON, 2), 15)]
    const p = taskProgress(t, logs, addDays(MON, 2))
    expect(p.sum).toBe(45)
    expect(p.sessionsDone).toBe(1)
    expect(p.sessionsGoal).toBe(3)
    expect(p.ratio).toBeCloseTo(0.5)
    expect(p.done).toBe(false)
    expect(p.weekDays[0].done).toBe(true)
    expect(p.weekDays[2].done).toBe(false)
    expect(p.todaySum).toBe(15)
  })
})

describe('skillMastery', () => {
  const skill: Skill = { id: 's1', domainId: 'd1', name: '왼발 축구', description: '', status: 'active', goal: { kind: 'weeks', weeks: 2 }, masteredAt: null, order: 0 }
  const shoot = task({ id: 'shoot', metric: 'minutes', target: 30, cadence: { per: 'week', times: 2 } })
  const daily = task({ id: 'daily', target: 10, cadence: { per: 'day', times: 1 } })

  it('weeks 목표: 모든 과제 충족한 주만 센다 (매일 과제는 5일 이상)', () => {
    const logs: TaskLog[] = []
    // 1주차: 슈팅 2회 + 매일 5일 → ok
    logs.push(log('shoot', MON, 30), log('shoot', addDays(MON, 2), 30))
    for (let i = 0; i < 5; i++) logs.push(log('daily', addDays(MON, i), 10))
    // 2주차: 슈팅 2회 + 매일 4일 → fail
    const W2 = addDays(MON, 7)
    logs.push(log('shoot', W2, 30), log('shoot', addDays(W2, 1), 30))
    for (let i = 0; i < 4; i++) logs.push(log('daily', addDays(W2, i), 10))
    const m = skillMastery(skill, [shoot, daily], logs, addDays(W2, 6))
    expect(m.current).toBe(1)
    expect(m.achieved).toBe(false)
    expect(m.weeks?.map((w) => w.ok)).toEqual([true, false])
  })
  it('total 목표', () => {
    const s: Skill = { ...skill, goal: { kind: 'total', taskId: 'daily', value: 25 } }
    const logs = [log('daily', MON, 10), log('daily', addDays(MON, 1), 15)]
    const m = skillMastery(s, [daily], logs, addDays(MON, 1))
    expect(m.current).toBe(25)
    expect(m.achieved).toBe(true)
  })
})

describe('domainStatus (전직)', () => {
  const domain: Domain = {
    id: 'd1', name: '볼러', icon: '⚽', color: '#fff', baseJobName: '견습생', order: 0,
    tiers: [
      { tier: 1, name: '운동깔짝이', title: '깔짝이', requiredMastered: 1, outfit: null },
      { tier: 2, name: '프로운동러', title: '프로', requiredMastered: 3, outfit: 'pro_kit' },
    ],
  }
  const sk = (id: string, status: Skill['status']): Skill => ({ id, domainId: 'd1', name: id, description: '', status, goal: { kind: 'weeks', weeks: 1 }, masteredAt: null, order: 0 })
  it('달성 스킬 수에 따라 티어 결정', () => {
    expect(domainStatus(domain, [sk('a', 'active')], []).jobName).toBe('견습생')
    const one = domainStatus(domain, [sk('a', 'mastered'), sk('b', 'active')], [])
    expect(one.currentTier?.tier).toBe(1)
    expect(one.nextTier?.tier).toBe(2)
    const three = domainStatus(domain, [sk('a', 'mastered'), sk('b', 'mastered'), sk('c', 'mastered')], [])
    expect(three.jobName).toBe('프로운동러')
    expect(three.nextTier).toBeNull()
  })
})

describe('season', () => {
  const season: Season = {
    id: 'se1', name: '시즌1', startDate: '2026-11-01', endDate: '2026-11-30',
    tiers: [
      { tier: 1, xp: 20, reward: { type: 'title', value: '참가자', label: '칭호: 참가자' } },
      { tier: 2, xp: 50, reward: { type: 'accessory', value: 'headband', label: '헤어밴드' } },
    ],
  }
  it('기간 내 XP 만 집계, 티어/보상/진행률', () => {
    const t = task()
    const logs = [log('t1', '2026-10-31', 10), log('t1', '2026-11-01', 10), log('t1', '2026-11-02', 10), log('t1', '2026-11-03', 10)]
    const ev = computeXpEvents([t], logs)
    const st = seasonStatus(season, ev, '2026-11-05')
    expect(st.xp).toBe(30)
    expect(st.currentTier?.tier).toBe(1)
    expect(st.nextTier?.tier).toBe(2)
    expect(st.ratioToNext).toBeCloseTo(10 / 30)
    expect(st.unlockedRewards.map((r) => r.value)).toEqual(['참가자'])
    expect(st.daysLeft).toBe(25)
  })
  it('activeSeason 은 오늘을 포함하는 시즌', () => {
    expect(activeSeason([season], '2026-11-05')?.id).toBe('se1')
    expect(activeSeason([season], '2026-12-01')).toBeNull()
  })
})

describe('streak', () => {
  it('오늘 기록 없으면 어제까지 연속 유지, 끊기면 0', () => {
    const t = task()
    const ev = computeXpEvents([t], [log('t1', '2026-11-01', 10), log('t1', '2026-11-02', 10), log('t1', '2026-11-03', 10)])
    expect(computeStreak(ev, '2026-11-03')).toMatchObject({ current: 3, best: 3, activeToday: true })
    expect(computeStreak(ev, '2026-11-04')).toMatchObject({ current: 3, activeToday: false })
    expect(computeStreak(ev, '2026-11-05').current).toBe(0)
  })
})

describe('badges', () => {
  it('누적 임계값 뱃지', () => {
    const t = task()
    const logs = [log('t1', MON, 60), log('t1', addDays(MON, 1), 50)]
    const [b] = taskBadges([t], logs)
    expect(b.total).toBe(110)
    expect(b.earned).toEqual([100])
    expect(b.next).toBe(500)
  })
})
