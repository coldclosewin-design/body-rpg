import type { Domain, JobTier, Skill } from '@/types/model'
import type { DomainStatus } from './jobTier'

/**
 * 화면 연출(달성 도장·전직 교체)을 띄울 사건.
 * 전직은 실제 스킬 달성의 결과로만 생긴다: 방금 달성한 스킬이 있는 분야의 차수가 올랐을 때만 만든다.
 */
export type Celebration =
  | { kind: 'mastery'; skill: Skill; domain: Domain | null; masteredCount: number; totalSkills: number; nextTier: JobTier | null; promoted: boolean }
  | { kind: 'promotion'; domain: Domain; from: JobTier | null; to: JobTier; nextTier: JobTier | null; masteredCount: number }

/** 직전 상태: 스킬별 상태와 분야별 현재 차수(미전직 0) */
export interface CelebrationSnapshot {
  skills: Map<string, Skill['status']>
  tiers: Map<string, number>
}

/** 달성 시각이 이보다 오래됐으면 다른 기기에서 이미 본 달성으로 보고 연출하지 않는다 */
export const CELEBRATE_WINDOW_MS = 2 * 60_000

export const celebrationSnapshot = (skills: Skill[], domains: DomainStatus[]): CelebrationSnapshot => ({
  skills: new Map(skills.map((s) => [s.id, s.status])),
  tiers: new Map(domains.map((d) => [d.domain.id, d.currentTier?.tier ?? 0])),
})

/** 차수 번호로 사다리의 단계를 찾는다 (0 이하 = 미전직) */
export const tierOf = (domain: Domain, tier: number): JobTier | null =>
  domain.tiers.find((t) => t.tier === tier) ?? null

/** 전직 연출 사건 만들기 (다시 보기에서도 쓴다). from 은 사다리에서 바로 아래 단계 */
export function promotionOf(d: DomainStatus, to: JobTier, fromTier?: number): Celebration {
  const below = [...d.domain.tiers].filter((t) => t.tier < to.tier).sort((a, b) => b.tier - a.tier)
  const from = fromTier === undefined ? below[0] ?? null : tierOf(d.domain, fromTier)
  const above = [...d.domain.tiers].filter((t) => t.tier > to.tier).sort((a, b) => a.tier - b.tier)
  return { kind: 'promotion', domain: d.domain, from, to, nextTier: above[0] ?? null, masteredCount: d.masteredCount }
}

/**
 * 직전 상태와 비교해 새로 생긴 달성·전직을 순서대로 돌려준다(달성 → 그 분야의 전직).
 * 처음 보는 스킬(직전 상태에 없던 것)이나 오래전에 달성된 스킬은 제외한다.
 */
export function detectCelebrations(prev: CelebrationSnapshot, skills: Skill[], domains: DomainStatus[], now = Date.now()): Celebration[] {
  const out: Celebration[] = []
  const promotedDomains = new Set<string>()
  const fresh = skills.filter((s) => {
    const before = prev.skills.get(s.id)
    if (s.status !== 'mastered' || before === undefined || before === 'mastered') return false
    const at = s.masteredAt ? Date.parse(s.masteredAt) : NaN
    return Number.isFinite(at) && Math.abs(now - at) <= CELEBRATE_WINDOW_MS
  })
  for (const skill of fresh) {
    const d = domains.find((x) => x.domain.id === skill.domainId) ?? null
    const before = d ? prev.tiers.get(d.domain.id) : undefined
    const rose = !!d && !!d.currentTier && before !== undefined && d.currentTier.tier > before
    const firstOfDomain = rose && !promotedDomains.has(d.domain.id)
    out.push({
      kind: 'mastery', skill, domain: d?.domain ?? null,
      masteredCount: d?.masteredCount ?? 0, totalSkills: d?.totalSkills ?? 0,
      nextTier: d?.nextTier ?? null, promoted: firstOfDomain,
    })
    if (firstOfDomain && d.currentTier) {
      promotedDomains.add(d.domain.id)
      out.push(promotionOf(d, d.currentTier, before))
    }
  }
  return out
}
