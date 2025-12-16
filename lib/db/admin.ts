// lib/db/admin.ts - 管理员客户端（使用 Service Role Key）
import { createClient } from '@supabase/supabase-js'
import { getRequiredEnv } from '@/lib/env'

export function createAdminClient() {
  const supabaseUrl = getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

