/**
 * Jest Configuration
 * 
 * 测试配置文件
 */

export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  
  // 模块解析
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  
  // 转换配置
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          moduleResolution: 'node',
          esModuleInterop: true,
        },
      },
    ],
  },
  
  // 测试匹配
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/functions/api/pipeline-v3/test/**/*.test.ts',
  ],
  
  // 覆盖率配置
  collectCoverageFrom: [
    'functions/api/**/*.ts',
    '!functions/api/**/*.test.ts',
    '!functions/api/**/test/**',
    '!functions/api/nodes-v3/**/test.ts',
  ],
  
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
  
  // 超时设置
  testTimeout: 30000,
  
  // 详细输出
  verbose: true,
  
  // 忽略的路径
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.wrangler/',
  ],
};
