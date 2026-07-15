import { createRequire } from 'node:module';

import aliasPlugin, { type Alias } from '@rollup/plugin-alias';
import commonjsPlugin from '@rollup/plugin-commonjs';
import jsonPlugin from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescriptPlugin from '@rollup/plugin-typescript';
import type { InputOptions, RollupOptions } from 'rollup';
import dtsPlugin from 'rollup-plugin-dts';

const require = createRequire(import.meta.url);
const pkg = require('./package.json') as Record<string, unknown>;

const outputPath = `dist`;

const commonPlugins = (outDir: string) => [
  commonjsPlugin(),
  jsonPlugin(),
  nodeResolve(),
  typescriptPlugin({
    compilerOptions: { outDir },
    outputToFilesystem: true,
  }),
];

const commonAliases: Alias[] = [];

const commonInputOptions: InputOptions = {
  external: [
    ...Object.keys(
      (pkg.dependencies as Record<string, string> | undefined) ?? {},
    ),
    ...Object.keys(
      (pkg.peerDependencies as Record<string, string> | undefined) ?? {},
    ),
    'tslib',
  ],
  input: 'src/index.ts',
};

const config: RollupOptions[] = [
  // ESM output.
  {
    ...commonInputOptions,
    plugins: [
      aliasPlugin({ entries: commonAliases }),
      ...commonPlugins(`${outputPath}/mjs`),
    ],
    output: [
      {
        dir: `${outputPath}/mjs`,
        extend: true,
        format: 'esm',
        preserveModules: true,
      },
    ],
  },

  // CommonJS output.
  {
    ...commonInputOptions,
    plugins: [
      aliasPlugin({ entries: commonAliases }),
      ...commonPlugins(`${outputPath}/cjs`),
    ],
    output: [
      {
        dir: `${outputPath}/cjs`,
        extend: true,
        format: 'cjs',
        preserveModules: true,
      },
    ],
  },

  // Type definitions output.
  {
    ...commonInputOptions,
    plugins: [
      aliasPlugin({ entries: commonAliases }),
      ...commonPlugins(outputPath),
      dtsPlugin(),
    ],
    output: [
      {
        extend: true,
        file: `${outputPath}/index.d.ts`,
        format: 'esm',
      },
    ],
  },
];

export default config;
