import nextConfig from 'eslint-config-next/core-web-vitals';

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      '.agents/**',
      '.taste-skill/**',
      'shots/**',
      'dist/**',
      'coverage/**',
      'postcss.config.mjs',
    ],
  },
  ...nextConfig,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['src/domain/**/*.{js,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              message: 'Domain logic must remain pure TypeScript without React dependencies.',
            },
            {
              name: 'react-dom',
              message: 'Domain logic must remain pure TypeScript without ReactDOM dependencies.',
            },
          ],
          patterns: [
            {
              group: ['next/*', '@/components/*', '**/components/**'],
              message: 'Domain logic must remain pure TypeScript without Next.js or UI component dependencies.',
            },
          ],
        },
      ],
    },
  },
];

export default config;
