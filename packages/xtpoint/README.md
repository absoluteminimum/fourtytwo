# xtpoint

(based on base implementation used within the [open-xchange](https://github.com/Open-Xchange-Frontend) project)

[![Travis][build-badge]][build]
[![npm package][npm-badge]][npm]

development model where applications are (dynamically) composed of many different (reusable) components.

[build-badge]: https://travis-ci.org/aretecode/xtpoint.svg?branch=master
[build]: https://travis-ci.org/aretecode/xpoint

[npm-badge]: https://img.shields.io/npm/v/xtpoint.png?style=flat-square
[npm]: [https://www.npmjs.com/package/xtpoint]

# Extension Points
*(borrowed from eclipse.org project)* A basic rule for building modular software systems is to avoid tight coupling between components. If components are tightly integrated, it becomes difficult to assemble the pieces into different configurations or to replace a component with a different implementation without causing a ripple of changes across the system.

Loose coupling is achieved partially through the mechanism of extensions and extension points. The simplest metaphor for describing extensions and extension points is electrical outlets. The outlet, or socket, is the extension point; the plug, or light bulb that connects to it, the extension. As with electric outlets, extension points come in a wide variety of shapes and sizes, and only the extensions that are designed for that particular extension point will fit.

When a plug-in wants to allow other plug-ins to extend or customize portions of its functionality, it will declare an extension point. The extension point declares a contract, that extensions must conform to. Plug-ins that want to connect to that extension point must implement that contract in their extension. The key attribute is that the plug-in being extended knows nothing about the plug-in that is connecting to it beyond the scope of that extension point contract. This allows plug-ins built by different individuals or companies to interact seamlessly, even without their knowing much about one another.

Some extensions are entirely declarative; that is, they contribute no code at all. For example, one extension point provides the ability to register a specific route, where the consuming extension would define the route and the mapping to the view component.

```javascript
getChildRoutes = (next, callback) => {
  const routes = []
  const childRoutes = ext.point('app.routes').exec('config', this, routes)
 
  const matchingChildRoutes = childRoutes.find(function(route) {
    return new RegExp(route.path).test(next.location.pathname)
  })
  return callback(null, [matchingChildRoutes])
}
```

Example usage of an extension point:
```javascript

ext.point('app.routes').extend({
  id: 'site',
  config: function(routes = []) {
    routes.push({
      path: '/site/live',
      getComponents(nextState, cb) {
        require.ensure([], (require) => {
          cb(null, require('./components/site'))
        })
      }
    })
    return routes
  }
})
```

*NOTE: the example above also shows how code-chunking is used to load the view-component on demand*

Where another category of extension points is used to group related elements in the user interface. For example, extension points for providing views, editors, and wizards to the UI allow the base UI plug-in to group common features, such as putting all import wizards into a single dialog, and to define a consistent way of presenting UI contributions from a wide variety of other plug-ins.

Extension-points may also be used to overwrite default behavior of a plugin.
