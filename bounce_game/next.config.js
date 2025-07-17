/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // allow local images without additional config
  },
};

module.exports = nextConfig;
