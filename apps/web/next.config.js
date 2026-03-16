/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable transpiling the shared workspace package
  transpilePackages: [
    '@fithub/shared',
    '@fithub/validation',
    '@fithub/api-client',
    '@fithub/tokens',
  ],
};

module.exports = nextConfig;
