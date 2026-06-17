module.exports = {
  root: true,
  extends: [
    'expo',
    require.resolve('@cardvault/eslint-config/base'),
    'plugin:prettier/recommended',
  ],
  plugins: ['import'],
  settings: {
    'import/resolver': {
      typescript: {
        project: `${__dirname}/tsconfig.json`,
      },
      node: true,
    },
  },
  rules: {
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/rules-of-hooks': 'error',
  },
  ignorePatterns: ['.eslintrc.js', 'node_modules/', '.expo/', 'babel.config.js', 'metro.config.js'],
};
