import type { NextConfig } from "next";

// In production the browser calls /api/* on the same site (laot.vercel.app),
// and Vercel forwards it to the Express backend on Render (API_ORIGIN).
// Locally, NEXT_PUBLIC_API_URL points straight at http://localhost:4000/api instead.
const apiOrigin = process.env.API_ORIGIN?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return apiOrigin ? [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }] : [];
  },
};

export default nextConfig;
