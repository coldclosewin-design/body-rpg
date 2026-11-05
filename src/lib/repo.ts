import type { SupabaseClient } from '@supabase/supabase-js'
import { WorldSchema, emptyWorld, type Character, type Domain, type Season, type Settings, type Skill, type Task, type TaskLog, type World } from '@/types/model'
import { supabase } from './supabase'

/** 저장소 추상화. 로컬(localStorage)과 Supabase 두 구현이 같은 인터페이스를 가진다. */
export interface Repo {
  mode: 'local' | 'cloud'
  loadWorld(): Promise<World>
  upsertDomain(d: Domain): Promise<void>
  deleteDomain(id: string): Promise<void>
  upsertSkill(s: Skill): Promise<void>
  deleteSkill(id: string): Promise<void>
  upsertTask(t: Task): Promise<void>
  deleteTask(id: string): Promise<void>
  addLog(l: TaskLog): Promise<void>
  deleteLog(id: string): Promise<void>
  upsertSeason(s: Season): Promise<void>
  deleteSeason(id: string): Promise<void>
  saveCharacter(c: Character, settings: Settings): Promise<void>
  /** 전체 교체 (JSON 가져오기 / 시드) */
  replaceWorld(w: World): Promise<void>
}

// ---------- Local ----------
const LS_KEY = 'bodyrpg.world.v1'

export class LocalRepo implements Repo {
  mode = 'local' as const
  private read(): World {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (!raw) return emptyWorld()
      return WorldSchema.parse(JSON.parse(raw))
    } catch { return emptyWorld() }
  }
  private write(w: World) { localStorage.setItem(LS_KEY, JSON.stringify(w)) }
  private mutate(fn: (w: World) => void) { const w = this.read(); fn(w); this.write(w) }
  async loadWorld() { return this.read() }
  async upsertDomain(d: Domain) { this.mutate((w) => upsertIn(w.domains, d)) }
  async deleteDomain(id: string) {
    this.mutate((w) => {
      w.domains = w.domains.filter((x) => x.id !== id)
      const skillIds = w.skills.filter((s) => s.domainId === id).map((s) => s.id)
      w.skills = w.skills.filter((s) => s.domainId !== id)
      const taskIds = w.tasks.filter((t) => skillIds.includes(t.skillId)).map((t) => t.id)
      w.tasks = w.tasks.filter((t) => !skillIds.includes(t.skillId))
      w.logs = w.logs.filter((l) => !taskIds.includes(l.taskId))
    })
  }
  async upsertSkill(s: Skill) { this.mutate((w) => upsertIn(w.skills, s)) }
  async deleteSkill(id: string) {
    this.mutate((w) => {
      w.skills = w.skills.filter((x) => x.id !== id)
      const taskIds = w.tasks.filter((t) => t.skillId === id).map((t) => t.id)
      w.tasks = w.tasks.filter((t) => t.skillId !== id)
      w.logs = w.logs.filter((l) => !taskIds.includes(l.taskId))
    })
  }
  async upsertTask(t: Task) { this.mutate((w) => upsertIn(w.tasks, t)) }
  async deleteTask(id: string) { this.mutate((w) => { w.tasks = w.tasks.filter((x) => x.id !== id); w.logs = w.logs.filter((l) => l.taskId !== id) }) }
  async addLog(l: TaskLog) { this.mutate((w) => { w.logs.push(l) }) }
  async deleteLog(id: string) { this.mutate((w) => { w.logs = w.logs.filter((x) => x.id !== id) }) }
  async upsertSeason(s: Season) { this.mutate((w) => upsertIn(w.seasons, s)) }
  async deleteSeason(id: string) { this.mutate((w) => { w.seasons = w.seasons.filter((x) => x.id !== id) }) }
  async saveCharacter(c: Character, settings: Settings) { this.mutate((w) => { w.character = c; w.settings = settings }) }
  async replaceWorld(w: World) { this.write(WorldSchema.parse(w)) }
}

function upsertIn<T extends { id: string }>(arr: T[], item: T) {
  const i = arr.findIndex((x) => x.id === item.id)
  if (i >= 0) arr[i] = item; else arr.push(item)
}

// ---------- Supabase ----------
type Row = Record<string, unknown>

export class SupabaseRepo implements Repo {
  mode = 'cloud' as const
  constructor(private sb: SupabaseClient, private userId: string) {}

