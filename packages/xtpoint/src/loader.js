type File = string
type Dir = string
type WebpackContext = (req: File) => void
type ContextKeys = Array<Dir>

// number as a string
type WebpackId = String|number

// is a function with keys
type __Webpack_Require__ = (id: WebpackId) => Function.__proto__


// call this in a directory where you want to load the plugins
export default function loader(requireContext: WebpackContext, webpackRequire: __Webpack_Require__, ext: PointRegistry, ...args: mixed) {
  if (!webpackRequire) {
    if (__webpack_require__) {
      webpackRequire = __webpack_require__
    } else {
      throw new Error('had no __webpack_require__')
    }
  }

  // get the context keys, which would be the the folders of the plugins
  // e.g. ['experiment', 'errors', 'express', 'helpscout', ...]
  //
  // get their module ids, then require them with __webpack_require__
  const contextKeys: ContextKeys = requireContext.keys()
  for (let i = 0, len = contextKeys.length; i < len; i++) {
    // use the file, to get the webpackId, to require the file with webpack
    const file: File = contextKeys[i]
    const webpackId: WebpackId = requireContext.resolve(file)
    const instance = webpackRequire(webpackId)

    // call the bootstrap if the instance is loaded
    // and it has an exported bootstrap function
    if (instance && instance.bootstrap && typeof instance.bootstrap == 'function') {
      // call it with the context of the point registry
      //
      // pass in the point registry,
      // along with all of the arguments passed to the loader
      instance.bootstrap.apply(ext, [ext].concat(args))
    }
  }

  return true
}
