import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'

const pkgName = 'traceprojector'

export default [
  {
    input: 'traceprojector/traceprojector.js',
    output: {
      file: `dist/${pkgName}.esm.js`,
      format: 'esm',
      sourcemap: true
    },
    plugins: [
      resolve(),
      commonjs()
    ]
  },
  {
    input: 'traceprojector/traceprojector.js',
    output: {
      file: `dist/${pkgName}.cjs.js`,
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      resolve(),
      commonjs()
    ]
  },
  {
    input: 'traceprojector/traceprojector.js',
    output: {
      file: `dist/${pkgName}.umd.js`,
      format: 'umd',
      name: 'TraceProjector',
      sourcemap: true
    },
    plugins: [
      resolve(),
      commonjs(),
      terser()
    ]
  }
]
