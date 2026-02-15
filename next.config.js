/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/**' },
      { protocol: 'https', hostname: '**.supabase.co', pathname: '/**' },
      { protocol: 'https', hostname: '*', pathname: '/**' },
      { protocol: 'http', hostname: '*', pathname: '/**' },
    ],
  },
}
module.exports = nextConfig
