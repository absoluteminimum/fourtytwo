import _ from 'underscore'

type id = string
type int = Number
type Scope = Object.self
type Chainable = Object
type MemoryInitialValue = mixed
type Invokable = (name: string, context: Scope) => {}
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
const createInvoke = (point: string, ext: Extension): Invokable => {
  return function(name: string, context: Scope) {
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
   * @see this.extensions
   */
  list(): UnderscoreWrap {
    const extensions: Array<?Extension> = this.extensions

    // only include if
    // 1) global `*` is not enabled
    // 2) it has an id
    for (let i = 0, len = this.extensions.length; i < len; i++) {
      const ext = this.extensions[i]
      if (!this.disabled[ext.id] && !this.disabled['*'])
        extensions[i] = ext
    }

    return _.chain(extensions)
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
   * concatonate arguments with invoke, invoke @this.list
   *
   */
  invoke(name: ?id, context: ?Scope, ...argsForInvoked: mixed): Chainable {
    const allModules = this.list()
    const args = ['invoke'].concat(Array.from(arguments))
    // @marsch: this is done intention, please ask before remove
    try {
      return allModules.invoke.apply(allModules, args)
    } catch (e) {
      console.log("could not invoke properly...")
      console.error(e)
    }

    return this
  }

  /**
   * get the plugin
   * 1) filter plugins to find
   * 2) if found, pass extension to callback and re-sort
   *
   * @TODO: this only matches ids ===, needs wildcards
   */
  get(id: string, callback: Function): Chainable {
    const extension = _(this.extensions)
      .chain()
      .filter(function(obj): boolean { return new RegExp(obj.id, 'g').test(id) })
      .first()
      .value()

    if (extension) {
      callback(extension)
      this.sort()
    }

    return this
  }

  /**
   * @see this.list
   */
  disable(id: string): Chainable {
    this.disabled[id] = true
    return this
  }

  /**
   * @see this.disabled
   */
  enable(id: string): Chainable {
    delete this.disabled[id]
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

  exec(methodName: string, context: ?Scope): mixed {
    const args = Array.from(arguments)
    return this.reduce(function(prev, ext) {
      let extendedArgs = args.slice(2) // skip methodname and context

      if (prev)
        extendedArgs.unshift(prev) // at this as the first argument

      extendedArgs = [methodName, context].concat(extendedArgs)
      return ext.invoke.apply(context, extendedArgs)
    })
  }
}

const externalApi = {
  point: (id = ''): Extension => {
    if (pointRegistry[id] !== undefined)
      return pointRegistry[id]
    return (pointRegistry[id] = new Point({id: id}))
  },

  keys: (): Array => {
    return Object.keys(pointRegistry)
  }
}

export default externalApi
