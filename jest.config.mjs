import nextJest from 'next/jest.js'; 

const createJestConfig = nextJest({
  dir: './',
});

const config = {
  setupFilesAfterEnv: ['<rootDir>/src/app/tests/setup-tests.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/app/tests/__mocks__/fileMock.js',
  },
  
  transformIgnorePatterns: [
    '/node_modules/(?!(@?react-dnd|dnd-core|react-big-calendar|recharts|@xata.io|lodash-es)/)',
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    '!app/**/*.d.ts',
    '!app/tests/**/*',
    '!**/node_modules/**',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
  ],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
};

export default createJestConfig(config);
