import type { NextConfig } from 'next';
import { getApiBaseUrl } from './src/lib/env';

// Validate at startup/build time even before any feature uses the API client.
getApiBaseUrl();

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
};

export default nextConfig;