  async loadWorld(): Promise<World> {
    const [domains, skills, tasks, logs, seasons, character] = await Promise.all([
      this.sb.from('domains').select('*').eq('user_id', this.userId).order('order'),
      this.sb.from('skills').select('*').eq('user_id', this.userId).order('order'),
      this.sb.from('tasks').select('*').eq('user_id', this.userId).order('order'),
      this.sb.from('task_logs').select('*').eq('user_id', this.userId).order('created_at'),
      this.sb.from('seasons').select('*').eq('user_id', this.userId).order('start_date'),
      this.sb.from('characters').select('*').eq('user_id', this.userId).maybeSingle(),
    ])
    for (const r of [domains, skills, tasks, logs, seasons, character]) if (r.error) throw r.error
    const ch = (character.data ?? {}) as Row
    return WorldSchema.parse({
      domains: (domains.data as Row[]).map((r) => ({ id: r.id, name: r.name, icon: r.icon, color: r.color, baseJobName: r.base_job_name, tiers: r.tiers, order: r.order })),
      skills: (skills.data as Row[]).map((r) => ({ id: r.id, domainId: r.domain_id, name: r.name, description: r.description, status: r.status, goal: r.goal, masteredAt: r.mastered_at, order: r.order })),
      tasks: (tasks.data as Row[]).map((r) => ({ id: r.id, skillId: r.skill_id, name: r.name, metric: r.metric, target: Number(r.target), cadence: r.cadence, xp: r.xp, order: r.order })),
      logs: (logs.data as Row[]).map((r) => ({ id: r.id, taskId: r.task_id, date: r.date, value: Number(r.value), createdAt: r.created_at })),
      seasons: (seasons.data as Row[]).map((r) => ({ id: r.id, name: r.name, startDate: r.start_date, endDate: r.end_date, tiers: r.tiers })),
      character: {
        name: ch.name ?? '나', appearance: ch.appearance ?? {}, equippedTitle: ch.equipped_title ?? null,
        equippedOutfit: ch.equipped_outfit ?? null, equippedAccessory: ch.equipped_accessory ?? null, unlocked: ch.unlocked ?? [],
      },
      settings: ch.settings ?? {},
    })
  }
  private async run(p: PromiseLike<{ error: unknown }>) { const { error } = await p; if (error) throw error }

  upsertDomain(d: Domain) { return this.run(this.sb.from('domains').upsert({ id: d.id, user_id: this.userId, name: d.name, icon: d.icon, color: d.color, base_job_name: d.baseJobName, tiers: d.tiers, order: d.order })) }
  deleteDomain(id: string) { return this.run(this.sb.from('domains').delete().eq('id', id)) }
  upsertSkill(s: Skill) { return this.run(this.sb.from('skills').upsert({ id: s.id, user_id: this.userId, domain_id: s.domainId, name: s.name, description: s.description, status: s.status, goal: s.goal, mastered_at: s.masteredAt, order: s.order })) }
  deleteSkill(id: string) { return this.run(this.sb.from('skills').delete().eq('id', id)) }
  upsertTask(t: Task) { return this.run(this.sb.from('tasks').upsert({ id: t.id, user_id: this.userId, skill_id: t.skillId, name: t.name, metric: t.metric, target: t.target, cadence: t.cadence, xp: t.xp, order: t.order })) }
  deleteTask(id: string) { return this.run(this.sb.from('tasks').delete().eq('id', id)) }
  addLog(l: TaskLog) { return this.run(this.sb.from('task_logs').insert({ id: l.id, user_id: this.userId, task_id: l.taskId, date: l.date, value: l.value, created_at: l.createdAt })) }
  deleteLog(id: string) { return this.run(this.sb.from('task_logs').delete().eq('id', id)) }
  upsertSeason(s: Season) { return this.run(this.sb.from('seasons').upsert({ id: s.id, user_id: this.userId, name: s.name, start_date: s.startDate, end_date: s.endDate, tiers: s.tiers })) }
  deleteSeason(id: string) { return this.run(this.sb.from('seasons').delete().eq('id', id)) }
  saveCharacter(c: Character, settings: Settings) {
    return this.run(this.sb.from('characters').upsert({ user_id: this.userId, name: c.name, appearance: c.appearance, equipped_title: c.equippedTitle, equipped_outfit: c.equippedOutfit, equipped_accessory: c.equippedAccessory, unlocked: c.unlocked, settings }))
  }
  async replaceWorld(w: World) {
    // 도메인 삭제 → cascade 로 스킬/과제/로그 삭제
    await this.run(this.sb.from('domains').delete().eq('user_id', this.userId))
    await this.run(this.sb.from('seasons').delete().eq('user_id', this.userId))
    for (const d of w.domains) await this.upsertDomain(d)
    for (const s of w.skills) await this.upsertSkill(s)
    for (const t of w.tasks) await this.upsertTask(t)
    if (w.logs.length) {
      await this.run(this.sb.from('task_logs').insert(w.logs.map((l) => ({ id: l.id, user_id: this.userId, task_id: l.taskId, date: l.date, value: l.value, created_at: l.createdAt }))))
    }
    for (const s of w.seasons) await this.upsertSeason(s)
    await this.saveCharacter(w.character, w.settings)
  }
}

export function makeRepo(userId: string | null): Repo {
  if (supabase && userId) return new SupabaseRepo(supabase, userId)
  return new LocalRepo()
}
