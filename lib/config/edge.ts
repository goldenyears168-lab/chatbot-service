// lib/config/edge.ts
// Edge Runtime 兼容版本 - 不包含任何 Node.js API

import type { CompanyConfig, CompanyRegistry } from './types'

// 缓存注册表（在 Edge Runtime 中使用）
const COMPANY_REGISTRY: CompanyRegistry = {
  version: "1.0.0",
  last_updated: "2025-12-15",
  companies: {
    "goldenyears": {
      id: "goldenyears",
      name: "好時有影",
      name_en: "Golden Years Photo",
      path: "goldenyears",
      group: null,
      active: true,
      deployment: "shared"
    },
    "company-b": {
      id: "company-b",
      name: "企業諮詢顧問",
      name_en: "Business Consulting",
      path: "company-b",
      group: null,
      active: true,
      deployment: "shared"
    },
    "company-c": {
      id: "company-c",
      name: "雲端服務",
      name_en: "Cloud Services",
      path: "company-c",
      group: null,
      active: true,
      deployment: "shared"
    },
    "company-d": {
      id: "company-d",
      name: "線上教育",
      name_en: "Online Education",
      path: "company-d",
      group: null,
      active: true,
      deployment: "shared"
    },
    "internal-advisor": {
      id: "internal-advisor",
      name: "内部解惑顾问",
      name_en: "Internal Advisor",
      path: "internal-advisor",
      group: null,
      active: true,
      deployment: "shared"
    }
  }
} as CompanyRegistry

/**
 * 获取公司配置（Edge Runtime 版本）
 */
export async function getCompanyConfig(companyId: string): Promise<CompanyConfig | null> {
  const company = COMPANY_REGISTRY.companies[companyId]
  if (!company) {
    return null
  }
  
  return {
    id: company.id,
    name: company.name,
    name_en: company.name_en,
  }
}

/**
 * 获取公司注册表（Edge Runtime 版本）
 */
export async function getCompanyRegistry(): Promise<CompanyRegistry | null> {
  return COMPANY_REGISTRY
}

/**
 * 验证公司 ID 是否存在（Edge Runtime 版本）
 */
export async function validateCompanyId(companyId: string): Promise<boolean> {
  const company = COMPANY_REGISTRY.companies[companyId]
  return company?.active === true
}

