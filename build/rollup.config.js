import babel from 'rollup-plugin-babel';

export default {
  input: 'src/index.js',
  plugins: [ babel() ],
  external: ['lodash'],
  output: {
    format: 'cjs',
    file: 'index.js'
  }
}