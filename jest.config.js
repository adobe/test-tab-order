module.exports = {
  collectCoverageFrom: ['**/*.ts', '!**/*.d.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js'],
  testMatch: ['**/*.test.ts'],
}
