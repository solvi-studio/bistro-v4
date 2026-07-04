import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // For CF Workers, we need to include the pg-cloudflare package in the output file tracing includes. This is because the pg-cloudflare package is not included in the default output file tracing includes, and it is required for the application to run correctly on CF Workers.
  // https://github.com/opennextjs/opennextjs-cloudflare/issues/1214
  outputFileTracingIncludes: {
    "**/*": [
      "./node_modules/pg-cloudflare/dist/**",
      "./node_modules/pg-cloudflare/esm/**",
    ],
  },
};

export default nextConfig;
