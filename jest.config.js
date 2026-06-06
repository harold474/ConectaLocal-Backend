module.exports = {
    testEnvironment: 'node',
    collectCoverage: true,
    setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
    collectCoverageFrom: [
        'index.js',
        'logic.js'
    ],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/middleware/',
        '/db.js',
        '/uploads/'
    ],
    coverageThreshold: {
        global: {
            statements: 85,
            branches: 85,
            functions: 85,
            lines: 85
        }
    }
};