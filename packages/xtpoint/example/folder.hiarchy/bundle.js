export const bootstrap = (ext, di) => {
  ext.point('canada.bootstrap').extend({
    id: 'bill',
    beckonTheDeep: function() {
      return 'bill'
    }
  })
}
