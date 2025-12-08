/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly set output mode for Vercel
  output: 'standalone',

  // Ensure environment variables are available
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
  },
};

export default nextConfig;
