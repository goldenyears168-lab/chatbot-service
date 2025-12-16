// lib/db/client.ts - 客户端组件使用
import { createBrowserClient } from '@supabase/ssr'
import { getRequiredEnv } from '@/lib/env'

export function createClient() {
  const supabaseUrl = getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anonKey = getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  
  return createBrowserClient(supabaseUrl, anonKey)
}
