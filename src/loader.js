type File = string
type WebpackContext = (req: File) => {}

export default function loader(modulesContext: WebpackContext, ext: Point, di: ?Object) {
  if (window && !window.ext)
    window.ext = ext

  const contextKeys = modulesContext.keys()
  for (let i = 0, len = contextKeys.length; i < len; i++) {
    const file = contextKeys[i]
    const moduleId = modulesContext.resolve(file)
    const moduleInstance = __webpack_require__(moduleId)
    if (moduleInstance && moduleInstance.bootstrap && typeof moduleInstance.bootstrap == 'function') {
      moduleInstance.bootstrap(ext, di)
    }
  }

  return true
}
