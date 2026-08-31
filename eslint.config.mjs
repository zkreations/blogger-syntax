import antfu from '@antfu/eslint-config';

export default antfu({
  typescript: true,
  stylistic: {
    semi: true,
    quotes: 'single',
  },
  rules: {
    'no-console': 'off',
    'no-template-curly-in-string': 'off',
  },
  ignores: [
    'out',
    'dist',
    '*.vsix',
    'snippets/**',
    'images/**',
    '.vscode/**',
    '.vscode-test/**',
    'node_modules/**',
  ],
});
