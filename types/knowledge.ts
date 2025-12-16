// types/knowledge.ts
// 知识库相关的类型定义

/**
 * 服务类型
 */
export interface Service {
  id?: string
  name: string
  one_line?: string
  price_range?: string
  use_cases?: string[]
  description?: string
  [key: string]: unknown
}

/**
 * 服务列表类型（可能是数组或对象）
 */
export type ServicesData = {
  services?: Service[] | Record<string, Service>
  [key: string]: unknown
}

/**
 * 营业时间类型
 */
export interface BusinessHours {
  weekday?: string
  weekend?: string
  [key: string]: unknown
}

/**
 * 分店/分支机构类型
 */
export interface Branch {
  id: string
  name: string
  address?: string
  address_note?: string
  phone?: string
  hours?: BusinessHours
  [key: string]: unknown
}

/**
 * 联系方式渠道类型
 */
export interface ContactChannels {
  email?: string
  phone?: string
  ig?: string
  facebook?: string
  line?: string
  [key: string]: unknown
}

/**
 * 公司信息类型
 */
export interface CompanyInfo {
  branches?: Branch[]
  contact_channels?: ContactChannels
  contact?: ContactChannels
  [key: string]: unknown
}

/**
 * Gemini 模型 ID 类型
 */
export type GeminiModelId = 'gemini-2.0-flash' | 'gemini-1.5-flash' | 'gemini-1.5-pro' | 'gemini-1.5-pro-latest'

/**
 * 类型守卫：检查是否为 Service
 */
export function isService(obj: unknown): obj is Service {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    typeof (obj as Service).name === 'string'
  )
}

/**
 * 类型守卫：检查是否为 Branch
 */
export function isBranch(obj: unknown): obj is Branch {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    typeof (obj as Branch).id === 'string' &&
    typeof (obj as Branch).name === 'string'
  )
}

