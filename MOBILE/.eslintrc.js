module.exports = {
  root: true,
  extends: [
    'expo',
    require.resolve('@cardvault/eslint-config/base'),
    'plugin:prettier/recommended',
    'plugin:react-native-a11y/all',
  ],
  plugins: ['import', 'react-native-a11y'],
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
    'react-native-a11y/has-accessibility-hint': 'off',
  },
  ignorePatterns: ['.eslintrc.js', 'node_modules/', '.expo/', 'babel.config.js', 'metro.config.js'],
};
