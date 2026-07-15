import tsconfigPaths from 'vite-tsconfig-paths';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    exclude: [...configDefaults.exclude, '**/.rollup.cache/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        '**/*.d.ts',
        '**/*.config.*',
        'dist/**',
        '**/.rollup.cache/**',
        'docs/**',
      ],
    },
    testTimeout: 60_000,
  },
});
