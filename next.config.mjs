/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure environment variables are available at build time
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
    NEXT_PUBLIC_VALID_PASSCODES: process.env.VALID_PASSCODES,
  },
};

export default nextConfig;
