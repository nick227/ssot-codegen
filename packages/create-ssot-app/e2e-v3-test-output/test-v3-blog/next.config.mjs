/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@ssot-ui/runtime',
    '@ssot-ui/adapter-data-prisma',
    '@ssot-ui/adapter-ui-internal',
    '@ssot-ui/adapter-auth-nextauth',
    '@ssot-ui/adapter-router-next',
    '@ssot-ui/adapter-format-intl'
  ],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  }
}

export default nextConfig
