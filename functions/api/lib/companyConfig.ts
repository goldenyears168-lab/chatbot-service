/**
 * 公司配置管理
 * 支持多租户架构
 */

export interface CompanyConfig {
  id: string;
  name: string;
  name_en: string;
  allowedOrigins: string[];
  widgetConfig: {
    theme: string;
    locale: string;
  };
  apiConfig: {
    useSharedApiKey: boolean;
    apiKeyEnv?: string;
  };
}

// 注册表接口
interface CompanyRegistry {
  version: string;
  last_updated: string;
  companies: Record<string, {
    id: string;
    name: string;
    name_en: string;
    path: string;
    group: string | null;
    active: boolean;
    deployment: string;
  }>;
  groups: Record<string, any>;
}

// 缓存注册表和公司配置
let companyRegistry: CompanyRegistry | null = null;
let registryLoading: Promise<CompanyRegistry> | null = null;
const companyConfigCache = new Map<string, CompanyConfig>();
const configLoadingPromises = new Map<string, Promise<CompanyConfig>>();

/**
 * 加载注册表（轻量级，只包含基本信息）
 */
async function loadRegistry(baseUrl: string): Promise<CompanyRegistry> {
  if (companyRegistry) {
    return companyRegistry;
  }

  if (registryLoading) {
    console.log('[CompanyConfig] Registry loading in progress, waiting...');
    return await registryLoading;
  }

  registryLoading = (async () => {
    try {
      const registryUrl = `${baseUrl}/projects/registry.json`;
      console.log('[CompanyConfig] Loading registry from:', registryUrl);
      
      const response = await fetch(registryUrl);
      if (!response.ok) {
        throw new Error(`Failed to load registry.json: ${response.status}`);
      }
      
      companyRegistry = await response.json();
      console.log('[CompanyConfig] Loaded registry with companies:', Object.keys(companyRegistry!.companies));
      return companyRegistry!;
    } catch (error) {
      console.error('[CompanyConfig] Failed to load registry:', error);
      companyRegistry = null;
      throw error;
    } finally {
      registryLoading = null;
    }
  })();

  return await registryLoading;
}

/**
 * 加载单个公司的详细配置
 */
async function loadCompanyConfig(companyId: string, baseUrl: string): Promise<CompanyConfig> {
  // 检查缓存
  if (companyConfigCache.has(companyId)) {
    return companyConfigCache.get(companyId)!;
  }

  // 检查是否正在加载
  if (configLoadingPromises.has(companyId)) {
    return await configLoadingPromises.get(companyId)!;
  }

  // 开始加载
  const loadingPromise = (async () => {
    try {
      // 1. 从注册表获取公司路径
      const registry = await loadRegistry(baseUrl);
      const companyInfo = registry.companies[companyId];
      
      if (!companyInfo) {
        throw new Error(`Company not found in registry: ${companyId}`);
      }

      if (!companyInfo.active) {
        throw new Error(`Company is not active: ${companyId}`);
      }

      // 2. 加载公司的详细配置
      const configUrl = `${baseUrl}/projects/${companyInfo.path}/config.json`;
      console.log(`[CompanyConfig] Loading config for ${companyId} from:`, configUrl);
      
      const response = await fetch(configUrl);
      if (!response.ok) {
        throw new Error(`Failed to load config for ${companyId}: ${response.status}`);
      }
      
      const config = await response.json() as CompanyConfig;
      
      // 验证配置完整性
      if (!config.id || !config.name || !config.allowedOrigins) {
        throw new Error(`Invalid config format for ${companyId}`);
      }
      
      // 缓存配置
      companyConfigCache.set(companyId, config);
      console.log(`[CompanyConfig] Loaded config for ${companyId}`);
      
      return config;
    } catch (error) {
      console.error(`[CompanyConfig] Failed to load config for ${companyId}:`, error);
      throw error;
    } finally {
      configLoadingPromises.delete(companyId);
    }
  })();

  configLoadingPromises.set(companyId, loadingPromise);
  return await loadingPromise;
}

/**
 * 获取公司配置（按需加载）
 */
export async function getCompanyConfig(
  companyId: string,
  request?: Request
): Promise<CompanyConfig | null> {
  try {
    let baseUrl: string;
    
    if (request) {
      const url = new URL(request.url);
      baseUrl = `${url.protocol}//${url.host}`;
    } else {
      // 如果没有提供 request，尝试使用环境变量或默认值
      // 这在某些测试场景中可能需要
      console.warn('[CompanyConfig] No request provided, using fallback');
      return null;
    }

    // 按需加载公司配置
    const companyConfig = await loadCompanyConfig(companyId, baseUrl);
    return companyConfig;
  } catch (error) {
    console.error(`[CompanyConfig] Error getting config for ${companyId}:`, error);
    return null;
  }
}

/**
 * 验证公司 ID
 */
export function isValidCompanyId(companyId: string): boolean {
  // 只允许小写字母、数字、连字符
  // 长度 2-50 字符
  return /^[a-z0-9-]{2,50}$/.test(companyId);
}

/**
 * 验证 Origin 是否被允许
 * 支持通配符匹配 *.pages.dev 域名
 */
export function isOriginAllowed(companyConfig: CompanyConfig, origin: string | null): boolean {
  if (!origin) {
    return false;
  }
  
  // 直接匹配
  if (companyConfig.allowedOrigins.includes(origin)) {
    return true;
  }
  
  // 支持 Cloudflare Pages 部署域名（每次部署都会有不同的 hash）
  if (origin.includes('.pages.dev')) {
    // 检查是否配置了通配符或包含项目名称
    const hasWildcard = companyConfig.allowedOrigins.some(allowed => 
      allowed === '*.pages.dev' || 
      allowed === 'https://*.pages.dev'
    );
    
    const hasProjectDomain = companyConfig.allowedOrigins.some(allowed =>
      allowed.includes('chatbot-service-multi-tenant.pages.dev')
    );
    
    if (hasWildcard || hasProjectDomain || origin.includes('chatbot-service-multi-tenant.pages.dev')) {
      return true;
    }
  }
  
  return false;
}

/**
 * 获取允许的 Origin（用于 CORS 响应）
 * 必须返回实际的 origin，而不是通配符
 */
export function getAllowedOrigin(companyConfig: CompanyConfig, requestOrigin: string | null): string {
  // 如果 origin 被允许，直接返回它
  if (requestOrigin && isOriginAllowed(companyConfig, requestOrigin)) {
    return requestOrigin;
  }
  
  // 返回第一个配置的 origin 作为默认值
  return companyConfig.allowedOrigins[0];
}

/**
 * 清除配置缓存（用于测试）
 */
export function clearConfigCache(): void {
  companyRegistry = null;
  registryLoading = null;
  companyConfigCache.clear();
  configLoadingPromises.clear();
}
