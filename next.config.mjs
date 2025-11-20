import { withSentryConfig } from '@sentry/nextjs'

const nextConfig = {
  eslint: {
    // Skip ESLint checks during production builds to prevent build failures on lint-only issues
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["localhost", "mydomain.com"],
  },
  // Allow Builder preview domain to access dev resources like /_next/* during development
  allowedDevOrigins: ["*.projects.builder.codes", "*.fly.dev"],
  turbopack: {},
  
  
  // External packages for server components
  serverExternalPackages: ['@sentry/nextjs', 'ioredis'],
  // Prevent bundling node built-ins into client bundles (stubs for Turbopack/webpack)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve || {}
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        crypto: false,
      }
    }
    return config
  },
  
  // Experimental features for better performance
  experimental: {
    // Removed optimizeCss - requires additional critters dependency
    // optimizeCss: true,
    // swcMinify is now enabled by default in Next.js 13+
  },
  async headers() {
    const csp = [
      "default-src 'self' https://vercel.live",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live https://*.vercel.live",
      "style-src 'self' 'unsafe-inline'",
      "img-src * data: blob:",
      "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://*.sentry.io https://*.netlify.app https://*.netlify.com https://*.vercel.app https://*.vercel.com https://vercel.live https://*.vercel.live",
      "font-src 'self' data:",
      "frame-src 'self' https://vercel.live https://*.vercel.live",
      "frame-ancestors 'self' https://vercel.live",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'ALLOW-FROM https://vercel.live' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy-Report-Only', value: csp },
        ],
      },
    ]
  },

  // Legacy route redirects and deprecations
  async redirects() {
    return [
      {
        source: '/api/auth/register/register',
        destination: '/api/auth/register',
        permanent: false,
        statusCode: 307,
      },
    ]
  },
}

const disableSourcemapsOnNetlify = !!process.env.NETLIFY

// Disable Sentry if SENTRY_CLI_SKIP is set or if no valid token is available
const hasSentryToken = process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_AUTH_TOKEN !== ''
const skipSentryInCI = process.env.CI || process.env.VERCEL || process.env.NETLIFY || process.env.SENTRY_CLI_SKIP === 'true'
const shouldUseSentry = process.env.NODE_ENV === 'production' && hasSentryToken && !skipSentryInCI

const sentryPluginOptions = {
  silent: true,
  tunnelRoute: '/monitoring',
  sourcemaps: {
    disable: disableSourcemapsOnNetlify || !hasSentryToken,
    deleteSourcemapsAfterUpload: true,
  },
  disableServerWebpackPlugin: disableSourcemapsOnNetlify || !hasSentryToken,
  disableClientWebpackPlugin: disableSourcemapsOnNetlify || !hasSentryToken,
}

const configWithSentry = shouldUseSentry ? withSentryConfig(nextConfig, sentryPluginOptions) : nextConfig

export default configWithSentry
