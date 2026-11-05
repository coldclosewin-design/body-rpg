import { z } from 'zod'

/** 과제 측정 단위: 횟수 / 분 / 체크 */
export const MetricSchema = z.enum(['count', 'minutes', 'check'])
export type Metric = z.infer<typeof MetricSchema>

/** 주기: 매일 N세션 / 매주 N세션 */
export const CadenceSchema = z.object({
  per: z.enum(['day', 'week']),
  times: z.number().int().min(1).max(50),
})
export type Cadence = z.infer<typeof CadenceSchema>

export const TaskSchema = z.object({
  id: z.string(),
  skillId: z.string(),
  name: z.string().min(1),
  metric: MetricSchema,
  /** 세션 1회 목표값 (count: 횟수, minutes: 분, check: 1) */
  target: z.number().min(1),
  cadence: CadenceSchema,
  /** 세션 1회 달성 시 XP */
  xp: z.number().int().min(0),
  order: z.number().int().default(0),
})
export type Task = z.infer<typeof TaskSchema>

export const SkillGoalSchema = z.discriminatedUnion('kind', [
  /** 모든 과제의 주간 목표를 N주 충족 */
  z.object({ kind: z.literal('weeks'), weeks: z.number().int().min(1) }),
  /** 특정 과제의 누적값이 value 이상 */
  z.object({ kind: z.literal('total'), taskId: z.string(), value: z.number().min(1) }),
])
export type SkillGoal = z.infer<typeof SkillGoalSchema>

export const SkillSchema = z.object({
  id: z.string(),
  domainId: z.string(),
  name: z.string().min(1),
  description: z.string().default(''),
  status: z.enum(['active', 'mastered', 'paused']).default('active'),
  goal: SkillGoalSchema,
  masteredAt: z.string().nullable().default(null),
  order: z.number().int().default(0),
})
export type Skill = z.infer<typeof SkillSchema>

export const JobTierSchema = z.object({
  tier: z.number().int().min(1),
  /** 직업명 (예: 운동깔짝이) */
  name: z.string().min(1),
  /** 칭호 (예: 깔짝이) — 캐릭터 머리 위 표시 */
  title: z.string().default(''),
  /** 필요 달성(mastered) 스킬 수 */
  requiredMastered: z.number().int().min(0),
  /** 전직 시 해금되는 코스튬 키 (sprites 레지스트리) */
  outfit: z.string().nullable().default(null),
})
export type JobTier = z.infer<typeof JobTierSchema>

export const DomainSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  icon: z.string().default('⭐'),
  color: z.string().default('#4cc9f0'),
  /** 0차(미전직) 직업명 */
  baseJobName: z.string().default('견습생'),
  tiers: z.array(JobTierSchema).default([]),
  order: z.number().int().default(0),
})
export type Domain = z.infer<typeof DomainSchema>

export const TaskLogSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  /** YYYY-MM-DD (로컬 날짜) */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  value: z.number(),
  createdAt: z.string(),
})
export type TaskLog = z.infer<typeof TaskLogSchema>

export const RewardSchema = z.object({
  type: z.enum(['title', 'outfit', 'accessory']),
  /** title: 칭호 문자열 / outfit, accessory: sprites 레지스트리 키 */
  value: z.string(),
  label: z.string(),
})
export type Reward = z.infer<typeof RewardSchema>

export const SeasonTierSchema = z.object({
  tier: z.number().int().min(1),
  xp: z.number().int().min(0),
  reward: RewardSchema.nullable().default(null),
})
export type SeasonTier = z.infer<typeof SeasonTierSchema>

export const SeasonSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  tiers: z.array(SeasonTierSchema).default([]),
})
export type Season = z.infer<typeof SeasonSchema>

export const AppearanceSchema = z.object({
  skin: z.string().default('#f3c9a6'),
  hair: z.string().default('#3b2a1a'),
  hairStyle: z.string().default('short'),
  outfitColor: z.string().default('#e94560'),
})
export type Appearance = z.infer<typeof AppearanceSchema>

export const CharacterSchema = z.object({
  name: z.string().default('나'),
  appearance: AppearanceSchema.prefault({}),
  equippedTitle: z.string().nullable().default(null),
  equippedOutfit: z.string().nullable().default(null),
  equippedAccessory: z.string().nullable().default(null),
  /** 해금된 보상 키 목록 ("title:xxx", "outfit:xxx", "accessory:xxx") */
  unlocked: z.array(z.string()).default([]),
})
export type Character = z.infer<typeof CharacterSchema>

export const SettingsSchema = z.object({
  /** 0=일요일 … 1=월요일 */
  weekStartsOn: z.number().int().min(0).max(6).default(1),
})
export type Settings = z.infer<typeof SettingsSchema>

/** 한 사용자의 전체 세계관 + 기록 */
export const WorldSchema = z.object({
  domains: z.array(DomainSchema),
  skills: z.array(SkillSchema),
  tasks: z.array(TaskSchema),
  logs: z.array(TaskLogSchema),
  seasons: z.array(SeasonSchema),
  character: CharacterSchema,
  settings: SettingsSchema.prefault({}),
})
export type World = z.infer<typeof WorldSchema>

export const emptyWorld = (): World => ({
  domains: [], skills: [], tasks: [], logs: [], seasons: [],
  character: CharacterSchema.parse({}),
  settings: SettingsSchema.parse({}),
})

export const uid = (): string =>
  (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36))
