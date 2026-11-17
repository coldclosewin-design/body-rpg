import { describe, expect, it } from 'vitest'
import type { Domain, Skill } from '@/types/model'
import { domainStatus } from './jobTier'
import { celebrationSnapshot, detectCelebrations, promotionOf } from './celebrate'

const NOW = Date.parse('2026-11-17T10:00:00.000Z')
const JUST = '2026-11-17T09:59:50.000Z'

const domain: Domain = {
  id: 'd1', name: '리프터', icon: '💪', color: '#fff', baseJobName: '견습생', order: 0,
  tiers: [
    { tier: 1, name: '운동깔짝이', title: '깔짝이', requiredMastered: 1, outfit: 'tracksuit' },
    { tier: 2, name: '리프터', title: '', requiredMastered: 2, outfit: 'lifter' },
    { tier: 3, name: '철의 기사', title: '기사', requiredMastered: 4, outfit: 'knight' },
  ],
}
const sk = (id: string, status: Skill['status'], masteredAt: string | null = null): Skill => ({
  id, domainId: 'd1', name: id, description: '', status, goal: { kind: 'weeks', weeks: 1 }, masteredAt, order: 0,
})
const state = (skills: Skill[]) => ({ skills, domains: [domainStatus(domain, skills, [])] })
const detect = (before: Skill[], after: Skill[], now = NOW) => {
  const b = state(before)
  const a = state(after)
  return detectCelebrations(celebrationSnapshot(b.skills, b.domains), a.skills, a.domains, now)
}

describe('detectCelebrations (달성·전직 연출)', () => {
  it('변화가 없으면 아무것도 없다', () => {
    const skills = [sk('a', 'mastered', JUST), sk('b', 'active')]
    expect(detect(skills, skills)).toEqual([])
  })

  it('첫 스킬 달성 → 달성 뒤에 1차 전직', () => {
    const out = detect([sk('a', 'active'), sk('b', 'active')], [sk('a', 'mastered', JUST), sk('b', 'active')])
    expect(out.map((c) => c.kind)).toEqual(['mastery', 'promotion'])
    const [m, p] = out
    if (m.kind !== 'mastery' || p.kind !== 'promotion') throw new Error('순서가 다름')
    expect(m.promoted).toBe(true)
    expect(m.masteredCount).toBe(1)
    expect(p.from).toBeNull()
    expect(p.to.name).toBe('운동깔짝이')
    expect(p.nextTier?.name).toBe('리프터')
  })

  it('차수가 오르지 않는 달성은 달성 연출만, 다음 전직 안내 포함', () => {
    const before = [sk('a', 'mastered', '2026-11-01T00:00:00.000Z'), sk('b', 'mastered', '2026-11-02T00:00:00.000Z'), sk('c', 'active'), sk('d', 'active')]
    const after = before.map((s) => (s.id === 'c' ? sk('c', 'mastered', JUST) : s))
    const out = detect(before, after)
    expect(out).toHaveLength(1)
    const m = out[0]
    if (m.kind !== 'mastery') throw new Error('달성이 아님')
    expect(m.promoted).toBe(false)
    expect(m.nextTier?.name).toBe('철의 기사')
    expect(m.masteredCount).toBe(3)
  })

  it('두 단계를 한 번에 넘으면 전직은 한 번, 직전 차수에서 현재 차수로', () => {
    const out = detect([sk('a', 'active'), sk('b', 'active')], [sk('a', 'mastered', JUST), sk('b', 'mastered', JUST)])
    expect(out.map((c) => c.kind)).toEqual(['mastery', 'promotion', 'mastery'])
    const p = out[1]
    if (p.kind !== 'promotion') throw new Error('전직이 아님')
    expect(p.from).toBeNull()
    expect(p.to.name).toBe('리프터')
  })

  it('오래전에 달성된 스킬(다른 기기에서 달성)은 연출하지 않는다', () => {
    expect(detect([sk('a', 'active')], [sk('a', 'mastered', '2026-11-16T10:00:00.000Z')])).toEqual([])
  })

  it('직전 상태에 없던 스킬(가져오기·새로 만든 스킬)은 연출하지 않는다', () => {
    expect(detect([], [sk('a', 'mastered', JUST)])).toEqual([])
  })

  it('달성 취소는 연출하지 않는다', () => {
    expect(detect([sk('a', 'mastered', JUST)], [sk('a', 'active')])).toEqual([])
  })
})

describe('promotionOf (다시 보기)', () => {
  it('from 을 주지 않으면 사다리의 바로 아래 단계', () => {
    const d = domainStatus(domain, [sk('a', 'mastered'), sk('b', 'mastered')], [])
    const p = promotionOf(d, domain.tiers[1])
    if (p.kind !== 'promotion') throw new Error('전직이 아님')
    expect(p.from?.name).toBe('운동깔짝이')
    expect(p.nextTier?.name).toBe('철의 기사')
  })
})
