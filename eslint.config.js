const js = require('@eslint/js');

module.exports = [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'prisma/migrations/**',
      '*.db',
      '*.db-journal',
    ],
  },
  js.configs.recommended,
  {
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'log'] }],
      'no-undef': 'off',
    },
  },
];
