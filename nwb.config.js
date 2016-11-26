module.exports = {
  type: 'web-module',
  babel: {
    plugins: ['transform-async-to-generator', 'transform-flow-strip-types']
  },
  npm: {
    esModules: true,
    umd: {
      global: 'ext',
      externals: {}
    }
  }
}
