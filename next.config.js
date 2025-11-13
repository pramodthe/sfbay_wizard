/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure static export is disabled for Netlify
  output: undefined,
  // Optimize for serverless
  swcMinify: true,
};

module.exports = nextConfig;
