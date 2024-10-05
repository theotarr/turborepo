import { fileURLToPath } from "url"
import createJiti from "jiti"
// import withBundleAnalyzer from "@next/bundle-analyzer"
import { withContentlayer } from "next-contentlayer"

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
createJiti(fileURLToPath(import.meta.url))("./env")

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable strict mode to make sure that live transcription works--this causes the live websocket to be closed and reopened on every change
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "js-beautify",
    "@react-email/components",
    "@react-email/render",
    "@acme/api",
    "@acme/auth",
    "@acme/db",
    "@acme/ui",
    "@acme/validators",
  ],
  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    }
    return config
  },
  images: {
    domains: ["cdn.loom.com"],
  },
}

// export default withBundleAnalyzer(withContentlayer(nextConfig))
export default withContentlayer(nextConfig)
