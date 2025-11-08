module.exports = {
  extends: ['next/core-web-vitals', 'next/typescript'],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname
  },
  rules: {
    'react/jsx-sort-props': 'off'
  }
};
