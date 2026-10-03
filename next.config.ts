import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Plan D16: un escudo puede pesar hasta 2 MB (RF-28); el límite por defecto
    // de 1 MB lo rechazaría antes de llegar al caso de uso.
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default nextConfig;
