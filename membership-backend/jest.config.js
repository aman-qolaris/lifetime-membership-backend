/** @type {import('jest').Config} */
export default {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],
  setupFiles: ["<rootDir>/tests/jest.setup.js"],
  globalTeardown: "<rootDir>/tests/jest.teardown.js",
  // ESM support
  transform: {},
};
