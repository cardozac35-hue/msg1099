/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Next.js 14: treat native/heavy server-only packages as external
  experimental: {
    serverComponentsExternalPackages: [
      "sharp",
      "tesseract.js",
      "pdfkit",
      "mongoose",
      "xlsx",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.msgoilfield.com",
      },
      {
        protocol: "https",
        hostname: "msgoilfield.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
