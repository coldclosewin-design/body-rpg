import type { Domain, JobTier, Skill } from '@/types/model'
import type { XpEvent } from './xp'

export interface DomainStatus {
  domain: Domain
  masteredCount: number
  totalSkills: number
  currentTier: JobTier | null
  nextTier: JobTier | null
  /** 현재 직업명 (미전직이면 baseJobName) */
  jobName: string
  /** 현재 칭호 ('' 가능) */
  title: string
  /** 분야 숙련도 XP (분야 과제 XP 합) */
  xp: number
}

export function domainStatus(domain: Domain, skills: Skill[], xpEvents: XpEvent[]): DomainStatus {
  const domainSkills = skills.filter((s) => s.domainId === domain.id)
  const masteredCount = domainSkills.filter((s) => s.status === 'mastered').length
  const tiers = [...domain.tiers].sort((a, b) => a.tier - b.tier)
  let currentTier: JobTier | null = null
  let nextTier: JobTier | null = null
  for (const t of tiers) {
    if (t.requiredMastered <= masteredCount) currentTier = t
    else { nextTier = t; break }
  }
  const skillIds = new Set(domainSkills.map((s) => s.id))
  const xp = xpEvents.filter((e) => skillIds.has(e.skillId)).reduce((s, e) => s + e.xp, 0)
  return {
    domain, masteredCount, totalSkills: domainSkills.length, currentTier, nextTier,
    jobName: currentTier?.name ?? domain.baseJobName,
    title: currentTier?.title ?? '',
    xp,
  }
}
