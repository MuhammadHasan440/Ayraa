// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure nothing blocks env variables

  env: {
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  },
};

module.exports = nextConfig;