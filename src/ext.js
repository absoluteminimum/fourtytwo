import _ from 'underscore'

type id = string
type int = Number
type Scope = Object.self
type ScopeOrString = Scope | String
type Chainable = Object
type MemoryInitialValue = mixed
type Invokable = (name: string, context: Scope) => {}
type StringsOrString = Array<String> | String
type Extension = {
  id: id,
}
type Config = {
  id: id,
}
type Registry = {
  string: Point
}

/**
 * @tutorial
 * http://underscorejs.org/docs/underscore.html#section-174
 *
 * - [ ] maybe could pass option to use _ or not
 */
type OriginalValueModified = mixed
type UnderscoreWrap = {
  value: () => {return: OriginalValueModified}
  // ...all underscorejs functions
}

const pointRegistry: Registry = {}

/**
 * create a function to invoke [with a context]
 */
function createInvoke(point: string, ext: Extension): Invokable {
  return function(context: Scope, name: string) {
    // remove name & ?context from arguments as an array
    const args = Array.from(arguments).slice(2)
    const fn = ext[name]
    if (fn) {
      return fn.apply(context, args)
    } else {
      console.error(ext, ' did not have function for ', name, ext[name])
    }
  }
}

const indexSorter = (a: Extension, b: Extension): int => {
  if (a.index === 'first') return -1
  if (b.index === 'first') return 1
  if (a.index === 'last') return 1
  if (b.index === 'last') return -1
  return a.index - b.index
}

class Point {
  constructor(config: Config) {
    this.id = String(config.id)
    this.extensions = []
    this.orphans = {}
    this.disabled = {}
  }

  /**
   * look for existing extension
   */
  has(id: id): boolean {
    return this.extensions.filter((ext) => {
      return ext.id === id
    }).length > 0
  }

  /**
   * @TODO: use a for loop again
   * @see this.extensions
   */
  list(): UnderscoreWrap {
    // only include if
    // 1) global `*` is not enabled
    // 2) it has an id
    return _.chain(this.extensions).filter(function(obj) {
      return !this.disabled[obj.id] && !this.disabled['*']
    }.bind(this))
  }

  /**
   * @see this.list
   * @see this.orphans
   * sorts using a circleGuard
   */
  sort(): Chainable {
    const basicList = []
    const befores = this.orphans.before || {}
    const afters = this.orphans.after || {}
    const circleGuard = {}

    const fnAddExtension = (ext) => {
      if (circleGuard[ext.id]) {
        throw new Error('Circular References detected for extension point ' + self.id + ' and extension ' + ext.id)
      }
      circleGuard[ext.id] = true
      const before = befores[ext.id]
      if (before) {
        delete befores[ext.id]
        before.sort(indexSorter)
        before.forEach(fnAddExtension)
      }
      this.extensions.push(ext)
      const after = afters[ext.id]
      if (after) {
        delete afters[ext.id]
        after.sort(indexSorter)
        after.forEach(fnAddExtension)
      }
      delete circleGuard[ext.id]
    }

    const extensions = this.extensions
    for (let i = 0, len = extensions.length; i < len; i++) {
      const ext = extensions[i]
      let list
      if (ext.before) {
        list = befores[ext.before]
        if (!list) {
          list = befores[ext.before] = []
        }
      } else if (ext.after) {
        list = afters[ext.after]
        if (!list) {
          list = afters[ext.after] = []
        }
      } else {
        list = basicList
      }
      list.push(ext)
    }

    // renew
    this.extensions = []
    basicList.sort(indexSorter)
    basicList.forEach(fnAddExtension)
    this.orphans.before = befores
    this.orphans.after = afters

    return this
  }

  /**
   * @throws if it already has an invoke method
   *
   * if it doesn't have an id, add one
   * if Point doesn't already have extension, push it, sort it
   */
  extend(extension: Extension): Chainable {
    if (extension.invoke) {
      console.error(extension)
      throw new Error('Extensions must not have their own invoke method')
    }

    if (!extension.id) {
      extension.id = 'default'
      extension.index = extension.index || 100
    } else {
      extension.index = extension.index || 1000000000
    }

    if (!this.has(extension.id)) {
      extension.invoke = createInvoke(this, extension)
      this.extensions.push(extension)
      this.sort()
    }

    return this
  }

