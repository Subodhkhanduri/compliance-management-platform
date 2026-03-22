import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: './src',
    testMatch: ['**/__tests__/**/*.test.ts'],
    setupFilesAfterFramework: [],
    clearMocks: true,
    collectCoverageFrom: [
        'core/**/*.ts',
        'adapters/**/*.ts',
        '!**/*.d.ts',
    ],
};

export default config;
