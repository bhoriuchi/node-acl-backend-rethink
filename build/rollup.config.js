import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/backend.js',
  format: 'cjs',
  plugins: [ babel() ],
  dest: 'index.js'
}