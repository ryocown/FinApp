export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    // Only include formal Jest tests, exclude legacy script-style tests in tests/
    testMatch: [
        '**/lib/**/*.test.ts',
        '**/models/**/*.test.ts'
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/tests/'  // Legacy script-style tests
    ],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            useESM: true,
        }],
    },
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
};
