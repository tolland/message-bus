const { compilerOptions } = require('./tsconfig.base.json');
const { pathsToModuleNameMapper } = require('ts-jest');

/** @type {import('jest').Config} */
const config = {
    clearMocks: true,
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
        '^.+\\.(js|jsx)$': 'babel-jest',
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(openapi-fetch|@anthropic-ai)/)',
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
        prefix: '<rootDir>/src/',
    }),
    setupFilesAfterEnv: ['./jest.setup.js'],
    roots: ['<rootDir>/src'],
    testMatch: [
        '**/src/**/__tests__/**/*.[jt]s?(x)',
        '**/src/**/?(*.)+(spec|test).[tj]s?(x)',
    ],
    testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],
};

module.exports = config;
