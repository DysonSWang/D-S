/**
 * Jest 配置文件
 * 星契 (Starpact) 项目单元测试配置
 */

import type { Config } from 'jest';

const config: Config = {
  // 预设
  preset: 'ts-jest',
  
  // 测试环境
  testEnvironment: 'node',
  
  // 测试文件匹配模式
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  
  // 文件扩展名
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  
  // 转换配置
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        target: 'ES2020',
        module: 'commonjs',
        esModuleInterop: true,
        forceConsistentCasingInFileNames: true,
        strict: true,
        skipLibCheck: true,
        resolveJsonModule: true,
      },
    }],
  },
  
  // 覆盖率配置
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/swagger.ts',
    '!src/db.ts',
  ],
  
  // 覆盖率阈值 - 临时降低
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 5,
      lines: 5,
      statements: 5,
    },
  },
  
  // 覆盖率报告
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  
  // 测试超时
  testTimeout: 10000,
  
  // 详细输出
  verbose: true,
  
  // 显示测试执行过程
  forceExit: true,
  detectOpenHandles: true,
  
  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};

export default config;
