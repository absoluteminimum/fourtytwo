import {expect} from 'chai'
import {ext, loader} from '../src/index'
const di = {agnosticAndOptional: true}

describe('xtpoint', () => {
  beforeEach(() => {
    const bootstrap = (ext, di) => {
      ext.point('canada.swappable').extend({
        id: 'hot',
        render: async function() {
          return 'hot'
        }
      })
      ext.point('canada.swappable').extend({
        id: 'swap',
        render: async function() {
          return 'swap'
        }
      })
      ext.point('canada.eh').extend({
        id: 'igloo',
        render: function() {
          return {...arguments, di, ext}
        }
      })
      ext.point('canada.eh').extend({
        id: 'moose',
        render: function() {
          return {...arguments, di, ext}
        }
      })
      ext.point('canada.hockey').extend({
        id: 'puck',
        slapshot: function(arg1, arg2) {
          if (this && this.propertiesInScope) {
            return true
          }
          if (arg1 && !arg2) {
            return arg1 + 'score!'
          }
          if (arg2) {
            return arg1 + arg2 + 'scores!'
          }
          return 'score!'
        }
      })

      ext.point('canada.multi').extend({
        id: 'all',
        first: function() {
          return 'first1'
        },
        second: function() {
          return {'second': true}
        }
      })
    }
    bootstrap(ext, di)
  })


  it('invokes a plugin', () => {
    const bundles = ext.point('canada.eh').invoke('render')
    expect(bundles).to.be.an.object
  })
  it('invokes bundle of plugins', async () => {
    const bundles = ext.point('canada.swappable').invoke('render')
    const values = await Promise.all(bundles.value())
    expect(values).to.eql(['hot', 'swap'])
  })
  it('executes plugin without context', () => {
    const msg = ext.point('canada.hockey').exec('slapshot')
    expect(msg).to.eql('score!')
  })
  it('executes plugin with context and args', () => {
    const scoped = {
      propertiesInScope: true
    }
    const readingScopeProp = ext.point('canada.hockey').exec('slapshot', scoped, 'other unused argument')
    expect(readingScopeProp).to.be.true
  })
  it('executes plugin without context and args', () => {
    const msg = ext.point('canada.hockey').exec('slapshot', null, 'he shoots...')
    expect(msg).to.eql('he shoots...' + 'score!')
  })
  it('multi fn exec', () => {
    const returned = ext.invokeAll('canada.multi', ['first', 'second'])
    expect(returned).to.eql(['first1', {second: true}])
  })
  it('disable id works', () => {
    ext.point('canada.hockey').disable('puck')
    const msg = ext.point('canada.hockey').exec('slapshot', null, 'he shoots...')
    expect(msg).to.eql(undefined)
  })
  it('enable id works', () => {
    ext.point('canada.hockey').enable('puck')
    const msg = ext.point('canada.hockey').exec('slapshot', null, 'he shoots...')
    expect(msg).to.eql('he shoots...' + 'score!')
  })

  it('test loader', () => {
    const modulesContext = require.context('../example', true, /^\.\/[^\/]+?\/bundle\.js$/)
    const loaded = loader(modulesContext, ext, di)
    expect(loaded).to.eql(true)

    const captain = ext.point('canada.bootstrap').exec('beckonTheDeep')
    expect(captain).to.eql('bill')
  })
  it('test loader keys', () => {
    const modulesContext = require.context('../example', true, /^\.\/[^\/]+?\/bundle\.js$/)
    loader(modulesContext, ext, di)

    // ['canada.swappable', 'canada.eh', 'canada.hockey', 'canada.multi', 'canada.bootstrap']
    console.log(ext.keys())
    expect(ext.keys().length).to.be.at.least(1)
  })

})
