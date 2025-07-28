import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure native dependencies like lightningcss are properly bundled
  serverExternalPackages: ['lightningcss'],
  
  // Alternative webpack configuration as fallback
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark lightningcss as external to prevent bundling issues
      config.externals = config.externals || [];
      config.externals.push({
        'lightningcss': 'commonjs lightningcss'
      });
    }
    return config;
  }
};

export default nextConfig;
