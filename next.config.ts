import type { NextConfig } from "next";

// On GitHub Pages the site lives at https://<user>.github.io/<repo>/, so we set
// basePath at build time. The Actions workflow passes NEXT_PUBLIC_BASE_PATH
// (e.g. "/product-discovery"); locally it's empty and the app runs at "/".
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export", // fully static site — deployable to GitHub Pages
  basePath: basePath || undefined,
  trailingSlash: true, // emit /index.html so Pages serves routes without a server
  images: {
    unoptimized: true, // no image optimization server on a static host
  },
};

export default nextConfig;

