// lib/config/index.ts
// 公司配置模块统一导出
// 
// 注意：Edge Runtime 路由应该直接导入 './edge'
// Node.js Runtime 路由应该直接导入 './node'
// 这里提供统一入口，默认导出 Edge 版本（因为大部分 API routes 使用 Edge Runtime）

// 类型定义始终导出
export type { CompanyConfig, CompanyRegistry } from './types'

// 默认导出 Edge 版本（Edge Runtime 兼容）
// 如果需要 Node.js 版本（支持文件系统），可以直接导入 './node'
export * from './edge'

