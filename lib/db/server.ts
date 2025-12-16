// lib/db/server.ts - 服务端使用（API Routes, Server Components）
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getRequiredEnv } from '@/lib/env'

export async function createServerClient() {
  const cookieStore = await cookies()
  const supabaseUrl = getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anonKey = getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  
  return createSupabaseServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // 在 Server Component 中可能无法设置 cookies
        }
      },
    },
  })
}

