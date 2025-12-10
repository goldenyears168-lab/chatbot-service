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

// 缓存公司配置
let companiesConfig: Record<string, CompanyConfig> | null = null;
let configLoading: Promise<Record<string, CompanyConfig>> | null = null;

/**
 * 加载公司配置
 */
async function loadCompaniesConfig(baseUrl: string): Promise<Record<string, CompanyConfig>> {
  if (companiesConfig) {
    return companiesConfig;
  }

  if (configLoading) {
    console.log('[CompanyConfig] Configuration loading in progress, waiting...');
    return await configLoading;
  }

  configLoading = (async () => {
    try {
      const configUrl = `${baseUrl}/knowledge/companies.json`;
      console.log('[CompanyConfig] Loading from:', configUrl);
      
      const response = await fetch(configUrl);
      if (!response.ok) {
        throw new Error(`Failed to load companies.json: ${response.status}`);
      }
      
      companiesConfig = await response.json();
      console.log('[CompanyConfig] Loaded companies:', Object.keys(companiesConfig!));
      return companiesConfig!;
    } catch (error) {
      console.error('[CompanyConfig] Failed to load companies config:', error);
      companiesConfig = null;
      throw error;
    } finally {
      configLoading = null;
    }
  })();

  return await configLoading;
}

/**
 * 获取公司配置
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

    const config = await loadCompaniesConfig(baseUrl);
    const companyConfig = config[companyId];
    
    if (!companyConfig) {
      console.warn(`[CompanyConfig] Company not found: ${companyId}`);
      return null;
    }
    
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
  companiesConfig = null;
  configLoading = null;
}
