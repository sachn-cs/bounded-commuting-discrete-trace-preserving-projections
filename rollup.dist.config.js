import resolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'

const pkgName = 'traceprojector'

export default [
  {
    input: 'src/lib/traceprojector.js',
    output: {
      file: `dist/${pkgName}.esm.js`,
      format: 'esm',
      sourcemap: true
    },
    plugins: [
      resolve(),
      commonjs(),
      babel({ babelHelpers: 'bundled', exclude: 'node_modules/**' })
    ]
  },
  {
    input: 'src/lib/traceprojector.js',
    output: {
      file: `dist/${pkgName}.cjs.js`,
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      resolve(),
      commonjs(),
      babel({ babelHelpers: 'bundled', exclude: 'node_modules/**' })
    ]
  },
  {
    input: 'src/lib/traceprojector.js',
    output: {
      file: `dist/${pkgName}.umd.js`,
      format: 'umd',
      name: 'TraceProjector',
      sourcemap: true
    },
    plugins: [
      resolve(),
      commonjs(),
      babel({ babelHelpers: 'bundled', exclude: 'node_modules/**' }),
      terser()
    ]
  }
]
