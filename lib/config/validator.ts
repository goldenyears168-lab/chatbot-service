// lib/config/validator.ts
// 使用 Zod 验证公司配置

import { z } from 'zod'
import type { CompanyConfig, CompanyRegistry } from './types'

/**
 * 公司配置验证 Schema
 */
export const CompanyConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  name_en: z.string().min(1),
  allowedOrigins: z.array(z.string().url()).optional(),
  widgetConfig: z.object({
    theme: z.enum(['light', 'dark']).optional(),
    locale: z.string().optional(),
  }).optional(),
  apiConfig: z.object({
    useSharedApiKey: z.boolean().optional(),
    apiKeyEnv: z.string().optional(),
  }).optional(),
})

/**
 * 公司注册表验证 Schema
 */
const CompanyInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  name_en: z.string(),
  path: z.string(),
  group: z.string().nullable(),
  active: z.boolean(),
  deployment: z.string(),
})

export const CompanyRegistrySchema = z.object({
  version: z.string(),
  last_updated: z.string(),
  companies: z.record(z.string(), CompanyInfoSchema),
})

/**
 * 验证公司配置
 */
export function validateCompanyConfig(data: unknown): CompanyConfig {
  return CompanyConfigSchema.parse(data)
}

/**
 * 验证公司注册表
 */
export function validateCompanyRegistry(data: unknown): CompanyRegistry {
  const result = CompanyRegistrySchema.parse(data)
  return result as CompanyRegistry
}

/**
 * 安全解析公司配置（不抛出错误）
 */
export function safeValidateCompanyConfig(data: unknown): { success: true; data: CompanyConfig } | { success: false; error: z.ZodError } {
  const result = CompanyConfigSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

/**
 * 安全解析公司注册表（不抛出错误）
 */
export function safeValidateCompanyRegistry(data: unknown): { success: true; data: CompanyRegistry } | { success: false; error: z.ZodError } {
  const result = CompanyRegistrySchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data as CompanyRegistry }
  }
  return { success: false, error: result.error }
}

