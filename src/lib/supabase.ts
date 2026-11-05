import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** 환경변수가 없으면 null → 로컬(브라우저 저장) 모드 */
export const supabase: SupabaseClient | null = url && anon ? createClient(url, anon) : null
export const isCloudMode = supabase !== null
