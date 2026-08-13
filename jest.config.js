module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  transform: { '^.+\\.(ts|tsx)$': 'ts-jest' },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    // Types only — nothing to execute, so a 0% statement score for it is an
    // artefact that drags the average down and hides a real gap elsewhere.
    '!src/types.ts',
    '!src/**/*.test.{ts,tsx}',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // The theory has no untested corner. A library whose laws are its product
  // cannot ship at the 80% that suits an application.
  coverageThreshold: {
    global: { branches: 94, functions: 95, lines: 99, statements: 99 },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
