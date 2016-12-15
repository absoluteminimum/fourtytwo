// @flow
import _ from 'underscore'

type id = string
type Int = number
type Scope = object.self
type ScopeOrString = Scope | string
type Chainable = object
type MemoryInitialValue = mixed
type Invokable = (name: string, context: Scope) => {}
type Extension = {
  id: id
}
type Config = {
  id: id
}
type PointRegistry = {
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


// @TODO: json.stringify too
// error handling and debugging
var callbackAsString = function(stackframes) {
  var stringifiedStack = stackframes.map(function(sf) {
    return sf.toString()
  }).join('\n')
  console.log(stringifiedStack)
}
var callbackAsObj = function(stackframes) {
  var stringifiedStack = stackframes.map(function(sf) {
    return sf.toString()
  }).join('\n')
  console.log(stringifiedStack)
}
var errback = function(err) { console.log(err.message) }
/// ----

const pointRegistry: PointRegistry = {}

/**
 * create a function to invoke [with a context]
 */
function createInvoke(point: string, ext: Extension): Invokable {
  return function(context: Scope, name: string) {
    // remove name & ?context from arguments as an array
    const args = Array.from(arguments).slice(2)
    const fn = ext[name]

    if (typeof externalApi !== 'undefined' && externalApi && externalApi.debug && externalApi.debug.invoked) {
      console.debug('-------')
      console.debug('xtpoint invoked: ')
      console.debug('...point: ', point)
      console.debug('...ext: ', ext)
      console.debug('...fn: ', fn)
      console.debug('...args: ', args)
      console.debug('...allArgs: ', arguments)
      console.log('\n\n\n')
    }

    if (fn) {
      return fn.apply(context, args)
    } else {
      console.error(ext, ' did not have function for ', name, ext[name])
    }
  }
}

const indexSorter = (a: Extension, b: Extension): Int => {
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

    const fnAddExtension = (ext: Extension) => {
      if (circleGuard[ext.id]) {
        throw new Error('Circular References detected for extension point ' + self.id + ' and extension ' + ext.id)
      }
      circleGuard[ext.id] = true
      const before = befores[ext.id]
      if (before) {
        befores[ext.id] = false
        before.sort(indexSorter)
        before.forEach(fnAddExtension)
      }
      this.extensions.push(ext)
      const after = afters[ext.id]
      if (after) {
        afters[ext.id] = false
        after.sort(indexSorter)
        after.forEach(fnAddExtension)
      }
      circleGuard[ext.id] = false
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
  pluck(id: string): Array<id>  {
    return this.list().pluck(id).value()
  }

  isEnabled(id: string): boolean {
    return !this.disabled[id] && !this.disabled['*']
  }

  /**
   * length of the values in the list
   */
  count(): Int {
    return this.list().value().length
  }

  /**
   * concatonate arguments with invoke, invoke @this.list
   *
   * invoke a fn with a context
   * on every extpoint in this namespace
   *
   * last param: ...argsForInvoked: mixed
   */
  invoke(context: ?Scope, name: ?id): mixed {
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
          ...argsArray,
        ]
      }
    }

    const args = ['invoke'].concat(argsArray)

    // @marsch: this is done intention, please ask before remove
    try {
      return allModules.invoke(...args)
    } catch (e) {
      console.log("could not invoke properly...")
      console.error(e)

      var StackTrace = require('stacktrace-js')
      StackTrace.fromError(e).then(callbackAsObj).catch(errback)
      StackTrace.fromError(e).then(callbackAsString).catch(errback)

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
      // safeguard, if context was explicitly null
      if (context) {
        methodName = context
      }
      context = null
      // in case it was called with explicit null, or calling externalApi as fn
      if (args[0] !== null) {
        args = [
          null,
          // add the rest of the array
          ...args,
        ]
      }
    }

    // reduce the array result
    return this.reduce(function(prev: ?Extension, ext: ?Extension): mixed {
      let extendedArgs = args.slice(2) // skip methodname and context

      if (prev)
        extendedArgs.unshift(prev) // as this is the first argument

      extendedArgs = [context, methodName].concat(extendedArgs)
      return ext.invoke.apply(context, extendedArgs)
    })
  }

  /**
   * same as ^, but async
   * @TODO: http://underscorejs.org/#after
   */
  execAsync = async function(context: ?ScopeOrString, methodName: ?string): mixed {
    // turn arguments(object) into an array
    let args = Array.from(arguments)

    // if !object, insert null first for context
    if (!(context && typeof context === 'object')) {
      // safeguard, if context was explicitly null
      if (context) {
        methodName = context
      }

      context = null
      // in case it was called with explicit null, or calling externalApi as fn
      if (args[0] !== null) {
        args = [
          null,
          // add the rest of the array
          ...args,
        ]
      }
    }

    // reduce the array result
    return this.reduce(async function(prev: ?Extension, ext: ?Extension): mixed {
      let extendedArgs = args.slice(2) // skip methodname and context

      if (prev)
        extendedArgs.unshift(prev) // as this is the first argument

      extendedArgs = [context, methodName].concat(extendedArgs)
      return await ext.invoke.apply(context, extendedArgs)
    })
  }
}

