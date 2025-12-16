// lib/config/node.ts
// Node.js Runtime 版本 - 支持文件系统读取
// ⚠️ 此文件包含 Node.js API（fs/promises），不能在 Edge Runtime 中使用

import { logger } from '../logger'
import type { CompanyConfig, CompanyRegistry } from './types'

// 缓存注册表（在 Edge Runtime 中无法读取文件系统，使用硬编码）
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
 * 获取公司配置
 */
export async function getCompanyConfig(companyId: string): Promise<CompanyConfig | null> {
  try {
    // 在 Edge Runtime 中，尝试从缓存读取，否则从文件系统读取
    const isEdge = typeof process !== 'undefined' && process.env?.NEXT_RUNTIME === 'edge'
    
    if (!isEdge) {
      // Node.js 环境，可以从文件系统读取
      try {
        const { readFile } = await import('fs/promises')
        const { join } = await import('path')
        const cwd = typeof process !== 'undefined' && process.cwd ? process.cwd() : ''
        
        const configPath = join(cwd, 'projects', companyId, 'config.json')
        const configData = await readFile(configPath, 'utf-8')
        return JSON.parse(configData) as CompanyConfig
      } catch (fsError) {
        // 文件系统读取失败，继续使用注册表
      }
    }
    
    // Edge Runtime 环境，返回默认配置
    const company = COMPANY_REGISTRY.companies[companyId]
    if (!company) {
      return null
    }
    
    return {
      id: company.id,
      name: company.name,
      name_en: company.name_en,
    }
  } catch (error) {
    logger.error(`Failed to load config for company ${companyId}`, error, { companyId })
    // 如果文件读取失败，返回基于注册表的默认配置
    const company = COMPANY_REGISTRY.companies[companyId]
    if (!company) return null
    
    return {
      id: company.id,
      name: company.name,
      name_en: company.name_en,
    }
  }
}

/**
 * 获取公司注册表
 */
export async function getCompanyRegistry(): Promise<CompanyRegistry | null> {
  try {
    const isEdge = typeof process !== 'undefined' && process.env?.NEXT_RUNTIME === 'edge'
    
    if (!isEdge) {
      // Node.js 环境，可以从文件系统读取
      try {
        const { readFile } = await import('fs/promises')
        const { join } = await import('path')
        const cwd = typeof process !== 'undefined' && process.cwd ? process.cwd() : ''
        const registryPath = join(cwd, 'projects', 'registry.json')
        const registryData = await readFile(registryPath, 'utf-8')
        return JSON.parse(registryData) as CompanyRegistry
      } catch (fsError) {
        // 文件系统读取失败，继续使用注册表
      }
    }
    
    // Edge Runtime 环境，返回缓存的注册表
    return COMPANY_REGISTRY
  } catch (error) {
    logger.error('Failed to load company registry', error)
    return COMPANY_REGISTRY
  }
}

/**
 * 验证公司 ID 是否存在
 */
export async function validateCompanyId(companyId: string): Promise<boolean> {
  // 直接使用缓存的注册表，不依赖文件系统
  const company = COMPANY_REGISTRY.companies[companyId]
  return company?.active === true
}

