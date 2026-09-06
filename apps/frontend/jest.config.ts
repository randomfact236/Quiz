import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Deliberately modest floors — raise as coverage grows, never lower to
  // sneak a change through.
  coverageThreshold: {
    global: { statements: 30, branches: 20, functions: 30, lines: 30 },
  },
};

export default createJestConfig(config);
