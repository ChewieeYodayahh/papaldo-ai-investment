import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /*
   * A stray package-lock.json in the user profile directory makes Next infer
   * the wrong workspace root, which would mis-trace files when deploying.
   * Pin it to this project.
   */
  outputFileTracingRoot: path.join(__dirname),
}

export default nextConfig
