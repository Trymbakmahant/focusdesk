import type { NextConfig } from "next";

const isStaticExport = process.env.TAURI_BUILD === 'true' || process.env.EXPORT_STATIC === 'true';

const nextConfig: NextConfig = {
  ...(isStaticExport ? { output: "export" } : {}),
};

export default nextConfig;
