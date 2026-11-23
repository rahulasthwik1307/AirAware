/**
 * Testing in AirAware:
 * - Run all tests: npm test (or npm run check)
 * - Run tests with coverage: npm run test:coverage
 * - Watch mode during development: npm run test:watch
 * - Typecheck: npm run typecheck
 * 
 * Tests default to node environment; component/hook tests that require DOM APIs
 * specify `// @vitest-environment jsdom` at the top of the test file.
 */
import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
