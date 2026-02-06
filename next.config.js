/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lrasuvrzyzmmjumxrhzv.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lrasuvrzyzmmjumxrhzv.supabase.co',
        port: '',
        pathname: '/storage/v1/object/sign/**',
      },
      {
        protocol: 'https',
        hostname: 'lrasuvrzyzmmjumxrhzv.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
    ];
  },
}

module.exports = nextConfig