// shorthand helper funcs -----------

function getContextNameArgs(args: mixed): object {
  let context = null

  if (externalApi.debug && externalApi.debug.args) {
    console.debug('xtpoints debug args: ')
    for (let i = 0; i < args.length; i++) {
      console.debug(args[i])
    }
    console.debug(';;;args;;; \n')
  }

  let name = args.shift()

  // e.g. name.space.fn
  // becomes: [name.space, fn]
  //
  // if name is a string, keep as is
  // otherwise if it is an object, use for context
  if (name && typeof name !== 'string' && typeof name === 'object' ) {
    context = name
    name = args.shift()

    // safety
    if (!name) {
      name = context
    }
  }

  return {context, name, args}
}

function getNamespaceAndFn(name: string): object {
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


// function callFunction(pointWithId, fn, context, args) {
//   const fnToCall = pointWithId[fn]
//   if (!fn) {
//     throw new Error(`${fnToCall} was not a function on ${pointWithId}`)
//   }
//   return fnToCall.apply(context, ...args)
// }


function debugXtpoints(all) {
  const {
    namespace,
    context,
    id,
    fn,
    name,
    allArgs,
    args,
    type,
  } = all

  try {
    // @TODO
    // if (externalApi.debug.filter)
    if (externalApi.debug.cb) {
      return externalApi.debug.cb(all)
    }

    console.debug('-------------')
    console.debug('xtpoints. ' + type + ' :')
    if (externalApi.debug.point)
      console.debug('...point: ', pointFrom(namespace))
    if (externalApi.debug.id)
      console.debug('...id: ', id)
    if (externalApi.debug.namespace)
      console.debug('...namespace: ', namespace)
    if (externalApi.debug.context)
      console.debug('...context: ', context)
    if (externalApi.debug.fn)
      console.debug('...fn: ', fn)
    if (externalApi.debug.name)
      console.debug('...name: ', name)
    if (externalApi.debug.list)
      console.debug('...func: ', pointFrom(namespace).list())
    if (externalApi.debug.allArgs)
      console.debug('...allArgs: ', allArgs)
    if (externalApi.debug.args)
      console.debug('...args: ', args)
    if (externalApi.debug.stacktrace) {
      console.log('\n\n')

      // @TODO: ASYNC
      var StackTrace = require('stacktrace-js')
      StackTrace.get().then(callbackAsObj).catch(errback)
      StackTrace.get().then(callbackAsString).catch(errback)
    }

    console.log('\n\n\n')
  } catch (e) {
    console.error(e.message, '... could not debug, sorry eh.')
  }
}

// name, ...args
function externalApi(): mixed {
  const {name, context, args} = getContextNameArgs(Array.from(arguments))

  const {namespace, fn, id} = getNamespaceAndFn(name)

  if (externalApi.debug) {
    debugXtpoints({
      name, context, args,
      namespace, fn, id,
      allArgs: Array.from(arguments),
      type: 'shorthand',
    })
  }


  if (id) {
    const point = pointFrom(namespace)
    if (!point.has(id)) {
      throw new Error(`did not have id (${id}) for namespace (${namespace}), point: ${point}`)
    }
    const pointWithId = point.get(id)
    const func = pointWithId[fn]
    // removed for now
    // const pointWithId = point.get(id)
    // isArray https://jsperf.com/instanceof-array-vs-array-isarray/6
    // if (fn && fn.push && fn.pop) {
    //   const results = []
    //   for (let i = 0; i < fn.length; i++) {
    //     results.push(pointFrom(namespace).get(id)[fn[i]].apply(context, ...args))
    //   }
    //   return results
    // }

    // return pointFrom(namespace).get(id)[fn].apply(context, ...args)
    return (func.apply(context, args))
    //return callFunction(pointWithId, fn, context, args)
  }

  return pointFrom(namespace).invoke(context, fn, ...args).value()
}

externalApi.point = pointFrom

externalApi.keys = (): Array => {
  return Object.keys(pointRegistry)
}

// shorthand helpers -----------

externalApi.getById = function(name) {
  const {namespace, fn, id} = getNamespaceAndFn(name)
  return pointFrom(namespace).get(id)[fn]
}

externalApi.exec = function(): array | mixed {
  const {name, context, args} = getContextNameArgs(Array.from(arguments))
  const {namespace, fn, id} = getNamespaceAndFn(name)

  if (externalApi.debug) {
    debugXtpoints({
      name, context, args,
      namespace, fn, id,
      allArgs: Array.from(arguments),
      type: 'exec',
    })
  }

  if (id)
    return this.point(namespace).get(id)[fn].apply(...args)

  const bundles = this.point(namespace).exec(context, fn, ...args)
  return bundles
}

externalApi.execAsync = async function(): mixed {
  const {name, context, args} = getContextNameArgs(Array.from(arguments))
  const {namespace, fn, id} = getNamespaceAndFn(name)

  if (externalApi.debug) {
    debugXtpoints({
      name, context, args,
      namespace, fn, id,
      allArgs: Array.from(arguments),
      type: 'execAsync',
    })
  }

  const bundles = await this.point(namespace).exec(context, fn, ...args)
  if (bundles[0] && typeof bundles[0].then === 'function')
    return await Promise.all(bundles)
  return bundles
}

externalApi.invoke = function(): Promise | mixed {
  const {name, context, args} = getContextNameArgs(Array.from(arguments))
  const {namespace, fn, id} = getNamespaceAndFn(name)

  if (externalApi.debug) {
    debugXtpoints({
      name, context, args,
      namespace, fn, id,
      allArgs: Array.from(arguments),
      type: 'invoke',
    })
  }

  const bundles = this.point(namespace).invoke(context, fn, ...args)
  return bundles.value()
}

externalApi.invokeAsync = function(): mixed {
  const {name, context, args} = getContextNameArgs(Array.from(arguments))
  const {namespace, fn, id} = getNamespaceAndFn(name)

  if (externalApi.debug) {
    debugXtpoints({
      name, context, args,
      namespace, fn, id,
      allArgs: Array.from(arguments),
      type: 'invokeAsync',
    })
  }

  // if (id) {
  //   const point = pointFrom(namespace)
  //   if (!point.has(id)) {
  //     throw new Error(`did not have id (${id}) for namespace (${namespace}), point: ${point}`)
  //   }
  //   const pointWithId = point.get(id)
  //   const func = pointWithId[fn]
  //   return await func.apply(context, args))
  // }

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

  if (externalApi.debug) {
    debugXtpoints({
      name, context, args,
      namespace, fn, id: null,
      allArgs: Array.from(arguments),
      type: 'invokeAll',
    })
  }

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
