module.exports = {
  type: 'web-module',
  babel: {
    plugins: ['transform-flow-strip-types']
  },
  npm: {
    esModules: true,
    umd: {
      global: 'ext',
      externals: {}
    }
  }
}
