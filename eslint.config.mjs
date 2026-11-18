import nextConfig from 'eslint-config-next/core-web-vitals';

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      '.agents/**',
      'dist/**',
      'postcss.config.mjs',
    ],
  },
  ...nextConfig,
];

export default config;
