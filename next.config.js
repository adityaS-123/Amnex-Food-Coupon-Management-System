/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async redirects() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
