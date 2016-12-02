module.exports = {
  'plugins': [
    'no-for-each',
    'flowtype',
  ],
  'parser': 'babel-eslint',
  'env': {
    'node': true,
    'browser': true,
    'es6': true,
  },
  'globals': {
    '__webpack_require__': true,
  },
  'ecmaFeatures': {
    'modules': true,
  },
  'rules': {
    // for loop fixing
    'no-for-each/no-for-each': 2, // ['error', 'cache-length'],
    'no-for-each/no-for-in': 2, // ['error', 'cache-length'],
    'no-for-each/no-for-of': 2, // ['error', 'cache-length'],

    // syntax prefs ---

    // http://eslint.org/docs/rules/comma-dangle
    'comma-dangle': [
      'error',
      'always-multiline',
    ],
    'keyword-spacing': [
      2,
      {
        'before': true,
        'after': true,
      },
    ],
    'space-before-function-paren': [
      'error',
      'never',
    ],
    'no-underscore-dangle': 0,
    'curly': 0,
    'no-multi-spaces': 0,
    'semi': ['error', 'never'],

    // http://eslint.org/docs/rules/object-curly-spacing
    'object-curly-spacing': [
      'error',
      'never',
    ],
    'space-infix-ops': ['error', {'int32Hint': false}],
    'camelcase': 0,
    'new-cap': 0,
    'no-spaced-func': 2,
    'semi-spacing': 2,
    'key-spacing': [2],
    'indent': ['error', 2],

    // const & spread ---

    // suggest using the spread operator instead of .apply()
    // http://eslint.org/docs/rules/prefer-spread
    'prefer-spread': 'error',
    'prefer-const': ['error', {
      'destructuring': 'any',
      'ignoreReadBeforeAssign': true,
    }],

    // nananenano/tsk-tsk ---

    'strict': 1,
    'no-mixed-requires': 0,
    'no-process-exit': 0,
    'no-warning-comments': 0,
    'no-alert': 0,
    'no-debugger': 1,
    'no-empty': 2,
    'no-invalid-regexp': 1,
    'no-unused-expressions': 1,
    'no-native-reassign': 1,
    'no-fallthrough': 1,
    'handle-callback-err': 1,
    'no-undef': 2,
    'no-dupe-keys': 2,
    'no-empty-character-class': 2,
    'no-self-compare': 2,
    'valid-typeof': 2,
    'no-unused-vars': 2,
    'handle-callback-err': 2,
    'no-shadow-restricted-names': 2,
    'no-new-require': 2,
    'no-mixed-spaces-and-tabs': 2,

    // flow ---

    'flowtype/boolean-style': [
      2,
      'boolean',
    ],
    'flowtype/define-flow-type': 1,
    'flowtype/delimiter-dangle': [
      2,
      'never',
    ],
    'flowtype/generic-spacing': [
      2,
      'never',
    ],
    'flowtype/no-primitive-constructor-types': 2,
    'flowtype/no-weak-types': 1,
    'flowtype/object-type-delimiter': [
      2,
      'comma',
    ],
    'flowtype/require-parameter-type': 1,
    'flowtype/require-return-type': [
      1,
      'always',
      {
        'annotateUndefined': 'never',
      },
    ],
    'flowtype/require-valid-file-annotation': 1,
    'flowtype/semi': [
      2,
      'never',
    ],
    'flowtype/space-after-type-colon': [
      2,
      'always',
    ],
    'flowtype/space-before-generic-bracket': [
      2,
      'never',
    ],
    'flowtype/space-before-type-colon': [
      2,
      'never',
    ],
    'flowtype/type-id-match': [
      2,
      '^([A-Z][a-z0-9]+)+Type$',
    ],
    'flowtype/union-intersection-spacing': [
      2,
      'always',
    ],
    'flowtype/use-flow-type': 1,
    'flowtype/valid-syntax': 1,
  },
  'settings': {
    'flowtype': {
      'onlyFilesWithFlowAnnotation': false
    },
  },
}