  /**
   * get the plugin
   * 1) filter plugins to find
   * 2) if found, pass extension to callback and re-sort
   *
   * .filter(obj => new RegExp(obj.id, 'g').test(id) )
   *
   * @NOTE: was:
   * const extension = _(this.extensions)
   *   .chain()
   *   .filter(function(obj): boolean { return new RegExp(obj.id, 'g').test(id) })
   *   .first()
   *   .value()
   *
   *
   *  const extension = this.extensions
   *   .filter(function(obj): boolean { return new RegExp(obj.id, 'g').test(id) })
   *   .shift()
   *
   * @TODO: pass in an array of ids
   */
  get(id: string, callback: ?Function): mixed {
    const extension = _(this.extensions)
     .chain()
     .filter(obj => new RegExp(obj.id, 'gmi').test(id) )
     .first()
     .value()

    if (extension) {
      if (callback) {
        callback(extension)
        this.sort()
        return this
      }

      this.sort()
    }

    return extension
  }

  /**
   * @see this.list
   */
  disable(id: string): Chainable {
    this.disabled[id] = true
    return this
  }

  /**
   * https://jsperf.com/delete-vs-undefined-vs-null/16
   * @see this.disabled
   */
  enable(id: string): Chainable {
    this.disabled[id] = false
    return this
  }

  /**
   * call a cb for each of the list
   */
  each(cb: Function): Chainable {
    this.list().each(cb)
    return this
  }

  /**
   * call a map cb for each of the list
   */
  map(cb: Function): Chainable {
    return this.list().map(cb)
  }

  /**
   * call a select cb each of the list
   */
  filter(cb: Function): Array<mixed> {
    return this.list().select(cb).value()
  }

  /**
   * call a inject cb for this.list()
   */
  reduce(cb: Function, memo: MemoryInitialValue): Array<mixed> {
    return this.list().inject(cb, memo).value()
  }

  /**
   * return the object, remove it from the list
   */
  pluck(id: string): Array<id> {
    return this.list().pluck(id).value()
  }

  /**
   * return the object, remove it from the list
   */
  pluck(id): Array<id>  {
    return this.list().pluck(id).value()
  }

  isEnabled(id): boolean {
    return !this.disabled[id] && !this.disabled['*']
  }

  /**
   * length of the values in the list
   */
  count(): int {
    return this.list().value().length
  }

  /**
   * concatonate arguments with invoke, invoke @this.list
   *
   * invoke a fn with a context
   * on every extpoint in this namespace
   *
   */
  invoke(context: ?Scope, name: ?id, ...argsForInvoked: mixed): mixed {
    const allModules = this.list()

    let argsArray = Array.from(arguments)

    // if context is an object, keep as is
    // if !object, insert null first for context
    if (!(context && typeof context === 'object')) {
      name = context
      context = null

      // in case it was called with explicit null, or calling externalApi as fn
      if (argsArray[0] !== null) {
        argsArray = [
          null,
          // add the rest of the array
          ...argsArray
        ]
      }
    }

    const args = ['invoke'].concat(argsArray)

    // @marsch: this is done intention, please ask before remove
    try {
      return allModules.invoke.apply(allModules, args)
    } catch (e) {
      console.log("could not invoke properly...")
      console.error(e)
      return this
    }
  }

