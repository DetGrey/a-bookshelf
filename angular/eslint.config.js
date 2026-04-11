const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const angularEslint = require('@angular-eslint/eslint-plugin');
const angularTemplate = require('@angular-eslint/eslint-plugin-template');
const angularTemplateParser = require('@angular-eslint/template-parser');
const boundaries = require('eslint-plugin-boundaries');

module.exports = [
  {
    files: ['src/**/*.ts'],
    ignores: ['src/**/*.spec.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
    },
    plugins: {
      '@angular-eslint': angularEslint,
      '@typescript-eslint': tsPlugin,
      boundaries,
    },
    settings: {
      'boundaries/elements': [
        { type: 'app-root', pattern: 'src/app/*.ts' },
        { type: 'bootstrap', pattern: 'src/main.ts' },
        { type: 'env', pattern: 'src/environments/**' },
        { type: 'features', pattern: 'src/app/features/**' },
        { type: 'shared', pattern: 'src/app/shared/**' },
        { type: 'core', pattern: 'src/app/core/**' },
        { type: 'models', pattern: 'src/app/models/**' },
      ],
    },
    rules: {
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      'no-restricted-globals': [
        'error',
        {
          name: 'document',
          message: 'Inject DOCUMENT from @angular/common instead of using the global document object.',
        },
        {
          name: 'window',
          message: 'Use DOCUMENT.defaultView instead of the global window object.',
        },
      ],
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: { type: 'app-root' }, allow: { to: { type: ['core', 'features', 'shared', 'models', 'env', 'bootstrap'] } } },
            { from: { type: 'features' }, allow: { to: { type: ['core', 'shared', 'models', 'env'] } } },
            { from: { type: 'shared' }, allow: { to: { type: ['models', 'env'] } } },
            { from: { type: 'core' }, allow: { to: { type: ['models', 'env'] } } },
            { from: { type: 'models' }, disallow: { to: { type: '*' } } },
            { from: { type: 'env' }, disallow: { to: { type: '*' } } },
            { from: { type: 'bootstrap' }, allow: { to: { type: ['app-root', 'env'] } } },
          ],
        },
      ],
      'boundaries/no-unknown-files': 'off',
    },
  },
  {
    files: ['src/**/*.spec.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.spec.json'],
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
    },
    plugins: {
      boundaries,
    },
    rules: {
      'boundaries/no-unknown-files': 'off',
      'boundaries/dependencies': 'off',
    },
  },
  {
    files: ['src/**/*.html'],
    languageOptions: {
      parser: angularTemplateParser,
    },
    plugins: {
      '@angular-eslint/template': angularTemplate,
    },
    rules: {
      '@angular-eslint/template/no-any': 'error',
    },
  },
];
