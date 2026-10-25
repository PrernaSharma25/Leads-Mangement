import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  setupFiles: ['<rootDir>/tests/env.setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  clearMocks: true,
  verbose: true,
  forceExit: true,
};

export default config;
