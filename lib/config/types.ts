// lib/config/types.ts
// 公司配置类型定义

export interface CompanyConfig {
  id: string
  name: string
  name_en: string
  allowedOrigins?: string[]
  widgetConfig?: {
    theme?: 'light' | 'dark'
    locale?: string
  }
  apiConfig?: {
    useSharedApiKey?: boolean
    apiKeyEnv?: string
  }
}

export interface CompanyRegistry {
  version: string
  last_updated: string
  companies: Record<string, {
    id: string
    name: string
    name_en: string
    path: string
    group: string | null
    active: boolean
    deployment: string
  }>
}

