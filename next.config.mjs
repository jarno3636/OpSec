/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { typedRoutes: true, optimizePackageImports: ["viem"] },
  images: { remotePatterns: [] }
};
export default nextConfig;
