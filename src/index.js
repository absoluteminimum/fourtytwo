import ext from './ext'
import loader from './loader'
import makeGlobal from './global'

makeGlobal(ext)

export default {ext, loader, makeGlobal}
export {ext}
export {loader}
export {makeGlobal}
