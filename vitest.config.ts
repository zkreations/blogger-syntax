import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    alias: {
      vscode: resolve(import.meta.dirname, 'tests/unit/__mocks__/vscode.ts'),
    },
  },
});
