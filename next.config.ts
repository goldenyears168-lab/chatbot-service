import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages 配置
  images: {
    unoptimized: true, // Cloudflare Pages 需要
  },
  
  // 性能优化
  compress: true,
  
  // 生产环境优化
  productionBrowserSourceMaps: false,
  
  // 实验性功能
  experimental: {
    // 优化包大小
    optimizePackageImports: ['@radix-ui/react-dialog', '@radix-ui/react-avatar'],
  },
  
  // Turbopack 配置（Next.js 16 默认使用）
  turbopack: {},
  
  // Webpack 配置优化（用于非 Turbopack 构建）
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 客户端优化：减少包大小
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
      };
    }
    
    // 在 Edge Runtime 构建中排除 Node.js 专用模块
    // 这可以防止构建系统检测到 knowledge-fs.ts 中的 Node.js API
    config.resolve.alias = {
      ...config.resolve.alias,
      // 在 Edge Runtime 中，将 knowledge-fs 替换为空模块
      './knowledge-fs': false,
      '@/lib/knowledge-fs': false,
    };
    
    return config;
  },
};

export default nextConfig;
