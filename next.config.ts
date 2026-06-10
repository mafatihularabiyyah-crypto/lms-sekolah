import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb', // Perbesar batas menjadi 5 Megabyte
    },
  },
};

export default nextConfig;
// (Ganti formatnya dengan module.exports jika file Anda .js biasa)