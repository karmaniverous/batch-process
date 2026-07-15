import eslint from '@eslint/js';
import vitestPlugin from '@vitest/eslint-plugin';
import type { Linter } from 'eslint';
import prettierConfig from 'eslint-config-prettier';
import jsonc from 'eslint-plugin-jsonc';
import prettierPlugin from 'eslint-plugin-prettier';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import tsdocPlugin from 'eslint-plugin-tsdoc';
import globals from 'globals';
import * as jsoncParserRaw from 'jsonc-eslint-parser';
import { dirname } from 'path';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'url';

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));
const jsoncParser = jsoncParserRaw as unknown as Linter.Parser;

// Extract rules from typescript-eslint strictTypeChecked into a single rules
// object in a type-safe way.
const strictConfigs = tseslint.configs
  .strictTypeChecked as unknown as Array<unknown>;
const strictTypeCheckedRules = strictConfigs.reduce<Record<string, unknown>>(
  (acc, cfg) => {
    const rules = (cfg as { rules?: Record<string, unknown> }).rules;
    if (rules) Object.assign(acc, rules);
    return acc;
  },
  {},
);

// Safely extract Vitest recommended rules for flat config usage.
const vitestRecommendedRules =
  (
    vitestPlugin as unknown as {
      configs?: { recommended?: { rules?: Record<string, unknown> } };
    }
  ).configs?.recommended?.rules ?? {};

export default [
  // Make Node globals available project-wide
  {
    languageOptions: { globals: { ...globals.node, ...globals.es2024 } },
  },
  {
    ignores: [
      '**/.rollup.cache/**',
      'coverage/**',
      'dist/**',
      'docs/**',
      'node_modules/**',
    ],
  },
  // Base JS rules
  eslint.configs.recommended,

  // Lint JSON using jsonc parser, apply Prettier to JSON
  {
    files: ['**/*.json'],
    languageOptions: {
      parser: jsoncParser,
    },
    plugins: {
      jsonc,
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },

  // Apply Prettier to JS files
  {
    files: ['**/*.{js,cjs,mjs}'],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },

  // Typed TypeScript rules (scoped to TS files only)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        tsconfigRootDir,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      prettier: prettierPlugin,
      'simple-import-sort': simpleImportSortPlugin,
      tsdoc: tsdocPlugin,
    },
    rules: {
      ...strictTypeCheckedRules,
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
        },
      ],
      'no-unused-vars': 'off',
      'prettier/prettier': 'error',
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': 'error',
      'tsdoc/syntax': 'error',
    },
  },

  // Vitest-specific rules for test files
  {
    files: ['**/*.test.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        tsconfigRootDir,
      },
      globals: { ...globals.node, ...globals.es2024 },
    },
    plugins: {
      vitest: vitestPlugin,
    },
    settings: {
      vitest: {
        typecheck: true,
      },
    },
    rules: {
      ...vitestRecommendedRules,
      'prettier/prettier': 'error',
      'vitest/no-disabled-tests': 'off',
      'vitest/no-identical-title': 'off',
    },
  },
  prettierConfig,
];
