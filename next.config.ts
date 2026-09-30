import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /*
   * `npm run verify:full` builds into `.next-verify` (it sets NEXT_DIST_DIR) so
   * a check never overwrites the `.next` a running `npm run dev` is serving
   * from -- that left the dev server answering 500 on 2026-09-30.
   */
  distDir: process.env.NEXT_DIST_DIR || '.next',

  /*
   * A stray package-lock.json in the user profile directory makes Next infer
   * the wrong workspace root, which would mis-trace files when deploying.
   * Pin it to this project.
   */
  outputFileTracingRoot: path.join(__dirname),

  /*
   * `npm run dev` runs Turbopack (see package.json); `npm run build` stays on
   * webpack, whose persistent cache logs "Serializing big strings (259kiB)
   * impacts deserialization performance" for the compiled Tailwind stylesheet.
   * That is a note about webpack's own cache format, not about our bundle, and
   * there is no knob on our side that shrinks a generated stylesheet into a
   * Buffer. Keep real errors, drop the infrastructure chatter.
   */
  webpack(config) {
    config.infrastructureLogging = { ...config.infrastructureLogging, level: 'error' }
    return config
  },

  // `npm run dev` is Turbopack. Pin its root for the same stray-lockfile
  // reason as outputFileTracingRoot above. Having any turbopack key also tells
  // Next the webpack hook is build-only, which silences its "Webpack is
  // configured while Turbopack is not" warning (an empty object does not count).
  turbopack: { root: path.join(__dirname) },

  // The benchmarker moved from Tools to Markets with the v0.5 restructure
  // (markets/benchmarks). Old links and bookmarks keep working.
  async redirects() {
    return [{ source: '/tools/benchmarks', destination: '/markets/benchmarks', permanent: true }]
  },
}

export default nextConfig