  /**
   * use a reducer for the .value result on each ext
   *
   * passes previous arguments into the next invoked method
   *
   * returns the function call result
   */
  exec(context: ?ScopeOrString, methodName: ?string): mixed {
    // turn arguments(object) into an array
    let args = Array.from(arguments)

    // if !object, insert null first for context
    if (!(context && typeof context === 'object')) {
      methodName = context
      context = null
      // in case it was called with explicit null, or calling externalApi as fn
      if (args[0] !== null) {
        args = [
          null,
          // add the rest of the array
          ...args
        ]
      }
    }

    // reduce the array result
    return this.reduce(function(prev, ext) {
      let extendedArgs = args.slice(2) // skip methodname and context

      if (prev)
        extendedArgs.unshift(prev) // as this is the first argument

      extendedArgs = [context, methodName].concat(extendedArgs)
      return ext.invoke.apply(context, extendedArgs)
    })
  }
}

// shorthand helper funcs -----------

function getContextNameArgs(args) {
  let context = null
  let name = args.shift()

  // e.g. name.space.fn
  // becomes: [name.space, fn]
  //
  // if name is a string, keep as is
  // otherwise if it is an object, use for context
  if (name && typeof name !== 'string' && typeof name === 'object' ) {
    context = name
    name = args.shift()
  }

  return {context, name, args}
}

function getNamespaceAndFn(name) {
  let id = null

  // @TODO: support multiple ids
  if (name.includes('#')) {
    [name, id] = name.split('#')
  }

  // e.g. name.space.fn#id
  const lastDot = name.lastIndexOf('.')
  const namespace = name.slice(0, lastDot)

  // fn could be an array, comma sep
  let fn = name.slice(lastDot).replace('.', '')
  if (fn && fn.includes(',')) {
    fn = fn.split(',')
  }

  return {fn, namespace, id}
}

const pointFrom = (id = ''): Extension => {
  if (pointRegistry[id] !== undefined)
    return pointRegistry[id]
  return (pointRegistry[id] = new Point({id: id}))
}

// name, ...args
function externalApi() {
  const {name, context, args} = getContextNameArgs(Array.from(arguments))
  const {namespace, fn} = getNamespaceAndFn(name)
  return pointFrom(namespace).invoke(context, fn, ...args).value()
}

externalApi.point = pointFrom

externalApi.keys = (): Array => {
  return Object.keys(pointRegistry)
}

// shorthand helpers -----------

externalApi.exec = function() {
  const {name, context, args} = getContextNameArgs(Array.from(arguments))
  const {namespace, fn, id} = getNamespaceAndFn(name)

  if (id)
    return this.point(namespace).get(id)[fn].apply(...args)

  const bundles = this.point(namespace).exec(context, fn, ...args)
  return bundles.value()
}

externalApi.execAsync = async function() {
  const {name, context, args} = getContextNameArgs(Array.from(arguments))
  const {namespace, fn} = getNamespaceAndFn(name)
  const bundles = this.point(namespace).exec(context, fn, ...args)
  const result = await Promise.all(bundles.value())
  return result
}

externalApi.invoke = function() {
  const {name, context, args} = getContextNameArgs(Array.from(arguments))
  const {namespace, fn} = getNamespaceAndFn(name)
  const bundles = this.point(namespace).invoke(context, fn, ...args)
  return bundles.value()
}

externalApi.invokeAsync = function() {
  const {name, context, args} = getContextNameArgs(Array.from(arguments))
  const {namespace, fn} = getNamespaceAndFn(name)
  const bundles = this.point(namespace).invoke(context, fn, ...args)
  return Promise.all(bundles.value())
}


/**
 * call all specified functions on namespace
 *
 * context = null, namespace: String, fns: StringsOrString, ...argsForInvoked: mixed
 */
externalApi.invokeAll = function(): Array<Extension> {
  const invoked = []

  const {name, context, args} = getContextNameArgs(Array.from(arguments))
  let {namespace, fn} = getNamespaceAndFn(name)
  if (typeof fn === 'string') fn = [fn]

  for (let i = 0; i < fn.length; i ++) {
    const val = this.point(namespace).invoke(context, fn[i], ...args).value()
    if (val.length === 1) {
      invoked.push(val[0])
      continue
    }
    invoked.push(val)
  }

  return invoked
}

/**
 * call all specified functions on namespace using .get
 */
externalApi.callAll = function() {}

externalApi.execAll = function() {}
export default externalApi
