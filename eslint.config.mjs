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
      'postcss.config.mjs',
    ],
  },
  ...nextConfig,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];

export default config;
